import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/shop/product-card";
import { SectionHeader } from "@/components/shop/section-header";

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
      <section className="relative overflow-hidden border-b-2 border-foreground">
        <div className="absolute inset-0 studs-pattern-strong [mask-image:linear-gradient(105deg,transparent_45%,black_75%)]" aria-hidden />
        <div className="container relative py-16 sm:py-24 md:py-28">
          {/* Deko: schwebender 2x2-Stein */}
          <div
            className="hidden lg:block absolute right-24 top-16 rotate-12"
            aria-hidden
          >
            <div className="grid grid-cols-2 gap-1.5 rounded-md border-2 border-foreground bg-primary p-2.5 shadow-brutal">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="h-5 w-5 rounded-full border-2 border-foreground/70 bg-primary brightness-110" />
              ))}
            </div>
          </div>
          <div
            className="hidden lg:block absolute right-56 bottom-16 -rotate-6"
            aria-hidden
          >
            <div className="grid grid-cols-2 gap-1.5 rounded-md border-2 border-foreground bg-accent p-2 shadow-brutal-sm">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="h-4 w-4 rounded-full border-2 border-foreground/60 bg-accent brightness-110" />
              ))}
            </div>
          </div>

          <div className="max-w-2xl">
            <span className="inline-block -rotate-1 rounded-md border-2 border-foreground bg-accent px-3 py-1 text-[11px] font-black uppercase tracking-[0.15em] text-accent-foreground shadow-brutal-sm mb-8">
              Aus der Schweiz · Stück für Stück geprüft
            </span>
            <h1 className="font-display text-[2.6rem] leading-[0.95] sm:text-6xl md:text-7xl font-bold tracking-tight text-balance mb-7 uppercase">
              Minifiguren,
              <br />
              die Sammler{" "}
              <span className="relative inline-block whitespace-nowrap">
                <span className="relative z-10 px-2">lieben.</span>
                <span
                  className="absolute inset-0 -rotate-1 rounded-md border-2 border-foreground bg-accent"
                  aria-hidden
                />
              </span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground mb-10 max-w-xl leading-relaxed">
              Handverlesene LEGO® Minifiguren, Sets und Einzelteile aus zweiter Hand —
              fair bepreist und schnell verschickt.
            </p>
            <div className="flex flex-wrap gap-4">
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

      {/* Marquee-Band */}
      <div className="border-b-2 border-foreground bg-accent overflow-hidden" aria-hidden>
        <div className="flex w-max animate-marquee gap-0 py-2.5">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center">
              {[
                "Geprüfte Qualität",
                "Versand ab CHF 1.40",
                "Sichere Bezahlung mit Stripe & PayPal",
                "Wir kaufen auch dein LEGO an",
                "Schweizer Lager — schneller Versand",
                "Jede Figur ein Original",
              ].map((t) => (
                <span key={t} className="flex items-center font-display text-sm font-bold uppercase tracking-wider text-accent-foreground">
                  <span className="mx-6 inline-block h-3 w-3 rounded-sm border-2 border-foreground bg-primary" />
                  {t}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="container py-16">
          <SectionHeader title="Kategorien" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((c, i) => {
              const palette = [
                "bg-brick-red text-white",
                "bg-brick-yellow text-foreground",
                "bg-brick-blue text-white",
                "bg-brick-green text-white",
              ];
              return (
                <Link
                  key={c.id}
                  href={`/kategorie/${c.slug}`}
                  className={`rounded-lg border-2 border-foreground p-5 text-center font-display font-bold uppercase tracking-wide text-sm shadow-brutal-sm transition-all hover:-translate-y-1 hover:shadow-brutal ${palette[i % palette.length]}`}
                >
                  {c.name}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <section className="container py-16">
          <SectionHeader title="Highlights" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Newest */}
      <section className="container py-16">
        <SectionHeader title="Neu eingetroffen" />
        {newest.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-foreground/30 py-16 text-center text-muted-foreground">
            <p className="font-medium">Bald gibt&apos;s hier Nachschub.</p>
            <p className="text-xs mt-1">Schau in Kürze wieder vorbei — es wird laufend Neues eingestellt.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
            {newest.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Ankauf-Teaser */}
      <section className="border-t-2 border-foreground bg-foreground text-background">
        <div className="container py-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-tight mb-2">
              Kisten voller LEGO im Keller?
            </h2>
            <p className="text-background/70 max-w-xl">
              Wir kaufen deine Minifiguren, Sets und Konvolute — fair bewertet,
              unkompliziert abgewickelt, Auszahlung nach Prüfung.
            </p>
          </div>
          <Link href="/ankauf" className="shrink-0">
            <Button size="lg" variant="accent" className="gap-2 border-background shadow-[4px_4px_0_0_hsl(var(--background))] hover:shadow-[2px_2px_0_0_hsl(var(--background))]">
              Jetzt verkaufen <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
