import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRepository } from "@/lib/data";

export const dynamic = "force-dynamic";

const schema = z.object({
  slotId: z.string().min(1),
  floorPrice: z.number().min(1).max(500),
  livePrice: z.number().min(1).max(500),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const repo = getRepository();
  const result = await repo.releaseSlot(parsed.data);
  return NextResponse.json(result);
}
