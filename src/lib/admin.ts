import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { verify2faCookie, TWO_FA_COOKIE_NAME } from "@/lib/two-factor-cookie";

/**
 * Stellt sicher, dass der Aufrufer als Admin **inklusive 2FA** verifiziert ist.
 * Wird von ALLEN admin-spezifischen Server-Actions verwendet (Produkte, Bestellungen, etc.).
 * Ohne gültigen 2FA-Cookie → FORBIDDEN, auch wenn die Session technisch existiert.
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !session.user.isAdmin) {
    throw new Error("FORBIDDEN");
  }
  const jar = await cookies();
  const cookieValue = jar.get(TWO_FA_COOKIE_NAME)?.value;
  const verified = cookieValue ? await verify2faCookie(cookieValue, session.user.id) : false;
  if (!verified) {
    throw new Error("FORBIDDEN");
  }
  return session.user;
}

/**
 * Wie requireAdmin, aber OHNE 2FA-Prüfung — ausschliesslich für den 2FA-Flow selbst
 * (Code senden, Code verifizieren). NIEMALS für andere admin-actions verwenden,
 * da sonst die 2FA-Pflicht ausgehebelt würde.
 */
export async function requireAdminSession() {
  const session = await auth();
  if (!session?.user || !session.user.isAdmin) {
    throw new Error("FORBIDDEN");
  }
  return session.user;
}

/**
 * Boolean-Variante von requireAdmin für API-Routes (die kein throw wollen).
 * Gibt true zurück, wenn Session.user.isAdmin UND gültiger 2FA-Cookie vorhanden.
 */
export async function isFullyAuthedAdmin(): Promise<boolean> {
  const session = await auth();
  if (!session?.user || !session.user.isAdmin) return false;
  const jar = await cookies();
  const cookieValue = jar.get(TWO_FA_COOKIE_NAME)?.value;
  if (!cookieValue) return false;
  return await verify2faCookie(cookieValue, session.user.id);
}

export async function logAudit(args: {
  userId: string;
  action: string;
  entity?: string;
  entityId?: string;
  metadata?: unknown;
  ipAddress?: string;
  userAgent?: string;
}) {
  await db.auditLog.create({
    data: {
      userId: args.userId,
      action: args.action,
      entity: args.entity,
      entityId: args.entityId,
      metadata: args.metadata ? JSON.stringify(args.metadata) : null,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
    },
  });
}
