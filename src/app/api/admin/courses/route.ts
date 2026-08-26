import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { isAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// Admin-only: full course list (approved + pending) for the manage-courses page.
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const courses = await getRepository().listCourses();
  return NextResponse.json({ courses });
}

// Admin-only: remove a course (and its slots) by ?courseId=...
export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const courseId = req.nextUrl.searchParams.get("courseId");
  if (!courseId) return NextResponse.json({ error: "courseId required" }, { status: 400 });
  const ok = await getRepository().deleteCourse(courseId);
  if (!ok) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
