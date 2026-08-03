import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const golferId = req.nextUrl.searchParams.get("golferId");
  if (!golferId) return NextResponse.json({ error: "golferId required" }, { status: 400 });
  const repo = getRepository();
  const notifications = await repo.listNotifications(golferId);
  return NextResponse.json({ notifications });
}

export async function POST(req: NextRequest) {
  const golferId = req.nextUrl.searchParams.get("golferId");
  if (!golferId) return NextResponse.json({ error: "golferId required" }, { status: 400 });
  const repo = getRepository();
  await repo.markNotificationsRead(golferId);
  return NextResponse.json({ ok: true });
}
