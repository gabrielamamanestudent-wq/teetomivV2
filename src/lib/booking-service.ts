// Shared booking finalization: create the booking and send the confirmation
// email. Used by both the instant path (mock / $0) and the Stripe Checkout
// return, so the two never drift.

import { getRepository, type BookingResult, type CreateBookingInput } from "./data";
import { getPaymentProvider } from "./payments";
import { sendEmail, bookingConfirmationEmail } from "./email";
import { formatLocalDateTime, formatLocalTime } from "./time";

export async function createBookingAndNotify(
  input: CreateBookingInput,
): Promise<BookingResult> {
  const repo = getRepository();
  const result = await repo.createBooking(input);
  const booking = result.booking;

  // Refund-on-refill: this booking re-filled a slot whose earlier late-cancel
  // was forfeited, so that golfer is owed their $10 back to card. The repo has
  // already flipped their booking to "refunded-on-refill"; issue the real money
  // movement here (no-op for the mock provider).
  if (result.refundOnRefill) {
    await getPaymentProvider()
      .refundDeposit(result.refundOnRefill.paymentIntentId)
      .catch(() => {});
  }

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

  return result;
}
