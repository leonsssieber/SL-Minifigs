"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/admin";
import { productConditionSchema } from "@/lib/validation";
import { DEFAULT_CONDITIONS, conditionValueFromLabel } from "@/lib/conditions";
import type { ActionResult } from "@/server/actions/auth";

function revalidate() {
  revalidatePath("/admin/zustaende");
  revalidatePath("/produkte");
  revalidatePath("/");
}

/** Legt die eingebauten Standard-Zustände an (nur wenn die Tabelle leer ist). */
export async function seedDefaultConditions(): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const count = await db.productCondition.count();
    if (count > 0) return { ok: false, error: "Es existieren bereits Zustände." };
    await db.productCondition.createMany({
      data: DEFAULT_CONDITIONS.map((c, i) => ({ value: c.value, label: c.label, sortOrder: i })),
    });
    await logAudit({ userId: admin.id, action: "CONDITIONS_SEEDED" });
    revalidate();
    return { ok: true };
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return { ok: false, error: "Verboten" };
    console.error(e);
    return { ok: false, error: "Fehler beim Anlegen." };
  }
}

export async function createCondition(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = productConditionSchema.safeParse({
      label: formData.get("label"),
      sortOrder: formData.get("sortOrder") ?? 0,
      active: formData.get("active") !== "false",
    });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.flatten().fieldErrors.label?.[0] ?? "Eingaben prüfen." };
    }

    // Eindeutigen Wert (Code) aus dem Label erzeugen; bei Kollision durchnummerieren.
    const base = conditionValueFromLabel(parsed.data.label);
    let value = base;
    let n = 1;
    while (await db.productCondition.findUnique({ where: { value } })) {
      value = `${base}_${n++}`.slice(0, 50);
    }

    await db.productCondition.create({
      data: { value, label: parsed.data.label, sortOrder: parsed.data.sortOrder, active: parsed.data.active },
    });
    await logAudit({ userId: admin.id, action: "CONDITION_CREATED", entity: "ProductCondition", entityId: value });
    revalidate();
    return { ok: true };
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return { ok: false, error: "Verboten" };
    console.error(e);
    return { ok: false, error: "Fehler beim Anlegen." };
  }
}

export async function updateCondition(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = productConditionSchema.safeParse({
      label: formData.get("label"),
      sortOrder: formData.get("sortOrder") ?? 0,
      active: formData.get("active") !== "false",
    });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.flatten().fieldErrors.label?.[0] ?? "Eingaben prüfen." };
    }
    // value bleibt unverändert — Produkte referenzieren ihn.
    await db.productCondition.update({
      where: { id },
      data: { label: parsed.data.label, sortOrder: parsed.data.sortOrder, active: parsed.data.active },
    });
    await logAudit({ userId: admin.id, action: "CONDITION_UPDATED", entity: "ProductCondition", entityId: id });
    revalidate();
    return { ok: true };
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return { ok: false, error: "Verboten" };
    console.error(e);
    return { ok: false, error: "Fehler beim Speichern." };
  }
}

export async function deleteCondition(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const cond = await db.productCondition.findUnique({ where: { id }, select: { value: true } });
    if (!cond) return { ok: false, error: "Nicht gefunden." };
    // Nicht löschen, wenn noch Produkte diesen Zustand verwenden.
    const inUse = await db.product.count({ where: { condition: cond.value } });
    if (inUse > 0) {
      return { ok: false, error: `Zustand wird noch von ${inUse} Produkt(en) verwendet. Bitte zuerst umstellen oder deaktivieren.` };
    }
    await db.productCondition.delete({ where: { id } });
    await logAudit({ userId: admin.id, action: "CONDITION_DELETED", entity: "ProductCondition", entityId: id });
    revalidate();
    return { ok: true };
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return { ok: false, error: "Verboten" };
    console.error(e);
    return { ok: false, error: "Fehler beim Löschen." };
  }
}
