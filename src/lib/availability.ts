// ============================================================================
// Course availability — whether a given tee time falls inside an operator's
// blackout (a closed day, or a daily window they can't fill). Pure core so it's
// unit-testable; the ISO wrapper resolves local day/hour in America/Toronto.
// ============================================================================

import type { CourseAvailability } from "./data/types";
import { localDayOfWeek, localHour } from "./time";

/** Pure check by local day-of-week (0=Sun) and local hour (0-23). */
export function hourBlackedOut(
  av: CourseAvailability | null | undefined,
  day: number,
  hour: number,
): boolean {
  if (!av) return false;
  if (av.closedDays.includes(day)) return true;
  return av.blackout.some((w) => hour >= w.startHour && hour < w.endHour);
}

/** Whether the given tee time (ISO) is blacked out for this course. */
export function isBlackedOut(
  av: CourseAvailability | null | undefined,
  teeTimeISO: string,
): boolean {
  return hourBlackedOut(av, localDayOfWeek(teeTimeISO), localHour(teeTimeISO));
}

export function formatBlackoutWindow(w: { startHour: number; endHour: number }): string {
  const fmt = (h: number) => {
    const hh = ((h % 24) + 24) % 24;
    const period = hh < 12 ? "AM" : "PM";
    const disp = hh % 12 === 0 ? 12 : hh % 12;
    return `${disp}:00 ${period}`;
  };
  return `${fmt(w.startHour)} – ${fmt(w.endHour)}`;
}
