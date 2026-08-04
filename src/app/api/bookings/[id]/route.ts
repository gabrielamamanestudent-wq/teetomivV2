import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRepository } from "@/lib/data";
import { getPaymentProvider } from "@/lib/payments";

export const dynamic = "force-dynamic";

const actionSchema = z.object({
  action: z.enum(["cancel", "checkin"]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const repo = getRepository();
  const body = await req.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }

  const payment = getPaymentProvider();

  if (parsed.data.action === "cancel") {
    const booking = await repo.cancelBooking(params.id);
    // Trigger the real refund only when the outcome returns money to the golfer.
    const refunded = booking.depositStatus === "refunded";
    if (refunded) {
      await payment.refundDeposit(booking.paymentIntentId).catch(() => {});
    }
    return NextResponse.json({ booking });
  }

  // check-in -> the $10 is returned as TeeCredit + points (handled in the repo).
  // We keep the cash (no card refund); the golfer gets store credit instead.
  const booking = await repo.checkInBooking(params.id);
  return NextResponse.json({ booking, credited: true });
}
