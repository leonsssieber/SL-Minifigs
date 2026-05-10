"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-destructive/5">
      <div className="container max-w-md text-center py-16">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-destructive text-destructive-foreground font-black text-2xl mb-6 shadow-lg shadow-destructive/20">
          !
        </div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
          Etwas ist schiefgelaufen
        </h1>
        <p className="text-muted-foreground mb-8">
          Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut — falls
          das Problem bestehen bleibt, lass es uns wissen.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground mb-6 font-mono">
            Fehler-ID: {error.digest}
          </p>
        )}
        <div className="flex flex-wrap gap-3 justify-center">
          <Button size="lg" onClick={reset}>Erneut versuchen</Button>
          <Link href="/">
            <Button size="lg" variant="outline">Zur Startseite</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
