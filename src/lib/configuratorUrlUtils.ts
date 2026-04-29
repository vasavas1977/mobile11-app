/**
 * Configurator URL Utilities
 * Generates shareable deep links for configurator states
 */

export interface ConfiguratorUrlState {
  country: string;
  isRegional: boolean;
  carrier?: string; // Selected carrier name (e.g., "Softbank / KDDI", "DOCOMO")
  type?: string; // limitless, max_speed, day_pass
  days?: number;
  option?: string; // data amount, speed, daily data
  speed?: string; // backup speed for day_pass (e.g., 256kbps, 384kbps, 1mbps)
  qty?: number;
  view?: 'simple' | 'full';
  tier?: 'priority' | 'economy';
}

/**
 * Generate a shareable URL from configurator state
 */
export function generateConfiguratorUrl(state: ConfiguratorUrlState): string {
  const params = new URLSearchParams();
  
  // Add country/regional param
  if (state.isRegional) {
    params.set('regional', state.country);
  } else {
    params.set('country', state.country);
  }
  
  // Add configurator state
  if (state.carrier) params.set('carrier', state.carrier);
  if (state.type) params.set('type', state.type);
  if (state.days) params.set('days', String(state.days));
  if (state.option) params.set('option', state.option);
  if (state.speed) params.set('speed', state.speed);
  if (state.qty && state.qty > 1) params.set('qty', String(state.qty));
  if (state.view) params.set('view', state.view);
  if (state.tier) params.set('tier', state.tier);
  
  const baseUrl = window.location.origin;
  return `${baseUrl}/packages?${params.toString()}`;
}

/**
 * Parse URL params into configurator state
 */
export function parseConfiguratorUrl(searchParams: URLSearchParams): Partial<ConfiguratorUrlState> {
  const country = searchParams.get('country');
  const regional = searchParams.get('regional');
  
  const state: Partial<ConfiguratorUrlState> = {};
  
  if (country) {
    state.country = country;
    state.isRegional = false;
  } else if (regional) {
    state.country = regional;
    state.isRegional = true;
  }
  
  const carrier = searchParams.get('carrier');
  if (carrier) state.carrier = carrier;
  
  const type = searchParams.get('type');
  if (type && ['limitless', 'max_speed', 'day_pass'].includes(type)) {
    state.type = type;
  }
  
  const days = searchParams.get('days');
  if (days) {
    const daysNum = parseInt(days, 10);
    if (!isNaN(daysNum) && daysNum > 0) {
      state.days = daysNum;
    }
  }
  
  const option = searchParams.get('option');
  if (option) state.option = option;
  
  const speed = searchParams.get('speed');
  if (speed) {
    // Accept any valid speed pattern (e.g., 256kbps, 384kbps, 1mbps, 2mbps)
    const normalizedSpeed = speed.toLowerCase().replace(/\s+/g, '');
    const speedMatch = normalizedSpeed.match(/^(\d+(?:\.\d+)?)(k|m)bps$/);
    if (speedMatch) {
      state.speed = `${speedMatch[1]}${speedMatch[2]}bps`;
    }
  }
  
  const qty = searchParams.get('qty');
  if (qty) {
    const qtyNum = parseInt(qty, 10);
    if (!isNaN(qtyNum) && qtyNum > 0) {
      state.qty = qtyNum;
    }
  }
  
  const view = searchParams.get('view');
  if (view && ['simple', 'full'].includes(view)) {
    state.view = view as 'simple' | 'full';
  }
  
  const tier = searchParams.get('tier');
  if (tier && ['priority', 'economy'].includes(tier)) {
    state.tier = tier as 'priority' | 'economy';
  }
  
  return state;
}

/**
 * Debounced URL update using history.replaceState
 * Updates URL without triggering navigation or re-renders
 */
let urlUpdateTimeout: ReturnType<typeof setTimeout> | null = null;

export function debouncedUrlUpdate(state: ConfiguratorUrlState, delay: number = 300): void {
  if (urlUpdateTimeout) {
    clearTimeout(urlUpdateTimeout);
  }
  
  urlUpdateTimeout = setTimeout(() => {
    const params = new URLSearchParams();
    
    // Add country/regional param
    if (state.isRegional) {
      params.set('regional', state.country);
    } else {
      params.set('country', state.country);
    }
    
    // Add configurator state
    if (state.carrier) params.set('carrier', state.carrier);
    if (state.type) params.set('type', state.type);
    if (state.days) params.set('days', String(state.days));
    if (state.option) params.set('option', state.option);
    if (state.speed) params.set('speed', state.speed);
    if (state.qty && state.qty > 1) params.set('qty', String(state.qty));
    if (state.view) params.set('view', state.view);
    if (state.tier) params.set('tier', state.tier);
    
    const newUrl = `/packages?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
    
    urlUpdateTimeout = null;
  }, delay);
}

/**
 * Copy text to clipboard with fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Modern clipboard API
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
