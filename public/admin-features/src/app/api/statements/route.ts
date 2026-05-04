// src/app/api/statements/route.ts
// Statement generation
// GET /api/statements?type=investor&borrowerId=...&from=...&to=...
// GET /api/statements?type=project&projectId=...&from=...&to=...
// GET /api/statements?type=combined&from=...&to=...&format=json|csv

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasPermission, isStaff } from "@/lib/auth";
import { ok, fail, unauthorized, forbidden, serverError } from "@/lib/api-helpers";

type StatementType = "investor" | "project" | "combined";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { searchParams } = new URL(req.url);
    const type = (searchParams.get("type") || "investor") as StatementType;
    const borrowerId = searchParams.get("borrowerId");
    const projectId = searchParams.get("projectId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const format = searchParams.get("format") || "json"; // json | csv

    if (!from || !to) return fail("from and to date params are required");

    const dateRange = {
      gte: new Date(from),
      lte: new Date(to),
    };

    // Permission check
    if (user.role === "LENDER") {
      // Lender can only generate their own statement
      if (type !== "investor") return forbidden();
      if (!user.borrowerId || (borrowerId && borrowerId !== user.borrowerId)) {
        return forbidden();
      }
    } else if (user.role === "ADMIN") {
      if (!hasPermission(user, "statements", "generate")) return forbidden();
    }

    // Build the statement
    let statement: any;

    if (type === "investor") {
      const targetBorrowerId = user.role === "LENDER" ? user.borrowerId : borrowerId;
      if (!targetBorrowerId) return fail("borrowerId is required");
      statement = await buildInvestorStatement(targetBorrowerId, dateRange);
    } else if (type === "project") {
      if (!projectId) return fail("projectId is required");
      statement = await buildProjectStatement(projectId, dateRange);
    } else if (type === "combined") {
      if (!isStaff(user)) return forbidden();
      statement = await buildCombinedStatement(dateRange);
    } else {
      return fail("Invalid statement type");
    }

    // Return as CSV if requested
    if (format === "csv") {
      const csv = statementToCsv(statement, type);
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="statement_${type}_${from}_to_${to}.csv"`,
        },
      });
    }

    return ok(statement);
  } catch (e) {
    return serverError(e);
  }
}

// ============================================
// INVESTOR STATEMENT
// ============================================
async function buildInvestorStatement(
  borrowerId: string,
  dateRange: { gte: Date; lte: Date }
) {
  const borrower = await prisma.borrower.findUnique({
    where: { id: borrowerId },
    include: {
      loans: {
        include: {
          project: { select: { id: true, name: true, status: true } },
          transactions: {
            where: { paymentDate: dateRange },
            orderBy: { paymentDate: "asc" },
          },
        },
      },
    },
  });

  if (!borrower) throw new Error("Borrower not found");

  const loanSummaries = borrower.loans.map((loan) => {
    const totalInterestPaid = loan.transactions
      .filter((t) => t.type === "INTEREST_PAYMENT")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalPrincipalPaid = loan.transactions
      .filter((t) => t.type === "PRINCIPAL_PAYMENT" || t.type === "EARLY_REPAYMENT")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalProfitDist = loan.transactions
      .filter((t) => t.type === "PROFIT_DISTRIBUTION")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalTopUps = loan.transactions
      .filter((t) => t.type === "TOP_UP")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      loanId: loan.id,
      reference: loan.reference,
      project: loan.project,
      loanType: loan.loanType,
      principal: Number(loan.principal),
      currentBalance: Number(loan.currentBalance),
      interestRate: Number(loan.interestRate),
      profitSharePercent: loan.profitSharePercent ? Number(loan.profitSharePercent) : null,
      startDate: loan.startDate,
      maturityDate: loan.maturityDate,
      status: loan.status,
      periodTotals: {
        interestPaid: totalInterestPaid,
        principalPaid: totalPrincipalPaid,
        profitDistributions: totalProfitDist,
        topUps: totalTopUps,
        totalReceived: totalInterestPaid + totalPrincipalPaid + totalProfitDist,
      },
      transactions: loan.transactions.map((t) => ({
        date: t.paymentDate,
        type: t.type,
        amount: Number(t.amount),
        reference: t.reference,
      })),
    };
  });

  const totals = loanSummaries.reduce(
    (acc, l) => ({
      interestPaid: acc.interestPaid + l.periodTotals.interestPaid,
      principalPaid: acc.principalPaid + l.periodTotals.principalPaid,
      profitDistributions: acc.profitDistributions + l.periodTotals.profitDistributions,
      totalReceived: acc.totalReceived + l.periodTotals.totalReceived,
      currentBalance: acc.currentBalance + l.currentBalance,
    }),
    { interestPaid: 0, principalPaid: 0, profitDistributions: 0, totalReceived: 0, currentBalance: 0 }
  );

  return {
    type: "investor",
    period: { from: dateRange.gte, to: dateRange.lte },
    investor: {
      id: borrower.id,
      name: borrower.fullName,
      email: borrower.email,
      phone: borrower.phone,
      address: borrower.address,
    },
    totals,
    loans: loanSummaries,
    generatedAt: new Date(),
  };
}

// ============================================
// PROJECT STATEMENT
// ============================================
async function buildProjectStatement(
  projectId: string,
  dateRange: { gte: Date; lte: Date }
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      loans: {
        include: {
          borrower: { select: { id: true, fullName: true, email: true } },
          transactions: {
            where: { paymentDate: dateRange },
            orderBy: { paymentDate: "asc" },
          },
        },
      },
    },
  });

  if (!project) throw new Error("Project not found");

  const loanSummaries = project.loans.map((loan) => {
    const interestPaid = loan.transactions
      .filter((t) => t.type === "INTEREST_PAYMENT")
      .reduce((s, t) => s + Number(t.amount), 0);
    const principalPaid = loan.transactions
      .filter((t) => t.type === "PRINCIPAL_PAYMENT" || t.type === "EARLY_REPAYMENT")
      .reduce((s, t) => s + Number(t.amount), 0);
    const profitDist = loan.transactions
      .filter((t) => t.type === "PROFIT_DISTRIBUTION")
      .reduce((s, t) => s + Number(t.amount), 0);

    return {
      borrower: loan.borrower,
      loanRef: loan.reference,
      principal: Number(loan.principal),
      currentBalance: Number(loan.currentBalance),
      interestRate: Number(loan.interestRate),
      profitSharePercent: loan.profitSharePercent ? Number(loan.profitSharePercent) : null,
      periodTotals: { interestPaid, principalPaid, profitDist, total: interestPaid + principalPaid + profitDist },
    };
  });

  const totals = loanSummaries.reduce(
    (acc, l) => ({
      interestPaid: acc.interestPaid + l.periodTotals.interestPaid,
      principalPaid: acc.principalPaid + l.periodTotals.principalPaid,
      profitDistributions: acc.profitDistributions + l.periodTotals.profitDist,
      totalDistributed: acc.totalDistributed + l.periodTotals.total,
      totalCapital: acc.totalCapital + l.currentBalance,
    }),
    { interestPaid: 0, principalPaid: 0, profitDistributions: 0, totalDistributed: 0, totalCapital: 0 }
  );

  return {
    type: "project",
    period: { from: dateRange.gte, to: dateRange.lte },
    project: {
      id: project.id,
      name: project.name,
      status: project.status,
      totalCost: project.totalCost ? Number(project.totalCost) : null,
      totalRevenue: project.totalRevenue ? Number(project.totalRevenue) : null,
      totalProfit: project.totalProfit ? Number(project.totalProfit) : null,
    },
    investorCount: loanSummaries.length,
    totals,
    investors: loanSummaries,
    generatedAt: new Date(),
  };
}

// ============================================
// COMBINED (for accountant)
// ============================================
async function buildCombinedStatement(dateRange: { gte: Date; lte: Date }) {
  const transactions = await prisma.transaction.findMany({
    where: { paymentDate: dateRange },
    include: {
      loan: {
        include: {
          borrower: { select: { id: true, fullName: true, email: true } },
          project: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { paymentDate: "asc" },
  });

  // Group by investor
  const byInvestor: Record<string, any> = {};
  for (const t of transactions) {
    const k = t.loan.borrower.id;
    if (!byInvestor[k]) {
      byInvestor[k] = {
        borrower: t.loan.borrower,
        interestPaid: 0,
        principalPaid: 0,
        profitDistributions: 0,
        topUps: 0,
        total: 0,
        count: 0,
      };
    }
    const v = byInvestor[k];
    v.count++;
    const amt = Number(t.amount);
    if (t.type === "INTEREST_PAYMENT") { v.interestPaid += amt; v.total += amt; }
    else if (t.type === "PRINCIPAL_PAYMENT" || t.type === "EARLY_REPAYMENT") { v.principalPaid += amt; v.total += amt; }
    else if (t.type === "PROFIT_DISTRIBUTION") { v.profitDistributions += amt; v.total += amt; }
    else if (t.type === "TOP_UP") { v.topUps += amt; }
  }

  // Group by project (skip null project loans)
  const byProject: Record<string, any> = {};
  const generalLoans: any = {
    interestPaid: 0, principalPaid: 0, profitDistributions: 0, total: 0, count: 0,
  };
  for (const t of transactions) {
    const projKey = t.loan.project?.id;
    const target = projKey ? (byProject[projKey] = byProject[projKey] || {
      project: t.loan.project,
      interestPaid: 0, principalPaid: 0, profitDistributions: 0, total: 0, count: 0,
    }) : generalLoans;

    target.count++;
    const amt = Number(t.amount);
    if (t.type === "INTEREST_PAYMENT") { target.interestPaid += amt; target.total += amt; }
    else if (t.type === "PRINCIPAL_PAYMENT" || t.type === "EARLY_REPAYMENT") { target.principalPaid += amt; target.total += amt; }
    else if (t.type === "PROFIT_DISTRIBUTION") { target.profitDistributions += amt; target.total += amt; }
  }

  const grandTotals = {
    interestPaid: 0, principalPaid: 0, profitDistributions: 0, topUps: 0, total: 0,
    transactionCount: transactions.length,
  };
  for (const t of transactions) {
    const amt = Number(t.amount);
    if (t.type === "INTEREST_PAYMENT") { grandTotals.interestPaid += amt; grandTotals.total += amt; }
    else if (t.type === "PRINCIPAL_PAYMENT" || t.type === "EARLY_REPAYMENT") { grandTotals.principalPaid += amt; grandTotals.total += amt; }
    else if (t.type === "PROFIT_DISTRIBUTION") { grandTotals.profitDistributions += amt; grandTotals.total += amt; }
    else if (t.type === "TOP_UP") { grandTotals.topUps += amt; }
  }

  return {
    type: "combined",
    period: { from: dateRange.gte, to: dateRange.lte },
    grandTotals,
    byInvestor: Object.values(byInvestor),
    byProject: Object.values(byProject),
    generalCompanyLoans: generalLoans,
    transactions: transactions.map((t) => ({
      date: t.paymentDate,
      type: t.type,
      amount: Number(t.amount),
      borrower: t.loan.borrower.fullName,
      project: t.loan.project?.name || "General",
      loanRef: t.loan.reference,
      reference: t.reference,
    })),
    generatedAt: new Date(),
  };
}

// ============================================
// CSV EXPORT
// ============================================
function statementToCsv(statement: any, type: StatementType): string {
  const rows: string[] = [];

  if (type === "combined") {
    rows.push("Date,Type,Borrower,Project,Loan Reference,Amount (AUD),Bank Reference");
    for (const t of statement.transactions) {
      rows.push([
        new Date(t.date).toISOString().split("T")[0],
        t.type,
        csvEscape(t.borrower),
        csvEscape(t.project),
        t.loanRef,
        t.amount.toFixed(2),
        csvEscape(t.reference || ""),
      ].join(","));
    }
    rows.push("");
    rows.push("SUMMARY");
    rows.push(`Total Interest Paid,${statement.grandTotals.interestPaid.toFixed(2)}`);
    rows.push(`Total Principal Paid,${statement.grandTotals.principalPaid.toFixed(2)}`);
    rows.push(`Total Profit Distributions,${statement.grandTotals.profitDistributions.toFixed(2)}`);
    rows.push(`Total Top-Ups Received,${statement.grandTotals.topUps.toFixed(2)}`);
  } else if (type === "investor") {
    rows.push(`Investor Statement: ${statement.investor.name}`);
    rows.push(`Period: ${new Date(statement.period.from).toISOString().split("T")[0]} to ${new Date(statement.period.to).toISOString().split("T")[0]}`);
    rows.push("");
    rows.push("Loan Reference,Project,Type,Principal,Current Balance,Interest Paid,Principal Paid,Profit Distributed");
    for (const l of statement.loans) {
      rows.push([
        l.reference,
        csvEscape(l.project?.name || "General"),
        l.loanType,
        l.principal.toFixed(2),
        l.currentBalance.toFixed(2),
        l.periodTotals.interestPaid.toFixed(2),
        l.periodTotals.principalPaid.toFixed(2),
        l.periodTotals.profitDistributions.toFixed(2),
      ].join(","));
    }
  } else if (type === "project") {
    rows.push(`Project Statement: ${statement.project.name}`);
    rows.push("");
    rows.push("Investor,Loan Reference,Principal,Current Balance,Interest Paid,Principal Paid,Profit Distributed");
    for (const inv of statement.investors) {
      rows.push([
        csvEscape(inv.borrower.fullName),
        inv.loanRef,
        inv.principal.toFixed(2),
        inv.currentBalance.toFixed(2),
        inv.periodTotals.interestPaid.toFixed(2),
        inv.periodTotals.principalPaid.toFixed(2),
        inv.periodTotals.profitDist.toFixed(2),
      ].join(","));
    }
  }

  return rows.join("\n");
}

function csvEscape(v: string): string {
  if (v.includes(",") || v.includes('"') || v.includes("\n")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}
