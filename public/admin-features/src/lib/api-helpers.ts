// src/lib/api-helpers.ts
// Reusable helpers for API routes - consistent responses, audit logging

import { NextResponse } from "next/server";
import { prisma } from "./prisma";

// ============================================
// RESPONSES
// ============================================

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ success: false, error: message, details }, { status });
}

export const unauthorized = () => fail("Unauthorized", 401);
export const forbidden = () => fail("Forbidden", 403);
export const notFound = (what = "Resource") => fail(`${what} not found`, 404);
export const serverError = (e: unknown) => {
  console.error(e);
  return fail("Internal server error", 500);
};

// ============================================
// AUDIT LOG
// ============================================

export async function logAction(opts: {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: opts.userId,
        action: opts.action,
        entityType: opts.entityType,
        entityId: opts.entityId,
        details: opts.details ? (opts.details as any) : undefined,
        ipAddress: opts.ipAddress,
        userAgent: opts.userAgent,
      },
    });
  } catch (e) {
    // Don't break the main flow on audit failure
    console.error("Audit log failed:", e);
  }
}

// Extract IP and user agent from request headers
export function getRequestMeta(req: Request) {
  return {
    ipAddress:
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      undefined,
    userAgent: req.headers.get("user-agent") || undefined,
  };
}
