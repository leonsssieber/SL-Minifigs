import { cache } from "react";
import { db } from "@/lib/db";

export interface ConditionOption {
  value: string;
  label: string;
}

// Eingebaute Standard-Zustände. Werden verwendet, solange der Admin noch keine
// eigenen Zustände in der Datenbank angelegt hat — so funktioniert der Shop
// sofort, auch ohne Seed.
export const DEFAULT_CONDITIONS: ConditionOption[] = [
  { value: "NEU", label: "Neu (OVP)" },
  { value: "WIE_NEU", label: "Wie Neu" },
  { value: "GEBRAUCHT_GUT", label: "Gebraucht – Gut" },
  { value: "GEBRAUCHT_FAIR", label: "Gebraucht – Fair" },
];

/**
 * Aktive Zustände für Storefront & Produktformular. Fällt auf die
 * Standard-Zustände zurück, wenn noch keine in der DB angelegt sind.
 * `cache()` dedupliziert die Abfrage innerhalb eines Requests.
 */
export const getProductConditions = cache(async (): Promise<ConditionOption[]> => {
  const rows = await db.productCondition.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    select: { value: true, label: true },
  });
  return rows.length > 0 ? rows : DEFAULT_CONDITIONS;
});

/**
 * Löst einen gespeicherten Zustands-Wert in seinen Anzeigenamen auf.
 * Unbekannte Werte (z.B. ein gelöschter Zustand auf einer Altbestellung)
 * werden unverändert zurückgegeben.
 */
export const getConditionLabel = cache(async (value: string): Promise<string> => {
  const list = await getProductConditions();
  return list.find((c) => c.value === value)?.label ?? value;
});

/**
 * Erzeugt aus einem Label einen stabilen, eindeutigen Wert (Code), der in
 * Product.condition gespeichert wird. Beispiel: "Defekt / Bastler" → "DEFEKT_BASTLER".
 */
export function conditionValueFromLabel(label: string): string {
  const base = label
    .toUpperCase()
    .replace(/Ä/g, "AE").replace(/Ö/g, "OE").replace(/Ü/g, "UE").replace(/ß/g, "SS")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return base || "ZUSTAND";
}
