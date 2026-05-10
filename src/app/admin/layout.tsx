import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/anmelden?callbackUrl=/admin");
  if (!session.user.isAdmin) redirect("/");

  const shopName = process.env.NEXT_PUBLIC_SHOP_NAME ?? "SL Minifigs";

  return (
    <div className="min-h-screen flex bg-background">
      <AdminSidebar shopName={shopName} />
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
