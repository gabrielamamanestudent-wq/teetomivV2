import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRepository } from "@/lib/data";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  golferId: z.string().min(1),
  label: z.string().min(1).max(60),
  regions: z.array(
    z.enum([
      "west-island",
      "south-shore",
      "laval",
      "north-shore",
      "miami-dade",
      "broward",
      "other",
    ]),
  ),
  bands: z.array(z.enum(["dawn", "morning", "midday", "twilight"])),
  days: z.array(z.number().int().min(0).max(6)),
  maxPrice: z.number().min(10).max(300),
  active: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  const golferId = req.nextUrl.searchParams.get("golferId");
  if (!golferId) return NextResponse.json({ error: "golferId required" }, { status: 400 });
  const repo = getRepository();
  const alerts = await repo.listAlerts(golferId);
  return NextResponse.json({ alerts });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const repo = getRepository();
  const alert = await repo.createAlert(parsed.data);
  return NextResponse.json({ alert });
}
