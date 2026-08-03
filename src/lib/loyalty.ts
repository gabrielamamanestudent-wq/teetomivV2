// ============================================================================
// TEETOMIC loyalty engine
// ----------------------------------------------------------------------------
// Pure, deterministic, unit-tested (mirrors pricing.ts / policy.ts). Encodes the
// points + tier + subscription model that sits on top of the $10 booking fee.
//
// Two SEPARATE currencies, on purpose:
//   • Points  — XP that only ever goes UP. Drives status tiers. NOT money, so it
//               sidesteps prepaid-card / gift-card regulation.
//   • TeeCredit — spendable money-equivalent ($), the $10 fee returned on
//               check-in. Tracked on the account, never expires.
//
// Freemium: a tier is reached by EARNING points OR by holding a TEETOMIC+
// subscription — whichever is higher (`effectiveTier`). This one switch lets the
// business run earn-only or paid without reworking anything downstream.
// ============================================================================

import type { GolferAccount, Tier } from "./data/types";
import { BOOKING_FEE_CENTS } from "./policy";

export const GOLD_AT = 300;
export const GOLD_PLUS_AT = 600;
export const POINTS_PER_CHECKIN = 50;

const TIER_ORDER: Tier[] = ["standby", "gold", "gold-plus"];

/** $1 of processed booking fee = 1 point. */
export function pointsForFeeCents(cents: number): number {
  return Math.round(cents / 100);
}

/** Points awarded for a completed (checked-in) booking: fee value + bonus. */
export function pointsForCheckin(feeCents: number = BOOKING_FEE_CENTS): number {
  return pointsForFeeCents(feeCents) + POINTS_PER_CHECKIN;
}

/** Status tier from lifetime points alone. */
export function tierForPoints(lifetimePoints: number): Tier {
  if (lifetimePoints >= GOLD_PLUS_AT) return "gold-plus";
  if (lifetimePoints >= GOLD_AT) return "gold";
  return "standby";
}

function maxTier(a: Tier, b: Tier): Tier {
  return TIER_ORDER.indexOf(a) >= TIER_ORDER.indexOf(b) ? a : b;
}

/** Earned tier, lifted by a TEETOMIC+ subscription to at least Gold Plus. */
export function effectiveTier(account: GolferAccount): Tier {
  const earned = tierForPoints(account.lifetimePoints);
  if (account.subscription === "plus") return maxTier(earned, "gold-plus");
  return earned;
}

export interface TierPerks {
  priorityWindowMin: number; // head-start on new-slot alerts
  matchmaking: boolean; // skill-based matchmaking (Gold Plus)
  feeWaived: boolean; // booking fee waived
  discountPct: number; // TEETOMIC-funded perk discount (never touches green fee)
}

export function perksForTier(tier: Tier): TierPerks {
  switch (tier) {
    case "gold-plus":
      return { priorityWindowMin: 30, matchmaking: true, feeWaived: true, discountPct: 0 };
    case "gold":
      return { priorityWindowMin: 15, matchmaking: false, feeWaived: true, discountPct: 0 };
    default:
      return { priorityWindowMin: 0, matchmaking: false, feeWaived: false, discountPct: 0 };
  }
}

/** Points still needed to reach the next tier (0 if already at the top). */
export function pointsToNextTier(lifetimePoints: number): { next: Tier | null; remaining: number } {
  if (lifetimePoints < GOLD_AT) return { next: "gold", remaining: GOLD_AT - lifetimePoints };
  if (lifetimePoints < GOLD_PLUS_AT) return { next: "gold-plus", remaining: GOLD_PLUS_AT - lifetimePoints };
  return { next: null, remaining: 0 };
}

/**
 * How much TeeCredit applies to a fee, and what's left to charge.
 * Credit is all-or-partial; never exceeds the fee or the balance.
 */
export function applyCredit(
  feeCents: number,
  creditBalanceCents: number,
): { appliedCents: number; chargeCents: number; remainingCreditCents: number } {
  const applied = Math.max(0, Math.min(feeCents, creditBalanceCents));
  return {
    appliedCents: applied,
    chargeCents: feeCents - applied,
    remainingCreditCents: creditBalanceCents - applied,
  };
}

export const TIER_LABEL: Record<Tier, { en: string; fr: string }> = {
  standby: { en: "Standby", fr: "Standby" },
  gold: { en: "Gold", fr: "Or" },
  "gold-plus": { en: "Gold Plus", fr: "Or Plus" },
};
