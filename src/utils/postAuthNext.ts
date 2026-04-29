/**
 * Utilities for managing post-authentication redirect paths.
 * Ensures consistent behavior across all OAuth providers (Google, Facebook, LINE).
 */

const STORAGE_KEY = 'post_auth_next';

/**
 * Gets the current path including search params (e.g., /cart?items=...&lang=th)
 */
export function getCurrentPathWithSearch(): string {
  return window.location.pathname + window.location.search;
}

/**
 * Stores the path to redirect to after authentication.
 * Sanitizes the path to ensure it starts with '/'.
 */
export function setPostAuthNext(path: string): void {
  // Ensure path starts with '/' for security (prevent open redirects)
  const sanitizedPath = path.startsWith('/') ? path : `/${path}`;
  sessionStorage.setItem(STORAGE_KEY, sanitizedPath);
}

/**
 * Stores the path only if one isn't already set.
 * Use this in OAuth initiation to avoid overwriting a previously set target.
 */
export function setPostAuthNextIfMissing(fallbackPath?: string): void {
  const existing = sessionStorage.getItem(STORAGE_KEY);
  if (!existing && fallbackPath) {
    setPostAuthNext(fallbackPath);
  }
}

/**
 * Retrieves and removes the post-auth redirect path.
 * Returns the default path if none was stored.
 */
export function consumePostAuthNext(defaultTo: string = '/'): string {
  const path = sessionStorage.getItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  
  // Never return deprecated routes (including sub-paths like /dashboard/settings)
  if (path === '/dashboard' || path?.startsWith('/dashboard/')) {
    return defaultTo;
  }
  
  return path || defaultTo;
}

/**
 * Checks if a post-auth redirect path is stored.
 */
export function hasPostAuthNext(): boolean {
  return sessionStorage.getItem(STORAGE_KEY) !== null;
}
