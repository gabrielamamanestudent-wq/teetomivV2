import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRepository } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const courseId = req.nextUrl.searchParams.get("courseId");
  if (!courseId) return NextResponse.json({ error: "courseId required" }, { status: 400 });
  const repo = getRepository();
  const availability = await repo.getAvailability(courseId);
  return NextResponse.json({ availability });
}

const schema = z.object({
  courseId: z.string().min(1),
  closedDays: z.array(z.number().int().min(0).max(6)),
  blackout: z.array(
    z.object({
      startHour: z.number().int().min(0).max(23),
      endHour: z.number().int().min(1).max(24),
      label: z.string().max(40).optional(),
    }),
  ),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", issues: parsed.error.flatten() }, { status: 400 });
  }
  const repo = getRepository();
  const availability = await repo.setAvailability(parsed.data);
  return NextResponse.json({ availability });
}
