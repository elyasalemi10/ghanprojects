// src/middleware.ts
// Protects all routes except public ones
// Place at the root of your project (next to package.json) or in /src

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role;
    const path = req.nextUrl.pathname;

    // Lender trying to access /admin/* or /owner/*
    if (role === "LENDER" && (path.startsWith("/admin") || path.startsWith("/owner"))) {
      return NextResponse.redirect(new URL("/portal", req.url));
    }
    // Admin trying to access owner-only routes
    if (role === "ADMIN" && path.startsWith("/owner")) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

// Match all routes except auth, public, and static
export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|login|register|forgot-password|reset-password|public).*)",
  ],
};
