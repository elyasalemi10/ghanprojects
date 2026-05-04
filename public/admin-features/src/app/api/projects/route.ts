// src/app/api/projects/route.ts
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

    // Lenders only see projects their loans are in
    if (user.role === "LENDER") {
      if (!user.borrowerId) return ok([]);
      const projects = await prisma.project.findMany({
        where: { loans: { some: { borrowerId: user.borrowerId } } },
        orderBy: { createdAt: "desc" },
      });
      return ok(projects);
    }

    if (user.role === "ADMIN" && !hasPermission(user, "projects", "view")) {
      return forbidden();
    }

    const projects = await prisma.project.findMany({
      include: {
        _count: { select: { loans: true, estimatedInflows: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return ok(projects);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!isStaff(user)) return forbidden();
    if (user.role === "ADMIN" && !hasPermission(user, "projects", "create")) {
      return forbidden();
    }

    const body = await req.json();
    const {
      name,
      description,
      address,
      status,
      totalCost,
      totalRevenue,
      totalProfit,
      startDate,
      estimatedCompletion,
      actualCompletion,
      customFields,
    } = body;

    if (!name) return fail("name is required");

    const project = await prisma.project.create({
      data: {
        name,
        description,
        address,
        status: status || "PLANNING",
        totalCost: totalCost ?? null,
        totalRevenue: totalRevenue ?? null,
        totalProfit: totalProfit ?? null,
        startDate: startDate ? new Date(startDate) : null,
        estimatedCompletion: estimatedCompletion ? new Date(estimatedCompletion) : null,
        actualCompletion: actualCompletion ? new Date(actualCompletion) : null,
        customFields: customFields || null,
      },
    });

    const meta = getRequestMeta(req);
    await logAction({
      userId: user.id,
      action: "PROJECT_CREATED",
      entityType: "Project",
      entityId: project.id,
      details: { name: project.name },
      ...meta,
    });

    return ok(project, 201);
  } catch (e) {
    return serverError(e);
  }
}
