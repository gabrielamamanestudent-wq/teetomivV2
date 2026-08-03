import type { PaymentProvider } from "./provider";
import { MockPaymentProvider } from "./mock-provider";
import { StripePaymentProvider } from "./stripe-provider";

let provider: PaymentProvider | null = null;

/** Returns Stripe test-mode provider when a key is set, else the mock. */
export function getPaymentProvider(): PaymentProvider {
  if (provider) return provider;
  const key = process.env.STRIPE_SECRET_KEY;
  provider = key ? new StripePaymentProvider(key) : new MockPaymentProvider();
  return provider;
}

export * from "./provider";
