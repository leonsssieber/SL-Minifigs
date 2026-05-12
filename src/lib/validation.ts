import { z } from "zod";

// ============================================================
// AUTH
// ============================================================

export const registerSchema = z.object({
  email: z.string().email("Ungültige Email-Adresse").max(255),
  password: z
    .string()
    .min(8, "Mindestens 8 Zeichen")
    .max(100)
    .regex(/[a-z]/, "Mindestens ein Kleinbuchstabe")
    .regex(/[A-Z]/, "Mindestens ein Grossbuchstabe")
    .regex(/[0-9]/, "Mindestens eine Zahl"),
  name: z.string().min(2, "Mindestens 2 Zeichen").max(100),
  // Honeypot (muss leer bleiben)
  website: z.string().max(0).optional().or(z.literal("")),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Ungültige Email-Adresse"),
  password: z.string().min(1, "Passwort erforderlich"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const passwordResetRequestSchema = z.object({
  email: z.string().email("Ungültige Email-Adresse"),
});

export const passwordResetSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, "Mindestens 8 Zeichen")
    .max(100)
    .regex(/[a-z]/, "Mindestens ein Kleinbuchstabe")
    .regex(/[A-Z]/, "Mindestens ein Grossbuchstabe")
    .regex(/[0-9]/, "Mindestens eine Zahl"),
});

// ============================================================
// PRODUCTS
// ============================================================

export const productConditionEnum = z.enum(["NEU", "WIE_NEU", "GEBRAUCHT_GUT", "GEBRAUCHT_FAIR"]);
export const stockTypeEnum = z.enum(["UNIQUE", "MULTIPLE"]);

export const productSchema = z.object({
  name: z.string().min(2, "Mindestens 2 Zeichen").max(200),
  slug: z.string().min(2).max(200).regex(/^[a-z0-9-]+$/, "Nur Kleinbuchstaben, Zahlen, Bindestriche"),
  description: z.string().min(10, "Mindestens 10 Zeichen").max(10000),
  shortDescription: z.string().max(500).optional().nullable(),
  categoryId: z.string().min(1, "Kategorie erforderlich"),
  condition: productConditionEnum,
  price: z.coerce.number().min(0).max(1000000),
  comparePrice: z.coerce.number().min(0).max(1000000).optional().nullable(),
  stockType: stockTypeEnum.default("UNIQUE"),
  stockQuantity: z.coerce.number().int().min(0).max(10000).default(1),
  sku: z.string().max(50).optional().nullable(),
  legoSetNumber: z.string().max(20).optional().nullable(),
  weightGrams: z.coerce.number().int().min(0).max(50000).optional().nullable(),
  shippingCategory: z.string().max(50).optional().nullable(),
  customShippingMethodId: z.string().optional().nullable(),
  shippingOptions: z
    .array(
      z.object({
        methodId: z.string().min(1),
        isRecommended: z.boolean().default(false),
      })
    )
    .default([]),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  images: z
    .array(
      z.object({
        url: z.string().url(),
        key: z.string().optional().nullable(),
        alt: z.string().max(200).optional().nullable(),
      })
    )
    .max(10, "Maximal 10 Bilder")
    .default([]),
});
export type ProductInput = z.infer<typeof productSchema>;

export const categorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().max(1000).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  active: z.boolean().default(true),
});
export type CategoryInput = z.infer<typeof categorySchema>;

// ============================================================
// SHIPPING
// ============================================================

export const shippingMethodSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional().nullable(),
  basePrice: z.coerce.number().min(0).max(10000),
  active: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
});
export type ShippingMethodInput = z.infer<typeof shippingMethodSchema>;

export const shippingRuleSchema = z.object({
  name: z.string().min(2).max(100),
  methodId: z.string().min(1),
  priority: z.coerce.number().int().min(0).default(0),
  active: z.boolean().default(true),
  minMinifigures: z.coerce.number().int().min(0).optional().nullable(),
  maxMinifigures: z.coerce.number().int().min(0).optional().nullable(),
  minSets: z.coerce.number().int().min(0).optional().nullable(),
  maxSets: z.coerce.number().int().min(0).optional().nullable(),
  minItems: z.coerce.number().int().min(0).optional().nullable(),
  maxItems: z.coerce.number().int().min(0).optional().nullable(),
  minOrderValue: z.coerce.number().min(0).optional().nullable(),
  maxOrderValue: z.coerce.number().min(0).optional().nullable(),
  minWeightGrams: z.coerce.number().int().min(0).optional().nullable(),
  maxWeightGrams: z.coerce.number().int().min(0).optional().nullable(),
  fixedPrice: z.coerce.number().min(0).optional().nullable(),
  perItemSurcharge: z.coerce.number().min(0).optional().nullable(),
});
export type ShippingRuleInput = z.infer<typeof shippingRuleSchema>;

// ============================================================
// ADDRESS
// ============================================================

export const addressSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  company: z.string().max(100).optional().nullable(),
  street: z.string().min(1).max(200),
  street2: z.string().max(200).optional().nullable(),
  zip: z.string().min(2).max(20),
  city: z.string().min(1).max(100),
  country: z.string().length(2).default("CH"),
  phone: z.string().max(30).optional().nullable(),
  isDefault: z.boolean().default(false),
});
export type AddressInput = z.infer<typeof addressSchema>;

// ============================================================
// CHECKOUT
// ============================================================

export const checkoutSchema = z.object({
  email: z.string().email().max(255),
  shippingFirstName: z.string().min(1).max(100),
  shippingLastName: z.string().min(1).max(100),
  shippingCompany: z.string().max(100).optional().nullable(),
  shippingStreet: z.string().min(1).max(200),
  shippingStreet2: z.string().max(200).optional().nullable(),
  shippingZip: z.string().min(2).max(20),
  shippingCity: z.string().min(1).max(100),
  shippingCountry: z.string().length(2).default("CH"),
  shippingPhone: z.string().max(30).optional().nullable(),
  shippingMethodId: z.string().min(1, "Versandmethode erforderlich"),
  paymentProvider: z.enum(["STRIPE", "PAYPAL"]),
  customerNotes: z.string().max(1000).optional().nullable(),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: "Bitte AGB akzeptieren" }),
  }),
  // Honeypot
  website: z.string().max(0).optional().or(z.literal("")),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

// ============================================================
// CONTACT
// ============================================================

export const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  subject: z.string().min(2).max(200),
  message: z.string().min(10).max(5000),
  website: z.string().max(0).optional().or(z.literal("")),
});

// ============================================================
// ANKAUF
// ============================================================

export const ankaufSubmitSchema = z.object({
  name: z.string().min(2, "Mindestens 2 Zeichen").max(100),
  email: z.string().email("Ungültige Email-Adresse").max(255),
  phone: z.string().max(30).optional().nullable(),
  description: z.string().min(20, "Mindestens 20 Zeichen (beschreibe deine Artikel genauer)").max(5000),
  desiredPrice: z.coerce.number().min(0.5, "Mindestpreis: CHF 0.50").max(100000),
  images: z
    .array(z.object({ url: z.string().url(), key: z.string() }))
    .min(1, "Mindestens 1 Bild erforderlich")
    .max(8, "Maximal 8 Bilder"),
  website: z.string().max(0).optional().or(z.literal("")), // honeypot
});
export type AnkaufSubmitInput = z.infer<typeof ankaufSubmitSchema>;

export const ankaufStatusValues = [
  "PENDING",
  "ACCEPTED",
  "COUNTER_OFFER",
  "REJECTED",
  "WAITING_SHIPMENT",
  "SHIPPED",
  "VERIFYING",
  "COMPLETED",
  "RETURNED",
] as const;
export type AnkaufStatus = (typeof ankaufStatusValues)[number];

export const ankaufAdminResponseSchema = z.object({
  status: z.enum(ankaufStatusValues),
  adminNote: z.string().max(2000).optional().nullable(),
  offeredPrice: z.coerce.number().min(0).max(100000).optional().nullable(),
  payoutAmount: z.coerce.number().min(0).max(100000).optional().nullable(),
  payoutNote: z.string().max(500).optional().nullable(),
});

export const ankaufShipSchema = z.object({
  shippingMethod: z.enum(["brief", "einschreiben", "paket"], {
    required_error: "Bitte eine Versandmethode wählen.",
  }),
  trackingCode: z.string().max(100).optional().nullable(),
});

// ============================================================
// ORDER MANAGEMENT (Admin)
// ============================================================

export const orderUpdateSchema = z.object({
  status: z.enum([
    "PENDING",
    "PAID",
    "PROCESSING",
    "SHIPPED",
    "COMPLETED",
    "CANCELLED",
    "REFUNDED",
  ]),
  trackingNumber: z.string().max(100).optional().nullable(),
  trackingProvider: z.string().max(100).optional().nullable(),
  trackingUrl: z.string().url().optional().nullable().or(z.literal("")),
  adminNotes: z.string().max(5000).optional().nullable(),
});
