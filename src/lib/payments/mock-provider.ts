import type {
  AuthorizeResult,
  CheckoutSession,
  CheckoutStatus,
  PaymentProvider,
  RefundResult,
} from "./provider";

/**
 * Offline fee provider — always succeeds. Used whenever no Stripe secret key is
 * configured so the entire booking → fee → refund flow works with zero setup and
 * offline from Stripe. The app uses the instant authorize path for the mock, so
 * the Checkout methods here exist only to satisfy the interface.
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly isMock = true;

  async authorizeDeposit(params: {
    amountCents: number;
    golferEmail: string;
    reference: string;
  }): Promise<AuthorizeResult> {
    return {
      paymentIntentId: `pi_mock_${params.reference}_${Date.now()}`,
      status: "authorized",
      amountCents: params.amountCents,
      mock: true,
    };
  }

  async refundDeposit(paymentIntentId: string): Promise<RefundResult> {
    return { paymentIntentId, status: "refunded", mock: true };
  }

  async createFeeCheckout(params: {
    successUrl: string;
  }): Promise<CheckoutSession> {
    const sessionId = `cs_mock_${Date.now()}`;
    return {
      url: params.successUrl.replace("{CHECKOUT_SESSION_ID}", sessionId),
      sessionId,
      mock: true,
    };
  }

  async retrieveFeeCheckout(sessionId: string): Promise<CheckoutStatus> {
    return { paid: true, paymentIntentId: `pi_mock_${sessionId}`, metadata: {} };
  }

  async createSubscriptionCheckout(params: {
    successUrl: string;
  }): Promise<CheckoutSession> {
    // Demo mode never redirects to Stripe; the account route flips the flag
    // directly. This stub only exists to satisfy the interface.
    const sessionId = `cs_mock_sub_${Date.now()}`;
    return {
      url: params.successUrl.replace("{CHECKOUT_SESSION_ID}", sessionId),
      sessionId,
      mock: true,
    };
  }
}
