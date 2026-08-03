import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const repo = getRepository();
  const slot = await repo.getSlot(params.id);
  if (!slot) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const course = await repo.getCourse(slot.courseId);
  return NextResponse.json({ slot, course });
}
