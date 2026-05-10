import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      isAdmin: boolean;
      emailVerified: Date | null;
    };
  }
  interface User {
    isAdmin?: boolean;
    emailVerified?: Date | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    isAdmin?: boolean;
    emailVerified?: Date | null;
  }
}
