import Link from "next/link";
import { Package, ShoppingBag, AlertCircle, TrendingUp } from "lucide-react";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCHF, formatDateTime, orderStatusLabel, decimalToNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [productCount, activeProducts, pendingOrders, recentOrders, totalRevenueResult] = await Promise.all([
    db.product.count(),
    db.product.count({ where: { active: true, stockQuantity: { gt: 0 } } }),
    db.order.count({ where: { status: { in: ["PENDING", "PAID", "PROCESSING"] }, deletedAt: null } }),
    db.order.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true, orderNumber: true, status: true, total: true, createdAt: true,
        shippingFirstName: true, shippingLastName: true, guestEmail: true,
        user: { select: { email: true } },
      },
    }),
    db.order.aggregate({
      _sum: { total: true },
      where: { status: { in: ["PAID", "PROCESSING", "SHIPPED", "COMPLETED"] }, deletedAt: null },
    }),
  ]);

  const stats = [
    { label: "Aktive Produkte", value: activeProducts, total: productCount, icon: Package, href: "/admin/produkte" },
    { label: "Offene Bestellungen", value: pendingOrders, icon: AlertCircle, href: "/admin/bestellungen" },
    { label: "Umsatz gesamt", value: formatCHF(decimalToNumber(totalRevenueResult._sum.total)), icon: TrendingUp },
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Übersicht über deinen Shop</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const inner = (
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.total != null && (
                  <p className="text-xs text-muted-foreground mt-1">von {stat.total} insgesamt</p>
                )}
              </CardContent>
            </Card>
          );
          return stat.href ? (
            <Link key={stat.label} href={stat.href}>{inner}</Link>
          ) : (
            <div key={stat.label}>{inner}</div>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Neueste Bestellungen</CardTitle>
          <Link href="/admin/bestellungen" className="text-sm text-primary hover:underline">
            Alle ansehen →
          </Link>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Noch keine Bestellungen.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-2 pr-4 font-medium">Nr.</th>
                    <th className="py-2 pr-4 font-medium">Datum</th>
                    <th className="py-2 pr-4 font-medium">Kunde</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 pl-4 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="border-b last:border-0">
                      <td className="py-3 pr-4">
                        <Link href={`/admin/bestellungen/${o.id}`} className="font-mono text-primary hover:underline">
                          {o.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{formatDateTime(o.createdAt)}</td>
                      <td className="py-3 pr-4">
                        {o.shippingFirstName} {o.shippingLastName}
                        <div className="text-xs text-muted-foreground">{o.user?.email ?? o.guestEmail}</div>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={
                          o.status === "COMPLETED" ? "success" :
                          o.status === "CANCELLED" || o.status === "REFUNDED" ? "destructive" :
                          o.status === "SHIPPED" ? "info" :
                          o.status === "PAID" ? "success" : "warning"
                        }>{orderStatusLabel(o.status)}</Badge>
                      </td>
                      <td className="py-3 pl-4 text-right font-medium">{formatCHF(decimalToNumber(o.total))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShoppingBag className="h-4 w-4" /> Schnellzugriff</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link href="/admin/produkte/neu" className="rounded-lg border p-4 hover:bg-muted/50 transition-colors">
            <div className="font-medium text-sm">+ Produkt anlegen</div>
            <div className="text-xs text-muted-foreground mt-1">Neues Lego-Produkt</div>
          </Link>
          <Link href="/admin/kategorien" className="rounded-lg border p-4 hover:bg-muted/50 transition-colors">
            <div className="font-medium text-sm">Kategorien</div>
            <div className="text-xs text-muted-foreground mt-1">Verwalten</div>
          </Link>
          <Link href="/admin/versand" className="rounded-lg border p-4 hover:bg-muted/50 transition-colors">
            <div className="font-medium text-sm">Versand-Regeln</div>
            <div className="text-xs text-muted-foreground mt-1">Methoden &amp; Regeln</div>
          </Link>
          <Link href="/admin/einstellungen" className="rounded-lg border p-4 hover:bg-muted/50 transition-colors">
            <div className="font-medium text-sm">Shop-Einstellungen</div>
            <div className="text-xs text-muted-foreground mt-1">Allgemein</div>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
