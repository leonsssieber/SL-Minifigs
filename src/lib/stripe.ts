import Stripe from "stripe";

const apiKey = process.env.STRIPE_SECRET_KEY;

export const stripe = apiKey
  ? new Stripe(apiKey, { apiVersion: "2025-02-24.acacia" })
  : null;

export function isStripeConfigured(): boolean {
  return !!apiKey;
}
