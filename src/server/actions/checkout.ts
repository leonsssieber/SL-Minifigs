"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { checkoutSchema } from "@/lib/validation";
import { calculateShipping } from "@/lib/shipping";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { createPayPalOrder, isPayPalConfigured } from "@/lib/paypal";
import { generateOrderNumber, decimalToNumber } from "@/lib/utils";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import type { ActionResult } from "@/server/actions/auth";

export interface CartItemForServer {
  productId: string;
  quantity: number;
}

export async function calculateShippingForCart(items: CartItemForServer[]) {
  if (items.length === 0) return { options: [], cheapest: null, forcedMethodId: null };

  const productIds = items.map((i) => i.productId);
  const [products, methods, rules] = await Promise.all([
    db.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true, price: true, weightGrams: true, shippingCategory: true,
        customShippingMethodId: true, stockQuantity: true, active: true,
      },
    }),
    db.shippingMethod.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    db.shippingRule.findMany({ where: { active: true } }),
  ]);

  const shippingItems = items
    .map((it) => {
      const p = products.find((x) => x.id === it.productId);
      if (!p) return null;
      return {
        productId: it.productId,
        quantity: it.quantity,
        price: decimalToNumber(p.price),
        shippingCategory: p.shippingCategory,
        weightGrams: p.weightGrams,
        customShippingMethodId: p.customShippingMethodId,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x != null);

  const calc = calculateShipping(shippingItems, methods, rules);
  return {
    options: calc.options.map((o) => ({
      methodId: o.methodId, methodName: o.methodName,
      description: o.description, price: o.price, isCheapest: o.isCheapest,
    })),
    cheapest: calc.cheapest,
    forcedMethodId: calc.forcedMethodId,
  };
}

export async function placeOrderAction(
  formData: FormData,
  cartItems: CartItemForServer[]
): Promise<ActionResult<{ orderId: string; redirectUrl?: string; paypalOrderId?: string }>> {
  const ip = getClientIp(await headers());
  const rl = await rateLimit(`checkout:${ip}`, 10, 60);
  if (!rl.success) {
    return { ok: false, error: `Zu viele Versuche. Bitte in ${rl.resetIn}s erneut.` };
  }

  const session = await auth();

  const raw = {
    email: formData.get("email"),
    shippingFirstName: formData.get("shippingFirstName"),
    shippingLastName: formData.get("shippingLastName"),
    shippingCompany: formData.get("shippingCompany") || null,
    shippingStreet: formData.get("shippingStreet"),
    shippingStreet2: formData.get("shippingStreet2") || null,
    shippingZip: formData.get("shippingZip"),
    shippingCity: formData.get("shippingCity"),
    shippingCountry: formData.get("shippingCountry") ?? "CH",
    shippingPhone: formData.get("shippingPhone") || null,
    shippingMethodId: formData.get("shippingMethodId"),
    paymentProvider: formData.get("paymentProvider"),
    customerNotes: formData.get("customerNotes") || null,
    acceptTerms: formData.get("acceptTerms") === "on" || formData.get("acceptTerms") === "true",
    website: formData.get("website") ?? "",
  };
  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Bitte alle Felder ausfüllen.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  const data = parsed.data;
  if (data.website) return { ok: false, error: "Bestellung nicht möglich." };
  if (cartItems.length === 0) return { ok: false, error: "Warenkorb ist leer." };

  // Lade Produkte + Bestand-Check
  const productIds = cartItems.map((i) => i.productId);
  const products = await db.product.findMany({
    where: { id: { in: productIds }, active: true },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
  });
  if (products.length !== productIds.length) {
    return { ok: false, error: "Einige Produkte sind nicht mehr verfügbar." };
  }
  for (const item of cartItems) {
    const p = products.find((x) => x.id === item.productId);
    if (!p || p.stockQuantity < item.quantity) {
      return { ok: false, error: `„${p?.name ?? "Produkt"}" ist nicht in dieser Menge verfügbar.` };
    }
  }

  // Versandberechnung server-seitig (anti-tampering!)
  const shippingItems = cartItems.map((it) => {
    const p = products.find((x) => x.id === it.productId)!;
    return {
      productId: it.productId,
      quantity: it.quantity,
      price: decimalToNumber(p.price),
      shippingCategory: p.shippingCategory,
      weightGrams: p.weightGrams,
      customShippingMethodId: p.customShippingMethodId,
    };
  });
  const methods = await db.shippingMethod.findMany({ where: { active: true } });
  const rules = await db.shippingRule.findMany({ where: { active: true } });
  const calc = calculateShipping(shippingItems, methods, rules);
  const chosenOption = calc.options.find((o) => o.methodId === data.shippingMethodId);
  if (!chosenOption) {
    return { ok: false, error: "Versandmethode nicht verfügbar." };
  }

  const subtotal = shippingItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const shippingCost = chosenOption.price;
  const total = subtotal + shippingCost;

  // Order anlegen (PENDING)
  const orderNumber = generateOrderNumber();
  const order = await db.$transaction(async (tx) => {
    const o = await tx.order.create({
      data: {
        orderNumber,
        userId: session?.user?.id ?? null,
        guestEmail: session?.user ? null : data.email.toLowerCase(),
        status: "PENDING",
        subtotal,
        shippingCost,
        total,
        currency: "CHF",
        shippingMethodId: data.shippingMethodId,
        shippingMethodName: chosenOption.methodName,
        shippingFirstName: data.shippingFirstName,
        shippingLastName: data.shippingLastName,
        shippingCompany: data.shippingCompany,
        shippingStreet: data.shippingStreet,
        shippingStreet2: data.shippingStreet2,
        shippingZip: data.shippingZip,
        shippingCity: data.shippingCity,
        shippingCountry: data.shippingCountry,
        shippingPhone: data.shippingPhone,
        paymentProvider: data.paymentProvider,
        paymentStatus: "PENDING",
        customerNotes: data.customerNotes,
        items: {
          create: cartItems.map((it) => {
            const p = products.find((x) => x.id === it.productId)!;
            return {
              productId: p.id,
              productName: p.name,
              productSku: p.sku,
              condition: p.condition,
              unitPrice: p.price,
              quantity: it.quantity,
              lineTotal: decimalToNumber(p.price) * it.quantity,
              imageUrl: p.images[0]?.url ?? null,
            };
          }),
        },
      },
    });
    // Bestand reservieren (sofort runterzählen — bei Cancel später wieder hochzählen)
    for (const it of cartItems) {
      await tx.product.update({
        where: { id: it.productId },
        data: { stockQuantity: { decrement: it.quantity } },
      });
    }
    return o;
  });

  const baseUrl = process.env.NEXT_PUBLIC_SHOP_URL ?? "http://localhost:3000";

  // Stripe
  if (data.paymentProvider === "STRIPE") {
    if (!isStripeConfigured() || !stripe) {
      return { ok: false, error: "Stripe ist nicht konfiguriert." };
    }
    const stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: data.email,
      line_items: [
        ...cartItems.map((it) => {
          const p = products.find((x) => x.id === it.productId)!;
          return {
            quantity: it.quantity,
            price_data: {
              currency: "chf",
              unit_amount: Math.round(decimalToNumber(p.price) * 100),
              product_data: {
                name: p.name,
                description: p.shortDescription ?? undefined,
                images: p.images[0] ? [p.images[0].url] : undefined,
              },
            },
          };
        }),
        {
          quantity: 1,
          price_data: {
            currency: "chf",
            unit_amount: Math.round(shippingCost * 100),
            product_data: { name: `Versand: ${chosenOption.methodName}` },
          },
        },
      ],
      success_url: `${baseUrl}/bestellung/${order.orderNumber}?paid=1`,
      cancel_url: `${baseUrl}/kasse?cancelled=1`,
      metadata: { orderId: order.id, orderNumber: order.orderNumber },
      payment_intent_data: {
        metadata: { orderId: order.id, orderNumber: order.orderNumber },
      },
    });

    await db.order.update({
      where: { id: order.id },
      data: { paymentId: stripeSession.id },
    });
    return { ok: true, data: { orderId: order.id, redirectUrl: stripeSession.url ?? undefined } };
  }

  // PayPal
  if (data.paymentProvider === "PAYPAL") {
    if (!isPayPalConfigured()) {
      return { ok: false, error: "PayPal ist nicht konfiguriert." };
    }
    const ppOrder = await createPayPalOrder({
      amount: total,
      currency: "CHF",
      items: cartItems.map((it) => {
        const p = products.find((x) => x.id === it.productId)!;
        return {
          name: p.name.slice(0, 127),
          quantity: it.quantity,
          unit_amount: { currency_code: "CHF", value: decimalToNumber(p.price).toFixed(2) },
        };
      }),
      shippingAmount: shippingCost,
      orderNumber: order.orderNumber,
      returnUrl: `${baseUrl}/api/paypal/capture?orderId=${order.id}`,
      cancelUrl: `${baseUrl}/kasse?cancelled=1`,
    });
    await db.order.update({
      where: { id: order.id },
      data: { paymentId: ppOrder.id },
    });
    return { ok: true, data: { orderId: order.id, redirectUrl: ppOrder.approveUrl, paypalOrderId: ppOrder.id } };
  }

  revalidatePath("/admin/bestellungen");
  return { ok: true, data: { orderId: order.id } };
}
