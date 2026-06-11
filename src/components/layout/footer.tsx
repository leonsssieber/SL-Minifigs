import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export function Footer({ shopName }: { shopName: string }) {
  return (
    <footer className="border-t-2 border-foreground bg-foreground text-background mt-auto">
      {/* Brick-Farbband */}
      <div className="grid grid-cols-4 h-2" aria-hidden>
        <span className="bg-brick-red" />
        <span className="bg-brick-yellow" />
        <span className="bg-brick-blue" />
        <span className="bg-brick-green" />
      </div>
      <div className="container py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 font-display font-bold tracking-tight mb-4">
              <Logo size="sm" onDark />
              <h3 className="text-lg">{shopName}</h3>
            </div>
            <p className="text-sm text-background/60 leading-relaxed">
              Handverlesene LEGO® Minifiguren, Sets und Einzelteile — geprüft, fair bepreist, aus der Schweiz.
            </p>
          </div>
          <div>
            <h4 className="font-display font-bold uppercase tracking-wider mb-4 text-xs text-background/50">Shop</h4>
            <ul className="space-y-2.5 text-sm text-background/80">
              <li><Link href="/produkte" className="hover:text-accent transition-colors">Alle Produkte</Link></li>
              <li><Link href="/kategorie/lego-sets" className="hover:text-accent transition-colors">Lego Sets</Link></li>
              <li><Link href="/kategorie/minifiguren" className="hover:text-accent transition-colors">Minifiguren</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold uppercase tracking-wider mb-4 text-xs text-background/50">Service</h4>
            <ul className="space-y-2.5 text-sm text-background/80">
              <li><Link href="/ankauf" className="hover:text-accent transition-colors">LEGO ankaufen</Link></li>
              <li><Link href="/kontakt" className="hover:text-accent transition-colors">Kontakt</Link></li>
              <li><Link href="/widerruf" className="hover:text-accent transition-colors">Widerrufsrecht</Link></li>
              <li><Link href="/agb" className="hover:text-accent transition-colors">AGB</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold uppercase tracking-wider mb-4 text-xs text-background/50">Rechtliches</h4>
            <ul className="space-y-2.5 text-sm text-background/80">
              <li><Link href="/impressum" className="hover:text-accent transition-colors">Impressum</Link></li>
              <li><Link href="/datenschutz" className="hover:text-accent transition-colors">Datenschutz</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-background/20 text-xs text-background/50 flex flex-col sm:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} {shopName}. Alle Rechte vorbehalten.</span>
          <span>Nicht angeschlossen an die LEGO Group. LEGO® ist eine eingetragene Marke der LEGO Group.</span>
        </div>
      </div>
    </footer>
  );
}
