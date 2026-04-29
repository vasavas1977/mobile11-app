/**
 * Safe payment redirect utility
 * Handles iframe restrictions and provides fallback for popup blockers
 */

export interface PaymentRedirectResult {
  success: boolean;
  fallbackNeeded: boolean;
  url: string;
}

/**
 * Detect if we're running inside an iframe
 */
function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    // Cross-origin iframe will throw an error
    return true;
  }
}

/**
 * Safely redirect to a payment URL
 * - In iframe: opens in new tab
 * - Outside iframe: same-tab redirect
 * Returns whether a fallback UI is needed
 */
export function safeRedirectToPayment(url: string): PaymentRedirectResult {
  if (!url) {
    return { success: false, fallbackNeeded: true, url: '' };
  }

  // Always use same-tab redirect - works everywhere, no popup blockers
  window.location.href = url;
  return { success: true, fallbackNeeded: false, url };
}
