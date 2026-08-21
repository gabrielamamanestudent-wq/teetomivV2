import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { adminTokenValid, isAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// GET is used by the approval link in the review email; POST by the admin UI.
export async function GET(req: NextRequest) {
  const courseId = req.nextUrl.searchParams.get("courseId");
  if (!courseId) return NextResponse.json({ error: "courseId required" }, { status: 400 });
  // The email link carries the admin token so only the recipient can approve.
  if (!adminTokenValid(req.nextUrl.searchParams.get("token"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const repo = getRepository();
  const course = await repo.approveCourse(courseId);
  if (!course) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return new NextResponse(
    `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:system-ui;background:#0B3D2E;color:#FAF8F3;display:grid;place-items:center;height:100vh;margin:0;text-align:center"><div><div style="font-size:52px">✅</div><h1 style="color:#C6F432">Approved</h1><p>${course.name} is now live on TEETOMIC.</p></div></body>`,
    { headers: { "content-type": "text/html" } },
  );
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { courseId } = await req.json().catch(() => ({}));
  if (!courseId) return NextResponse.json({ error: "courseId required" }, { status: 400 });
  const repo = getRepository();
  const course = await repo.approveCourse(courseId);
  if (!course) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ course });
}
