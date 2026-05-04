// src/app/api/loans/route.ts
// GET /api/loans - list (filtered by role)
// POST /api/loans - create new loan (owner/admin only)

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

// ============================================
// GET /api/loans - list loans
// ============================================
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const projectId = searchParams.get("projectId");
    const borrowerId = searchParams.get("borrowerId");

    // Lenders can only see their own loans
    const where: any = {};
    if (user.role === "LENDER") {
      if (!user.borrowerId) return ok([]);
      where.borrowerId = user.borrowerId;
    } else if (user.role === "ADMIN") {
      if (!hasPermission(user, "loans", "view")) return forbidden();
    }

    if (status) where.status = status;
    if (projectId) where.projectId = projectId;
    if (borrowerId && user.role !== "LENDER") where.borrowerId = borrowerId;

    const loans = await prisma.loan.findMany({
      where,
      include: {
        borrower: { select: { id: true, fullName: true, email: true } },
        project: { select: { id: true, name: true, status: true } },
        _count: { select: { transactions: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(loans);
  } catch (e) {
    return serverError(e);
  }
}

// ============================================
// POST /api/loans - create new loan
// ============================================
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!isStaff(user)) return forbidden();
    if (user.role === "ADMIN" && !hasPermission(user, "loans", "create")) {
      return forbidden();
    }

    const body = await req.json();
    const {
      borrowerId,
      projectId,
      loanType,
      principal,
      interestRate,
      profitSharePercent,
      startDate,
      maturityDate,
      termMonths,
      paymentAmount,
      paymentDay,
      notes,
      customFields,
    } = body;

    // Basic validation
    if (!borrowerId || !loanType || !principal || !startDate || !maturityDate || !termMonths) {
      return fail("Missing required fields: borrowerId, loanType, principal, startDate, maturityDate, termMonths");
    }
    if (!["FIXED_MONTHLY", "FIXED_END", "PROFIT_SHARE"].includes(loanType)) {
      return fail("Invalid loanType");
    }
    if (loanType === "PROFIT_SHARE" && !projectId) {
      return fail("PROFIT_SHARE loans must be linked to a project");
    }

    // Verify borrower exists
    const borrower = await prisma.borrower.findUnique({ where: { id: borrowerId } });
    if (!borrower) return fail("Borrower not found", 404);

    // Verify project if specified
    if (projectId) {
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) return fail("Project not found", 404);
    }

    const loan = await prisma.loan.create({
      data: {
        borrowerId,
        projectId: projectId || null,
        loanType,
        principal,
        currentBalance: principal,
        interestRate,
        profitSharePercent: profitSharePercent || null,
        startDate: new Date(startDate),
        maturityDate: new Date(maturityDate),
        termMonths,
        paymentAmount: paymentAmount || null,
        paymentDay: paymentDay || null,
        notes,
        customFields: customFields || null,
        status: "PENDING",
      },
      include: {
        borrower: { select: { id: true, fullName: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });

    const meta = getRequestMeta(req);
    await logAction({
      userId: user.id,
      action: "LOAN_CREATED",
      entityType: "Loan",
      entityId: loan.id,
      details: { principal, borrowerId, loanType },
      ...meta,
    });

    return ok(loan, 201);
  } catch (e) {
    return serverError(e);
  }
}
