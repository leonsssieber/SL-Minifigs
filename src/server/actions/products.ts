"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/admin";
import { productSchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";
import type { ActionResult } from "@/server/actions/auth";

function parseImages(raw: FormDataEntryValue | null) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw.toString());
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseProductForm(formData: FormData) {
  return {
    name: formData.get("name")?.toString() ?? "",
    slug: (formData.get("slug")?.toString() || slugify(formData.get("name")?.toString() ?? "")),
    description: formData.get("description")?.toString() ?? "",
    shortDescription: formData.get("shortDescription")?.toString() || null,
    categoryId: formData.get("categoryId")?.toString() ?? "",
    condition: formData.get("condition")?.toString() ?? "NEU",
    price: formData.get("price")?.toString() ?? "0",
    comparePrice: formData.get("comparePrice")?.toString() || null,
    stockType: formData.get("stockType")?.toString() ?? "UNIQUE",
    stockQuantity: formData.get("stockQuantity")?.toString() ?? "1",
    sku: formData.get("sku")?.toString() || null,
    legoSetNumber: formData.get("legoSetNumber")?.toString() || null,
    weightGrams: formData.get("weightGrams")?.toString() || null,
    shippingCategory: formData.get("shippingCategory")?.toString() || null,
    customShippingMethodId: formData.get("customShippingMethodId")?.toString() || null,
    active: formData.get("active") === "true" || formData.get("active") === "on",
    featured: formData.get("featured") === "true" || formData.get("featured") === "on",
    images: parseImages(formData.get("images")),
  };
}

export async function createProduct(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const admin = await requireAdmin();
    const raw = parseProductForm(formData);
    const parsed = productSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Bitte Eingaben prüfen.",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }
    const data = parsed.data;

    const slugExists = await db.product.findUnique({ where: { slug: data.slug } });
    if (slugExists) return { ok: false, error: "Slug ist bereits vergeben." };

    const product = await db.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        shortDescription: data.shortDescription,
        categoryId: data.categoryId,
        condition: data.condition,
        price: data.price,
        comparePrice: data.comparePrice,
        stockType: data.stockType,
        stockQuantity: data.stockQuantity,
        sku: data.sku || null,
        legoSetNumber: data.legoSetNumber,
        weightGrams: data.weightGrams,
        shippingCategory: data.shippingCategory,
        customShippingMethodId: data.customShippingMethodId || null,
        active: data.active,
        featured: data.featured,
        images: {
          create: data.images.map((img, i) => ({
            url: img.url,
            key: img.key,
            alt: img.alt,
            sortOrder: i,
          })),
        },
      },
    });

    await logAudit({ userId: admin.id, action: "PRODUCT_CREATED", entity: "Product", entityId: product.id });
    revalidatePath("/admin/produkte");
    revalidatePath("/produkte");
    revalidatePath("/");
    return { ok: true, data: { id: product.id } };
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return { ok: false, error: "Verboten" };
    console.error(e);
    return { ok: false, error: "Fehler beim Anlegen." };
  }
}

export async function updateProduct(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const raw = parseProductForm(formData);
    const parsed = productSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Bitte Eingaben prüfen.",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }
    const data = parsed.data;

    const slugClash = await db.product.findFirst({
      where: { slug: data.slug, NOT: { id } },
    });
    if (slugClash) return { ok: false, error: "Slug ist bereits vergeben." };

    await db.$transaction([
      db.product.update({
        where: { id },
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          shortDescription: data.shortDescription,
          categoryId: data.categoryId,
          condition: data.condition,
          price: data.price,
          comparePrice: data.comparePrice,
          stockType: data.stockType,
          stockQuantity: data.stockQuantity,
          sku: data.sku,
          legoSetNumber: data.legoSetNumber,
          weightGrams: data.weightGrams,
          shippingCategory: data.shippingCategory,
          customShippingMethodId: data.customShippingMethodId || null,
          active: data.active,
          featured: data.featured,
        },
      }),
      db.productImage.deleteMany({ where: { productId: id } }),
      db.productImage.createMany({
        data: data.images.map((img, i) => ({
          productId: id,
          url: img.url,
          key: img.key,
          alt: img.alt,
          sortOrder: i,
        })),
      }),
    ]);

    await logAudit({ userId: admin.id, action: "PRODUCT_UPDATED", entity: "Product", entityId: id });
    revalidatePath("/admin/produkte");
    revalidatePath(`/produkte/${data.slug}`);
    revalidatePath("/produkte");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return { ok: false, error: "Verboten" };
    console.error(e);
    return { ok: false, error: "Fehler beim Speichern." };
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    // Soft-Delete: deaktivieren statt hartem Löschen, falls Order-Items existieren
    const orderCount = await db.orderItem.count({ where: { productId: id } });
    if (orderCount > 0) {
      await db.product.update({ where: { id }, data: { active: false, stockQuantity: 0 } });
    } else {
      await db.product.delete({ where: { id } });
    }
    await logAudit({ userId: admin.id, action: "PRODUCT_DELETED", entity: "Product", entityId: id });
    revalidatePath("/admin/produkte");
    revalidatePath("/produkte");
    return { ok: true };
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return { ok: false, error: "Verboten" };
    console.error(e);
    return { ok: false, error: "Fehler beim Löschen." };
  }
}

export async function toggleProductFeatured(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const product = await db.product.findUnique({ where: { id }, select: { featured: true } });
    if (!product) return { ok: false, error: "Nicht gefunden." };
    await db.product.update({ where: { id }, data: { featured: !product.featured } });
    revalidatePath("/admin/produkte");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return { ok: false, error: "Verboten" };
    return { ok: false, error: "Fehler" };
  }
}
