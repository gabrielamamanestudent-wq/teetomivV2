import type {
  AuthorizeResult,
  PaymentProvider,
  RefundResult,
} from "./provider";

/**
 * Offline deposit provider — always succeeds. Used whenever no Stripe secret
 * key is configured so the entire booking → deposit → refund flow works with
 * zero setup and offline from Stripe.
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
}
