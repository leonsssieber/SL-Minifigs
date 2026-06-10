import Link from "next/link";
import Image from "next/image";
import { conditionLabel, formatCHF, decimalToNumber } from "@/lib/utils";

export interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  price: { toString(): string } | number;
  comparePrice?: { toString(): string } | number | null;
  condition: string;
  images: { url: string; alt?: string | null }[];
  stockType: string;
  stockQuantity: number;
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const image = product.images[0];
  const price = decimalToNumber(product.price);
  const comparePrice = product.comparePrice != null ? decimalToNumber(product.comparePrice) : null;
  const isSoldOut = product.stockQuantity <= 0;

  return (
    <Link
      href={`/produkte/${product.slug}`}
      className="group flex flex-col rounded-lg border bg-card overflow-hidden transition-colors hover:border-foreground/25"
    >
      <div className="relative aspect-square bg-muted/50 overflow-hidden">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt ?? product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-muted-foreground text-xs">
            Kein Bild
          </div>
        )}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          <span className="rounded-md bg-background/85 backdrop-blur-sm border px-2 py-0.5 text-[11px] font-medium">
            {conditionLabel(product.condition)}
          </span>
          {comparePrice && comparePrice > price && (
            <span className="rounded-md bg-primary text-primary-foreground px-2 py-0.5 text-[11px] font-medium">
              −{Math.round(((comparePrice - price) / comparePrice) * 100)}%
            </span>
          )}
        </div>
        {isSoldOut && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px] grid place-items-center">
            <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
              Verkauft
            </span>
          </div>
        )}
      </div>
      <div className="flex-1 p-3 sm:p-4 flex flex-col gap-2 min-w-0">
        <h3 className="font-medium text-sm line-clamp-2 leading-snug break-words">{product.name}</h3>
        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-0.5 min-w-0">
          <span className="font-semibold text-[15px] whitespace-nowrap">{formatCHF(price)}</span>
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
