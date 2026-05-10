"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/admin";
import { shippingMethodSchema, shippingRuleSchema } from "@/lib/validation";
import type { ActionResult } from "@/server/actions/auth";

function parseMethod(formData: FormData) {
  return {
    name: formData.get("name")?.toString() ?? "",
    description: formData.get("description")?.toString() || null,
    basePrice: formData.get("basePrice")?.toString() ?? "0",
    sortOrder: formData.get("sortOrder")?.toString() ?? "0",
    active: formData.get("active") === "true" || formData.get("active") === "on",
  };
}

function parseRule(formData: FormData) {
  const num = (v: FormDataEntryValue | null) => (v == null || v === "" ? null : v.toString());
  return {
    name: formData.get("name")?.toString() ?? "",
    methodId: formData.get("methodId")?.toString() ?? "",
    priority: formData.get("priority")?.toString() ?? "0",
    active: formData.get("active") === "true" || formData.get("active") === "on",
    minMinifigures: num(formData.get("minMinifigures")),
    maxMinifigures: num(formData.get("maxMinifigures")),
    minSets: num(formData.get("minSets")),
    maxSets: num(formData.get("maxSets")),
    minItems: num(formData.get("minItems")),
    maxItems: num(formData.get("maxItems")),
    minOrderValue: num(formData.get("minOrderValue")),
    maxOrderValue: num(formData.get("maxOrderValue")),
    minWeightGrams: num(formData.get("minWeightGrams")),
    maxWeightGrams: num(formData.get("maxWeightGrams")),
    fixedPrice: num(formData.get("fixedPrice")),
    perItemSurcharge: num(formData.get("perItemSurcharge")),
  };
}

export async function createShippingMethod(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = shippingMethodSchema.safeParse(parseMethod(formData));
    if (!parsed.success) return { ok: false, error: "Bitte Eingaben prüfen.", fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
    const m = await db.shippingMethod.create({ data: parsed.data });
    await logAudit({ userId: admin.id, action: "SHIPPING_METHOD_CREATED", entity: "ShippingMethod", entityId: m.id });
    revalidatePath("/admin/versand");
    return { ok: true };
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return { ok: false, error: "Verboten" };
    return { ok: false, error: "Fehler beim Anlegen." };
  }
}

export async function updateShippingMethod(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = shippingMethodSchema.safeParse(parseMethod(formData));
    if (!parsed.success) return { ok: false, error: "Bitte Eingaben prüfen.", fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
    await db.shippingMethod.update({ where: { id }, data: parsed.data });
    await logAudit({ userId: admin.id, action: "SHIPPING_METHOD_UPDATED", entity: "ShippingMethod", entityId: id });
    revalidatePath("/admin/versand");
    return { ok: true };
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return { ok: false, error: "Verboten" };
    return { ok: false, error: "Fehler beim Speichern." };
  }
}

export async function deleteShippingMethod(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const usedInOrders = await db.order.count({ where: { shippingMethodId: id } });
    const usedInProducts = await db.product.count({ where: { customShippingMethodId: id } });
    if (usedInOrders > 0 || usedInProducts > 0) {
      // Soft-Delete: deaktivieren
      await db.shippingMethod.update({ where: { id }, data: { active: false } });
    } else {
      await db.shippingMethod.delete({ where: { id } });
    }
    await logAudit({ userId: admin.id, action: "SHIPPING_METHOD_DELETED", entity: "ShippingMethod", entityId: id });
    revalidatePath("/admin/versand");
    return { ok: true };
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return { ok: false, error: "Verboten" };
    return { ok: false, error: "Fehler beim Löschen." };
  }
}

export async function createShippingRule(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = shippingRuleSchema.safeParse(parseRule(formData));
    if (!parsed.success) return { ok: false, error: "Bitte Eingaben prüfen.", fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
    const r = await db.shippingRule.create({ data: parsed.data });
    await logAudit({ userId: admin.id, action: "SHIPPING_RULE_CREATED", entity: "ShippingRule", entityId: r.id });
    revalidatePath("/admin/versand");
    return { ok: true };
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return { ok: false, error: "Verboten" };
    return { ok: false, error: "Fehler beim Anlegen." };
  }
}

export async function updateShippingRule(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = shippingRuleSchema.safeParse(parseRule(formData));
    if (!parsed.success) return { ok: false, error: "Bitte Eingaben prüfen.", fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
    await db.shippingRule.update({ where: { id }, data: parsed.data });
    await logAudit({ userId: admin.id, action: "SHIPPING_RULE_UPDATED", entity: "ShippingRule", entityId: id });
    revalidatePath("/admin/versand");
    return { ok: true };
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return { ok: false, error: "Verboten" };
    return { ok: false, error: "Fehler beim Speichern." };
  }
}

export async function deleteShippingRule(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    await db.shippingRule.delete({ where: { id } });
    await logAudit({ userId: admin.id, action: "SHIPPING_RULE_DELETED", entity: "ShippingRule", entityId: id });
    revalidatePath("/admin/versand");
    return { ok: true };
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return { ok: false, error: "Verboten" };
    return { ok: false, error: "Fehler beim Löschen." };
  }
}
