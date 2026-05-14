export const dynamic = "force-dynamic";

import Link from "next/link";
import { Trash2, ShoppingBag, ArrowLeftRight } from "lucide-react";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCHF, formatDateTime, orderStatusLabel, decimalToNumber } from "@/lib/utils";
import { ConfirmActionButton } from "@/components/admin/confirm-delete-button";
import { restoreOrderAction, hardDeleteOrderAction } from "@/server/actions/orders";
import { restoreAnkaufAction, hardDeleteAnkaufAction } from "@/server/actions/ankauf";

export const metadata = { title: "Papierkorb" };

const ankaufStatusLabel: Record<string, string> = {
  PENDING: "Ausstehend",
  ACCEPTED: "Angenommen",
  COUNTER_OFFER: "Gegenangebot",
  REJECTED: "Abgelehnt",
  WAITING_SHIPMENT: "Warte auf Versand",
  SHIPPED: "Versandt",
  VERIFYING: "In Prüfung",
  COMPLETED: "Abgeschlossen",
  RETURNED: "Zurückgesandt",
};

export default async function PapierkorbPage() {
  const [deletedOrders, deletedAnkauf] = await Promise.all([
    db.order.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
      take: 100,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        deletedAt: true,
        shippingFirstName: true,
        shippingLastName: true,
        guestEmail: true,
        user: { select: { email: true } },
      },
    }),
    db.ankaufRequest.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
      take: 100,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        desiredPrice: true,
        createdAt: true,
        deletedAt: true,
      },
    }),
  ]);

  return (
    <div className="p-8 space-y-8 max-w-6xl">
      <div className="flex items-center gap-3">
        <Trash2 className="h-7 w-7 text-muted-foreground" />
        <div>
          <h1 className="text-3xl font-bold">Papierkorb</h1>
          <p className="text-muted-foreground">
            Gelöschte Einträge — hier wiederherstellen oder endgültig löschen.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Bestellungen ({deletedOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {deletedOrders.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Keine gelöschten Bestellungen.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Nr.</th>
                    <th className="px-4 py-3 font-medium">Kunde</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Total</th>
                    <th className="px-4 py-3 font-medium">Gelöscht</th>
                    <th className="px-4 py-3 font-medium text-right">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedOrders.map((o) => (
                    <tr key={o.id} className="border-t">
                      <td className="px-4 py-3 font-mono">{o.orderNumber}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{o.shippingFirstName} {o.shippingLastName}</div>
                        <div className="text-xs text-muted-foreground">{o.user?.email ?? o.guestEmail}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">{orderStatusLabel(o.status)}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{formatCHF(decimalToNumber(o.total))}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {o.deletedAt ? formatDateTime(o.deletedAt) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <ConfirmActionButton
                            variant="restore"
                            id={o.id}
                            action={restoreOrderAction}
                            size="sm"
                          />
                          <ConfirmActionButton
                            variant="hard"
                            id={o.id}
                            action={hardDeleteOrderAction}
                            size="sm"
                          />
                        </div>
                      </td>
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
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Ankauf-Anfragen ({deletedAnkauf.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {deletedAnkauf.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Keine gelöschten Ankauf-Anfragen.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name / Email</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Wunschpreis</th>
                    <th className="px-4 py-3 font-medium">Erstellt</th>
                    <th className="px-4 py-3 font-medium">Gelöscht</th>
                    <th className="px-4 py-3 font-medium text-right">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedAnkauf.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="px-4 py-3">
                        <div className="font-medium">{r.name}</div>
                        <div className="text-xs text-muted-foreground">{r.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">{ankaufStatusLabel[r.status] ?? r.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{formatCHF(Number(r.desiredPrice))}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {r.deletedAt ? formatDateTime(r.deletedAt) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <ConfirmActionButton
                            variant="restore"
                            id={r.id}
                            action={restoreAnkaufAction}
                            size="sm"
                          />
                          <ConfirmActionButton
                            variant="hard"
                            id={r.id}
                            action={hardDeleteAnkaufAction}
                            size="sm"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
