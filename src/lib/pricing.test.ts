import { describe, it, expect } from "vitest";
import {
  computePrice,
  baseDiscountPct,
  isPremiumSlot,
  priceDecayPreview,
  MAX_DISCOUNT_PCT,
  type PricingInput,
} from "./pricing";

const base: PricingInput = {
  hoursUntilTeeTime: 48,
  rackRate: 100,
  floorPrice: 30,
  dayOfWeek: 3, // Wednesday, non-premium
  band: "morning",
  teeHour: 8,
  weather: "sun",
  fillRate: 0,
};

describe("baseDiscountPct — the decay ladder", () => {
  it("gives 15% at 48h out", () => {
    expect(baseDiscountPct(48)).toBe(15);
    expect(baseDiscountPct(72)).toBe(15);
  });
  it("gives 25% between 24h and 48h out", () => {
    expect(baseDiscountPct(24)).toBe(25);
    expect(baseDiscountPct(47.99)).toBe(25);
  });
  it("gives 40% between 12h and 24h out", () => {
    expect(baseDiscountPct(12)).toBe(40);
    expect(baseDiscountPct(23.99)).toBe(40);
  });
  it("gives 50% at 3h out and 60% inside 3h", () => {
    expect(baseDiscountPct(3)).toBe(50);
    expect(baseDiscountPct(2.9)).toBe(60);
    expect(baseDiscountPct(0)).toBe(60);
  });
});

describe("computePrice — decay curve on a plain weekday slot", () => {
  it("48h out: 15% off $100 => $85", () => {
    expect(computePrice(base).price).toBe(85);
  });
  it("24h out: 25% off => $75", () => {
    expect(computePrice({ ...base, hoursUntilTeeTime: 24 }).price).toBe(75);
  });
  it("12h out: 40% off => $60", () => {
    expect(computePrice({ ...base, hoursUntilTeeTime: 12 }).price).toBe(60);
  });
  it("2h out: 60% off => $40 (max discount)", () => {
    const r = computePrice({ ...base, hoursUntilTeeTime: 2 });
    expect(r.price).toBe(40);
    expect(r.discountPct).toBe(60);
  });
  it("monotonically non-increasing as the tee time approaches", () => {
    const points = [72, 48, 24, 12, 6, 3, 1, 0].map(
      (h) => computePrice({ ...base, hoursUntilTeeTime: h }).price,
    );
    for (let i = 1; i < points.length; i++) {
      expect(points[i]).toBeLessThanOrEqual(points[i - 1]);
    }
  });
});

describe("computePrice — floor price is never breached", () => {
  it("clamps to the floor and flags atFloor", () => {
    const r = computePrice({
      ...base,
      hoursUntilTeeTime: 0,
      floorPrice: 55,
    });
    expect(r.price).toBe(55);
    expect(r.atFloor).toBe(true);
  });
  it("does not flag atFloor when above the floor", () => {
    expect(computePrice(base).atFloor).toBe(false);
  });
  it("never returns a price below the floor across the whole curve", () => {
    const floor = 50;
    for (const h of [48, 24, 12, 6, 3, 1, 0]) {
      const r = computePrice({ ...base, hoursUntilTeeTime: h, floorPrice: floor });
      expect(r.price).toBeGreaterThanOrEqual(floor);
    }
  });
});

describe("isPremiumSlot — weekend 7-10am", () => {
  it("true for Saturday 8am and Sunday 9am", () => {
    expect(isPremiumSlot(6, 8)).toBe(true);
    expect(isPremiumSlot(0, 9)).toBe(true);
  });
  it("false at 10am (exclusive upper bound) and before 7am", () => {
    expect(isPremiumSlot(6, 10)).toBe(false);
    expect(isPremiumSlot(6, 6)).toBe(false);
  });
  it("false on weekdays", () => {
    expect(isPremiumSlot(3, 8)).toBe(false);
  });
});

describe("computePrice — premium slots decay slower", () => {
  it("holds more value than an equivalent weekday slot", () => {
    const weekday = computePrice({
      ...base,
      hoursUntilTeeTime: 12,
      dayOfWeek: 3,
      teeHour: 8,
    });
    const premium = computePrice({
      ...base,
      hoursUntilTeeTime: 12,
      dayOfWeek: 6, // Saturday
      teeHour: 8,
    });
    expect(premium.price).toBeGreaterThan(weekday.price);
    expect(premium.isPremium).toBe(true);
  });
});

describe("computePrice — contextual modifiers", () => {
  it("rain deepens the discount", () => {
    const dry = computePrice({ ...base, hoursUntilTeeTime: 24, weather: "sun" });
    const wet = computePrice({ ...base, hoursUntilTeeTime: 24, weather: "rain" });
    expect(wet.price).toBeLessThan(dry.price);
  });
  it("a full day slows the decay (higher price)", () => {
    const empty = computePrice({ ...base, hoursUntilTeeTime: 24, fillRate: 0 });
    const full = computePrice({ ...base, hoursUntilTeeTime: 24, fillRate: 1 });
    expect(full.price).toBeGreaterThan(empty.price);
  });
  it("never exceeds the max discount even with rain + empty day", () => {
    const r = computePrice({
      ...base,
      hoursUntilTeeTime: 0,
      weather: "rain",
      fillRate: 0,
      floorPrice: 1,
    });
    expect(r.discountPct).toBeLessThanOrEqual(MAX_DISCOUNT_PCT);
  });
});

describe("priceDecayPreview", () => {
  it("returns one point per marker in order", () => {
    const series = priceDecayPreview(base);
    expect(series.length).toBe(9);
    expect(series[0].hoursOut).toBe(48);
    expect(series[series.length - 1].hoursOut).toBe(0);
  });
});
