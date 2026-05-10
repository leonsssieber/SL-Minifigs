"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useCart } from "@/lib/cart-store";
import { formatCHF } from "@/lib/utils";
import { calculateShippingForCart, placeOrderAction } from "@/server/actions/checkout";

interface ShippingOption {
  methodId: string;
  methodName: string;
  description: string | null | undefined;
  price: number;
  isCheapest: boolean;
}

interface Props {
  defaultEmail: string;
  defaultName: string;
  stripeAvailable: boolean;
  paypalAvailable: boolean;
}

export function CheckoutFlow({ defaultEmail, defaultName, stripeAvailable, paypalAvailable }: Props) {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotal());
  const clear = useCart((s) => s.clear);
  const [mounted, setMounted] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [shippingMethodId, setShippingMethodId] = useState<string>("");
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState<"STRIPE" | "PAYPAL">(
    stripeAvailable ? "STRIPE" : paypalAvailable ? "PAYPAL" : "STRIPE"
  );
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || items.length === 0) return;
    setLoadingShipping(true);
    calculateShippingForCart(items.map((i) => ({ productId: i.productId, quantity: i.quantity })))
      .then((res) => {
        setShippingOptions(res.options);
        if (res.options.length > 0) {
          setShippingMethodId(res.options[0].methodId);
        }
      })
      .finally(() => setLoadingShipping(false));
  }, [mounted, items]);

  if (!mounted) return null;
  if (items.length === 0) {
    return (
      <Card className="p-12 text-center space-y-4">
        <h2 className="text-xl font-semibold">Dein Warenkorb ist leer</h2>
        <Link href="/produkte"><Button>Zu den Produkten</Button></Link>
      </Card>
    );
  }

  const selectedOption = shippingOptions.find((o) => o.methodId === shippingMethodId);
  const shippingCost = selectedOption?.price ?? 0;
  const total = subtotal + shippingCost;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    if (!shippingMethodId) {
      toast.error("Bitte Versandmethode wählen.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    fd.set("shippingMethodId", shippingMethodId);
    fd.set("paymentProvider", paymentProvider);

    start(async () => {
      const result = await placeOrderAction(
        fd,
        items.map((i) => ({ productId: i.productId, quantity: i.quantity }))
      );
      if (!result.ok) {
        toast.error(result.error);
        if (result.fieldErrors) setErrors(result.fieldErrors);
        return;
      }
      // Bestellung angelegt — Cart leeren und weiterleiten
      if (result.data?.redirectUrl) {
        clear();
        window.location.href = result.data.redirectUrl;
      } else {
        clear();
        toast.success("Bestellung aufgegeben");
        router.push("/konto/bestellungen");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} autoComplete="on" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader><CardTitle>Kontakt</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" name="email" type="email" required defaultValue={defaultEmail} />
              {errors.email && <p className="text-xs text-destructive">{errors.email[0]}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Lieferadresse</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shippingFirstName">Vorname *</Label>
                <Input id="shippingFirstName" name="shippingFirstName" required autoComplete="given-name"
                  defaultValue={defaultName.split(" ")[0] ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shippingLastName">Nachname *</Label>
                <Input id="shippingLastName" name="shippingLastName" required autoComplete="family-name"
                  defaultValue={defaultName.split(" ").slice(1).join(" ")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shippingCompany">Firma (optional)</Label>
              <Input id="shippingCompany" name="shippingCompany" autoComplete="organization" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shippingStreet">Strasse + Nr. *</Label>
              <Input id="shippingStreet" name="shippingStreet" required autoComplete="street-address" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shippingStreet2">Adresszusatz (optional)</Label>
              <Input id="shippingStreet2" name="shippingStreet2" autoComplete="address-line2" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shippingZip">PLZ *</Label>
                <Input id="shippingZip" name="shippingZip" required autoComplete="postal-code" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="shippingCity">Ort *</Label>
                <Input id="shippingCity" name="shippingCity" required autoComplete="address-level2" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shippingCountry">Land *</Label>
                <select
                  id="shippingCountry"
                  name="shippingCountry"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  defaultValue="CH"
                  required
                >
                  <option value="CH">Schweiz</option>
                  <option value="LI">Liechtenstein</option>
                  <option value="DE">Deutschland</option>
                  <option value="AT">Österreich</option>
                  <option value="FR">Frankreich</option>
                  <option value="IT">Italien</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="shippingPhone">Telefon (optional)</Label>
                <Input id="shippingPhone" name="shippingPhone" autoComplete="tel" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Versand</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {loadingShipping ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Berechne Versandkosten…
              </div>
            ) : shippingOptions.length === 0 ? (
              <div className="text-sm text-destructive">
                Keine Versandmethode verfügbar. Bitte kontaktiere uns.
              </div>
            ) : (
              shippingOptions.map((o) => (
                <label
                  key={o.methodId}
                  className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                    shippingMethodId === o.methodId ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="_shipping_radio"
                    checked={shippingMethodId === o.methodId}
                    onChange={() => setShippingMethodId(o.methodId)}
                    className="h-4 w-4"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm flex items-center gap-2">
                      {o.methodName}
                      {o.isCheapest && <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded">günstigste</span>}
                    </div>
                    {o.description && <div className="text-xs text-muted-foreground">{o.description}</div>}
                  </div>
                  <div className="font-semibold text-sm">{formatCHF(o.price)}</div>
                </label>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Bezahlung</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {stripeAvailable && (
              <label className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer ${paymentProvider === "STRIPE" ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
                <input type="radio" checked={paymentProvider === "STRIPE"} onChange={() => setPaymentProvider("STRIPE")} className="h-4 w-4" />
                <CreditCard className="h-5 w-5" />
                <div className="flex-1">
                  <div className="font-medium text-sm">Kreditkarte / Debitkarte</div>
                  <div className="text-xs text-muted-foreground">Sicher via Stripe</div>
                </div>
              </label>
            )}
            {paypalAvailable && (
              <label className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer ${paymentProvider === "PAYPAL" ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
                <input type="radio" checked={paymentProvider === "PAYPAL"} onChange={() => setPaymentProvider("PAYPAL")} className="h-4 w-4" />
                <span className="font-bold text-sm text-blue-600">PayPal</span>
                <div className="flex-1">
                  <div className="font-medium text-sm">PayPal</div>
                  <div className="text-xs text-muted-foreground">Bezahlen mit PayPal-Konto</div>
                </div>
              </label>
            )}
            {!stripeAvailable && !paypalAvailable && (
              <div className="text-sm text-destructive p-3">
                Es ist keine Bezahlmethode konfiguriert. Bitte kontaktiere den Shop-Betreiber.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Anmerkung (optional)</CardTitle></CardHeader>
          <CardContent>
            <Textarea name="customerNotes" rows={3} placeholder="z.B. Wunschgeschenkverpackung, Lieferhinweis..." />
          </CardContent>
        </Card>

        {/* Honeypot */}
        <input
          type="text" name="website" tabIndex={-1} autoComplete="off"
          className="absolute -left-[9999px]" aria-hidden="true"
        />
      </div>

      <div>
        <Card className="sticky top-20">
          <CardHeader><CardTitle>Übersicht</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span className="text-muted-foreground line-clamp-1">
                    {item.quantity}× {item.name}
                  </span>
                  <span className="font-medium">{formatCHF(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <Separator />
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Zwischensumme</span>
                <span>{formatCHF(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Versand</span>
                <span>{formatCHF(shippingCost)}</span>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatCHF(total)}</span>
            </div>
            <label className="flex items-start gap-2 text-xs">
              <Checkbox name="acceptTerms" required className="mt-0.5" />
              <span>
                Ich akzeptiere die <Link href="/agb" className="underline">AGB</Link> und die{" "}
                <Link href="/datenschutz" className="underline">Datenschutzerklärung</Link> und das{" "}
                <Link href="/widerruf" className="underline">Widerrufsrecht</Link>.
              </span>
            </label>
            <Button type="submit" size="lg" className="w-full" disabled={pending || shippingOptions.length === 0}>
              {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Wird verarbeitet…</> : "Jetzt bezahlen"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
