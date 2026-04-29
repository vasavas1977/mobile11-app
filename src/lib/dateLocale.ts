import type { Language } from '@/contexts/LanguageContext';

const LOCALE_MAP: Record<Language, string> = {
  en: 'en-US',
  th: 'th-TH',
  ja: 'ja-JP',
  ko: 'ko-KR',
  fr: 'fr-FR',
  de: 'de-DE',
  zh: 'zh-CN',
  es: 'es-ES',
  pt: 'pt-BR',
  ar: 'ar-SA',
};

/** Returns the Intl locale string for the current language */
export function getDateLocale(language: Language): string {
  return LOCALE_MAP[language] || 'en-US';
}
