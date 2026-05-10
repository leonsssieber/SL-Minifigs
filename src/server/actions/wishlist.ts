"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { ActionResult } from "@/server/actions/auth";

export async function toggleWishlist(productId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Anmeldung erforderlich." };

  const existing = await db.wishlistItem.findUnique({
    where: { userId_productId: { userId: session.user.id, productId } },
  });
  if (existing) {
    await db.wishlistItem.delete({
      where: { userId_productId: { userId: session.user.id, productId } },
    });
  } else {
    const product = await db.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) return { ok: false, error: "Produkt nicht gefunden." };
    await db.wishlistItem.create({
      data: { userId: session.user.id, productId },
    });
  }
  revalidatePath("/konto/wunschliste");
  return { ok: true };
}
