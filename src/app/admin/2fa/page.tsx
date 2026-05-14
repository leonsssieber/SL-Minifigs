// 2FA-Verifikationsseite — erscheint nach dem Login, wenn der Admin keinen gültigen
// 2FA-Cookie hat. Statt Authenticator-App: 6-stelliger Code per E-Mail.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendAdmin2faCode, verifyAdmin2faCode } from "@/server/actions/two-factor";
import { logoutAction } from "@/server/actions/auth";
import { verify2faCookie, TWO_FA_COOKIE_NAME } from "@/lib/two-factor-cookie";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ShieldCheck, LogOut } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "2FA-Verifikation", robots: { index: false } };

export default async function TwoFaVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/anmelden");

  // Wenn bereits ein gültiges 2FA-Cookie vorhanden ist (z.B. nach Re-Login innerhalb 30 Tage),
  // direkt nach /admin weiterleiten ohne neuen Code zu senden.
  const jar = await cookies();
  const existingCookie = jar.get(TWO_FA_COOKIE_NAME)?.value;
  if (existingCookie && (await verify2faCookie(existingCookie, session.user.id))) {
    redirect("/admin");
  }

  const { error, sent } = await searchParams;

  // Code automatisch beim ersten Aufruf senden — der Admin muss nichts klicken,
  // damit es sich wie ein Teil des Login-Flows anfühlt.
  if (!sent) {
    const result = await sendAdmin2faCode();
    if (result.ok) {
      redirect("/admin/2fa?sent=1");
    } else {
      // Bei Fehler (Rate-Limit / SMTP) zeigen wir den Fehler an, aber das Formular
      // bleibt sichtbar, damit der User es manuell nochmal versuchen kann.
      redirect(`/admin/2fa?sent=1&error=${encodeURIComponent(result.error)}`);
    }
  }

  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  });

  async function handleSend() {
    "use server";
    const result = await sendAdmin2faCode();
    if (!result.ok) {
      redirect(`/admin/2fa?sent=1&error=${encodeURIComponent(result.error)}`);
    }
    redirect(`/admin/2fa?sent=1`);
  }

  async function handleVerify(formData: FormData) {
    "use server";
    const result = await verifyAdmin2faCode(formData);
    if (!result.ok) {
      redirect(`/admin/2fa?sent=1&error=${encodeURIComponent(result.error)}`);
    }
  }

  function maskEmail(email: string) {
    const [local, domain] = email.split("@");
    if (!local || !domain) return email;
    const visible = local.slice(0, 1);
    return `${visible}${"*".repeat(Math.max(1, local.length - 1))}@${domain}`;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Admin-Login bestätigen</CardTitle>
          <CardDescription>
            Wir haben einen 6-stelligen Code an <strong>{dbUser ? maskEmail(dbUser.email) : "deine E-Mail"}</strong> gesendet.
            Bitte hier eingeben, um die Anmeldung abzuschliessen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive border border-destructive/20">
              {decodeURIComponent(error)}
            </div>
          )}

          <form action={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Bestätigungs-Code</Label>
              <Input
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                maxLength={6}
                autoFocus
                autoComplete="one-time-code"
                className="text-center text-xl tracking-widest font-mono"
                required
              />
            </div>
            <Button type="submit" className="w-full">Bestätigen</Button>
          </form>
          <form action={handleSend}>
            <Button type="submit" variant="ghost" size="sm" className="w-full">
              Neuen Code senden
            </Button>
          </form>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="sm" className="w-full gap-2 text-muted-foreground">
              <LogOut className="h-3.5 w-3.5" />
              Abbrechen & abmelden
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
