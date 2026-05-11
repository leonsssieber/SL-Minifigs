// 2FA-Einrichtungsseite im Admin-Bereich
import { redirect } from "next/navigation";
import Image from "next/image";
import QRCode from "qrcode";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  initiate2faSetup,
  confirm2faSetup,
  disable2fa,
  regenerateRecoveryCodes,
} from "@/server/actions/two-factor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldOff, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "2FA-Einstellungen", robots: { index: false } };

export default async function TwoFaSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; error?: string; success?: string; codes?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/anmelden");

  const { action, error, success, codes: codesParam } = await searchParams;

  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      twoFactorEnabled: true,
      twoFactorSecret: true,
      twoFactorRecoveryCodes: { where: { usedAt: null }, select: { id: true } },
    },
  });
  if (!dbUser) redirect("/admin");

  // Wenn QR-Code angezeigt werden soll
  let qrDataUrl: string | null = null;
  let plainSecret: string | null = null;
  let setupError: string | null = null;

  if (!dbUser.twoFactorEnabled && action === "setup") {
    const result = await initiate2faSetup();
    if (result.ok && result.data) {
      plainSecret = result.data.secret;
      qrDataUrl = await QRCode.toDataURL(result.data.uri, { width: 240, margin: 2 });
    } else if (!result.ok) {
      setupError = result.error;
    }
  }

  // Recovery-Codes aus URL (nach Aktivierung)
  const shownCodes: string[] = codesParam
    ? JSON.parse(decodeURIComponent(codesParam))
    : [];

  async function handleSetupConfirm(formData: FormData) {
    "use server";
    const result = await confirm2faSetup(formData);
    if (!result.ok) {
      redirect(`/admin/einstellungen/2fa?action=setup&error=${encodeURIComponent(result.error)}`);
    }
    const codes = encodeURIComponent(JSON.stringify(result.data!.recoveryCodes));
    redirect(`/admin/einstellungen/2fa?success=activated&codes=${codes}`);
  }

  async function handleDisable(formData: FormData) {
    "use server";
    const result = await disable2fa(formData);
    if (!result.ok) {
      redirect(`/admin/einstellungen/2fa?error=${encodeURIComponent(result.error)}`);
    }
    redirect("/admin/einstellungen/2fa?success=disabled");
  }

  async function handleRegenerate(formData: FormData) {
    "use server";
    const result = await regenerateRecoveryCodes(formData);
    if (!result.ok) {
      redirect(`/admin/einstellungen/2fa?error=${encodeURIComponent(result.error)}`);
    }
    const codes = encodeURIComponent(JSON.stringify(result.data!.recoveryCodes));
    redirect(`/admin/einstellungen/2fa?success=regen&codes=${codes}`);
  }

  return (
    <div className="p-8 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/einstellungen">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Zwei-Faktor-Authentifizierung</h1>
          <p className="text-muted-foreground">Zusätzlicher Schutz für dein Admin-Konto</p>
        </div>
      </div>

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Status
            {dbUser.twoFactorEnabled ? (
              <Badge variant="success" className="gap-1"><ShieldCheck className="h-3 w-3" />Aktiviert</Badge>
            ) : (
              <Badge variant="secondary" className="gap-1"><ShieldOff className="h-3 w-3" />Deaktiviert</Badge>
            )}
          </CardTitle>
          {dbUser.twoFactorEnabled && (
            <CardDescription>
              {dbUser.twoFactorRecoveryCodes.length} Recovery-Code{dbUser.twoFactorRecoveryCodes.length !== 1 ? "s" : ""} verfügbar
            </CardDescription>
          )}
        </CardHeader>
      </Card>

      {/* Fehlermeldung */}
      {error && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive border border-destructive/20">
          {decodeURIComponent(error)}
        </div>
      )}

      {/* Erfolgsmeldung */}
      {success === "disabled" && (
        <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-800 border border-green-200">
          2FA wurde erfolgreich deaktiviert.
        </div>
      )}
      {(success === "activated" || success === "regen") && shownCodes.length > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-900">
              {success === "activated" ? "2FA aktiviert!" : "Recovery-Codes erneuert"}
            </CardTitle>
            <CardDescription className="text-amber-800">
              Speichere diese Recovery-Codes sicher! Sie werden nur einmal angezeigt.
              Jeder Code kann einmal verwendet werden, falls du keinen Zugriff auf deine Authenticator-App hast.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 font-mono text-sm bg-white rounded-md p-4 border">
              {shownCodes.map((c, i) => (
                <span key={i} className="select-all">{c}</span>
              ))}
            </div>
            <p className="mt-3 text-xs text-amber-700">
              Kopiere oder drucke diese Codes und bewahre sie sicher auf.
            </p>
          </CardContent>
        </Card>
      )}

      {/* 2FA aktivieren */}
      {!dbUser.twoFactorEnabled && !action && (
        <Card>
          <CardHeader>
            <CardTitle>2FA aktivieren</CardTitle>
            <CardDescription>
              Schütze dein Admin-Konto mit einer Authenticator-App (z.B. Google Authenticator, Authy, 1Password).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/einstellungen/2fa?action=setup">
              <Button className="gap-2"><ShieldCheck className="h-4 w-4" />2FA einrichten</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Setup-Flow: QR-Code + Bestätigung */}
      {!dbUser.twoFactorEnabled && action === "setup" && (
        <Card>
          <CardHeader>
            <CardTitle>Authenticator-App einrichten</CardTitle>
            <CardDescription>
              Scanne den QR-Code mit deiner Authenticator-App und gib den 6-stelligen Code ein, um die Einrichtung abzuschliessen.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {setupError && (
              <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {setupError}
              </div>
            )}
            {qrDataUrl && (
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-xl border p-3 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt="2FA QR-Code" width={240} height={240} />
                </div>
                {plainSecret && (
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Oder Secret manuell eingeben:</p>
                    <code className="text-xs bg-muted px-2 py-1 rounded font-mono select-all break-all">
                      {plainSecret}
                    </code>
                  </div>
                )}
              </div>
            )}
            <form action={handleSetupConfirm} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">6-stelliger Code</Label>
                <Input
                  id="code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  maxLength={6}
                  autoComplete="one-time-code"
                  className="text-center text-xl tracking-widest font-mono max-w-[200px]"
                  required
                />
              </div>
              <Button type="submit">Bestätigen & 2FA aktivieren</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 2FA-Verwaltung wenn aktiviert */}
      {dbUser.twoFactorEnabled && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Recovery-Codes erneuern</CardTitle>
              <CardDescription>
                Generiere neue Recovery-Codes. Alle alten Codes werden ungültig.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={handleRegenerate} className="flex items-end gap-3">
                <div className="space-y-2">
                  <Label htmlFor="regen-code">Aktueller 2FA-Code zur Bestätigung</Label>
                  <Input
                    id="regen-code"
                    name="code"
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    maxLength={6}
                    className="font-mono max-w-[160px]"
                    required
                  />
                </div>
                <Button type="submit" variant="outline">Codes erneuern</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-destructive">2FA deaktivieren</CardTitle>
              <CardDescription>
                Dein Admin-Konto wird danach nur noch mit Passwort geschützt.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={handleDisable} className="flex items-end gap-3">
                <div className="space-y-2">
                  <Label htmlFor="disable-code">Aktueller 2FA-Code zur Bestätigung</Label>
                  <Input
                    id="disable-code"
                    name="code"
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    maxLength={6}
                    className="font-mono max-w-[160px]"
                    required
                  />
                </div>
                <Button type="submit" variant="destructive">2FA deaktivieren</Button>
              </form>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
