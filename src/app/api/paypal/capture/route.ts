import { NextResponse } from "next/server";
import { capturePayPalOrder } from "@/lib/paypal";
import { db } from "@/lib/db";
import { sendEmail, orderConfirmationEmail } from "@/lib/email";
import { formatCHF, decimalToNumber } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PayPal redirected the user back; we capture the order and redirect to confirmation.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const orderId = url.searchParams.get("orderId");
  const token = url.searchParams.get("token"); // PayPal Order ID

  if (!orderId || !token) {
    return NextResponse.redirect(new URL("/kasse?error=invalid", req.url));
  }

  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) {
    return NextResponse.redirect(new URL("/kasse?error=notfound", req.url));
  }
  if (order.paymentId !== token) {
    return NextResponse.redirect(new URL("/kasse?error=mismatch", req.url));
  }
  // Bereits bezahlt (z.B. doppelter Redirect/Reload)? Einfach zur Bestellseite.
  if (order.status === "PAID" || order.status === "PROCESSING" || order.status === "SHIPPED" || order.status === "COMPLETED") {
    return NextResponse.redirect(new URL(`/bestellung/${order.orderNumber}?paid=1`, req.url));
  }
  // Nur PENDING-Bestellungen dürfen captured werden — eine bereits stornierte
  // Bestellung (z.B. durch Cleanup) darf den Kunden nicht mehr belasten.
  if (order.status !== "PENDING") {
    return NextResponse.redirect(new URL("/kasse?error=expired", req.url));
  }

  try {
    const result = await capturePayPalOrder(token);
    if (result.status === "COMPLETED") {
      // Betrag gegen die server-seitig berechnete Bestellsumme prüfen.
      const expected = decimalToNumber(order.total).toFixed(2);
      if (result.capturedAmount !== expected || result.capturedCurrency !== order.currency) {
        console.error(
          `[paypal capture] BETRAGS-MISMATCH bei Order ${order.orderNumber}: erwartet ${expected} ${order.currency}, erhalten ${result.capturedAmount} ${result.capturedCurrency}. Manuell prüfen!`
        );
        await db.order.update({
          where: { id: orderId },
          data: { adminNotes: `⚠ PayPal-Zahlbetrag weicht ab (erhalten: ${result.capturedAmount} ${result.capturedCurrency}). Manuell prüfen!` },
        });
        return NextResponse.redirect(new URL("/kasse?error=capture", req.url));
      }

      // Idempotent: Nur aus PENDING heraus auf PAID wechseln.
      const updated = await db.order.updateMany({
        where: { id: orderId, status: "PENDING" },
        data: {
          status: "PAID",
          paymentStatus: "PAID",
          paidAt: new Date(),
          paymentId: result.captureId ?? token,
        },
      });
      if (updated.count === 0) {
        return NextResponse.redirect(new URL(`/bestellung/${order.orderNumber}?paid=1`, req.url));
      }

      const recipientEmail = order.guestEmail ??
        (await db.user.findUnique({ where: { id: order.userId ?? "" }, select: { email: true } }))?.email;

      if (recipientEmail) {
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
          console.error(`[paypal capture] Bestellbestätigung für ${order.orderNumber} konnte nicht gesendet werden:`, emailErr);
        }
      }
      return NextResponse.redirect(new URL(`/bestellung/${order.orderNumber}?paid=1`, req.url));
    }
    return NextResponse.redirect(new URL("/kasse?error=capture", req.url));
  } catch (e) {
    console.error("[paypal capture]", e);
    return NextResponse.redirect(new URL("/kasse?error=capture", req.url));
  }
}
