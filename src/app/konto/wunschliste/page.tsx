export const dynamic = "force-dynamic";

import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/shop/product-card";
import { Card } from "@/components/ui/card";

export default async function WishlistPage() {
  const session = await auth();
  if (!session?.user) return null;

  const items = await db.wishlistItem.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (items.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground mb-4">Deine Wunschliste ist leer.</p>
        <Link href="/produkte" className="text-primary hover:underline">Produkte ansehen →</Link>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {items.map((it) => <ProductCard key={it.id} product={it.product} />)}
    </div>
  );
}