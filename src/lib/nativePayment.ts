/**
 * nativePayment.ts
 *
 * Native payment integration for Mobile11:
 * 1. Stripe Payment Sheet (Apple Pay / Google Pay / cards)
 * 2. 2C2P TrueMoney + PromptPay via in-app browser
 */

import { Capacitor } from '@capacitor/core';
import { Stripe } from '@capacitor-community/stripe';
import { Browser } from '@capacitor/browser';

// ─── Constants ──────────────────────────────────────────────────────
const STRIPE_PUBLISHABLE_KEY = 'pk_live_LPRLYiv99pAtQpPX5a7zhPDo00ZR2Ey9GK';
const APPLE_PAY_MERCHANT_ID = 'merchant.com.mobile11.app';
const MERCHANT_COUNTRY_CODE = 'TH';
const MERCHANT_DISPLAY_NAME = 'Mobile11';

// ─── Types ──────────────────────────────────────────────────────────
interface PaymentIntentResponse {
  clientSecret: string;
  customerId: string;
  ephemeralKey: string;
}

interface PaymentResult {
  success: boolean;
  error?: string;
}

type SupabaseInvokeFn = (
  functionName: string,
  options: { body: Record<string, unknown> },
) => Promise<{ data: PaymentIntentResponse; error: unknown }>;

// ─── Stripe initialization ──────────────────────────────────────────
let stripeInitialized = false;

export async function initStripe(): Promise<void> {
  if (stripeInitialized) return;
  if (!Capacitor.isNativePlatform()) return;

  await Stripe.initialize({
    publishableKey: STRIPE_PUBLISHABLE_KEY,
  });

  stripeInitialized = true;
  console.log('[nativePayment] Stripe initialized');
}

// ─── Stripe Payment Sheet ───────────────────────────────────────────

/**
 * Present the Stripe Payment Sheet (cards / Apple Pay / Google Pay).
 *
 * @param supabaseInvoke - `supabase.functions.invoke` bound function
 * @param orderDetails   - Order payload for the `create-payment-intent` edge function
 * @returns Payment result
 */
export async function presentStripePaymentSheet(
  supabaseInvoke: SupabaseInvokeFn,
  orderDetails: Record<string, unknown>,
): Promise<PaymentResult> {
  if (!Capacitor.isNativePlatform()) {
    return { success: false, error: 'Not on native platform' };
  }

  await initStripe();

  try {
    // 1. Create payment intent via Supabase edge function
    const { data, error } = await supabaseInvoke('create-payment-intent', {
      body: orderDetails,
    });

    if (error || !data) {
      return { success: false, error: `Failed to create payment intent: ${error}` };
    }

    const { clientSecret, customerId, ephemeralKey } = data;

    // 2. Create the payment sheet
    await Stripe.createPaymentSheet({
      paymentIntentClientSecret: clientSecret,
      customerId: customerId,
      customerEphemeralKeySecret: ephemeralKey,
      merchantDisplayName: MERCHANT_DISPLAY_NAME,
      applePay: {
        merchantId: APPLE_PAY_MERCHANT_ID,
        merchantCountryCode: MERCHANT_COUNTRY_CODE,
      },
      googlePay: {
        merchantCountryCode: MERCHANT_COUNTRY_CODE,
        testEnv: false,
      },
      style: 'alwaysLight',
      withZipCode: false,
    });

    // 3. Present the sheet
    const result = await Stripe.presentPaymentSheet();
    console.log('[nativePayment] Payment sheet result:', result);

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[nativePayment] Stripe error:', message);
    return { success: false, error: message };
  }
}

// ─── 2C2P TrueMoney / PromptPay (in-app browser) ───────────────────

type TwoC2PMethod = 'truemoney' | 'promptpay';

/**
 * Open a 2C2P payment flow in the in-app browser.
 *
 * @param supabaseInvoke - `supabase.functions.invoke` bound function
 * @param method         - `'truemoney'` or `'promptpay'`
 * @param orderDetails   - Order payload for the edge function
 * @returns The payment URL that was opened (for reference)
 */
export async function open2C2PPayment(
  supabaseInvoke: SupabaseInvokeFn,
  method: TwoC2PMethod,
  orderDetails: Record<string, unknown>,
): Promise<{ url: string } | { error: string }> {
  const functionName =
    method === 'truemoney' ? 'create-2c2p-truemoney' : 'create-2c2p-promptpay';

  const platform = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'

  try {
    const { data, error } = await supabaseInvoke(functionName, {
      body: {
        ...orderDetails,
        platform: platform === 'web' ? 'web' : `native-${platform}`,
      },
    }) as { data: { paymentUrl: string }; error: unknown };

    if (error || !data?.paymentUrl) {
      return { error: `Failed to create 2C2P payment: ${error}` };
    }

    // Open in-app browser (SFSafariViewController on iOS, Custom Tabs on Android)
    await Browser.open({
      url: data.paymentUrl,
      presentationStyle: 'popover',
      windowName: '_self',
    });

    return { url: data.paymentUrl };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[nativePayment] 2C2P error:', message);
    return { error: message };
  }
}

// ─── Helpers ────────────────────────────────────────────────────────

/** Check if running on a native platform */
export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

/** Get the current platform string */
export function getPlatform(): string {
  return Capacitor.getPlatform();
}
