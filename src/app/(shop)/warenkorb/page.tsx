import { CartView } from "./cart-view";

export const metadata = { title: "Warenkorb" };

export default function CartPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Warenkorb</h1>
      <CartView />
    </div>
  );
}
