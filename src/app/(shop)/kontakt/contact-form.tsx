"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendContactMessage } from "@/server/actions/contact";

export function ContactForm() {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const r = await sendContactMessage(fd);
    setPending(false);
    if (r.ok) { toast.success("Nachricht gesendet"); setDone(true); }
    else toast.error(r.error);
  }

  if (done) {
    return (
      <div className="rounded-md border p-6 text-center">
        <h2 className="text-xl font-bold mb-2">Vielen Dank!</h2>
        <p className="text-muted-foreground">Wir melden uns bald.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Name *</Label><Input name="name" required autoComplete="name" /></div>
        <div className="space-y-2"><Label>Email *</Label><Input name="email" type="email" required autoComplete="email" /></div>
      </div>
      <div className="space-y-2"><Label>Betreff *</Label><Input name="subject" required /></div>
      <div className="space-y-2"><Label>Nachricht *</Label><Textarea name="message" required rows={6} /></div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="absolute -left-[9999px]" aria-hidden="true" />
      <Button type="submit" disabled={pending}>{pending ? "Wird gesendet…" : "Senden"}</Button>
    </form>
  );
}
