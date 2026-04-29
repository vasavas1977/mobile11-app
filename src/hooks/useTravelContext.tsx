import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SUPPORTED_LANGUAGES, TranslateLanguage, QUICK_PHRASES, PHRASE_CATEGORIES, PhraseCategory } from '@/types/translate';

export interface TravelDestination {
  countryCode: string;
  countryName: string;
  languageCode: string;
  languageName: string;
  flag: string;
  source: 'order' | 'mock';
}

export interface DestinationRecommendation {
  destination: TravelDestination;
  suggestedLanguage: TranslateLanguage;
  emergencyPhrases: typeof QUICK_PHRASES;
  topCategories: PhraseCategory[];
  greeting: string;
}

// Map country codes to their primary language code
const COUNTRY_TO_LANG: Record<string, string> = {
  JP: 'ja', CN: 'zh', TW: 'zh', HK: 'zh',
  KR: 'ko', TH: 'th', VN: 'vi', ID: 'id', MY: 'ms', PH: 'fil',
  FR: 'fr', DE: 'de', IT: 'it', ES: 'es', PT: 'pt', NL: 'nl',
  SE: 'sv', DK: 'da', FI: 'fi', NO: 'no', PL: 'pl', CZ: 'cs',
  HU: 'hu', RO: 'ro', GR: 'el', TR: 'tr',
  RU: 'ru', UA: 'uk',
  SA: 'ar', AE: 'ar', EG: 'ar', IL: 'he',
  IN: 'hi', BR: 'pt',
  MX: 'es', AR: 'es', CL: 'es', CO: 'es', PE: 'es',
};

// Contextual greetings per destination
const DESTINATION_GREETINGS: Record<string, string> = {
  ja: 'こんにちは — Ready for Japan?',
  zh: '你好 — Ready for your trip?',
  ko: '안녕하세요 — Ready for Korea?',
  th: 'สวัสดี — Ready for Thailand?',
  fr: 'Bonjour — Ready for France?',
  de: 'Hallo — Ready for Germany?',
  it: 'Ciao — Ready for Italy?',
  es: 'Hola — Ready for your trip?',
  vi: 'Xin chào — Ready for Vietnam?',
  ar: 'مرحبا — Ready for your trip?',
  tr: 'Merhaba — Ready for Turkey?',
  id: 'Halo — Ready for Indonesia?',
  pt: 'Olá — Ready for your trip?',
};

// Categories most useful per region
const REGION_TOP_CATEGORIES: Record<string, string[]> = {
  ja: ['food', 'taxi', 'directions', 'payment'],
  zh: ['taxi', 'food', 'payment', 'hotel'],
  ko: ['food', 'shopping', 'directions', 'payment'],
  th: ['taxi', 'food', 'payment', 'medical'],
  fr: ['food', 'hotel', 'directions', 'payment'],
  de: ['directions', 'hotel', 'food', 'payment'],
  it: ['food', 'directions', 'payment', 'hotel'],
  es: ['food', 'taxi', 'directions', 'payment'],
  vi: ['taxi', 'food', 'payment', 'directions'],
  ar: ['taxi', 'hotel', 'food', 'emergency'],
  tr: ['food', 'taxi', 'payment', 'directions'],
  id: ['taxi', 'food', 'hotel', 'payment'],
};

export function useTravelContext() {
  const { user } = useAuth();
  const [destinations, setDestinations] = useState<TravelDestination[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch recent orders to infer travel destinations
  useEffect(() => {
    if (!user) {
      // Use mock destinations for non-authenticated users
      setDestinations([
        { countryCode: 'TH', countryName: 'Thailand', languageCode: 'th', languageName: 'Thai', flag: '🇹🇭', source: 'mock' },
        { countryCode: 'JP', countryName: 'Japan', languageCode: 'ja', languageName: 'Japanese', flag: '🇯🇵', source: 'mock' },
      ]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    (async () => {
      try {
        const { data: orders } = await supabase
          .from('orders')
          .select('package_id, esim_packages(country_code, country_name)')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(10);

        if (cancelled) return;

        const seen = new Set<string>();
        const dests: TravelDestination[] = [];

        for (const order of orders || []) {
          const pkg = order.esim_packages as any;
          if (!pkg?.country_code || seen.has(pkg.country_code)) continue;
          seen.add(pkg.country_code);

          const cc = pkg.country_code.toUpperCase();
          const langCode = COUNTRY_TO_LANG[cc];
          if (!langCode) continue;

          const lang = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
          if (!lang) continue;

          dests.push({
            countryCode: cc,
            countryName: pkg.country_name || cc,
            languageCode: langCode,
            languageName: lang.name,
            flag: getFlagEmoji(cc),
            source: 'order',
          });
        }

        setDestinations(dests.length > 0 ? dests : [
          { countryCode: 'TH', countryName: 'Thailand', languageCode: 'th', languageName: 'Thai', flag: '🇹🇭', source: 'mock' },
        ]);
      } catch (e) {
        console.warn('[TravelContext] Failed to fetch destinations:', e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  // Build recommendations from destinations
  const recommendations = useMemo<DestinationRecommendation[]>(() => {
    return destinations.map(dest => {
      const suggestedLanguage = SUPPORTED_LANGUAGES.find(l => l.code === dest.languageCode) || SUPPORTED_LANGUAGES[1];

      const emergencyPhrases = QUICK_PHRASES.filter(p =>
        p.categoryId === 'emergency' || p.categoryId === 'medical'
      ).slice(0, 4);

      const catIds = REGION_TOP_CATEGORIES[dest.languageCode] || ['food', 'taxi', 'hotel', 'emergency'];
      const topCategories = catIds
        .map(id => PHRASE_CATEGORIES.find(c => c.id === id))
        .filter(Boolean) as PhraseCategory[];

      const greeting = DESTINATION_GREETINGS[dest.languageCode] || `Ready for ${dest.countryName}?`;

      return { destination: dest, suggestedLanguage, emergencyPhrases, topCategories, greeting };
    });
  }, [destinations]);

  const primaryRecommendation = recommendations[0] || null;

  return {
    destinations,
    recommendations,
    primaryRecommendation,
    isLoading,
  };
}

function getFlagEmoji(cc: string): string {
  const codePoints = [...cc.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65);
  return String.fromCodePoint(...codePoints);
}
