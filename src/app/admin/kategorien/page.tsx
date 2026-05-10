import { db } from "@/lib/db";
import { CategoriesManager } from "./categories-manager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await db.productCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Kategorien</h1>
        <p className="text-muted-foreground">Produkte gruppieren</p>
      </div>
      <CategoriesManager
        categories={categories.map((c) => ({
          id: c.id, name: c.name, slug: c.slug,
          description: c.description, sortOrder: c.sortOrder,
          active: c.active, productCount: c._count.products,
        }))}
      />
    </div>
  );
}
