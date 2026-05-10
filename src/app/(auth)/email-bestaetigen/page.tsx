import Link from "next/link";
import { verifyEmailAction } from "@/server/actions/auth";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;
  if (!token || !email) {
    return (
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Ungültiger Link</h1>
        <Link href="/" className="text-primary hover:underline">Zur Startseite</Link>
      </div>
    );
  }

  const result = await verifyEmailAction(token, email);

  if (!result.ok) {
    return (
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Bestätigung fehlgeschlagen</h1>
        <p className="text-sm text-muted-foreground">{result.error}</p>
        <Link href="/anmelden" className="text-primary hover:underline">Zur Anmeldung</Link>
      </div>
    );
  }

  return (
    <div className="text-center space-y-4">
      <div className="inline-block h-16 w-16 rounded-full bg-green-100 text-green-700 grid place-items-center text-3xl">
        ✓
      </div>
      <h1 className="text-2xl font-bold">Email bestätigt</h1>
      <p className="text-sm text-muted-foreground">Du kannst dich jetzt anmelden.</p>
      <Link href="/anmelden" className="text-primary hover:underline font-medium">
        Zur Anmeldung →
      </Link>
    </div>
  );
}
