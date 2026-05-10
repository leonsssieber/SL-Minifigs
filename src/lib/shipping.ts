// Versand-Calculator
// Reine Funktion: nimmt Cart-Items, Methoden und Regeln,
// gibt zurück, welche Methoden gültig sind und welche die günstigste ist.

import { decimalToNumber } from "@/lib/utils";

export interface ShippingItem {
  productId: string;
  quantity: number;
  price: number;
  shippingCategory?: string | null; // z.B. "minifigure", "small_set", "large_set"
  weightGrams?: number | null;
  customShippingMethodId?: string | null;
}

// Wir akzeptieren beide Formen: Prisma-Modelle (mit Decimal) und einfache JS-Objekte
type DecimalLike = number | string | { toString(): string } | null | undefined;

export interface ShippingMethodLike {
  id: string;
  name: string;
  description?: string | null;
  basePrice: DecimalLike;
  active: boolean;
  sortOrder: number;
}

export interface ShippingRuleLike {
  id: string;
  name: string;
  methodId: string;
  priority: number;
  active: boolean;
  minMinifigures?: number | null;
  maxMinifigures?: number | null;
  minSets?: number | null;
  maxSets?: number | null;
  minItems?: number | null;
  maxItems?: number | null;
  minOrderValue?: DecimalLike;
  maxOrderValue?: DecimalLike;
  minWeightGrams?: number | null;
  maxWeightGrams?: number | null;
  fixedPrice?: DecimalLike;
  perItemSurcharge?: DecimalLike;
}

export interface ShippingOption {
  methodId: string;
  methodName: string;
  description?: string | null;
  price: number;
  matchedRuleName?: string;
  isCheapest: boolean;
}

export interface ShippingCalculation {
  options: ShippingOption[];
  cheapest: ShippingOption | null;
  forcedMethodId?: string | null; // wenn ein Produkt einen Override erzwingt
  context: ShippingContext;
}

export interface ShippingContext {
  totalItems: number;
  minifigureCount: number;
  setCount: number; // alle "set"-artigen Kategorien
  totalWeight: number;
  orderValue: number;
}

const SET_CATEGORIES = ["small_set", "large_set", "set", "kleines_set", "grosses_set"];
const MINIFIGURE_CATEGORIES = ["minifigure", "minifigur"];

function buildContext(items: ShippingItem[]): ShippingContext {
  let totalItems = 0;
  let minifigureCount = 0;
  let setCount = 0;
  let totalWeight = 0;
  let orderValue = 0;

  for (const item of items) {
    totalItems += item.quantity;
    orderValue += item.price * item.quantity;
    totalWeight += (item.weightGrams ?? 0) * item.quantity;

    const cat = item.shippingCategory?.toLowerCase().trim() ?? "";
    if (MINIFIGURE_CATEGORIES.includes(cat)) {
      minifigureCount += item.quantity;
    } else if (SET_CATEGORIES.includes(cat)) {
      setCount += item.quantity;
    }
  }

  return { totalItems, minifigureCount, setCount, totalWeight, orderValue };
}

function ruleMatches(rule: ShippingRuleLike, ctx: ShippingContext): boolean {
  if (!rule.active) return false;
  const inRange = (value: number, min?: number | null, max?: number | null) => {
    if (min != null && value < min) return false;
    if (max != null && value > max) return false;
    return true;
  };
  if (!inRange(ctx.minifigureCount, rule.minMinifigures, rule.maxMinifigures)) return false;
  if (!inRange(ctx.setCount, rule.minSets, rule.maxSets)) return false;
  if (!inRange(ctx.totalItems, rule.minItems, rule.maxItems)) return false;
  if (!inRange(ctx.totalWeight, rule.minWeightGrams, rule.maxWeightGrams)) return false;
  const minVal = decimalToNumber(rule.minOrderValue);
  const maxVal = decimalToNumber(rule.maxOrderValue);
  if (rule.minOrderValue != null && ctx.orderValue < minVal) return false;
  if (rule.maxOrderValue != null && ctx.orderValue > maxVal) return false;
  return true;
}

function rulePrice(rule: ShippingRuleLike, basePrice: number, ctx: ShippingContext): number {
  const fixed = decimalToNumber(rule.fixedPrice);
  const surcharge = decimalToNumber(rule.perItemSurcharge);
  let price = rule.fixedPrice != null ? fixed : basePrice;
  if (rule.perItemSurcharge != null) {
    price += surcharge * ctx.totalItems;
  }
  return Math.max(0, price);
}

/**
 * Berechnet alle gültigen Versandoptionen für einen Cart.
 *
 * Logik:
 *  1. Wenn eines der Produkte einen `customShippingMethodId` hat, wird **nur**
 *     diese Methode angeboten (Override). Falls mehrere Produkte verschiedene
 *     Overrides erzwingen, wird die teuerste verwendet (sicherer).
 *  2. Sonst werden für jede aktive Methode die Regeln nach Priorität geprüft.
 *     Methode wird nur angeboten, wenn:
 *       - mind. eine Regel matched UND ihre Konditionen passen, ODER
 *       - die Methode keine Regeln hat (Fallback) — dann gilt sie immer.
 *  3. Preis kommt von erster passender Regel (höchste Priorität),
 *     sonst Basispreis.
 */
export function calculateShipping(
  items: ShippingItem[],
  methods: ShippingMethodLike[],
  rules: ShippingRuleLike[]
): ShippingCalculation {
  const context = buildContext(items);
  const activeMethods = methods.filter((m) => m.active);

  // Override-Check
  const overrides = items
    .map((i) => i.customShippingMethodId)
    .filter((id): id is string => !!id);
  let forcedMethodId: string | null = null;
  if (overrides.length > 0) {
    // Wähle die teuerste Override-Methode (sichere Wahl bei Mix)
    let maxPrice = -1;
    for (const id of overrides) {
      const m = activeMethods.find((x) => x.id === id);
      if (!m) continue;
      const price = decimalToNumber(m.basePrice);
      if (price > maxPrice) {
        maxPrice = price;
        forcedMethodId = id;
      }
    }
  }

  const options: ShippingOption[] = [];
  const methodsToConsider = forcedMethodId
    ? activeMethods.filter((m) => m.id === forcedMethodId)
    : activeMethods;

  for (const method of methodsToConsider) {
    const methodRules = rules
      .filter((r) => r.methodId === method.id && r.active)
      .sort((a, b) => b.priority - a.priority);

    const basePrice = decimalToNumber(method.basePrice);

    if (methodRules.length === 0) {
      // Fallback: Methode ohne Regeln gilt immer
      options.push({
        methodId: method.id,
        methodName: method.name,
        description: method.description,
        price: basePrice,
        isCheapest: false,
      });
      continue;
    }

    // Suche erste passende Regel
    const matchedRule = methodRules.find((r) => ruleMatches(r, context));
    if (matchedRule) {
      options.push({
        methodId: method.id,
        methodName: method.name,
        description: method.description,
        price: rulePrice(matchedRule, basePrice, context),
        matchedRuleName: matchedRule.name,
        isCheapest: false,
      });
    }
  }

  options.sort((a, b) => a.price - b.price);
  if (options.length > 0) options[0].isCheapest = true;

  return {
    options,
    cheapest: options[0] ?? null,
    forcedMethodId,
    context,
  };
}
