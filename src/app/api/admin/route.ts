import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { isAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const repo = getRepository();
  const metrics = await repo.adminMetrics();
  const pending = await repo.listPendingCourses();
  return NextResponse.json({ metrics, pending });
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const repo = getRepository();
  await repo.reset();
  return NextResponse.json({ ok: true });
}
