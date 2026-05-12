export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProductForm } from "@/components/admin/product-form";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories, methods] = await Promise.all([
    db.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        shippingOptions: { orderBy: { sortOrder: "asc" } },
      },
    }),
    db.productCategory.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    db.shippingMethod.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!product) notFound();

  return (
    <ProductForm
      product={{
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        shortDescription: product.shortDescription,
        categoryId: product.categoryId,
        condition: product.condition,
        price: product.price,
        comparePrice: product.comparePrice,
        stockType: product.stockType,
        stockQuantity: product.stockQuantity,
        sku: product.sku,
        legoSetNumber: product.legoSetNumber,
        weightGrams: product.weightGrams,
        shippingCategory: product.shippingCategory,
        customShippingMethodId: product.customShippingMethodId,
        active: product.active,
        featured: product.featured,
        images: product.images.map((i) => ({ url: i.url, key: i.key, alt: i.alt })),
        shippingOptions: product.shippingOptions.map((o) => ({
          methodId: o.methodId,
          isRecommended: o.isRecommended,
        })),
      }}
      categories={categories}
      shippingMethods={methods}
    />
  );
}