// src/app/api/loans/[id]/route.ts
// GET, PUT, DELETE for individual loan

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

// ============================================
// GET /api/loans/[id]
// ============================================
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const loan = await prisma.loan.findUnique({
      where: { id: params.id },
      include: {
        borrower: true,
        project: true,
        transactions: { orderBy: { paymentDate: "desc" } },
        documents: { orderBy: { createdAt: "desc" } },
        repaymentRequests: { orderBy: { requestedAt: "desc" } },
        topUpRequests: { orderBy: { requestedAt: "desc" } },
      },
    });

    if (!loan) return notFound("Loan");

    // Lenders can only access their own loans
    if (user.role === "LENDER" && loan.borrowerId !== user.borrowerId) {
      return forbidden();
    }
    if (user.role === "ADMIN" && !hasPermission(user, "loans", "view")) {
      return forbidden();
    }

    return ok(loan);
  } catch (e) {
    return serverError(e);
  }
}

// ============================================
// PUT /api/loans/[id]
// ============================================
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!isStaff(user)) return forbidden();
    if (user.role === "ADMIN" && !hasPermission(user, "loans", "edit")) {
      return forbidden();
    }

    const existing = await prisma.loan.findUnique({ where: { id: params.id } });
    if (!existing) return notFound("Loan");

    const body = await req.json();

    // Whitelist editable fields
    const data: any = {};
    const editable = [
      "loanType",
      "principal",
      "currentBalance",
      "interestRate",
      "profitSharePercent",
      "maturityDate",
      "termMonths",
      "paymentAmount",
      "paymentDay",
      "status",
      "notes",
      "customFields",
      "projectId",
    ];
    for (const field of editable) {
      if (body[field] !== undefined) {
        if (field === "maturityDate" || field === "startDate") {
          data[field] = new Date(body[field]);
        } else {
          data[field] = body[field];
        }
      }
    }

    const loan = await prisma.loan.update({
      where: { id: params.id },
      data,
      include: {
        borrower: { select: { id: true, fullName: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });

    const meta = getRequestMeta(req);
    await logAction({
      userId: user.id,
      action: "LOAN_UPDATED",
      entityType: "Loan",
      entityId: loan.id,
      details: { changes: Object.keys(data) },
      ...meta,
    });

    return ok(loan);
  } catch (e) {
    return serverError(e);
  }
}

// ============================================
// DELETE /api/loans/[id]
// Owner only - admins can never delete loans (audit-critical)
// ============================================
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!isOwner(user)) return forbidden();

    const existing = await prisma.loan.findUnique({
      where: { id: params.id },
      include: { _count: { select: { transactions: true } } },
    });
    if (!existing) return notFound("Loan");

    // Soft-protect against deleting loans with transactions
    if (existing._count.transactions > 0) {
      return fail(
        "Cannot delete a loan with recorded transactions. Cancel it instead.",
        409
      );
    }

    await prisma.loan.delete({ where: { id: params.id } });

    const meta = getRequestMeta(req);
    await logAction({
      userId: user.id,
      action: "LOAN_DELETED",
      entityType: "Loan",
      entityId: params.id,
      details: { reference: existing.reference },
      ...meta,
    });

    return ok({ deleted: true });
  } catch (e) {
    return serverError(e);
  }
}
