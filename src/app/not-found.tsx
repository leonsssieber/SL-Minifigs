import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container max-w-md text-center py-16">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary text-primary-foreground font-black text-2xl tracking-tight mb-6 shadow-lg shadow-primary/20">
          SL
        </div>
        <h1 className="text-7xl font-black tracking-tight mb-2">404</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Diese Seite konnte leider nicht gefunden werden.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/">
            <Button size="lg">Zur Startseite</Button>
          </Link>
          <Link href="/produkte">
            <Button size="lg" variant="outline">Alle Produkte</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
