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

// Diese Action ist öffentlich aufrufbar — nur explizit freigegebene Keys
// dürfen gelesen werden, falls später je sensible Werte in den Settings landen.
const PUBLIC_SETTING_KEYS = new Set([
  "shop_address",
  "shop_phone",
  "shop_email",
  "shop_uid",
  "shop_iban",
  "shop_legal_entity",
  "shop_legal_owner",
  "shop_legal_register",
  "shop_twint_enabled",
]);

export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const allowed = keys.filter((k) => PUBLIC_SETTING_KEYS.has(k));
  if (allowed.length === 0) return {};
  const settings = await db.siteSetting.findMany({ where: { key: { in: allowed } } });
  return Object.fromEntries(settings.map((s) => [s.key, s.value]));
}
