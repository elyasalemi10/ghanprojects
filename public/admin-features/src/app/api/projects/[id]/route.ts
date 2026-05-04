// src/app/api/projects/[id]/route.ts
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

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        loans: {
          include: { borrower: { select: { id: true, fullName: true } } },
        },
        estimatedInflows: true,
      },
    });
    if (!project) return notFound("Project");

    // Lenders can view a project if they have a loan in it
    if (user.role === "LENDER") {
      const hasLoan = project.loans.some((l) => l.borrowerId === user.borrowerId);
      if (!hasLoan) return forbidden();
      // Strip other borrowers' loan details for lender view
      project.loans = project.loans.filter((l) => l.borrowerId === user.borrowerId);
    }
    if (user.role === "ADMIN" && !hasPermission(user, "projects", "view")) {
      return forbidden();
    }

    return ok(project);
  } catch (e) {
    return serverError(e);
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!isStaff(user)) return forbidden();
    if (user.role === "ADMIN" && !hasPermission(user, "projects", "edit")) {
      return forbidden();
    }

    const body = await req.json();
    const data: any = {};
    const editable = [
      "name", "description", "address", "status",
      "totalCost", "totalRevenue", "totalProfit",
      "startDate", "estimatedCompletion", "actualCompletion",
      "customFields",
    ];
    for (const f of editable) {
      if (body[f] !== undefined) {
        if (["startDate", "estimatedCompletion", "actualCompletion"].includes(f)) {
          data[f] = body[f] ? new Date(body[f]) : null;
        } else {
          data[f] = body[f];
        }
      }
    }

    const project = await prisma.project.update({
      where: { id: params.id },
      data,
    });

    const meta = getRequestMeta(req);
    await logAction({
      userId: user.id,
      action: "PROJECT_UPDATED",
      entityType: "Project",
      entityId: project.id,
      details: { changes: Object.keys(data) },
      ...meta,
    });

    return ok(project);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!isOwner(user)) return forbidden();

    const existing = await prisma.project.findUnique({
      where: { id: params.id },
      include: { _count: { select: { loans: true } } },
    });
    if (!existing) return notFound("Project");

    if (existing._count.loans > 0) {
      return fail("Cannot delete a project with linked loans", 409);
    }

    await prisma.project.delete({ where: { id: params.id } });

    const meta = getRequestMeta(req);
    await logAction({
      userId: user.id,
      action: "PROJECT_DELETED",
      entityType: "Project",
      entityId: params.id,
      ...meta,
    });

    return ok({ deleted: true });
  } catch (e) {
    return serverError(e);
  }
}
