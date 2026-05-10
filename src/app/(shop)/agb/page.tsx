export const dynamic = "force-dynamic";

import { getSettings } from "@/server/actions/settings";

export const metadata = { title: "AGB" };

export default async function AgbPage() {
  const s = await getSettings(["shop_legal_entity", "shop_email"]);
  const shopName = process.env.NEXT_PUBLIC_SHOP_NAME ?? "SL Minifigs";

  return (
    <div className="container py-12 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Allgemeine Geschäftsbedingungen</h1>
      <div className="prose prose-sm max-w-none space-y-4">
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
          <strong>Hinweis:</strong> Dies ist ein Template. Bitte unbedingt von einer Fachperson prüfen
          lassen, bevor der Shop live geht — insbesondere für gewerblichen Verkauf in der Schweiz.
        </p>

        <h2 className="text-xl font-bold mt-6">1. Geltungsbereich</h2>
        <p>
          Diese AGB regeln das Vertragsverhältnis zwischen {s.shop_legal_entity || shopName}
          (nachfolgend „Verkäufer") und dem Kunden für sämtliche Bestellungen über den Online-Shop.
        </p>

        <h2 className="text-xl font-bold mt-6">2. Vertragsabschluss</h2>
        <p>
          Die Präsentation der Produkte stellt kein bindendes Angebot dar. Der Vertrag kommt erst
          mit der Auftragsbestätigung des Verkäufers per Email zustande.
        </p>

        <h2 className="text-xl font-bold mt-6">3. Preise und Zahlung</h2>
        <p>
          Alle Preise verstehen sich in CHF und sind, falls nicht anders angegeben, exkl. Mehrwertsteuer.
          Die Bezahlung erfolgt per Kreditkarte (Stripe) oder PayPal.
        </p>

        <h2 className="text-xl font-bold mt-6">4. Lieferung</h2>
        <p>
          Die Lieferung erfolgt an die angegebene Lieferadresse. Versandkosten werden im Checkout
          ausgewiesen. Lieferzeit innerhalb der Schweiz: 2–5 Werktage nach Zahlungseingang.
        </p>

        <h2 className="text-xl font-bold mt-6">5. Eigentumsvorbehalt</h2>
        <p>Die Ware bleibt bis zur vollständigen Bezahlung Eigentum des Verkäufers.</p>

        <h2 className="text-xl font-bold mt-6">6. Gewährleistung</h2>
        <p>
          Da es sich überwiegend um gebrauchte Ware handelt, beschränkt sich die Gewährleistung
          auf den im Produkt-Listing beschriebenen Zustand. Offensichtliche Mängel sind innert
          7 Tagen nach Erhalt zu melden.
        </p>

        <h2 className="text-xl font-bold mt-6">7. Widerruf</h2>
        <p>
          Siehe separate <a href="/widerruf" className="underline">Widerrufsbelehrung</a>.
        </p>

        <h2 className="text-xl font-bold mt-6">8. Datenschutz</h2>
        <p>
          Es gilt die <a href="/datenschutz" className="underline">Datenschutzerklärung</a>.
        </p>

        <h2 className="text-xl font-bold mt-6">9. Anwendbares Recht und Gerichtsstand</h2>
        <p>
          Es gilt schweizerisches Recht unter Ausschluss des UN-Kaufrechts. Gerichtsstand ist der
          Sitz des Verkäufers, sofern nicht zwingend anders vorgesehen.
        </p>

        <h2 className="text-xl font-bold mt-6">10. Kontakt</h2>
        <p>
          Bei Fragen erreichen Sie uns unter {s.shop_email || "(Email noch zu hinterlegen)"}.
        </p>

        <p className="text-xs text-muted-foreground mt-8">
          Stand: {new Date().toLocaleDateString("de-CH")}.
        </p>
      </div>
    </div>
  );
}