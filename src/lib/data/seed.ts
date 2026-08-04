// ============================================================================
// Deterministic demo seed: 8 fictional Montreal-area courses, ~60 slots across
// the next 3 days at varied discount stages, demo accounts, and bookings that
// showcase every deposit state. Course names are invented — no real branding.
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
import { computePrice } from "../pricing";
import { freeCancellationDeadline, DEPOSIT_CENTS } from "../policy";
import { bandForHour, localDayOfWeek, localHour } from "../time";

export interface SeedData {
  courses: Course[];
  slots: Slot[];
  users: User[];
  bookings: Booking[];
  alerts: Alert[];
  notifications: Notification[];
  accounts: GolferAccount[];
  pointsLedger: PointsEntry[];
  availability: CourseAvailability[];
}

// Unsplash golf photos (source pool — public hotlinkable images).
const PHOTOS = [
  "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=1200&q=70",
  "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=1200&q=70",
  "https://images.unsplash.com/photo-1600861195091-690c92f1d2cc?w=1200&q=70",
  "https://images.unsplash.com/photo-1600783245906-2c67d0a1e2a3?w=1200&q=70",
  "https://images.unsplash.com/photo-1592919505780-303950717480?w=1200&q=70",
  "https://images.unsplash.com/photo-1611374243147-44a702c2d44c?w=1200&q=70",
  "https://images.unsplash.com/photo-1500932334442-8761ee4810a7?w=1200&q=70",
  "https://images.unsplash.com/photo-1519160732537-4e6e4c9c9c0a?w=1200&q=70",
];

const COURSES: Omit<Course, "photoUrl">[] = [
  {
    id: "c1",
    name: "Héron Bleu Golf Club",
    slug: "heron-bleu",
    region: "west-island",
    city: "Kirkland",
    description: {
      en: "A tight, tree-lined parkland layout on the western tip of the island. Fast greens, four sets of tees.",
      fr: "Un parcours de type parc, boisé et étroit, à la pointe ouest de l'île. Verts rapides, quatre jeux de départs.",
    },
    logoLabel: "HB",
    rackRateLow: 55,
    rackRateHigh: 95,
    rating: 4.6,
    holesAvailable: [9, 18],
    cartAvailable: true,
    lat: 45.45,
    lng: -73.86,
  },
  {
    id: "c2",
    name: "Rivière-aux-Cerfs",
    slug: "riviere-aux-cerfs",
    region: "south-shore",
    city: "Brossard",
    description: {
      en: "A links-inspired South Shore course with wide fairways and river views on the back nine.",
      fr: "Un parcours de style links sur la Rive-Sud, avec de larges allées et des vues sur la rivière au retour.",
    },
    logoLabel: "RC",
    rackRateLow: 45,
    rackRateHigh: 80,
    rating: 4.3,
    holesAvailable: [9, 18],
    cartAvailable: true,
    lat: 45.44,
    lng: -73.45,
  },
  {
    id: "c3",
    name: "Sommet Érable",
    slug: "sommet-erable",
    region: "laval",
    city: "Laval",
    description: {
      en: "Elevated maple-lined fairways with dramatic views of the Laurentians. A local favourite for twilight rounds.",
      fr: "Des allées bordées d'érables en hauteur avec des vues sur les Laurentides. Un favori local pour les rondes au crépuscule.",
    },
    logoLabel: "SÉ",
    rackRateLow: 60,
    rackRateHigh: 110,
    rating: 4.7,
    holesAvailable: [18],
    cartAvailable: true,
    lat: 45.61,
    lng: -73.71,
  },
  {
    id: "c4",
    name: "Les Berges du Nord",
    slug: "berges-du-nord",
    region: "north-shore",
    city: "Terrebonne",
    description: {
      en: "A championship North Shore track with bentgrass greens and a signature island green on 17.",
      fr: "Un parcours de championnat sur la Rive-Nord avec des verts en agrostide et un vert-île emblématique au 17.",
    },
    logoLabel: "BN",
    rackRateLow: 70,
    rackRateHigh: 140,
    rating: 4.8,
    holesAvailable: [18],
    cartAvailable: true,
    lat: 45.7,
    lng: -73.64,
  },
  {
    id: "c5",
    name: "Pointe-Claire Fairways",
    slug: "pointe-claire-fairways",
    region: "west-island",
    city: "Pointe-Claire",
    description: {
      en: "An accessible, walkable West Island nine-and-eighteen with a welcoming beginner-friendly front nine.",
      fr: "Un parcours accessible et praticable à pied dans le West Island, avec un aller accueillant pour les débutants.",
    },
    logoLabel: "PC",
    rackRateLow: 48,
    rackRateHigh: 78,
    rating: 4.1,
    holesAvailable: [9, 18],
    cartAvailable: false,
    lat: 45.44,
    lng: -73.82,
  },
  {
    id: "c6",
    name: "Domaine Longueuil",
    slug: "domaine-longueuil",
    region: "south-shore",
    city: "Longueuil",
    description: {
      en: "Mature oaks and strategic bunkering just minutes from the bridge. Excellent conditioning year-round.",
      fr: "Des chênes matures et un bunkering stratégique à quelques minutes du pont. Un excellent entretien toute l'année.",
    },
    logoLabel: "DL",
    rackRateLow: 52,
    rackRateHigh: 92,
    rating: 4.4,
    holesAvailable: [9, 18],
    cartAvailable: true,
    lat: 45.53,
    lng: -73.51,
  },
  {
    id: "c7",
    name: "Cap Boisé",
    slug: "cap-boise",
    region: "laval",
    city: "Sainte-Dorothée",
    description: {
      en: "A forested Laval escape with rolling terrain, generous landing areas and quick, true greens.",
      fr: "Une évasion boisée à Laval, avec un terrain vallonné, de généreuses zones d'atterrissage et des verts rapides et fidèles.",
    },
    logoLabel: "CB",
    rackRateLow: 58,
    rackRateHigh: 100,
    rating: 4.5,
    holesAvailable: [9, 18],
    cartAvailable: true,
    lat: 45.53,
    lng: -73.82,
  },
  {
    id: "c8",
    name: "Vallée Mirabel",
    slug: "vallee-mirabel",
    region: "north-shore",
    city: "Mirabel",
    description: {
      en: "Wide, forgiving valley fairways framed by the foothills. A relaxed pace and unbeatable twilight rates.",
      fr: "De larges allées de vallée indulgentes encadrées par les contreforts. Un rythme détendu et des tarifs de crépuscule imbattables.",
    },
    logoLabel: "VM",
    rackRateLow: 50,
    rackRateHigh: 88,
    rating: 4.2,
    holesAvailable: [9, 18],
    cartAvailable: true,
    lat: 45.65,
    lng: -74.08,
  },
];

const WEATHER: Slot["weather"][] = ["sun", "sun", "sun", "cloud", "rain"];

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Round an instant to a given hour/minute today+dayOffset in local terms. */
function teeInstant(now: Date, dayOffset: number, hour: number, minute: number): Date {
  const d = new Date(now);
  d.setSeconds(0, 0);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export function buildSeed(now: Date = new Date()): SeedData {
  const rand = mulberry32(42);
  const courses: Course[] = COURSES.map((c, i) => ({
    ...c,
    photoUrl: PHOTOS[i % PHOTOS.length],
  }));

  const slots: Slot[] = [];
  let slotN = 0;

  // Build slots for the next 3 days. A handful of "today" slots are engineered
  // to expire within a few hours so countdowns look alive during the demo.
  const teeHours = [6, 7, 8, 9, 10, 11, 13, 15, 17];

  for (let day = 0; day <= 2; day++) {
    for (const course of courses) {
      const dayFill = 0.35 + rand() * 0.5;
      // pick 2-4 tee hours per course per day
      const count = 2 + Math.floor(rand() * 3);
      const chosen = [...teeHours].sort(() => rand() - 0.5).slice(0, count);
      for (const h of chosen) {
        const minute = rand() > 0.5 ? 10 : 40;
        let tee = teeInstant(now, day, h, minute);
        // For "today", force a few near-term slots so countdowns are short.
        if (day === 0 && tee.getTime() <= now.getTime() + 60 * 60 * 1000) {
          tee = new Date(now.getTime() + (90 + slotN * 17) * 60 * 1000);
        }
        // Skip anything already in the past.
        if (tee.getTime() <= now.getTime()) continue;

        const iso = tee.toISOString();
        const teeHour = localHour(iso);
        const dow = localDayOfWeek(iso);
        const rack =
          course.rackRateLow +
          Math.round(rand() * (course.rackRateHigh - course.rackRateLow));
        const floor = Math.round(rack * (0.35 + rand() * 0.1));
        const weather = WEATHER[Math.floor(rand() * WEATHER.length)];
        const holes = course.holesAvailable[
          Math.floor(rand() * course.holesAvailable.length)
        ];
        const hoursUntilTee =
          (tee.getTime() - now.getTime()) / (1000 * 60 * 60);
        const { price } = computePrice({
          hoursUntilTeeTime: hoursUntilTee,
          rackRate: rack,
          floorPrice: floor,
          dayOfWeek: dow,
          band: bandForHour(teeHour),
          teeHour,
          weather,
          fillRate: dayFill,
        });

        // Most near-term slots are released; some further out stay unlisted.
        const status: Slot["status"] =
          hoursUntilTee < 40 || rand() > 0.35 ? "released" : "unlisted";

        slots.push({
          id: `s${++slotN}`,
          courseId: course.id,
          teeTimeISO: iso,
          holes,
          cart: course.cartAvailable && rand() > 0.3,
          walking: true,
          players: 4,
          spotsLeft: 1 + Math.floor(rand() * 4),
          rackRate: rack,
          floorPrice: floor,
          currentPrice: price,
          status,
          band: bandForHour(teeHour),
          weather,
          fillRate: Math.round(dayFill * 100) / 100,
        });
      }
    }
  }

  // --- Users ---------------------------------------------------------------
  const users: User[] = [
    { id: "g1", name: "Alexandre Roy", email: "alex@demo.golf", password: "golf1234", role: "golfer" },
    { id: "g2", name: "Marie-Claude Tremblay", email: "marie@demo.golf", password: "golf1234", role: "golfer" },
    { id: "g3", name: "Sam Patel", email: "sam@demo.golf", password: "golf1234", role: "golfer" },
    { id: "o1", name: "Pro Shop — Héron Bleu", email: "operator@demo.golf", password: "shop1234", role: "operator", courseId: "c1" },
    { id: "a1", name: "TEETOMIC Admin", email: "admin@demo.golf", password: "admin1234", role: "admin" },
  ];

  // --- Alerts --------------------------------------------------------------
  const alerts: Alert[] = [
    {
      id: "al1",
      golferId: "g1",
      label: "Saturday dawn patrol",
      regions: ["west-island", "laval"],
      bands: ["dawn", "morning"],
      days: [6],
      maxPrice: 60,
      active: true,
      createdAtISO: new Date(now.getTime() - 3 * 86400000).toISOString(),
    },
    {
      id: "al2",
      golferId: "g1",
      label: "Cheap twilight anywhere",
      regions: ["west-island", "south-shore", "laval", "north-shore"],
      bands: ["twilight"],
      days: [],
      maxPrice: 45,
      active: true,
      createdAtISO: new Date(now.getTime() - 86400000).toISOString(),
    },
    {
      id: "al3",
      golferId: "g2",
      label: "South Shore weekday mornings",
      regions: ["south-shore"],
      bands: ["morning", "midday"],
      days: [1, 2, 3, 4, 5],
      maxPrice: 70,
      active: true,
      createdAtISO: new Date(now.getTime() - 2 * 86400000).toISOString(),
    },
  ];

  // --- Bookings showcasing every deposit state -----------------------------
  const bookings: Booking[] = [];
  const releasedToday = slots.filter(
    (s) => s.status === "released",
  );

  // 1) A booking pending check-in TODAY (authorized deposit).
  const pendingSlot = releasedToday.find(
    (s) => (new Date(s.teeTimeISO).getTime() - now.getTime()) / 3600000 < 8,
  );
  if (pendingSlot) {
    pendingSlot.status = "booked";
    pendingSlot.spotsLeft = 0;
    const bookedAt = new Date(now.getTime() - 3 * 3600000);
    bookings.push({
      id: "b1",
      reference: "TTM-7K2Q",
      slotId: pendingSlot.id,
      courseId: pendingSlot.courseId,
      golferId: "g1",
      golferName: "Alexandre Roy",
      golferEmail: "alex@demo.golf",
      players: 2,
      pricePerPlayer: pendingSlot.currentPrice,
      createdAtISO: bookedAt.toISOString(),
      teeTimeISO: pendingSlot.teeTimeISO,
      status: "confirmed",
      depositCents: DEPOSIT_CENTS,
      depositStatus: "authorized",
      paymentIntentId: "pi_demo_pending",
      freeCancellationDeadlineISO: freeCancellationDeadline(
        bookedAt,
        new Date(pendingSlot.teeTimeISO),
      ).toISOString(),
    });
  }

  // 2) A refunded-after-refill example (past).
  {
    const teeTime = new Date(now.getTime() - 26 * 3600000);
    const bookedAt = new Date(teeTime.getTime() - 30 * 3600000);
    bookings.push({
      id: "b2",
      reference: "TTM-3M9X",
      slotId: "past-refill",
      courseId: "c2",
      golferId: "g2",
      golferName: "Marie-Claude Tremblay",
      golferEmail: "marie@demo.golf",
      players: 1,
      pricePerPlayer: 52,
      createdAtISO: bookedAt.toISOString(),
      teeTimeISO: teeTime.toISOString(),
      status: "cancelled",
      depositCents: DEPOSIT_CENTS,
      depositStatus: "refunded-on-refill",
      paymentIntentId: "pi_demo_refill",
      freeCancellationDeadlineISO: freeCancellationDeadline(bookedAt, teeTime).toISOString(),
    });
  }

  // 3) A forfeited no-show example (past).
  {
    const teeTime = new Date(now.getTime() - 50 * 3600000);
    const bookedAt = new Date(teeTime.getTime() - 40 * 3600000);
    bookings.push({
      id: "b3",
      reference: "TTM-8F1L",
      slotId: "past-noshow",
      courseId: "c4",
      golferId: "g3",
      golferName: "Sam Patel",
      golferEmail: "sam@demo.golf",
      players: 3,
      pricePerPlayer: 61,
      createdAtISO: bookedAt.toISOString(),
      teeTimeISO: teeTime.toISOString(),
      status: "no-show",
      depositCents: DEPOSIT_CENTS,
      depositStatus: "forfeited",
      paymentIntentId: "pi_demo_noshow",
      freeCancellationDeadlineISO: freeCancellationDeadline(bookedAt, teeTime).toISOString(),
    });
  }

  // 4) A completed, checked-in past booking (refunded).
  {
    const teeTime = new Date(now.getTime() - 72 * 3600000);
    const bookedAt = new Date(teeTime.getTime() - 20 * 3600000);
    bookings.push({
      id: "b4",
      reference: "TTM-5W0P",
      slotId: "past-done",
      courseId: "c1",
      golferId: "g1",
      golferName: "Alexandre Roy",
      golferEmail: "alex@demo.golf",
      players: 4,
      pricePerPlayer: 48,
      createdAtISO: bookedAt.toISOString(),
      teeTimeISO: teeTime.toISOString(),
      status: "checked-in",
      depositCents: DEPOSIT_CENTS,
      depositStatus: "credited",
      paymentIntentId: "pi_demo_done",
      freeCancellationDeadlineISO: freeCancellationDeadline(bookedAt, teeTime).toISOString(),
    });
  }

  // --- Notifications -------------------------------------------------------
  const notifications: Notification[] = [
    {
      id: "n1",
      golferId: "g2",
      kind: "refill-refund",
      title: { en: "Your slot was re-filled — deposit refunded", fr: "Votre place a été reprise — dépôt remboursé" },
      body: {
        en: "Good news! Rivière-aux-Cerfs re-booked your cancelled tee time, so your $10 booking fee was returned automatically.",
        fr: "Bonne nouvelle ! Rivière-aux-Cerfs a repris votre départ annulé, vos frais de 10 $ ont donc été remis automatiquement.",
      },
      createdAtISO: new Date(now.getTime() - 25 * 3600000).toISOString(),
      read: false,
    },
    {
      id: "n2",
      golferId: "g1",
      kind: "match",
      title: { en: "New match: Héron Bleu 7:10 AM", fr: "Nouvelle correspondance : Héron Bleu 7 h 10" },
      body: {
        en: "A slot matching 'Saturday dawn patrol' just went live for $42 (was $95).",
        fr: "Un départ correspondant à « Aube du samedi » vient d'être publié à 42 $ (avant 95 $).",
      },
      createdAtISO: new Date(now.getTime() - 40 * 60000).toISOString(),
      read: false,
    },
  ];

  // --- Loyalty accounts (points model) -------------------------------------
  // Alex: Gold (past that threshold). Marie: TEETOMIC+ subscriber with credit.
  // Sam: standby, has whiffed a couple of check-ins.
  // Demo identities are maxed out on purpose — explorers should see every perk
  // (Gold Plus, big points, TeeCredit, matchmaking) without earning them first.
  const accounts: GolferAccount[] = [
    { golferId: "g1", lifetimePoints: 920, teeCreditCents: 5000, subscription: "plus", handicap: 12 },
    { golferId: "g2", lifetimePoints: 780, teeCreditCents: 3500, subscription: "plus", handicap: 8 },
    { golferId: "g3", lifetimePoints: 640, teeCreditCents: 2500, subscription: "plus", handicap: 20 },
  ];

  const ledgerEntry = (
    golferId: string,
    delta: number,
    reason: PointsEntry["reason"],
    en: string,
    fr: string,
    hoursAgo: number,
  ): PointsEntry => ({
    id: `pe-${golferId}-${reason}-${hoursAgo}`,
    golferId,
    delta,
    reason,
    label: { en, fr },
    createdAtISO: new Date(now.getTime() - hoursAgo * 3600000).toISOString(),
  });

  const pointsLedger: PointsEntry[] = [
    ledgerEntry("g1", 25, "signup", "Welcome bonus", "Bonus de bienvenue", 720),
    ledgerEntry("g1", 60, "checkin", "Checked in — Pointe-Claire Fairways", "Enregistré — Pointe-Claire Fairways", 72),
    ledgerEntry("g1", 55, "checkin", "Checked in — Héron Bleu", "Enregistré — Héron Bleu", 200),
    ledgerEntry("g1", 200, "tournament", "Twilight scramble — 2nd place", "Scramble crépuscule — 2e place", 300),
    ledgerEntry("g2", 25, "signup", "Welcome bonus", "Bonus de bienvenue", 500),
    ledgerEntry("g2", 55, "checkin", "Checked in — Rivière-aux-Cerfs", "Enregistré — Rivière-aux-Cerfs", 100),
    ledgerEntry("g2", 100, "tournament", "TEETOMIC+ member bonus", "Bonus membre TEETOMIC+", 40),
    ledgerEntry("g3", 25, "signup", "Welcome bonus", "Bonus de bienvenue", 260),
    ledgerEntry("g3", 35, "checkin", "Checked in — Les Berges du Nord", "Enregistré — Les Berges du Nord", 120),
  ];

  // --- Course availability (operator blackout hours) -----------------------
  // The demo pro shop (c1) ships with example blackouts so the feature is
  // visible; the rest start fully open.
  const availability: CourseAvailability[] = courses.map((c) => ({
    courseId: c.id,
    closedDays: [],
    blackout: [],
  }));
  const c1av = availability.find((a) => a.courseId === "c1");
  if (c1av) {
    c1av.blackout = [
      { startHour: 11, endHour: 13, label: "Member block" },
    ];
  }

  return {
    courses,
    slots,
    users,
    bookings,
    alerts,
    notifications,
    accounts,
    pointsLedger,
    availability,
  };
}
