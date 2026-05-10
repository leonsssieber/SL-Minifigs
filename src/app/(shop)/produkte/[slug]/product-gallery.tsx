"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface Img { id: string; url: string; alt: string | null }

export function ProductGallery({ images, productName }: { images: Img[]; productName: string }) {
  const [current, setCurrent] = useState(0);
  if (images.length === 0) {
    return <div className="aspect-square rounded-xl bg-muted grid place-items-center text-muted-foreground">Kein Bild</div>;
  }
  const img = images[current];
  return (
    <div className="space-y-3">
      <div className="relative aspect-square rounded-xl overflow-hidden bg-muted border">
        <Image
          src={img.url}
          alt={img.alt ?? productName}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
          className="object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((im, i) => (
            <button
              key={im.id}
              type="button"
              onClick={() => setCurrent(i)}
              className={cn(
                "relative aspect-square rounded-md overflow-hidden border bg-muted",
                i === current ? "border-primary ring-2 ring-primary ring-offset-1" : ""
              )}
            >
              <Image src={im.url} alt="" fill sizes="100px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
