/**
 * Cart URL Utilities
 * Generates shareable deep links for cart states
 */

export interface CartUrlItem {
  packageId: string;
  quantity: number;
}

export interface CartUrlState {
  items: CartUrlItem[];
  promo?: string;
  language?: 'en' | 'th';
  currency?: 'USD' | 'THB';
  tier?: 'priority' | 'economy';
}

/**
 * Generate a shareable URL from cart state
 * Format: /cart?items=pkgId1:qty1,pkgId2:qty2&promo=CODE&lang=th&currency=THB
 */
export function generateCartUrl(
  items: CartUrlItem[], 
  promoCode?: string,
  language?: 'en' | 'th',
  currency?: 'USD' | 'THB',
  tier?: 'priority' | 'economy'
): string {
  const params = new URLSearchParams();
  
  if (items.length > 0) {
    const itemsParam = items
      .map(item => `${item.packageId}:${item.quantity}`)
      .join(',');
    params.set('items', itemsParam);
  }
  
  if (promoCode?.trim()) {
    params.set('promo', promoCode.trim());
  }
  
  if (language) {
    params.set('lang', language);
  }
  
  if (currency) {
    params.set('currency', currency);
  }
  
  if (tier === 'economy') {
    params.set('tier', 'economy');
  }
  
  const baseUrl = window.location.origin;
  return `${baseUrl}/cart?${params.toString()}`;
}

/**
 * Parse URL params into cart state
 */
export function parseCartUrl(searchParams: URLSearchParams): CartUrlState {
  const state: CartUrlState = { items: [] };
  
  const itemsParam = searchParams.get('items');
  if (itemsParam) {
    const itemParts = itemsParam.split(',');
    for (const part of itemParts) {
      const [packageId, qtyStr] = part.split(':');
      if (packageId) {
        const quantity = parseInt(qtyStr, 10) || 1;
        if (quantity > 0) {
          state.items.push({ packageId, quantity });
        }
      }
    }
  }
  
  const promo = searchParams.get('promo');
  if (promo?.trim()) {
    state.promo = promo.trim();
  }
  
  const lang = searchParams.get('lang');
  if (lang === 'en' || lang === 'th') {
    state.language = lang;
  }
  
  const currency = searchParams.get('currency');
  if (currency === 'USD' || currency === 'THB') {
    state.currency = currency;
  }
  
  const tier = searchParams.get('tier');
  if (tier === 'economy' || tier === 'priority') {
    state.tier = tier;
  }
  
  return state;
}

/**
 * Debounced URL update using history.replaceState
 * Updates URL without triggering navigation or re-renders
 */
let cartUrlUpdateTimeout: ReturnType<typeof setTimeout> | null = null;

export function debouncedCartUrlUpdate(
  items: CartUrlItem[], 
  promoCode?: string,
  language?: 'en' | 'th',
  currency?: 'USD' | 'THB',
  tier?: 'priority' | 'economy',
  delay: number = 300
): void {
  if (cartUrlUpdateTimeout) {
    clearTimeout(cartUrlUpdateTimeout);
  }
  
  cartUrlUpdateTimeout = setTimeout(() => {
    const params = new URLSearchParams();
    
    if (items.length > 0) {
      const itemsParam = items
        .map(item => `${item.packageId}:${item.quantity}`)
        .join(',');
      params.set('items', itemsParam);
    }
    
    if (promoCode?.trim()) {
      params.set('promo', promoCode.trim());
    }
    
    if (language) {
      params.set('lang', language);
    }
    
    if (currency) {
      params.set('currency', currency);
    }
    
    if (tier === 'economy') {
      params.set('tier', 'economy');
    }
    
    const paramsStr = params.toString();
    const newUrl = paramsStr ? `/cart?${paramsStr}` : '/cart';
    window.history.replaceState({}, '', newUrl);
    
    cartUrlUpdateTimeout = null;
  }, delay);
}

/**
 * Copy text to clipboard with fallback
 */
export async function copyCartUrlToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const success = document.execCommand('copy');
    textArea.remove();
    return success;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}
