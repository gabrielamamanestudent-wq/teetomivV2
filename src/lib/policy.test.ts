import { describe, it, expect } from "vitest";
import {
  freeCancellationDeadline,
  isWithinFreeWindow,
  resolveCancellation,
  noShowForfeitTime,
  isNoShowForfeited,
  depositSplit,
  isRefundToGolfer,
  DEPOSIT_CENTS,
  HOUR_MS,
} from "./policy";

const teeTime = new Date("2026-08-10T12:00:00.000Z");
const hoursBefore = (h: number) => new Date(teeTime.getTime() - h * HOUR_MS);
const hoursAfter = (h: number) => new Date(teeTime.getTime() + h * HOUR_MS);

describe("freeCancellationDeadline — tiered windows", () => {
  it("booked >24h out -> free until 12h before tee time", () => {
    const bookedAt = hoursBefore(48);
    const deadline = freeCancellationDeadline(bookedAt, teeTime);
    expect(deadline.getTime()).toBe(hoursBefore(12).getTime());
  });

  it("booked exactly at 24h out -> uses the within-24h tier (4h)", () => {
    // lead == 24h is NOT strictly greater than 24h, so the 4h cushion applies.
    const bookedAt = hoursBefore(24);
    const deadline = freeCancellationDeadline(bookedAt, teeTime);
    expect(deadline.getTime()).toBe(hoursBefore(4).getTime());
  });

  it("booked just over 24h out -> 12h cushion (boundary)", () => {
    const bookedAt = new Date(teeTime.getTime() - (24 * HOUR_MS + 1));
    const deadline = freeCancellationDeadline(bookedAt, teeTime);
    expect(deadline.getTime()).toBe(hoursBefore(12).getTime());
  });

  it("booked within 24h -> free until 4h before tee time", () => {
    const bookedAt = hoursBefore(10);
    const deadline = freeCancellationDeadline(bookedAt, teeTime);
    expect(deadline.getTime()).toBe(hoursBefore(4).getTime());
  });

  it("booked inside 4h -> 4h cushion already elapsed, no free window", () => {
    const bookedAt = hoursBefore(2);
    const deadline = freeCancellationDeadline(bookedAt, teeTime);
    // Deadline is 4h before tee (in the past relative to booking): no free window.
    expect(deadline.getTime()).toBe(hoursBefore(4).getTime());
    expect(isWithinFreeWindow(bookedAt, bookedAt, teeTime)).toBe(false);
  });
});

describe("isWithinFreeWindow", () => {
  it("true before the deadline, false after", () => {
    const bookedAt = hoursBefore(48); // deadline = 12h before
    expect(isWithinFreeWindow(hoursBefore(13), bookedAt, teeTime)).toBe(true);
    expect(isWithinFreeWindow(hoursBefore(11), bookedAt, teeTime)).toBe(false);
  });

  it("inclusive exactly at the deadline", () => {
    const bookedAt = hoursBefore(48);
    expect(isWithinFreeWindow(hoursBefore(12), bookedAt, teeTime)).toBe(true);
  });
});

describe("resolveCancellation", () => {
  const bookedAt = hoursBefore(48); // deadline at 12h before

  it("free-refund inside the window", () => {
    expect(
      resolveCancellation({
        now: hoursBefore(20),
        bookedAt,
        teeTime,
        slotRefilled: false,
      }),
    ).toBe("free-refund");
  });

  it("forfeit when late and not refilled", () => {
    expect(
      resolveCancellation({
        now: hoursBefore(6),
        bookedAt,
        teeTime,
        slotRefilled: false,
      }),
    ).toBe("forfeit");
  });

  it("refund-on-refill when late but slot re-booked before tee time", () => {
    expect(
      resolveCancellation({
        now: hoursBefore(6),
        bookedAt,
        teeTime,
        slotRefilled: true,
      }),
    ).toBe("refund-on-refill");
  });

  it("forfeit if 'refilled' but already past tee time", () => {
    expect(
      resolveCancellation({
        now: hoursAfter(1),
        bookedAt,
        teeTime,
        slotRefilled: true,
      }),
    ).toBe("forfeit");
  });
});

describe("no-show auto-forfeit", () => {
  it("forfeit time is exactly 1h after tee time", () => {
    expect(noShowForfeitTime(teeTime).getTime()).toBe(hoursAfter(1).getTime());
  });

  it("not forfeited before tee+1h, forfeited at/after", () => {
    expect(isNoShowForfeited(hoursAfter(0.5), teeTime)).toBe(false);
    expect(isNoShowForfeited(hoursAfter(1), teeTime)).toBe(true);
    expect(isNoShowForfeited(hoursAfter(2), teeTime)).toBe(true);
  });
});

describe("depositSplit — 50/50", () => {
  it("splits the standard $15 deposit into $7.50 / $7.50", () => {
    const split = depositSplit();
    expect(split.courseCents).toBe(750);
    expect(split.teetomicCents).toBe(750);
    expect(split.courseCents + split.teetomicCents).toBe(DEPOSIT_CENTS);
  });

  it("keeps cents conserved for odd amounts", () => {
    const split = depositSplit(1501);
    expect(split.courseCents + split.teetomicCents).toBe(1501);
  });
});

describe("isRefundToGolfer", () => {
  it("true for free-refund and refund-on-refill, false for forfeit", () => {
    expect(isRefundToGolfer("free-refund")).toBe(true);
    expect(isRefundToGolfer("refund-on-refill")).toBe(true);
    expect(isRefundToGolfer("forfeit")).toBe(false);
  });
});
