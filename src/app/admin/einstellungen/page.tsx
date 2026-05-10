import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { saveSettings } from "@/server/actions/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Einstellungen" };

const KEYS = [
  "shop_address",
  "shop_phone",
  "shop_email",
  "shop_uid",          // CH UID-Nummer für Rechnung
  "shop_iban",         // für manuelle Bezahlung
  "shop_legal_entity", // Firmenname
  "shop_legal_owner",  // Inhaber
  "shop_legal_register",
];

export default async function AdminSettingsPage() {
  const settings = await db.siteSetting.findMany({ where: { key: { in: KEYS } } });
  const map = new Map(settings.map((s) => [s.key, s.value]));

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">Einstellungen</h1>
        <p className="text-muted-foreground">Stammdaten für Shop, Rechnung und Impressum</p>
      </div>

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
            <div className="grid grid-cols-2 gap-4">
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
        <Button type="submit">Speichern</Button>
      </form>
    </div>
  );
}
