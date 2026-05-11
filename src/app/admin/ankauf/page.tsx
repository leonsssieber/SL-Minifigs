export const dynamic = "force-dynamic";

import Link from "next/link";
import { db } from "@/lib/db";
import { formatCHF, formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Ankauf-Anfragen" };

const statusConfig: Record<string, { label: string; color: "success" | "warning" | "destructive" | "info" | "secondary" }> = {
  PENDING: { label: "Ausstehend", color: "warning" },
  ACCEPTED: { label: "Angenommen", color: "success" },
  COUNTER_OFFER: { label: "Gegenangebot", color: "info" },
  REJECTED: { label: "Abgelehnt", color: "destructive" },
  WAITING_SHIPMENT: { label: "Warte auf Versand", color: "warning" },
  SHIPPED: { label: "Versandt", color: "info" },
  VERIFYING: { label: "In Prüfung", color: "warning" },
  COMPLETED: { label: "Abgeschlossen", color: "success" },
  RETURNED: { label: "Zurückgesandt", color: "secondary" },
};

export default async function AdminAnkaufPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: filterStatus } = await searchParams;

  const requests = await db.ankaufRequest.findMany({
    where: filterStatus ? { status: filterStatus } : undefined,
    orderBy: { createdAt: "desc" },
    include: { images: { take: 1 } },
  });

  const counts = await db.ankaufRequest.groupBy({
    by: ["status"],
    _count: true,
  });
  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count]));

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ankauf-Anfragen</h1>
        <p className="text-muted-foreground">{requests.length} Anfragen</p>
      </div>

      {/* Status-Filter */}
      <div className="flex flex-wrap gap-2">
        <Link href="/admin/ankauf">
          <Button variant={!filterStatus ? "default" : "outline"} size="sm">
            Alle ({Object.values(countMap).reduce((a, b) => a + b, 0)})
          </Button>
        </Link>
        {Object.entries(statusConfig).map(([s, cfg]) => (
          <Link key={s} href={`/admin/ankauf?status=${s}`}>
            <Button variant={filterStatus === s ? "default" : "outline"} size="sm">
              {cfg.label} {countMap[s] ? `(${countMap[s]})` : ""}
            </Button>
          </Link>
        ))}
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        {requests.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">Keine Anfragen vorhanden.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left bg-muted/50">
                <tr>
                  <th className="py-3 px-4 font-medium w-12"></th>
                  <th className="py-3 px-4 font-medium">Name / Email</th>
                  <th className="py-3 px-4 font-medium">Wunschpreis</th>
                  <th className="py-3 px-4 font-medium">Angebot</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Datum</th>
                  <th className="py-3 px-4 font-medium w-28"></th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => {
                  const cfg = statusConfig[r.status] ?? { label: r.status, color: "secondary" as const };
                  const img = r.images[0];
                  return (
                    <tr key={r.id} className="border-t hover:bg-muted/30">
                      <td className="py-2 px-4">
                        {img ? (
                          <div className="relative h-10 w-10 rounded-md overflow-hidden bg-muted">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.url} alt="" className="object-cover w-full h-full" />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-muted" />
                        )}
                      </td>
                      <td className="py-2 px-4">
                        <div className="font-medium">{r.name}</div>
                        <div className="text-xs text-muted-foreground">{r.email}</div>
                      </td>
                      <td className="py-2 px-4 font-medium">{formatCHF(Number(r.desiredPrice))}</td>
                      <td className="py-2 px-4">
                        {r.offeredPrice ? formatCHF(Number(r.offeredPrice)) : "—"}
                      </td>
                      <td className="py-2 px-4">
                        <Badge variant={cfg.color}>{cfg.label}</Badge>
                      </td>
                      <td className="py-2 px-4 text-muted-foreground text-xs">
                        {formatDateTime(r.createdAt)}
                      </td>
                      <td className="py-2 px-4">
                        <Link href={`/admin/ankauf/${r.id}`}>
                          <Button variant="outline" size="sm">Anzeigen</Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
