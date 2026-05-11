import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validation";
import { authConfig } from "@/lib/auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Passwort", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await db.user.findUnique({
          where: { email: email.toLowerCase() },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            isAdmin: true,
            emailVerified: true,
            hashedPassword: true,
            twoFactorEnabled: true,
          },
        });

        if (!user || !user.hashedPassword) return null;

        const valid = await bcrypt.compare(password, user.hashedPassword);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          isAdmin: user.isAdmin,
          emailVerified: user.emailVerified,
          twoFactorEnabled: user.twoFactorEnabled,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id as string;
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false;
        token.emailVerified = (user as { emailVerified?: Date | null }).emailVerified ?? null;
        token.twoFactorEnabled = (user as { twoFactorEnabled?: boolean }).twoFactorEnabled ?? false;
      }
      // Frische Daten alle ~5 min oder bei session.update()
      if (trigger === "update" || (token.iat && Date.now() / 1000 - (token.iat as number) > 300)) {
        if (token.id) {
          const fresh = await db.user.findUnique({
            where: { id: token.id as string },
            select: {
              isAdmin: true,
              emailVerified: true,
              email: true,
              name: true,
              twoFactorEnabled: true,
            },
          });
          if (fresh) {
            token.isAdmin = fresh.isAdmin;
            token.emailVerified = fresh.emailVerified;
            token.email = fresh.email;
            token.name = fresh.name;
            token.twoFactorEnabled = fresh.twoFactorEnabled;
          }
        }
      }
      return token;
    },
  },
});
