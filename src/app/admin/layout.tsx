import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { verify2faCookie, TWO_FA_COOKIE_NAME } from "@/lib/two-factor-cookie";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/anmelden?callbackUrl=/admin");
  if (!session.user.isAdmin) redirect("/");

  // Im 2FA-Limbo (eingeloggt aber noch nicht 2FA-verifiziert) zeigen wir KEIN Sidebar,
  // damit der Admin nicht navigieren kann und nur die 2FA-Seite sieht.
  // Middleware sorgt dafür, dass die einzige /admin-Route die ein unverifizierter
  // Admin überhaupt erreichen kann /admin/2fa ist.
  const jar = await cookies();
  const cookieValue = jar.get(TWO_FA_COOKIE_NAME)?.value;
  const twoFaVerified = cookieValue ? await verify2faCookie(cookieValue, session.user.id) : false;

  if (!twoFaVerified) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  const shopName = process.env.NEXT_PUBLIC_SHOP_NAME ?? "SL Minifigs";

  return (
    <div className="min-h-screen lg:flex bg-background">
      <AdminSidebar shopName={shopName} />
      <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
    </div>
  );
}
