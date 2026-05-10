"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { addressSchema } from "@/lib/validation";
import type { ActionResult } from "@/server/actions/auth";

function parse(formData: FormData) {
  return {
    firstName: formData.get("firstName")?.toString() ?? "",
    lastName: formData.get("lastName")?.toString() ?? "",
    company: formData.get("company")?.toString() || null,
    street: formData.get("street")?.toString() ?? "",
    street2: formData.get("street2")?.toString() || null,
    zip: formData.get("zip")?.toString() ?? "",
    city: formData.get("city")?.toString() ?? "",
    country: formData.get("country")?.toString() ?? "CH",
    phone: formData.get("phone")?.toString() || null,
    isDefault: formData.get("isDefault") === "true" || formData.get("isDefault") === "on",
  };
}

export async function createAddress(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Nicht angemeldet" };
  const parsed = addressSchema.safeParse(parse(formData));
  if (!parsed.success) return { ok: false, error: "Bitte Eingaben prüfen.", fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };

  if (parsed.data.isDefault) {
    await db.address.updateMany({ where: { userId: session.user.id }, data: { isDefault: false } });
  }
  await db.address.create({ data: { ...parsed.data, userId: session.user.id } });
  revalidatePath("/konto/adressen");
  return { ok: true };
}

export async function updateAddress(id: string, formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Nicht angemeldet" };
  const addr = await db.address.findUnique({ where: { id } });
  if (!addr || addr.userId !== session.user.id) return { ok: false, error: "Verboten" };

  const parsed = addressSchema.safeParse(parse(formData));
  if (!parsed.success) return { ok: false, error: "Bitte Eingaben prüfen." };

  if (parsed.data.isDefault) {
    await db.address.updateMany({ where: { userId: session.user.id, NOT: { id } }, data: { isDefault: false } });
  }
  await db.address.update({ where: { id }, data: parsed.data });
  revalidatePath("/konto/adressen");
  return { ok: true };
}

export async function deleteAddress(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Nicht angemeldet" };
  const addr = await db.address.findUnique({ where: { id } });
  if (!addr || addr.userId !== session.user.id) return { ok: false, error: "Verboten" };
  await db.address.delete({ where: { id } });
  revalidatePath("/konto/adressen");
  return { ok: true };
}
