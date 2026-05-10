"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordResetAction } from "@/server/actions/auth";

export default function PasswordForgotPage() {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const result = await requestPasswordResetAction(fd);
    setPending(false);
    if (result.ok) {
      setDone(true);
    } else {
      toast.error(result.error);
    }
  }

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold">Email gesendet</h1>
        <p className="text-sm text-muted-foreground">
          Falls ein Konto mit dieser Email existiert, haben wir dir Anweisungen geschickt.
        </p>
        <Link href="/anmelden" className="text-primary hover:underline">Zurück zur Anmeldung</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Passwort vergessen</h1>
        <p className="text-sm text-muted-foreground">Wir senden dir einen Link zum Zurücksetzen</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Wird gesendet…" : "Link senden"}
        </Button>
      </form>
      <Link href="/anmelden" className="block text-sm text-center text-primary hover:underline">
        Zurück zur Anmeldung
      </Link>
    </div>
  );
}
