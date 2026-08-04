import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRepository } from "@/lib/data";
import { getPaymentProvider } from "@/lib/payments";
import { BOOKING_FEE_CENTS } from "@/lib/policy";
import { applyCredit, effectiveTier, perksForTier } from "@/lib/loyalty";
import { createBookingAndNotify } from "@/lib/booking-service";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  slotId: z.string().min(1),
  players: z.number().int().min(1).max(4),
  golferId: z.string().min(1),
  golferName: z.string().min(1).max(80),
  golferEmail: z.string().email(),
  applyCredit: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const golferId = req.nextUrl.searchParams.get("golferId");
  if (!golferId) return NextResponse.json({ error: "golferId required" }, { status: 400 });
  const repo = getRepository();
  const bookings = await repo.listBookings(golferId);
  const courses = await repo.listCourses();
  return NextResponse.json({ bookings, courses });
}

export async function POST(req: NextRequest) {
  const repo = getRepository();
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const input = parsed.data;

  const slot = await repo.getSlot(input.slotId);
  if (!slot || slot.spotsLeft <= 0) {
    return NextResponse.json({ error: "slot_unavailable" }, { status: 409 });
  }

  const payment = getPaymentProvider();

  // Work out what's actually due now: tier can waive the fee, TeeCredit can cover it.
  const account = await repo.getAccount(input.golferId);
  const feeCents = perksForTier(effectiveTier(account)).feeWaived ? 0 : BOOKING_FEE_CENTS;
  const creditAvail = input.applyCredit ? account.teeCreditCents : 0;
  const { chargeCents } = applyCredit(feeCents, creditAvail);

  // --- Instant path: mock provider (demo) or nothing to charge --------------
  if (payment.isMock || chargeCents === 0) {
    let intentId = "pi_waived";
    if (chargeCents > 0) {
      try {
        const auth = await payment.authorizeDeposit({
          amountCents: chargeCents,
          golferEmail: input.golferEmail,
          reference: input.slotId,
        });
        intentId = auth.paymentIntentId;
      } catch (e) {
        return NextResponse.json({ error: "fee_failed", detail: String(e) }, { status: 402 });
      }
    }
    const result = await createBookingAndNotify({ ...input, paymentIntentId: intentId });
    return NextResponse.json({
      booking: result.booking,
      mockPayment: payment.isMock,
      feeCents: result.feeCents,
      creditAppliedCents: result.creditAppliedCents,
      chargedCents: result.chargedCents,
      pointsPreview: result.pointsPreview,
    });
  }

  // --- Real Stripe path: redirect to hosted Checkout ------------------------
  // The booking is created on return (see /api/bookings/finalize) once Stripe
  // confirms the payment. All booking params ride along in session metadata.
  const origin = req.nextUrl.origin;
  try {
    const session = await payment.createFeeCheckout({
      amountCents: chargeCents,
      golferEmail: input.golferEmail,
      successUrl: `${origin}/book/complete?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/deal/${input.slotId}`,
      metadata: {
        slotId: input.slotId,
        players: String(input.players),
        golferId: input.golferId,
        golferName: input.golferName,
        golferEmail: input.golferEmail,
        applyCredit: input.applyCredit ? "1" : "0",
      },
    });
    return NextResponse.json({ checkoutUrl: session.url });
  } catch (e) {
    return NextResponse.json({ error: "checkout_failed", detail: String(e) }, { status: 402 });
  }
}
