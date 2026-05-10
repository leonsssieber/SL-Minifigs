"use server";

import { headers } from "next/headers";
import { contactSchema } from "@/lib/validation";
import { sendEmail, contactNotificationEmail } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import type { ActionResult } from "@/server/actions/auth";

export async function sendContactMessage(formData: FormData): Promise<ActionResult> {
  const ip = getClientIp(await headers());
  const rl = await rateLimit(`contact:${ip}`, 5, 300);
  if (!rl.success) return { ok: false, error: `Bitte in ${rl.resetIn}s erneut.` };

  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
    website: formData.get("website") ?? "",
  };
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Bitte alle Felder korrekt ausfüllen." };
  if (parsed.data.website) return { ok: true }; // Bot

  const setting = await db.siteSetting.findUnique({ where: { key: "shop_email" } });
  const target = setting?.value ?? process.env.EMAIL_REPLY_TO;
  if (!target) return { ok: false, error: "Keine Empfänger-Email konfiguriert." };

  await sendEmail({
    to: target,
    subject: `[Kontakt] ${parsed.data.subject}`,
    react: contactNotificationEmail(parsed.data),
    replyTo: parsed.data.email,
  });
  return { ok: true };
}
