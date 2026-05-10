import Link from "next/link";

export function Footer({ shopName }: { shopName: string }) {
  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="container py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 font-bold mb-4">
              <span className="inline-block h-7 w-7 rounded-md bg-primary text-primary-foreground grid place-items-center text-[10px] font-black tracking-tight">SL</span>
              <h3>{shopName}</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Handverlesene LEGO® Minifiguren, Sets und Einzelteile — geprüft, fair bepreist, aus der Schweiz.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Shop</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/produkte" className="hover:text-foreground">Alle Produkte</Link></li>
              <li><Link href="/kategorie/lego-sets" className="hover:text-foreground">Lego Sets</Link></li>
              <li><Link href="/kategorie/minifiguren" className="hover:text-foreground">Minifiguren</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Service</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/kontakt" className="hover:text-foreground">Kontakt</Link></li>
              <li><Link href="/widerruf" className="hover:text-foreground">Widerrufsrecht</Link></li>
              <li><Link href="/agb" className="hover:text-foreground">AGB</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Rechtliches</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/impressum" className="hover:text-foreground">Impressum</Link></li>
              <li><Link href="/datenschutz" className="hover:text-foreground">Datenschutz</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t text-xs text-muted-foreground flex flex-col sm:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} {shopName}. Alle Rechte vorbehalten.</span>
          <span>Nicht angeschlossen an die LEGO Group. LEGO® ist eine eingetragene Marke der LEGO Group.</span>
        </div>
      </div>
    </footer>
  );
}
