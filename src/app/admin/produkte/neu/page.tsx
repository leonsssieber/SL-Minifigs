export const dynamic = "force-dynamic";

import Link from "next/link";
import { db } from "@/lib/db";
import { ProductForm } from "@/components/admin/product-form";
import { getProductConditions } from "@/lib/conditions";

export default async function NewProductPage() {
  const [categories, methods, conditions] = await Promise.all([
    db.productCategory.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    db.shippingMethod.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    getProductConditions(),
  ]);

  if (categories.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-2">Keine Kategorien vorhanden</h1>
        <p className="text-muted-foreground mb-4">Bitte zuerst eine Kategorie anlegen.</p>
        <Link href="/admin/kategorien" className="text-primary hover:underline">→ Zu den Kategorien</Link>
      </div>
    );
  }

  return <ProductForm categories={categories} shippingMethods={methods} conditions={conditions} />;
}