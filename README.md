# 🏌️ TEETOMIC

**Montreal's standby list for golf.** A last-minute tee-time marketplace: when a
foursome cancels at 6pm for a 7am slot, that inventory shouldn't die. Courses
push cancellations and unsold slots to golfers who set alerts, with transparent
dynamic pricing. The course keeps the green fee — TEETOMIC runs on a flat SaaS
fee, never a barter/trade model.

> **Payment model — pay at the course, deposit online.** Golfers never prepay
> green fees. A booking takes only a **$15 CAD refundable deposit per booking**
> to prevent no-shows. The green fee is paid directly at the pro shop. The
> deposit is refunded automatically at check-in (or when a late-cancelled slot
> gets re-filled), and forfeited only per the cancellation policy.

This build is **demo-ready** and runs with **zero configuration** — no Supabase,
Stripe, or email keys required. Every integration falls back to a local mock
behind the same interface.

---

## Quick start

```bash
npm install
npm run dev
# open http://localhost:3000
```

That's it. The in-memory data layer seeds 8 fictional Montreal courses, ~70
tee-time slots across the next 3 days, demo accounts, and bookings covering every
deposit state — automatically, on first request.

Useful scripts:

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the app (mock data layer, hot reload) |
| `npm run build` / `npm start` | Production build & serve |
| `npm run seed` | Print a summary of the demo seed + credentials |
| `npm test` | Run the pricing & policy unit tests (Vitest) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | Next/ESLint |

---

## Demo accounts

Printed by `npm run seed` and on the in-app **`/demo`** cheat-sheet page.

| Role | Email | Password | Note |
| --- | --- | --- | --- |
| Golfer | `alex@demo.golf` | `golf1234` | Has alerts + a booking pending check-in today |
| Golfer | `marie@demo.golf` | `golf1234` | Refund-on-refill example |
| Golfer | `sam@demo.golf` | `golf1234` | Forfeited no-show example |
| Operator | `operator@demo.golf` | `shop1234` | Héron Bleu pro shop dashboard |
| Admin | `admin@demo.golf` | `admin1234` | Internal metrics + demo reset |

> For the live pitch you don't even need to log in: the **avatar in the header**
> switches the active demo golfer instantly.

---

## 🎬 The 90-second live demo script

Also rendered (bilingual) at **`/demo`**.

1. **0:00 — Landing.** Open `/`. Point at the live ticker of just-released deals
   and the "$15 refundable deposit — pay your green fee at the course" promise.
2. **0:10 — Browse.** Tap **Browse deals**, filter to *Dawn patrol* + your
   region. The countdown badges tick live.
3. **0:25 — Deal.** Open a deal card. Show the struck-through rack price vs. the
   live price, pick **2 players**, tap **Reserve**.
4. **0:35 — Deposit.** On the deposit screen say *"only $15 now, green fee is
   paid at the course."* Pay with test card **4242 4242 4242 4242**. Land on the
   **QR confirmation** — note the exact free-cancellation time.
5. **0:55 — Operator.** Switch to the **Pro shop** tab. Tap an open slot →
   accept the **suggested price** (see the decay preview graph) → **Push to
   TEETOMIC**. Watch *"N alert-holders notified."*
6. **1:15 — Check-in.** Open the **Check-in queue**, tap **Checked in** on a
   booking → the **deposit auto-refunds** in front of the audience.
7. **1:25 — Retention hook.** Flip to **Stats**: *"$1,240 of dead inventory
   recovered this month."* Done.

The golfer booking flow completes in **under 45 seconds** and the operator
one-tap release in **under 10 seconds** — those two flows are the pitch.

---

## Feature map

**Golfer (mobile web)**
- Landing page with hero, live deal ticker, how-it-works, social proof, course grid
- Browse/search with list + map toggle (static-map fallback when no Mapbox token),
  filters for time window, region, max price, holes
- Deal cards: photo, struck-through rack price, live price, live countdown, spots left
- Booking flow: slot → players → **$15 refundable deposit** (Stripe test or mock) →
  QR confirmation + email, with exact "pay $X/player at the pro shop" and exact
  free-cancellation time
- **Standby alerts**: day/time-window/region/max-price, in-app pings (polling) + email
- My bookings: upcoming/past, cancel with live deadline & deposit status, re-book

**Operator (pro shop)**
- **One-tap slot release** with suggested dynamic price, floor price, and a
  Recharts price-decay preview graph
- 7-day color-coded tee-sheet layer (booked / released / unlisted)
- **Check-in queue** with one-tap check-in that auto-refunds the deposit
- Payouts & stats: gross bookings, TEETOMIC fee ($199/mo + $1/booking, display
  only), **dead-inventory recovered**, no-show rate, forfeited-deposit share

**Admin**
- GMV, bookings, active alerts, courses, conversion funnel chart, deposit-state
  breakdown, and a **Demo reset** button that reseeds everything

---

## Deposit & cancellation policy

Implemented as a **pure, unit-tested** module (`src/lib/policy.ts`):

- **$15 CAD refundable deposit per booking** (not per player).
- Tiered free-cancellation window, from booking time vs. tee time:
  - Booked **> 24h** before tee time → free cancellation until **12h** before.
  - Booked **within 24h** of tee time → free cancellation until **4h** before.
- Cancel inside the window (or no-show) → deposit forfeited, split **50/50**
  course / TEETOMIC (display only).
- **Refund-on-refill**: a late cancel is refunded automatically if the slot
  re-books through TEETOMIC before tee time — the golfer is notified.
- Check-in triggers the refund. **No-shows auto-forfeit 1h after tee time.**
- All deadlines are shown to golfers as **exact America/Toronto local times**.

## Dynamic pricing engine

Also **pure and unit-tested** (`src/lib/pricing.ts`). Transparent decay ladder off
the rack rate: **15%** at 48h → **25%** at 24h → **40%** at 12h → **50%** at 3h →
up to **60%** in the final hours. Never below the operator's floor. Weekend
7–10am **premium** slots decay slower; rain and low fill deepen the discount.

Run the tests:

```bash
npm test
# 36 tests across the decay curve, floor price, premium rules,
# both cancellation tiers, boundaries, refund-on-refill, and no-show forfeit.
```

---

## Architecture

```
src/
  app/
    (pages)        landing, browse, deal, book, booking, alerts, my-bookings,
                   operator, admin, demo
    api/           route handlers (Zod-validated) over the repository
  components/      Header, DealCard, Countdown, PriceDecayChart, QRCode, ui, …
  lib/
    pricing.ts     pure dynamic pricing engine (+ pricing.test.ts)
    policy.ts      pure deposit/cancellation policy (+ policy.test.ts)
    time.ts        America/Toronto formatting, countdowns
    i18n/          bilingual EN/FR dictionary + provider (no hardcoded copy)
    data/          types, Repository interface, MockRepository, seed
    payments/      PaymentProvider interface, Mock + Stripe implementations
    email.ts       Resend or console-log fallback
```

**Swappable layers** — the app only ever imports the interfaces:

- **Data**: `getRepository()` returns the in-memory `MockRepository`; a Supabase
  implementation satisfies the same `Repository` interface. State for the mock
  lives on `globalThis` so it persists across dev requests.
- **Payments**: `getPaymentProvider()` returns `StripePaymentProvider` when
  `STRIPE_SECRET_KEY` is set (test-mode authorize/capture + refund of the $15
  deposit only), otherwise `MockPaymentProvider` (always succeeds, offline).
- **Email**: Resend when `RESEND_API_KEY` is set, else logged to the console.

---

## Optional integrations

Copy `.env.example` → `.env.local` and fill in only what you want. Everything is
optional; missing keys fall back to mocks.

- **Stripe (test mode)** — `STRIPE_SECRET_KEY`,
  `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`. Used **only** for the $15 deposit. Test
  card `4242 4242 4242 4242`.
- **Supabase** — `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` for a
  real Postgres/Auth/Realtime backend.
- **Resend** — `RESEND_API_KEY`, `EMAIL_FROM` for real confirmation emails.
- **Mapbox** — `NEXT_PUBLIC_MAPBOX_TOKEN` to upgrade the browse map from the
  static fallback.
- `DEMO_MODE` (default `true`) seeds the demo data.

---

## Deploy to Vercel

```bash
npm i -g vercel   # if needed
vercel            # follow prompts, or:
vercel --prod
```

No environment variables are required to deploy the demo — it ships with the
mock data layer. Add the optional keys above in the Vercel dashboard to wire real
services. The app is mobile-first and tuned to look flawless at **390px** width.

---

## Notes

- Course names, logos, and photos are **fictional / royalty-free** — no real
  course branding is used.
- The `$199/mo + $1/booking` fee, 50/50 forfeit split, and payout figures are
  **display-only** — there is no real billing or ledger in demo mode.
