// Shared persistence for the public forms. Writes through the anon Supabase
// client; RLS allows anon INSERT only on these tables (never SELECT), so a
// leaked anon key can submit but can't read anyone's data.
//
//   email_signups        — newsletter + resource-unlock (email + source)
//   contact_submissions  — consultation + investor-network (richer enquiries)

import { supabase } from "./supabase";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && EMAIL_RE.test(value.trim());
}

/** Normalise a free-text field to a trimmed string or null. */
export function clean(value: unknown, max = 2000): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  return v ? v.slice(0, max) : null;
}

/**
 * Record an email-only signup (newsletter / resource unlock). Returns true if
 * stored. A duplicate or DB hiccup is logged but not thrown — the caller should
 * still report success so the visitor isn't blocked.
 */
export async function recordSignup(email: string, source: string): Promise<boolean> {
  if (!supabase) {
    console.warn("[enquiries] Supabase not configured; signup not stored");
    return false;
  }
  const { error } = await supabase
    .from("email_signups")
    .insert({ email: email.trim().toLowerCase(), source });
  if (error) {
    console.error("[enquiries] email_signups insert failed:", error.message);
    return false;
  }
  return true;
}

export type ContactInput = {
  source: string;
  name?: string | null;
  // Email OR phone — the rich forms accept either, so email may be null.
  email?: string | null;
  phone?: string | null;
  message?: string | null;
  details?: Record<string, unknown>;
};

/** Record a richer contact / consultation enquiry. */
export async function recordContact(input: ContactInput): Promise<boolean> {
  if (!supabase) {
    console.warn("[enquiries] Supabase not configured; contact not stored");
    return false;
  }
  // Drop empty detail values so the JSON stays tidy.
  const details = Object.fromEntries(
    Object.entries(input.details ?? {}).filter(
      ([, v]) => v !== undefined && v !== null && String(v).trim() !== "",
    ),
  );
  const { error } = await supabase.from("contact_submissions").insert({
    source: input.source,
    name: input.name ?? null,
    email: input.email ? input.email.trim().toLowerCase() : null,
    phone: input.phone ?? null,
    message: input.message ?? null,
    details,
  });
  if (error) {
    console.error("[enquiries] contact_submissions insert failed:", error.message);
    return false;
  }
  return true;
}
