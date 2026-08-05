import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRepository } from "@/lib/data";

export const dynamic = "force-dynamic";

const schema = z.object({
  courseId: z.string().min(1),
  name: z.string().min(2).max(80).optional(),
  city: z.string().min(1).max(60).optional(),
  rackRateLow: z.number().min(1).max(600).optional(),
  rackRateHigh: z.number().min(1).max(600).optional(),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const { courseId, ...patch } = parsed.data;
  const repo = getRepository();
  const course = await repo.updateCourse(courseId, patch);
  if (!course) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ course });
}
