import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const repo = getRepository();
  const metrics = await repo.adminMetrics();
  return NextResponse.json({ metrics });
}

export async function POST() {
  const repo = getRepository();
  await repo.reset();
  return NextResponse.json({ ok: true });
}
