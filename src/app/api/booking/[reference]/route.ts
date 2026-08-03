import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { reference: string } },
) {
  const repo = getRepository();
  const booking = await repo.getBookingByReference(params.reference);
  if (!booking) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const course = await repo.getCourse(booking.courseId);
  return NextResponse.json({ booking, course });
}
