"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/admin";
import { categorySchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";
import type { ActionResult } from "@/server/actions/auth";

function parse(formData: FormData) {
  return {
    name: formData.get("name")?.toString() ?? "",
    slug: formData.get("slug")?.toString() || slugify(formData.get("name")?.toString() ?? ""),
    description: formData.get("description")?.toString() || null,
    sortOrder: formData.get("sortOrder")?.toString() ?? "0",
    active: formData.get("active") === "true" || formData.get("active") === "on",
  };
}

export async function createCategory(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = categorySchema.safeParse(parse(formData));
    if (!parsed.success) {
      return { ok: false, error: "Bitte Eingaben prüfen.", fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
    }
    const slugExists = await db.productCategory.findUnique({ where: { slug: parsed.data.slug } });
    if (slugExists) return { ok: false, error: "Slug bereits vergeben." };
    const c = await db.productCategory.create({ data: parsed.data });
    await logAudit({ userId: admin.id, action: "CATEGORY_CREATED", entity: "ProductCategory", entityId: c.id });
    revalidatePath("/admin/kategorien");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return { ok: false, error: "Verboten" };
    return { ok: false, error: "Fehler beim Anlegen." };
  }
}

export async function updateCategory(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = categorySchema.safeParse(parse(formData));
    if (!parsed.success) {
      return { ok: false, error: "Bitte Eingaben prüfen.", fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
    }
    const clash = await db.productCategory.findFirst({ where: { slug: parsed.data.slug, NOT: { id } } });
    if (clash) return { ok: false, error: "Slug bereits vergeben." };
    await db.productCategory.update({ where: { id }, data: parsed.data });
    await logAudit({ userId: admin.id, action: "CATEGORY_UPDATED", entity: "ProductCategory", entityId: id });
    revalidatePath("/admin/kategorien");
    revalidatePath(`/kategorie/${parsed.data.slug}`);
    return { ok: true };
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return { ok: false, error: "Verboten" };
    return { ok: false, error: "Fehler beim Speichern." };
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const productCount = await db.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      return { ok: false, error: `Kategorie hat ${productCount} Produkte. Bitte erst verschieben.` };
    }
    await db.productCategory.delete({ where: { id } });
    await logAudit({ userId: admin.id, action: "CATEGORY_DELETED", entity: "ProductCategory", entityId: id });
    revalidatePath("/admin/kategorien");
    return { ok: true };
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return { ok: false, error: "Verboten" };
    return { ok: false, error: "Fehler beim Löschen." };
  }
}
