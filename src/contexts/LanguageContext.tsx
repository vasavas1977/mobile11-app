// Language Context for i18n support - v4 (es/pt/ar expansion)
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import en from '@/locales/en.json';
import th from '@/locales/th.json';
import ja from '@/locales/ja.json';
import ko from '@/locales/ko.json';
import fr from '@/locales/fr.json';
import de from '@/locales/de.json';
import zh from '@/locales/zh.json';
import es from '@/locales/es.json';
import pt from '@/locales/pt.json';
import ar from '@/locales/ar.json';
import { formatPrice as formatPriceUtil } from '@/lib/currencyUtils';
import { supabase } from '@/integrations/supabase/client';

export type Language = 'en' | 'th' | 'ja' | 'ko' | 'fr' | 'de' | 'zh' | 'es' | 'pt' | 'ar';
export type Currency = 'USD' | 'THB' | 'JPY' | 'KRW' | 'EUR' | 'CAD' | 'AUD' | 'CNY' | 'BRL' | 'SAR';

export const LANGUAGE_OPTIONS: { code: Language; label: string; flag: string; nativeName: string }[] = [
  { code: 'en', label: 'EN', flag: '🇺🇸', nativeName: 'English' },
  { code: 'th', label: 'TH', flag: '🇹🇭', nativeName: 'ไทย' },
  { code: 'ja', label: 'JA', flag: '🇯🇵', nativeName: '日本語' },
  { code: 'ko', label: 'KO', flag: '🇰🇷', nativeName: '한국어' },
  { code: 'fr', label: 'FR', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'de', label: 'DE', flag: '🇩🇪', nativeName: 'Deutsch' },
  { code: 'zh', label: 'ZH', flag: '🇨🇳', nativeName: '中文' },
  { code: 'es', label: 'ES', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'pt', label: 'PT', flag: '🇧🇷', nativeName: 'Português' },
  { code: 'ar', label: 'AR', flag: '🇸🇦', nativeName: 'العربية' },
];

export const CURRENCY_OPTIONS: { code: Currency; symbol: string; label: string }[] = [
  { code: 'USD', symbol: '$', label: 'USD' },
  { code: 'THB', symbol: '฿', label: 'THB' },
  { code: 'JPY', symbol: '¥', label: 'JPY' },
  { code: 'KRW', symbol: '₩', label: 'KRW' },
  { code: 'EUR', symbol: '€', label: 'EUR' },
  { code: 'CAD', symbol: 'C$', label: 'CAD' },
  { code: 'AUD', symbol: 'A$', label: 'AUD' },
  { code: 'CNY', symbol: '¥', label: 'CNY' },
  { code: 'BRL', symbol: 'R$', label: 'BRL' },
  { code: 'SAR', symbol: '﷼', label: 'SAR' },
];

interface LanguageContextType {
  language: Language;
  currency: Currency;
  setLanguage: (lang: Language) => void;
  setCurrency: (curr: Currency) => void;
  t: (key: string) => any;
  formatPrice: (priceUSD: number) => string;
  isTransitioning: boolean;
  /** Resolve a per-language field from a data object, e.g. localizeField(item, 'label') resolves item.labelEn/labelTh/labelJa */
  localizeField: (obj: Record<string, any>, field: string) => string;
}

const translations: Record<Language, any> = { en, th, ja, ko, fr, de, zh, es, pt, ar };

const VALID_LANGUAGES: Language[] = ['en', 'th', 'ja', 'ko', 'fr', 'de', 'zh', 'es', 'pt', 'ar'];
const VALID_CURRENCIES: Currency[] = ['USD', 'THB', 'JPY', 'KRW', 'EUR', 'CAD', 'AUD', 'CNY', 'BRL', 'SAR'];

// Geo-detection mapping: country code → language + currency
const GEO_DEFAULTS: Record<string, { language: Language; currency: Currency }> = {
  TH: { language: 'th', currency: 'THB' },
  JP: { language: 'ja', currency: 'JPY' },
  KR: { language: 'ko', currency: 'KRW' },
  FR: { language: 'fr', currency: 'EUR' },
  DE: { language: 'de', currency: 'EUR' },
  AT: { language: 'de', currency: 'EUR' }, // Austria
  CH: { language: 'de', currency: 'EUR' }, // Switzerland (default to German)
  BE: { language: 'fr', currency: 'EUR' }, // Belgium (default to French)
  CA: { language: 'en', currency: 'CAD' }, // Canada (default EN, could be FR based on browser)
  AU: { language: 'en', currency: 'AUD' },
  US: { language: 'en', currency: 'USD' },
  CN: { language: 'zh', currency: 'CNY' },
  // Spanish-speaking
  ES: { language: 'es', currency: 'EUR' },
  MX: { language: 'es', currency: 'USD' },
  AR: { language: 'es', currency: 'USD' },
  CO: { language: 'es', currency: 'USD' },
  CL: { language: 'es', currency: 'USD' },
  PE: { language: 'es', currency: 'USD' },
  // Portuguese-speaking
  BR: { language: 'pt', currency: 'BRL' },
  PT: { language: 'pt', currency: 'EUR' },
  // Arabic-speaking
  SA: { language: 'ar', currency: 'SAR' },
  AE: { language: 'ar', currency: 'SAR' },
  EG: { language: 'ar', currency: 'SAR' },
  QA: { language: 'ar', currency: 'SAR' },
  KW: { language: 'ar', currency: 'SAR' },
  BH: { language: 'ar', currency: 'SAR' },
  OM: { language: 'ar', currency: 'SAR' },
  JO: { language: 'ar', currency: 'SAR' },
};

// Browser language → app language + currency fallback
const BROWSER_LANG_DEFAULTS: Record<string, { language: Language; currency: Currency }> = {
  th: { language: 'th', currency: 'THB' },
  ja: { language: 'ja', currency: 'JPY' },
  ko: { language: 'ko', currency: 'KRW' },
  fr: { language: 'fr', currency: 'EUR' },
  de: { language: 'de', currency: 'EUR' },
  zh: { language: 'zh', currency: 'CNY' },
  es: { language: 'es', currency: 'EUR' },
  pt: { language: 'pt', currency: 'BRL' },
  ar: { language: 'ar', currency: 'SAR' },
};

/** Detect language/currency from browser's navigator.language */
const detectFromBrowserLanguage = (): { language: Language; currency: Currency } | null => {
  const browserLang = navigator.language?.toLowerCase() || '';
  // Try exact match first (e.g., 'de-DE' → 'de'), then prefix
  const langPrefix = browserLang.split('-')[0];
  return BROWSER_LANG_DEFAULTS[langPrefix] || null;
};

// Export the context for direct access in edge cases (chunk loading failures)
export const LanguageContext = createContext<LanguageContextType | null>(null);

// Check if this is a first-time visitor (no saved preferences)
const isFirstTimeVisitor = () => {
  return !localStorage.getItem('language') && !localStorage.getItem('currency');
};

/** Get the next language in the cycle (used by auth language switchers) */
export function getNextLanguage(current: Language): Language {
  const idx = LANGUAGE_OPTIONS.findIndex(l => l.code === current);
  return LANGUAGE_OPTIONS[(idx + 1) % LANGUAGE_OPTIONS.length].code;
}

/** Get the label for the next language (shown on the button) */
export function getNextLanguageLabel(current: Language): string {
  const next = getNextLanguage(current);
  return LANGUAGE_OPTIONS.find(l => l.code === next)?.label || 'EN';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [isGeoLoading, setIsGeoLoading] = useState(() => isFirstTimeVisitor());
  
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return VALID_LANGUAGES.includes(saved as Language) ? (saved as Language) : 'en';
  });
  
  const [currency, setCurrency] = useState<Currency>(() => {
    const saved = localStorage.getItem('currency');
    return VALID_CURRENCIES.includes(saved as Currency) ? (saved as Currency) : 'USD';
  });

  const [isTransitioning, setIsTransitioning] = useState(false);

  // Geo-detect language/currency for first-time visitors
  useEffect(() => {
    const applyGeoDefaults = async () => {
      if (!isFirstTimeVisitor()) {
        setIsGeoLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase.functions.invoke('get-user-location');
        
        if (error) {
          console.error('Error detecting location:', error);
          setIsGeoLoading(false);
          return;
        }
        
        const cc = data?.countryCode;
        const defaults = cc ? GEO_DEFAULTS[cc] : null;
        
        if (defaults) {
          // For Canada, check browser language to decide fr vs en
          if (cc === 'CA') {
            const browserLang = navigator.language?.toLowerCase() || '';
            if (browserLang.startsWith('fr')) {
              defaults.language = 'fr';
            }
          }
          
          setLanguageState(defaults.language);
          setCurrency(defaults.currency);
          localStorage.setItem('language', defaults.language);
          localStorage.setItem('currency', defaults.currency);
        } else {
          // Fallback: detect from browser language (e.g., de-DE → German)
          const browserDefaults = detectFromBrowserLanguage();
          if (browserDefaults) {
            setLanguageState(browserDefaults.language);
            setCurrency(browserDefaults.currency);
            localStorage.setItem('language', browserDefaults.language);
            localStorage.setItem('currency', browserDefaults.currency);
          } else {
            localStorage.setItem('language', 'en');
            localStorage.setItem('currency', 'USD');
          }
        }
      } catch (error) {
        console.error('Error detecting location for language default:', error);
      } finally {
        setIsGeoLoading(false);
      }
    };
    
    applyGeoDefaults();
  }, []);

  // Language change with smooth transition (independent from currency)
  const setLanguage = useCallback((lang: Language) => {
    if (lang === language) return;
    
    setIsTransitioning(true);
    
    // Wait for fade out, then change language
    setTimeout(() => {
      setLanguageState(lang);
      // Currency is NOT changed - it remains independent
      
      // Wait a frame then fade back in
      requestAnimationFrame(() => {
        setIsTransitioning(false);
      });
    }, 150);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('language', language);
    // Set lang attribute on HTML element for CSS :lang() selectors and Thai font
    document.documentElement.lang = language;
    // Set RTL direction for Arabic
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);

  const t = useCallback((key: string): any => {
    const keys = key.split('.');
    let value: any = translations[language];

    for (const k of keys) {
      value = value?.[k];
    }

    // Return the value as-is (string, array, or object)
    // Return empty string only if truly undefined/null
    return value ?? '';
  }, [language]);

  const formatPrice = useCallback((priceUSD: number): string => {
    return formatPriceUtil(priceUSD, currency);
  }, [currency]);

  const localizeField = useCallback((obj: Record<string, any>, field: string): string => {
    const langSuffix = language.charAt(0).toUpperCase() + language.slice(1);
    return obj[`${field}${langSuffix}`] || obj[`${field}En`] || obj[field] || '';
  }, [language]);

  // Show loading screen during geo-detection for first-time visitors
  if (isGeoLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, currency, setLanguage, setCurrency, t, formatPrice, isTransitioning, localizeField }}>
      <div 
        className="transition-all duration-200 ease-out"
        style={{ 
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? 'scale(0.90)' : undefined,
          filter: isTransitioning ? 'blur(8px)' : undefined
        }}
      >
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback for HMR / chunk-reload race conditions — return safe defaults
    const fallbackT = (key: string): any => {
      const keys = key.split('.');
      let value: any = translations['en'];
      for (const k of keys) value = value?.[k];
      return value ?? '';
    };
    return {
      language: 'en' as Language,
      currency: 'USD' as Currency,
      setLanguage: () => {},
      setCurrency: () => {},
      t: fallbackT,
      formatPrice: (p: number) => `$${p.toFixed(2)}`,
      isTransitioning: false,
      localizeField: (obj: Record<string, any>, field: string) => obj[`${field}En`] || obj[field] || '',
    };
  }
  return context;
}
