// src/app/api/borrowers/[id]/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasPermission, isStaff, isOwner } from "@/lib/auth";
import {
  ok,
  fail,
  unauthorized,
  forbidden,
  notFound,
  serverError,
  logAction,
  getRequestMeta,
} from "@/lib/api-helpers";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    // Lenders can only view their own borrower record
    if (user.role === "LENDER" && user.borrowerId !== params.id) return forbidden();
    if (user.role === "ADMIN" && !hasPermission(user, "borrowers", "view")) {
      return forbidden();
    }

    const borrower = await prisma.borrower.findUnique({
      where: { id: params.id },
      include: {
        loans: {
          include: {
            project: { select: { id: true, name: true } },
            _count: { select: { transactions: true } },
          },
        },
      },
    });
    if (!borrower) return notFound("Borrower");
    return ok(borrower);
  } catch (e) {
    return serverError(e);
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!isStaff(user)) return forbidden();
    if (user.role === "ADMIN" && !hasPermission(user, "borrowers", "edit")) {
      return forbidden();
    }

    const body = await req.json();
    const data: any = {};
    const editable = ["fullName", "email", "phone", "address", "idNumber", "idType", "notes", "customFields", "active"];
    for (const f of editable) {
      if (body[f] !== undefined) {
        data[f] = f === "email" ? body[f].toLowerCase() : body[f];
      }
    }

    const borrower = await prisma.borrower.update({
      where: { id: params.id },
      data,
    });

    const meta = getRequestMeta(req);
    await logAction({
      userId: user.id,
      action: "BORROWER_UPDATED",
      entityType: "Borrower",
      entityId: borrower.id,
      details: { changes: Object.keys(data) },
      ...meta,
    });

    return ok(borrower);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!isOwner(user)) return forbidden();

    const existing = await prisma.borrower.findUnique({
      where: { id: params.id },
      include: { _count: { select: { loans: true } } },
    });
    if (!existing) return notFound("Borrower");

    if (existing._count.loans > 0) {
      return fail("Cannot delete a borrower with loans. Deactivate instead.", 409);
    }

    await prisma.borrower.delete({ where: { id: params.id } });

    const meta = getRequestMeta(req);
    await logAction({
      userId: user.id,
      action: "BORROWER_DELETED",
      entityType: "Borrower",
      entityId: params.id,
      ...meta,
    });

    return ok({ deleted: true });
  } catch (e) {
    return serverError(e);
  }
}
