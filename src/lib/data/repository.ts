// ============================================================================
// The single data-access contract. Both the in-memory mock layer and a future
// Supabase implementation satisfy this interface, so the UI/API never care
// which backend is live.
// ============================================================================

import type {
  Alert,
  Booking,
  Course,
  Notification,
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

  // bookings
  createBooking(input: CreateBookingInput): Promise<Booking>;
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

  // metrics
  adminMetrics(): Promise<AdminMetrics>;
  operatorStats(courseId: string): Promise<OperatorStats>;

  // demo
  reset(): Promise<void>;
}
