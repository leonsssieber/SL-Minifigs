export const dynamic = "force-dynamic";

import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/server/actions/auth";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) return null;

  const [orderCount, wishlistCount, addressCount] = await Promise.all([
    db.order.count({ where: { userId: session.user.id } }),
    db.wishlistItem.count({ where: { userId: session.user.id } }),
    db.address.count({ where: { userId: session.user.id } }),
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Hallo {session.user.name ?? session.user.email}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{session.user.email}</p>
          {!session.user.emailVerified && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              Bitte bestätige deine Email-Adresse. Bei Bedarf einen neuen Bestätigungslink anfordern.
            </div>
          )}
          <form action={logoutAction}>
            <Button variant="outline" type="submit">Abmelden</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/konto/bestellungen">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold">{orderCount}</div>
              <div className="text-sm text-muted-foreground">Bestellungen</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/konto/wunschliste">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold">{wishlistCount}</div>
              <div className="text-sm text-muted-foreground">Wunschliste</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/konto/adressen">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold">{addressCount}</div>
              <div className="text-sm text-muted-foreground">Adressen</div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}