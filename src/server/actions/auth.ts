"use server";

import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { db } from "@/lib/db";
import { auth, signIn, signOut } from "@/lib/auth";
import { registerSchema, loginSchema, passwordResetRequestSchema, passwordResetSchema, changePasswordSchema } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendEmail, passwordResetEmail, verifyEmailEmail } from "@/lib/email";
import { TWO_FA_COOKIE_NAME } from "@/lib/two-factor-cookie";
import crypto from "node:crypto";

export type ActionResult<T = unknown> = { ok: true; data?: T } | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function registerAction(formData: FormData): Promise<ActionResult> {
  const ip = getClientIp(await headers());
  const rl = await rateLimit(`register:${ip}`, 5, 60);
  if (!rl.success) {
    return { ok: false, error: `Zu viele Versuche. Bitte in ${rl.resetIn}s erneut probieren.` };
  }

  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
    website: formData.get("website") ?? "",
  };
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Bitte Eingaben prüfen.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { email, password, name, website } = parsed.data;
  if (website) return { ok: false, error: "Anmeldung nicht möglich." };

  const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    // Generische Antwort, um keine Nutzer-Existenz zu leaken
    return { ok: true };
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await db.user.create({
    data: { email: email.toLowerCase(), hashedPassword, name },
  });

  // Email-Verifikations-Token
  const token = crypto.randomBytes(32).toString("hex");
  await db.verificationToken.create({
    data: {
      identifier: user.email,
      token,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const verifyUrl = `${process.env.NEXT_PUBLIC_SHOP_URL}/email-bestaetigen?token=${token}&email=${encodeURIComponent(user.email)}`;
  await sendEmail({
    to: user.email,
    subject: "Bestätige deine Email-Adresse",
    react: verifyEmailEmail({ name: user.name ?? "", verifyUrl }),
  });

  return { ok: true };
}

export async function loginAction(formData: FormData): Promise<ActionResult<{ isAdmin: boolean }>> {
  const ip = getClientIp(await headers());
  const rl = await rateLimit(`login:${ip}`, 10, 60);
  if (!rl.success) {
    return { ok: false, error: `Zu viele Anmeldeversuche. Bitte in ${rl.resetIn}s erneut probieren.` };
  }

  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Email oder Passwort ungültig." };
  }

  const email = parsed.data.email.toLowerCase();

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirect: false,
    });
    // Admin-Status separat aus DB lesen (signIn liefert keine User-Daten zurück).
    const dbUser = await db.user.findUnique({
      where: { email },
      select: { isAdmin: true },
    });
    return { ok: true, data: { isAdmin: dbUser?.isAdmin ?? false } };
  } catch {
    return { ok: false, error: "Email oder Passwort ungültig." };
  }
}

export async function logoutAction() {
  // 2FA-Cookie löschen, damit beim nächsten Admin-Login wieder ein frischer Code nötig ist.
  const jar = await cookies();
  jar.delete(TWO_FA_COOKIE_NAME);
  await signOut({ redirectTo: "/" });
}

export async function requestPasswordResetAction(formData: FormData): Promise<ActionResult> {
  const ip = getClientIp(await headers());
  const rl = await rateLimit(`pwreset:${ip}`, 3, 300);
  if (!rl.success) {
    return { ok: false, error: `Zu viele Anfragen. Bitte in ${rl.resetIn}s erneut probieren.` };
  }

  const parsed = passwordResetRequestSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { ok: false, error: "Ungültige Email." };

  const user = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  // Generische Antwort
  if (!user) return { ok: true };

  const token = crypto.randomBytes(32).toString("hex");
  await db.passwordResetToken.create({
    data: {
      email: user.email,
      token,
      expires: new Date(Date.now() + 60 * 60 * 1000), // 1h
    },
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_SHOP_URL}/passwort-zuruecksetzen?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: "Passwort zurücksetzen",
    react: passwordResetEmail({ name: user.name ?? "", resetUrl }),
  });

  return { ok: true };
}

export async function resetPasswordAction(formData: FormData): Promise<ActionResult> {
  const parsed = passwordResetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Ungültige Daten.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const tokenRow = await db.passwordResetToken.findUnique({ where: { token: parsed.data.token } });
  if (!tokenRow || tokenRow.usedAt || tokenRow.expires < new Date()) {
    return { ok: false, error: "Token ungültig oder abgelaufen." };
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 12);
  await db.$transaction([
    db.user.update({
      where: { email: tokenRow.email },
      data: { hashedPassword },
    }),
    db.passwordResetToken.update({
      where: { token: tokenRow.token },
      data: { usedAt: new Date() },
    }),
  ]);

  return { ok: true };
}

export async function changePasswordAction(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Nicht angemeldet." };

  // Rate-Limit pro User: bremst das Durchprobieren des aktuellen Passworts.
  const rl = await rateLimit(`pwchange:${session.user.id}`, 5, 300);
  if (!rl.success) {
    return { ok: false, error: `Zu viele Versuche. Bitte in ${rl.resetIn}s erneut.` };
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Bitte Eingaben prüfen.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { hashedPassword: true },
  });
  if (!user?.hashedPassword) return { ok: false, error: "Konto hat kein Passwort-Login." };

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.hashedPassword);
  if (!valid) {
    return { ok: false, error: "Aktuelles Passwort ist falsch.", fieldErrors: { currentPassword: ["Aktuelles Passwort ist falsch."] } };
  }

  const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 12);
  await db.user.update({
    where: { id: session.user.id },
    data: { hashedPassword },
  });

  return { ok: true };
}

export async function verifyEmailAction(token: string, email: string): Promise<ActionResult> {
  const row = await db.verificationToken.findUnique({
    where: { identifier_token: { identifier: email, token } },
  });
  if (!row || row.expires < new Date()) {
    return { ok: false, error: "Token ungültig oder abgelaufen." };
  }
  await db.$transaction([
    db.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    }),
    db.verificationToken.delete({
      where: { identifier_token: { identifier: email, token } },
    }),
  ]);
  return { ok: true };
}
