// ============================================================================
// Operator authentication for course-management endpoints. A caller may only
// create slots / edit / upload for a course they actually own.
//
// Enforced when Supabase is configured (real backend); left open in the
// zero-config mock/demo so local exploration needs no login — same posture as
// the admin gate and demo seeding.
// ============================================================================

import type { NextRequest } from "next/server";
import { getRepository } from "./data";
import { hasSupabase } from "./supabase";

/** True if the request is a logged-in operator who owns `courseId`. */
export async function requireOperator(req: NextRequest, courseId: string): Promise<boolean> {
  if (!hasSupabase()) return true; // demo/mock: open

  const email = req.headers.get("x-operator-email");
  const pin = req.headers.get("x-operator-pin");
  if (!email || !pin) return false;

  const user = await getRepository().authenticate(email, pin);
  return !!user && user.role === "operator" && user.courseId === courseId;
}
