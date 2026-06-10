import { CartView } from "./cart-view";

export const metadata = { title: "Warenkorb" };

export default function CartPage() {
  return (
    <div className="container py-10">
      <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-tight mb-8">Warenkorb</h1>
      <CartView />
    </div>
  );
}
