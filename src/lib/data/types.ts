// ============================================================================
// TEETOMIC domain types
// Shared across the mock and Supabase data layers, the pricing/policy engines,
// and the UI. Kept framework-agnostic so the pure modules can be unit tested.
// ============================================================================

export type Region =
  | "west-island"
  | "south-shore"
  | "laval"
  | "north-shore";

export type TimeBand = "dawn" | "morning" | "midday" | "twilight";

export type Holes = 9 | 18;

export type Locale = "en" | "fr";

export interface LocalizedText {
  en: string;
  fr: string;
}

export interface Course {
  id: string;
  name: string;
  slug: string;
  region: Region;
  city: string;
  description: LocalizedText;
  photoUrl: string;
  logoLabel: string; // short text logo (we do not use real course branding)
  rackRateLow: number; // typical low green fee (CAD)
  rackRateHigh: number; // typical high green fee (CAD)
  rating: number; // 0-5
  holesAvailable: Holes[];
  cartAvailable: boolean;
  lat: number;
  lng: number;
}

export type SlotStatus =
  | "unlisted" // exists on tee sheet but not pushed to TEETOMIC
  | "released" // live on TEETOMIC, bookable
  | "booked" // booked via TEETOMIC
  | "expired"; // tee time passed without booking

export interface Slot {
  id: string;
  courseId: string;
  teeTimeISO: string; // ISO datetime in UTC, displayed in America/Toronto
  holes: Holes;
  cart: boolean;
  walking: boolean;
  players: number; // max players the slot accommodates
  spotsLeft: number;
  rackRate: number; // original green fee (struck-through price)
  floorPrice: number; // operator's minimum acceptable price
  currentPrice: number; // live dynamic price
  status: SlotStatus;
  band: TimeBand;
  weather: "sun" | "cloud" | "rain";
  fillRate: number; // 0-1, how full that day's sheet is
}

export type BookingStatus =
  | "confirmed"
  | "checked-in"
  | "cancelled"
  | "no-show";

export type DepositStatus =
  | "authorized" // $15 held
  | "refunded" // released to golfer
  | "forfeited" // kept, split 50/50 (display only)
  | "refunded-on-refill"; // late cancel but slot refilled -> refunded

export interface Booking {
  id: string;
  reference: string; // human-friendly code, e.g. TTM-4Q7K
  slotId: string;
  courseId: string;
  golferId: string;
  golferName: string;
  golferEmail: string;
  players: number;
  pricePerPlayer: number; // green fee due at course
  createdAtISO: string;
  teeTimeISO: string;
  status: BookingStatus;
  depositCents: number; // 1500
  depositStatus: DepositStatus;
  paymentIntentId: string;
  freeCancellationDeadlineISO: string;
}

export interface Alert {
  id: string;
  golferId: string;
  label: string;
  regions: Region[];
  bands: TimeBand[];
  days: number[]; // 0=Sun ... 6=Sat, empty = any day
  maxPrice: number;
  active: boolean;
  createdAtISO: string;
}

export interface Notification {
  id: string;
  golferId: string;
  title: LocalizedText;
  body: LocalizedText;
  createdAtISO: string;
  read: boolean;
  slotId?: string;
  kind: "match" | "refill-refund" | "reminder";
}

export type UserRole = "golfer" | "operator" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // demo only, plaintext seed
  role: UserRole;
  courseId?: string; // for operators
}
