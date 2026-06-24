import { NextResponse } from "next/server";

import { isValidEmail, clean, recordContact } from "@/lib/enquiries";
import { sendNotificationEmail, fieldsTable } from "@/lib/resend";
import { getClientIp, checkRateLimit, isHoneypotTripped } from "@/lib/rate-limit";

// Book-a-consultation form. Stores the enquiry in contact_submissions and
// emails the team a formatted summary they can reply to directly.
export async function POST(request: Request) {
  const data = await request.json().catch(() => ({}));

  if (isHoneypotTripped(data?.companyWebsite)) {
    return NextResponse.json({ ok: true });
  }
  if (!(await checkRateLimit("consultation", getClientIp(request)))) {
    return NextResponse.json(
      { ok: false, message: "Too many requests. Please try again in a few minutes." },
      { status: 429 },
    );
  }

  const fullName = clean(data?.fullName, 200);
  const email = typeof data?.email === "string" ? data.email.trim() : "";
  const phone = clean(data?.phone, 60);
  const message = clean(data?.message, 5000);
  const preferredDate = clean(data?.preferredDate, 100);
  const preferredTime = clean(data?.preferredTime, 100);
  const budgetRange = clean(data?.budgetRange, 100);
  const interestType = clean(data?.interestType, 100);

  // The form accepts an email OR a phone number. Require at least one, and if
  // an email was given, make sure it's valid.
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
    source: "consultation",
    name: fullName,
    email: email || null,
    phone,
    message,
    details: { preferredDate, preferredTime, budgetRange, interestType },
  });

  await sendNotificationEmail({
    subject: `New consultation request${fullName ? ` — ${fullName}` : ""}`,
    replyTo: email,
    html: `<h2 style="font-family:system-ui,sans-serif;">New consultation request</h2>${fieldsTable([
      ["Name", fullName],
      ["Email", email],
      ["Phone", phone],
      ["Preferred date", preferredDate],
      ["Preferred time", preferredTime],
      ["Budget range", budgetRange],
      ["Interest", interestType],
      ["Message", message],
    ])}`,
  });

  return NextResponse.json({ ok: true });
}
