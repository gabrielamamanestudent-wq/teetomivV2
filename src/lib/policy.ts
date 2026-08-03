// ============================================================================
// TEETOMIC deposit & cancellation policy
// ----------------------------------------------------------------------------
// Pure, deterministic, unit-tested. Encapsulates the entire deposit lifecycle:
//   • $15 CAD refundable deposit per BOOKING (not per player)
//   • Tiered free-cancellation window based on how far ahead the golfer booked
//   • Late-cancel / no-show forfeiture, split 50/50 course / TEETOMIC (display)
//   • Refund-on-refill: a late cancel is refunded if the slot re-books in time
//   • No-show auto-forfeit 1 hour after the tee time
//
// All times are handled as absolute instants (Date / ISO). Human-facing local
// formatting (America/Toronto) is done in the UI layer, not here.
// ============================================================================

export const DEPOSIT_CENTS = 1500; // $15.00 CAD per booking
export const HOUR_MS = 60 * 60 * 1000;

export type CancellationOutcome =
  | "free-refund" // cancelled inside the free window -> full refund
  | "forfeit" // cancelled late (or no-show) -> deposit kept, split 50/50
  | "refund-on-refill"; // cancelled late BUT slot re-filled -> refunded

export interface DepositSplit {
  courseCents: number;
  teetomicCents: number;
}

/**
 * The moment up to which cancellation is free, from the booking instant.
 *   - Booked > 24h before tee time  -> free until 12h before tee time
 *   - Booked <= 24h before tee time -> free until  4h before tee time
 * If the booking is already inside 4h, the deadline is the tee time itself.
 */
export function freeCancellationDeadline(bookedAt: Date, teeTime: Date): Date {
  const leadMs = teeTime.getTime() - bookedAt.getTime();
  const bookedMoreThan24hOut = leadMs > 24 * HOUR_MS;
  const cushionHours = bookedMoreThan24hOut ? 12 : 4;
  const deadline = new Date(teeTime.getTime() - cushionHours * HOUR_MS);
  // Never place the deadline after the tee time.
  return deadline.getTime() > teeTime.getTime() ? teeTime : deadline;
}

/** True if `now` is at or before the free-cancellation deadline. */
export function isWithinFreeWindow(
  now: Date,
  bookedAt: Date,
  teeTime: Date,
): boolean {
  return now.getTime() <= freeCancellationDeadline(bookedAt, teeTime).getTime();
}

/**
 * Resolve what happens to the deposit when a golfer cancels.
 * `slotRefilled` reflects whether the freed slot has already been re-booked
 * through TEETOMIC before the tee time.
 */
export function resolveCancellation(params: {
  now: Date;
  bookedAt: Date;
  teeTime: Date;
  slotRefilled: boolean;
}): CancellationOutcome {
  const { now, bookedAt, teeTime, slotRefilled } = params;
  if (isWithinFreeWindow(now, bookedAt, teeTime)) {
    return "free-refund";
  }
  // Late cancel: refunded only if the slot gets refilled before tee time.
  if (slotRefilled && now.getTime() < teeTime.getTime()) {
    return "refund-on-refill";
  }
  return "forfeit";
}

/** The instant a no-show auto-forfeits: 1 hour after the tee time. */
export function noShowForfeitTime(teeTime: Date): Date {
  return new Date(teeTime.getTime() + HOUR_MS);
}

/**
 * Whether a still-unresolved booking should auto-forfeit as a no-show.
 * True once we're past tee time + 1h and the golfer never checked in.
 */
export function isNoShowForfeited(now: Date, teeTime: Date): boolean {
  return now.getTime() >= noShowForfeitTime(teeTime).getTime();
}

/** Forfeited deposits are split 50/50 course / TEETOMIC (display only). */
export function depositSplit(cents: number = DEPOSIT_CENTS): DepositSplit {
  const courseCents = Math.floor(cents / 2);
  return {
    courseCents,
    teetomicCents: cents - courseCents,
  };
}

/** Map an outcome to whether the deposit money returns to the golfer. */
export function isRefundToGolfer(outcome: CancellationOutcome): boolean {
  return outcome === "free-refund" || outcome === "refund-on-refill";
}
