// Minimal Resend client (no SDK dependency — just the REST API).
//
// Sends notification emails to the team inbox when a public form is submitted.
// Best-effort: if Resend isn't configured, or the send fails, we log and carry
// on so a transient email problem never loses a lead that's already in the DB.
//
// Env:
//   RESEND_API_KEY     the Resend API key
//   RESEND_FROM_EMAIL  verified sender, e.g. "Ghan Projects <noreply@ghanprojects.com.au>"
//   RESEND_TO_EMAIL    inbox that receives the notifications

const apiKey = process.env.RESEND_API_KEY;
const from =
  process.env.RESEND_FROM_EMAIL ?? "Ghan Projects <noreply@ghanprojects.com.au>";
const to = process.env.RESEND_TO_EMAIL;

export const resendConfigured = Boolean(apiKey && to);

export async function sendNotificationEmail({
  subject,
  html,
  replyTo,
}: {
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<boolean> {
  if (!apiKey || !to) {
    console.warn("[resend] not configured (RESEND_API_KEY / RESEND_TO_EMAIL); skipping email");
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
        // Let staff hit "reply" and respond straight to the person who enquired.
        reply_to: replyTo || undefined,
      }),
    });
    if (!res.ok) {
      console.error("[resend] send failed:", res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("[resend] send threw:", err);
    return false;
  }
}

/** Escape user-supplied text before dropping it into the notification HTML. */
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Build a simple labelled table from a set of fields (empty ones skipped). */
export function fieldsTable(rows: Array<[string, unknown]>): string {
  const cells = rows
    .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "")
    .map(
      ([label, value]) =>
        `<tr>
           <td style="padding:6px 12px;color:#6b7280;vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</td>
           <td style="padding:6px 12px;color:#111827;">${escapeHtml(value).replace(/\n/g, "<br/>")}</td>
         </tr>`,
    )
    .join("");
  return `<table style="border-collapse:collapse;font-family:system-ui,sans-serif;font-size:14px;">${cells}</table>`;
}
