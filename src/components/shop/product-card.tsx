import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
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
      className="group flex flex-col rounded-xl border bg-card overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="relative aspect-square bg-muted overflow-hidden">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt ?? product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-muted-foreground text-xs">
            Kein Bild
          </div>
        )}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          <Badge variant="secondary" className="text-[10px]">{conditionLabel(product.condition)}</Badge>
          {comparePrice && comparePrice > price && (
            <Badge variant="destructive" className="text-[10px]">
              −{Math.round(((comparePrice - price) / comparePrice) * 100)}%
            </Badge>
          )}
        </div>
        {isSoldOut && (
          <div className="absolute inset-0 bg-background/80 grid place-items-center">
            <span className="font-semibold">Verkauft</span>
          </div>
        )}
      </div>
      <div className="flex-1 p-4 flex flex-col gap-2">
        <h3 className="font-medium text-sm line-clamp-2 leading-snug">{product.name}</h3>
        <div className="mt-auto flex items-baseline gap-2">
          <span className="font-bold text-lg">{formatCHF(price)}</span>
          {comparePrice && comparePrice > price && (
            <span className="text-xs text-muted-foreground line-through">
              {formatCHF(comparePrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
