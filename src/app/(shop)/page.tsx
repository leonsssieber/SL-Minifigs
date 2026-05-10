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
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-background via-background to-primary/5">
        <div className="absolute inset-0 studs-pattern opacity-60" aria-hidden />
        <div
          className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-primary/15 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-accent/20 blur-3xl"
          aria-hidden
        />
        <div className="container relative py-20 md:py-28">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-bold mb-5 shadow-sm">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-foreground/70" />
              Schweizer Versand · Geprüfte Qualität
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-balance mb-5 leading-[1.05]">
              Minifiguren, die Sammler{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-primary">lieben.</span>
                <span
                  className="absolute inset-x-0 bottom-1 h-3 bg-accent/70 -z-0 rounded-sm"
                  aria-hidden
                />
              </span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl">
              Handverlesene LEGO® Minifiguren, Sets und Einzelteile aus zweiter Hand —
              fair bepreist und schnell aus der Schweiz versendet.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/kategorie/minifiguren">
                <Button size="lg" className="gap-2 shadow-md shadow-primary/20">
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
      <section className="border-b bg-muted/30">
        <div className="container py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 grid place-items-center shrink-0">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="font-semibold text-sm">Sichere Bezahlung</div>
              <div className="text-xs text-muted-foreground">Stripe &amp; PayPal — SSL-verschlüsselt</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 grid place-items-center shrink-0">
              <Truck className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="font-semibold text-sm">Schweizer Post</div>
              <div className="text-xs text-muted-foreground">Versand schon ab CHF 1.40 als Brief</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 grid place-items-center shrink-0">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="font-semibold text-sm">Geprüfte Qualität</div>
              <div className="text-xs text-muted-foreground">Jedes Teil vor dem Versand kontrolliert</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="container py-14">
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Kategorien</h2>
            <Link href="/produkte" className="text-sm font-medium text-primary hover:underline">
              Alle ansehen →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/kategorie/${c.slug}`}
                className="group rounded-xl border bg-card hover:border-primary/40 hover:shadow-sm hover:-translate-y-0.5 transition-all p-5 text-center"
              >
                <div className="font-semibold text-sm group-hover:text-primary transition-colors">{c.name}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <section className="container py-14">
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Highlights</h2>
            <Link href="/produkte" className="text-sm font-medium text-primary hover:underline">
              Alle ansehen →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Newest */}
      <section className="container py-14">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Neu eingetroffen</h2>
          <Link href="/produkte" className="text-sm font-medium text-primary hover:underline">
            Alle ansehen →
          </Link>
        </div>
        {newest.length === 0 ? (
          <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
            <p className="font-medium">Noch keine Produkte vorhanden.</p>
            <p className="text-xs mt-1">Im Admin unter „Produkte" anlegen, um sie hier anzuzeigen.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {newest.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
