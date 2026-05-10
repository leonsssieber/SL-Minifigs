import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata = { title: "Mein Konto" };

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/anmelden?callbackUrl=/konto");

  const shopName = process.env.NEXT_PUBLIC_SHOP_NAME ?? "SL Minifigs";
  const navItems = [
    { href: "/konto", label: "Übersicht" },
    { href: "/konto/bestellungen", label: "Bestellungen" },
    { href: "/konto/wunschliste", label: "Wunschliste" },
    { href: "/konto/adressen", label: "Adressen" },
    { href: "/konto/einstellungen", label: "Einstellungen" },
  ];

  return (
    <>
      <Header
        user={{
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          isAdmin: session.user.isAdmin,
        }}
        shopName={shopName}
      />
      <main className="flex-1">
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-6">Mein Konto</h1>
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8">
            <nav className="space-y-1">
              {navItems.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="block px-3 py-2 rounded-md text-sm hover:bg-muted"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
            <div>{children}</div>
          </div>
        </div>
      </main>
      <Footer shopName={shopName} />
    </>
  );
}
