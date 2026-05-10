import { db } from "@/lib/db";
import { ShippingManager } from "./shipping-manager";
import { decimalToNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Versand" };

export default async function ShippingAdminPage() {
  const [methods, rules] = await Promise.all([
    db.shippingMethod.findMany({ orderBy: { sortOrder: "asc" } }),
    db.shippingRule.findMany({ orderBy: { priority: "desc" } }),
  ]);

  const cleanMethods = methods.map((m) => ({
    id: m.id, name: m.name, description: m.description,
    basePrice: decimalToNumber(m.basePrice), active: m.active, sortOrder: m.sortOrder,
  }));
  const cleanRules = rules.map((r) => ({
    id: r.id, name: r.name, methodId: r.methodId, priority: r.priority, active: r.active,
    minMinifigures: r.minMinifigures, maxMinifigures: r.maxMinifigures,
    minSets: r.minSets, maxSets: r.maxSets,
    minItems: r.minItems, maxItems: r.maxItems,
    minOrderValue: r.minOrderValue != null ? decimalToNumber(r.minOrderValue) : null,
    maxOrderValue: r.maxOrderValue != null ? decimalToNumber(r.maxOrderValue) : null,
    minWeightGrams: r.minWeightGrams, maxWeightGrams: r.maxWeightGrams,
    fixedPrice: r.fixedPrice != null ? decimalToNumber(r.fixedPrice) : null,
    perItemSurcharge: r.perItemSurcharge != null ? decimalToNumber(r.perItemSurcharge) : null,
  }));

  return (
    <div className="p-8 space-y-8 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold">Versand</h1>
        <p className="text-muted-foreground">
          Methoden und Regeln. Beispiel: „bis 20 Minifiguren = Brief CHF 1.40".
        </p>
      </div>
      <ShippingManager methods={cleanMethods} rules={cleanRules} />
    </div>
  );
}
