"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordAction } from "@/server/actions/auth";

export function PasswordResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    fd.set("token", token);
    const result = await resetPasswordAction(fd);
    setPending(false);
    if (result.ok) {
      toast.success("Passwort gesetzt — bitte anmelden");
      router.push("/anmelden");
    } else {
      toast.error(result.error);
    }
  }

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Ungültiger Link</h1>
        <Link href="/passwort-vergessen" className="text-primary hover:underline">
          Neuen Link anfordern
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-center">Neues Passwort</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Neues Passwort</Label>
          <Input id="password" name="password" type="password" required autoComplete="new-password" />
          <p className="text-xs text-muted-foreground">
            Mind. 8 Zeichen, mit Klein-/Grossbuchstabe und Zahl
          </p>
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Wird gesetzt…" : "Passwort speichern"}
        </Button>
      </form>
    </div>
  );
}
