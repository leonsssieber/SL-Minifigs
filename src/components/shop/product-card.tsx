import Link from "next/link";
import Image from "next/image";
import { AlertTriangle } from "lucide-react";
import { formatCHF, decimalToNumber } from "@/lib/utils";
import { getConditionLabel } from "@/lib/conditions";

export interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  price: { toString(): string } | number;
  comparePrice?: { toString(): string } | number | null;
  condition: string;
  incomplete?: boolean;
  images: { url: string; alt?: string | null }[];
  stockType: string;
  stockQuantity: number;
}

export async function ProductCard({ product }: { product: ProductCardData }) {
  const image = product.images[0];
  const price = decimalToNumber(product.price);
  const comparePrice = product.comparePrice != null ? decimalToNumber(product.comparePrice) : null;
  const isSoldOut = product.stockQuantity <= 0;
  const condLabel = await getConditionLabel(product.condition);

  return (
    <Link
      href={`/produkte/${product.slug}`}
      className="group flex flex-col rounded-lg border-2 border-foreground bg-card overflow-hidden transition-all hover:-translate-y-1 hover:shadow-brutal"
    >
      <div className="relative aspect-square bg-muted/50 overflow-hidden border-b-2 border-foreground">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt ?? product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-muted-foreground text-xs">
            Kein Bild
          </div>
        )}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
          <span className="-rotate-2 rounded-md border-2 border-foreground bg-background px-2 py-0.5 text-[10px] font-black uppercase tracking-wide">
            {condLabel}
          </span>
          {product.incomplete && (
            <span
              title="Unvollständig — es fehlt etwas"
              className="rotate-1 grid h-[22px] w-[22px] place-items-center rounded-md border-2 border-foreground bg-amber-300 text-foreground"
            >
              <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.75} aria-hidden />
              <span className="sr-only">Unvollständig</span>
            </span>
          )}
          {comparePrice && comparePrice > price && (
            <span className="rotate-1 rounded-md border-2 border-foreground bg-accent text-accent-foreground px-2 py-0.5 text-[10px] font-black">
              −{Math.round(((comparePrice - price) / comparePrice) * 100)}%
            </span>
          )}
        </div>
        {isSoldOut && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px] grid place-items-center">
            <span className="-rotate-3 rounded-md border-2 border-foreground bg-foreground px-3 py-1 text-sm font-black uppercase tracking-widest text-background">
              Verkauft
            </span>
          </div>
        )}
      </div>
      <div className="flex-1 p-3 sm:p-4 flex flex-col gap-2 min-w-0">
        <h3 className="font-medium text-sm line-clamp-2 leading-snug break-words">{product.name}</h3>
        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-0.5 min-w-0">
          <span className="font-display font-bold text-base whitespace-nowrap">{formatCHF(price)}</span>
          {comparePrice && comparePrice > price && (
            <span className="text-xs text-muted-foreground line-through whitespace-nowrap">
              {formatCHF(comparePrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
