// src/app/api/inflows/[id]/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isOwner } from "@/lib/auth";
import {
  ok,
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
    if (!isOwner(user)) return forbidden();

    const body = await req.json();
    const data: any = {};
    const editable = ["description", "amount", "expectedDate", "projectId", "confidence", "notes"];
    for (const f of editable) {
      if (body[f] !== undefined) {
        data[f] = f === "expectedDate" ? new Date(body[f]) : body[f];
      }
    }

    const inflow = await prisma.estimatedInflow.update({
      where: { id: params.id },
      data,
    });

    const meta = getRequestMeta(req);
    await logAction({
      userId: user.id,
      action: "INFLOW_UPDATED",
      entityType: "EstimatedInflow",
      entityId: inflow.id,
      ...meta,
    });

    return ok(inflow);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!isOwner(user)) return forbidden();

    const existing = await prisma.estimatedInflow.findUnique({ where: { id: params.id } });
    if (!existing) return notFound("Inflow");

    await prisma.estimatedInflow.delete({ where: { id: params.id } });

    const meta = getRequestMeta(req);
    await logAction({
      userId: user.id,
      action: "INFLOW_DELETED",
      entityType: "EstimatedInflow",
      entityId: params.id,
      ...meta,
    });

    return ok({ deleted: true });
  } catch (e) {
    return serverError(e);
  }
}
