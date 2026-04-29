import { differenceInDays, format, parseISO, isAfter } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

/**
 * Calculate remaining days from validUntil date
 */
export function calculateRemainingDays(validUntil: string | null): number | null {
  if (!validUntil) return null;
  
  try {
    const endDate = parseISO(validUntil);
    const now = new Date();
    
    if (isAfter(now, endDate)) {
      return 0; // Expired
    }
    
    const remaining = differenceInDays(endDate, now);
    return Math.max(0, remaining + 1); // +1 because current day counts
  } catch {
    return null;
  }
}

/**
 * Calculate validity percentage (remaining days / total days)
 */
export function calculateValidityPercentage(
  validFrom: string | null, 
  validUntil: string | null
): number {
  if (!validFrom || !validUntil) return 100;
  
  try {
    const startDate = parseISO(validFrom);
    const endDate = parseISO(validUntil);
    const now = new Date();
    
    const totalDays = differenceInDays(endDate, startDate);
    if (totalDays <= 0) return 0;
    
    const remainingDays = differenceInDays(endDate, now);
    if (remainingDays <= 0) return 0;
    
    return Math.min(100, Math.max(0, (remainingDays / totalDays) * 100));
  } catch {
    return 100;
  }
}

/**
 * Format expiry date for display (e.g., "Jan 12", "Jan 12, 2025", or "Jan 12, 15:30")
 */
export function formatExpiryDate(
  validUntil: string | null, 
  locale: string = 'en',
  includeYear: boolean = false,
  includeTime: boolean = false
): string {
  if (!validUntil) return '';
  
  try {
    const date = parseISO(validUntil);
    const now = new Date();
    const sameYear = date.getFullYear() === now.getFullYear();
    
    // Build format string
    let dateFormat = sameYear && !includeYear ? 'MMM d' : 'MMM d, yyyy';
    
    // Add time if requested
    if (includeTime) {
      dateFormat += ', HH:mm';
    }
    
    return format(date, dateFormat);
  } catch {
    return '';
  }
}

/**
 * Parse data amount string to MB for calculations
 */
export function parseDataToMB(dataStr: string | null): number | null {
  if (!dataStr) return null;
  
  const match = dataStr.match(/^([\d.]+)\s*(GB|MB|TB)/i);
  if (!match) return null;
  
  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  
  switch (unit) {
    case 'TB': return value * 1024 * 1024;
    case 'GB': return value * 1024;
    case 'MB': return value;
    default: return null;
  }
}

/**
 * Calculate data usage percentage
 */
export function calculateDataPercentage(
  remainingData: string | null,
  totalData: string | null
): number {
  const remaining = parseDataToMB(remainingData);
  const total = parseDataToMB(totalData);
  
  if (remaining === null || total === null || total === 0) return 100;
  
  return Math.min(100, Math.max(0, (remaining / total) * 100));
}

/**
 * Check if eSIM is expired
 */
export function isEsimExpired(validUntil: string | null): boolean {
  if (!validUntil) return false;
  
  try {
    const endDate = parseISO(validUntil);
    return isAfter(new Date(), endDate);
  } catch {
    return false;
  }
}
