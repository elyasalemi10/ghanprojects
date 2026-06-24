import { NextResponse } from "next/server";

// Placeholder endpoint for the "Join the Investor Network" form.
// TODO: persist to your database and/or send a notification email here.
export async function POST(request: Request) {
  const data = await request.json().catch(() => ({}));
  console.log("[investor-network] submission:", data);
  return NextResponse.json({ ok: true });
}
