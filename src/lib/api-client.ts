// Thin typed fetch wrapper for the client components.

import type {
  Alert,
  Booking,
  Course,
  CourseAvailability,
  GolferAccount,
  Notification,
  PointsEntry,
  Region,
  Slot,
  Tier,
} from "./data/types";
import type {
  AdminMetrics,
  CreateCourseResult,
  MatchmakingCandidate,
  OperatorStats,
} from "./data/repository";
import type { TierPerks } from "./loyalty";

export interface AccountResponse {
  account: GolferAccount;
  ledger: PointsEntry[];
  tier: Tier;
  earnedTier: Tier;
  perks: TierPerks;
  next: { next: Tier | null; remaining: number };
  matchmaking: MatchmakingCandidate[];
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  deals: (qs: string) =>
    fetch(`/api/deals?${qs}`, { cache: "no-store" }).then(
      json<{ deals: Slot[]; courses: Course[] }>,
    ),
  recentDeals: (limit = 8) =>
    fetch(`/api/deals?recent=${limit}`, { cache: "no-store" }).then(
      json<{ deals: Slot[]; courses: Course[] }>,
    ),
  courses: () =>
    fetch(`/api/courses`, { cache: "no-store" }).then(json<{ courses: Course[] }>),
  slot: (id: string) =>
    fetch(`/api/slots/${id}`, { cache: "no-store" }).then(
      json<{ slot: Slot; course: Course }>,
    ),
  createBooking: (payload: {
    slotId: string;
    players: number;
    golferId: string;
    golferName: string;
    golferEmail: string;
    applyCredit?: boolean;
  }) =>
    fetch(`/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(
      json<{
        // Instant path returns the booking; the real-Stripe path returns a
        // checkoutUrl to redirect to.
        booking?: Booking;
        checkoutUrl?: string;
        mockPayment?: boolean;
        feeCents?: number;
        creditAppliedCents?: number;
        chargedCents?: number;
        pointsPreview?: number;
      }>,
    ),
  finalizeBooking: (sessionId: string) =>
    fetch(`/api/bookings/finalize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    }).then(json<{ booking: Booking }>),
  bookingByRef: (ref: string) =>
    fetch(`/api/booking/${ref}`, { cache: "no-store" }).then(
      json<{ booking: Booking; course: Course }>,
    ),
  bookings: (golferId: string) =>
    fetch(`/api/bookings?golferId=${golferId}`, { cache: "no-store" }).then(
      json<{ bookings: Booking[]; courses: Course[] }>,
    ),
  bookingAction: (id: string, action: "cancel" | "checkin") =>
    fetch(`/api/bookings/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    }).then(json<{ booking: Booking }>),
  alerts: (golferId: string) =>
    fetch(`/api/alerts?golferId=${golferId}`, { cache: "no-store" }).then(
      json<{ alerts: Alert[] }>,
    ),
  createAlert: (payload: Omit<Alert, "id" | "createdAtISO">) =>
    fetch(`/api/alerts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(json<{ alert: Alert }>),
  toggleAlert: (id: string) =>
    fetch(`/api/alerts/${id}`, { method: "POST" }).then(json<{ alert: Alert }>),
  deleteAlert: (id: string) =>
    fetch(`/api/alerts/${id}`, { method: "DELETE" }).then(json<{ ok: boolean }>),
  notifications: (golferId: string) =>
    fetch(`/api/notifications?golferId=${golferId}`, { cache: "no-store" }).then(
      json<{ notifications: Notification[] }>,
    ),
  markRead: (golferId: string) =>
    fetch(`/api/notifications?golferId=${golferId}`, { method: "POST" }).then(
      json<{ ok: boolean }>,
    ),
  operatorSlots: (courseId: string) =>
    fetch(`/api/operator?courseId=${courseId}&view=slots`, { cache: "no-store" }).then(
      json<{ slots: Slot[]; course: Course }>,
    ),
  operatorCheckins: (courseId: string) =>
    fetch(`/api/operator?courseId=${courseId}&view=checkins`, { cache: "no-store" }).then(
      json<{ checkins: Booking[] }>,
    ),
  operatorStats: (courseId: string) =>
    fetch(`/api/operator?courseId=${courseId}&view=stats`, { cache: "no-store" }).then(
      json<{ stats: OperatorStats }>,
    ),
  releaseSlot: (payload: { slotId: string; floorPrice: number; livePrice: number }) =>
    fetch(`/api/operator/release`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(json<{ slot: Slot; notified: number }>),
  operatorAvailability: (courseId: string) =>
    fetch(`/api/operator/availability?courseId=${courseId}`, { cache: "no-store" }).then(
      json<{ availability: CourseAvailability }>,
    ),
  setAvailability: (availability: CourseAvailability) =>
    fetch(`/api/operator/availability`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(availability),
    }).then(json<{ availability: CourseAvailability }>),
  operatorSignup: (payload: {
    courseName: string;
    city: string;
    region: Region;
    contactName: string;
    email: string;
    pin: string;
  }) =>
    fetch(`/api/operator/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(json<CreateCourseResult>),
  adminMetrics: () =>
    fetch(`/api/admin`, { cache: "no-store" }).then(json<{ metrics: AdminMetrics }>),
  resetDemo: () => fetch(`/api/admin`, { method: "POST" }).then(json<{ ok: boolean }>),
  account: (golferId: string) =>
    fetch(`/api/account?golferId=${golferId}`, { cache: "no-store" }).then(json<AccountResponse>),
  accountAction: (payload: {
    golferId: string;
    action: "subscribe" | "unsubscribe" | "handicap";
    handicap?: number;
  }) =>
    fetch(`/api/account`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(json<{ account: GolferAccount }>),
};
