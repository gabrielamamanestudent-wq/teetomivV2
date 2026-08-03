import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const repo = getRepository();
  const sp = req.nextUrl.searchParams;
  const courseId = sp.get("courseId");
  const view = sp.get("view") ?? "slots";
  if (!courseId) return NextResponse.json({ error: "courseId required" }, { status: 400 });

  if (view === "checkins") {
    const checkins = await repo.courseCheckins(courseId);
    return NextResponse.json({ checkins });
  }
  if (view === "stats") {
    const stats = await repo.operatorStats(courseId);
    return NextResponse.json({ stats });
  }
  const slots = await repo.courseSlots(courseId);
  const course = await repo.getCourse(courseId);
  return NextResponse.json({ slots, course });
}
