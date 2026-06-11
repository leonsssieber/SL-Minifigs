import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const shopName = process.env.NEXT_PUBLIC_SHOP_NAME ?? "SL Minifigs";
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background">
        <div className="container h-16 flex items-center">
          <Link href="/" className="group flex items-center gap-2.5 font-display font-bold tracking-tight">
            <Logo className="transition-transform group-hover:-rotate-6" />
            <span>{shopName}</span>
          </Link>
        </div>
      </header>
      <main className="flex-1 bg-muted/30">
        <div className="container py-12 sm:py-16 grid place-items-center">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
    </div>
  );
}
