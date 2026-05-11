import type { NextConfig } from "next";

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://*.paypal.com https://www.paypalobjects.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https://*.public.blob.vercel-storage.com;
  font-src 'self' data:;
  frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://*.paypal.com;
  connect-src 'self' https://api.stripe.com https://*.paypal.com https://vercel.com https://*.public.blob.vercel-storage.com https://blob.vercel-storage.com;
  form-action 'self' https://*.paypal.com;
  base-uri 'self';
  object-src 'none';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`.replace(/\s+/g, " ").trim();

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspHeader },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/((?!api/webhooks).*)",
        headers: securityHeaders,
      },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
