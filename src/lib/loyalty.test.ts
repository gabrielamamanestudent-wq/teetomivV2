import { describe, it, expect } from "vitest";
import {
  tierForPoints,
  effectiveTier,
  pointsForCheckin,
  pointsForFeeCents,
  pointsToNextTier,
  perksForTier,
  applyCredit,
  GOLD_AT,
  GOLD_PLUS_AT,
  POINTS_PER_CHECKIN,
} from "./loyalty";
import type { GolferAccount } from "./data/types";

const acct = (over: Partial<GolferAccount> = {}): GolferAccount => ({
  golferId: "g1",
  lifetimePoints: 0,
  teeCreditCents: 0,
  subscription: "none",
  ...over,
});

describe("tierForPoints — thresholds & boundaries", () => {
  it("standby below 300", () => {
    expect(tierForPoints(0)).toBe("standby");
    expect(tierForPoints(299)).toBe("standby");
  });
  it("gold at exactly 300 up to 599", () => {
    expect(tierForPoints(GOLD_AT)).toBe("gold");
    expect(tierForPoints(599)).toBe("gold");
  });
  it("gold-plus at exactly 600 and above", () => {
    expect(tierForPoints(GOLD_PLUS_AT)).toBe("gold-plus");
    expect(tierForPoints(5000)).toBe("gold-plus");
  });
});

describe("effectiveTier — freemium (earn OR subscribe)", () => {
  it("subscription lifts a standby golfer to gold-plus", () => {
    expect(effectiveTier(acct({ lifetimePoints: 10, subscription: "plus" }))).toBe("gold-plus");
  });
  it("no subscription uses the earned tier", () => {
    expect(effectiveTier(acct({ lifetimePoints: 350 }))).toBe("gold");
  });
  it("subscription never lowers an already-higher earned tier", () => {
    expect(effectiveTier(acct({ lifetimePoints: 700, subscription: "plus" }))).toBe("gold-plus");
  });
});

describe("points math", () => {
  it("$1 of fee = 1 point", () => {
    expect(pointsForFeeCents(1000)).toBe(10);
    expect(pointsForFeeCents(250)).toBe(3); // rounds
  });
  it("check-in awards fee value + fixed bonus", () => {
    expect(pointsForCheckin(1000)).toBe(10 + POINTS_PER_CHECKIN);
  });
});

describe("pointsToNextTier", () => {
  it("counts down toward gold, then gold-plus, then tops out", () => {
    expect(pointsToNextTier(0)).toEqual({ next: "gold", remaining: 300 });
    expect(pointsToNextTier(250)).toEqual({ next: "gold", remaining: 50 });
    expect(pointsToNextTier(300)).toEqual({ next: "gold-plus", remaining: 300 });
    expect(pointsToNextTier(600)).toEqual({ next: null, remaining: 0 });
  });
});

describe("perksForTier", () => {
  it("standby has no perks", () => {
    const p = perksForTier("standby");
    expect(p.feeWaived).toBe(false);
    expect(p.matchmaking).toBe(false);
    expect(p.priorityWindowMin).toBe(0);
  });
  it("gold waives the fee and gets a priority head-start", () => {
    const p = perksForTier("gold");
    expect(p.feeWaived).toBe(true);
    expect(p.priorityWindowMin).toBe(15);
    expect(p.matchmaking).toBe(false);
  });
  it("gold-plus unlocks matchmaking and the longest head-start", () => {
    const p = perksForTier("gold-plus");
    expect(p.matchmaking).toBe(true);
    expect(p.priorityWindowMin).toBe(30);
  });
});

describe("applyCredit — capping", () => {
  it("uses all the credit when it is less than the fee", () => {
    expect(applyCredit(1000, 400)).toEqual({
      appliedCents: 400,
      chargeCents: 600,
      remainingCreditCents: 0,
    });
  });
  it("caps applied credit at the fee, keeping the surplus", () => {
    expect(applyCredit(1000, 2500)).toEqual({
      appliedCents: 1000,
      chargeCents: 0,
      remainingCreditCents: 1500,
    });
  });
  it("charges the full fee when there is no credit", () => {
    expect(applyCredit(1000, 0)).toEqual({
      appliedCents: 0,
      chargeCents: 1000,
      remainingCreditCents: 0,
    });
  });
});
