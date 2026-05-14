"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin";
import { createEmailCode, verifyEmailCode, EMAIL_2FA_CODE_TTL_MINUTES } from "@/lib/email-2fa";
import { sendEmail, adminTwoFactorCodeEmail } from "@/lib/email";
import { sign2faCookie, TWO_FA_COOKIE_NAME } from "@/lib/two-factor-cookie";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import type { ActionResult } from "./auth";

// Sendet einen 2FA-Code an die Admin-E-Mail-Adresse.
// Verwendet requireAdminSession (kein 2FA-Cookie nötig), weil DIESE Action ja den Cookie erst setzt.
export async function sendAdmin2faCode(): Promise<ActionResult<{ sent: true; ttlMinutes: number }>> {
  const user = await requireAdminSession();

  const ip = getClientIp(await headers());
  const rl = await rateLimit(`2fa-send:${user.id}:${ip}`, 5, 60);
  if (!rl.success) {
    return { ok: false, error: `Bitte ${rl.resetIn}s warten, bevor du einen neuen Code anforderst.` };
  }

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { email: true, name: true },
  });
  if (!dbUser) return { ok: false, error: "Benutzer nicht gefunden." };

  const code = await createEmailCode(user.id);
  const result = await sendEmail({
    to: dbUser.email,
    subject: `Admin-Login-Code: ${code}`,
    react: adminTwoFactorCodeEmail({
      name: dbUser.name ?? "",
      code,
      ttlMinutes: EMAIL_2FA_CODE_TTL_MINUTES,
    }),
  });

  if (!result.ok) {
    // SMTP nicht konfiguriert → in der Dev-Konsole sichtbar, damit Setup weitergeht.
    console.warn(`[admin 2fa] Code für ${dbUser.email}: ${code}`);
  }

  return { ok: true, data: { sent: true, ttlMinutes: EMAIL_2FA_CODE_TTL_MINUTES } };
}

export async function verifyAdmin2faCode(formData: FormData): Promise<ActionResult> {
  const user = await requireAdminSession();
  const code = String(formData.get("code") ?? "").trim();

  const ip = getClientIp(await headers());
  const rl = await rateLimit(`2fa-verify:${user.id}:${ip}`, 10, 60);
  if (!rl.success) {
    return { ok: false, error: `Zu viele Versuche. Bitte in ${rl.resetIn}s erneut.` };
  }

  if (!/^\d{6}$/.test(code)) {
    return { ok: false, error: "Bitte einen 6-stelligen Code eingeben." };
  }

  const ok = await verifyEmailCode(user.id, code);
  if (!ok) {
    return { ok: false, error: "Ungültiger oder abgelaufener Code." };
  }

  const cookieValue = await sign2faCookie(user.id);
  const jar = await cookies();
  jar.set(TWO_FA_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });

  redirect("/admin");
}

// Manuelles Logout aus dem 2FA-Zustand (z.B. um sich auf einem fremden Gerät abzumelden).
export async function clearAdmin2faCookie(): Promise<ActionResult> {
  await requireAdminSession();
  const jar = await cookies();
  jar.delete(TWO_FA_COOKIE_NAME);
  return { ok: true };
}
