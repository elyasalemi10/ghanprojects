import { NextResponse } from "next/server";

// Placeholder endpoint for the contact / consultation form.
// TODO: persist to your database and/or send a notification email here.
export async function POST(request: Request) {
  const data = await request.json().catch(() => ({}));
  console.log("[consultation] submission:", data);
  return NextResponse.json({ ok: true });
}
