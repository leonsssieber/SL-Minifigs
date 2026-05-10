export const dynamic = "force-dynamic";

import { getSettings } from "@/server/actions/settings";

export const metadata = { title: "Impressum" };

export default async function ImpressumPage() {
  const s = await getSettings([
    "shop_legal_entity", "shop_legal_owner", "shop_address",
    "shop_phone", "shop_email", "shop_uid", "shop_legal_register",
  ]);

  const shopName = process.env.NEXT_PUBLIC_SHOP_NAME ?? "SL Minifigs";

  return (
    <div className="container py-12 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Impressum</h1>
      <div className="prose prose-sm max-w-none space-y-4">
        <p><strong>Angaben gemäss schweizerischem Recht (Art. 3 Abs. 1 lit. s UWG)</strong></p>

        <div>
          <p className="font-semibold mb-1">{s.shop_legal_entity || shopName}</p>
          {s.shop_legal_owner && <p>Inhaber: {s.shop_legal_owner}</p>}
          {s.shop_address && <p className="whitespace-pre-line">{s.shop_address}</p>}
          {s.shop_phone && <p>Telefon: {s.shop_phone}</p>}
          {s.shop_email && <p>Email: {s.shop_email}</p>}
          {s.shop_uid && <p>UID-Nr.: {s.shop_uid}</p>}
          {s.shop_legal_register && <p>Handelsregister: {s.shop_legal_register}</p>}
        </div>

        <h2 className="text-xl font-bold mt-8">Haftungsausschluss</h2>
        <p>
          Der Autor übernimmt keinerlei Gewähr hinsichtlich der inhaltlichen Richtigkeit, Genauigkeit,
          Aktualität, Zuverlässigkeit und Vollständigkeit der Informationen.
        </p>
        <p>
          Haftungsansprüche gegen den Autor wegen Schäden materieller oder immaterieller Art, welche aus
          dem Zugriff oder der Nutzung bzw. Nichtnutzung der veröffentlichten Informationen entstehen,
          werden ausgeschlossen.
        </p>
        <p>
          Alle Angebote sind unverbindlich. Der Autor behält es sich ausdrücklich vor, Teile der Seiten
          oder das gesamte Angebot ohne gesonderte Ankündigung zu verändern, zu ergänzen, zu löschen
          oder die Veröffentlichung zeitweise oder endgültig einzustellen.
        </p>

        <h2 className="text-xl font-bold mt-8">Markenrechte</h2>
        <p>
          LEGO® ist eine eingetragene Marke der LEGO Group. Diese Website wird nicht von der LEGO Group
          gesponsert, betrieben oder unterstützt.
        </p>

        <h2 className="text-xl font-bold mt-8">Urheberrecht</h2>
        <p>
          Die Urheber- und alle anderen Rechte an Inhalten, Bildern, Fotos oder anderen Dateien auf dieser
          Website, gehören ausschliesslich {s.shop_legal_entity || shopName} oder den speziell genannten
          Rechteinhabern.
        </p>
      </div>
    </div>
  );
}