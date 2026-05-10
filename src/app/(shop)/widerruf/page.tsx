export const dynamic = "force-dynamic";

import { getSettings } from "@/server/actions/settings";

export const metadata = { title: "Widerrufsrecht" };

export default async function WiderrufPage() {
  const s = await getSettings(["shop_email", "shop_legal_entity"]);
  const shopName = process.env.NEXT_PUBLIC_SHOP_NAME ?? "SL Minifigs";

  return (
    <div className="container py-12 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Widerruf / Rückgabe</h1>
      <div className="prose prose-sm max-w-none space-y-4">
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
          <strong>Hinweis:</strong> In der Schweiz besteht für Online-Käufe — anders als in der EU —
          kein gesetzliches Widerrufsrecht. Wir gewähren freiwillig folgende Bedingungen:
        </p>

        <h2 className="text-xl font-bold mt-6">Freiwilliges Rückgaberecht</h2>
        <p>
          Innerhalb von 14 Tagen nach Erhalt kannst du den Artikel zurücksenden. Der Artikel muss
          dabei im selben Zustand sein wie beim Versand. Die Rücksendekosten trägt der Käufer.
        </p>

        <h2 className="text-xl font-bold mt-6">Ausnahmen</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Geöffnete Lego-Sets (Versiegelung gebrochen)</li>
          <li>Speziell für dich zusammengestellte Konvolute</li>
          <li>Beschädigte oder unvollständig zurückgesendete Artikel</li>
        </ul>

        <h2 className="text-xl font-bold mt-6">Rücksendung</h2>
        <p>
          Bitte kontaktiere uns vor der Rücksendung unter {s.shop_email || "(Email)"}, damit wir
          dir die Rücksendeadresse zukommen lassen können.
        </p>

        <h2 className="text-xl font-bold mt-6">Rückerstattung</h2>
        <p>
          Nach Erhalt und Prüfung der Rücksendung erstatten wir den Kaufpreis (ohne Versandkosten)
          innerhalb von 14 Tagen über den ursprünglichen Bezahlweg.
        </p>

        <p className="text-xs text-muted-foreground mt-8">
          {s.shop_legal_entity || shopName} · Stand: {new Date().toLocaleDateString("de-CH")}.
        </p>
      </div>
    </div>
  );
}