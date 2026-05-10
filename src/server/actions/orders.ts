"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/admin";
import { orderUpdateSchema } from "@/lib/validation";
import { sendEmail, shippingNotificationEmail } from "@/lib/email";
import { formatCHF, decimalToNumber } from "@/lib/utils";
import type { ActionResult } from "@/server/actions/auth";

export async function updateOrder(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const raw = {
      status: formData.get("status"),
      trackingNumber: formData.get("trackingNumber") || null,
      trackingProvider: formData.get("trackingProvider") || null,
      trackingUrl: formData.get("trackingUrl") || null,
      adminNotes: formData.get("adminNotes") || null,
    };
    const parsed = orderUpdateSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: "Eingaben prüfen.", fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
    }

    const order = await db.order.findUnique({
      where: { id },
      include: { items: true, user: { select: { email: true } } },
    });
    if (!order) return { ok: false, error: "Nicht gefunden." };

    const newStatus = parsed.data.status;
    const wasShipped = order.status === "SHIPPED" || order.status === "COMPLETED";
    const willBeShipped = newStatus === "SHIPPED" || newStatus === "COMPLETED";

    const updates: Record<string, unknown> = {
      status: newStatus,
      trackingNumber: parsed.data.trackingNumber,
      trackingProvider: parsed.data.trackingProvider,
      trackingUrl: parsed.data.trackingUrl || null,
      adminNotes: parsed.data.adminNotes,
    };
    if (newStatus === "SHIPPED" && !order.shippedAt) updates.shippedAt = new Date();
    if (newStatus === "COMPLETED" && !order.completedAt) updates.completedAt = new Date();
    if (newStatus === "CANCELLED" && !order.cancelledAt) updates.cancelledAt = new Date();

    // Bei Cancel: Bestand wieder hochzählen
    if (newStatus === "CANCELLED" && order.status !== "CANCELLED") {
      await db.$transaction(async (tx) => {
        for (const item of order.items) {
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stockQuantity: { increment: item.quantity } },
            });
          }
        }
        await tx.order.update({ where: { id }, data: updates });
      });
    } else {
      await db.order.update({ where: { id }, data: updates });
    }

    // Versand-Email senden, wenn Status wechselt zu SHIPPED
    if (!wasShipped && willBeShipped) {
      const recipientEmail = order.user?.email ?? order.guestEmail;
      if (recipientEmail && newStatus === "SHIPPED") {
        await sendEmail({
          to: recipientEmail,
          subject: `Deine Bestellung ${order.orderNumber} ist unterwegs`,
          react: shippingNotificationEmail({
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
            trackingNumber: parsed.data.trackingNumber ?? undefined,
            trackingProvider: parsed.data.trackingProvider ?? undefined,
            trackingUrl: parsed.data.trackingUrl ?? undefined,
          }),
        });
      }
    }

    await logAudit({
      userId: admin.id,
      action: "ORDER_UPDATED",
      entity: "Order",
      entityId: id,
      metadata: { newStatus },
    });
    revalidatePath("/admin/bestellungen");
    revalidatePath(`/admin/bestellungen/${id}`);
    revalidatePath(`/bestellung/${order.orderNumber}`);
    return { ok: true };
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return { ok: false, error: "Verboten" };
    console.error(e);
    return { ok: false, error: "Fehler beim Speichern." };
  }
}
