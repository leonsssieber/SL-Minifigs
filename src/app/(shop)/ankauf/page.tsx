import { AnkaufForm } from "./ankauf-form";
import { Card } from "@/components/ui/card";
import { Package2, ShieldCheck, Truck, Banknote } from "lucide-react";

export const metadata = {
  title: "LEGO ankaufen — SL Minifigs",
  description: "Wir kaufen deine LEGO-Figuren und Sets an. Schnell, fair und unkompliziert.",
};

const steps = [
  {
    icon: Package2,
    title: "Fotos & Beschreibung",
    text: "Lade Bilder deiner Artikel hoch und beschreibe sie kurz. Gib deinen Wunschpreis an.",
  },
  {
    icon: ShieldCheck,
    title: "Wir prüfen dein Angebot",
    text: "Innerhalb von 1–3 Werktagen melden wir uns mit einer Antwort: Annahme, Gegenangebot oder Ablehnung.",
  },
  {
    icon: Truck,
    title: "Versand",
    text: "Bei Einigung schickst du uns deine Artikel. Wir empfehlen den Einschreibebrief (Haftungsschutz bei Verlust).",
  },
  {
    icon: Banknote,
    title: "Auszahlung",
    text: "Sobald wir die Artikel geprüft und für gut befunden haben, erfolgt die Auszahlung. Stimmt etwas nicht, schicken wir zurück.",
  },
];

export default function AnkaufPage() {
  return (
    <div className="container py-12 max-w-3xl">
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-3">LEGO ankaufen</h1>
        <p className="text-lg text-muted-foreground">
          Wir kaufen deine LEGO-Minifiguren, Sets und Zubehör — fair bewertet, schnell abgewickelt.
        </p>
      </div>

      {/* Ablauf */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {steps.map((step, i) => (
          <Card key={i} className="p-5">
            <div className="flex items-start gap-3">
              <div className="shrink-0 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <step.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    Schritt {i + 1}
                  </span>
                </div>
                <h3 className="font-semibold mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.text}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Versand-Hinweis */}
      <div className="rounded-lg border bg-amber-50 border-amber-200 p-4 mb-8 text-sm">
        <strong className="block mb-1 text-amber-900">Wichtiger Versandhinweis</strong>
        <p className="text-amber-800">
          Wir empfehlen ausdrücklich den{" "}
          <strong>Einschreibebrief (Recommandé)</strong> oder eine Paketsendung mit
          Sendungsverfolgung. Bei normalem Briefversand können wir bei Verlust durch die
          Post <strong>keine Haftung</strong> übernehmen. Bei registrierten Sendungen
          übernehmen wir die Haftung gemäss Postbedingungen. Die Versandkosten gehen zu
          deinen Lasten — auch bei einer allfälligen Rücksendung.
        </p>
      </div>

      {/* Formular */}
      <div className="rounded-xl border bg-card p-6 sm:p-8">
        <h2 className="text-xl font-bold mb-6">Anfrage stellen</h2>
        <AnkaufForm />
      </div>
    </div>
  );
}
