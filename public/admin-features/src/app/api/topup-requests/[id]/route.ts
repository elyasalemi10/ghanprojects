// src/app/api/topup-requests/[id]/route.ts
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
    if (user.role === "ADMIN" && !hasPermission(user, "topups", "review")) {
      return forbidden();
    }

    const body = await req.json();
    const { status, reviewNotes, paymentDate, paymentReference } = body;

    if (!["APPROVED", "REJECTED", "COMPLETED"].includes(status)) {
      return fail("status must be APPROVED, REJECTED, or COMPLETED");
    }

    const existing = await prisma.topUpRequest.findUnique({
      where: { id: params.id },
    });
    if (!existing) return notFound("Request");

    if (status === "COMPLETED") {
      if (existing.status !== "APPROVED") {
        return fail("Must be APPROVED first", 409);
      }

      const result = await prisma.$transaction(async (tx) => {
        const transaction = await tx.transaction.create({
          data: {
            loanId: existing.loanId,
            type: "TOP_UP",
            amount: existing.amount,
            paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
            reference: paymentReference,
            notes: `Top-up request ${existing.id}`,
            createdById: user.id,
          },
        });

        await tx.loan.update({
          where: { id: existing.loanId },
          data: {
            principal: { increment: existing.amount },
            currentBalance: { increment: existing.amount },
          },
        });

        const updated = await tx.topUpRequest.update({
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
        action: "TOPUP_COMPLETED",
        entityType: "TopUpRequest",
        entityId: params.id,
        details: { transactionId: result.transaction.id },
        ...meta,
      });

      return ok(result);
    }

    const updated = await prisma.topUpRequest.update({
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
      action: `TOPUP_${status}`,
      entityType: "TopUpRequest",
      entityId: params.id,
      ...meta,
    });

    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}
