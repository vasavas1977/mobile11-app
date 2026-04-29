import { useState, useCallback, useEffect, useRef } from 'react';
import { ArrowLeft, Volume2, RotateCcw, ArrowLeftRight, Maximize2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TranslateLanguage } from '@/types/translate';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { useTranslation } from '@/hooks/useTranslation';
import { TranslationErrorInline } from './TranslationErrorInline';

interface ShowModeScreenProps {
  myLanguage: TranslateLanguage;
  theirLanguage: TranslateLanguage;
  onPickLanguage: (which: 'my' | 'their') => void;
}

export function ShowModeScreen({ myLanguage, theirLanguage, onPickLanguage }: ShowModeScreenProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { translate } = useTranslation();
  const [inputText, setInputText] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [displayText, setDisplayText] = useState('');
  const [displayLang, setDisplayLang] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showOriginal, setShowOriginal] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const state = location.state as { text?: string; original?: string; lang?: string } | null;
    if (state?.text) {
      setDisplayText(state.text);
      setOriginalText(state.original || '');
      setDisplayLang(state.lang || theirLanguage.speechCode);
      setShowInput(false);
      resetControlsTimer();
    }
  }, [location.state, theirLanguage.speechCode]);

  const resetControlsTimer = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setControlsVisible(false), 5000);
  }, []);

  useEffect(() => {
    return () => {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
      speechSynthesis.cancel();
    };
  }, []);

  const handleTranslate = useCallback(async () => {
    if (!inputText.trim() || isTranslating) return;
    setIsTranslating(true);
    setTranslateError(null);
    const result = await translate(inputText.trim(), myLanguage.name, theirLanguage.name);
    setIsTranslating(false);

    if (result.text) {
      setOriginalText(inputText.trim());
      setDisplayText(result.text);
      setDisplayLang(theirLanguage.speechCode);
      setIsFlipped(false);
      setShowInput(false);
      resetControlsTimer();
    } else {
      setTranslateError(result.error || 'Translation failed. Please try again.');
    }
  }, [inputText, translate, myLanguage, theirLanguage, resetControlsTimer, isTranslating]);

  const handleSpeak = useCallback(() => {
    if (!displayText || isSpeaking) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(displayText);
    utterance.lang = displayLang;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    speechSynthesis.speak(utterance);
    resetControlsTimer();
  }, [displayText, displayLang, resetControlsTimer, isSpeaking]);

  const handleFlip = useCallback(async () => {
    if (!originalText || !displayText || isTranslating) return;
    if (!isFlipped) {
      setDisplayText(originalText);
      setDisplayLang(myLanguage.speechCode);
      setIsFlipped(true);
    } else {
      setIsTranslating(true);
      const result = await translate(originalText, myLanguage.name, theirLanguage.name);
      setIsTranslating(false);
      if (result.text) {
        setDisplayText(result.text);
        setDisplayLang(theirLanguage.speechCode);
        setIsFlipped(false);
      }
    }
    resetControlsTimer();
  }, [originalText, displayText, isFlipped, isTranslating, translate, myLanguage, theirLanguage, resetControlsTimer]);

  const handleScreenTap = useCallback(() => {
    if (!controlsVisible) {
      resetControlsTimer();
    } else {
      // Just reset the auto-hide timer when tapping with controls visible
      resetControlsTimer();
    }
  }, [controlsVisible, resetControlsTimer]);

  const handleReset = useCallback(() => {
    speechSynthesis.cancel();
    setShowInput(true);
    setDisplayText('');
    setOriginalText('');
    setInputText('');
    setIsFlipped(false);
    setIsSpeaking(false);
    setTranslateError(null);
  }, []);

  const getFontSize = (text: string): string => {
    const len = text.length;
    if (len <= 20) return 'text-4xl sm:text-5xl';
    if (len <= 50) return 'text-3xl sm:text-4xl';
    if (len <= 100) return 'text-2xl sm:text-3xl';
    if (len <= 200) return 'text-xl sm:text-2xl';
    return 'text-lg sm:text-xl';
  };

  const currentLangName = isFlipped ? myLanguage.name : theirLanguage.name;
  const currentFlag = isFlipped ? myLanguage.countryCode : theirLanguage.countryCode;

  // ─── Full-screen display ─────────────────────────────────
  if (!showInput && displayText) {
    return (
      <div
        className="fixed inset-0 z-50 bg-gray-950 flex flex-col select-none"
        onClick={handleScreenTap}
        role="presentation"
      >
        {/* Top controls */}
        <div
          className={`absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-[env(safe-area-inset-top,16px)] pb-4 bg-gradient-to-b from-black/70 to-transparent transition-opacity duration-500 ${
            controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <button
            onClick={e => { e.stopPropagation(); handleReset(); }}
            className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm hover:bg-white/20 active:scale-95 transition-all min-w-[48px] min-h-[48px] flex items-center justify-center"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm">
            <FlagIcon countryCode={currentFlag} size="sm" />
            <span className="text-sm font-bold text-white/90">{currentLangName}</span>
          </div>

          <button
            onClick={e => { e.stopPropagation(); handleSpeak(); }}
            className={`p-3 rounded-2xl backdrop-blur-sm active:scale-95 transition-all min-w-[48px] min-h-[48px] flex items-center justify-center ${
              isSpeaking ? 'bg-orange-500' : 'bg-white/10 hover:bg-white/20'
            }`}
            aria-label="Play audio"
          >
            <Volume2 className={`w-5 h-5 ${isSpeaking ? 'text-white animate-pulse' : 'text-white'}`} />
          </button>
        </div>

        {/* Center text */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-8 sm:px-12 py-28"
        >
          {showOriginal && originalText && !isFlipped && (
            <p className="text-sm sm:text-base text-white/20 text-center mb-8 max-w-md leading-relaxed font-medium">
              {originalText}
            </p>
          )}

          <p className={`${getFontSize(displayText)} font-bold text-white text-center leading-[1.35] break-words max-w-2xl`}>
            {displayText}
          </p>

          {isTranslating && (
            <div className="mt-8 flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-white/40 font-medium">Translating…</span>
            </div>
          )}
        </div>

        {/* Bottom controls */}
        <div
          className={`absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-3 px-6 pb-[env(safe-area-inset-bottom,28px)] pt-6 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-500 ${
            controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {originalText && !isFlipped && (
            <button
              onClick={e => { e.stopPropagation(); setShowOriginal(v => !v); resetControlsTimer(); }}
              className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white/70 text-sm font-bold transition-all active:scale-95 min-h-[48px]"
            >
              {showOriginal ? 'Hide original' : 'Show original'}
            </button>
          )}

          {originalText && (
            <button
              onClick={e => { e.stopPropagation(); handleFlip(); }}
              className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white/70 text-sm font-bold flex items-center gap-2 transition-all active:scale-95 min-h-[48px]"
            >
              <ArrowLeftRight className="w-4 h-4" />
              Flip
            </button>
          )}

          <button
            onClick={e => { e.stopPropagation(); handleReset(); }}
            className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white/70 text-sm font-bold flex items-center gap-2 transition-all active:scale-95 min-h-[48px]"
          >
            <RotateCcw className="w-4 h-4" />
            New
          </button>
        </div>

        {/* Tap hint */}
        {!controlsVisible && (
          <div className="absolute bottom-10 left-0 right-0 flex justify-center pointer-events-none" aria-hidden="true">
            <span className="text-xs text-white/15 font-medium">Tap to show controls</span>
          </div>
        )}
      </div>
    );
  }

  // ─── Input screen ─────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] bg-gray-950 flex flex-col">
      <header className="flex items-center justify-between px-4 h-[56px] shrink-0">
        <button
          onClick={() => navigate('/translate2')}
          className="p-2.5 -ml-2 rounded-2xl hover:bg-white/10 active:scale-95 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex items-center gap-2">
          <Maximize2 className="w-4 h-4 text-orange-400" />
          <h1 className="text-[17px] font-bold text-white">Show Mode</h1>
        </div>
        <div className="w-11" />
      </header>

      <div className="flex-1 flex flex-col justify-center px-6 pb-8 space-y-6">
        {/* Language pair */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => onPickLanguage('my')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-[0.97] transition-all min-h-[44px]"
            aria-label={`Source: ${myLanguage.name}`}
          >
            <FlagIcon countryCode={myLanguage.countryCode} size="sm" />
            <span className="text-sm text-white font-bold">{myLanguage.name}</span>
          </button>
          <ArrowLeftRight className="w-4 h-4 text-white/30" aria-hidden="true" />
          <button
            onClick={() => onPickLanguage('their')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-[0.97] transition-all min-h-[44px]"
            aria-label={`Target: ${theirLanguage.name}`}
          >
            <FlagIcon countryCode={theirLanguage.countryCode} size="sm" />
            <span className="text-sm text-white font-bold">{theirLanguage.name}</span>
          </button>
        </div>

        <p className="text-center text-sm text-white/30 leading-relaxed font-medium">
          Type what you want to show someone — it'll appear in large, clear text.
        </p>

        <textarea
          value={inputText}
          onChange={e => { setInputText(e.target.value); setTranslateError(null); }}
          placeholder="Type your message…"
          rows={4}
          className="w-full p-5 rounded-2xl bg-white/[0.08] border border-white/15 text-white text-lg placeholder:text-white/25 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400/40 leading-relaxed transition-all"
          autoFocus
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleTranslate();
            }
          }}
        />

        {/* Inline error for show mode — dark theme adapted */}
        {translateError && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 animate-fade-in">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
              <svg className="w-4.5 h-4.5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            </div>
            <p className="text-sm font-semibold text-red-300 flex-1">{translateError}</p>
            <button
              onClick={handleTranslate}
              className="px-4 py-2.5 rounded-2xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm font-bold transition-all active:scale-[0.97] min-h-[44px] shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        <button
          onClick={handleTranslate}
          disabled={!inputText.trim() || isTranslating}
          className="w-full py-4 rounded-2xl bg-orange-500 text-white font-bold text-base flex items-center justify-center gap-2.5 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] min-h-[56px]"
        >
          {isTranslating ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Translating…
            </>
          ) : (
            <>
              <Maximize2 className="w-5 h-5" />
              Show Translation
            </>
          )}
        </button>

        <p className="text-center text-xs text-white/20 font-medium">
          Perfect for showing taxi drivers, hotel staff, or in emergencies
        </p>
      </div>
    </div>
  );
}
