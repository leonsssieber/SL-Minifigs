import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !session.user.isAdmin) {
    throw new Error("FORBIDDEN");
  }
  return session.user;
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
