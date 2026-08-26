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

// Admin email + password (entered on the /admin gate) are sent as x-admin-email
// / x-admin-token headers on admin requests. Persisted per-browser.
let adminToken = "";
let adminEmail = "";
export function setAdminAuth(email: string, token: string) {
  adminEmail = email;
  adminToken = token;
  try {
    if (token) {
      window.localStorage.setItem("ttm.adminToken", token);
      window.localStorage.setItem("ttm.adminEmail", email);
    } else {
      window.localStorage.removeItem("ttm.adminToken");
      window.localStorage.removeItem("ttm.adminEmail");
    }
  } catch {
    /* ignore */
  }
}
function loadAdmin() {
  if (adminToken) return;
  try {
    adminToken = window.localStorage.getItem("ttm.adminToken") || "";
    adminEmail = window.localStorage.getItem("ttm.adminEmail") || "";
  } catch {
    /* ignore */
  }
}
function adminHeaders(): Record<string, string> {
  loadAdmin();
  const h: Record<string, string> = {};
  if (adminToken) h["x-admin-token"] = adminToken;
  if (adminEmail) h["x-admin-email"] = adminEmail;
  return h;
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
  createSlot: (payload: {
    courseId: string;
    teeTimeISO: string;
    holes: 9 | 18;
    pricePerPlayer: number;
    rackRate?: number;
    cart?: boolean;
    players?: number;
  }) =>
    fetch(`/api/operator/slot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(json<{ slot: Slot; notified: number }>),
  updateCourse: (payload: {
    courseId: string;
    name?: string;
    city?: string;
    rackRateLow?: number;
    rackRateHigh?: number;
    description?: { en: string; fr: string };
  }) =>
    fetch(`/api/operator/course`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(json<{ course: Course }>),
  uploadCourseImage: (courseId: string, dataUrl: string) =>
    fetch(`/api/operator/image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, dataUrl }),
    }).then(json<{ course: Course }>),
  operatorLogin: (email: string, password: string) =>
    fetch(`/api/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }).then(json<{ user: { id: string; role: string; courseId?: string } }>),
  adminMetrics: () =>
    fetch(`/api/admin`, { cache: "no-store", headers: adminHeaders() }).then(
      json<{ metrics: AdminMetrics; pending: Course[] }>,
    ),
  resetDemo: () =>
    fetch(`/api/admin`, { method: "POST", headers: adminHeaders() }).then(json<{ ok: boolean }>),
  approveCourse: (courseId: string) =>
    fetch(`/api/operator/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...adminHeaders() },
      body: JSON.stringify({ courseId }),
    }).then(json<{ course: Course }>),
  account: (golferId: string) =>
    fetch(`/api/account?golferId=${golferId}`, { cache: "no-store" }).then(json<AccountResponse>),
  accountAction: (payload: {
    golferId: string;
    action: "subscribe" | "unsubscribe" | "handicap";
    handicap?: number;
    golferEmail?: string;
  }) =>
    fetch(`/api/account`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(json<{ account?: GolferAccount; checkoutUrl?: string }>),
  finalizeSubscription: (sessionId: string) =>
    fetch(`/api/account/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    }).then(json<{ account: GolferAccount }>),
};
