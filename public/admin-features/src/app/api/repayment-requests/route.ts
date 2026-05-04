// src/app/api/repayment-requests/route.ts
// Lenders request early repayment; staff list all requests

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

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status) where.status = status;

    if (user.role === "LENDER") {
      if (!user.borrowerId) return ok([]);
      where.loan = { borrowerId: user.borrowerId };
    }
    if (user.role === "ADMIN" && !hasPermission(user, "repayments", "view")) {
      return forbidden();
    }

    const requests = await prisma.repaymentRequest.findMany({
      where,
      include: {
        loan: {
          select: {
            id: true,
            reference: true,
            currentBalance: true,
            borrower: { select: { id: true, fullName: true } },
            project: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { requestedAt: "desc" },
    });

    return ok(requests);
  } catch (e) {
    return serverError(e);
  }
}

// Lenders create the request, staff create a request on a lender's behalf too
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await req.json();
    const { loanId, requestedAmount, isPartial, reason } = body;

    if (!loanId || !requestedAmount) {
      return fail("loanId and requestedAmount are required");
    }

    const loan = await prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan) return fail("Loan not found", 404);

    // Lenders can only request on their own loans
    if (user.role === "LENDER" && loan.borrowerId !== user.borrowerId) {
      return forbidden();
    }

    if (Number(requestedAmount) > Number(loan.currentBalance)) {
      return fail("Requested amount exceeds current loan balance");
    }

    const request = await prisma.repaymentRequest.create({
      data: {
        loanId,
        requestedAmount,
        isPartial: isPartial ?? Number(requestedAmount) < Number(loan.currentBalance),
        reason,
        status: "PENDING",
      },
    });

    const meta = getRequestMeta(req);
    await logAction({
      userId: user.id,
      action: "REPAYMENT_REQUESTED",
      entityType: "RepaymentRequest",
      entityId: request.id,
      details: { loanId, amount: requestedAmount },
      ...meta,
    });

    return ok(request, 201);
  } catch (e) {
    return serverError(e);
  }
}
