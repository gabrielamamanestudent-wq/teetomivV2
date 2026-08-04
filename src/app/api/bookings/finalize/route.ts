import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRepository } from "@/lib/data";
import { getPaymentProvider } from "@/lib/payments";
import { createBookingAndNotify } from "@/lib/booking-service";

export const dynamic = "force-dynamic";

const schema = z.object({ sessionId: z.string().min(1) });

// Called when the golfer returns from Stripe Checkout. Verifies the session was
// paid, then creates the booking from the session metadata. Idempotent: a repeat
// call (refresh) returns the already-created booking instead of duplicating it.
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const payment = getPaymentProvider();
  const status = await payment.retrieveFeeCheckout(parsed.data.sessionId);
  if (!status.paid) {
    return NextResponse.json({ error: "not_paid" }, { status: 402 });
  }

  const m = status.metadata;
  if (!m.slotId || !m.golferId) {
    return NextResponse.json({ error: "missing_metadata" }, { status: 400 });
  }

  const repo = getRepository();
  const intentId = status.paymentIntentId ?? parsed.data.sessionId;

  // Idempotency guard: if we've already booked this payment, return it.
  const existing = (await repo.listBookings(m.golferId)).find(
    (b) => b.paymentIntentId === intentId,
  );
  if (existing) return NextResponse.json({ booking: existing });

  try {
    const result = await createBookingAndNotify({
      slotId: m.slotId,
      players: Number(m.players) || 1,
      golferId: m.golferId,
      golferName: m.golferName || "Golfer",
      golferEmail: m.golferEmail || "",
      paymentIntentId: intentId,
      applyCredit: m.applyCredit === "1",
    });
    return NextResponse.json({ booking: result.booking });
  } catch (e) {
    return NextResponse.json({ error: "booking_failed", detail: String(e) }, { status: 409 });
  }
}
