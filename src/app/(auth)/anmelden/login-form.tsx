"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/server/actions/auth";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const result = await loginAction(fd);
    setPending(false);
    if (result.ok) {
      // Admins müssen erst 2FA-Code per E-Mail bestätigen, bevor sie wirklich "angemeldet" sind.
      if (result.data?.isAdmin) {
        toast.success("Passwort korrekt. Bitte 2FA-Code per E-Mail bestätigen.");
        router.push("/admin/2fa");
      } else {
        toast.success("Erfolgreich angemeldet");
        router.push(callbackUrl);
      }
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Passwort</Label>
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Wird angemeldet…" : "Anmelden"}
      </Button>
    </form>
  );
}
