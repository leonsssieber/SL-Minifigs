import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";
import { verify2faCookie, TWO_FA_COOKIE_NAME } from "@/lib/two-factor-cookie";

const { auth } = NextAuth(authConfig);

export default auth(async (req) => {
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

    // 2FA: Wenn aktiviert und nicht die 2FA-Seite selbst, Cookie prüfen
    if (session.user.twoFactorEnabled && pathname !== "/admin/2fa") {
      const cookie = req.cookies.get(TWO_FA_COOKIE_NAME)?.value;
      const verified = cookie ? await verify2faCookie(cookie, session.user.id) : false;
      if (!verified) {
        const url = req.nextUrl.clone();
        url.pathname = "/admin/2fa";
        return NextResponse.redirect(url);
      }
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
