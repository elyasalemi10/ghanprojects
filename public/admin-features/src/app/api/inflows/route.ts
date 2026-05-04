// src/app/api/inflows/route.ts
// Cash flow forecasting - manually added expected inflows
// Owner-only (admins do NOT see this)

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isOwner } from "@/lib/auth";
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
    if (!isOwner(user)) return forbidden(); // Owner only

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: any = {};
    if (from || to) {
      where.expectedDate = {};
      if (from) where.expectedDate.gte = new Date(from);
      if (to) where.expectedDate.lte = new Date(to);
    }

    const inflows = await prisma.estimatedInflow.findMany({
      where,
      include: { project: { select: { id: true, name: true } } },
      orderBy: { expectedDate: "asc" },
    });

    return ok(inflows);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!isOwner(user)) return forbidden();

    const body = await req.json();
    const { description, amount, expectedDate, projectId, confidence, notes } = body;

    if (!description || !amount || !expectedDate) {
      return fail("description, amount, and expectedDate are required");
    }

    const inflow = await prisma.estimatedInflow.create({
      data: {
        description,
        amount,
        expectedDate: new Date(expectedDate),
        projectId: projectId || null,
        confidence: confidence || "LIKELY",
        notes,
      },
      include: { project: { select: { id: true, name: true } } },
    });

    const meta = getRequestMeta(req);
    await logAction({
      userId: user.id,
      action: "INFLOW_CREATED",
      entityType: "EstimatedInflow",
      entityId: inflow.id,
      details: { description, amount },
      ...meta,
    });

    return ok(inflow, 201);
  } catch (e) {
    return serverError(e);
  }
}
