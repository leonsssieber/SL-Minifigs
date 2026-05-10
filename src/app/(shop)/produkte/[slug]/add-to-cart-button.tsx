"use client";

import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart, type CartItem } from "@/lib/cart-store";

export function AddToCartButton({
  product,
}: {
  product: Omit<CartItem, "quantity">;
}) {
  const add = useCart((s) => s.add);
  const items = useCart((s) => s.items);
  const inCart = items.find((i) => i.productId === product.productId)?.quantity ?? 0;
  const [added, setAdded] = useState(false);

  function handleAdd() {
    add(product);
    setAdded(true);
    toast.success("Zum Warenkorb hinzugefügt");
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <Button
      size="lg"
      onClick={handleAdd}
      disabled={inCart >= product.maxStock}
      className="flex-1 gap-2"
    >
      {added ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
      {inCart >= product.maxStock ? "Maximal im Warenkorb" : "In den Warenkorb"}
    </Button>
  );
}
