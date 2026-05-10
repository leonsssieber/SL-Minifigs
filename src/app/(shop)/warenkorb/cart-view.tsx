"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/lib/cart-store";
import { formatCHF } from "@/lib/utils";

export function CartView() {
  const items = useCart((s) => s.items);
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const subtotal = useCart((s) => s.subtotal());
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <Card className="p-12 text-center space-y-4">
        <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground" />
        <h2 className="text-xl font-semibold">Dein Warenkorb ist leer</h2>
        <p className="text-muted-foreground">Stöbere durch unsere Produkte und füge etwas hinzu.</p>
        <Link href="/produkte">
          <Button>Zu den Produkten</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-3">
        {items.map((item) => (
          <Card key={item.productId} className="p-4 flex gap-4">
            <Link href={`/produkte/${item.slug}`} className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-md overflow-hidden bg-muted">
              {item.imageUrl ? (
                <Image src={item.imageUrl} alt="" fill sizes="100px" className="object-cover" />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-xs text-muted-foreground">Kein Bild</div>
              )}
            </Link>
            <div className="flex-1 min-w-0">
              <Link href={`/produkte/${item.slug}`} className="font-medium hover:underline line-clamp-2">{item.name}</Link>
              <div className="text-sm text-muted-foreground mt-1">
                {formatCHF(item.price)} pro Stück
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="inline-flex items-center border rounded-md">
                  <button
                    type="button"
                    className="h-8 w-8 grid place-items-center hover:bg-muted disabled:opacity-50"
                    onClick={() => setQuantity(item.productId, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-10 text-center text-sm">{item.quantity}</span>
                  <button
                    type="button"
                    className="h-8 w-8 grid place-items-center hover:bg-muted disabled:opacity-50"
                    onClick={() => setQuantity(item.productId, item.quantity + 1)}
                    disabled={item.quantity >= item.maxStock}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => remove(item.productId)}
                  className="ml-auto p-2 text-muted-foreground hover:text-destructive"
                  aria-label="Entfernen"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="text-right font-semibold whitespace-nowrap">
              {formatCHF(item.price * item.quantity)}
            </div>
          </Card>
        ))}
      </div>

      <div>
        <Card className="p-6 sticky top-20 space-y-4">
          <h2 className="font-semibold">Zusammenfassung</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Zwischensumme</span>
              <span className="font-medium">{formatCHF(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Versand</span>
              <span>im Checkout</span>
            </div>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold text-lg">
            <span>Total (vorläufig)</span>
            <span>{formatCHF(subtotal)}</span>
          </div>
          <Link href="/kasse" className="block">
            <Button size="lg" className="w-full">Zur Kasse</Button>
          </Link>
          <Link href="/produkte" className="block text-center text-sm text-primary hover:underline">
            Weiter einkaufen
          </Link>
        </Card>
      </div>
    </div>
  );
}
