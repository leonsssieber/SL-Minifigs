"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerAction } from "@/server/actions/auth";

export function RegisterForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setErrors({});
    const fd = new FormData(e.currentTarget);
    const result = await registerAction(fd);
    setPending(false);
    if (result.ok) {
      toast.success("Konto erstellt — bitte Email bestätigen");
      router.push("/anmelden");
    } else {
      toast.error(result.error);
      if (result.fieldErrors) setErrors(result.fieldErrors);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" autoComplete="off">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required autoComplete="name" />
        {errors.name && <p className="text-xs text-destructive">{errors.name[0]}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
        {errors.email && <p className="text-xs text-destructive">{errors.email[0]}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Passwort</Label>
        <Input id="password" name="password" type="password" required autoComplete="new-password" />
        <p className="text-xs text-muted-foreground">
          Mind. 8 Zeichen, mit Klein-/Grossbuchstabe und Zahl
        </p>
        {errors.password && <p className="text-xs text-destructive">{errors.password[0]}</p>}
      </div>
      {/* Honeypot */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="absolute -left-[9999px]"
        aria-hidden="true"
      />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Erstelle Konto…" : "Konto erstellen"}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Mit der Registrierung akzeptierst du unsere{" "}
        <a href="/agb" className="underline">AGB</a> und{" "}
        <a href="/datenschutz" className="underline">Datenschutzerklärung</a>.
      </p>
    </form>
  );
}
