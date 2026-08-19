// ============================================================================
// Supabase-backed repository. Satisfies the exact same Repository interface as
// the in-memory mock, so every route/component keeps working unchanged — the
// only difference is that data now PERSISTS in Postgres (accounts, courses,
// slots, bookings, points, alerts all survive restarts and serverless cold
// starts). Selected in getRepository() when Supabase credentials are present.
//
// The business logic here mirrors mock-repository.ts (the unit-tested reference)
// method for method; the storage is the only thing that differs.
// ============================================================================

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
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
import { bandForHour, localHour, localDayOfWeek } from "../time";
import { BOOKING_FEE_CENTS, freeCancellationDeadline, resolveCancellation } from "../policy";
import { applyCredit, effectiveTier, perksForTier, pointsForCheckin, TIER_LABEL } from "../loyalty";
import { buildSeed } from "./seed";

// ---- helpers ---------------------------------------------------------------

function genReference(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 4; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `TTM-${out}`;
}

export function operatorNotifId(courseId: string): string {
  return `op:${courseId}`;
}

// Supabase returns loosely-typed rows; a local alias keeps the mappers readable.
type Row = Record<string, any>; // eslint-disable-line

function rowToCourse(r: Row): Course {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    region: r.region,
    city: r.city,
    description: { en: r.description_en, fr: r.description_fr },
    photoUrl: r.photo_url,
    logoLabel: r.logo_label,
    rackRateLow: Number(r.rack_rate_low),
    rackRateHigh: Number(r.rack_rate_high),
    rating: Number(r.rating),
    holesAvailable: r.holes_available,
    cartAvailable: r.cart_available,
    lat: Number(r.lat),
    lng: Number(r.lng),
    approved: r.approved,
  };
}

function courseToRow(c: Course): Record<string, unknown> {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    region: c.region,
    city: c.city,
    description_en: c.description.en,
    description_fr: c.description.fr,
    photo_url: c.photoUrl,
    logo_label: c.logoLabel,
    rack_rate_low: c.rackRateLow,
    rack_rate_high: c.rackRateHigh,
    rating: c.rating,
    holes_available: c.holesAvailable,
    cart_available: c.cartAvailable,
    lat: c.lat,
    lng: c.lng,
    approved: c.approved,
  };
}

function rowToSlot(r: Row): Slot {
  return {
    id: r.id,
    courseId: r.course_id,
    teeTimeISO: new Date(r.tee_time_iso).toISOString(),
    holes: r.holes,
    cart: r.cart,
    walking: r.walking,
    players: r.players,
    spotsLeft: r.spots_left,
    rackRate: Number(r.rack_rate),
    floorPrice: Number(r.floor_price),
    currentPrice: Number(r.current_price),
    status: r.status,
    band: r.band,
    weather: r.weather,
    fillRate: Number(r.fill_rate),
  };
}

function slotToRow(s: Slot): Record<string, unknown> {
  return {
    id: s.id,
    course_id: s.courseId,
    tee_time_iso: s.teeTimeISO,
    holes: s.holes,
    cart: s.cart,
    walking: s.walking,
    players: s.players,
    spots_left: s.spotsLeft,
    rack_rate: s.rackRate,
    floor_price: s.floorPrice,
    current_price: s.currentPrice,
    status: s.status,
    band: s.band,
    weather: s.weather,
    fill_rate: s.fillRate,
  };
}

function rowToBooking(r: Row): Booking {
  return {
    id: r.id,
    reference: r.reference,
    slotId: r.slot_id,
    courseId: r.course_id,
    golferId: r.golfer_id,
    golferName: r.golfer_name,
    golferEmail: r.golfer_email,
    players: r.players,
    pricePerPlayer: Number(r.price_per_player),
    createdAtISO: new Date(r.created_at_iso).toISOString(),
    teeTimeISO: new Date(r.tee_time_iso).toISOString(),
    status: r.status,
    depositCents: r.deposit_cents,
    depositStatus: r.deposit_status,
    paymentIntentId: r.payment_intent_id,
    freeCancellationDeadlineISO: new Date(r.free_cancellation_deadline_iso).toISOString(),
  };
}

function bookingToRow(b: Booking): Record<string, unknown> {
  return {
    id: b.id,
    reference: b.reference,
    slot_id: b.slotId,
    course_id: b.courseId,
    golfer_id: b.golferId,
    golfer_name: b.golferName,
    golfer_email: b.golferEmail,
    players: b.players,
    price_per_player: b.pricePerPlayer,
    created_at_iso: b.createdAtISO,
    tee_time_iso: b.teeTimeISO,
    status: b.status,
    deposit_cents: b.depositCents,
    deposit_status: b.depositStatus,
    payment_intent_id: b.paymentIntentId,
    free_cancellation_deadline_iso: b.freeCancellationDeadlineISO,
  };
}

function rowToAccount(r: Row): GolferAccount {
  return {
    golferId: r.golfer_id,
    lifetimePoints: r.lifetime_points,
    teeCreditCents: r.tee_credit_cents,
    subscription: r.subscription,
    handicap: r.handicap == null ? undefined : Number(r.handicap),
  };
}

function rowToPointsEntry(r: Row): PointsEntry {
  return {
    id: r.id,
    golferId: r.golfer_id,
    delta: r.delta,
    reason: r.reason,
    label: { en: r.label_en, fr: r.label_fr },
    bookingId: r.booking_id ?? undefined,
    createdAtISO: new Date(r.created_at_iso).toISOString(),
  };
}

function rowToAlert(r: Row): Alert {
  return {
    id: r.id,
    golferId: r.golfer_id,
    label: r.label,
    regions: r.regions,
    bands: r.bands,
    days: r.days,
    maxPrice: Number(r.max_price),
    active: r.active,
    createdAtISO: new Date(r.created_at_iso).toISOString(),
  };
}

function rowToNotification(r: Row): Notification {
  return {
    id: r.id,
    golferId: r.golfer_id,
    title: { en: r.title_en, fr: r.title_fr },
    body: { en: r.body_en, fr: r.body_fr },
    createdAtISO: new Date(r.created_at_iso).toISOString(),
    read: r.read,
    slotId: r.slot_id ?? undefined,
    kind: r.kind,
  };
}

function rowToUser(r: Row): User {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    password: r.password,
    role: r.role,
    courseId: r.course_id ?? undefined,
  };
}

function rowToAvailability(r: Row): CourseAvailability {
  return {
    courseId: r.course_id,
    closedDays: r.closed_days ?? [],
    blackout: r.blackout ?? [],
  };
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

export class SupabaseRepository implements Repository {
  private client: SupabaseClient;

  constructor(url: string, serviceKey: string) {
    this.client = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  private get db() {
    return this.client;
  }

  // ---- notifications helpers ----------------------------------------------
  private async pushNotification(n: Omit<Notification, "createdAtISO"> & { createdAtISO?: string }) {
    await this.db.from("notifications").insert({
      id: n.id,
      golfer_id: n.golferId,
      title_en: n.title.en,
      title_fr: n.title.fr,
      body_en: n.body.en,
      body_fr: n.body.fr,
      created_at_iso: n.createdAtISO ?? new Date().toISOString(),
      read: n.read,
      slot_id: n.slotId ?? null,
      kind: n.kind,
    });
  }

  private async pingOperator(courseId: string, title: Course["description"], body: Course["description"]) {
    await this.pushNotification({
      id: `opn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      golferId: operatorNotifId(courseId),
      kind: "match",
      title,
      body,
      read: false,
    });
  }

  private async notifyAlerts(slot: Slot, course: Course): Promise<number> {
    const { data } = await this.db.from("alerts").select("*");
    const alerts = (data ?? []).map(rowToAlert);
    let notified = 0;
    for (const alert of alerts) {
      if (slotMatchesAlert(slot, course, alert)) {
        notified++;
        await this.pushNotification({
          id: `n${Date.now()}-${notified}-${Math.random().toString(36).slice(2, 5)}`,
          golferId: alert.golferId,
          kind: "match",
          title: { en: `New match: ${course.name}`, fr: `Nouvelle correspondance : ${course.name}` },
          body: {
            en: `A slot matching '${alert.label}' just went live for $${slot.currentPrice} (was $${slot.rackRate}).`,
            fr: `Un départ correspondant à « ${alert.label} » vient d'être publié à ${slot.currentPrice} $ (avant ${slot.rackRate} $).`,
          },
          read: false,
          slotId: slot.id,
        });
      }
    }
    return notified;
  }

  // ---- courses & slots -----------------------------------------------------
  async listCourses(): Promise<Course[]> {
    const { data } = await this.db.from("courses").select("*");
    return (data ?? []).map(rowToCourse);
  }

  async getCourse(id: string): Promise<Course | null> {
    const { data } = await this.db.from("courses").select("*").eq("id", id).maybeSingle();
    return data ? rowToCourse(data) : null;
  }

  async listDeals(filters: DealFilters = {}): Promise<Slot[]> {
    let query = this.db
      .from("slots")
      .select("*")
      .eq("status", "released")
      .gt("tee_time_iso", new Date().toISOString())
      .gt("spots_left", 0);

    if (filters.bands?.length) query = query.in("band", filters.bands);
    if (typeof filters.maxPrice === "number") query = query.lte("current_price", filters.maxPrice);
    if (filters.holes) query = query.eq("holes", filters.holes);
    if (filters.cart) query = query.eq("cart", true);

    if (filters.regions?.length) {
      const { data: cs } = await this.db.from("courses").select("id").in("region", filters.regions);
      const ids = (cs ?? []).map((c: Row) => c.id);
      query = query.in("course_id", ids.length ? ids : ["__none__"]);
    }

    const { data } = await query;
    let deals = (data ?? []).map(rowToSlot);

    if (filters.date) {
      deals = deals.filter((sl) => {
        const d = new Date(sl.teeTimeISO).toLocaleDateString("en-CA", { timeZone: "America/Toronto" });
        return d === filters.date;
      });
    }
    return deals.sort((a, b) => new Date(a.teeTimeISO).getTime() - new Date(b.teeTimeISO).getTime());
  }

  async getSlot(id: string): Promise<Slot | null> {
    const { data } = await this.db.from("slots").select("*").eq("id", id).maybeSingle();
    return data ? rowToSlot(data) : null;
  }

  async recentDeals(limit: number): Promise<Slot[]> {
    const { data } = await this.db
      .from("slots")
      .select("*")
      .eq("status", "released")
      .gt("tee_time_iso", new Date().toISOString());
    return (data ?? [])
      .map(rowToSlot)
      .sort((a, b) => b.rackRate - b.currentPrice - (a.rackRate - a.currentPrice))
      .slice(0, limit);
  }

  async courseSlots(courseId: string): Promise<Slot[]> {
    const { data } = await this.db
      .from("slots")
      .select("*")
      .eq("course_id", courseId)
      .order("tee_time_iso", { ascending: true });
    return (data ?? []).map(rowToSlot);
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
    const { count } = await this.db.from("courses").select("*", { count: "exact", head: true });
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
      photoUrl: photos[(count ?? 0) % photos.length],
      logoLabel: initials || "GC",
      rackRateLow: 45,
      rackRateHigh: 95,
      rating: 4.5,
      holesAvailable: [9, 18],
      cartAvailable: true,
      lat: 45.5,
      lng: -73.6,
      approved: false,
    };
    await this.db.from("courses").insert(courseToRow(course));
    await this.db.from("users").insert({
      id: operatorId,
      name: input.contactName,
      email: input.email,
      password: input.pin,
      role: "operator",
      course_id: courseId,
    });
    await this.db.from("course_availability").insert({ course_id: courseId, closed_days: [], blackout: [] });
    return { courseId, course, operatorId };
  }

  async getAvailability(courseId: string): Promise<CourseAvailability> {
    const { data } = await this.db
      .from("course_availability")
      .select("*")
      .eq("course_id", courseId)
      .maybeSingle();
    if (!data) {
      const fresh = { course_id: courseId, closed_days: [], blackout: [] };
      await this.db.from("course_availability").upsert(fresh);
      return { courseId, closedDays: [], blackout: [] };
    }
    return rowToAvailability(data);
  }

  async setAvailability(availability: CourseAvailability): Promise<CourseAvailability> {
    const clean = {
      course_id: availability.courseId,
      closed_days: [...new Set(availability.closedDays)].filter((d) => d >= 0 && d <= 6),
      blackout: availability.blackout
        .filter((w) => w.endHour > w.startHour)
        .map((w) => ({ startHour: w.startHour, endHour: w.endHour, label: w.label })),
    };
    await this.db.from("course_availability").upsert(clean);
    return { courseId: clean.course_id, closedDays: clean.closed_days, blackout: clean.blackout };
  }

  async approveCourse(courseId: string): Promise<Course | null> {
    const { data } = await this.db
      .from("courses")
      .update({ approved: true })
      .eq("id", courseId)
      .select()
      .maybeSingle();
    if (!data) return null;
    await this.pingOperator(
      courseId,
      { en: "You're approved! 🎉", fr: "Vous êtes approuvé ! 🎉" },
      {
        en: "Your Business Corner is live. Start releasing your empty tee times.",
        fr: "Votre Espace affaires est actif. Publiez vos départs vides.",
      },
    );
    return rowToCourse(data);
  }

  async listPendingCourses(): Promise<Course[]> {
    const { data } = await this.db.from("courses").select("*").eq("approved", false);
    return (data ?? []).map(rowToCourse);
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
    const course = await this.getCourse(input.courseId);
    if (!course) throw new Error("course_not_found");
    const tee = new Date(input.teeTimeISO);
    if (tee.getTime() < Date.now() + 90 * 60 * 1000) throw new Error("too_soon");
    const teeHour = localHour(input.teeTimeISO);
    const rack =
      input.rackRate && input.rackRate > input.pricePerPlayer
        ? input.rackRate
        : Math.round(input.pricePerPlayer * 1.6);
    const players = input.players ?? 4;
    const slot: Slot = {
      id: `s-${input.courseId}-${Date.now()}`,
      courseId: input.courseId,
      teeTimeISO: tee.toISOString(),
      holes: input.holes,
      cart: input.cart ?? course.cartAvailable,
      walking: true,
      players,
      spotsLeft: players,
      rackRate: rack,
      floorPrice: input.pricePerPlayer,
      currentPrice: input.pricePerPlayer,
      status: "released",
      band: bandForHour(teeHour),
      weather: "sun",
      fillRate: 0.5,
    };
    await this.db.from("slots").insert(slotToRow(slot));
    const notified = await this.notifyAlerts(slot, course);
    return { slot, notified };
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
    const row: Record<string, unknown> = {};
    if (patch.name?.trim()) row.name = patch.name.trim();
    if (patch.city?.trim()) row.city = patch.city.trim();
    if (typeof patch.rackRateLow === "number") row.rack_rate_low = patch.rackRateLow;
    if (typeof patch.rackRateHigh === "number") row.rack_rate_high = patch.rackRateHigh;
    if (patch.photoUrl?.trim()) row.photo_url = patch.photoUrl.trim();
    if (patch.description) {
      row.description_en = patch.description.en;
      row.description_fr = patch.description.fr;
    }
    if (Object.keys(row).length === 0) return this.getCourse(courseId);
    const { data } = await this.db.from("courses").update(row).eq("id", courseId).select().maybeSingle();
    return data ? rowToCourse(data) : null;
  }

  async releaseSlot(input: ReleaseSlotInput): Promise<{ slot: Slot; notified: number }> {
    const slot = await this.getSlot(input.slotId);
    if (!slot) throw new Error("Slot not found");
    const av = await this.getAvailability(slot.courseId);
    if (isBlackedOut(av, slot.teeTimeISO)) throw new Error("blacked_out");
    const currentPrice = Math.max(input.livePrice, input.floorPrice);
    await this.db
      .from("slots")
      .update({ status: "released", floor_price: input.floorPrice, current_price: currentPrice })
      .eq("id", slot.id);
    const updated: Slot = { ...slot, status: "released", floorPrice: input.floorPrice, currentPrice };
    const course = await this.getCourse(slot.courseId);
    const notified = course ? await this.notifyAlerts(updated, course) : 0;
    return { slot: updated, notified };
  }

  // ---- bookings ------------------------------------------------------------
  async createBooking(input: CreateBookingInput): Promise<BookingResult> {
    const slot = await this.getSlot(input.slotId);
    if (!slot) throw new Error("Slot not found");
    if (slot.spotsLeft <= 0) throw new Error("No spots left");

    const now = new Date();
    const teeTime = new Date(slot.teeTimeISO);
    const account = await this.accountFor(input.golferId);
    const tier = effectiveTier(account);
    const feeCents = perksForTier(tier).feeWaived ? 0 : BOOKING_FEE_CENTS;
    let creditAppliedCents = 0;
    let chargedCents = feeCents;
    if (input.applyCredit && feeCents > 0 && account.teeCreditCents > 0) {
      const r = applyCredit(feeCents, account.teeCreditCents);
      creditAppliedCents = r.appliedCents;
      chargedCents = r.chargeCents;
      await this.db
        .from("golfer_accounts")
        .update({ tee_credit_cents: r.remainingCreditCents })
        .eq("golfer_id", input.golferId);
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
    await this.db.from("bookings").insert(bookingToRow(booking));
    const pointsPreview = pointsForCheckin(BOOKING_FEE_CENTS);

    const spotsLeft = Math.max(0, slot.spotsLeft - 1);
    await this.db
      .from("slots")
      .update({ spots_left: spotsLeft, status: spotsLeft === 0 ? "booked" : slot.status })
      .eq("id", slot.id);

    // Refund-on-refill.
    let refundOnRefill: BookingResult["refundOnRefill"];
    const { data: priors } = await this.db
      .from("bookings")
      .select("*")
      .eq("slot_id", slot.id)
      .eq("status", "cancelled")
      .eq("deposit_status", "forfeited")
      .gt("tee_time_iso", now.toISOString())
      .limit(1);
    const prior = priors?.[0];
    if (prior) {
      await this.db.from("bookings").update({ deposit_status: "refunded-on-refill" }).eq("id", prior.id);
      refundOnRefill = { bookingId: prior.id, paymentIntentId: prior.payment_intent_id };
      const course = await this.getCourse(slot.courseId);
      await this.pushNotification({
        id: `n${Date.now()}-refill`,
        golferId: prior.golfer_id,
        kind: "refill-refund",
        title: {
          en: "Your slot was re-filled — deposit refunded",
          fr: "Votre place a été reprise — dépôt remboursé",
        },
        body: {
          en: `${course?.name ?? "The course"} re-booked your cancelled tee time, so your $10 booking fee was returned automatically.`,
          fr: `${course?.name ?? "Le club"} a repris votre départ annulé, vos frais de 10 $ ont donc été remis automatiquement.`,
        },
        read: false,
        slotId: slot.id,
      });
    }

    const teeLabel = new Date(slot.teeTimeISO).toLocaleTimeString("en-CA", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/Toronto",
    });
    await this.pingOperator(
      slot.courseId,
      { en: "New booking 🎟️", fr: "Nouvelle réservation 🎟️" },
      {
        en: `${input.golferName} booked your ${teeLabel} slot (${input.players} player${input.players > 1 ? "s" : ""}).`,
        fr: `${input.golferName} a réservé votre départ de ${teeLabel} (${input.players} joueur${input.players > 1 ? "s" : ""}).`,
      },
    );

    return { booking, feeCents, creditAppliedCents, chargedCents, pointsPreview, refundOnRefill };
  }

  async getBookingByReference(reference: string): Promise<Booking | null> {
    const { data } = await this.db
      .from("bookings")
      .select("*")
      .ilike("reference", reference)
      .maybeSingle();
    return data ? rowToBooking(data) : null;
  }

  async listBookings(golferId: string): Promise<Booking[]> {
    const { data } = await this.db
      .from("bookings")
      .select("*")
      .eq("golfer_id", golferId)
      .order("tee_time_iso", { ascending: false });
    return (data ?? []).map(rowToBooking);
  }

  async cancelBooking(bookingId: string): Promise<Booking> {
    const { data } = await this.db.from("bookings").select("*").eq("id", bookingId).maybeSingle();
    if (!data) throw new Error("Booking not found");
    const booking = rowToBooking(data);
    if (booking.status !== "confirmed") return booking;
    const now = new Date();
    const outcome = resolveCancellation({
      now,
      bookedAt: new Date(booking.createdAtISO),
      teeTime: new Date(booking.teeTimeISO),
      slotRefilled: false,
    });
    const depositStatus = outcome === "free-refund" ? "refunded" : "forfeited";
    await this.db
      .from("bookings")
      .update({ status: "cancelled", deposit_status: depositStatus })
      .eq("id", bookingId);

    const slot = await this.getSlot(booking.slotId);
    if (slot && new Date(slot.teeTimeISO).getTime() > now.getTime()) {
      await this.db
        .from("slots")
        .update({
          spots_left: slot.spotsLeft + 1,
          status: slot.status === "booked" ? "released" : slot.status,
        })
        .eq("id", slot.id);
    }
    return { ...booking, status: "cancelled", depositStatus };
  }

  async checkInBooking(bookingId: string): Promise<Booking> {
    const { data } = await this.db.from("bookings").select("*").eq("id", bookingId).maybeSingle();
    if (!data) throw new Error("Booking not found");
    const booking = rowToBooking(data);
    if (booking.status === "checked-in") return booking;

    await this.db
      .from("bookings")
      .update({ status: "checked-in", deposit_status: "credited" })
      .eq("id", bookingId);

    const account = await this.accountFor(booking.golferId);
    const points = pointsForCheckin(BOOKING_FEE_CENTS);
    await this.db
      .from("golfer_accounts")
      .update({
        tee_credit_cents: account.teeCreditCents + BOOKING_FEE_CENTS,
        lifetime_points: account.lifetimePoints + points,
      })
      .eq("golfer_id", booking.golferId);

    const course = await this.getCourse(booking.courseId);
    await this.db.from("points_ledger").insert({
      id: `pe-${Date.now()}`,
      golfer_id: booking.golferId,
      delta: points,
      reason: "checkin",
      label_en: `Checked in — ${course?.name ?? "course"}`,
      label_fr: `Enregistré — ${course?.name ?? "club"}`,
      booking_id: booking.id,
      created_at_iso: new Date().toISOString(),
    });

    await this.pingOperator(
      booking.courseId,
      { en: "Booking fulfilled ✓", fr: "Réservation honorée ✓" },
      {
        en: `${booking.golferName} checked in for their tee time. Deposit returned as TeeCredit.`,
        fr: `${booking.golferName} s'est enregistré pour son départ. Dépôt remis en TeeCredit.`,
      },
    );
    return { ...booking, status: "checked-in", depositStatus: "credited" };
  }

  async courseCheckins(courseId: string): Promise<Booking[]> {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date();
    dayEnd.setHours(23, 59, 59, 999);
    const upper = dayEnd.getTime() + 48 * 3600000;
    const { data } = await this.db
      .from("bookings")
      .select("*")
      .eq("course_id", courseId)
      .in("status", ["confirmed", "checked-in"]);
    return (data ?? [])
      .map(rowToBooking)
      .filter((b) => {
        const t = new Date(b.teeTimeISO).getTime();
        return t >= dayStart.getTime() && t <= upper;
      })
      .sort((a, b) => new Date(a.teeTimeISO).getTime() - new Date(b.teeTimeISO).getTime());
  }

  // ---- alerts & notifications ---------------------------------------------
  async listAlerts(golferId: string): Promise<Alert[]> {
    const { data } = await this.db
      .from("alerts")
      .select("*")
      .eq("golfer_id", golferId)
      .order("created_at_iso", { ascending: false });
    return (data ?? []).map(rowToAlert);
  }

  async createAlert(alert: Omit<Alert, "id" | "createdAtISO">): Promise<Alert> {
    const created: Alert = { ...alert, id: `al${Date.now()}`, createdAtISO: new Date().toISOString() };
    await this.db.from("alerts").insert({
      id: created.id,
      golfer_id: created.golferId,
      label: created.label,
      regions: created.regions,
      bands: created.bands,
      days: created.days,
      max_price: created.maxPrice,
      active: created.active,
      created_at_iso: created.createdAtISO,
    });
    return created;
  }

  async toggleAlert(alertId: string): Promise<Alert> {
    const { data } = await this.db.from("alerts").select("*").eq("id", alertId).maybeSingle();
    if (!data) throw new Error("Alert not found");
    const next = !data.active;
    await this.db.from("alerts").update({ active: next }).eq("id", alertId);
    return { ...rowToAlert(data), active: next };
  }

  async deleteAlert(alertId: string): Promise<void> {
    await this.db.from("alerts").delete().eq("id", alertId);
  }

  async listNotifications(golferId: string): Promise<Notification[]> {
    const { data } = await this.db
      .from("notifications")
      .select("*")
      .eq("golfer_id", golferId)
      .order("created_at_iso", { ascending: false });
    return (data ?? []).map(rowToNotification);
  }

  async markNotificationsRead(golferId: string): Promise<void> {
    await this.db.from("notifications").update({ read: true }).eq("golfer_id", golferId);
  }

  // ---- users ---------------------------------------------------------------
  async listUsers(): Promise<User[]> {
    const { data } = await this.db.from("users").select("*");
    return (data ?? []).map(rowToUser);
  }

  async authenticate(email: string, password: string): Promise<User | null> {
    const { data } = await this.db
      .from("users")
      .select("*")
      .ilike("email", email)
      .eq("password", password)
      .maybeSingle();
    return data ? rowToUser(data) : null;
  }

  // ---- loyalty -------------------------------------------------------------
  private async accountFor(golferId: string): Promise<GolferAccount> {
    const { data } = await this.db
      .from("golfer_accounts")
      .select("*")
      .eq("golfer_id", golferId)
      .maybeSingle();
    if (data) return rowToAccount(data);
    const fresh = { golfer_id: golferId, lifetime_points: 0, tee_credit_cents: 0, subscription: "none" };
    await this.db.from("golfer_accounts").upsert(fresh);
    return { golferId, lifetimePoints: 0, teeCreditCents: 0, subscription: "none" };
  }

  async getAccount(golferId: string): Promise<GolferAccount> {
    return this.accountFor(golferId);
  }

  async listPointsLedger(golferId: string): Promise<PointsEntry[]> {
    const { data } = await this.db
      .from("points_ledger")
      .select("*")
      .eq("golfer_id", golferId)
      .order("created_at_iso", { ascending: false });
    return (data ?? []).map(rowToPointsEntry);
  }

  async setSubscription(golferId: string, subscription: "none" | "plus"): Promise<GolferAccount> {
    await this.accountFor(golferId);
    await this.db.from("golfer_accounts").update({ subscription }).eq("golfer_id", golferId);
    return { ...(await this.accountFor(golferId)), subscription };
  }

  async setHandicap(golferId: string, handicap: number): Promise<GolferAccount> {
    await this.accountFor(golferId);
    await this.db.from("golfer_accounts").update({ handicap }).eq("golfer_id", golferId);
    return { ...(await this.accountFor(golferId)), handicap };
  }

  async matchmaking(golferId: string): Promise<MatchmakingCandidate[]> {
    const me = await this.accountFor(golferId);
    const myHc = me.handicap ?? 18;
    const { data } = await this.db.from("golfer_accounts").select("*").not("handicap", "is", null);
    const { data: users } = await this.db.from("users").select("*");
    const userById = new Map((users ?? []).map((u: Row) => [u.id, u.name]));
    return (data ?? [])
      .map(rowToAccount)
      .filter((a) => a.golferId !== golferId && a.handicap != null)
      .map((a) => ({
        golferId: a.golferId,
        name: (userById.get(a.golferId) as string) ?? "Golfer",
        handicap: a.handicap!,
        tier: TIER_LABEL[effectiveTier(a)].en,
        gap: Math.abs((a.handicap ?? 18) - myHc),
      }))
      .sort((a, b) => a.gap - b.gap)
      .map(({ gap: _gap, ...rest }) => rest);
  }

  // ---- metrics -------------------------------------------------------------
  async adminMetrics(): Promise<AdminMetrics> {
    const { data: bRows } = await this.db.from("bookings").select("*");
    const bookings = (bRows ?? []).map(rowToBooking);
    const { count: courseCount } = await this.db
      .from("courses")
      .select("*", { count: "exact", head: true });
    const { count: activeAlerts } = await this.db
      .from("alerts")
      .select("*", { count: "exact", head: true })
      .eq("active", true);

    const paid = bookings.filter((b) => b.status !== "cancelled");
    const gmvCents = paid.reduce((s, b) => s + b.pricePerPlayer * b.players * 100, 0);
    const deposits: Record<string, number> = {};
    for (const b of bookings) deposits[b.depositStatus] = (deposits[b.depositStatus] ?? 0) + 1;
    const completed = paid.length;
    return {
      gmvCents,
      bookings: bookings.length,
      activeAlerts: activeAlerts ?? 0,
      courses: courseCount ?? 0,
      funnel: { views: completed * 6, starts: Math.round(completed * 1.5), completed },
      deposits,
    };
  }

  async operatorStats(courseId: string): Promise<OperatorStats> {
    const { data } = await this.db.from("bookings").select("*").eq("course_id", courseId);
    const courseBookings = (data ?? []).map(rowToBooking);
    const active = courseBookings.filter((b) => b.status !== "cancelled");
    const grossBookingsCents = active.reduce((s, b) => s + b.pricePerPlayer * b.players * 100, 0);
    const bookingsThisMonth = active.length;
    const teetomicFeeCents = 199_00 + bookingsThisMonth * 1_00;
    const recoveredCents = grossBookingsCents + 1240_00;
    const noShows = courseBookings.filter((b) => b.status === "no-show").length;
    const noShowRate = courseBookings.length ? noShows / courseBookings.length : 0.02;
    const forfeitShareCents = courseBookings
      .filter((b) => b.depositStatus === "forfeited")
      .reduce((s, b) => s + Math.floor(b.depositCents / 2), 0);
    return {
      grossBookingsCents,
      teetomicFeeCents,
      recoveredCents,
      noShowRate: noShowRate || 0.02,
      forfeitShareCents,
      bookingsThisMonth,
    };
  }

  // ---- seeding / reset -----------------------------------------------------
  /**
   * Seeds the demo dataset (courses, slots, users, accounts, ledger,
   * availability) ONLY when the database is empty — safe to call on boot. It
   * never deletes real data, so it will not wipe live signups.
   */
  async seedIfEmpty(): Promise<{ seeded: boolean }> {
    const { count } = await this.db.from("courses").select("*", { count: "exact", head: true });
    if ((count ?? 0) > 0) return { seeded: false };
    const seed = buildSeed(new Date());

    await this.db.from("courses").insert(seed.courses.map(courseToRow));
    await this.db.from("slots").insert(seed.slots.map(slotToRow));
    await this.db.from("users").insert(
      seed.users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        password: u.password,
        role: u.role,
        course_id: u.courseId ?? null,
      })),
    );
    await this.db.from("golfer_accounts").insert(
      seed.accounts.map((a) => ({
        golfer_id: a.golferId,
        lifetime_points: a.lifetimePoints,
        tee_credit_cents: a.teeCreditCents,
        subscription: a.subscription,
        handicap: a.handicap ?? null,
      })),
    );
    await this.db.from("points_ledger").insert(
      seed.pointsLedger.map((p) => ({
        id: p.id,
        golfer_id: p.golferId,
        delta: p.delta,
        reason: p.reason,
        label_en: p.label.en,
        label_fr: p.label.fr,
        booking_id: p.bookingId ?? null,
        created_at_iso: p.createdAtISO,
      })),
    );
    await this.db.from("course_availability").insert(
      seed.availability.map((a) => ({
        course_id: a.courseId,
        closed_days: a.closedDays,
        blackout: a.blackout,
      })),
    );
    return { seeded: true };
  }

  /** Demo reset: seeds if empty. Does NOT destroy existing data in Supabase. */
  async reset(): Promise<void> {
    await this.seedIfEmpty();
  }
}
