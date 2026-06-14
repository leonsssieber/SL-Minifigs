import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Mail, Trash2, UserPlus } from "lucide-react";
import { saveSettings } from "@/server/actions/settings";
import { promoteToAdmin, demoteAdmin } from "@/server/actions/admins";

export const dynamic = "force-dynamic";
export const metadata = { title: "Einstellungen" };

const KEYS = [
  "shop_address",
  "shop_phone",
  "shop_email",
  "shop_uid",
  "shop_iban",
  "shop_legal_entity",
  "shop_legal_owner",
  "shop_legal_register",
  "shop_twint_enabled",
];

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/anmelden");
  const { error, success } = await searchParams;

  const [settings, admins] = await Promise.all([
    db.siteSetting.findMany({ where: { key: { in: KEYS } } }),
    db.user.findMany({
      where: { isAdmin: true },
      select: { id: true, email: true, name: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  const map = new Map(settings.map((s) => [s.key, s.value]));

  async function handlePromote(formData: FormData) {
    "use server";
    const result = await promoteToAdmin(formData);
    if (!result.ok) {
      redirect(`/admin/einstellungen?error=${encodeURIComponent(result.error)}`);
    }
    redirect("/admin/einstellungen?success=promoted");
  }

  async function handleDemote(formData: FormData) {
    "use server";
    const result = await demoteAdmin(formData);
    if (!result.ok) {
      redirect(`/admin/einstellungen?error=${encodeURIComponent(result.error)}`);
    }
    redirect("/admin/einstellungen?success=demoted");
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">Einstellungen</h1>
        <p className="text-muted-foreground">Stammdaten für Shop, Rechnung und Impressum</p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive border border-destructive/20">
          {decodeURIComponent(error)}
        </div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-800 border border-green-200">
          {success === "promoted" && "Nutzer wurde zum Admin gemacht."}
          {success === "demoted" && "Admin-Rechte wurden entzogen."}
        </div>
      )}

      <form action={saveSettings} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Firmendaten</CardTitle>
            <CardDescription>Erscheinen auf Rechnungen, Impressum und Email-Footer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shop_legal_entity">Firmenname</Label>
              <Input id="shop_legal_entity" name="shop_legal_entity" defaultValue={map.get("shop_legal_entity") ?? ""} placeholder="SL Minifigs" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shop_legal_owner">Inhaber/Verantwortlich</Label>
              <Input id="shop_legal_owner" name="shop_legal_owner" defaultValue={map.get("shop_legal_owner") ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shop_address">Adresse</Label>
              <Textarea id="shop_address" name="shop_address" rows={3} defaultValue={map.get("shop_address") ?? ""} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shop_phone">Telefon</Label>
                <Input id="shop_phone" name="shop_phone" defaultValue={map.get("shop_phone") ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shop_email">Kontakt-Email</Label>
                <Input id="shop_email" name="shop_email" type="email" defaultValue={map.get("shop_email") ?? ""} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shop_uid">UID-Nr. (CH)</Label>
              <Input id="shop_uid" name="shop_uid" defaultValue={map.get("shop_uid") ?? ""} placeholder="CHE-123.456.789" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shop_iban">IBAN (für manuelle Überweisung)</Label>
              <Input id="shop_iban" name="shop_iban" defaultValue={map.get("shop_iban") ?? ""} placeholder="CH00 0000 0000 0000 0000 0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shop_legal_register">Handelsregister-Eintrag (optional)</Label>
              <Input id="shop_legal_register" name="shop_legal_register" defaultValue={map.get("shop_legal_register") ?? ""} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Zahlungen</CardTitle>
            <CardDescription>Welche Bezahlmethoden im Checkout angezeigt werden.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shop_twint_enabled">TWINT (über Stripe)</Label>
              <select
                id="shop_twint_enabled"
                name="shop_twint_enabled"
                defaultValue={map.get("shop_twint_enabled") === "true" ? "true" : "false"}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="false">Deaktiviert</option>
                <option value="true">Aktiviert</option>
              </select>
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
                <strong>Erst aktivieren, wenn TWINT im Stripe-Dashboard freigeschaltet ist</strong>{" "}
                (Status „Aktiviert"). Kreditkarte &amp; PayPal funktionieren unabhängig davon immer.
                Sollte TWINT bei Stripe doch noch nicht bereit sein, fällt der Checkout
                automatisch auf Kartenzahlung zurück — es geht also nie etwas kaputt.
              </p>
            </div>
          </CardContent>
        </Card>

        <Button type="submit">Speichern</Button>
      </form>

      {/* 2FA-Hinweis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Zwei-Faktor-Authentifizierung
            <Badge variant="success" className="gap-1"><Mail className="h-3 w-3" /> Per E-Mail</Badge>
          </CardTitle>
          <CardDescription>
            Alle Admins erhalten beim Login automatisch einen 6-stelligen Bestätigungs-Code an die in ihrem Konto hinterlegte E-Mail-Adresse.
            Eine Authenticator-App ist nicht nötig.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Admin-Verwaltung */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Admin-Verwaltung
          </CardTitle>
          <CardDescription>
            Mehrere Admins möglich. Promoviere einen registrierten Nutzer per E-Mail-Adresse zum Admin.
            Der Nutzer muss sich zuerst regulär registriert haben.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form action={handlePromote} className="flex flex-col sm:flex-row gap-2">
            <Input
              name="email"
              type="email"
              placeholder="neuer-admin@example.com"
              required
              className="flex-1"
            />
            <Button type="submit" className="gap-2 shrink-0">
              <UserPlus className="h-4 w-4" /> Zum Admin machen
            </Button>
          </form>

          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Aktuelle Admins ({admins.length})
            </div>
            <div className="divide-y border rounded-md">
              {admins.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{a.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground truncate">{a.email}</div>
                  </div>
                  {a.id === session.user!.id ? (
                    <Badge variant="secondary">Du</Badge>
                  ) : (
                    <form action={handleDemote}>
                      <input type="hidden" name="userId" value={a.id} />
                      <Button type="submit" variant="ghost" size="sm" className="text-destructive hover:text-destructive gap-1">
                        <Trash2 className="h-3.5 w-3.5" /> Entfernen
                      </Button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
