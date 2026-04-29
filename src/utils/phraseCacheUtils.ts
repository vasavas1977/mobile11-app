/**
 * Offline phrase translation cache for Mobile11 Translate.
 *
 * Storage keys:
 *   m11_phrase_cache        – Record<cacheKey, CachedTranslation>
 *   m11_phrase_favorites    – string[]  (phrase IDs, already exists)
 *   m11_phrase_recents      – string[]  (phrase IDs, already exists)
 *
 * Cache key format: `${phraseId}::${sourceLang}::${targetLang}`
 */

const CACHE_KEY = 'm11_phrase_cache';

export interface CachedTranslation {
  phraseId: string;
  originalText: string;
  translatedText: string;
  category: string;
  sourceLang: string;
  targetLang: string;
  cachedAt: number; // epoch ms
}

// ── helpers ──────────────────────────────────────────────

function buildKey(phraseId: string, sourceLang: string, targetLang: string): string {
  return `${phraseId}::${sourceLang}::${targetLang}`;
}

function readCache(): Record<string, CachedTranslation> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeCache(cache: Record<string, CachedTranslation>): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // storage full – silently degrade
  }
}

// ── public API ───────────────────────────────────────────

/** Get a cached translation for a specific phrase + language pair. */
export function getCachedPhraseTranslation(
  phraseId: string,
  sourceLang: string,
  targetLang: string,
): CachedTranslation | null {
  const cache = readCache();
  return cache[buildKey(phraseId, sourceLang, targetLang)] ?? null;
}

/** Store a successful translation in the local cache. */
export function setCachedPhraseTranslation(
  phraseId: string,
  originalText: string,
  translatedText: string,
  category: string,
  sourceLang: string,
  targetLang: string,
): void {
  const cache = readCache();
  cache[buildKey(phraseId, sourceLang, targetLang)] = {
    phraseId,
    originalText,
    translatedText,
    category,
    sourceLang,
    targetLang,
    cachedAt: Date.now(),
  };
  writeCache(cache);
}

/** Check whether a phrase is available offline for a given language pair. */
export function isPhraseAvailableOffline(
  phraseId: string,
  sourceLang: string,
  targetLang: string,
): boolean {
  return getCachedPhraseTranslation(phraseId, sourceLang, targetLang) !== null;
}

/** Get all cached translations whose phraseId is in the provided set (e.g. favorites). */
export function getOfflinePhrases(
  phraseIds: string[],
  sourceLang: string,
  targetLang: string,
): CachedTranslation[] {
  const cache = readCache();
  return phraseIds
    .map(id => cache[buildKey(id, sourceLang, targetLang)])
    .filter((c): c is CachedTranslation => !!c);
}

/** Simple navigator.onLine check (not perfectly reliable, but good enough for UX hints). */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}
