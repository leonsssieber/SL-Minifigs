import { CartView } from "./cart-view";

export const metadata = { title: "Warenkorb" };

export default function CartPage() {
  return (
    <div className="container py-10">
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-8">Warenkorb</h1>
      <CartView />
    </div>
  );
}
