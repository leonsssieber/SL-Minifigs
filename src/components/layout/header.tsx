"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShoppingCart, User, Menu, X, Search, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-store";
import { cn } from "@/lib/utils";

interface HeaderProps {
  user?: { id: string; name?: string | null; email: string; isAdmin: boolean } | null;
  shopName: string;
}

export function Header({ user, shopName }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const totalQty = useCart((s) => s.totalQuantity());

  useEffect(() => {
    setMounted(true);
  }, []);

  const nav = [
    { href: "/produkte", label: "Alle Produkte" },
    { href: "/kategorie/lego-sets", label: "Lego Sets" },
    { href: "/kategorie/minifiguren", label: "Minifiguren" },
    { href: "/ankauf", label: "Ankauf" },
    { href: "/kontakt", label: "Kontakt" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-3 lg:gap-10">
          <button
            className="lg:hidden -ml-1 p-1 text-foreground/80 hover:text-foreground transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menü"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <span className="inline-block h-8 w-8 rounded-lg bg-primary text-primary-foreground grid place-items-center text-xs font-black tracking-tight">
              SL
            </span>
            <span className="hidden sm:inline">{shopName}</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-7">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link href="/produkte" className="hidden sm:block">
            <Button variant="ghost" size="icon" aria-label="Suche">
              <Search className="h-5 w-5" />
            </Button>
          </Link>
          {user ? (
            <Link href="/konto/wunschliste">
              <Button variant="ghost" size="icon" aria-label="Wunschliste" className="hidden sm:inline-flex">
                <Heart className="h-5 w-5" />
              </Button>
            </Link>
          ) : null}
          <Link href="/warenkorb" className="relative">
            <Button variant="ghost" size="icon" aria-label="Warenkorb">
              <ShoppingCart className="h-5 w-5" />
              {mounted && totalQty > 0 && (
                <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-[11px] font-bold grid place-items-center">
                  {totalQty}
                </span>
              )}
            </Button>
          </Link>
          {user ? (
            <Link href="/konto">
              <Button variant="ghost" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden md:inline truncate max-w-[120px]">
                  {user.name ?? user.email}
                </span>
              </Button>
            </Link>
          ) : (
            <Link href="/anmelden">
              <Button variant="ghost" size="sm">Anmelden</Button>
            </Link>
          )}
          {user?.isAdmin && (
            <Link href="/admin" className="hidden md:block">
              <Button variant="outline" size="sm">Admin</Button>
            </Link>
          )}
        </div>
      </div>

      {mobileOpen && (
        <nav className={cn("lg:hidden border-t bg-background")}>
          <div className="container py-3 flex flex-col gap-1">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="px-3 py-2.5 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {n.label}
              </Link>
            ))}
            {user?.isAdmin && (
              <Link
                href="/admin"
                className="px-3 py-2.5 text-sm font-medium rounded-md text-primary hover:bg-muted transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Admin-Bereich
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
