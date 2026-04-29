/**
 * Currency formatting utilities for USD, THB, JPY, KRW, EUR, CAD, AUD
 */

export type Currency = 'USD' | 'THB' | 'JPY' | 'KRW' | 'EUR' | 'CAD' | 'AUD' | 'CNY' | 'BRL' | 'SAR';

// Exchange rates (approximate, from 1 USD)
export const EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1,
  THB: 35,
  JPY: 150,
  KRW: 1350,
  EUR: 0.92,
  CAD: 1.37,
  AUD: 1.55,
  CNY: 7.25,
  BRL: 5.0,
  SAR: 3.75,
};

// Currencies that use whole numbers (no decimals)
const WHOLE_NUMBER_CURRENCIES: Currency[] = ['THB', 'JPY', 'KRW', 'CNY', 'BRL'];

/**
 * Convert USD price to target currency
 */
export function convertUsdTo(usdPrice: number, currency: Currency): number {
  const rate = EXCHANGE_RATES[currency];
  const converted = usdPrice * rate;
  return WHOLE_NUMBER_CURRENCIES.includes(currency) ? Math.round(converted) : converted;
}

// Legacy helpers
export const USD_TO_THB_RATE = EXCHANGE_RATES.THB;

export function convertUsdToThb(usdPrice: number): number {
  return Math.round(usdPrice * USD_TO_THB_RATE);
}

export function convertThbToUsd(thbPrice: number): number {
  return thbPrice / USD_TO_THB_RATE;
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: Currency): string {
  const symbols: Record<Currency, string> = {
    USD: '$',
    THB: '฿',
    JPY: '¥',
    KRW: '₩',
    EUR: '€',
    CAD: 'C$',
    AUD: 'A$',
    CNY: '¥',
    BRL: 'R$',
    SAR: '﷼',
  };
  return symbols[currency];
}

/**
 * Format price based on currency (input is always USD)
 */
export function formatPrice(priceUSD: number, currency: Currency): string {
  if (priceUSD == null || isNaN(priceUSD)) {
    return `${getCurrencySymbol(currency)}0`;
  }

  const symbol = getCurrencySymbol(currency);

  if (currency === 'USD') {
    return `${symbol}${priceUSD.toFixed(2)}`;
  }

  const converted = convertUsdTo(priceUSD, currency);
  return WHOLE_NUMBER_CURRENCIES.includes(currency)
    ? `${symbol}${converted}`
    : `${symbol}${converted.toFixed(2)}`;
}

/**
 * Format price that may be stored in any currency for display
 */
export function formatStoredPrice(
  amount: number,
  sourceCurrency: Currency,
  displayCurrency: Currency
): string {
  if (amount == null || isNaN(amount)) {
    return `${getCurrencySymbol(displayCurrency)}0`;
  }

  // Same currency
  if (sourceCurrency === displayCurrency) {
    const symbol = getCurrencySymbol(displayCurrency);
    return WHOLE_NUMBER_CURRENCIES.includes(displayCurrency)
      ? `${symbol}${Math.round(amount)}`
      : `${symbol}${amount.toFixed(2)}`;
  }

  // Convert source → USD → display
  const usdAmount = amount / EXCHANGE_RATES[sourceCurrency];
  const displayAmount = usdAmount * EXCHANGE_RATES[displayCurrency];
  const symbol = getCurrencySymbol(displayCurrency);

  return WHOLE_NUMBER_CURRENCIES.includes(displayCurrency)
    ? `${symbol}${Math.round(displayAmount)}`
    : `${symbol}${displayAmount.toFixed(2)}`;
}
