// E-Mail-basiertes 2FA für Admins.
// Node-only (bcryptjs, crypto) — niemals aus Edge-Code importieren.

import { randomInt } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const CODE_LENGTH = 6;
const CODE_TTL_MINUTES = 10;
const MAX_ACTIVE_CODES_PER_USER = 5;

export function generateEmailCode(): string {
  // randomInt ist kryptografisch sicher und gleichverteilt.
  const n = randomInt(0, 10 ** CODE_LENGTH);
  return String(n).padStart(CODE_LENGTH, "0");
}

export async function createEmailCode(userId: string): Promise<string> {
  const code = generateEmailCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);

  // Alte/abgelaufene Codes des Users wegräumen, damit kein Wildwuchs entsteht.
  await db.emailTwoFactorCode.deleteMany({
    where: {
      userId,
      OR: [{ usedAt: { not: null } }, { expiresAt: { lt: new Date() } }],
    },
  });

  // Falls zu viele offene Codes existieren (Spam-Schutz), älteste löschen.
  const active = await db.emailTwoFactorCode.count({ where: { userId, usedAt: null } });
  if (active >= MAX_ACTIVE_CODES_PER_USER) {
    const oldest = await db.emailTwoFactorCode.findFirst({
      where: { userId, usedAt: null },
      orderBy: { createdAt: "asc" },
    });
    if (oldest) await db.emailTwoFactorCode.delete({ where: { id: oldest.id } });
  }

  await db.emailTwoFactorCode.create({
    data: { userId, codeHash, expiresAt },
  });

  return code;
}

export async function verifyEmailCode(userId: string, code: string): Promise<boolean> {
  if (!/^\d{6}$/.test(code)) return false;

  const candidates = await db.emailTwoFactorCode.findMany({
    where: {
      userId,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    take: MAX_ACTIVE_CODES_PER_USER,
  });

  for (const c of candidates) {
    if (await bcrypt.compare(code, c.codeHash)) {
      await db.emailTwoFactorCode.update({
        where: { id: c.id },
        data: { usedAt: new Date() },
      });
      return true;
    }
  }
  return false;
}

export const EMAIL_2FA_CODE_TTL_MINUTES = CODE_TTL_MINUTES;
