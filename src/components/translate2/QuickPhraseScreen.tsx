import { useState, useMemo, useCallback, useEffect } from 'react';
import { Volume2, Heart, Clock, AlertTriangle, RefreshCw, WifiOff, Download, Maximize2, ChevronRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Translate2Header } from './Translate2Header';
import { Translate2NavBar } from './Translate2NavBar';
import { DestinationPackView } from './DestinationPackView';
import { TranslateLanguage, QUICK_PHRASES, PHRASE_CATEGORIES } from '@/types/translate';
import { useTranslation } from '@/hooks/useTranslation';
import { useSwipeModeNavigation } from '@/hooks/useSwipeModeNavigation';
import { getDestinationPack, DESTINATION_PACKS, DestinationPack } from '@/data/destinationPacks';
import {
  getCachedPhraseTranslation,
  setCachedPhraseTranslation,
  isPhraseAvailableOffline,
  isOnline,
} from '@/utils/phraseCacheUtils';

interface QuickPhraseScreenProps {
  myLanguage: TranslateLanguage;
  theirLanguage: TranslateLanguage;
  onAddRecent: (phrase: { original: string; translated: string; targetLang: string }) => void;
}

export function QuickPhraseScreen({ myLanguage, theirLanguage, onAddRecent }: QuickPhraseScreenProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { translate } = useTranslation();
  const { swipeHandlers } = useSwipeModeNavigation();
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(() => {
    const state = location.state as { category?: string; destinationPack?: string } | null;
    return state?.category || null;
  });
  const [activeDestPack, setActiveDestPack] = useState<DestinationPack | null>(() => {
    const state = location.state as { destinationPack?: string } | null;
    if (state?.destinationPack) {
      return getDestinationPack(state.destinationPack) || null;
    }
    return null;
  });
  const [translatedPhrases, setTranslatedPhrases] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [online, setOnline] = useState(isOnline);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('m11_phrase_favorites');
      return saved ? new Set(JSON.parse(saved)) : new Set<string>();
    } catch { return new Set<string>(); }
  });
  const [recentUsed, setRecentUsed] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('m11_phrase_recents');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Track online/offline
  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); };
  }, []);

  // Pre-populate in-memory state from cache for the current language pair
  useEffect(() => {
    const cached: Record<string, string> = {};
    QUICK_PHRASES.forEach(p => {
      const c = getCachedPhraseTranslation(p.id, myLanguage.name, theirLanguage.name);
      if (c) cached[p.id] = c.translatedText;
    });
    setTranslatedPhrases(cached);
  }, [myLanguage.name, theirLanguage.name]);

  const filteredPhrases = useMemo(() => {
    if (!activeCategoryId) return [];
    return QUICK_PHRASES.filter(p => p.categoryId === activeCategoryId);
  }, [activeCategoryId]);

  const recentPhrases = useMemo(() => {
    return recentUsed
      .map(id => QUICK_PHRASES.find(p => p.id === id))
      .filter(Boolean)
      .slice(0, 5) as typeof QUICK_PHRASES;
  }, [recentUsed]);

  const favoritePhrases = useMemo(() => {
    return QUICK_PHRASES.filter(p => favorites.has(p.id));
  }, [favorites]);

  const toggleFavorite = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem('m11_phrase_favorites', JSON.stringify([...next]));
      return next;
    });
  }, []);

  const addToRecent = useCallback((id: string) => {
    setRecentUsed(prev => {
      const next = [id, ...prev.filter(x => x !== id)].slice(0, 10);
      localStorage.setItem('m11_phrase_recents', JSON.stringify(next));
      return next;
    });
  }, []);

  const speakText = useCallback((text: string, langCode: string) => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    speechSynthesis.speak(utterance);
  }, []);

  const handleTranslate = useCallback(async (phraseId: string, text: string, category: string) => {
    // Prevent concurrent network translations
    if (loadingId) return;
    // 1. Already have it in memory → speak immediately
    if (translatedPhrases[phraseId]) {
      speakText(translatedPhrases[phraseId], theirLanguage.speechCode);
      addToRecent(phraseId);
      return;
    }

    // 2. Check local cache
    const cached = getCachedPhraseTranslation(phraseId, myLanguage.name, theirLanguage.name);
    if (cached) {
      setTranslatedPhrases(prev => ({ ...prev, [phraseId]: cached.translatedText }));
      speakText(cached.translatedText, theirLanguage.speechCode);
      addToRecent(phraseId);
      return;
    }

    // 3. No cache — need network
    if (!isOnline()) {
      setErrorId(phraseId);
      setErrorMsg("You're offline. Connect once to save this phrase for later.");
      return;
    }

    setLoadingId(phraseId);
    setErrorId(null);
    const result = await translate(text, myLanguage.name, theirLanguage.name);
    setLoadingId(null);

    if (result.text) {
      setTranslatedPhrases(prev => ({ ...prev, [phraseId]: result.text! }));
      // Persist to offline cache
      setCachedPhraseTranslation(phraseId, text, result.text, category, myLanguage.name, theirLanguage.name);
      onAddRecent({ original: text, translated: result.text, targetLang: theirLanguage.code });
      addToRecent(phraseId);
      speakText(result.text, theirLanguage.speechCode);
    } else {
      setErrorId(phraseId);
      setErrorMsg(result.error || 'Translation failed');
    }
  }, [translate, myLanguage, theirLanguage, translatedPhrases, onAddRecent, addToRecent, speakText, loadingId]);

  const speakTranslation = useCallback((phraseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = translatedPhrases[phraseId];
    if (!text) return;
    speakText(text, theirLanguage.speechCode);
  }, [translatedPhrases, theirLanguage, speakText]);

  const renderPhraseCard = (phrase: typeof QUICK_PHRASES[0]) => {
    const isTranslated = !!translatedPhrases[phrase.id];
    const isLoading = loadingId === phrase.id;
    const hasError = errorId === phrase.id;
    const isFav = favorites.has(phrase.id);
    const isOfflineReady = isPhraseAvailableOffline(phrase.id, myLanguage.name, theirLanguage.name);

    return (
      <button
        key={phrase.id}
        onClick={() => handleTranslate(phrase.id, phrase.text, phrase.category)}
        disabled={isLoading}
        className={`w-full text-left p-4 rounded-2xl border transition-all active:scale-[0.98] min-h-[56px] ${
          hasError
            ? 'bg-red-50/50 border-red-200/60'
            : isTranslated
              ? 'bg-orange-50/70 border-orange-200/80'
              : 'bg-white border-gray-100/80 hover:border-orange-200'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[15px] font-semibold text-foreground leading-snug">{phrase.text}</p>
              {isOfflineReady && !isTranslated && (
                <Download className="w-3 h-3 text-emerald-400 shrink-0" aria-label="Available offline" />
              )}
            </div>
            {isTranslated && (
              <div className="flex items-center gap-2 mt-2">
                <p className="text-[15px] text-orange-600 font-bold leading-snug">
                  {translatedPhrases[phrase.id]}
                </p>
                {isOfflineReady && (
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-full shrink-0">
                    offline
                  </span>
                )}
              </div>
            )}
            {isLoading && (
              <div className="flex items-center gap-2 mt-2.5">
                <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-medium text-muted-foreground">Translating…</span>
              </div>
            )}
            {hasError && (
              <div className="flex items-center gap-2 mt-2.5">
                {!online ? (
                  <WifiOff className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                )}
                <span className="text-xs font-semibold text-red-500">{errorMsg}</span>
                {online && (
                  <span className="text-xs font-bold text-orange-600 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" /> Tap to retry
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0 pt-0.5">
            {isTranslated && (
              <button
                onClick={(e) => { e.stopPropagation(); navigate('/translate2/show', { state: { text: translatedPhrases[phrase.id], original: phrase.text, lang: theirLanguage.speechCode } }); }}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-900 active:bg-gray-700 active:scale-95 transition-all"
                aria-label="Show to someone"
              >
                <Maximize2 className="w-3.5 h-3.5 text-white" />
              </button>
            )}
            {isTranslated && (
              <button
                onClick={(e) => speakTranslation(phrase.id, e)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-orange-100 active:bg-orange-200 active:scale-95 transition-all"
                aria-label="Play translation"
              >
                <Volume2 className="w-4 h-4 text-orange-600" />
              </button>
            )}
            <button
              onClick={(e) => toggleFavorite(phrase.id, e)}
              className="w-10 h-10 flex items-center justify-center rounded-full active:bg-gray-100 active:scale-95 transition-all"
              aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart
                className={`w-4 h-4 transition-colors ${isFav ? 'fill-red-500 text-red-500' : 'text-gray-300'}`}
              />
            </button>
          </div>
        </div>
      </button>
    );
  };

  // ─── Destination pack view ───────────────────────────────
  if (activeDestPack) {
    return (
      <DestinationPackView
        pack={activeDestPack}
        myLanguage={myLanguage}
        theirLanguage={theirLanguage}
        onBack={() => setActiveDestPack(null)}
        onAddRecent={onAddRecent}
      />
    );
  }

  // ─── Matching destination pack for current language ─────
  const matchedPack = getDestinationPack(theirLanguage.code);

  // ─── Category grid view ─────────────────────────────────
  if (!activeCategoryId) {
    // Count offline-ready favorites
    const offlineFavCount = favoritePhrases.filter(p =>
      isPhraseAvailableOffline(p.id, myLanguage.name, theirLanguage.name)
    ).length;

    return (
      <div className="min-h-[100dvh] bg-[#FAF7F2] flex flex-col" {...swipeHandlers}>
        <Translate2Header title="Quick Phrases" showBack />

        <div className="flex-1 overflow-y-auto pb-32">
          <div className="px-5 pt-4 pb-2 flex items-center justify-between">
            <p className="text-xs font-bold text-muted-foreground">
              Translating to <span className="font-bold text-foreground">{theirLanguage.name}</span>
            </p>
            {!online && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/60">
                <WifiOff className="w-3 h-3 text-amber-500" />
                <span className="text-[10px] font-bold text-amber-600">Offline</span>
              </div>
            )}
          </div>

          {favoritePhrases.length > 0 && (
            <div className="px-5 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                <h3 className="text-sm font-bold text-foreground">Favorites</h3>
                {offlineFavCount > 0 && (
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {offlineFavCount} offline
                  </span>
                )}
              </div>
              <div className="space-y-2.5">
                {favoritePhrases.map(renderPhraseCard)}
              </div>
            </div>
          )}

          {recentPhrases.length > 0 && (
            <div className="px-5 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-bold text-foreground">Recently Used</h3>
              </div>
              <div className="space-y-2.5">
                {recentPhrases.map(renderPhraseCard)}
              </div>
            </div>
          )}

          {/* Offline tip — show only when user has favorites without cache */}
          {favoritePhrases.length > 0 && offlineFavCount < favoritePhrases.length && online && (
            <div className="mx-5 mb-4 p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100/80">
              <div className="flex items-start gap-2.5">
                <Download className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-700">Save phrases for offline</p>
                  <p className="text-[11px] text-emerald-600/80 mt-0.5 leading-relaxed">
                    Tap a favorite phrase once to translate and save it. Saved phrases work without internet.
                  </p>
                </div>
              </div>
            </div>
          )}
          {/* Destination pack entry */}
          {matchedPack && (
            <div className="px-5 pb-4">
              <button
                onClick={() => setActiveDestPack(matchedPack)}
                className="w-full flex items-center gap-3.5 p-4 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100/80 hover:border-orange-200 active:scale-[0.98] transition-all min-h-[64px]"
              >
                <span className="text-2xl">{matchedPack.flag}</span>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold text-foreground">{matchedPack.name} Phrase Pack</p>
                  <p className="text-[11px] text-muted-foreground font-medium">{matchedPack.phrases.length} curated travel phrases</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            </div>
          )}

          {/* Other destination packs */}
          {!matchedPack && (
            <div className="px-5 pb-4">
              <h3 className="text-sm font-bold text-foreground mb-3">Destination Packs</h3>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1" data-swipe-ignore>
                {DESTINATION_PACKS.map(pack => (
                  <button
                    key={pack.id}
                    onClick={() => setActiveDestPack(pack)}
                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white border border-gray-200/60 hover:border-orange-200 whitespace-nowrap active:scale-[0.98] transition-all min-h-[44px]"
                  >
                    <span className="text-lg">{pack.flag}</span>
                    <span className="text-xs font-bold text-foreground">{pack.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="px-5 pt-2">
            <h3 className="text-sm font-bold text-foreground mb-3">Categories</h3>
            <div className="grid grid-cols-3 gap-3">
              {PHRASE_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl ${cat.color} border border-transparent hover:border-orange-200 active:scale-[0.95] transition-all min-h-[88px]`}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-xs font-bold text-foreground">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <Translate2NavBar />
      </div>
    );
  }

  // ─── Phrase list view ───────────────────────────────────
  const activeCategory = PHRASE_CATEGORIES.find(c => c.id === activeCategoryId);

  return (
    <div className="min-h-[100dvh] bg-white flex flex-col" {...swipeHandlers}>
      <Translate2Header
        title={`${activeCategory?.icon || ''} ${activeCategory?.name || 'Phrases'}`}
        showBack
        onBack={() => setActiveCategoryId(null)}
      />

      {/* Category pills */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar border-b border-gray-100/60 bg-[#FAF7F2]" data-swipe-ignore>
        {PHRASE_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategoryId(cat.id)}
            className={`px-4 py-2.5 text-xs font-bold rounded-full whitespace-nowrap transition-all active:scale-[0.95] min-h-[40px] ${
              activeCategoryId === cat.id
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-white text-muted-foreground hover:bg-gray-100 border border-gray-200/60'
            }`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Offline banner in category view */}
      {!online && (
        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-100/80">
          <WifiOff className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-xs font-bold text-amber-600">Offline — cached phrases still work</span>
        </div>
      )}

      {/* Phrase list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-32 space-y-2.5">
        {filteredPhrases.map(renderPhraseCard)}
      </div>

      <Translate2NavBar />
    </div>
  );
}
