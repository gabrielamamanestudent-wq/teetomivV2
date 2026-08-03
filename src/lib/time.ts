// ============================================================================
// Time helpers — everything golfer-facing is shown in America/Toronto local
// time regardless of the server / device timezone.
// ============================================================================

import type { TimeBand } from "./pricing-types";

export const TZ = "America/Toronto";

export function formatLocalTime(iso: string, locale: "en" | "fr" = "en"): string {
  return new Date(iso).toLocaleTimeString(locale === "fr" ? "fr-CA" : "en-CA", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: TZ,
  });
}

export function formatLocalDate(iso: string, locale: "en" | "fr" = "en"): string {
  return new Date(iso).toLocaleDateString(locale === "fr" ? "fr-CA" : "en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: TZ,
  });
}

export function formatLocalDateTime(iso: string, locale: "en" | "fr" = "en"): string {
  return `${formatLocalDate(iso, locale)}, ${formatLocalTime(iso, locale)}`;
}

/** Local hour (0-23) of an instant in America/Toronto. */
export function localHour(iso: string): number {
  const s = new Date(iso).toLocaleTimeString("en-CA", {
    hour: "2-digit",
    hour12: false,
    timeZone: TZ,
  });
  return parseInt(s, 10) % 24;
}

/** Local day of week (0=Sun) in America/Toronto. */
export function localDayOfWeek(iso: string): number {
  const s = new Date(iso).toLocaleDateString("en-CA", {
    weekday: "short",
    timeZone: TZ,
  });
  const map: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  return map[s] ?? new Date(iso).getUTCDay();
}

export function bandForHour(hour: number): TimeBand {
  if (hour < 8) return "dawn";
  if (hour < 11) return "morning";
  if (hour < 15) return "midday";
  return "twilight";
}

export function hoursUntil(iso: string, now: Date = new Date()): number {
  return (new Date(iso).getTime() - now.getTime()) / (1000 * 60 * 60);
}

/** Compact countdown like "2h 14m" or "48m" or "Expired". */
export function countdown(iso: string, now: Date = new Date()): string {
  const ms = new Date(iso).getTime() - now.getTime();
  if (ms <= 0) return "—";
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h >= 24) {
    const d = Math.floor(h / 24);
    return `${d}d ${h % 24}h`;
  }
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function formatCAD(amount: number): string {
  return `$${amount.toFixed(0)}`;
}

export function formatCADCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
