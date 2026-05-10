import { Suspense } from "react";
import { PasswordResetForm } from "./reset-form";

export const metadata = { title: "Passwort zurücksetzen" };
export const dynamic = "force-dynamic";

export default function PasswordResetPage() {
  return (
    <Suspense fallback={<div className="text-center text-sm text-muted-foreground">Lade…</div>}>
      <PasswordResetForm />
    </Suspense>
  );
}
