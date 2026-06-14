export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { ConditionsManager } from "./conditions-manager";

export const metadata = { title: "Zustände" };

export default async function AdminConditionsPage() {
  const [conditions, usage] = await Promise.all([
    db.productCondition.findMany({ orderBy: { sortOrder: "asc" } }),
    db.product.groupBy({ by: ["condition"], _count: { _all: true } }),
  ]);
  const usageMap = new Map(usage.map((u) => [u.condition, u._count._all]));

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Zustände</h1>
        <p className="text-muted-foreground">
          Verwalte die verfügbaren Produkt-Zustände. Diese erscheinen im Produktformular
          und als Filter im Shop.
        </p>
      </div>

      <ConditionsManager
        conditions={conditions.map((c) => ({
          id: c.id,
          value: c.value,
          label: c.label,
          sortOrder: c.sortOrder,
          active: c.active,
          inUse: usageMap.get(c.value) ?? 0,
        }))}
      />
    </div>
  );
}
