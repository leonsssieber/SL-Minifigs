export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Package, Truck } from "lucide-react";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCHF, formatDateTime, orderStatusLabel, decimalToNumber } from "@/lib/utils";

export const metadata = {
  title: "Bestellung",
  robots: { index: false, follow: false },
};

export default async function OrderTrackingPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const { orderNumber } = await params;
  const sp = await searchParams;

  const order = await db.order.findUnique({
    where: { orderNumber },
    include: { items: true, shippingMethod: true },
  });
  if (!order) notFound();

  const subtotal = decimalToNumber(order.subtotal);
  const shipping = decimalToNumber(order.shippingCost);
  const total = decimalToNumber(order.total);

  // Dank-Banner nur zeigen, wenn die Zahlung tatsächlich bestätigt ist —
  // nicht bloss weil ?paid=1 in der URL steht.
  const isActuallyPaid = ["PAID", "PROCESSING", "SHIPPED", "COMPLETED"].includes(order.status);

  return (
    <div className="container py-12 max-w-2xl">
      {sp.paid && isActuallyPaid && (
        <div className="mb-6 rounded-xl bg-green-50 border border-green-200 p-6 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-green-900">Vielen Dank!</h1>
          <p className="text-green-800 text-sm mt-1">Deine Bestellung ist eingegangen.</p>
        </div>
      )}
      {sp.paid && !isActuallyPaid && order.status === "PENDING" && (
        <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 p-6 text-center">
          <h1 className="text-xl font-bold text-amber-900">Zahlung wird bestätigt…</h1>
          <p className="text-amber-800 text-sm mt-1">
            Das dauert in der Regel nur wenige Sekunden. Lade die Seite gleich neu —
            du erhältst zusätzlich eine Bestätigung per E-Mail.
          </p>
        </div>
      )}

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold">Bestellung {order.orderNumber}</h2>
              <p className="text-sm text-muted-foreground">{formatDateTime(order.createdAt)}</p>
            </div>
            <Badge variant={
              order.status === "COMPLETED" ? "success" :
              order.status === "CANCELLED" || order.status === "REFUNDED" ? "destructive" :
              order.status === "SHIPPED" ? "info" :
              order.status === "PAID" || order.status === "PROCESSING" ? "success" : "warning"
            }>{orderStatusLabel(order.status)}</Badge>
          </div>

          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              {order.status === "SHIPPED" || order.status === "COMPLETED"
                ? <Truck className="h-4 w-4" />
                : <Package className="h-4 w-4" />}
              <span>{order.shippingMethodName}</span>
            </div>
            {order.trackingNumber && (
              <div className="text-sm">
                <span className="text-muted-foreground">Tracking-Nr:</span>{" "}
                {order.trackingUrl ? (
                  <a href={order.trackingUrl} target="_blank" rel="noopener" className="font-mono text-primary hover:underline">
                    {order.trackingNumber}
                  </a>
                ) : (
                  <span className="font-mono">{order.trackingNumber}</span>
                )}
                {order.trackingProvider && <span className="text-muted-foreground"> ({order.trackingProvider})</span>}
              </div>
            )}
            {order.shippedAt && (
              <div className="text-xs text-muted-foreground">Versendet am {formatDateTime(order.shippedAt)}</div>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Bestellte Artikel</h3>
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm border-b last:border-0 py-2">
                <div>
                  <div>{item.productName}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.quantity} × {formatCHF(decimalToNumber(item.unitPrice))}
                  </div>
                </div>
                <div className="font-medium">{formatCHF(decimalToNumber(item.lineTotal))}</div>
              </div>
            ))}
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Zwischensumme</span>
              <span>{formatCHF(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Versand</span>
              <span>{formatCHF(shipping)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total</span>
              <span>{formatCHF(total)}</span>
            </div>
          </div>

          <div className="space-y-1 text-sm">
            <h3 className="font-semibold">Lieferadresse</h3>
            <div className="text-muted-foreground whitespace-pre-line">
              {[
                `${order.shippingFirstName} ${order.shippingLastName}`,
                order.shippingCompany,
                order.shippingStreet,
                order.shippingStreet2,
                `${order.shippingZip} ${order.shippingCity}`,
                order.shippingCountry,
              ].filter(Boolean).join("\n")}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 text-center">
        <Link href="/produkte" className="text-primary hover:underline">Weiter einkaufen →</Link>
      </div>
    </div>
  );
}