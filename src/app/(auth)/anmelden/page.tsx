import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata = { title: "Anmelden" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  if (session?.user) redirect(params.callbackUrl ?? "/konto");

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Willkommen zurück</h1>
        <p className="text-sm text-muted-foreground">Melde dich mit deinem Konto an</p>
      </div>
      <LoginForm callbackUrl={params.callbackUrl ?? "/konto"} />
      <div className="text-sm text-center space-y-2">
        <div>
          <Link href="/passwort-vergessen" className="text-primary hover:underline">
            Passwort vergessen?
          </Link>
        </div>
        <div className="text-muted-foreground">
          Noch kein Konto?{" "}
          <Link href="/registrieren" className="text-primary hover:underline font-medium">
            Jetzt registrieren
          </Link>
        </div>
      </div>
    </div>
  );
}
