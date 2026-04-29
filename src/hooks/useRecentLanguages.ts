import { useState, useCallback } from 'react';
import { TranslateLanguage, SUPPORTED_LANGUAGES } from '@/types/translate';

const STORAGE_KEY = 'mobile11_recent_languages';
const MAX_RECENTS = 5;

function loadRecents(): TranslateLanguage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const codes: string[] = JSON.parse(raw);
    return codes
      .map(c => SUPPORTED_LANGUAGES.find(l => l.code === c))
      .filter((l): l is TranslateLanguage => !!l)
      .slice(0, MAX_RECENTS);
  } catch {
    return [];
  }
}

function saveRecents(codes: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(codes.slice(0, MAX_RECENTS)));
  } catch {}
}

export function useRecentLanguages() {
  const [recents, setRecents] = useState<TranslateLanguage[]>(loadRecents);

  const addRecent = useCallback((lang: TranslateLanguage) => {
    setRecents(prev => {
      const next = [lang, ...prev.filter(l => l.code !== lang.code)].slice(0, MAX_RECENTS);
      saveRecents(next.map(l => l.code));
      return next;
    });
  }, []);

  return { recents, addRecent };
}
