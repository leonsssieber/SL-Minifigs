import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: process.env.NEXT_PUBLIC_SHOP_NAME ?? "SL Minifigs",
    template: `%s | ${process.env.NEXT_PUBLIC_SHOP_NAME ?? "SL Minifigs"}`,
  },
  description: "SL Minifigs — handverlesene LEGO®-Minifiguren, Sets und Einzelteile aus zweiter Hand. Versand aus der Schweiz.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SHOP_URL ?? "http://localhost:3000"),
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col`}>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
