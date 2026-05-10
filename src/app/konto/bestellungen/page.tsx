export const dynamic = "force-dynamic";

import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCHF, formatDate, orderStatusLabel, decimalToNumber } from "@/lib/utils";

export default async function MyOrdersPage() {
  const session = await auth();
  if (!session?.user) return null;

  const orders = await db.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
  });

  if (orders.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground mb-4">Du hast noch keine Bestellungen.</p>
        <Link href="/produkte" className="text-primary hover:underline">Zu den Produkten →</Link>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <Card key={o.id} className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Link href={`/bestellung/${o.orderNumber}`} className="font-mono font-medium hover:underline">{o.orderNumber}</Link>
              <div className="text-xs text-muted-foreground">{formatDate(o.createdAt)} · {o._count.items} Artikel</div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={
                o.status === "COMPLETED" ? "success" :
                o.status === "CANCELLED" || o.status === "REFUNDED" ? "destructive" :
                o.status === "SHIPPED" ? "info" :
                o.status === "PAID" || o.status === "PROCESSING" ? "success" : "warning"
              }>{orderStatusLabel(o.status)}</Badge>
              <span className="font-semibold">{formatCHF(decimalToNumber(o.total))}</span>
              <Link href={`/bestellung/${o.orderNumber}`} className="text-sm text-primary hover:underline">Details</Link>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}