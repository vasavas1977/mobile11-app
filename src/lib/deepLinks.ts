/**
 * deepLinks.ts
 *
 * Registers the Capacitor `appUrlOpen` listener and maps incoming URLs
 * (custom scheme `mobile11://` and universal links `https://mobile11.com/app/...`)
 * to React Router navigation.
 */

import { App, type URLOpenListenerEvent } from '@capacitor/app';
import { Browser } from '@capacitor/browser';

/**
 * Route map: pattern → handler that returns a React Router path.
 * Patterns are matched against the URL pathname.
 */
interface DeepLinkRoute {
  /** Regex to match against the path portion of the URL */
  pattern: RegExp;
  /** Build the internal route from regex match groups */
  buildRoute: (match: RegExpMatchArray, params: URLSearchParams) => string;
  /** Optional: run side effects before navigation */
  beforeNavigate?: (match: RegExpMatchArray, params: URLSearchParams) => Promise<void>;
}

const routes: DeepLinkRoute[] = [
  // mobile11://esim/:id  →  /my-esims/:id
  {
    pattern: /^\/esim\/([^/?]+)/,
    buildRoute: (m) => `/my-esims/${m[1]}`,
  },
  // mobile11://order/:id  →  /order/:id
  {
    pattern: /^\/order\/([^/?]+)/,
    buildRoute: (m) => `/order/${m[1]}`,
  },
  // mobile11://topup/:id  →  /my-esims/:id?action=topup
  {
    pattern: /^\/topup\/([^/?]+)/,
    buildRoute: (m) => `/my-esims/${m[1]}?action=topup`,
  },
  // mobile11://payment-return?orderId=xxx  →  /order/:orderId (+ close browser)
  {
    pattern: /^\/payment-return/,
    buildRoute: (_m, params) => `/order/${params.get('orderId') ?? ''}`,
    beforeNavigate: async () => {
      try {
        await Browser.close();
      } catch {
        // Browser may already be closed
      }
    },
  },
];

export type NavigateFn = (path: string) => void;

/**
 * Initialize deep-link listener. Call once from `main.tsx` when
 * `Capacitor.isNativePlatform()` is true.
 *
 * @param navigate - React Router navigate function
 */
export function initDeepLinks(navigate: NavigateFn): void {
  App.addListener('appUrlOpen', async (event: URLOpenListenerEvent) => {
    const url = event.url;
    console.log('[deepLinks] appUrlOpen:', url);

    let pathname: string;
    let params: URLSearchParams;

    try {
      // Handle both custom scheme and https universal links
      if (url.startsWith('mobile11://')) {
        // Parse custom scheme: mobile11://payment-return?orderId=abc
        const withoutScheme = url.replace('mobile11:/', '');
        const parsed = new URL(`https://placeholder${withoutScheme}`);
        pathname = parsed.pathname;
        params = parsed.searchParams;
      } else {
        // Universal link: https://mobile11.com/app/esim/123
        const parsed = new URL(url);
        pathname = parsed.pathname.replace(/^\/app/, ''); // strip /app prefix
        params = parsed.searchParams;
      }
    } catch (err) {
      console.error('[deepLinks] Failed to parse URL:', url, err);
      return;
    }

    for (const route of routes) {
      const match = pathname.match(route.pattern);
      if (match) {
        if (route.beforeNavigate) {
          await route.beforeNavigate(match, params);
        }
        const target = route.buildRoute(match, params);
        console.log('[deepLinks] Navigating to:', target);
        navigate(target);
        return;
      }
    }

    console.warn('[deepLinks] No matching route for:', pathname);
  });
}

/**
 * Clean up deep-link listeners (call on unmount if needed).
 */
export function removeDeepLinks(): void {
  App.removeAllListeners();
}
