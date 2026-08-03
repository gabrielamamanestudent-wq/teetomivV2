import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRepository } from "@/lib/data";
import { getPaymentProvider } from "@/lib/payments";
import { isRefundToGolfer } from "@/lib/policy";

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

  // check-in -> release deposit automatically
  const booking = await repo.checkInBooking(params.id);
  await payment.refundDeposit(booking.paymentIntentId).catch(() => {});
  return NextResponse.json({ booking, refunded: isRefundToGolfer("free-refund") });
}
