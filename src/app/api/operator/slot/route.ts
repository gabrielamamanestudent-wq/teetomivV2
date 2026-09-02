import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRepository } from "@/lib/data";
import { requireOperator } from "@/lib/operator-auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  courseId: z.string().min(1),
  teeTimeISO: z.string().min(1),
  holes: z.union([z.literal(9), z.literal(18)]),
  pricePerPlayer: z.number().min(1).max(500),
  rackRate: z.number().min(1).max(600).optional(),
  cart: z.boolean().optional(),
  players: z.number().int().min(1).max(4).optional(),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", issues: parsed.error.flatten() }, { status: 400 });
  }
  if (!(await requireOperator(req, parsed.data.courseId))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const repo = getRepository();
  try {
    const result = await repo.createSlot(parsed.data);
    return NextResponse.json(result);
  } catch (e) {
    const msg = String((e as Error).message);
    if (msg.includes("too_soon")) {
      return NextResponse.json({ error: "too_soon" }, { status: 422 });
    }
    return NextResponse.json({ error: "create_failed", detail: msg }, { status: 400 });
  }
}
