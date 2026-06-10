import Link from "next/link";

export function Footer({ shopName }: { shopName: string }) {
  return (
    <footer className="border-t mt-auto">
      <div className="container py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 font-semibold tracking-tight mb-4">
              <span className="inline-block h-7 w-7 rounded-lg bg-primary text-primary-foreground grid place-items-center text-[10px] font-black tracking-tight">SL</span>
              <h3>{shopName}</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Handverlesene LEGO® Minifiguren, Sets und Einzelteile — geprüft, fair bepreist, aus der Schweiz.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-4 text-sm">Shop</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link href="/produkte" className="hover:text-foreground transition-colors">Alle Produkte</Link></li>
              <li><Link href="/kategorie/lego-sets" className="hover:text-foreground transition-colors">Lego Sets</Link></li>
              <li><Link href="/kategorie/minifiguren" className="hover:text-foreground transition-colors">Minifiguren</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-4 text-sm">Service</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link href="/ankauf" className="hover:text-foreground transition-colors">LEGO ankaufen</Link></li>
              <li><Link href="/kontakt" className="hover:text-foreground transition-colors">Kontakt</Link></li>
              <li><Link href="/widerruf" className="hover:text-foreground transition-colors">Widerrufsrecht</Link></li>
              <li><Link href="/agb" className="hover:text-foreground transition-colors">AGB</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-4 text-sm">Rechtliches</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link href="/impressum" className="hover:text-foreground transition-colors">Impressum</Link></li>
              <li><Link href="/datenschutz" className="hover:text-foreground transition-colors">Datenschutz</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t text-xs text-muted-foreground flex flex-col sm:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} {shopName}. Alle Rechte vorbehalten.</span>
          <span>Nicht angeschlossen an die LEGO Group. LEGO® ist eine eingetragene Marke der LEGO Group.</span>
        </div>
      </div>
    </footer>
  );
}
