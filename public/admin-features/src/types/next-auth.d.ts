// src/types/next-auth.d.ts
// Extend NextAuth types with our custom user fields

import type { Role } from "@prisma/client";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    role: Role;
    borrowerId: string | null;
    permissions: Record<string, string[]> | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
      borrowerId: string | null;
      permissions: Record<string, string[]> | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    borrowerId: string | null;
    permissions: Record<string, string[]> | null;
  }
}
