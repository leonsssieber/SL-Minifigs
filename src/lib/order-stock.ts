import { db } from "@/lib/db";

/**
 * Storniert eine PENDING-Bestellung. Da der Bestand erst bei bestätigter
 * Zahlung abgezogen wird, muss hier KEIN Bestand zurückgebucht werden.
 * Idempotent über den Status-Guard (nur PENDING → CANCELLED).
 */
export async function cancelPendingOrder(
  orderId: string,
  paymentStatus: "FAILED" | "PENDING" = "FAILED"
): Promise<boolean> {
  const res = await db.order.updateMany({
    where: { id: orderId, status: "PENDING" },
    data: { status: "CANCELLED", paymentStatus, cancelledAt: new Date() },
  });
  return res.count > 0;
}

/**
 * Bucht den Bestand für eine soeben bezahlte Bestellung atomar ab.
 *
 * WICHTIG: Muss GENAU EINMAL pro Bestellung aufgerufen werden — nämlich von
 * dem Aufrufer, der den Status-Wechsel PENDING → PAID „gewonnen" hat
 * (Stripe-Webhook bzw. PayPal-Capture nutzen dafür updateMany mit Guard).
 * Dadurch ist der Abzug idempotent.
 *
 * Der Guard `stockQuantity >= quantity` verhindert negativen Bestand. Gibt die
 * Namen der Artikel zurück, für die der Bestand NICHT mehr reichte (z.B. weil
 * ein Unikat zwischenzeitlich anderweitig verkauft wurde) — der Aufrufer
 * markiert die Bestellung dann zur manuellen Prüfung/Erstattung.
 */
export async function commitStockForPaidOrder(
  orderId: string
): Promise<{ ok: boolean; insufficient: string[] }> {
  return db.$transaction(async (tx) => {
    const items = await tx.orderItem.findMany({
      where: { orderId },
      select: { productId: true, quantity: true, productName: true },
    });
    const insufficient: string[] = [];
    for (const item of items) {
      if (!item.productId) continue;
      const res = await tx.product.updateMany({
        where: { id: item.productId, stockQuantity: { gte: item.quantity } },
        data: { stockQuantity: { decrement: item.quantity } },
      });
      if (res.count === 0) insufficient.push(item.productName);
    }
    return { ok: insufficient.length === 0, insufficient };
  });
}

/**
 * Bucht den Bestand einer bereits BEZAHLTEN Bestellung wieder zurück
 * (z.B. wenn ein Admin sie storniert/erstattet). Für PENDING-Bestellungen
 * NICHT aufrufen — dort wurde nie etwas abgezogen.
 */
export async function restockPaidOrder(orderId: string): Promise<void> {
  await db.$transaction(async (tx) => {
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
  });
}

/**
 * Räumt verwaiste PENDING-Bestellungen auf (abgebrochene/nicht bezahlte
 * Checkouts), damit die Bestellliste sauber bleibt. Kein Bestand betroffen,
 * da bei PENDING noch nichts abgezogen wurde. Wird lazy beim Checkout
 * aufgerufen — kein Cron nötig.
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
      await cancelPendingOrder(o.id);
    } catch (err) {
      console.error(`[order-cleanup] Konnte Bestellung ${o.id} nicht stornieren:`, err);
    }
  }
}
