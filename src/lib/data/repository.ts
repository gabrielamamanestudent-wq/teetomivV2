// ============================================================================
// The single data-access contract. Both the in-memory mock layer and a future
// Supabase implementation satisfy this interface, so the UI/API never care
// which backend is live.
// ============================================================================

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
  User,
} from "./types";

export interface DealFilters {
  date?: string; // yyyy-mm-dd (local)
  bands?: string[];
  maxPrice?: number;
  regions?: string[];
  holes?: number;
  cart?: boolean;
}

export interface ReleaseSlotInput {
  slotId: string;
  floorPrice: number;
  livePrice: number;
}

export interface CreateBookingInput {
  slotId: string;
  golferId: string;
  golferName: string;
  golferEmail: string;
  players: number;
  paymentIntentId: string;
  applyCredit?: boolean; // spend available TeeCredit against the $10 fee
}

export interface BookingResult {
  booking: Booking;
  feeCents: number; // fee after tier waiver
  creditAppliedCents: number; // TeeCredit spent
  chargedCents: number; // actually charged to card
  pointsPreview: number; // points they'll earn on check-in
  // Set when this booking re-filled a slot whose prior late-cancel was
  // forfeited: the earlier golfer is now owed their fee back to card. The
  // caller (booking-service) issues the real refund via the payment provider.
  refundOnRefill?: { bookingId: string; paymentIntentId: string };
}

export interface MatchmakingCandidate {
  golferId: string;
  name: string;
  handicap: number;
  tier: string;
}

export interface CreateCourseInput {
  courseName: string;
  city: string;
  region: Region;
  contactName: string;
  email: string;
  pin: string;
}

export interface CreateCourseResult {
  courseId: string;
  course: Course;
  operatorId: string;
}

export interface AdminMetrics {
  gmvCents: number;
  bookings: number;
  activeAlerts: number;
  courses: number;
  funnel: { views: number; starts: number; completed: number };
  deposits: Record<string, number>;
}

export interface OperatorStats {
  grossBookingsCents: number;
  teetomicFeeCents: number;
  recoveredCents: number;
  noShowRate: number;
  forfeitShareCents: number;
  bookingsThisMonth: number;
}

export interface Repository {
  // courses & slots
  listCourses(): Promise<Course[]>;
  getCourse(id: string): Promise<Course | null>;
  listDeals(filters?: DealFilters): Promise<Slot[]>;
  getSlot(id: string): Promise<Slot | null>;
  recentDeals(limit: number): Promise<Slot[]>;
  courseSlots(courseId: string): Promise<Slot[]>;
  releaseSlot(input: ReleaseSlotInput): Promise<{ slot: Slot; notified: number }>;

  // course accounts & availability (operator self-service)
  createCourseAccount(input: CreateCourseInput): Promise<CreateCourseResult>;
  getAvailability(courseId: string): Promise<CourseAvailability>;
  setAvailability(availability: CourseAvailability): Promise<CourseAvailability>;
  approveCourse(courseId: string): Promise<Course | null>;
  listPendingCourses(): Promise<Course[]>;
  createSlot(input: {
    courseId: string;
    teeTimeISO: string;
    holes: 9 | 18;
    pricePerPlayer: number;
    rackRate?: number;
    cart?: boolean;
    players?: number;
  }): Promise<{ slot: Slot; notified: number }>;
  updateCourse(
    courseId: string,
    patch: {
      name?: string;
      city?: string;
      rackRateLow?: number;
      rackRateHigh?: number;
      photoUrl?: string;
      description?: { en: string; fr: string };
    },
  ): Promise<Course | null>;

  // bookings
  createBooking(input: CreateBookingInput): Promise<BookingResult>;
  getBookingByReference(reference: string): Promise<Booking | null>;
  listBookings(golferId: string): Promise<Booking[]>;
  cancelBooking(bookingId: string): Promise<Booking>;
  checkInBooking(bookingId: string): Promise<Booking>;
  courseCheckins(courseId: string): Promise<Booking[]>;

  // alerts & notifications
  listAlerts(golferId: string): Promise<Alert[]>;
  createAlert(alert: Omit<Alert, "id" | "createdAtISO">): Promise<Alert>;
  toggleAlert(alertId: string): Promise<Alert>;
  deleteAlert(alertId: string): Promise<void>;
  listNotifications(golferId: string): Promise<Notification[]>;
  markNotificationsRead(golferId: string): Promise<void>;

  // users
  listUsers(): Promise<User[]>;
  authenticate(email: string, password: string): Promise<User | null>;

  // loyalty
  getAccount(golferId: string): Promise<GolferAccount>;
  listPointsLedger(golferId: string): Promise<PointsEntry[]>;
  setSubscription(golferId: string, subscription: "none" | "plus"): Promise<GolferAccount>;
  setHandicap(golferId: string, handicap: number): Promise<GolferAccount>;
  matchmaking(golferId: string): Promise<MatchmakingCandidate[]>;

  // metrics
  adminMetrics(): Promise<AdminMetrics>;
  operatorStats(courseId: string): Promise<OperatorStats>;

  // demo
  reset(): Promise<void>;
}
