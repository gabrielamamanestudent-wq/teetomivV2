import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRepository } from "@/lib/data";
import { getPaymentProvider } from "@/lib/payments";
import { DEPOSIT_CENTS } from "@/lib/policy";
import { sendEmail, bookingConfirmationEmail } from "@/lib/email";
import { formatLocalDateTime, formatLocalTime } from "@/lib/time";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  slotId: z.string().min(1),
  players: z.number().int().min(1).max(4),
  golferId: z.string().min(1),
  golferName: z.string().min(1).max(80),
  golferEmail: z.string().email(),
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

  const slot = await repo.getSlot(parsed.data.slotId);
  if (!slot || slot.spotsLeft <= 0) {
    return NextResponse.json({ error: "slot_unavailable" }, { status: 409 });
  }

  // 1) Authorize the $15 refundable deposit (Stripe test mode or mock).
  const payment = getPaymentProvider();
  let intentId: string;
  try {
    const auth = await payment.authorizeDeposit({
      amountCents: DEPOSIT_CENTS,
      golferEmail: parsed.data.golferEmail,
      reference: parsed.data.slotId,
    });
    intentId = auth.paymentIntentId;
  } catch (e) {
    return NextResponse.json(
      { error: "deposit_failed", detail: String(e) },
      { status: 402 },
    );
  }

  // 2) Create the booking.
  const booking = await repo.createBooking({
    slotId: parsed.data.slotId,
    golferId: parsed.data.golferId,
    golferName: parsed.data.golferName,
    golferEmail: parsed.data.golferEmail,
    players: parsed.data.players,
    paymentIntentId: intentId,
  });

  // 3) Fire the confirmation email (mock/console fallback).
  const course = await repo.getCourse(booking.courseId);
  const email = bookingConfirmationEmail({
    reference: booking.reference,
    courseName: course?.name ?? "Your course",
    teeTimeLabel: formatLocalDateTime(booking.teeTimeISO),
    pricePerPlayer: booking.pricePerPlayer,
    players: booking.players,
    cancelDeadlineLabel: formatLocalTime(booking.freeCancellationDeadlineISO),
  });
  await sendEmail({ to: booking.golferEmail, ...email });

  return NextResponse.json({ booking, mockPayment: payment.isMock });
}
