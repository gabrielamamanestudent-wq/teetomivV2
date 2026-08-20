import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRepository } from "@/lib/data";
import { getPaymentProvider } from "@/lib/payments";

export const dynamic = "force-dynamic";

// Called when the golfer returns from Stripe subscription Checkout. Verifies the
// session was paid, then flips the account to TEETOMIC+ (Gold Plus).
const schema = z.object({ sessionId: z.string().min(1) });

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const payment = getPaymentProvider();
  const status = await payment.retrieveFeeCheckout(parsed.data.sessionId).catch(() => null);
  if (!status || !status.paid) {
    return NextResponse.json({ error: "not_paid" }, { status: 402 });
  }
  const golferId = status.metadata?.golferId;
  if (!golferId) return NextResponse.json({ error: "no_golfer" }, { status: 400 });

  const account = await getRepository().setSubscription(golferId, "plus");
  return NextResponse.json({ account });
}
