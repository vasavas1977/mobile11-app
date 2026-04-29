import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = loadStripe('pk_live_LPRLYiv99pAtQpPX5a7zhPDo00ZR2Ey9GK');
  }
  return stripePromise;
}
