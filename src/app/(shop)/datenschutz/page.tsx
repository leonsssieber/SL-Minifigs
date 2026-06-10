export const dynamic = "force-dynamic";

import { getSettings } from "@/server/actions/settings";

export const metadata = { title: "Datenschutzerklärung" };

export default async function DatenschutzPage() {
  const s = await getSettings(["shop_legal_entity", "shop_email", "shop_address"]);
  const shopName = process.env.NEXT_PUBLIC_SHOP_NAME ?? "SL Minifigs";

  return (
    <div className="container py-12 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Datenschutzerklärung</h1>
      <div className="prose prose-sm max-w-none space-y-4">
        <p>
          Mit dieser Datenschutzerklärung informieren wir Sie über die Verarbeitung Ihrer
          Personendaten durch {s.shop_legal_entity || shopName}. Wir richten uns nach dem
          schweizerischen Datenschutzgesetz (DSG) und – sofern anwendbar – der Europäischen
          Datenschutz-Grundverordnung (DSGVO).
        </p>

        <h2 className="text-xl font-bold mt-6">1. Verantwortliche Stelle</h2>
        <p className="whitespace-pre-line">
          {s.shop_legal_entity || shopName}
          {s.shop_address ? `\n${s.shop_address}` : ""}
          {s.shop_email ? `\nEmail: ${s.shop_email}` : ""}
        </p>

        <h2 className="text-xl font-bold mt-6">2. Welche Daten wir erheben</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Konto-Daten: Name, Email, Passwort (verschlüsselt)</li>
          <li>Bestelldaten: Bestellungen, Lieferadresse, Bezahlinformationen</li>
          <li>Technische Daten: IP-Adresse, Browser, Geräteinformationen, Cookies</li>
        </ul>

        <h2 className="text-xl font-bold mt-6">3. Zweck der Bearbeitung</h2>
        <p>
          Wir bearbeiten Ihre Daten zur Vertragserfüllung (Bestellabwicklung, Versand,
          Rechnungsstellung), zur Kommunikation mit Ihnen, zur Verbesserung unseres Angebots
          und zur Erfüllung gesetzlicher Pflichten.
        </p>

        <h2 className="text-xl font-bold mt-6">4. Weitergabe an Dritte</h2>
        <p>Wir geben Ihre Daten nur an folgende Dienstleister weiter, soweit für die Vertragserfüllung erforderlich:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Bezahldienste: Stripe, PayPal</li>
          <li>Hosting &amp; Bilder-Speicherung: Vercel Inc. (USA, Serverstandort EU)</li>
          <li>E-Mail-Versand: SMTP-Dienstleister (Transaktions-E-Mails wie Bestellbestätigungen)</li>
          <li>Versanddienstleister (Schweizerische Post)</li>
        </ul>

        <h2 className="text-xl font-bold mt-6">5. Cookies</h2>
        <p>
          Wir verwenden technisch notwendige Cookies (Session, Warenkorb). Es werden keine
          Tracking- oder Werbe-Cookies gesetzt.
        </p>

        <h2 className="text-xl font-bold mt-6">6. Ihre Rechte</h2>
        <p>
          Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Bearbeitung
          und Datenübertragbarkeit. Wenden Sie sich dafür bitte an {s.shop_email || "uns"}.
        </p>

        <h2 className="text-xl font-bold mt-6">7. Aufbewahrung</h2>
        <p>
          Bestelldaten werden gemäss schweizerischer Buchhaltungspflicht 10 Jahre aufbewahrt.
          Konto-Daten werden bis zur Löschung des Kontos gespeichert.
        </p>

        <p className="text-xs text-muted-foreground mt-8">
          Diese Erklärung kann jederzeit angepasst werden. Stand: {new Date().toLocaleDateString("de-CH")}.
        </p>
      </div>
    </div>
  );
}