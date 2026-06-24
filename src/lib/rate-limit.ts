// Per-IP rate limiting for the public form endpoints, backed by a Postgres
// SECURITY DEFINER function (see migration 0062). Centralised in the DB so it
// holds across serverless instances.

import { supabase } from "./supabase";

/** Best-effort client IP from the proxy headers Vercel sets. */
export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Returns true if the request is allowed, false if the IP has hit the limit for
 * this form. Fails OPEN (allows) if Supabase isn't configured or the RPC errors,
 * so a DB hiccup never blocks genuine visitors — the insert-only RLS and
 * honeypot still apply in that window.
 */
export async function checkRateLimit(
  source: string,
  ip: string,
  max = 5,
  windowSeconds = 600,
): Promise<boolean> {
  if (!supabase) return true;
  const { data, error } = await supabase.rpc("check_form_rate_limit", {
    p_bucket: `${source}:${ip}`,
    p_max: max,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error("[rate-limit] rpc failed:", error.message);
    return true;
  }
  return data === true;
}

/** Honeypot: real users never fill the hidden field; bots that fill every
 *  input do. Treat a non-empty value as spam. */
export function isHoneypotTripped(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}
