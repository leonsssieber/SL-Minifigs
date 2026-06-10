import Link from "next/link";
import { ArrowRight, Package, Shield, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/shop/product-card";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Handverlesene LEGO® Minifiguren & Sets",
  description:
    "Hochwertige LEGO® Minifiguren, Sets und Einzelteile aus zweiter Hand — geprüft, fair bepreist und schnell aus der Schweiz versendet.",
};

export default async function HomePage() {
  const [featured, newest, categories] = await Promise.all([
    db.product.findMany({
      where: { active: true, featured: true, stockQuantity: { gt: 0 } },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
    db.product.findMany({
      where: { active: true, stockQuantity: { gt: 0 } },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
    db.productCategory.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      take: 6,
    }),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 studs-pattern [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden />
        <div className="container relative py-16 sm:py-24 md:py-32">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-6">
              Schweizer Versand · Geprüfte Qualität
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-balance mb-6 leading-[1.08]">
              Minifiguren, die Sammler <span className="text-primary">lieben.</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground mb-10 max-w-xl leading-relaxed">
              Handverlesene LEGO® Minifiguren, Sets und Einzelteile aus zweiter Hand —
              fair bepreist und schnell aus der Schweiz versendet.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/kategorie/minifiguren">
                <Button size="lg" className="gap-2">
                  Minifiguren entdecken <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/produkte">
                <Button size="lg" variant="outline">
                  Alle Produkte
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="border-b">
        <div className="container py-6 grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-4">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-muted-foreground shrink-0" strokeWidth={1.75} />
            <div>
              <div className="font-medium text-sm">Sichere Bezahlung</div>
              <div className="text-xs text-muted-foreground">Stripe &amp; PayPal — SSL-verschlüsselt</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Truck className="h-5 w-5 text-muted-foreground shrink-0" strokeWidth={1.75} />
            <div>
              <div className="font-medium text-sm">Schweizer Post</div>
              <div className="text-xs text-muted-foreground">Versand schon ab CHF 1.40 als Brief</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-muted-foreground shrink-0" strokeWidth={1.75} />
            <div>
              <div className="font-medium text-sm">Geprüfte Qualität</div>
              <div className="text-xs text-muted-foreground">Jedes Teil vor dem Versand kontrolliert</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="container py-16">
          <div className="flex items-baseline justify-between mb-8">
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Kategorien</h2>
            <Link
              href="/produkte"
              className="group inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Alle ansehen
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/kategorie/${c.slug}`}
                className="rounded-lg border bg-card hover:border-foreground/25 transition-colors p-5 text-center"
              >
                <div className="font-medium text-sm">{c.name}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <section className="container py-16">
          <div className="flex items-baseline justify-between mb-8">
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Highlights</h2>
            <Link
              href="/produkte"
              className="group inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Alle ansehen
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Newest */}
      <section className="container py-16">
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Neu eingetroffen</h2>
          <Link
            href="/produkte"
            className="group inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Alle ansehen
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        {newest.length === 0 ? (
          <div className="rounded-lg border border-dashed py-16 text-center text-muted-foreground">
            <p className="font-medium">Noch keine Produkte vorhanden.</p>
            <p className="text-xs mt-1">Im Admin unter „Produkte" anlegen, um sie hier anzuzeigen.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {newest.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
