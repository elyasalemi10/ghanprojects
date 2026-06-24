import { createClient } from "@supabase/supabase-js";

// Read-only Supabase client for the public site. Shares the same Supabase
// project as the admin app, but connects with the ANON key — Row Level
// Security on `blog_posts` only lets anon read PUBLISHED rows, so drafts never
// leak. These are server-only env vars (we read posts in RSC / at build), so
// the anon key is never shipped to the browser.
const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anonKey);

export const supabase = supabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;
