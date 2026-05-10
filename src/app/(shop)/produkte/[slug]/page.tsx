export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCHF, conditionLabel, decimalToNumber } from "@/lib/utils";
import { ProductCard } from "@/components/shop/product-card";
import { AddToCartButton } from "./add-to-cart-button";
import { WishlistButton } from "@/components/shop/wishlist-button";
import { auth } from "@/lib/auth";
import { ProductGallery } from "./product-gallery";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await db.product.findUnique({ where: { slug }, select: { name: true, shortDescription: true, description: true } });
  if (!product) return { title: "Produkt nicht gefunden" };
  return {
    title: product.name,
    description: product.shortDescription ?? product.description.slice(0, 160),
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();

  const product = await db.product.findUnique({
    where: { slug },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!product || !product.active) notFound();

  const inWishlist = session?.user
    ? !!(await db.wishlistItem.findUnique({
        where: { userId_productId: { userId: session.user.id, productId: product.id } },
      }))
    : false;

  const related = await db.product.findMany({
    where: {
      categoryId: product.categoryId,
      active: true,
      stockQuantity: { gt: 0 },
      NOT: { id: product.id },
    },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    take: 4,
    orderBy: { createdAt: "desc" },
  });

  const price = decimalToNumber(product.price);
  const comparePrice = product.comparePrice != null ? decimalToNumber(product.comparePrice) : null;
  const isSoldOut = product.stockQuantity <= 0;

  return (
    <div className="container py-8">
      <nav className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
        <Link href="/" className="hover:text-foreground">Home</Link> /
        <Link href="/produkte" className="hover:text-foreground">Produkte</Link> /
        <Link href={`/kategorie/${product.category.slug}`} className="hover:text-foreground">{product.category.name}</Link> /
        <span className="text-foreground line-clamp-1">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        <ProductGallery images={product.images} productName={product.name} />

        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{conditionLabel(product.condition)}</Badge>
              {product.legoSetNumber && (
                <Badge variant="outline">Set-Nr. {product.legoSetNumber}</Badge>
              )}
              {product.featured && <Badge variant="warning">★ Featured</Badge>}
            </div>
            <h1 className="text-3xl font-bold leading-tight">{product.name}</h1>
            {product.shortDescription && (
              <p className="text-muted-foreground">{product.shortDescription}</p>
            )}
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold">{formatCHF(price)}</span>
            {comparePrice && comparePrice > price && (
              <>
                <span className="text-lg text-muted-foreground line-through">{formatCHF(comparePrice)}</span>
                <Badge variant="destructive">−{Math.round(((comparePrice - price) / comparePrice) * 100)}%</Badge>
              </>
            )}
          </div>

          <Separator />

          <div className="space-y-3">
            {isSoldOut ? (
              <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm">
                Leider verkauft. Schau in der gleichen Kategorie nach Alternativen.
              </div>
            ) : (
              <>
                <div className="text-sm">
                  {product.stockType === "UNIQUE" ? (
                    <span className="text-green-700 font-medium">✓ Verfügbar (Unikat)</span>
                  ) : (
                    <span className="text-green-700 font-medium">✓ {product.stockQuantity} Stück verfügbar</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <AddToCartButton
                    product={{
                      productId: product.id,
                      slug: product.slug,
                      name: product.name,
                      price,
                      imageUrl: product.images[0]?.url,
                      maxStock: product.stockQuantity,
                      shippingCategory: product.shippingCategory,
                      weightGrams: product.weightGrams,
                    }}
                  />
                  <WishlistButton
                    productId={product.id}
                    isLoggedIn={!!session?.user}
                    initialState={inWishlist}
                  />
                </div>
              </>
            )}
          </div>

          <Separator />

          <div className="prose prose-sm max-w-none">
            <h3 className="font-semibold mb-2">Beschreibung</h3>
            <div className="whitespace-pre-line text-sm leading-relaxed">{product.description}</div>
          </div>

          <Separator />

          <dl className="text-sm grid grid-cols-2 gap-y-2">
            <dt className="text-muted-foreground">Kategorie</dt>
            <dd>{product.category.name}</dd>
            <dt className="text-muted-foreground">Zustand</dt>
            <dd>{conditionLabel(product.condition)}</dd>
            {product.legoSetNumber && (
              <>
                <dt className="text-muted-foreground">Lego Set-Nr.</dt>
                <dd className="font-mono">{product.legoSetNumber}</dd>
              </>
            )}
            {product.weightGrams && (
              <>
                <dt className="text-muted-foreground">Gewicht</dt>
                <dd>{product.weightGrams} g</dd>
              </>
            )}
          </dl>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold mb-6">Ähnliche Produkte</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}