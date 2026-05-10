export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileDown } from "lucide-react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCHF, formatDateTime, orderStatusLabel, conditionLabel, decimalToNumber } from "@/lib/utils";
import { OrderEditForm } from "./order-edit-form";

export const metadata = { title: "Bestellung" };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: true,
      shippingMethod: true,
      user: { select: { email: true, name: true } },
    },
  });
  if (!order) notFound();

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/bestellungen">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-mono">{order.orderNumber}</h1>
            <p className="text-sm text-muted-foreground">{formatDateTime(order.createdAt)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/api/orders/${order.id}/invoice.pdf`} target="_blank">
            <Button variant="outline" className="gap-2"><FileDown className="h-4 w-4" />Rechnung (PDF)</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Status
                <Badge variant={
                  order.status === "COMPLETED" ? "success" :
                  order.status === "CANCELLED" || order.status === "REFUNDED" ? "destructive" :
                  order.status === "SHIPPED" ? "info" :
                  order.status === "PAID" || order.status === "PROCESSING" ? "success" : "warning"
                }>{orderStatusLabel(order.status)}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OrderEditForm
                orderId={order.id}
                defaults={{
                  status: order.status,
                  trackingNumber: order.trackingNumber,
                  trackingProvider: order.trackingProvider,
                  trackingUrl: order.trackingUrl,
                  adminNotes: order.adminNotes,
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Artikel ({order.items.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-4 py-2 font-medium">Produkt</th>
                    <th className="px-4 py-2 font-medium">Zustand</th>
                    <th className="px-4 py-2 font-medium text-right">Menge</th>
                    <th className="px-4 py-2 font-medium text-right">Einzelpreis</th>
                    <th className="px-4 py-2 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((it) => (
                    <tr key={it.id} className="border-t">
                      <td className="px-4 py-2">
                        <div className="font-medium">{it.productName}</div>
                        {it.productSku && <div className="text-xs text-muted-foreground font-mono">{it.productSku}</div>}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{conditionLabel(it.condition)}</td>
                      <td className="px-4 py-2 text-right">{it.quantity}</td>
                      <td className="px-4 py-2 text-right">{formatCHF(decimalToNumber(it.unitPrice))}</td>
                      <td className="px-4 py-2 text-right font-medium">{formatCHF(decimalToNumber(it.lineTotal))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t">
                    <td colSpan={4} className="px-4 py-2 text-right text-muted-foreground">Zwischensumme</td>
                    <td className="px-4 py-2 text-right">{formatCHF(decimalToNumber(order.subtotal))}</td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="px-4 py-2 text-right text-muted-foreground">Versand: {order.shippingMethodName}</td>
                    <td className="px-4 py-2 text-right">{formatCHF(decimalToNumber(order.shippingCost))}</td>
                  </tr>
                  <tr className="border-t font-bold">
                    <td colSpan={4} className="px-4 py-3 text-right">Total</td>
                    <td className="px-4 py-3 text-right">{formatCHF(decimalToNumber(order.total))}</td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>

          {order.customerNotes && (
            <Card>
              <CardHeader><CardTitle>Kunden-Notiz</CardTitle></CardHeader>
              <CardContent><p className="text-sm whitespace-pre-line">{order.customerNotes}</p></CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Kunde</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="font-medium">{order.shippingFirstName} {order.shippingLastName}</div>
              <div className="text-muted-foreground">{order.user?.email ?? order.guestEmail}</div>
              {order.user ? (
                <Badge variant="info">Registriert</Badge>
              ) : (
                <Badge variant="secondary">Gast</Badge>
              )}
              {order.shippingPhone && <div className="text-muted-foreground">{order.shippingPhone}</div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Lieferadresse</CardTitle></CardHeader>
            <CardContent className="text-sm whitespace-pre-line">
              {[
                `${order.shippingFirstName} ${order.shippingLastName}`,
                order.shippingCompany,
                order.shippingStreet,
                order.shippingStreet2,
                `${order.shippingZip} ${order.shippingCity}`,
                order.shippingCountry,
              ].filter(Boolean).join("\n")}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Bezahlung</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-1">
              <div><span className="text-muted-foreground">Provider:</span> {order.paymentProvider}</div>
              <div><span className="text-muted-foreground">Status:</span> {order.paymentStatus}</div>
              {order.paidAt && <div className="text-xs text-muted-foreground">Bezahlt: {formatDateTime(order.paidAt)}</div>}
              {order.paymentId && <div className="text-xs font-mono text-muted-foreground break-all">{order.paymentId}</div>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}