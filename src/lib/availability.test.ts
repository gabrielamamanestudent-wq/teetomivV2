import { describe, it, expect } from "vitest";
import { hourBlackedOut, formatBlackoutWindow } from "./availability";
import type { CourseAvailability } from "./data/types";

const av: CourseAvailability = {
  courseId: "c1",
  closedDays: [1], // Mondays closed
  blackout: [
    { startHour: 0, endHour: 7 }, // no dawn listings
    { startHour: 11, endHour: 13, label: "Member block" },
  ],
};

describe("hourBlackedOut", () => {
  it("blocks a closed day at any hour", () => {
    expect(hourBlackedOut(av, 1, 15)).toBe(true);
  });
  it("allows an open day outside blackout windows", () => {
    expect(hourBlackedOut(av, 3, 9)).toBe(false);
    expect(hourBlackedOut(av, 3, 15)).toBe(false);
  });
  it("blocks inside a blackout window (start inclusive, end exclusive)", () => {
    expect(hourBlackedOut(av, 3, 11)).toBe(true);
    expect(hourBlackedOut(av, 3, 12)).toBe(true);
    expect(hourBlackedOut(av, 3, 13)).toBe(false); // end is exclusive
    expect(hourBlackedOut(av, 3, 6)).toBe(true);
    expect(hourBlackedOut(av, 3, 7)).toBe(false);
  });
  it("no availability config means nothing is blocked", () => {
    expect(hourBlackedOut(null, 1, 3)).toBe(false);
    expect(hourBlackedOut(undefined, 1, 12)).toBe(false);
  });
});

describe("formatBlackoutWindow", () => {
  it("formats 12-hour windows", () => {
    expect(formatBlackoutWindow({ startHour: 0, endHour: 7 })).toBe("12:00 AM – 7:00 AM");
    expect(formatBlackoutWindow({ startHour: 11, endHour: 13 })).toBe("11:00 AM – 1:00 PM");
  });
});
