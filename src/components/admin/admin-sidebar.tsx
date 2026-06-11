"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingBag,
  Truck,
  Users,
  Settings,
  Download,
  LogOut,
  ExternalLink,
  ArrowLeftRight,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/layout/logo";
import { logoutAction } from "@/server/actions/auth";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/produkte", label: "Produkte", icon: Package },
  { href: "/admin/kategorien", label: "Kategorien", icon: Tag },
  { href: "/admin/bestellungen", label: "Bestellungen", icon: ShoppingBag },
  { href: "/admin/versand", label: "Versand", icon: Truck },
  { href: "/admin/kunden", label: "Kunden", icon: Users },
  { href: "/admin/ankauf", label: "Ankauf", icon: ArrowLeftRight },
  { href: "/admin/papierkorb", label: "Papierkorb", icon: Trash2 },
  { href: "/admin/export", label: "Export", icon: Download },
  { href: "/admin/einstellungen", label: "Einstellungen", icon: Settings },
];

export function AdminSidebar({ shopName }: { shopName: string }) {
  const pathname = usePathname();
  return (
    <aside className="w-64 border-r bg-muted/20 flex flex-col">
      <div className="h-16 border-b px-6 flex items-center font-bold gap-2.5">
        <Logo size="sm" />
        <span className="truncate">{shopName}</span>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                active ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3 space-y-1">
        <Link
          href="/"
          target="_blank"
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
    </aside>
  );
}
