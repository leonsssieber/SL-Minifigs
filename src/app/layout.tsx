import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const shopName = process.env.NEXT_PUBLIC_SHOP_NAME ?? "SL Minifigs";
const shopUrl = process.env.NEXT_PUBLIC_SHOP_URL ?? "http://localhost:3000";
const shopDescription =
  "Handverlesene LEGO®-Minifiguren, Sets und Einzelteile aus zweiter Hand — geprüft, fair bepreist und schnell aus der Schweiz versendet.";

export const metadata: Metadata = {
  title: {
    default: `${shopName} — LEGO® Minifiguren & Sets aus der Schweiz`,
    template: `%s | ${shopName}`,
  },
  description: shopDescription,
  metadataBase: new URL(shopUrl),
  applicationName: shopName,
  keywords: [
    "LEGO Minifiguren", "LEGO Sets kaufen", "LEGO Schweiz", "Minifiguren gebraucht",
    "LEGO Einzelteile", "Minifigs", "LEGO Ankauf", "Sammlerfiguren", shopName,
  ],
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    locale: "de_CH",
    siteName: shopName,
    title: `${shopName} — LEGO® Minifiguren & Sets aus der Schweiz`,
    description: shopDescription,
    url: shopUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: `${shopName} — LEGO® Minifiguren & Sets`,
    description: shopDescription,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased min-h-screen flex flex-col`}>
        {children}
        <Toaster position="top-right" richColors closeButton />
        <Analytics />
      </body>
    </html>
  );
}
