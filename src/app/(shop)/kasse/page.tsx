import { auth } from "@/lib/auth";
import { getSettings } from "@/server/actions/settings";
import { CheckoutFlow } from "./checkout-flow";

export const metadata = { title: "Kasse" };

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ cancelled?: string; error?: string }>;
}) {
  const session = await auth();
  const sp = await searchParams;
  const stripeAvailable = !!process.env.STRIPE_SECRET_KEY;
  const paypalAvailable = !!process.env.PAYPAL_CLIENT_ID;
  const settings = await getSettings(["shop_twint_enabled"]);
  const twintEnabled = settings.shop_twint_enabled === "true";

  return (
    <div className="container py-10">
      <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-tight mb-6">Kasse</h1>
      {sp.cancelled && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Bezahlung abgebrochen — du kannst es erneut versuchen.
        </div>
      )}
      {sp.error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          Bei der Bezahlung ist etwas schiefgelaufen ({sp.error}).
        </div>
      )}
      <CheckoutFlow
        defaultEmail={session?.user?.email ?? ""}
        defaultName={session?.user?.name ?? ""}
        stripeAvailable={stripeAvailable}
        paypalAvailable={paypalAvailable}
        twintEnabled={twintEnabled}
      />
    </div>
  );
}
