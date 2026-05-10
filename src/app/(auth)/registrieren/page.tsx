import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { RegisterForm } from "./register-form";

export const metadata = { title: "Registrieren" };

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/konto");

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Konto erstellen</h1>
        <p className="text-sm text-muted-foreground">Schneller bestellen, Bestellungen verfolgen, Wunschliste</p>
      </div>
      <RegisterForm />
      <div className="text-sm text-center text-muted-foreground">
        Bereits ein Konto?{" "}
        <Link href="/anmelden" className="text-primary hover:underline font-medium">
          Anmelden
        </Link>
      </div>
    </div>
  );
}
