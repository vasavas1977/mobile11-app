/**
 * Detects if the user is browsing from an in-app browser (e.g., Facebook, Instagram, LINE, etc.)
 * These browsers often have limitations with OAuth redirects and app deep-linking.
 */
export const isInAppBrowser = (): boolean => {
  const ua = navigator.userAgent || '';
  // Common in-app browser patterns
  return /FBAN|FBAV|Instagram|Line\/|Twitter|TikTok|Snapchat|Pinterest|LinkedIn|WebView|wv\)/i.test(ua);
};

/**
 * Gets a user-friendly name for the detected in-app browser
 */
export const getInAppBrowserName = (): string | null => {
  const ua = navigator.userAgent || '';
  
  if (/FBAN|FBAV/i.test(ua)) return 'Facebook';
  if (/Instagram/i.test(ua)) return 'Instagram';
  if (/Line\//i.test(ua)) return 'LINE';
  if (/Twitter/i.test(ua)) return 'Twitter';
  if (/TikTok/i.test(ua)) return 'TikTok';
  if (/Snapchat/i.test(ua)) return 'Snapchat';
  if (/Pinterest/i.test(ua)) return 'Pinterest';
  if (/LinkedIn/i.test(ua)) return 'LinkedIn';
  
  return null;
};

/**
 * Detects if the app is running as an installed PWA (standalone mode)
 */
export const isPWA = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches 
    || (window.navigator as any).standalone === true;
};

/**
 * Detects if the user is on a desktop device (not mobile)
 */
export const isDesktop = (): boolean => {
  const ua = navigator.userAgent.toLowerCase();
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
  return !isMobile;
};
