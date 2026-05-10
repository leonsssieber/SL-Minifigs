import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { sendEmail, orderConfirmationEmail } from "@/lib/email";
import { formatCHF, decimalToNumber } from "@/lib/utils";

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
        const order = await db.order.update({
          where: { id: orderId },
          data: {
            status: "PAID",
            paymentStatus: "PAID",
            paidAt: new Date(),
            paymentId: typeof session.payment_intent === "string"
              ? session.payment_intent
              : (session.payment_intent?.id ?? session.id),
          },
          include: { items: true },
        });

        const recipientEmail = order.guestEmail ??
          (await db.user.findUnique({ where: { id: order.userId ?? "" }, select: { email: true } }))?.email;
        if (recipientEmail) {
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
        }
        break;
      }
      case "checkout.session.expired":
      case "payment_intent.payment_failed": {
        const data = event.data.object;
        const orderId = data.metadata?.orderId;
        if (!orderId) break;
        const order = await db.order.findUnique({
          where: { id: orderId },
          include: { items: true },
        });
        if (order && order.status === "PENDING") {
          // Bestand wieder freigeben
          await db.$transaction(async (tx) => {
            for (const item of order.items) {
              if (item.productId) {
                await tx.product.update({
                  where: { id: item.productId },
                  data: { stockQuantity: { increment: item.quantity } },
                });
              }
            }
            await tx.order.update({
              where: { id: orderId },
              data: { status: "CANCELLED", paymentStatus: "FAILED", cancelledAt: new Date() },
            });
          });
        }
        break;
      }
    }
  } catch (err) {
    console.error("[stripe webhook] handler error:", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
