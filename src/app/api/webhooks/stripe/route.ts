import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { sendEmail, orderConfirmationEmail } from "@/lib/email";
import { formatCHF, decimalToNumber } from "@/lib/utils";
import { cancelPendingOrderAndRestock } from "@/lib/order-stock";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret missing" }, { status: 500 });
  }

  const sig = (await headers()).get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  const body = await req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[stripe webhook] signature verify failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const orderId = session.metadata?.orderId;
        if (!orderId) break;

        // Nur als bezahlt markieren, wenn Stripe die Zahlung wirklich
        // eingezogen hat (bei async Zahlarten kann completed vor paid kommen).
        if (session.payment_status !== "paid") {
          console.warn(`[stripe webhook] Session completed aber payment_status=${session.payment_status} — Order ${orderId} bleibt PENDING.`);
          break;
        }

        const existing = await db.order.findUnique({ where: { id: orderId } });
        if (!existing) break;

        // Betrag gegen die server-seitig berechnete Bestellsumme prüfen.
        const expectedCents = Math.round(decimalToNumber(existing.total) * 100);
        if (session.amount_total !== expectedCents || session.currency?.toUpperCase() !== existing.currency) {
          console.error(
            `[stripe webhook] BETRAGS-MISMATCH bei Order ${existing.orderNumber}: erwartet ${expectedCents} ${existing.currency}, erhalten ${session.amount_total} ${session.currency}. Order bleibt unbestätigt — manuell prüfen!`
          );
          await db.order.update({
            where: { id: orderId },
            data: { adminNotes: `⚠ Stripe-Zahlbetrag weicht ab (erhalten: ${session.amount_total} ${session.currency}). Manuell prüfen!` },
          });
          break;
        }

        // Idempotent & nur aus PENDING heraus: verhindert, dass eine bereits
        // stornierte/abgeschlossene Bestellung überschrieben wird.
        const res = await db.order.updateMany({
          where: { id: orderId, status: "PENDING" },
          data: {
            status: "PAID",
            paymentStatus: "PAID",
            paidAt: new Date(),
            paymentId: typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.id,
          },
        });
        if (res.count === 0) {
          console.warn(`[stripe webhook] Order ${existing.orderNumber} ist nicht mehr PENDING (Status: ${existing.status}) — keine Änderung.`);
          break;
        }
        const order = await db.order.findUniqueOrThrow({
          where: { id: orderId },
          include: { items: true },
        });

        const recipientEmail = order.guestEmail ??
          (await db.user.findUnique({ where: { id: order.userId ?? "" }, select: { email: true } }))?.email;
        if (recipientEmail) {
          // Email-Fehler dürfen den Webhook nicht fehlschlagen lassen —
          // die Bestellung ist bereits korrekt als bezahlt markiert.
          try {
            await sendEmail({
              to: recipientEmail,
              subject: `Bestellbestätigung ${order.orderNumber}`,
              react: orderConfirmationEmail({
                orderNumber: order.orderNumber,
                customerName: `${order.shippingFirstName} ${order.shippingLastName}`,
                items: order.items.map((i) => ({
                  name: i.productName,
                  quantity: i.quantity,
                  total: formatCHF(decimalToNumber(i.lineTotal)),
                })),
                subtotal: formatCHF(decimalToNumber(order.subtotal)),
                shipping: formatCHF(decimalToNumber(order.shippingCost)),
                total: formatCHF(decimalToNumber(order.total)),
                shippingAddress: [
                  `${order.shippingFirstName} ${order.shippingLastName}`,
                  order.shippingCompany,
                  order.shippingStreet,
                  order.shippingStreet2,
                  `${order.shippingZip} ${order.shippingCity}`,
                  order.shippingCountry,
                ].filter(Boolean).join("\n"),
              }),
            });
          } catch (emailErr) {
            console.error(`[stripe webhook] Bestellbestätigung für ${order.orderNumber} konnte nicht gesendet werden:`, emailErr);
          }
        }
        break;
      }
      case "checkout.session.expired": {
        // WICHTIG: Nur bei abgelaufener Session stornieren. Ein einzelner
        // fehlgeschlagener Zahlungsversuch (payment_intent.payment_failed)
        // darf NICHT stornieren — der Kunde kann es in derselben Session
        // mit einer anderen Karte erneut versuchen.
        const data = event.data.object;
        const orderId = data.metadata?.orderId;
        if (!orderId) break;
        await cancelPendingOrderAndRestock(orderId);
        break;
      }
    }
  } catch (err) {
    console.error("[stripe webhook] handler error:", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
