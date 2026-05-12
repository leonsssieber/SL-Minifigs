"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/admin";
import type { ActionResult } from "./auth";

export async function listAdmins() {
  await requireAdmin();
  return db.user.findMany({
    where: { isAdmin: true },
    select: { id: true, email: true, name: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function promoteToAdmin(formData: FormData): Promise<ActionResult> {
  const current = await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { ok: false, error: "Bitte eine gültige E-Mail-Adresse angeben." };
  }

  const user = await db.user.findUnique({ where: { email }, select: { id: true, isAdmin: true } });
  if (!user) {
    return { ok: false, error: `Kein Konto mit der E-Mail „${email}" gefunden. Der Nutzer muss sich zuerst registrieren.` };
  }
  if (user.isAdmin) {
    return { ok: false, error: "Dieser Nutzer ist bereits Admin." };
  }

  await db.user.update({ where: { id: user.id }, data: { isAdmin: true } });
  await logAudit({
    userId: current.id,
    action: "ADMIN_PROMOTED",
    entity: "User",
    entityId: user.id,
    metadata: { email },
  });
  revalidatePath("/admin/einstellungen");
  return { ok: true };
}

export async function demoteAdmin(formData: FormData): Promise<ActionResult> {
  const current = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");

  if (userId === current.id) {
    return { ok: false, error: "Du kannst dich nicht selbst entfernen." };
  }

  const target = await db.user.findUnique({ where: { id: userId }, select: { id: true, email: true, isAdmin: true } });
  if (!target) return { ok: false, error: "Nutzer nicht gefunden." };
  if (!target.isAdmin) return { ok: false, error: "Nutzer ist kein Admin." };

  const adminCount = await db.user.count({ where: { isAdmin: true } });
  if (adminCount <= 1) {
    return { ok: false, error: "Mindestens ein Admin muss bleiben." };
  }

  await db.user.update({ where: { id: userId }, data: { isAdmin: false } });
  await logAudit({
    userId: current.id,
    action: "ADMIN_DEMOTED",
    entity: "User",
    entityId: userId,
    metadata: { email: target.email },
  });
  revalidatePath("/admin/einstellungen");
  return { ok: true };
}
