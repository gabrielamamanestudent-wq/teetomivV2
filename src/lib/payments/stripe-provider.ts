import type {
  AuthorizeResult,
  CheckoutSession,
  CheckoutStatus,
  PaymentProvider,
  RefundResult,
} from "./provider";

/**
 * Stripe deposit provider. Talks to Stripe's REST API directly (no SDK
 * dependency). The production path is hosted Checkout: the golfer is redirected
 * to a Stripe-hosted payment page, so raw card data never touches our servers
 * (PCI-safe). We refund the $10 fee on check-in / free-cancel / refill.
 *
 * Works in test mode with no business/bank setup — flip STRIPE_SECRET_KEY from a
 * test key (sk_test_…) to a live key (sk_live_…) once the go-live gate clears.
 */
export class StripePaymentProvider implements PaymentProvider {
  readonly isMock = false;
  private readonly secret: string;
  private readonly base = "https://api.stripe.com/v1";

  constructor(secret: string) {
    this.secret = secret;
  }

  private headers() {
    return {
      Authorization: `Bearer ${this.secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    };
  }

  private async post(path: string, body: Record<string, string>): Promise<any> {
    const res = await fetch(`${this.base}/${path}`, {
      method: "POST",
      headers: this.headers(),
      body: new URLSearchParams(body).toString(),
    });
    if (!res.ok) throw new Error(`Stripe error ${res.status}: ${await res.text()}`);
    return res.json();
  }

  private async get(path: string): Promise<any> {
    const res = await fetch(`${this.base}/${path}`, { headers: this.headers() });
    if (!res.ok) throw new Error(`Stripe error ${res.status}: ${await res.text()}`);
    return res.json();
  }

  async authorizeDeposit(params: {
    amountCents: number;
    golferEmail: string;
    reference: string;
  }): Promise<AuthorizeResult> {
    // Used only for $0 / server-side paths; the real card flow uses Checkout.
    const intent = await this.post("payment_intents", {
      amount: String(params.amountCents),
      currency: "cad",
      "payment_method_types[]": "card",
      receipt_email: params.golferEmail,
      description: `TEETOMIC booking fee — ${params.reference}`,
    });
    return {
      paymentIntentId: intent.id,
      status: "authorized",
      amountCents: params.amountCents,
      mock: false,
    };
  }

  async refundDeposit(paymentIntentId: string): Promise<RefundResult> {
    await this.post("refunds", { payment_intent: paymentIntentId });
    return { paymentIntentId, status: "refunded", mock: false };
  }

  async createFeeCheckout(params: {
    amountCents: number;
    golferEmail: string;
    successUrl: string;
    cancelUrl: string;
    metadata: Record<string, string>;
  }): Promise<CheckoutSession> {
    const body: Record<string, string> = {
      mode: "payment",
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      customer_email: params.golferEmail,
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": "cad",
      "line_items[0][price_data][unit_amount]": String(params.amountCents),
      "line_items[0][price_data][product_data][name]": "TEETOMIC booking fee",
      "line_items[0][price_data][product_data][description]":
        "Refundable — returned as TeeCredit at check-in.",
      "payment_intent_data[description]": "TEETOMIC $10 booking fee",
    };
    for (const [k, v] of Object.entries(params.metadata)) {
      body[`metadata[${k}]`] = v;
      body[`payment_intent_data[metadata][${k}]`] = v;
    }
    const session = await this.post("checkout/sessions", body);
    return { url: session.url, sessionId: session.id, mock: false };
  }

  async retrieveFeeCheckout(sessionId: string): Promise<CheckoutStatus> {
    const s = await this.get(`checkout/sessions/${sessionId}`);
    return {
      paid: s.payment_status === "paid",
      paymentIntentId: typeof s.payment_intent === "string" ? s.payment_intent : null,
      metadata: s.metadata ?? {},
    };
  }

  async createSubscriptionCheckout(params: {
    priceId: string;
    golferId: string;
    golferEmail: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<CheckoutSession> {
    const body: Record<string, string> = {
      mode: "subscription",
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      customer_email: params.golferEmail,
      "line_items[0][price]": params.priceId,
      "line_items[0][quantity]": "1",
      "metadata[golferId]": params.golferId,
      "subscription_data[metadata][golferId]": params.golferId,
    };
    const session = await this.post("checkout/sessions", body);
    return { url: session.url, sessionId: session.id, mock: false };
  }
}
