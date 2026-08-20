import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRepository } from "@/lib/data";
import { getPaymentProvider } from "@/lib/payments";
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
  golferEmail: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  const repo = getRepository();
  const { golferId, action, handicap, golferEmail } = parsed.data;

  if (action === "subscribe") {
    const payment = getPaymentProvider();
    const priceId = process.env.STRIPE_PLUS_PRICE_ID;
    // Real Stripe path: if we have a live provider + a configured price, send the
    // golfer to hosted Checkout to actually start the $9.99/mo subscription.
    if (!payment.isMock && priceId) {
      const origin = req.nextUrl.origin;
      try {
        const session = await payment.createSubscriptionCheckout({
          priceId,
          golferId,
          golferEmail: golferEmail ?? "golfer@teetomic.golf",
          successUrl: `${origin}/rewards?plus_session={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${origin}/rewards`,
        });
        return NextResponse.json({ checkoutUrl: session.url });
      } catch (e) {
        return NextResponse.json({ error: "checkout_failed", detail: String(e) }, { status: 402 });
      }
    }
    // Demo / no price configured: flip the flag directly.
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
