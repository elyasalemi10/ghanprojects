// src/app/api/repayment-requests/[id]/route.ts
// Approve / reject / complete a repayment request

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasPermission, isStaff } from "@/lib/auth";
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

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!isStaff(user)) return forbidden();
    if (user.role === "ADMIN" && !hasPermission(user, "repayments", "review")) {
      return forbidden();
    }

    const body = await req.json();
    const { status, reviewNotes, paymentDate, paymentReference } = body;

    if (!["APPROVED", "REJECTED", "COMPLETED"].includes(status)) {
      return fail("status must be APPROVED, REJECTED, or COMPLETED");
    }

    const existing = await prisma.repaymentRequest.findUnique({
      where: { id: params.id },
      include: { loan: true },
    });
    if (!existing) return notFound("Request");

    // If completing, create the actual transaction & decrement balance
    if (status === "COMPLETED") {
      if (existing.status !== "APPROVED") {
        return fail("Request must be APPROVED before being COMPLETED", 409);
      }

      const result = await prisma.$transaction(async (tx) => {
        const transaction = await tx.transaction.create({
          data: {
            loanId: existing.loanId,
            type: "EARLY_REPAYMENT",
            amount: existing.requestedAmount,
            paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
            reference: paymentReference,
            notes: `Early repayment request ${existing.id}`,
            createdById: user.id,
          },
        });

        await tx.loan.update({
          where: { id: existing.loanId },
          data: {
            currentBalance: { decrement: existing.requestedAmount },
            status: existing.isPartial ? undefined : "COMPLETED",
          },
        });

        const updated = await tx.repaymentRequest.update({
          where: { id: params.id },
          data: {
            status: "COMPLETED",
            reviewedAt: new Date(),
            reviewedById: user.id,
            reviewNotes,
            completedAt: new Date(),
            transactionId: transaction.id,
          },
        });

        return { request: updated, transaction };
      });

      const meta = getRequestMeta(req);
      await logAction({
        userId: user.id,
        action: "REPAYMENT_COMPLETED",
        entityType: "RepaymentRequest",
        entityId: params.id,
        details: { transactionId: result.transaction.id },
        ...meta,
      });

      return ok(result);
    }

    // For approve / reject, just update status
    const updated = await prisma.repaymentRequest.update({
      where: { id: params.id },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedById: user.id,
        reviewNotes,
      },
    });

    const meta = getRequestMeta(req);
    await logAction({
      userId: user.id,
      action: `REPAYMENT_${status}`,
      entityType: "RepaymentRequest",
      entityId: params.id,
      ...meta,
    });

    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}
