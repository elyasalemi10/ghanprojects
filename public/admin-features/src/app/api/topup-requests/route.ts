// src/app/api/topup-requests/route.ts
// Lender adds more funds to existing loan

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth";
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
    if (user.role === "ADMIN" && !hasPermission(user, "topups", "view")) {
      return forbidden();
    }

    const requests = await prisma.topUpRequest.findMany({
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

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await req.json();
    const { loanId, amount, notes } = body;

    if (!loanId || !amount) return fail("loanId and amount are required");

    const loan = await prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan) return fail("Loan not found", 404);

    if (user.role === "LENDER" && loan.borrowerId !== user.borrowerId) {
      return forbidden();
    }

    const request = await prisma.topUpRequest.create({
      data: {
        loanId,
        amount,
        notes,
        status: "PENDING",
      },
    });

    const meta = getRequestMeta(req);
    await logAction({
      userId: user.id,
      action: "TOPUP_REQUESTED",
      entityType: "TopUpRequest",
      entityId: request.id,
      details: { loanId, amount },
      ...meta,
    });

    return ok(request, 201);
  } catch (e) {
    return serverError(e);
  }
}
