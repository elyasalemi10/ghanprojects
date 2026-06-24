import { NextResponse } from "next/server";

// Placeholder endpoint for the newsletter subscribe form.
// TODO: persist to your database and/or your email provider here.
export async function POST(request: Request) {
  const data = await request.json().catch(() => ({}));
  console.log("[newsletter] submission:", data);
  return NextResponse.json({ ok: true });
}
