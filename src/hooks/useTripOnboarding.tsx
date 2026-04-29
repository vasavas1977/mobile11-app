import { useState, useEffect, useMemo, useCallback } from 'react';
import { SUPPORTED_LANGUAGES, TranslateLanguage } from '@/types/translate';
import { getDestinationPack, DESTINATION_PACKS, DestinationPack, DestinationPhrase } from '@/data/destinationPacks';

const STORAGE_KEY = 'mobile11_trip_onboarding';

export interface TripPreferences {
  hasCompletedOnboarding: boolean;
  lastTripDestination: string | null;
  preferredMyLangCode: string | null;
  preferredTheirLangCode: string | null;
  recentTripContexts: { destination: string; langCode: string; lastUsed: number }[];
  savedOfflineEssentials: string[];
  dismissedSetup: boolean;
}

const DEFAULT_PREFS: TripPreferences = {
  hasCompletedOnboarding: false,
  lastTripDestination: null,
  preferredMyLangCode: null,
  preferredTheirLangCode: null,
  recentTripContexts: [],
  savedOfflineEssentials: [],
  dismissedSetup: false,
};

export type SuggestedMode = 'conversation' | 'phrases' | 'type' | 'show';

export interface TripRecommendation {
  destination: string;
  destinationName: string;
  flag: string;
  suggestedLang: TranslateLanguage;
  suggestedMode: SuggestedMode;
  modeReason: string;
  pack: DestinationPack | undefined;
  offlineEssentials: DestinationPhrase[];
  greeting: string;
}

const MODE_SUGGESTIONS: Record<string, { mode: SuggestedMode; reason: string }> = {
  ja: { mode: 'phrases', reason: 'Quick Phrases work best for polite Japanese interactions' },
  zh: { mode: 'show', reason: 'Show Mode is fastest for taxis and addresses in China' },
  ko: { mode: 'phrases', reason: 'Quick Phrases cover most Korean travel needs' },
  fr: { mode: 'conversation', reason: 'Conversation Mode helps with French back-and-forth' },
  ar: { mode: 'show', reason: 'Show Mode is clearest for Arabic communication' },
  th: { mode: 'phrases', reason: 'Quick Phrases work great for Thai travel basics' },
  de: { mode: 'conversation', reason: 'Conversation Mode suits German interactions' },
  it: { mode: 'phrases', reason: 'Quick Phrases cover Italian dining and transit' },
  es: { mode: 'conversation', reason: 'Conversation Mode is natural for Spanish' },
  vi: { mode: 'show', reason: 'Show Mode helps with Vietnamese taxis and shops' },
  pt: { mode: 'conversation', reason: 'Conversation Mode works well for Portuguese' },
};

function loadPrefs(): TripPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_PREFS };
}

function savePrefs(prefs: TripPreferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {}
}

export function useTripOnboarding() {
  const [prefs, setPrefs] = useState<TripPreferences>(loadPrefs);

  useEffect(() => { savePrefs(prefs); }, [prefs]);

  const updatePrefs = useCallback((partial: Partial<TripPreferences>) => {
    setPrefs(prev => ({ ...prev, ...partial }));
  }, []);

  const completeOnboarding = useCallback((destination: string, myLangCode: string, theirLangCode: string) => {
    setPrefs(prev => ({
      ...prev,
      hasCompletedOnboarding: true,
      lastTripDestination: destination,
      preferredMyLangCode: myLangCode,
      preferredTheirLangCode: theirLangCode,
      recentTripContexts: [
        { destination, langCode: theirLangCode, lastUsed: Date.now() },
        ...prev.recentTripContexts.filter(c => c.destination !== destination).slice(0, 4),
      ],
    }));
  }, []);

  const dismissSetup = useCallback(() => {
    updatePrefs({ dismissedSetup: true });
  }, [updatePrefs]);

  const markOfflineEssentialsSaved = useCallback((phraseIds: string[]) => {
    setPrefs(prev => ({
      ...prev,
      savedOfflineEssentials: [...new Set([...prev.savedOfflineEssentials, ...phraseIds])],
    }));
  }, []);

  const addRecentTrip = useCallback((destination: string, langCode: string) => {
    setPrefs(prev => ({
      ...prev,
      lastTripDestination: destination,
      preferredTheirLangCode: langCode,
      recentTripContexts: [
        { destination, langCode, lastUsed: Date.now() },
        ...prev.recentTripContexts.filter(c => c.destination !== destination).slice(0, 4),
      ],
    }));
  }, []);

  const buildRecommendation = useCallback((langCode: string): TripRecommendation | null => {
    const pack = getDestinationPack(langCode);
    if (!pack) return null;

    const lang = SUPPORTED_LANGUAGES.find(l => l.code === langCode) || SUPPORTED_LANGUAGES.find(l => pack.languageCodes.includes(l.code));
    if (!lang) return null;

    const modeSugg = MODE_SUGGESTIONS[langCode] || { mode: 'phrases' as SuggestedMode, reason: 'Quick Phrases are the fastest way to start' };
    const essentials = pack.phrases
      .filter(p => p.offlineRecommended)
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 6);

    return {
      destination: pack.id,
      destinationName: pack.name,
      flag: pack.flag,
      suggestedLang: lang,
      suggestedMode: modeSugg.mode,
      modeReason: modeSugg.reason,
      pack,
      offlineEssentials: essentials,
      greeting: `Ready for ${pack.name}?`,
    };
  }, []);

  const showFirstUseSetup = !prefs.hasCompletedOnboarding && !prefs.dismissedSetup;

  return {
    prefs,
    updatePrefs,
    completeOnboarding,
    dismissSetup,
    markOfflineEssentialsSaved,
    addRecentTrip,
    buildRecommendation,
    showFirstUseSetup,
    availableDestinations: DESTINATION_PACKS,
  };
}
