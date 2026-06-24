import { NextResponse } from "next/server";

import { isValidEmail, recordSignup } from "@/lib/enquiries";
import { sendNotificationEmail, escapeHtml } from "@/lib/resend";
import { getClientIp, checkRateLimit, isHoneypotTripped } from "@/lib/rate-limit";

// Resource email-gate. Captures the email (so the visitor can download the
// resource), stores it in email_signups, and notifies the team.
export async function POST(request: Request) {
  const data = await request.json().catch(() => ({}));

  if (isHoneypotTripped(data?.companyWebsite)) {
    return NextResponse.json({ ok: true });
  }
  if (!(await checkRateLimit("resources", getClientIp(request)))) {
    return NextResponse.json(
      { ok: false, message: "Too many requests. Please try again in a few minutes." },
      { status: 429 },
    );
  }

  const email = typeof data?.email === "string" ? data.email.trim() : "";
  const resource = typeof data?.resource === "string" ? data.resource : "";

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { ok: false, message: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  await recordSignup(email, resource ? `resources:${resource}` : "resources");
  await sendNotificationEmail({
    subject: "New resource unlock",
    html: `<p>Resource unlocked by:</p><p><strong>${escapeHtml(email)}</strong></p>${
      resource ? `<p>Resource: ${escapeHtml(resource)}</p>` : ""
    }`,
    replyTo: email,
  });

  return NextResponse.json({ ok: true });
}
