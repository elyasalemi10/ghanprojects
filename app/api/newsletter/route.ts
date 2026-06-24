import { NextResponse } from "next/server";

import { isValidEmail, recordSignup } from "@/lib/enquiries";
import { sendNotificationEmail, escapeHtml } from "@/lib/resend";
import { getClientIp, checkRateLimit, isHoneypotTripped } from "@/lib/rate-limit";

// Newsletter subscribe. Stores the email in email_signups and notifies the
// team inbox.
export async function POST(request: Request) {
  const data = await request.json().catch(() => ({}));

  // Honeypot: silently accept (so bots don't learn) but do nothing.
  if (isHoneypotTripped(data?.companyWebsite)) {
    return NextResponse.json({ ok: true });
  }
  if (!(await checkRateLimit("newsletter", getClientIp(request)))) {
    return NextResponse.json(
      { ok: false, message: "Too many requests. Please try again in a few minutes." },
      { status: 429 },
    );
  }

  const email = typeof data?.email === "string" ? data.email.trim() : "";
  const source = typeof data?.source === "string" && data.source ? data.source : "newsletter";

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { ok: false, message: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  await recordSignup(email, source);
  await sendNotificationEmail({
    subject: `New newsletter signup (${source})`,
    html: `<p>New newsletter subscriber:</p><p><strong>${escapeHtml(email)}</strong></p><p>Source: ${escapeHtml(source)}</p>`,
    replyTo: email,
  });

  return NextResponse.json({ ok: true });
}
