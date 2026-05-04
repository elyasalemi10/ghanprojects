// src/lib/auth.ts
// NextAuth configuration with credentials provider and role-based session

import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import type { Role } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 }, // 30 days
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: { borrower: true },
        });

        if (!user || !user.active) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          borrowerId: user.borrowerId,
          permissions: user.permissions as Record<string, string[]> | null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.borrowerId = (user as any).borrowerId;
        token.permissions = (user as any).permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).borrowerId = token.borrowerId;
        (session.user as any).permissions = token.permissions;
      }
      return session;
    },
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user as
    | {
        id: string;
        email: string;
        name: string;
        role: Role;
        borrowerId: string | null;
        permissions: Record<string, string[]> | null;
      }
    | undefined;
}

// Check if user is owner
export function isOwner(user: { role: Role } | undefined): boolean {
  return user?.role === "OWNER";
}

// Check if user is owner or admin
export function isStaff(user: { role: Role } | undefined): boolean {
  return user?.role === "OWNER" || user?.role === "ADMIN";
}

// Check if admin has a specific permission
export function hasPermission(
  user: { role: Role; permissions: Record<string, string[]> | null } | undefined,
  resource: string,
  action: string
): boolean {
  if (!user) return false;
  if (user.role === "OWNER") return true; // Owner always has full access
  if (user.role === "ADMIN") {
    const perms = user.permissions?.[resource] || [];
    return perms.includes(action);
  }
  return false;
}

// Hash a password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}
