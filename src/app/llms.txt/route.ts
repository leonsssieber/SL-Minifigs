// /llms.txt — knappe, maschinenlesbare Beschreibung des Shops für KI-Assistenten
// (ChatGPT, Claude, Perplexity etc.). Aufkommender Standard, ergänzend zu
// robots.txt/sitemap.xml. Schadet nicht, hilft bei der KI-Auffindbarkeit.

export const dynamic = "force-dynamic";

export function GET() {
  const base = process.env.NEXT_PUBLIC_SHOP_URL ?? "http://localhost:3000";
  const name = process.env.NEXT_PUBLIC_SHOP_NAME ?? "SL Minifigs";

  const body = `# ${name}

> ${name} ist ein Schweizer Online-Shop für handverlesene LEGO®-Minifiguren, Sets und Einzelteile aus zweiter Hand. Jeder Artikel wird vor dem Versand geprüft, fair bepreist und schnell aus der Schweiz verschickt. Bezahlung per Kreditkarte, PayPal und TWINT. Wir kaufen ausserdem gebrauchtes LEGO an.

## Wichtige Seiten
- [Alle Produkte](${base}/produkte): Gesamter Bestand mit Suche und Filtern (Kategorie, Zustand, Preis)
- [Minifiguren](${base}/kategorie/minifiguren): LEGO-Minifiguren neu und gebraucht
- [LEGO Sets](${base}/kategorie/lego-sets): Komplette und teilweise Sets
- [LEGO ankaufen](${base}/ankauf): Wir kaufen deine LEGO-Sammlung an
- [Kontakt](${base}/kontakt): Fragen und Anfragen

## Hinweise
- Preise in CHF. Versand innerhalb der Schweiz, bereits ab CHF 1.40 als Brief.
- Zustände werden pro Artikel angegeben (z.B. Neu, Wie Neu, Gebraucht). Unvollständige Artikel sind als solche gekennzeichnet.
- Nicht angeschlossen an die LEGO Group. LEGO® ist eine eingetragene Marke der LEGO Group.

## Maschinenlesbar
- Sitemap: ${base}/sitemap.xml
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
