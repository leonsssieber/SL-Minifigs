export const dynamic = "force-dynamic";

import { ContactForm } from "./contact-form";
import { getSettings } from "@/server/actions/settings";

export const metadata = { title: "Kontakt" };

export default async function ContactPage() {
  const s = await getSettings(["shop_email", "shop_phone"]);

  return (
    <div className="container py-12 max-w-2xl">
      <h1 className="text-3xl font-bold mb-2">Kontakt</h1>
      <p className="text-muted-foreground mb-8">
        Schreib uns eine Nachricht — wir melden uns innerhalb von 1–2 Tagen.
      </p>
      {(s.shop_email || s.shop_phone) && (
        <div className="rounded-md border p-4 mb-6 text-sm">
          {s.shop_email && <div>Email: <a href={`mailto:${s.shop_email}`} className="underline">{s.shop_email}</a></div>}
          {s.shop_phone && <div>Telefon: {s.shop_phone}</div>}
        </div>
      )}
      <ContactForm />
    </div>
  );
}