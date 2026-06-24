import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

// On-demand ISR. The admin app POSTs here after a post is published, edited or
// deleted so the public Insights pages refresh within seconds instead of
// waiting for the 60s timer. Authenticated by a shared secret that must match
// MARKETING_REVALIDATE_SECRET on both sides.
export async function POST(request: Request) {
  const secret = process.env.MARKETING_REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, message: "Revalidation secret not configured." },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => ({}));
  if (body?.secret !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  // Always refresh the index; refresh the specific post page when a slug is
  // given.
  revalidatePath("/insights");
  if (typeof body?.slug === "string" && body.slug) {
    revalidatePath(`/insights/${body.slug}`);
  }

  return NextResponse.json({ ok: true, revalidated: true });
}
