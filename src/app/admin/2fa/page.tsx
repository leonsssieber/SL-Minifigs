// 2FA-Verifikationsseite — erscheint nach dem Login, wenn 2FA aktiviert ist
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { verify2faLogin } from "@/server/actions/two-factor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ShieldCheck } from "lucide-react";

export const metadata = { title: "2FA-Verifikation", robots: { index: false } };

export default async function TwoFaVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/anmelden");
  if (!session.user.twoFactorEnabled) redirect("/admin");

  const { error } = await searchParams;

  async function handleVerify(formData: FormData) {
    "use server";
    const result = await verify2faLogin(formData);
    if (!result.ok) {
      redirect(`/admin/2fa?error=${encodeURIComponent(result.error)}`);
    }
    // verify2faLogin redirects to /admin on success
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Zwei-Faktor-Authentifizierung</CardTitle>
          <CardDescription>
            Gib den 6-stelligen Code aus deiner Authenticator-App ein, oder einen Recovery-Code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleVerify} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive border border-destructive/20">
                {decodeURIComponent(error)}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                maxLength={14}
                autoFocus
                autoComplete="one-time-code"
                className="text-center text-xl tracking-widest font-mono"
                required
              />
              <p className="text-xs text-muted-foreground">
                Recovery-Code: Format XXXXX-XXXXX (ohne Bindestriche eingeben ist auch ok)
              </p>
            </div>
            <Button type="submit" className="w-full">Bestätigen</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
