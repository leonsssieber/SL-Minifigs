import type { NextAuthConfig } from "next-auth";

// Edge-safe Konfiguration (keine bcryptjs/Prisma-Imports!)
// Wird von der Middleware verwendet, damit der Edge-Runtime keine
// Node-only Module zu laden versucht.
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/anmelden", error: "/anmelden" },
  trustHost: true,
  providers: [], // Provider werden in lib/auth.ts hinzugefügt
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false;
        token.emailVerified = (user as { emailVerified?: Date | null }).emailVerified ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.isAdmin = (token.isAdmin as boolean) ?? false;
        session.user.emailVerified = token.emailVerified as Date | null;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdminRoute = nextUrl.pathname.startsWith("/admin");
      const isAccountRoute = nextUrl.pathname.startsWith("/konto");

      if (isAdminRoute) {
        if (!isLoggedIn) return false;
        if (!auth?.user?.isAdmin) return false;
        return true;
      }
      if (isAccountRoute) {
        return isLoggedIn;
      }
      return true;
    },
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? "__Secure-authjs.session-token" : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};
