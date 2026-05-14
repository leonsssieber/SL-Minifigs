import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";
import { verify2faCookie, TWO_FA_COOKIE_NAME } from "@/lib/two-factor-cookie";

const { auth } = NextAuth(authConfig);

export default auth(async (req) => {
  const session = req.auth;
  const { pathname } = req.nextUrl;

  // --- Admin im Limbo-Zustand (eingeloggt, aber 2FA noch offen) ---
  // Ein Admin gilt erst dann als "wirklich eingeloggt", wenn er das 2FA-Cookie hat.
  // Bis dahin darf er NIRGENDS hin — nur die 2FA-Seite und Logout.
  if (session?.user?.isAdmin) {
    const cookie = req.cookies.get(TWO_FA_COOKIE_NAME)?.value;
    const verified = cookie ? await verify2faCookie(cookie, session.user.id) : false;
    if (!verified) {
      // Pfade, die auch im Limbo erlaubt sind (sonst kein Weg raus):
      // - /admin/2fa: die Verifikationsseite selbst
      // - /api/auth/*: NextAuth-Endpoints (Logout, Session-Check)
      // - /anmelden: falls jemand zurück zum Login will
      const allowed =
        pathname === "/admin/2fa" ||
        pathname.startsWith("/api/auth/") ||
        pathname === "/anmelden";

      if (!allowed) {
        // API-Routes: 403 statt Redirect (JSON-Clients sollen klar einen Fehler bekommen).
        if (pathname.startsWith("/api/")) {
          return new NextResponse("2FA erforderlich", { status: 403 });
        }
        const url = req.nextUrl.clone();
        url.pathname = "/admin/2fa";
        url.search = "";
        return NextResponse.redirect(url);
      }
    }
  }

  // --- /admin Schutz für Nicht-Admins / nicht eingeloggte ---
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

  // --- /konto Schutz ---
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
  // Middleware läuft auf allen Routen ausser Next-internen Pfaden und statischen Assets.
  // Wichtig für die Admin-2FA-Sperre: ohne diesen breiten Match könnte ein Admin
  // im Limbo-Zustand die öffentliche Seite trotzdem besuchen.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|setup-anleitung.pdf|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|woff2?|ttf|map)$).*)",
  ],
};
