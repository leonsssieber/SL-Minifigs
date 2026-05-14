export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { formatCHF, formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminRespondAnkauf, softDeleteAnkaufAction } from "@/server/actions/ankauf";
import { ankaufStatusValues } from "@/lib/validation";
import { ConfirmActionButton } from "@/components/admin/confirm-delete-button";

export const metadata = { title: "Ankauf-Anfrage" };

const statusLabels: Record<string, string> = {
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

const shippingLabels: Record<string, string> = {
  brief: "Normaler Brief",
  einschreiben: "Einschreibebrief (Recommandé)",
  paket: "Paket / Päckchen",
};

const shopUrl = process.env.NEXT_PUBLIC_SHOP_URL ?? "http://localhost:3000";

export default async function AdminAnkaufDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { id } = await params;
  const { success, error } = await searchParams;

  const request = await db.ankaufRequest.findUnique({
    where: { id },
    include: { images: { orderBy: { createdAt: "asc" } } },
  });
  if (!request) notFound();

  async function handleRespond(formData: FormData) {
    "use server";
    formData.set("id", id);
    const result = await adminRespondAnkauf(formData);
    if (!result.ok) {
      redirect(`/admin/ankauf/${id}?error=${encodeURIComponent(result.error)}`);
    }
    redirect(`/admin/ankauf/${id}?success=1`);
  }

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/ankauf">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{request.name}</h1>
            <p className="text-sm text-muted-foreground">{request.email} · {formatDateTime(request.createdAt)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`${shopUrl}/ankauf/status?token=${request.publicToken}`} target="_blank">
            <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink className="h-3.5 w-3.5" />
              Kunden-Ansicht
            </Button>
          </Link>
          <ConfirmActionButton
            variant="soft"
            id={request.id}
            action={softDeleteAnkaufAction}
            size="sm"
          />
        </div>
      </div>

      {success && (
        <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          Anfrage erfolgreich aktualisiert.
        </div>
      )}
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {decodeURIComponent(error)}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Linke Spalte: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Beschreibung */}
          <Card>
            <CardHeader>
              <CardTitle>Beschreibung</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-line">{request.description}</p>
            </CardContent>
          </Card>

          {/* Bilder */}
          {request.images.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Bilder ({request.images.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {request.images.map((img) => (
                    <a
                      key={img.id}
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative aspect-square rounded overflow-hidden border bg-muted hover:opacity-90 transition-opacity"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" className="object-cover w-full h-full" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Admin-Antwort Formular */}
          <Card>
            <CardHeader>
              <CardTitle>Antwort / Status aktualisieren</CardTitle>
              <CardDescription>
                Änderungen lösen automatisch eine E-Mail an den Kunden aus (bei ACCEPTED, COUNTER_OFFER, REJECTED, COMPLETED, RETURNED).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={handleRespond} className="space-y-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select
                    name="status"
                    defaultValue={request.status}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  >
                    {ankaufStatusValues.map((s) => (
                      <option key={s} value={s}>{statusLabels[s] ?? s}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminNote">Nachricht / Notiz an Kunden</Label>
                  <Textarea
                    id="adminNote"
                    name="adminNote"
                    defaultValue={request.adminNote ?? ""}
                    rows={4}
                    placeholder="Begründung, Hinweise, Konditionen..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="offeredPrice">Gegenangebot (CHF) — nur bei COUNTER_OFFER</Label>
                  <Input
                    id="offeredPrice"
                    name="offeredPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={request.offeredPrice ? Number(request.offeredPrice) : ""}
                    placeholder="z.B. 15.00"
                    className="max-w-[200px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="payoutAmount">Auszahlungsbetrag (CHF)</Label>
                    <Input
                      id="payoutAmount"
                      name="payoutAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={request.payoutAmount ? Number(request.payoutAmount) : ""}
                      placeholder="z.B. 20.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payoutNote">Zahlungsinfos</Label>
                    <Input
                      id="payoutNote"
                      name="payoutNote"
                      defaultValue={request.payoutNote ?? ""}
                      placeholder="IBAN, Überweisung, etc."
                    />
                  </div>
                </div>

                <Button type="submit">Speichern & E-Mail senden</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Rechte Spalte: Infos */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Preise</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Wunschpreis</span>
                <span className="font-medium">{formatCHF(Number(request.desiredPrice))}</span>
              </div>
              {request.offeredPrice && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unser Angebot</span>
                  <span className="font-medium">{formatCHF(Number(request.offeredPrice))}</span>
                </div>
              )}
              {request.payoutAmount && (
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="text-muted-foreground">Auszahlung</span>
                  <span className="font-semibold text-green-700">{formatCHF(Number(request.payoutAmount))}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Kontakt</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-1">
              <div className="font-medium">{request.name}</div>
              <div className="text-muted-foreground">{request.email}</div>
              {request.phone && <div className="text-muted-foreground">{request.phone}</div>}
            </CardContent>
          </Card>

          {request.shippingMethod && (
            <Card>
              <CardHeader><CardTitle>Versand</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1">
                <div>
                  <span className="text-muted-foreground">Methode: </span>
                  {shippingLabels[request.shippingMethod] ?? request.shippingMethod}
                </div>
                {request.trackingCode && (
                  <div>
                    <span className="text-muted-foreground">Tracking: </span>
                    <code className="font-mono">{request.trackingCode}</code>
                  </div>
                )}
                {request.shippedAt && (
                  <div className="text-xs text-muted-foreground">
                    Versandt: {formatDateTime(request.shippedAt)}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Zeitstempel</CardTitle></CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1">
              <div>Erstellt: {formatDateTime(request.createdAt)}</div>
              {request.respondedAt && <div>Beantwortet: {formatDateTime(request.respondedAt)}</div>}
              {request.shippedAt && <div>Versandt: {formatDateTime(request.shippedAt)}</div>}
              {request.completedAt && <div>Abgeschlossen: {formatDateTime(request.completedAt)}</div>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
