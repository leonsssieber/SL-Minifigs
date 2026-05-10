"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/admin";

export async function saveSettings(formData: FormData) {
  const admin = await requireAdmin();
  const updates: { key: string; value: string }[] = [];
  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string") continue;
    if (!/^shop_[a-z0-9_]{1,40}$/.test(key)) continue; // Whitelist
    if (value.length > 5000) continue;
    updates.push({ key, value });
  }
  for (const u of updates) {
    await db.siteSetting.upsert({
      where: { key: u.key },
      create: u,
      update: { value: u.value },
    });
  }
  await logAudit({ userId: admin.id, action: "SETTINGS_UPDATED", metadata: { keys: updates.map((u) => u.key) } });
  revalidatePath("/admin/einstellungen");
  revalidatePath("/impressum");
}

export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const settings = await db.siteSetting.findMany({ where: { key: { in: keys } } });
  return Object.fromEntries(settings.map((s) => [s.key, s.value]));
}
