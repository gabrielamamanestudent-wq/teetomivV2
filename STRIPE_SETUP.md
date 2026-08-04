# Enabling Stripe for the $10 booking fee

TEETOMIC only ever processes the **$10 booking fee** — never green fees. The
integration is already built behind the `PaymentProvider` interface and uses
**Stripe-hosted Checkout**, so raw card numbers never touch our servers (PCI-safe).

- **No `STRIPE_SECRET_KEY` set →** the app uses the mock provider: bookings
  complete instantly, offline from Stripe. This is the demo default — leave it
  this way for pitches.
- **`STRIPE_SECRET_KEY` set →** real Stripe. When a fee is actually due, the
  golfer is redirected to a Stripe Checkout page, and the booking is created on
  return once payment is confirmed. If the fee is $0 (Gold tier waives it, or
  TeeCredit covers it), it still books instantly with no redirect.

## Turn on TEST mode (no business/bank needed)

1. Create a Stripe account at [dashboard.stripe.com](https://dashboard.stripe.com).
   Leave it in **Test mode** (toggle, top-right).
2. Go to **Developers → API keys** and copy the **Secret key** (`sk_test_…`).
3. In **Vercel → your project → Settings → Environment Variables**, add:
   ```
   STRIPE_SECRET_KEY = sk_test_...
   ```
   (That's the only variable the fee flow needs. Add it for Production — and
   Preview if you want it on branch deploys.)
4. **Redeploy** (Deployments → ⋯ → Redeploy) so the new env var is picked up.
5. Test the flow with Stripe's test card:
   ```
   4242 4242 4242 4242   ·   any future expiry   ·   any CVC   ·   any postal code
   ```
   You'll be redirected to Stripe, pay the $10, and land back on the QR
   confirmation. The charge shows in your Stripe **Test mode → Payments**.

> ⚠️ **Never paste the secret key into chat, code, or git.** It lives only in
> Vercel's encrypted environment variables. Only the `sk_test_…`/`sk_live_…`
> secret key is needed server-side; no publishable key is required for this flow.

## Going LIVE (real money) — the gate

Do **not** switch to a live key until all of these are true (see the Launch
Playbook):

1. **A signed course with real tee-time inventory** — otherwise there's nothing
   real to sell.
2. **Business entity + bank account** — Stripe pays out to a business.
3. **Stripe live-mode activated** — business/identity verification (Stripe review).
4. **Published Terms, booking/cancellation policy, and privacy policy** (Québec
   Law 25 applies — you're collecting money and personal data).

When ready: swap `STRIPE_SECRET_KEY` to the `sk_live_…` key in Vercel and
redeploy. No code changes.

## Refunds & the deposit lifecycle

- **Free cancellation (inside the window):** the fee is refunded to the card
  (`refundDeposit`).
- **Check-in:** the $10 is returned as **TeeCredit** (store credit) + points —
  TEETOMIC keeps the cash, no card refund.
- **Late cancel / no-show:** the fee is kept (framed as "not earned back", not a
  penalty charge).

## Recommended next hardening (not required for test mode)

- Add a **Stripe webhook** (`checkout.session.completed`) so bookings finalize
  even if the golfer closes the tab before the redirect completes. The current
  return-page finalize covers the normal path; the webhook makes it bulletproof.
  Set `STRIPE_WEBHOOK_SECRET` when you add it.
