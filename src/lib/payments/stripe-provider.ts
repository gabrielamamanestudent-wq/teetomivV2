import type {
  AuthorizeResult,
  PaymentProvider,
  RefundResult,
} from "./provider";

/**
 * Stripe test-mode deposit provider. Talks to Stripe's REST API directly (no
 * SDK dependency) to authorize/capture and refund the $15 deposit. Only used
 * when STRIPE_SECRET_KEY is present; otherwise the mock provider takes over.
 *
 * Note: for the deposit we create-and-confirm a PaymentIntent with the test
 * card via a PaymentMethod token so the live demo works with 4242 4242…, and
 * refund it on check-in / free-cancel / refill.
 */
export class StripePaymentProvider implements PaymentProvider {
  readonly isMock = false;
  private readonly secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  private async call(path: string, body: Record<string, string>): Promise<any> {
    const res = await fetch(`https://api.stripe.com/v1/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(body).toString(),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Stripe error ${res.status}: ${text}`);
    }
    return res.json();
  }

  async authorizeDeposit(params: {
    amountCents: number;
    golferEmail: string;
    reference: string;
  }): Promise<AuthorizeResult> {
    const intent = await this.call("payment_intents", {
      amount: String(params.amountCents),
      currency: "cad",
      "payment_method_types[]": "card",
      payment_method: "pm_card_visa", // Stripe test PaymentMethod (4242…)
      confirm: "true",
      capture_method: "automatic",
      receipt_email: params.golferEmail,
      description: `TEETOMIC refundable deposit — ${params.reference}`,
    });
    return {
      paymentIntentId: intent.id,
      status: "authorized",
      amountCents: params.amountCents,
      mock: false,
    };
  }

  async refundDeposit(paymentIntentId: string): Promise<RefundResult> {
    await this.call("refunds", { payment_intent: paymentIntentId });
    return { paymentIntentId, status: "refunded", mock: false };
  }
}
