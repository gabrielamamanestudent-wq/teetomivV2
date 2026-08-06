// ============================================================================
// Backend integration tests for the in-memory repository. Guards the loyalty /
// matchmaking / booking flows the UI depends on (handicap persistence, Gold Plus
// matchmaking gating and proximity sort, fee waiver, check-in crediting).
// ============================================================================

import { beforeEach, describe, expect, it } from "vitest";
import { MockRepository } from "./mock-repository";
import { effectiveTier, perksForTier, pointsForCheckin } from "../loyalty";
import { BOOKING_FEE_CENTS } from "../policy";

const repo = new MockRepository();

beforeEach(async () => {
  await repo.reset();
});

describe("loyalty accounts + matchmaking", () => {
  const me = "m-tester";

  it("gates matchmaking behind Gold Plus", async () => {
    const fresh = await repo.getAccount(me);
    expect(effectiveTier(fresh)).toBe("standby");
    expect(perksForTier(effectiveTier(fresh)).matchmaking).toBe(false);

    const subbed = await repo.setSubscription(me, "plus");
    expect(effectiveTier(subbed)).toBe("gold-plus");
    expect(perksForTier(effectiveTier(subbed)).matchmaking).toBe(true);
  });

  it("saves and persists the handicap", async () => {
    await repo.setHandicap(me, 10);
    const reread = await repo.getAccount(me);
    expect(reread.handicap).toBe(10);

    // Overwriting updates in place, not appends.
    await repo.setHandicap(me, 6);
    expect((await repo.getAccount(me)).handicap).toBe(6);
  });

  it("sorts matchmaking candidates by handicap proximity to mine", async () => {
    await repo.setSubscription(me, "plus");
    await repo.setHandicap(me, 10);
    const cands = await repo.matchmaking(me);
    expect(cands.length).toBeGreaterThan(0);
    expect(cands.every((c) => c.golferId !== me)).toBe(true);

    const gaps = cands.map((c) => Math.abs(c.handicap - 10));
    const sorted = [...gaps].sort((a, b) => a - b);
    expect(gaps).toEqual(sorted);

    // Re-index to a new handicap and the nearest candidate follows.
    await repo.setHandicap(me, 8);
    const c2 = await repo.matchmaking(me);
    expect(c2[0].handicap).toBe(8);
  });

  it("only lists candidates who have set a handicap", async () => {
    const nohcp = "m-nohandicap";
    await repo.setSubscription(nohcp, "plus"); // Gold Plus but no handicap
    const cands = await repo.matchmaking(me);
    expect(cands.some((c) => c.golferId === nohcp)).toBe(false);
  });
});

describe("booking fee waiver + check-in crediting", () => {
  async function firstReleasedSlot() {
    const deals = await repo.listDeals();
    return deals[0];
  }

  it("charges the $10 fee for a standby golfer and credits it on check-in", async () => {
    const slot = await firstReleasedSlot();
    const golferId = "m-standby";
    const { feeCents, booking } = await repo.createBooking({
      slotId: slot.id,
      golferId,
      golferName: "Standby Sam",
      golferEmail: "sam@example.com",
      players: 1,
      paymentIntentId: "pi_test",
    });
    expect(feeCents).toBe(BOOKING_FEE_CENTS);

    const before = await repo.getAccount(golferId);
    expect(before.lifetimePoints).toBe(0);

    await repo.checkInBooking(booking.id);
    const after = await repo.getAccount(golferId);
    expect(after.teeCreditCents).toBe(BOOKING_FEE_CENTS); // returned as TeeCredit
    expect(after.lifetimePoints).toBe(pointsForCheckin(BOOKING_FEE_CENTS));
  });

  it("waives the fee for a Gold Plus golfer", async () => {
    const slot = await firstReleasedSlot();
    const golferId = "m-goldplus";
    await repo.setSubscription(golferId, "plus");
    const { feeCents } = await repo.createBooking({
      slotId: slot.id,
      golferId,
      golferName: "Gold Gary",
      golferEmail: "gary@example.com",
      players: 1,
      paymentIntentId: "pi_test",
    });
    expect(feeCents).toBe(0);
  });

  it("flags refund-on-refill when a forfeited slot is re-booked", async () => {
    // A slot 2h out: booked now, its free-cancel deadline (tee - 4h) is already
    // in the past, so cancelling forfeits the fee.
    const teeISO = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const { slot } = await repo.createSlot({
      courseId: "c1",
      teeTimeISO: teeISO,
      holes: 18,
      pricePerPlayer: 40,
      players: 4,
    });

    const first = await repo.createBooking({
      slotId: slot.id,
      golferId: "m-a",
      golferName: "First A",
      golferEmail: "a@example.com",
      players: 1,
      paymentIntentId: "pi_first",
    });
    const cancelled = await repo.cancelBooking(first.booking.id);
    expect(cancelled.depositStatus).toBe("forfeited");

    // Someone else re-books the freed slot before tee time.
    const second = await repo.createBooking({
      slotId: slot.id,
      golferId: "m-b",
      golferName: "Second B",
      golferEmail: "b@example.com",
      players: 1,
      paymentIntentId: "pi_second",
    });
    expect(second.refundOnRefill).toEqual({
      bookingId: first.booking.id,
      paymentIntentId: "pi_first",
    });

    // And the prior booking is now marked refunded-on-refill.
    const reread = await repo.getBookingByReference(first.booking.reference);
    expect(reread?.depositStatus).toBe("refunded-on-refill");
  });

  it("is idempotent: double check-in does not double-award", async () => {
    const slot = await firstReleasedSlot();
    const golferId = "m-once";
    const { booking } = await repo.createBooking({
      slotId: slot.id,
      golferId,
      golferName: "Once",
      golferEmail: "once@example.com",
      players: 1,
      paymentIntentId: "pi_test",
    });
    await repo.checkInBooking(booking.id);
    await repo.checkInBooking(booking.id);
    const acct = await repo.getAccount(golferId);
    expect(acct.lifetimePoints).toBe(pointsForCheckin(BOOKING_FEE_CENTS));
    expect(acct.teeCreditCents).toBe(BOOKING_FEE_CENTS);
  });
});
