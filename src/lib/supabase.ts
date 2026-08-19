// ============================================================================
// Shared server-side Supabase access. Uses the SERVICE-ROLE key, so this must
// only ever be imported by server code (route handlers / repository) — never a
// client component. Returns null when Supabase isn't configured, so callers can
// fall back to the mock / demo behaviour.
// ============================================================================

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function hasSupabase(): boolean {
  return !!url && !!serviceKey;
}

let admin: SupabaseClient | null = null;

/** Service-role client (bypasses RLS). Null when Supabase isn't configured. */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!hasSupabase()) return null;
  if (!admin) {
    admin = createClient(url!, serviceKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return admin;
}

export const COURSE_PHOTOS_BUCKET = "course-photos";
