// src/app/api/transactions/route.ts
// GET - list transactions (filtered)
// POST - record a payment

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
    const loanId = searchParams.get("loanId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: any = {};
    if (loanId) where.loanId = loanId;
    if (from || to) {
      where.paymentDate = {};
      if (from) where.paymentDate.gte = new Date(from);
      if (to) where.paymentDate.lte = new Date(to);
    }

    // Lenders can only see their own transactions
    if (user.role === "LENDER") {
      if (!user.borrowerId) return ok([]);
      where.loan = { borrowerId: user.borrowerId };
    }
    if (user.role === "ADMIN" && !hasPermission(user, "transactions", "view")) {
      return forbidden();
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        loan: {
          select: {
            id: true,
            reference: true,
            borrower: { select: { id: true, fullName: true } },
            project: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { paymentDate: "desc" },
    });

    return ok(transactions);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!isStaff(user)) return forbidden();
    if (user.role === "ADMIN" && !hasPermission(user, "transactions", "create")) {
      return forbidden();
    }

    const body = await req.json();
    const {
      loanId,
      type,
      amount,
      paymentDate,
      reference,
      notes,
      interestPortion,
      principalPortion,
    } = body;

    if (!loanId || !type || !amount || !paymentDate) {
      return fail("loanId, type, amount, and paymentDate are required");
    }
    const validTypes = [
      "INTEREST_PAYMENT", "PRINCIPAL_PAYMENT", "PROFIT_DISTRIBUTION",
      "DISBURSEMENT", "TOP_UP", "EARLY_REPAYMENT",
    ];
    if (!validTypes.includes(type)) return fail("Invalid transaction type");

    const loan = await prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan) return fail("Loan not found", 404);

    // In a transaction so balance update + record creation atomic
    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          loanId,
          type,
          amount,
          paymentDate: new Date(paymentDate),
          reference,
          notes,
          interestPortion: interestPortion ?? null,
          principalPortion: principalPortion ?? null,
          createdById: user.id,
        },
      });

      // Update loan balance based on type
      let balanceDelta = 0;
      if (type === "PRINCIPAL_PAYMENT" || type === "EARLY_REPAYMENT") {
        balanceDelta = -Number(amount);
      } else if (type === "TOP_UP") {
        balanceDelta = Number(amount);
      } else if (type === "INTEREST_PAYMENT" && principalPortion) {
        balanceDelta = -Number(principalPortion);
      }

      if (balanceDelta !== 0) {
        await tx.loan.update({
          where: { id: loanId },
          data: { currentBalance: { increment: balanceDelta } },
        });
      }

      return transaction;
    });

    const meta = getRequestMeta(req);
    await logAction({
      userId: user.id,
      action: "TRANSACTION_CREATED",
      entityType: "Transaction",
      entityId: result.id,
      details: { loanId, type, amount },
      ...meta,
    });

    return ok(result, 201);
  } catch (e) {
    return serverError(e);
  }
}
