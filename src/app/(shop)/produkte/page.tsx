export const dynamic = "force-dynamic";

import Link from "next/link";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/shop/product-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { conditionLabel } from "@/lib/utils";

export const metadata = { title: "Alle Produkte" };

interface SearchParams {
  q?: string;
  cat?: string;
  cond?: string;
  min?: string;
  max?: string;
  sort?: string;
  page?: string;
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const q = sp.q?.trim();
  const categorySlug = sp.cat;
  const condition = sp.cond;
  const minPrice = sp.min ? parseFloat(sp.min) : undefined;
  const maxPrice = sp.max ? parseFloat(sp.max) : undefined;
  const sort = sp.sort ?? "newest";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const pageSize = 24;

  const where: Record<string, unknown> = {
    active: true,
    stockQuantity: { gt: 0 },
  };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { legoSetNumber: { contains: q, mode: "insensitive" } },
    ];
  }
  if (categorySlug) where.category = { slug: categorySlug };
  if (condition) where.condition = condition;
  if (minPrice != null || maxPrice != null) {
    const priceFilter: Record<string, number> = {};
    if (minPrice != null) priceFilter.gte = minPrice;
    if (maxPrice != null) priceFilter.lte = maxPrice;
    where.price = priceFilter;
  }

  const orderBy =
    sort === "price-asc" ? { price: "asc" as const } :
    sort === "price-desc" ? { price: "desc" as const } :
    sort === "name" ? { name: "asc" as const } :
    { createdAt: "desc" as const };

  const [products, totalCount, categories] = await Promise.all([
    db.product.findMany({
      where,
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.product.count({ where }),
    db.productCategory.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const selectClass =
    "h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-tight mb-1.5">
          {categorySlug ? categories.find((c) => c.slug === categorySlug)?.name ?? "Produkte" : "Alle Produkte"}
        </h1>
        <p className="text-sm text-muted-foreground">{totalCount} Produkte</p>
      </div>

      <form className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Input name="q" placeholder="Suchen..." defaultValue={q} />
        <select name="cat" defaultValue={categorySlug ?? ""} className={selectClass}>
          <option value="">Alle Kategorien</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <select name="cond" defaultValue={condition ?? ""} className={selectClass}>
          <option value="">Alle Zustände</option>
          {["NEU", "WIE_NEU", "GEBRAUCHT_GUT", "GEBRAUCHT_FAIR"].map((c) => (
            <option key={c} value={c}>{conditionLabel(c)}</option>
          ))}
        </select>
        <select name="sort" defaultValue={sort} className={selectClass}>
          <option value="newest">Neueste</option>
          <option value="price-asc">Preis aufsteigend</option>
          <option value="price-desc">Preis absteigend</option>
          <option value="name">Name A-Z</option>
        </select>
        <Button type="submit" variant="outline">Anwenden</Button>
      </form>

      {products.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-muted-foreground">
          Keine Produkte gefunden.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
          {totalPages > 1 && (
            <div className="mt-10 flex justify-center gap-1.5">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                const params = new URLSearchParams();
                if (q) params.set("q", q);
                if (categorySlug) params.set("cat", categorySlug);
                if (condition) params.set("cond", condition);
                if (sp.min) params.set("min", sp.min);
                if (sp.max) params.set("max", sp.max);
                if (sort) params.set("sort", sort);
                if (p > 1) params.set("page", String(p));
                return (
                  <Link
                    key={p}
                    href={`/produkte?${params.toString()}`}
                    className={`h-9 min-w-9 px-2 grid place-items-center rounded-md text-sm font-medium transition-colors ${
                      p === page
                        ? "bg-foreground text-background"
                        : "border text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >{p}</Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}