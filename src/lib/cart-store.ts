"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  imageUrl?: string;
  quantity: number;
  maxStock: number;
  shippingCategory?: string | null;
  weightGrams?: number | null;
}

interface CartState {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  totalQuantity: () => number;
  subtotal: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId);
          const wantedQty = (existing?.quantity ?? 0) + (item.quantity ?? 1);
          const qty = Math.min(wantedQty, item.maxStock);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId ? { ...i, quantity: qty } : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: qty }] };
        }),
      remove: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
      setQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items
            .map((i) =>
              i.productId === productId
                ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxStock)) }
                : i
            )
            .filter((i) => i.quantity > 0),
        })),
      clear: () => set({ items: [] }),
      totalQuantity: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: "lego-shop-cart" }
  )
);
