import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SHOP_URL ?? "http://localhost:3000";
  return {
    rules: [
      // Alle Crawler (inkl. KI-Bots wie GPTBot, ClaudeBot, PerplexityBot) sind
      // erlaubt — wir WOLLEN in Suchmaschinen und KI-Antworten auftauchen.
      // Gesperrt sind nur private/funktionale Pfade und Capability-URLs
      // (Bestell- und Ankauf-Status sind über geheime Tokens erreichbar).
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/konto", "/api", "/kasse", "/bestellung", "/ankauf/status"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
