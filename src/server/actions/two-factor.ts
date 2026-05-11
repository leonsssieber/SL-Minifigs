"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import {
  generateTotpSecret,
  encryptTotpSecret,
  verifyTotpCode,
  generateRecoveryCodes,
  hashRecoveryCode,
  verifyRecoveryCode,
} from "@/lib/totp";
import { sign2faCookie, TWO_FA_COOKIE_NAME } from "@/lib/two-factor-cookie";
import type { ActionResult } from "./auth";

// Liefert den entschlüsselten TOTP-Secret (z.B. für QR-Code-Anzeige)
// Muss separat von der Setup-Seite aufgerufen werden, damit kein Secret
// verloren geht wenn die Seite mehrfach geladen wird.
export async function initiate2faSetup(): Promise<ActionResult<{ secret: string; uri: string }>> {
  const user = await requireAdmin();

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { email: true, twoFactorSecret: true, twoFactorEnabled: true },
  });
  if (!dbUser) return { ok: false, error: "Benutzer nicht gefunden." };
  if (dbUser.twoFactorEnabled) return { ok: false, error: "2FA ist bereits aktiviert." };

  // Wenn noch kein pending Secret vorhanden, neuen generieren
  let plainSecret: string;
  if (dbUser.twoFactorSecret) {
    // Secret aus DB laden (bestehendes Setup, das noch nicht bestätigt wurde)
    const { decryptTotpSecret } = await import("@/lib/totp");
    plainSecret = decryptTotpSecret(dbUser.twoFactorSecret);
  } else {
    plainSecret = generateTotpSecret();
    await db.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: encryptTotpSecret(plainSecret) },
    });
  }

  const { getTotpUri } = await import("@/lib/totp");
  const uri = getTotpUri(plainSecret, dbUser.email);
  return { ok: true, data: { secret: plainSecret, uri } };
}

export async function confirm2faSetup(formData: FormData): Promise<ActionResult<{ recoveryCodes: string[] }>> {
  const user = await requireAdmin();
  const code = String(formData.get("code") ?? "").trim();

  if (!/^\d{6}$/.test(code)) return { ok: false, error: "Bitte einen 6-stelligen Code eingeben." };

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { twoFactorSecret: true, twoFactorEnabled: true },
  });
  if (!dbUser?.twoFactorSecret) return { ok: false, error: "Kein 2FA-Setup gefunden. Bitte neu starten." };
  if (dbUser.twoFactorEnabled) return { ok: false, error: "2FA ist bereits aktiviert." };

  if (!verifyTotpCode(code, dbUser.twoFactorSecret)) {
    return { ok: false, error: "Ungültiger Code. Bitte erneut versuchen." };
  }

  // Recovery Codes generieren und hashen
  const plainCodes = generateRecoveryCodes();
  const hashedCodes = await Promise.all(plainCodes.map(hashRecoveryCode));

  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { twoFactorEnabled: true } }),
    db.twoFactorRecoveryCode.deleteMany({ where: { userId: user.id } }),
    db.twoFactorRecoveryCode.createMany({
      data: hashedCodes.map((code) => ({ userId: user.id, code })),
    }),
  ]);

  return { ok: true, data: { recoveryCodes: plainCodes } };
}

export async function disable2fa(formData: FormData): Promise<ActionResult> {
  const user = await requireAdmin();
  const code = String(formData.get("code") ?? "").trim();

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { twoFactorSecret: true, twoFactorEnabled: true },
  });
  if (!dbUser?.twoFactorEnabled) return { ok: false, error: "2FA ist nicht aktiviert." };

  // Code-Prüfung (TOTP oder Recovery)
  const totpOk = dbUser.twoFactorSecret && /^\d{6}$/.test(code)
    ? verifyTotpCode(code, dbUser.twoFactorSecret)
    : false;

  if (!totpOk) return { ok: false, error: "Ungültiger Code." };

  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    }),
    db.twoFactorRecoveryCode.deleteMany({ where: { userId: user.id } }),
  ]);

  // 2FA-Cookie löschen
  const jar = await cookies();
  jar.delete(TWO_FA_COOKIE_NAME);

  return { ok: true };
}

export async function verify2faLogin(formData: FormData): Promise<ActionResult> {
  const user = await requireAdmin();
  const code = String(formData.get("code") ?? "").trim();

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: {
      twoFactorSecret: true,
      twoFactorEnabled: true,
      twoFactorRecoveryCodes: {
        where: { usedAt: null },
        select: { id: true, code: true },
      },
    },
  });

  if (!dbUser?.twoFactorEnabled || !dbUser.twoFactorSecret) {
    return { ok: false, error: "2FA nicht aktiviert." };
  }

  // TOTP-Code prüfen
  if (/^\d{6}$/.test(code)) {
    if (!verifyTotpCode(code, dbUser.twoFactorSecret)) {
      return { ok: false, error: "Ungültiger Code. Bitte erneut versuchen." };
    }
  } else {
    // Recovery-Code prüfen
    const normalised = code.replace(/[^A-Fa-f0-9]/g, "").toUpperCase();
    if (normalised.length !== 10) return { ok: false, error: "Ungültiger Code." };

    let matchId: string | null = null;
    for (const rc of dbUser.twoFactorRecoveryCodes) {
      const match = await verifyRecoveryCode(normalised, rc.code);
      if (match) { matchId = rc.id; break; }
    }
    if (!matchId) return { ok: false, error: "Ungültiger Recovery-Code." };

    await db.twoFactorRecoveryCode.update({
      where: { id: matchId },
      data: { usedAt: new Date() },
    });
  }

  // Signiertes 2FA-Cookie setzen (30 Tage)
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

export async function regenerateRecoveryCodes(formData: FormData): Promise<ActionResult<{ recoveryCodes: string[] }>> {
  const user = await requireAdmin();
  const code = String(formData.get("code") ?? "").trim();

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { twoFactorSecret: true, twoFactorEnabled: true },
  });
  if (!dbUser?.twoFactorEnabled || !dbUser.twoFactorSecret) {
    return { ok: false, error: "2FA nicht aktiviert." };
  }

  if (!/^\d{6}$/.test(code) || !verifyTotpCode(code, dbUser.twoFactorSecret)) {
    return { ok: false, error: "Ungültiger Code." };
  }

  const plainCodes = generateRecoveryCodes();
  const hashedCodes = await Promise.all(plainCodes.map(hashRecoveryCode));

  await db.$transaction([
    db.twoFactorRecoveryCode.deleteMany({ where: { userId: user.id } }),
    db.twoFactorRecoveryCode.createMany({
      data: hashedCodes.map((c) => ({ userId: user.id, code: c })),
    }),
  ]);

  return { ok: true, data: { recoveryCodes: plainCodes } };
}
