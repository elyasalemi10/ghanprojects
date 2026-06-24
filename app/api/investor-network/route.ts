import { NextResponse } from "next/server";

import { isValidEmail, clean, recordContact } from "@/lib/enquiries";
import { sendNotificationEmail, fieldsTable } from "@/lib/resend";
import { getClientIp, checkRateLimit, isHoneypotTripped } from "@/lib/rate-limit";

// "Join the Investor Network" form on the home page. Stores the enquiry in
// contact_submissions and emails the team a summary.
export async function POST(request: Request) {
  const data = await request.json().catch(() => ({}));

  if (isHoneypotTripped(data?.companyWebsite)) {
    return NextResponse.json({ ok: true });
  }
  if (!(await checkRateLimit("investor-network", getClientIp(request)))) {
    return NextResponse.json(
      { ok: false, message: "Too many requests. Please try again in a few minutes." },
      { status: 429 },
    );
  }

  const fullName = clean(data?.fullName, 200);
  const email = typeof data?.email === "string" ? data.email.trim() : "";
  const phone = clean(data?.phone, 60);
  const budgetRange = clean(data?.budgetRange, 100);
  const interestType = clean(data?.interestType, 100);

  // Email OR phone is required; validate the email only if one was supplied.
  if (!email && !phone) {
    return NextResponse.json(
      { ok: false, message: "Please provide an email address or phone number." },
      { status: 400 },
    );
  }
  if (email && !isValidEmail(email)) {
    return NextResponse.json(
      { ok: false, message: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  await recordContact({
    source: "investor-network",
    name: fullName,
    email: email || null,
    phone,
    details: { budgetRange, interestType },
  });

  await sendNotificationEmail({
    subject: `New investor-network enquiry${fullName ? ` — ${fullName}` : ""}`,
    replyTo: email,
    html: `<h2 style="font-family:system-ui,sans-serif;">New investor-network enquiry</h2>${fieldsTable([
      ["Name", fullName],
      ["Email", email],
      ["Phone", phone],
      ["Budget range", budgetRange],
      ["Interest", interestType],
    ])}`,
  });

  return NextResponse.json({ ok: true });
}
