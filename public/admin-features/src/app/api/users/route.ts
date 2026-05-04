// src/app/api/users/route.ts
// User management - create lender/admin accounts (owner only)

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isOwner, hashPassword } from "@/lib/auth";
import {
  ok,
  fail,
  unauthorized,
  forbidden,
  serverError,
  logAction,
  getRequestMeta,
} from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!isOwner(user)) return forbidden();

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");

    const users = await prisma.user.findMany({
      where: role ? { role: role as any } : undefined,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        active: true,
        permissions: true,
        borrowerId: true,
        lastLogin: true,
        createdAt: true,
        borrower: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(users);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!isOwner(user)) return forbidden();

    const body = await req.json();
    const { email, name, password, role, phone, borrowerId, permissions } = body;

    if (!email || !name || !password || !role) {
      return fail("email, name, password, and role are required");
    }
    if (!["OWNER", "ADMIN", "LENDER"].includes(role)) {
      return fail("Invalid role");
    }
    if (role === "LENDER" && !borrowerId) {
      return fail("LENDER users must be linked to a borrower");
    }

    const exists = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (exists) return fail("Email already in use", 409);

    if (borrowerId) {
      const borrower = await prisma.borrower.findUnique({ where: { id: borrowerId } });
      if (!borrower) return fail("Borrower not found", 404);
      const linked = await prisma.user.findUnique({ where: { borrowerId } });
      if (linked) return fail("Borrower already has a user account", 409);
    }

    const hashed = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        password: hashed,
        role,
        phone,
        borrowerId: borrowerId || null,
        permissions: role === "ADMIN" ? permissions || {} : null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        active: true,
        borrowerId: true,
      },
    });

    const meta = getRequestMeta(req);
    await logAction({
      userId: user.id,
      action: "USER_CREATED",
      entityType: "User",
      entityId: newUser.id,
      details: { role, email: newUser.email },
      ...meta,
    });

    return ok(newUser, 201);
  } catch (e) {
    return serverError(e);
  }
}
