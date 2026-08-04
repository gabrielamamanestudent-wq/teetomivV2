// ============================================================================
// PaymentProvider — the app only ever touches this interface, so the deposit
// processor can be swapped later. Green fees are NEVER processed here; this is
// exclusively the $10 refundable booking fee.
//
// Two flows are supported:
//   • Instant authorize/refund — used by the mock provider (zero-config demo)
//     and whenever the amount due is $0 (tier fee-waiver or TeeCredit covers it).
//   • Hosted Checkout — used by real Stripe: redirect the golfer to a
//     Stripe-hosted page (PCI-safe, no raw card data ever touches our servers),
//     then finalize the booking on return.
// ============================================================================

export interface AuthorizeResult {
  paymentIntentId: string;
  status: "authorized";
  amountCents: number;
  mock: boolean;
}

export interface RefundResult {
  paymentIntentId: string;
  status: "refunded";
  mock: boolean;
}

export interface CheckoutSession {
  url: string; // where to redirect the golfer to pay
  sessionId: string;
  mock: boolean;
}

export interface CheckoutStatus {
  paid: boolean;
  paymentIntentId: string | null;
  metadata: Record<string, string>;
}

export interface PaymentProvider {
  /** Instant hold of the booking fee (mock / $0 paths). */
  authorizeDeposit(params: {
    amountCents: number;
    golferEmail: string;
    reference: string;
  }): Promise<AuthorizeResult>;

  /** Release the fee back to the golfer (used by check-in / free cancel / refill). */
  refundDeposit(paymentIntentId: string): Promise<RefundResult>;

  /** Create a hosted Checkout session for the booking fee (real Stripe path). */
  createFeeCheckout(params: {
    amountCents: number;
    golferEmail: string;
    successUrl: string; // must contain the literal {CHECKOUT_SESSION_ID}
    cancelUrl: string;
    metadata: Record<string, string>;
  }): Promise<CheckoutSession>;

  /** Read back a Checkout session on return to confirm payment + recover metadata. */
  retrieveFeeCheckout(sessionId: string): Promise<CheckoutStatus>;

  readonly isMock: boolean;
}
