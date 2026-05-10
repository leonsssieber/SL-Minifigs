import Link from "next/link";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatCHF, formatDateTime, orderStatusLabel, decimalToNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bestellungen" };

const STATUS_FILTERS = [
  { key: "all", label: "Alle" },
  { key: "PENDING", label: "Offen" },
  { key: "PAID", label: "Bezahlt" },
  { key: "PROCESSING", label: "In Bearbeitung" },
  { key: "SHIPPED", label: "Versendet" },
  { key: "COMPLETED", label: "Abgeschlossen" },
  { key: "CANCELLED", label: "Storniert" },
];

export default async function OrdersAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const where: Record<string, unknown> = {};
  if (sp.status && sp.status !== "all") where.status = sp.status;
  if (sp.q) {
    where.OR = [
      { orderNumber: { contains: sp.q, mode: "insensitive" } },
      { shippingLastName: { contains: sp.q, mode: "insensitive" } },
      { shippingFirstName: { contains: sp.q, mode: "insensitive" } },
      { guestEmail: { contains: sp.q, mode: "insensitive" } },
    ];
  }

  const orders = await db.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      _count: { select: { items: true } },
      user: { select: { email: true } },
    },
  });

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bestellungen</h1>
        <p className="text-muted-foreground">{orders.length} Bestellungen</p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {STATUS_FILTERS.map((f) => {
          const active = (sp.status ?? "all") === f.key;
          return (
            <Link
              key={f.key}
              href={f.key === "all" ? "/admin/bestellungen" : `/admin/bestellungen?status=${f.key}`}
              className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                active ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
        <form className="ml-auto">
          <input
            name="q"
            type="search"
            placeholder="Suchen…"
            defaultValue={sp.q ?? ""}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm w-64"
          />
        </form>
      </div>

      <Card className="overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">Keine Bestellungen.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Nr.</th>
                  <th className="px-4 py-3 font-medium">Datum</th>
                  <th className="px-4 py-3 font-medium">Kunde</th>
                  <th className="px-4 py-3 font-medium text-right">Items</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Tracking</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link href={`/admin/bestellungen/${o.id}`} className="font-mono text-primary hover:underline">{o.orderNumber}</Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(o.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{o.shippingFirstName} {o.shippingLastName}</div>
                      <div className="text-xs text-muted-foreground">{o.user?.email ?? o.guestEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-right">{o._count.items}</td>
                    <td className="px-4 py-3">
                      <Badge variant={
                        o.status === "COMPLETED" ? "success" :
                        o.status === "CANCELLED" || o.status === "REFUNDED" ? "destructive" :
                        o.status === "SHIPPED" ? "info" :
                        o.status === "PAID" || o.status === "PROCESSING" ? "success" : "warning"
                      }>{orderStatusLabel(o.status)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono">{o.trackingNumber ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCHF(decimalToNumber(o.total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
