export const dynamic = "force-dynamic";

import { ContactForm } from "./contact-form";
import { getSettings } from "@/server/actions/settings";

export const metadata = { title: "Kontakt" };

export default async function ContactPage() {
  const s = await getSettings(["shop_email", "shop_phone"]);

  return (
    <div className="container py-12 max-w-2xl">
      <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-tight mb-2">Kontakt</h1>
      <p className="text-muted-foreground mb-8">
        Schreib uns eine Nachricht — wir melden uns innerhalb von 1–2 Tagen.
      </p>
      {(s.shop_email || s.shop_phone) && (
        <div className="rounded-lg border bg-card p-4 mb-6 text-sm space-y-1">
          {s.shop_email && (
            <div className="flex gap-2">
              <span className="text-muted-foreground w-16 shrink-0">E-Mail</span>
              <a href={`mailto:${s.shop_email}`} className="font-medium hover:underline">{s.shop_email}</a>
            </div>
          )}
          {s.shop_phone && (
            <div className="flex gap-2">
              <span className="text-muted-foreground w-16 shrink-0">Telefon</span>
              <span className="font-medium">{s.shop_phone}</span>
            </div>
          )}
        </div>
      )}
      <ContactForm />
    </div>
  );
}