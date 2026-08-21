import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { hasSupabase } from "@/lib/supabase";
import { adminConfigured } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// Lightweight diagnostics: confirm at a glance whether the app is running on the
// persistent Supabase backend or the in-memory mock, and that the DB is
// reachable. Returns only booleans/counts — never any secret.
export async function GET() {
  const mode = hasSupabase() ? "supabase" : "mock";
  const flags = {
    supabase: hasSupabase(),
    stripe: !!process.env.STRIPE_SECRET_KEY,
    stripePlusPrice: !!process.env.STRIPE_PLUS_PRICE_ID,
    resend: !!process.env.RESEND_API_KEY,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    adminProtected: adminConfigured(),
    emailFrom: process.env.EMAIL_FROM || "(default) TEETOMIC <bookings@teetomic.golf>",
    seedDemo: process.env.SEED_DEMO === "true",
  };

  try {
    const repo = getRepository();
    const courses = await repo.listCourses();
    return NextResponse.json({
      ok: true,
      mode,
      persistent: mode === "supabase",
      coursesInDb: courses.length,
      flags,
      note:
        mode === "supabase"
          ? "Running on Supabase - data persists."
          : "Running on the in-memory mock - data resets on cold starts. Add Supabase keys to persist.",
      time: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        mode,
        flags,
        error: "Backend unreachable — check the Supabase keys and that schema.sql was run.",
        detail: String((err as Error).message),
      },
      { status: 500 },
    );
  }
}
