import { db } from "@/lib/db";

/**
 * Storniert eine PENDING-Bestellung und gibt den reservierten Bestand zurück.
 * Idempotent: Der Statuswechsel PENDING→CANCELLED passiert per updateMany mit
 * Status-Guard — nur wer den Wechsel "gewinnt", inkrementiert den Bestand.
 * Doppelte Aufrufe (Webhook + Cleanup + Admin) können den Bestand daher nie
 * mehrfach zurückbuchen.
 */
export async function cancelPendingOrderAndRestock(
  orderId: string,
  paymentStatus: "FAILED" | "PENDING" = "FAILED"
): Promise<boolean> {
  return db.$transaction(async (tx) => {
    const res = await tx.order.updateMany({
      where: { id: orderId, status: "PENDING" },
      data: { status: "CANCELLED", paymentStatus, cancelledAt: new Date() },
    });
    if (res.count === 0) return false;

    const items = await tx.orderItem.findMany({
      where: { orderId },
      select: { productId: true, quantity: true },
    });
    for (const item of items) {
      if (item.productId) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: item.quantity } },
        });
      }
    }
    return true;
  });
}

/**
 * Räumt verwaiste PENDING-Bestellungen auf (z.B. PayPal-Abbrüche ohne
 * Rückkehr zum Shop), damit reservierter Bestand nicht ewig blockiert bleibt.
 * Wird lazy beim Checkout aufgerufen — kein Cron nötig.
 */
const EXPIRY_HOURS = 24;

export async function releaseExpiredPendingOrders(): Promise<void> {
  const cutoff = new Date(Date.now() - EXPIRY_HOURS * 60 * 60 * 1000);
  const expired = await db.order.findMany({
    where: { status: "PENDING", createdAt: { lt: cutoff } },
    select: { id: true },
    take: 20,
  });
  for (const o of expired) {
    try {
      await cancelPendingOrderAndRestock(o.id);
    } catch (err) {
      console.error(`[order-cleanup] Konnte Bestellung ${o.id} nicht freigeben:`, err);
    }
  }
}
