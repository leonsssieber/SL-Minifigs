import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/server/actions/auth";
import { PasswordForm } from "./password-form";

export default async function AccountSettingsPage() {
  const session = await auth();
  if (!session?.user) return null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Konto</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input defaultValue={session.user.name ?? ""} disabled />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input defaultValue={session.user.email} disabled />
            {!session.user.emailVerified && (
              <p className="text-xs text-amber-700">Email noch nicht bestätigt.</p>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Zum Ändern deiner Daten kontaktiere uns bitte.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Passwort ändern</CardTitle></CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Sitzung</CardTitle></CardHeader>
        <CardContent>
          <form action={logoutAction}>
            <Button type="submit" variant="outline">Abmelden</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
