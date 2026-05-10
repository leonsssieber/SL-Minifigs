export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AddressesManager } from "./addresses-manager";

export default async function AddressesPage() {
  const session = await auth();
  if (!session?.user) return null;

  const addresses = await db.address.findMany({
    where: { userId: session.user.id },
    orderBy: { isDefault: "desc" },
  });

  return <AddressesManager addresses={addresses} />;
}