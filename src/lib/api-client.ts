// Thin typed fetch wrapper for the client components.

import type { Alert, Booking, Course, Notification, Slot } from "./data/types";
import type { AdminMetrics, OperatorStats } from "./data/repository";

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
  }) =>
    fetch(`/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(json<{ booking: Booking; mockPayment: boolean }>),
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
  adminMetrics: () =>
    fetch(`/api/admin`, { cache: "no-store" }).then(json<{ metrics: AdminMetrics }>),
  resetDemo: () => fetch(`/api/admin`, { method: "POST" }).then(json<{ ok: boolean }>),
};
