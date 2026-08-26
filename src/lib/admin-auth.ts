// ============================================================================
// Admin authentication. Admin actions (view metrics, approve/reject courses,
// reset) are gated by a shared password set in the ADMIN_PASSWORD env var.
//
// If ADMIN_PASSWORD is NOT set, admin is left open (local/demo convenience) —
// so for a real launch you MUST set ADMIN_PASSWORD in Vercel. /api/health
// reports `adminProtected` so you can confirm it's locked.
// ============================================================================

import type { NextRequest } from "next/server";

export function adminConfigured(): boolean {
  return !!process.env.ADMIN_PASSWORD;
}

/** True if a raw token matches the admin password (or admin is unconfigured). */
export function adminTokenValid(token: string | null): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return true; // not configured -> open (demo)
  return token === expected;
}

/**
 * True if the request may perform admin actions. Checks the password
 * (x-admin-token) and, when ADMIN_EMAIL is set, the email (x-admin-email) too —
 * so the admin gate is a real email + password login.
 */
export function isAdminRequest(req: NextRequest): boolean {
  if (!adminTokenValid(req.headers.get("x-admin-token"))) return false;
  const expectedEmail = process.env.ADMIN_EMAIL;
  if (expectedEmail) {
    const got = (req.headers.get("x-admin-email") || "").trim().toLowerCase();
    if (got !== expectedEmail.trim().toLowerCase()) return false;
  }
  return true;
}
