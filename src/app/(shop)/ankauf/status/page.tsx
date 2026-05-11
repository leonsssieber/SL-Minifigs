export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Image from "next/image";
import { db } from "@/lib/db";
import { formatCHF, formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Clock, XCircle, Truck, Package, Banknote, ArrowRightLeft } from "lucide-react";
import { acceptCounterOffer, declineCounterOffer, submitShippingInfo } from "@/server/actions/ankauf";
import { redirect } from "next/navigation";

export const metadata = { title: "Ankauf-Status — SL Minifigs" };

const statusConfig: Record<string, { label: string; color: "success" | "warning" | "destructive" | "info" | "secondary"; icon: typeof Clock }> = {
  PENDING: { label: "In Bearbeitung", color: "warning", icon: Clock },
  ACCEPTED: { label: "Angenommen", color: "success", icon: CheckCircle2 },
  COUNTER_OFFER: { label: "Gegenangebot", color: "info", icon: ArrowRightLeft },
  REJECTED: { label: "Abgelehnt", color: "destructive", icon: XCircle },
  WAITING_SHIPMENT: { label: "Warte auf Versand", color: "warning", icon: Package },
  SHIPPED: { label: "Versandt", color: "info", icon: Truck },
  VERIFYING: { label: "Wird geprüft", color: "warning", icon: Clock },
  COMPLETED: { label: "Abgeschlossen", color: "success", icon: Banknote },
  RETURNED: { label: "Zurückgesandt", color: "secondary", icon: Truck },
};

const shippingLabels: Record<string, string> = {
  brief: "Normaler Brief",
  einschreiben: "Einschreibebrief (Recommandé)",
  paket: "Paket",
};

export default async function AnkaufStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; neu?: string; success?: string }>;
}) {
  const { token, neu, success } = await searchParams;
  if (!token) notFound();

  const request = await db.ankaufRequest.findUnique({
    where: { publicToken: token },
    include: { images: { orderBy: { createdAt: "asc" } } },
  });
  if (!request) notFound();

  const cfg = statusConfig[request.status] ?? statusConfig.PENDING;
  const StatusIcon = cfg.icon;

  const needsShipping = ["ACCEPTED", "WAITING_SHIPMENT"].includes(request.status);

  async function handleAcceptOffer(formData: FormData) {
    "use server";
    formData.set("token", token!);
    await acceptCounterOffer(formData);
    redirect(`/ankauf/status?token=${token}&success=accepted`);
  }

  async function handleDeclineOffer(formData: FormData) {
    "use server";
    formData.set("token", token!);
    await declineCounterOffer(formData);
    redirect(`/ankauf/status?token=${token}&success=declined`);
  }

  async function handleShipping(formData: FormData) {
    "use server";
    formData.set("token", token!);
    const result = await submitShippingInfo(formData);
    if (!result.ok) {
      redirect(`/ankauf/status?token=${token}&success=ship_error`);
    }
    redirect(`/ankauf/status?token=${token}&success=shipped`);
  }

  return (
    <div className="container py-12 max-w-2xl">
      {neu === "1" && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800 mb-6">
          Deine Ankauf-Anfrage wurde erfolgreich eingereicht. Du erhältst eine Bestätigung per E-Mail.
        </div>
      )}
      {success === "shipped" && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800 mb-6">
          Versandinformationen gespeichert. Danke! Wir melden uns nach dem Eingang deiner Sendung.
        </div>
      )}
      {success === "accepted" && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800 mb-6">
          Du hast das Angebot angenommen. Bitte sende uns jetzt deine Artikel.
        </div>
      )}
      {success === "declined" && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 mb-6">
          Du hast das Angebot abgelehnt. Die Anfrage ist damit abgeschlossen.
        </div>
      )}

      <h1 className="text-3xl font-bold mb-2">Ankauf-Status</h1>
      <p className="text-muted-foreground mb-6">Erstellt: {formatDateTime(request.createdAt)}</p>

      {/* Status-Badge */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <StatusIcon className="h-6 w-6 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Aktueller Status</p>
              <Badge variant={cfg.color} className="text-sm mt-0.5">{cfg.label}</Badge>
            </div>
          </div>

          {/* Preisübersicht */}
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm border-t pt-4">
            <div>
              <p className="text-muted-foreground">Dein Wunschpreis</p>
              <p className="font-semibold">{formatCHF(Number(request.desiredPrice))}</p>
            </div>
            {request.offeredPrice && (
              <div>
                <p className="text-muted-foreground">Unser Angebot</p>
                <p className="font-semibold">{formatCHF(Number(request.offeredPrice))}</p>
              </div>
            )}
            {request.payoutAmount && (
              <div>
                <p className="text-muted-foreground">Auszahlung</p>
                <p className="font-semibold text-green-700">{formatCHF(Number(request.payoutAmount))}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Admin-Antwort */}
      {request.adminNote && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-base">Nachricht von uns</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-line">{request.adminNote}</p>
          </CardContent>
        </Card>
      )}

      {/* Gegenangebot: annehmen/ablehnen */}
      {request.status === "COUNTER_OFFER" && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Gegenangebot: {formatCHF(Number(request.offeredPrice))}</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3">
            <form action={handleAcceptOffer}>
              <Button type="submit" variant="default">Angebot annehmen</Button>
            </form>
            <form action={handleDeclineOffer}>
              <Button type="submit" variant="outline">Ablehnen</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Versandinformationen eingeben */}
      {needsShipping && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Versand deiner Artikel</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Bitte sende deine Artikel an unsere Adresse und wähle die Versandmethode:
            </p>

            {/* Versandadresse — aus Einstellungen oder Fallback */}
            <div className="rounded-md bg-muted p-3 text-sm font-mono mb-4">
              SL Minifigs<br />
              [Adresse aus Shop-Einstellungen]
            </div>

            {/* Versandmethoden-Auswahl */}
            <div className="rounded-lg border bg-amber-50 border-amber-200 p-3 text-xs text-amber-800 mb-4">
              <strong>Empfehlung:</strong> Verwende einen <strong>Einschreibebrief (Recommandé)</strong> oder
              eine Paketsendung mit Tracking. Bei normalem Briefversand übernehmen wir{" "}
              <strong>keine Haftung bei Verlust</strong>. Die Versandkosten (inkl. allfälliger Rücksendung)
              gehen zu deinen Lasten.
            </div>

            <form action={handleShipping} className="space-y-4">
              <div className="space-y-3">
                <Label>Versandmethode *</Label>
                {[
                  {
                    value: "brief",
                    label: "Normaler Brief",
                    sub: "ca. CHF 1.10 — ⚠ Kein Haftungsschutz bei Verlust",
                    warn: true,
                  },
                  {
                    value: "einschreiben",
                    label: "Einschreibebrief (Recommandé) — Empfohlen",
                    sub: "ca. CHF 4.00 — Haftungsschutz bei Verlust",
                    warn: false,
                  },
                  {
                    value: "paket",
                    label: "Paket / Päckchen",
                    sub: "ab ca. CHF 7.90 — Haftungsschutz + Tracking",
                    warn: false,
                  },
                ].map((opt) => (
                  <label key={opt.value} className="flex items-start gap-3 cursor-pointer rounded-lg border p-3 hover:bg-muted/30 transition-colors">
                    <input
                      type="radio"
                      name="shippingMethod"
                      value={opt.value}
                      defaultChecked={opt.value === "einschreiben"}
                      className="mt-0.5"
                      required
                    />
                    <div>
                      <div className="text-sm font-medium">{opt.label}</div>
                      <div className={`text-xs ${opt.warn ? "text-amber-700" : "text-muted-foreground"}`}>
                        {opt.sub}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor="trackingCode">Tracking-Nummer (optional)</Label>
                <Input id="trackingCode" name="trackingCode" placeholder="z.B. RA123456789CH" className="max-w-xs" />
                <p className="text-xs text-muted-foreground">
                  Falls verfügbar — bei Einschreibebriefen und Paketen empfohlen.
                </p>
              </div>
              <Button type="submit">Artikel wurden versandt</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Versandinfo anzeigen wenn bereits versandt */}
      {["SHIPPED", "VERIFYING", "COMPLETED", "RETURNED"].includes(request.status) && request.shippingMethod && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-base">Versandinformationen</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <div><span className="text-muted-foreground">Methode:</span> {shippingLabels[request.shippingMethod] ?? request.shippingMethod}</div>
            {request.trackingCode && (
              <div><span className="text-muted-foreground">Tracking:</span> <code className="font-mono">{request.trackingCode}</code></div>
            )}
            {request.shippedAt && (
              <div><span className="text-muted-foreground">Versandt:</span> {formatDateTime(request.shippedAt)}</div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bilder */}
      {request.images.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Deine Bilder ({request.images.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {request.images.map((img) => (
                <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer" className="relative aspect-square rounded overflow-hidden border bg-muted hover:opacity-90 transition-opacity">
                  <Image src={img.url} alt="" fill className="object-cover" sizes="120px" />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
