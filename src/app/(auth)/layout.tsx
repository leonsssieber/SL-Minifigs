import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const shopName = process.env.NEXT_PUBLIC_SHOP_NAME ?? "SL Minifigs";
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background">
        <div className="container h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <span className="inline-block h-8 w-8 rounded-lg bg-primary text-primary-foreground grid place-items-center text-xs font-black tracking-tight">SL</span>
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
