import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SHOP_URL ?? "http://localhost:3000";
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/konto", "/api", "/kasse"] },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
