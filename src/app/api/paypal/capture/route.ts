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

  try {
    const result = await capturePayPalOrder(token);
    if (result.status === "COMPLETED") {
      await db.order.update({
        where: { id: orderId },
        data: {
          status: "PAID",
          paymentStatus: "PAID",
          paidAt: new Date(),
          paymentId: result.captureId ?? token,
        },
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
      return NextResponse.redirect(new URL(`/bestellung/${order.orderNumber}?paid=1`, req.url));
    }
    return NextResponse.redirect(new URL("/kasse?error=capture", req.url));
  } catch (e) {
    console.error("[paypal capture]", e);
    return NextResponse.redirect(new URL("/kasse?error=capture", req.url));
  }
}
