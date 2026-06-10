export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/shop/product-card";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cat = await db.productCategory.findUnique({ where: { slug } });
  return { title: cat?.name ?? "Kategorie" };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await db.productCategory.findUnique({
    where: { slug },
    include: {
      products: {
        where: { active: true, stockQuantity: { gt: 0 } },
        include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!category || !category.active) notFound();

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-tight mb-1.5">{category.name}</h1>
        {category.description && <p className="text-muted-foreground">{category.description}</p>}
        <p className="text-sm text-muted-foreground mt-1">{category.products.length} Produkte</p>
      </div>
      {category.products.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-muted-foreground">
          Aktuell keine Produkte in dieser Kategorie.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {category.products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}