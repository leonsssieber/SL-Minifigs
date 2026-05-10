import { auth } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const shopName = process.env.NEXT_PUBLIC_SHOP_NAME ?? "SL Minifigs";

  return (
    <>
      <Header
        user={
          session?.user
            ? {
                id: session.user.id,
                email: session.user.email,
                name: session.user.name,
                isAdmin: session.user.isAdmin,
              }
            : null
        }
        shopName={shopName}
      />
      <main className="flex-1">{children}</main>
      <Footer shopName={shopName} />
    </>
  );
}
