// ============================================================================
// PaymentProvider — the app only ever touches this interface, so the deposit
// processor can be swapped later. Green fees are NEVER processed here; this is
// exclusively the $15 refundable deposit (authorize / capture / refund).
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

export interface PaymentProvider {
  /** Hold the refundable deposit. */
  authorizeDeposit(params: {
    amountCents: number;
    golferEmail: string;
    reference: string;
  }): Promise<AuthorizeResult>;

  /** Release the held deposit back to the golfer (check-in / free cancel / refill). */
  refundDeposit(paymentIntentId: string): Promise<RefundResult>;

  readonly isMock: boolean;
}
