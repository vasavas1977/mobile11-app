import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ArrowLeftRight, Volume2, Copy, Check, Send, Maximize2, Heart, Clock, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Translate2Header } from './Translate2Header';
import { Translate2NavBar } from './Translate2NavBar';
import { TranslateLanguage } from '@/types/translate';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { useTranslation } from '@/hooks/useTranslation';
import { TranslationErrorInline } from './TranslationErrorInline';
import { useSwipeModeNavigation } from '@/hooks/useSwipeModeNavigation';
import { toast } from 'sonner';

interface TypedTranslation {
  id: string;
  original: string;
  translated: string;
  sourceLang: string;
  targetLang: string;
  sourceCode: string;
  targetCode: string;
  timestamp: number;
}

interface TypeTranslateScreenProps {
  myLanguage: TranslateLanguage;
  theirLanguage: TranslateLanguage;
  onSwap: () => void;
  onPickLanguage: (which: 'my' | 'their') => void;
  onAddRecent: (phrase: { original: string; translated: string; targetLang: string }) => void;
}

export function TypeTranslateScreen({ myLanguage, theirLanguage, onSwap, onPickLanguage, onAddRecent }: TypeTranslateScreenProps) {
  const navigate = useNavigate();
  const { translate } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const { swipeHandlers } = useSwipeModeNavigation({ disabled: inputFocused });
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('m11_type_favorites');
      return saved ? new Set(JSON.parse(saved)) : new Set<string>();
    } catch { return new Set<string>(); }
  });
  const [history, setHistory] = useState<TypedTranslation[]>(() => {
    try {
      const saved = localStorage.getItem('m11_type_history');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const currentId = useMemo(() => {
    if (!translatedText) return '';
    return `${inputText.trim()}::${theirLanguage.code}`;
  }, [inputText, translatedText, theirLanguage.code]);

  const isFavorited = favorites.has(currentId);

  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 100);
    return () => { speechSynthesis.cancel(); };
  }, []);

  const handleTranslate = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isTranslating) return;
    setIsTranslating(true);
    setTranslateError(null);
    const result = await translate(text, myLanguage.name, theirLanguage.name);
    setIsTranslating(false);

    if (result.text) {
      setTranslatedText(result.text);
      onAddRecent({ original: text, translated: result.text, targetLang: theirLanguage.code });

      const entry: TypedTranslation = {
        id: `${text}::${theirLanguage.code}`,
        original: text,
        translated: result.text,
        sourceLang: myLanguage.name,
        targetLang: theirLanguage.name,
        sourceCode: myLanguage.speechCode,
        targetCode: theirLanguage.speechCode,
        timestamp: Date.now(),
      };
      setHistory(prev => {
        const next = [entry, ...prev.filter(h => h.id !== entry.id)].slice(0, 20);
        localStorage.setItem('m11_type_history', JSON.stringify(next));
        return next;
      });
    } else {
      setTranslateError(result.error || 'Translation failed. Please try again.');
    }
  }, [inputText, translate, myLanguage, theirLanguage, onAddRecent, isTranslating]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }, [translatedText]);

  const handleSpeak = useCallback((text: string, langCode: string) => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    speechSynthesis.speak(utterance);
  }, []);

  const toggleFavorite = useCallback(() => {
    if (!currentId) return;
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(currentId)) next.delete(currentId);
      else next.add(currentId);
      localStorage.setItem('m11_type_favorites', JSON.stringify([...next]));
      return next;
    });
  }, [currentId]);

  const handleShowMode = useCallback(() => {
    if (translatedText) {
      navigate('/translate2/show', { state: { text: translatedText, original: inputText.trim(), lang: theirLanguage.speechCode } });
    }
  }, [navigate, translatedText, inputText, theirLanguage]);

  const handleClear = useCallback(() => {
    setInputText('');
    setTranslatedText('');
    setTranslateError(null);
    textareaRef.current?.focus();
  }, []);

  const loadHistoryItem = useCallback((item: TypedTranslation) => {
    setInputText(item.original);
    setTranslatedText(item.translated);
    setTranslateError(null);
  }, []);

  const hasResult = !!translatedText;
  const showHistory = !hasResult && history.length > 0 && !inputText.trim();

  return (
    <div className="min-h-[100dvh] bg-[#FAF7F2] flex flex-col" {...swipeHandlers}>
      <Translate2Header title="Type to Translate" showBack />

      <div className="flex-1 overflow-y-auto pb-32">
        {/* Language pair bar */}
        <div className="mx-4 mt-4 flex items-center justify-between bg-white rounded-2xl p-3 shadow-sm border border-gray-100/80">
          <button
            onClick={() => onPickLanguage('my')}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 active:scale-[0.97] transition-all min-h-[44px]"
            aria-label={`Source: ${myLanguage.name}`}
          >
            <FlagIcon countryCode={myLanguage.countryCode} size="sm" />
            <span className="text-sm font-bold text-foreground">{myLanguage.name}</span>
          </button>
          <button
            onClick={onSwap}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 active:scale-90 active:rotate-180 transition-all"
            aria-label="Swap languages"
          >
            <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => onPickLanguage('their')}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 active:scale-[0.97] transition-all min-h-[44px]"
            aria-label={`Target: ${theirLanguage.name}`}
          >
            <span className="text-sm font-bold text-foreground">{theirLanguage.name}</span>
            <FlagIcon countryCode={theirLanguage.countryCode} size="sm" />
          </button>
        </div>

        {/* Input area */}
        <div className="mx-4 mt-3 relative">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={e => { setInputText(e.target.value); setTranslateError(null); }}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="Type something to translate…"
              rows={4}
              className="w-full p-4 pb-14 text-[16px] text-foreground placeholder:text-gray-300 resize-none focus:outline-none bg-transparent leading-relaxed"
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleTranslate();
                }
              }}
            />
            {/* Bottom toolbar */}
            <div className="flex items-center justify-between px-3 pb-3">
              <div className="flex items-center gap-1">
                {inputText.trim() && (
                  <button
                    onClick={handleClear}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-95 transition-all"
                    aria-label="Clear text"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
                {inputText.trim() && (
                  <button
                    onClick={() => handleSpeak(inputText, myLanguage.speechCode)}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-95 transition-all"
                    aria-label="Play input text"
                  >
                    <Volume2 className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
              <button
                onClick={handleTranslate}
                disabled={!inputText.trim() || isTranslating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.97] min-h-[44px]"
              >
                {isTranslating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Translating…</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Translate</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Inline error */}
        {translateError && !hasResult && (
          <div className="mx-4 mt-3 animate-fade-in">
            <TranslationErrorInline
              message={translateError}
              onRetry={handleTranslate}
            />
          </div>
        )}

        {/* Translation result */}
        {hasResult && (
          <div className="mx-4 mt-3 bg-white rounded-2xl shadow-sm border border-orange-100/80 overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between px-4 pt-4 pb-1">
              <div className="flex items-center gap-2">
                <FlagIcon countryCode={theirLanguage.countryCode} size="sm" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {theirLanguage.name}
                </span>
              </div>
              <button
                onClick={toggleFavorite}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-95 transition-all"
                aria-label={isFavorited ? 'Remove from favorites' : 'Save to favorites'}
              >
                <Heart className={`w-5 h-5 transition-colors ${isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-300'}`} />
              </button>
            </div>

            <div className="px-4 py-3">
              <p className="text-lg font-bold text-foreground leading-relaxed">{translatedText}</p>
            </div>

            <div className="flex items-center gap-2 px-4 pb-4">
              <button
                onClick={() => handleSpeak(translatedText, theirLanguage.speechCode)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-orange-50 hover:bg-orange-100 text-orange-600 text-sm font-bold transition-all active:scale-[0.97] min-h-[44px]"
                aria-label="Listen to translation"
              >
                <Volume2 className="w-4 h-4" />
                Listen
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gray-50 hover:bg-gray-100 text-foreground text-sm font-bold transition-all active:scale-[0.97] min-h-[44px]"
                aria-label="Copy translation"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={handleShowMode}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold transition-all active:scale-[0.97] ml-auto min-h-[44px]"
                aria-label="Open in Show Mode"
              >
                <Maximize2 className="w-4 h-4" />
                Show
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!hasResult && !inputText.trim() && history.length === 0 && !translateError && (
          <div className="flex flex-col items-center justify-center pt-16 px-8 text-center animate-fade-in">
            <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-5">
              <Send className="w-7 h-7 text-orange-400" />
            </div>
            <p className="text-base font-bold text-foreground mb-1.5">Type to translate</p>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px] font-medium">
              Perfect for noisy places, immigration desks, or when you need to spell out names and addresses.
            </p>
          </div>
        )}

        {/* Recent history */}
        {showHistory && !translateError && (
          <div className="mx-4 mt-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-bold text-foreground">Recent Translations</h3>
            </div>
            <div className="space-y-2.5">
              {history.slice(0, 8).map(item => (
                <button
                  key={item.id + item.timestamp}
                  onClick={() => loadHistoryItem(item)}
                  className="w-full text-left bg-white rounded-2xl p-4 border border-gray-100/80 hover:border-orange-200 active:scale-[0.98] transition-all min-h-[56px]"
                >
                  <p className="text-sm text-foreground font-bold truncate">{item.original}</p>
                  <p className="text-sm text-orange-600 mt-1.5 truncate font-semibold">{item.translated}</p>
                  <p className="text-[11px] text-muted-foreground mt-1.5 font-medium">
                    {item.sourceLang} → {item.targetLang}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Translate2NavBar />
    </div>
  );
}
