import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const session = req.auth;
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (!session?.user) {
      const url = req.nextUrl.clone();
      url.pathname = "/anmelden";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    if (!session.user.isAdmin) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/konto")) {
    if (!session?.user) {
      const url = req.nextUrl.clone();
      url.pathname = "/anmelden";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/konto/:path*"],
};
