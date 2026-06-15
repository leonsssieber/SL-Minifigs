// Rendert strukturierte Daten (schema.org) als JSON-LD. Diese helfen Google
// (Rich Results: Preis, Verfügbarkeit, Zustand) UND AI-Chatbots, den Inhalt
// zuverlässig zu verstehen. `<` wird escaped, damit Produktnamen mit "</script>"
// nicht ausbrechen können (XSS-Schutz).
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
