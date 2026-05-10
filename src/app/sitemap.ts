import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SHOP_URL ?? "http://localhost:3000";

  const [products, categories] = await Promise.all([
    db.product.findMany({
      where: { active: true, stockQuantity: { gt: 0 } },
      select: { slug: true, updatedAt: true },
    }),
    db.productCategory.findMany({
      where: { active: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const staticPages = [
    { url: `${base}`, priority: 1.0 },
    { url: `${base}/produkte`, priority: 0.9 },
    { url: `${base}/kontakt`, priority: 0.5 },
    { url: `${base}/agb`, priority: 0.3 },
    { url: `${base}/datenschutz`, priority: 0.3 },
    { url: `${base}/impressum`, priority: 0.3 },
    { url: `${base}/widerruf`, priority: 0.3 },
  ];

  return [
    ...staticPages,
    ...categories.map((c) => ({
      url: `${base}/kategorie/${c.slug}`,
      lastModified: c.updatedAt,
      priority: 0.7,
    })),
    ...products.map((p) => ({
      url: `${base}/produkte/${p.slug}`,
      lastModified: p.updatedAt,
      priority: 0.8,
    })),
  ];
}
