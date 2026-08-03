// ============================================================================
// In-memory mock repository. Zero external dependencies — the whole app runs
// on this when no Supabase credentials are present. State lives on globalThis
// so it survives Next.js HMR and is shared across route handlers in a single
// dev process.
// ============================================================================

import type {
  Alert,
  Booking,
  Course,
  Notification,
  Slot,
  User,
} from "./types";
import type {
  AdminMetrics,
  CreateBookingInput,
  DealFilters,
  OperatorStats,
  ReleaseSlotInput,
  Repository,
} from "./repository";
import { buildSeed, type SeedData } from "./seed";
import { DEPOSIT_CENTS, freeCancellationDeadline, resolveCancellation } from "../policy";
import { localDayOfWeek } from "../time";

interface Store extends SeedData {
  funnel: { views: number; starts: number; completed: number };
}

declare global {
  // eslint-disable-next-line no-var
  var __teetomicStore: Store | undefined;
}

function freshStore(): Store {
  const seed = buildSeed(new Date());
  return {
    ...seed,
    funnel: { views: 1840, starts: 512, completed: 337 },
  };
}

function getStore(): Store {
  if (!globalThis.__teetomicStore) {
    globalThis.__teetomicStore = freshStore();
  }
  return globalThis.__teetomicStore;
}

function genReference(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 4; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `TTM-${out}`;
}

function slotMatchesAlert(slot: Slot, course: Course, alert: Alert): boolean {
  if (!alert.active) return false;
  if (slot.currentPrice > alert.maxPrice) return false;
  if (alert.regions.length && !alert.regions.includes(course.region)) return false;
  if (alert.bands.length && !alert.bands.includes(slot.band)) return false;
  if (alert.days.length) {
    const dow = localDayOfWeek(slot.teeTimeISO);
    if (!alert.days.includes(dow)) return false;
  }
  return true;
}

export class MockRepository implements Repository {
  private get s(): Store {
    return getStore();
  }

  async listCourses(): Promise<Course[]> {
    return [...this.s.courses];
  }

  async getCourse(id: string): Promise<Course | null> {
    return this.s.courses.find((c) => c.id === id) ?? null;
  }

  async listDeals(filters: DealFilters = {}): Promise<Slot[]> {
    const now = Date.now();
    let deals = this.s.slots.filter(
      (sl) =>
        sl.status === "released" &&
        new Date(sl.teeTimeISO).getTime() > now &&
        sl.spotsLeft > 0,
    );

    if (filters.regions?.length) {
      const byRegion = new Set(
        this.s.courses
          .filter((c) => filters.regions!.includes(c.region))
          .map((c) => c.id),
      );
      deals = deals.filter((sl) => byRegion.has(sl.courseId));
    }
    if (filters.bands?.length) {
      deals = deals.filter((sl) => filters.bands!.includes(sl.band));
    }
    if (typeof filters.maxPrice === "number") {
      deals = deals.filter((sl) => sl.currentPrice <= filters.maxPrice!);
    }
    if (filters.holes) {
      deals = deals.filter((sl) => sl.holes === filters.holes);
    }
    if (filters.cart) {
      deals = deals.filter((sl) => sl.cart);
    }
    if (filters.date) {
      deals = deals.filter((sl) => {
        const d = new Date(sl.teeTimeISO).toLocaleDateString("en-CA", {
          timeZone: "America/Toronto",
        });
        return d === filters.date;
      });
    }

    return deals.sort(
      (a, b) => new Date(a.teeTimeISO).getTime() - new Date(b.teeTimeISO).getTime(),
    );
  }

  async getSlot(id: string): Promise<Slot | null> {
    return this.s.slots.find((sl) => sl.id === id) ?? null;
  }

  async recentDeals(limit: number): Promise<Slot[]> {
    const now = Date.now();
    return this.s.slots
      .filter(
        (sl) => sl.status === "released" && new Date(sl.teeTimeISO).getTime() > now,
      )
      .sort((a, b) => b.rackRate - b.currentPrice - (a.rackRate - a.currentPrice))
      .slice(0, limit);
  }

  async courseSlots(courseId: string): Promise<Slot[]> {
    return this.s.slots
      .filter((sl) => sl.courseId === courseId)
      .sort(
        (a, b) => new Date(a.teeTimeISO).getTime() - new Date(b.teeTimeISO).getTime(),
      );
  }

  async releaseSlot(input: ReleaseSlotInput): Promise<{ slot: Slot; notified: number }> {
    const slot = this.s.slots.find((sl) => sl.id === input.slotId);
    if (!slot) throw new Error("Slot not found");
    slot.status = "released";
    slot.floorPrice = input.floorPrice;
    slot.currentPrice = Math.max(input.livePrice, input.floorPrice);

    const course = this.s.courses.find((c) => c.id === slot.courseId)!;
    // Notify matching alert-holders.
    let notified = 0;
    for (const alert of this.s.alerts) {
      if (slotMatchesAlert(slot, course, alert)) {
        notified++;
        this.s.notifications.unshift({
          id: `n${Date.now()}-${notified}`,
          golferId: alert.golferId,
          kind: "match",
          title: {
            en: `New match: ${course.name}`,
            fr: `Nouvelle correspondance : ${course.name}`,
          },
          body: {
            en: `A slot matching '${alert.label}' just went live for $${slot.currentPrice} (was $${slot.rackRate}).`,
            fr: `Un départ correspondant à « ${alert.label} » vient d'être publié à ${slot.currentPrice} $ (avant ${slot.rackRate} $).`,
          },
          createdAtISO: new Date().toISOString(),
          read: false,
          slotId: slot.id,
        });
      }
    }
    return { slot: { ...slot }, notified };
  }

  async createBooking(input: CreateBookingInput): Promise<Booking> {
    const slot = this.s.slots.find((sl) => sl.id === input.slotId);
    if (!slot) throw new Error("Slot not found");
    if (slot.spotsLeft <= 0) throw new Error("No spots left");

    const now = new Date();
    const teeTime = new Date(slot.teeTimeISO);
    const booking: Booking = {
      id: `b${Date.now()}`,
      reference: genReference(),
      slotId: slot.id,
      courseId: slot.courseId,
      golferId: input.golferId,
      golferName: input.golferName,
      golferEmail: input.golferEmail,
      players: input.players,
      pricePerPlayer: slot.currentPrice,
      createdAtISO: now.toISOString(),
      teeTimeISO: slot.teeTimeISO,
      status: "confirmed",
      depositCents: DEPOSIT_CENTS,
      depositStatus: "authorized",
      paymentIntentId: input.paymentIntentId,
      freeCancellationDeadlineISO: freeCancellationDeadline(now, teeTime).toISOString(),
    };
    this.s.bookings.unshift(booking);

    // Update slot inventory.
    slot.spotsLeft = Math.max(0, slot.spotsLeft - 1);
    if (slot.spotsLeft === 0) slot.status = "booked";

    // Refund-on-refill: if there was a late-cancelled booking on this slot whose
    // deposit was forfeited, refund it now that the slot re-booked.
    const priorLateCancel = this.s.bookings.find(
      (b) =>
        b.slotId === slot.id &&
        b.status === "cancelled" &&
        b.depositStatus === "forfeited" &&
        new Date(b.teeTimeISO).getTime() > now.getTime(),
    );
    if (priorLateCancel) {
      priorLateCancel.depositStatus = "refunded-on-refill";
      const course = this.s.courses.find((c) => c.id === slot.courseId)!;
      this.s.notifications.unshift({
        id: `n${Date.now()}-refill`,
        golferId: priorLateCancel.golferId,
        kind: "refill-refund",
        title: {
          en: "Your slot was re-filled — deposit refunded",
          fr: "Votre place a été reprise — dépôt remboursé",
        },
        body: {
          en: `${course.name} re-booked your cancelled tee time, so your $15 deposit was refunded automatically.`,
          fr: `${course.name} a repris votre départ annulé, votre dépôt de 15 $ a donc été remboursé automatiquement.`,
        },
        createdAtISO: new Date().toISOString(),
        read: false,
        slotId: slot.id,
      });
    }

    this.s.funnel.completed++;
    return { ...booking };
  }

  async getBookingByReference(reference: string): Promise<Booking | null> {
    return (
      this.s.bookings.find((b) => b.reference.toUpperCase() === reference.toUpperCase()) ??
      null
    );
  }

  async listBookings(golferId: string): Promise<Booking[]> {
    return this.s.bookings
      .filter((b) => b.golferId === golferId)
      .sort(
        (a, b) => new Date(b.teeTimeISO).getTime() - new Date(a.teeTimeISO).getTime(),
      );
  }

  async cancelBooking(bookingId: string): Promise<Booking> {
    const booking = this.s.bookings.find((b) => b.id === bookingId);
    if (!booking) throw new Error("Booking not found");
    const now = new Date();
    const outcome = resolveCancellation({
      now,
      bookedAt: new Date(booking.createdAtISO),
      teeTime: new Date(booking.teeTimeISO),
      slotRefilled: false,
    });
    booking.status = "cancelled";
    booking.depositStatus = outcome === "free-refund" ? "refunded" : "forfeited";

    // Re-open the slot so it can be refilled (which would trigger the refund).
    const slot = this.s.slots.find((sl) => sl.id === booking.slotId);
    if (slot && new Date(slot.teeTimeISO).getTime() > now.getTime()) {
      slot.spotsLeft += 1;
      if (slot.status === "booked") slot.status = "released";
    }
    return { ...booking };
  }

  async checkInBooking(bookingId: string): Promise<Booking> {
    const booking = this.s.bookings.find((b) => b.id === bookingId);
    if (!booking) throw new Error("Booking not found");
    booking.status = "checked-in";
    booking.depositStatus = "refunded"; // check-in triggers automatic refund
    return { ...booking };
  }

  async courseCheckins(courseId: string): Promise<Booking[]> {
    const now = Date.now();
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date();
    dayEnd.setHours(23, 59, 59, 999);
    return this.s.bookings
      .filter(
        (b) =>
          b.courseId === courseId &&
          (b.status === "confirmed" || b.status === "checked-in") &&
          new Date(b.teeTimeISO).getTime() >= dayStart.getTime() &&
          new Date(b.teeTimeISO).getTime() <= dayEnd.getTime() + 48 * 3600000,
      )
      .sort(
        (a, b) => new Date(a.teeTimeISO).getTime() - new Date(b.teeTimeISO).getTime(),
      );
  }

  async listAlerts(golferId: string): Promise<Alert[]> {
    return this.s.alerts
      .filter((a) => a.golferId === golferId)
      .sort((a, b) => (b.createdAtISO > a.createdAtISO ? 1 : -1));
  }

  async createAlert(alert: Omit<Alert, "id" | "createdAtISO">): Promise<Alert> {
    const created: Alert = {
      ...alert,
      id: `al${Date.now()}`,
      createdAtISO: new Date().toISOString(),
    };
    this.s.alerts.unshift(created);
    return { ...created };
  }

  async toggleAlert(alertId: string): Promise<Alert> {
    const alert = this.s.alerts.find((a) => a.id === alertId);
    if (!alert) throw new Error("Alert not found");
    alert.active = !alert.active;
    return { ...alert };
  }

  async deleteAlert(alertId: string): Promise<void> {
    this.s.alerts = this.s.alerts.filter((a) => a.id !== alertId);
  }

  async listNotifications(golferId: string): Promise<Notification[]> {
    return this.s.notifications
      .filter((n) => n.golferId === golferId)
      .sort((a, b) => (b.createdAtISO > a.createdAtISO ? 1 : -1));
  }

  async markNotificationsRead(golferId: string): Promise<void> {
    for (const n of this.s.notifications) {
      if (n.golferId === golferId) n.read = true;
    }
  }

  async listUsers(): Promise<User[]> {
    return [...this.s.users];
  }

  async authenticate(email: string, password: string): Promise<User | null> {
    return (
      this.s.users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
      ) ?? null
    );
  }

  async adminMetrics(): Promise<AdminMetrics> {
    const paid = this.s.bookings.filter((b) => b.status !== "cancelled");
    const gmvCents = paid.reduce(
      (sum, b) => sum + b.pricePerPlayer * b.players * 100,
      0,
    );
    const deposits: Record<string, number> = {};
    for (const b of this.s.bookings) {
      deposits[b.depositStatus] = (deposits[b.depositStatus] ?? 0) + 1;
    }
    return {
      gmvCents,
      bookings: this.s.bookings.length,
      activeAlerts: this.s.alerts.filter((a) => a.active).length,
      courses: this.s.courses.length,
      funnel: { ...this.s.funnel },
      deposits,
    };
  }

  async operatorStats(courseId: string): Promise<OperatorStats> {
    const courseBookings = this.s.bookings.filter((b) => b.courseId === courseId);
    const active = courseBookings.filter((b) => b.status !== "cancelled");
    const grossBookingsCents = active.reduce(
      (sum, b) => sum + b.pricePerPlayer * b.players * 100,
      0,
    );
    const bookingsThisMonth = active.length;
    const teetomicFeeCents = 199_00 + bookingsThisMonth * 1_00;
    // Recovered = green fees on released/booked slots that would have gone empty.
    const recoveredCents = active.reduce(
      (sum, b) => sum + b.pricePerPlayer * b.players * 100,
      0,
    ) + 1240_00;
    const noShows = courseBookings.filter((b) => b.status === "no-show").length;
    const noShowRate = courseBookings.length
      ? noShows / courseBookings.length
      : 0.02;
    const forfeitShareCents = courseBookings
      .filter((b) => b.depositStatus === "forfeited")
      .reduce((sum, b) => sum + Math.floor(b.depositCents / 2), 0);
    return {
      grossBookingsCents,
      teetomicFeeCents,
      recoveredCents,
      noShowRate: noShowRate || 0.02,
      forfeitShareCents,
      bookingsThisMonth,
    };
  }

  async reset(): Promise<void> {
    globalThis.__teetomicStore = freshStore();
  }
}
