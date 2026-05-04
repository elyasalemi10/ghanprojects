// src/app/api/borrowers/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasPermission, isStaff } from "@/lib/auth";
import {
  ok,
  fail,
  unauthorized,
  forbidden,
  serverError,
  logAction,
  getRequestMeta,
} from "@/lib/api-helpers";

// GET /api/borrowers - list all (staff only)
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!isStaff(user)) return forbidden();
    if (user.role === "ADMIN" && !hasPermission(user, "borrowers", "view")) {
      return forbidden();
    }

    const { searchParams } = new URL(req.url);
    const active = searchParams.get("active");

    const borrowers = await prisma.borrower.findMany({
      where: active !== null ? { active: active === "true" } : undefined,
      include: {
        _count: { select: { loans: true } },
      },
      orderBy: { fullName: "asc" },
    });

    return ok(borrowers);
  } catch (e) {
    return serverError(e);
  }
}

// POST /api/borrowers - create
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!isStaff(user)) return forbidden();
    if (user.role === "ADMIN" && !hasPermission(user, "borrowers", "create")) {
      return forbidden();
    }

    const body = await req.json();
    const { fullName, email, phone, address, idNumber, idType, notes, customFields } = body;

    if (!fullName || !email) return fail("fullName and email are required");

    const existing = await prisma.borrower.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) return fail("A borrower with this email already exists", 409);

    const borrower = await prisma.borrower.create({
      data: {
        fullName,
        email: email.toLowerCase(),
        phone,
        address,
        idNumber,
        idType,
        notes,
        customFields: customFields || null,
      },
    });

    const meta = getRequestMeta(req);
    await logAction({
      userId: user.id,
      action: "BORROWER_CREATED",
      entityType: "Borrower",
      entityId: borrower.id,
      details: { email: borrower.email },
      ...meta,
    });

    return ok(borrower, 201);
  } catch (e) {
    return serverError(e);
  }
}
