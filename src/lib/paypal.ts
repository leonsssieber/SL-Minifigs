// PayPal REST API Helper (Order Create + Capture + Webhook-Verify)
// Verwendet PayPal v2 Orders API direkt (kein SDK nötig).

const PAYPAL_BASE = process.env.PAYPAL_ENV === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

export function isPayPalConfigured(): boolean {
  return !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

async function getAccessToken(): Promise<string> {
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new Error("PayPal not configured");

  const auth = Buffer.from(`${id}:${secret}`).toString("base64");
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`PayPal auth failed: ${res.status}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export interface PayPalOrderItem {
  name: string;
  quantity: number;
  unit_amount: { currency_code: string; value: string };
}

export async function createPayPalOrder(args: {
  amount: number;
  currency: string;
  items: PayPalOrderItem[];
  shippingAmount: number;
  orderNumber: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<{ id: string; approveUrl: string }> {
  const token = await getAccessToken();
  const itemTotal = args.items.reduce(
    (sum, i) => sum + parseFloat(i.unit_amount.value) * i.quantity,
    0
  );
  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: args.orderNumber,
          custom_id: args.orderNumber,
          invoice_id: args.orderNumber,
          amount: {
            currency_code: args.currency,
            value: args.amount.toFixed(2),
            breakdown: {
              item_total: { currency_code: args.currency, value: itemTotal.toFixed(2) },
              shipping: { currency_code: args.currency, value: args.shippingAmount.toFixed(2) },
            },
          },
          items: args.items,
        },
      ],
      application_context: {
        brand_name: process.env.NEXT_PUBLIC_SHOP_NAME ?? "SL Minifigs",
        user_action: "PAY_NOW",
        return_url: args.returnUrl,
        cancel_url: args.cancelUrl,
      },
    }),
  });
  if (!res.ok) throw new Error(`PayPal create order failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { id: string; links: { rel: string; href: string }[] };
  const approve = data.links.find((l) => l.rel === "approve");
  return { id: data.id, approveUrl: approve?.href ?? "" };
}

export async function capturePayPalOrder(orderId: string): Promise<{
  status: string;
  captureId?: string;
  capturedAmount?: string;
  capturedCurrency?: string;
}> {
  const token = await getAccessToken();
  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`PayPal capture failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
  return {
    status: data.status,
    captureId: capture?.id,
    capturedAmount: capture?.amount?.value,
    capturedCurrency: capture?.amount?.currency_code,
  };
}

export async function verifyPayPalWebhook(args: {
  headers: Record<string, string | undefined>;
  body: string;
  webhookId: string;
}): Promise<boolean> {
  const token = await getAccessToken();
  const res = await fetch(`${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_algo: args.headers["paypal-auth-algo"],
      cert_url: args.headers["paypal-cert-url"],
      transmission_id: args.headers["paypal-transmission-id"],
      transmission_sig: args.headers["paypal-transmission-sig"],
      transmission_time: args.headers["paypal-transmission-time"],
      webhook_id: args.webhookId,
      webhook_event: JSON.parse(args.body),
    }),
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { verification_status: string };
  return data.verification_status === "SUCCESS";
}
