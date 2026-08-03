import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRepository } from "@/lib/data";
import { effectiveTier, perksForTier, pointsToNextTier, tierForPoints } from "@/lib/loyalty";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const golferId = req.nextUrl.searchParams.get("golferId");
  if (!golferId) return NextResponse.json({ error: "golferId required" }, { status: 400 });
  const repo = getRepository();
  const account = await repo.getAccount(golferId);
  const ledger = await repo.listPointsLedger(golferId);
  const tier = effectiveTier(account);
  const matchmaking = perksForTier(tier).matchmaking ? await repo.matchmaking(golferId) : [];
  return NextResponse.json({
    account,
    ledger,
    tier,
    earnedTier: tierForPoints(account.lifetimePoints),
    perks: perksForTier(tier),
    next: pointsToNextTier(account.lifetimePoints),
    matchmaking,
  });
}

const actionSchema = z.object({
  golferId: z.string().min(1),
  action: z.enum(["subscribe", "unsubscribe", "handicap"]),
  handicap: z.number().min(0).max(54).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  const repo = getRepository();
  const { golferId, action, handicap } = parsed.data;

  if (action === "subscribe") {
    const account = await repo.setSubscription(golferId, "plus");
    return NextResponse.json({ account });
  }
  if (action === "unsubscribe") {
    const account = await repo.setSubscription(golferId, "none");
    return NextResponse.json({ account });
  }
  const account = await repo.setHandicap(golferId, handicap ?? 18);
  return NextResponse.json({ account });
}
