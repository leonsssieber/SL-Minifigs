import Link from "next/link";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCHF, decimalToNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kunden" };

export default async function AdminCustomersPage() {
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      orders: { select: { total: true, status: true } },
      _count: { select: { orders: true } },
    },
  });

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Kunden</h1>
        <p className="text-muted-foreground">{users.length} registrierte Kunden</p>
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Registriert</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Bestellungen</th>
              <th className="px-4 py-3 font-medium text-right">Umsatz</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const total = u.orders
                .filter((o) => ["PAID", "PROCESSING", "SHIPPED", "COMPLETED"].includes(o.status))
                .reduce((s, o) => s + decimalToNumber(o.total), 0);
              return (
                <tr key={u.id} className="border-t">
                  <td className="px-4 py-3">
                    {u.name ?? "—"}
                    {u.isAdmin && <Badge variant="warning" className="ml-2 text-[10px]">Admin</Badge>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    {u.emailVerified
                      ? <Badge variant="success">Verifiziert</Badge>
                      : <Badge variant="warning">Unverifiziert</Badge>}
                  </td>
                  <td className="px-4 py-3 text-right">{u._count.orders}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCHF(total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
