// src/app/api/users/[id]/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isOwner, hashPassword } from "@/lib/auth";
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
    if (!isOwner(user)) return forbidden();

    const body = await req.json();
    const data: any = {};
    const editable = ["name", "phone", "active", "permissions"];
    for (const f of editable) {
      if (body[f] !== undefined) data[f] = body[f];
    }
    if (body.password) {
      data.password = await hashPassword(body.password);
    }
    if (body.email) {
      data.email = body.email.toLowerCase();
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        active: true,
        permissions: true,
      },
    });

    const meta = getRequestMeta(req);
    await logAction({
      userId: user.id,
      action: "USER_UPDATED",
      entityType: "User",
      entityId: params.id,
      details: { changes: Object.keys(data).filter((k) => k !== "password") },
      ...meta,
    });

    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!isOwner(user)) return forbidden();
    if (user.id === params.id) return fail("Cannot delete yourself", 400);

    const existing = await prisma.user.findUnique({ where: { id: params.id } });
    if (!existing) return notFound("User");

    // Soft delete - just deactivate (preserves audit trail)
    await prisma.user.update({
      where: { id: params.id },
      data: { active: false },
    });

    const meta = getRequestMeta(req);
    await logAction({
      userId: user.id,
      action: "USER_DEACTIVATED",
      entityType: "User",
      entityId: params.id,
      ...meta,
    });

    return ok({ deactivated: true });
  } catch (e) {
    return serverError(e);
  }
}
