import { NextResponse } from "next/server";

// Placeholder endpoint for the resources "unlock" / email-gate form.
// TODO: persist to your database and/or send the access email here.
export async function POST(request: Request) {
  const data = await request.json().catch(() => ({}));
  console.log("[resources/unlock] submission:", data);
  return NextResponse.json({ ok: true });
}
