"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Tag,
  Tags,
  ShoppingBag,
  Truck,
  Users,
  Settings,
  Download,
  LogOut,
  ExternalLink,
  ArrowLeftRight,
  Trash2,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/layout/logo";
import { logoutAction } from "@/server/actions/auth";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/produkte", label: "Produkte", icon: Package },
  { href: "/admin/kategorien", label: "Kategorien", icon: Tag },
  { href: "/admin/zustaende", label: "Zustände", icon: Tags },
  { href: "/admin/bestellungen", label: "Bestellungen", icon: ShoppingBag },
  { href: "/admin/versand", label: "Versand", icon: Truck },
  { href: "/admin/kunden", label: "Kunden", icon: Users },
  { href: "/admin/ankauf", label: "Ankauf", icon: ArrowLeftRight },
  { href: "/admin/papierkorb", label: "Papierkorb", icon: Trash2 },
  { href: "/admin/export", label: "Export", icon: Download },
  { href: "/admin/einstellungen", label: "Einstellungen", icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
              active ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="border-t p-3 space-y-1">
      <Link
        href="/"
        target="_blank"
        onClick={onNavigate}
        className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
      >
        <ExternalLink className="h-4 w-4" />
        Shop ansehen
      </Link>
      <form action={logoutAction}>
        <button
          type="submit"
          className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Abmelden
        </button>
      </form>
    </div>
  );
}

export function AdminSidebar({ shopName }: { shopName: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const close = () => setMobileOpen(false);

  return (
    <>
      {/* Desktop-Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 border-r bg-muted/20 flex-col h-screen sticky top-0">
        <div className="h-16 border-b px-6 flex items-center font-bold gap-2.5">
          <Logo size="sm" />
          <span className="truncate">{shopName}</span>
        </div>
        <NavLinks />
        <SidebarFooter />
      </aside>

      {/* Mobile-Topbar */}
      <div className="lg:hidden sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background px-4">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Menü öffnen"
          className="p-1 -ml-1 text-foreground/80 hover:text-foreground"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 font-bold">
          <Logo size="sm" />
          <span className="truncate">{shopName}</span>
        </div>
      </div>

      {/* Mobile-Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={close}
            aria-hidden
          />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-background border-r flex flex-col shadow-xl">
            <div className="h-14 border-b px-4 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold">
                <Logo size="sm" />
                <span className="truncate">{shopName}</span>
              </div>
              <button onClick={close} aria-label="Menü schliessen" className="p-1 text-foreground/80 hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks onNavigate={close} />
            <SidebarFooter onNavigate={close} />
          </aside>
        </div>
      )}
    </>
  );
}
