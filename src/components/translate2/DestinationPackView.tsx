import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2, Heart, Maximize2, AlertTriangle, RefreshCw, WifiOff, Download, ArrowLeft, Star } from 'lucide-react';
import { DestinationPack, DestinationPhrase } from '@/data/destinationPacks';
import { TranslateLanguage } from '@/types/translate';
import { useTranslation } from '@/hooks/useTranslation';
import {
  getCachedPhraseTranslation,
  setCachedPhraseTranslation,
  isPhraseAvailableOffline,
  isOnline,
} from '@/utils/phraseCacheUtils';

interface DestinationPackViewProps {
  pack: DestinationPack;
  myLanguage: TranslateLanguage;
  theirLanguage: TranslateLanguage;
  onBack: () => void;
  onAddRecent?: (phrase: { original: string; translated: string; targetLang: string }) => void;
}

export function DestinationPackView({ pack, myLanguage, theirLanguage, onBack, onAddRecent }: DestinationPackViewProps) {
  const navigate = useNavigate();
  const { translate } = useTranslation();
  const [activeCatId, setActiveCatId] = useState<string | null>(null);
  const [translatedPhrases, setTranslatedPhrases] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [online, setOnline] = useState(isOnline);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('m11_phrase_favorites');
      return saved ? new Set(JSON.parse(saved)) : new Set<string>();
    } catch { return new Set<string>(); }
  });

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // Pre-load cached translations
  useEffect(() => {
    const cached: Record<string, string> = {};
    pack.phrases.forEach(p => {
      const c = getCachedPhraseTranslation(p.id, myLanguage.name, theirLanguage.name);
      if (c) cached[p.id] = c.translatedText;
    });
    setTranslatedPhrases(cached);
  }, [pack, myLanguage.name, theirLanguage.name]);

  const topPhrases = useMemo(() => {
    return [...pack.phrases].sort((a, b) => b.priority - a.priority).slice(0, 6);
  }, [pack]);

  const activePhrases = useMemo(() => {
    if (!activeCatId) return [];
    return pack.phrases.filter(p => p.category === activeCatId).sort((a, b) => b.priority - a.priority);
  }, [pack, activeCatId]);

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

  const speakText = useCallback((text: string, langCode: string) => {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = langCode;
    speechSynthesis.speak(u);
  }, []);

  const handleTranslate = useCallback(async (phrase: DestinationPhrase) => {
    if (loadingId) return;
    if (translatedPhrases[phrase.id]) {
      speakText(translatedPhrases[phrase.id], theirLanguage.speechCode);
      return;
    }
    const cached = getCachedPhraseTranslation(phrase.id, myLanguage.name, theirLanguage.name);
    if (cached) {
      setTranslatedPhrases(prev => ({ ...prev, [phrase.id]: cached.translatedText }));
      speakText(cached.translatedText, theirLanguage.speechCode);
      return;
    }
    if (!isOnline()) {
      setErrorId(phrase.id);
      setErrorMsg("You're offline. Connect once to save this phrase.");
      return;
    }
    setLoadingId(phrase.id);
    setErrorId(null);
    const result = await translate(phrase.text, myLanguage.name, theirLanguage.name);
    setLoadingId(null);
    if (result.text) {
      setTranslatedPhrases(prev => ({ ...prev, [phrase.id]: result.text! }));
      setCachedPhraseTranslation(phrase.id, phrase.text, result.text, phrase.category, myLanguage.name, theirLanguage.name);
      onAddRecent?.({ original: phrase.text, translated: result.text, targetLang: theirLanguage.code });
      speakText(result.text, theirLanguage.speechCode);
    } else {
      setErrorId(phrase.id);
      setErrorMsg(result.error || 'Translation failed');
    }
  }, [translate, myLanguage, theirLanguage, translatedPhrases, speakText, loadingId, onAddRecent]);

  const renderPhrase = (phrase: DestinationPhrase) => {
    const isTranslated = !!translatedPhrases[phrase.id];
    const isLoading = loadingId === phrase.id;
    const hasError = errorId === phrase.id;
    const isFav = favorites.has(phrase.id);
    const isOffline = isPhraseAvailableOffline(phrase.id, myLanguage.name, theirLanguage.name);

    return (
      <button
        key={phrase.id}
        onClick={() => handleTranslate(phrase)}
        disabled={isLoading}
        className={`w-full text-left p-4 rounded-2xl border transition-all active:scale-[0.98] min-h-[56px] ${
          hasError ? 'bg-red-50/50 border-red-200/60'
            : isTranslated ? 'bg-orange-50/70 border-orange-200/80'
            : 'bg-white border-gray-100/80 hover:border-orange-200'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[15px] font-semibold text-foreground leading-snug">{phrase.text}</p>
              {phrase.offlineRecommended && !isTranslated && (
                <Star className="w-3 h-3 text-amber-400 shrink-0" aria-label="Recommended" />
              )}
              {isOffline && !isTranslated && (
                <Download className="w-3 h-3 text-emerald-400 shrink-0" />
              )}
            </div>
            {phrase.note && !isTranslated && (
              <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{phrase.note}</p>
            )}
            {isTranslated && (
              <p className="text-[15px] text-orange-600 font-bold leading-snug mt-2">{translatedPhrases[phrase.id]}</p>
            )}
            {isLoading && (
              <div className="flex items-center gap-2 mt-2">
                <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-medium text-muted-foreground">Translating…</span>
              </div>
            )}
            {hasError && (
              <div className="flex items-center gap-2 mt-2">
                {!online ? <WifiOff className="w-3.5 h-3.5 text-amber-500 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                <span className="text-xs font-semibold text-red-500">{errorMsg}</span>
                {online && <span className="text-xs font-bold text-orange-600 flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Retry</span>}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0 pt-0.5">
            {isTranslated && (
              <button
                onClick={(e) => { e.stopPropagation(); navigate('/translate2/show', { state: { text: translatedPhrases[phrase.id], original: phrase.text, lang: theirLanguage.speechCode } }); }}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-900 active:bg-gray-700 active:scale-95 transition-all"
                aria-label="Show to someone"
              >
                <Maximize2 className="w-3.5 h-3.5 text-white" />
              </button>
            )}
            {isTranslated && (
              <button
                onClick={(e) => { e.stopPropagation(); speakText(translatedPhrases[phrase.id], theirLanguage.speechCode); }}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-orange-100 active:bg-orange-200 active:scale-95 transition-all"
                aria-label="Play"
              >
                <Volume2 className="w-3.5 h-3.5 text-orange-600" />
              </button>
            )}
            <button
              onClick={(e) => toggleFavorite(phrase.id, e)}
              className="w-9 h-9 flex items-center justify-center rounded-full active:bg-gray-100 active:scale-95 transition-all"
              aria-label={isFav ? 'Unfavorite' : 'Favorite'}
            >
              <Heart className={`w-3.5 h-3.5 transition-colors ${isFav ? 'fill-red-500 text-red-500' : 'text-gray-300'}`} />
            </button>
          </div>
        </div>
      </button>
    );
  };

  // ─── Category browsing ───────────────────────────────
  if (activeCatId) {
    const cat = pack.categories.find(c => c.id === activeCatId);
    return (
      <div className="min-h-[100dvh] bg-white flex flex-col">
        <header className="flex items-center gap-3 px-4 h-[56px] shrink-0 border-b border-gray-100/60">
          <button onClick={() => setActiveCatId(null)} className="p-2 -ml-2 rounded-xl hover:bg-gray-100 active:scale-95 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[17px] font-bold text-foreground">{cat?.icon} {cat?.name}</h1>
        </header>

        {/* Category pills */}
        <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar bg-[#FAF7F2]" data-swipe-ignore>
          {pack.categories.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCatId(c.id)}
              className={`px-4 py-2.5 text-xs font-bold rounded-full whitespace-nowrap transition-all active:scale-[0.95] min-h-[40px] ${
                activeCatId === c.id
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-white text-muted-foreground hover:bg-gray-100 border border-gray-200/60'
              }`}
            >
              {c.icon} {c.name}
            </button>
          ))}
        </div>

        {!online && (
          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-100/80">
            <WifiOff className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-bold text-amber-600">Offline — cached phrases still work</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-4 pb-32 space-y-2.5">
          {activePhrases.map(renderPhrase)}
        </div>
      </div>
    );
  }

  // ─── Pack overview ───────────────────────────────────
  return (
    <div className="min-h-[100dvh] bg-[#FAF7F2] flex flex-col">
      <header className="flex items-center gap-3 px-4 h-[56px] shrink-0 border-b border-gray-100/60 bg-white">
        <button onClick={onBack} className="p-2 -ml-2 rounded-xl hover:bg-gray-100 active:scale-95 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-[17px] font-bold text-foreground">{pack.flag} {pack.name} Phrases</h1>
          <p className="text-[11px] text-muted-foreground font-medium">{pack.tagline}</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-32">
        {/* Top phrases */}
        <div className="px-5 pt-5 pb-2">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-foreground">Most Useful</h3>
          </div>
          <div className="space-y-2.5">
            {topPhrases.map(renderPhrase)}
          </div>
        </div>

        {/* Categories */}
        <div className="px-5 pt-4">
          <h3 className="text-sm font-bold text-foreground mb-3">Browse by Category</h3>
          <div className="grid grid-cols-3 gap-3">
            {pack.categories.map(cat => {
              const count = pack.phrases.filter(p => p.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCatId(cat.id)}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-gray-100/80 hover:border-orange-200 active:scale-[0.95] transition-all min-h-[88px]"
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-xs font-bold text-foreground">{cat.name}</span>
                  <span className="text-[10px] text-muted-foreground font-medium">{count} phrases</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
