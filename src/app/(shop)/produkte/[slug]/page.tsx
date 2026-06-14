export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCHF, decimalToNumber, bricklinkUrl } from "@/lib/utils";
import { getConditionLabel } from "@/lib/conditions";
import { ExternalLink } from "lucide-react";
import { ProductCard } from "@/components/shop/product-card";
import { SectionHeader } from "@/components/shop/section-header";
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
  const condLabel = await getConditionLabel(product.condition);

  return (
    <div className="container py-6 sm:py-8">
      <nav className="text-xs text-muted-foreground mb-4 flex flex-wrap items-center gap-x-1 gap-y-0.5 min-w-0">
        <Link href="/" className="hover:text-foreground">Home</Link> <span>/</span>
        <Link href="/produkte" className="hover:text-foreground">Produkte</Link> <span>/</span>
        <Link href={`/kategorie/${product.category.slug}`} className="hover:text-foreground">{product.category.name}</Link> <span>/</span>
        <span className="text-foreground line-clamp-1 max-w-full">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        <ProductGallery images={product.images} productName={product.name} />

        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{condLabel}</Badge>
              {product.incomplete && (
                <Badge variant="warning">Unvollständig</Badge>
              )}
              {product.legoSetNumber && (
                <a
                  href={bricklinkUrl(product.legoSetNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex"
                  title="Auf BrickLink ansehen"
                >
                  <Badge variant="outline" className="gap-1 cursor-pointer hover:bg-muted">
                    Nr. {product.legoSetNumber}
                    <ExternalLink className="h-3 w-3" />
                  </Badge>
                </a>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight leading-tight break-words">{product.name}</h1>
            {product.shortDescription && (
              <p className="text-muted-foreground">{product.shortDescription}</p>
            )}
            {product.incomplete && (
              <div className="rounded-lg border-2 border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                <strong>Unvollständig:</strong>{" "}
                {product.incompleteNote?.trim()
                  ? product.incompleteNote
                  : "Bei diesem Artikel fehlt etwas — bitte Bilder und Beschreibung beachten."}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-2xl sm:text-3xl font-semibold tracking-tight whitespace-nowrap">{formatCHF(price)}</span>
            {comparePrice && comparePrice > price && (
              <>
                <span className="text-base sm:text-lg text-muted-foreground line-through whitespace-nowrap">{formatCHF(comparePrice)}</span>
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
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                  {product.stockType === "UNIQUE"
                    ? "Verfügbar (Unikat)"
                    : `${product.stockQuantity} Stück verfügbar`}
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

          <dl className="text-sm grid grid-cols-2 gap-x-4 gap-y-2.5">
            <dt className="text-muted-foreground">Kategorie</dt>
            <dd>{product.category.name}</dd>
            <dt className="text-muted-foreground">Zustand</dt>
            <dd>{condLabel}{product.incomplete ? " · Unvollständig" : ""}</dd>
            {product.legoSetNumber && (
              <>
                <dt className="text-muted-foreground">LEGO Teilenummer</dt>
                <dd className="font-mono break-all">
                  <a
                    href={bricklinkUrl(product.legoSetNumber)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    {product.legoSetNumber}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <span className="text-xs text-muted-foreground ml-1">(BrickLink)</span>
                </dd>
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
        <section className="mt-20">
          <SectionHeader title="Ähnliche Produkte" href={null} />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}