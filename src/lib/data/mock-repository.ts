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
  CourseAvailability,
  GolferAccount,
  Notification,
  PointsEntry,
  Slot,
  User,
} from "./types";
import type {
  AdminMetrics,
  BookingResult,
  CreateBookingInput,
  CreateCourseInput,
  CreateCourseResult,
  DealFilters,
  MatchmakingCandidate,
  OperatorStats,
  ReleaseSlotInput,
  Repository,
} from "./repository";
import { isBlackedOut } from "../availability";
import { bandForHour, localHour } from "../time";
import { buildSeed, type SeedData } from "./seed";
import { BOOKING_FEE_CENTS, freeCancellationDeadline, resolveCancellation } from "../policy";
import {
  applyCredit,
  effectiveTier,
  perksForTier,
  pointsForCheckin,
  TIER_LABEL,
} from "../loyalty";
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

/** Operator notifications are stored like golfer ones, keyed by `op:<courseId>`. */
export function operatorNotifId(courseId: string): string {
  return `op:${courseId}`;
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

  private pingOperator(courseId: string, title: Course["description"], body: Course["description"]) {
    this.s.notifications.unshift({
      id: `opn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      golferId: operatorNotifId(courseId),
      kind: "match",
      title,
      body,
      createdAtISO: new Date().toISOString(),
      read: false,
    });
  }

  async approveCourse(courseId: string): Promise<Course | null> {
    const course = this.s.courses.find((c) => c.id === courseId);
    if (!course) return null;
    course.approved = true;
    this.pingOperator(
      courseId,
      { en: "You're approved! 🎉", fr: "Vous êtes approuvé ! 🎉" },
      {
        en: "Your Business Corner is live. Start releasing your empty tee times.",
        fr: "Votre Espace affaires est actif. Publiez vos départs vides.",
      },
    );
    return { ...course };
  }

  async listPendingCourses(): Promise<Course[]> {
    return this.s.courses.filter((c) => !c.approved);
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

  async createCourseAccount(input: CreateCourseInput): Promise<CreateCourseResult> {
    const courseId = `c${Date.now()}`;
    const operatorId = `o${Date.now()}`;
    const initials = input.courseName
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
    const photos = [
      "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=1200&q=70",
      "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=1200&q=70",
      "https://images.unsplash.com/photo-1600861195091-690c92f1d2cc?w=1200&q=70",
    ];
    const course: Course = {
      id: courseId,
      name: input.courseName,
      slug: input.courseName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      region: input.region,
      city: input.city,
      description: {
        en: `${input.courseName} — newly onboarded on TEETOMIC.`,
        fr: `${input.courseName} — nouvellement intégré à TEETOMIC.`,
      },
      photoUrl: photos[this.s.courses.length % photos.length],
      logoLabel: initials || "GC",
      rackRateLow: 45,
      rackRateHigh: 95,
      rating: 4.5,
      holesAvailable: [9, 18],
      cartAvailable: true,
      lat: 45.5,
      lng: -73.6,
      approved: false, // awaits admin approval before it can list
    };
    this.s.courses.push(course);
    this.s.users.push({
      id: operatorId,
      name: input.contactName,
      email: input.email,
      password: input.pin,
      role: "operator",
      courseId,
    });
    this.s.availability.push({ courseId, closedDays: [], blackout: [] });
    // A new business starts with an empty tee sheet — they create their own
    // slots at their own price (see createSlot).
    return { courseId, course: { ...course }, operatorId };
  }

  /** Notify alert-holders whose criteria match a newly live slot. Returns count. */
  private notifyAlerts(slot: Slot): number {
    const course = this.s.courses.find((c) => c.id === slot.courseId);
    if (!course) return 0;
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
    return notified;
  }

  async createSlot(input: {
    courseId: string;
    teeTimeISO: string;
    holes: 9 | 18;
    pricePerPlayer: number;
    rackRate?: number;
    cart?: boolean;
    players?: number;
  }): Promise<{ slot: Slot; notified: number }> {
    const course = this.s.courses.find((c) => c.id === input.courseId);
    if (!course) throw new Error("course_not_found");
    // Concept rule: an empty slot must be listed at least 1h30 before tee time.
    const tee = new Date(input.teeTimeISO);
    if (tee.getTime() < Date.now() + 90 * 60 * 1000) {
      throw new Error("too_soon");
    }
    const teeHour = localHour(input.teeTimeISO);
    const rack =
      input.rackRate && input.rackRate > input.pricePerPlayer
        ? input.rackRate
        : Math.round(input.pricePerPlayer * 1.6);
    const players = input.players ?? 4;
    const slot: Slot = {
      id: `s-${input.courseId}-${Date.now()}`,
      courseId: input.courseId,
      teeTimeISO: input.teeTimeISO,
      holes: input.holes,
      cart: input.cart ?? course.cartAvailable,
      walking: true,
      players,
      spotsLeft: players,
      rackRate: rack,
      floorPrice: input.pricePerPlayer,
      currentPrice: input.pricePerPlayer, // the business sets their price
      status: "released",
      band: bandForHour(teeHour),
      weather: "sun",
      fillRate: 0.5,
    };
    this.s.slots.unshift(slot);
    const notified = this.notifyAlerts(slot);
    return { slot: { ...slot }, notified };
  }

  async updateCourse(
    courseId: string,
    patch: {
      name?: string;
      city?: string;
      rackRateLow?: number;
      rackRateHigh?: number;
      photoUrl?: string;
      description?: { en: string; fr: string };
    },
  ): Promise<Course | null> {
    const c = this.s.courses.find((x) => x.id === courseId);
    if (!c) return null;
    if (patch.name?.trim()) c.name = patch.name.trim();
    if (patch.city?.trim()) c.city = patch.city.trim();
    if (typeof patch.rackRateLow === "number") c.rackRateLow = patch.rackRateLow;
    if (typeof patch.rackRateHigh === "number") c.rackRateHigh = patch.rackRateHigh;
    if (patch.photoUrl?.trim()) c.photoUrl = patch.photoUrl.trim();
    if (patch.description) c.description = { ...patch.description };
    return { ...c };
  }

  async deleteCourse(courseId: string): Promise<boolean> {
    const before = this.s.courses.length;
    this.s.courses = this.s.courses.filter((c) => c.id !== courseId);
    if (this.s.courses.length === before) return false;
    this.s.slots = this.s.slots.filter((sl) => sl.courseId !== courseId);
    this.s.availability = this.s.availability.filter((a) => a.courseId !== courseId);
    this.s.users = this.s.users.filter((u) => u.courseId !== courseId);
    return true;
  }

  async getAvailability(courseId: string): Promise<CourseAvailability> {
    let av = this.s.availability.find((a) => a.courseId === courseId);
    if (!av) {
      av = { courseId, closedDays: [], blackout: [] };
      this.s.availability.push(av);
    }
    return { ...av, closedDays: [...av.closedDays], blackout: av.blackout.map((w) => ({ ...w })) };
  }

  async setAvailability(availability: CourseAvailability): Promise<CourseAvailability> {
    const idx = this.s.availability.findIndex((a) => a.courseId === availability.courseId);
    const clean: CourseAvailability = {
      courseId: availability.courseId,
      closedDays: [...new Set(availability.closedDays)].filter((d) => d >= 0 && d <= 6),
      blackout: availability.blackout
        .filter((w) => w.endHour > w.startHour)
        .map((w) => ({ startHour: w.startHour, endHour: w.endHour, label: w.label })),
    };
    if (idx >= 0) this.s.availability[idx] = clean;
    else this.s.availability.push(clean);
    return { ...clean };
  }

  async releaseSlot(input: ReleaseSlotInput): Promise<{ slot: Slot; notified: number }> {
    const slot = this.s.slots.find((sl) => sl.id === input.slotId);
    if (!slot) throw new Error("Slot not found");
    // Respect the operator's blackout hours — a blacked-out slot can't be listed.
    const av = this.s.availability.find((a) => a.courseId === slot.courseId);
    if (isBlackedOut(av, slot.teeTimeISO)) {
      throw new Error("blacked_out");
    }
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

  async createBooking(input: CreateBookingInput): Promise<BookingResult> {
    const slot = this.s.slots.find((sl) => sl.id === input.slotId);
    if (!slot) throw new Error("Slot not found");
    if (slot.spotsLeft <= 0) throw new Error("No spots left");

    const now = new Date();
    const teeTime = new Date(slot.teeTimeISO);

    // Loyalty: waive the fee for Gold+, then apply any TeeCredit to the rest.
    const account = this.accountFor(input.golferId);
    const tier = effectiveTier(account);
    const feeCents = perksForTier(tier).feeWaived ? 0 : BOOKING_FEE_CENTS;
    let creditAppliedCents = 0;
    let chargedCents = feeCents;
    if (input.applyCredit && feeCents > 0 && account.teeCreditCents > 0) {
      const r = applyCredit(feeCents, account.teeCreditCents);
      creditAppliedCents = r.appliedCents;
      chargedCents = r.chargeCents;
      account.teeCreditCents = r.remainingCreditCents;
    }

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
      depositCents: feeCents,
      depositStatus: "authorized",
      paymentIntentId: input.paymentIntentId,
      freeCancellationDeadlineISO: freeCancellationDeadline(now, teeTime).toISOString(),
    };
    this.s.bookings.unshift(booking);
    const pointsPreview = pointsForCheckin(BOOKING_FEE_CENTS);
    let refundOnRefill: BookingResult["refundOnRefill"];

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
      refundOnRefill = {
        bookingId: priorLateCancel.id,
        paymentIntentId: priorLateCancel.paymentIntentId,
      };
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
          en: `${course.name} re-booked your cancelled tee time, so your $10 booking fee was returned automatically.`,
          fr: `${course.name} a repris votre départ annulé, vos frais de 10 $ ont donc été remis automatiquement.`,
        },
        createdAtISO: new Date().toISOString(),
        read: false,
        slotId: slot.id,
      });
    }

    // Ping the business: a golfer just booked one of their slots.
    const teeLabel = new Date(slot.teeTimeISO).toLocaleTimeString("en-CA", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/Toronto",
    });
    this.pingOperator(
      slot.courseId,
      { en: "New booking 🎟️", fr: "Nouvelle réservation 🎟️" },
      {
        en: `${input.golferName} booked your ${teeLabel} slot (${input.players} player${input.players > 1 ? "s" : ""}).`,
        fr: `${input.golferName} a réservé votre départ de ${teeLabel} (${input.players} joueur${input.players > 1 ? "s" : ""}).`,
      },
    );

    this.s.funnel.completed++;
    return {
      booking: { ...booking },
      feeCents,
      creditAppliedCents,
      chargedCents,
      pointsPreview,
      refundOnRefill,
    };
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
    // Only an active (confirmed) booking can be cancelled. Guard against
    // double-cancel or cancelling after check-in, which would corrupt slot
    // inventory (re-opening the slot on every call).
    if (booking.status !== "confirmed") return { ...booking };
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
    // Idempotent: already checked in -> don't re-award points/credit.
    if (booking.status === "checked-in") return { ...booking };
    booking.status = "checked-in";
    // Check-in returns the $10 fee as TeeCredit (not a card refund) and earns points.
    booking.depositStatus = "credited";

    const account = this.accountFor(booking.golferId);
    account.teeCreditCents += BOOKING_FEE_CENTS;
    const points = pointsForCheckin(BOOKING_FEE_CENTS);
    account.lifetimePoints += points;
    const course = this.s.courses.find((c) => c.id === booking.courseId);
    this.s.pointsLedger.unshift({
      id: `pe-${Date.now()}`,
      golferId: booking.golferId,
      delta: points,
      reason: "checkin",
      label: {
        en: `Checked in — ${course?.name ?? "course"}`,
        fr: `Enregistré — ${course?.name ?? "club"}`,
      },
      bookingId: booking.id,
      createdAtISO: new Date().toISOString(),
    });

    // Ping the business: this booking has been fulfilled (golfer checked in).
    this.pingOperator(
      booking.courseId,
      { en: "Booking fulfilled ✓", fr: "Réservation honorée ✓" },
      {
        en: `${booking.golferName} checked in for their tee time. Deposit returned as TeeCredit.`,
        fr: `${booking.golferName} s'est enregistré pour son départ. Dépôt remis en TeeCredit.`,
      },
    );
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

  // --- loyalty --------------------------------------------------------------
  private accountFor(golferId: string): GolferAccount {
    let acct = this.s.accounts.find((a) => a.golferId === golferId);
    if (!acct) {
      acct = { golferId, lifetimePoints: 0, teeCreditCents: 0, subscription: "none" };
      this.s.accounts.push(acct);
    }
    return acct;
  }

  async getAccount(golferId: string): Promise<GolferAccount> {
    return { ...this.accountFor(golferId) };
  }

  async listPointsLedger(golferId: string): Promise<PointsEntry[]> {
    return this.s.pointsLedger
      .filter((p) => p.golferId === golferId)
      .sort((a, b) => (b.createdAtISO > a.createdAtISO ? 1 : -1));
  }

  async setSubscription(
    golferId: string,
    subscription: "none" | "plus",
  ): Promise<GolferAccount> {
    const acct = this.accountFor(golferId);
    acct.subscription = subscription;
    return { ...acct };
  }

  async setHandicap(golferId: string, handicap: number): Promise<GolferAccount> {
    const acct = this.accountFor(golferId);
    acct.handicap = handicap;
    return { ...acct };
  }

  async matchmaking(golferId: string): Promise<MatchmakingCandidate[]> {
    const me = this.accountFor(golferId);
    const myHc = me.handicap ?? 18;
    return this.s.accounts
      .filter((a) => a.golferId !== golferId && a.handicap != null)
      .map((a) => {
        const user = this.s.users.find((u) => u.id === a.golferId);
        return {
          golferId: a.golferId,
          name: user?.name ?? "Golfer",
          handicap: a.handicap!,
          tier: TIER_LABEL[effectiveTier(a)].en,
          gap: Math.abs((a.handicap ?? 18) - myHc),
        };
      })
      .sort((a, b) => a.gap - b.gap)
      .map(({ gap: _gap, ...rest }) => rest);
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
