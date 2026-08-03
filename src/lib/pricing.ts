// ============================================================================
// TEETOMIC dynamic pricing engine
// ----------------------------------------------------------------------------
// Pure, deterministic, unit-tested. Given how close a tee time is (and a few
// contextual signals) it returns a live price that decays as the slot ages,
// never dropping below the operator's floor. Rules are intentionally simple
// and transparent so operators trust them.
//
//   Base decay ladder (discount off rack rate):
//     >= 48h out ............ 15%
//     >= 24h out ............ 25%
//     >= 12h out ............ 40%
//     >=  3h out ............ 50%
//     <   3h out ............ 60%  (max)
//
//   Modifiers:
//     - Premium slots (weekend 07:00–10:00) decay SLOWER: discount * 0.6
//     - Rain adds up to +10 discount points (people don't want wet rounds)
//     - A nearly-full day (high fill rate) decays SLOWER: discount * (1 - fill*0.3)
//     - Result is always clamped to [0%, 60%] and never below the floor price.
// ============================================================================

import type { TimeBand, Weather } from "./pricing-types";

export interface PricingInput {
  hoursUntilTeeTime: number;
  rackRate: number;
  floorPrice: number;
  dayOfWeek: number; // 0=Sun ... 6=Sat
  band: TimeBand;
  teeHour: number; // 0-23 local hour of the tee time
  weather: Weather;
  fillRate: number; // 0..1, how full that day's sheet is
}

export interface PricingResult {
  price: number; // final live price, rounded to nearest dollar
  discountPct: number; // effective discount off rack, 0..60
  atFloor: boolean; // true if the floor price clamped the result
  isPremium: boolean;
}

export const MAX_DISCOUNT_PCT = 60;

/** Base discount from the time-decay ladder, before modifiers. */
export function baseDiscountPct(hoursUntilTeeTime: number): number {
  if (hoursUntilTeeTime >= 48) return 15;
  if (hoursUntilTeeTime >= 24) return 25;
  if (hoursUntilTeeTime >= 12) return 40;
  if (hoursUntilTeeTime >= 3) return 50;
  return 60;
}

/** Weekend 07:00–10:00 tee times are premium and decay slower. */
export function isPremiumSlot(dayOfWeek: number, teeHour: number): boolean {
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  return isWeekend && teeHour >= 7 && teeHour < 10;
}

export function computePrice(input: PricingInput): PricingResult {
  const {
    hoursUntilTeeTime,
    rackRate,
    floorPrice,
    dayOfWeek,
    teeHour,
    weather,
    fillRate,
  } = input;

  let discount = baseDiscountPct(hoursUntilTeeTime);
  const premium = isPremiumSlot(dayOfWeek, teeHour);

  // Premium slots hold their value: dampen the discount.
  if (premium) {
    discount = discount * 0.6;
  }

  // A busy day means demand is healthy — slow the decay.
  const clampedFill = Math.max(0, Math.min(1, fillRate));
  discount = discount * (1 - clampedFill * 0.3);

  // Rain softens demand — nudge the discount up.
  if (weather === "rain") {
    discount += 10;
  } else if (weather === "cloud") {
    discount += 3;
  }

  // Clamp discount to the allowed band.
  discount = Math.max(0, Math.min(MAX_DISCOUNT_PCT, discount));

  let price = Math.round(rackRate * (1 - discount / 100));

  // Never sell below the operator's floor.
  let atFloor = false;
  if (price < floorPrice) {
    price = floorPrice;
    atFloor = true;
  }

  // Recompute the effective discount actually being offered.
  const effectiveDiscount = Math.round(((rackRate - price) / rackRate) * 100);

  return {
    price,
    discountPct: effectiveDiscount,
    atFloor,
    isPremium: premium,
  };
}

/**
 * Build a price-decay preview series for the operator's release screen.
 * Returns one point per hour marker leading up to the tee time.
 */
export function priceDecayPreview(
  input: Omit<PricingInput, "hoursUntilTeeTime">,
  markers: number[] = [48, 36, 24, 18, 12, 6, 3, 1, 0],
): { hoursOut: number; price: number; discountPct: number }[] {
  return markers.map((h) => {
    const { price, discountPct } = computePrice({
      ...input,
      hoursUntilTeeTime: h,
    });
    return { hoursOut: h, price, discountPct };
  });
}
