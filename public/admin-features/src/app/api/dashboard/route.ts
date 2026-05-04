// src/app/api/dashboard/route.ts
// Owner dashboard - cash position, forecast, totals
// Owner only - admins do NOT see this data

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isOwner } from "@/lib/auth";
import { ok, unauthorized, forbidden, serverError } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!isOwner(user)) return forbidden();

    const { searchParams } = new URL(req.url);
    const monthsAhead = Number(searchParams.get("months") || "12");

    // Get all active loans
    const activeLoans = await prisma.loan.findMany({
      where: { status: { in: ["ACTIVE", "PENDING"] } },
      include: {
        borrower: { select: { id: true, fullName: true } },
        project: { select: { id: true, name: true } },
      },
    });

    // Total outstanding (what you owe lenders)
    const totalOutstanding = activeLoans.reduce(
      (sum, l) => sum + Number(l.currentBalance),
      0
    );

    // Get all estimated inflows in the forecast window
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const horizon = new Date(today);
    horizon.setMonth(horizon.getMonth() + monthsAhead);

    const inflows = await prisma.estimatedInflow.findMany({
      where: { expectedDate: { gte: today, lte: horizon } },
      include: { project: { select: { id: true, name: true } } },
      orderBy: { expectedDate: "asc" },
    });

    // Build month-by-month forecast
    const months: Array<{
      year: number;
      month: number;
      label: string;
      startDate: Date;
      endDate: Date;
      expectedInflows: number;
      scheduledOutflows: number;
      net: number;
      inflows: any[];
      outflowDetail: any[];
    }> = [];

    for (let i = 0; i < monthsAhead; i++) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + i + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);

      // Inflows in this month
      const monthInflows = inflows.filter(
        (inf) =>
          new Date(inf.expectedDate) >= monthStart &&
          new Date(inf.expectedDate) <= monthEnd
      );
      const inflowTotal = monthInflows.reduce(
        (s, inf) => s + Number(inf.amount),
        0
      );

      // Calculate scheduled outflows (loan payments due this month)
      let outflowTotal = 0;
      const outflowDetail: any[] = [];

      for (const loan of activeLoans) {
        if (loan.loanType === "FIXED_MONTHLY") {
          const paymentAmount = Number(loan.paymentAmount || 0);
          if (paymentAmount > 0) {
            const paymentDate = new Date(
              monthStart.getFullYear(),
              monthStart.getMonth(),
              loan.paymentDay || 1
            );
            // Skip if before today or after maturity
            if (paymentDate < today) continue;
            if (paymentDate > new Date(loan.maturityDate)) continue;
            outflowTotal += paymentAmount;
            outflowDetail.push({
              loanId: loan.id,
              borrower: loan.borrower.fullName,
              date: paymentDate,
              amount: paymentAmount,
            });
          }
        } else if (loan.loanType === "FIXED_END" || loan.loanType === "PROFIT_SHARE") {
          const maturity = new Date(loan.maturityDate);
          if (maturity >= monthStart && maturity <= monthEnd) {
            const annualInterest = Number(loan.principal) * (Number(loan.interestRate) / 100);
            const months = loan.termMonths;
            const totalReturn = annualInterest * (months / 12) + Number(loan.principal);
            outflowTotal += totalReturn;
            outflowDetail.push({
              loanId: loan.id,
              borrower: loan.borrower.fullName,
              date: maturity,
              amount: totalReturn,
              note: "Maturity payout (excludes profit share)",
            });
          }
        }
      }

      months.push({
        year: monthStart.getFullYear(),
        month: monthStart.getMonth() + 1,
        label: monthStart.toLocaleDateString("en-AU", { month: "short", year: "numeric" }),
        startDate: monthStart,
        endDate: monthEnd,
        expectedInflows: inflowTotal,
        scheduledOutflows: outflowTotal,
        net: inflowTotal - outflowTotal,
        inflows: monthInflows.map((inf) => ({
          id: inf.id,
          description: inf.description,
          amount: Number(inf.amount),
          expectedDate: inf.expectedDate,
          confidence: inf.confidence,
          project: inf.project,
        })),
        outflowDetail,
      });
    }

    // Running cash projection (relative)
    let running = 0;
    const projection = months.map((m) => {
      running += m.net;
      return { label: m.label, runningPosition: running };
    });

    // Summary stats
    const totalExpectedInflows = months.reduce((s, m) => s + m.expectedInflows, 0);
    const totalScheduledOutflows = months.reduce((s, m) => s + m.scheduledOutflows, 0);

    // Active loan count by type
    const loansByType = activeLoans.reduce(
      (acc, l) => {
        acc[l.loanType] = (acc[l.loanType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return ok({
      summary: {
        totalOutstanding,
        activeLoanCount: activeLoans.length,
        loansByType,
        forecastWindow: { from: today, to: horizon, months: monthsAhead },
        totalExpectedInflows,
        totalScheduledOutflows,
        netForecast: totalExpectedInflows - totalScheduledOutflows,
      },
      months,
      projection,
      activeLoans: activeLoans.map((l) => ({
        id: l.id,
        reference: l.reference,
        borrower: l.borrower,
        project: l.project,
        loanType: l.loanType,
        currentBalance: Number(l.currentBalance),
        interestRate: Number(l.interestRate),
        maturityDate: l.maturityDate,
      })),
    });
  } catch (e) {
    return serverError(e);
  }
}
