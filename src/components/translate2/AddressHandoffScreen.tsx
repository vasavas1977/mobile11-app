import { useState, useCallback, useRef, useEffect } from 'react';
import { ArrowLeft, Volume2, MapPin, Copy, Check, RotateCcw, ChevronDown, Clock, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TranslateLanguage } from '@/types/translate';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';

const STORAGE_KEY = 'm11_address_history';
const MAX_HISTORY = 15;

export interface AddressHandoff {
  id: string;
  original: string;
  translated: string;
  helperPhrase: string | null;
  helperTranslated: string | null;
  sourceLang: string;
  targetLang: string;
  targetSpeechCode: string;
  timestamp: number;
}

const HELPER_PHRASES = [
  { id: 'take-me', text: 'Please take me here', icon: '🚕' },
  { id: 'reservation', text: 'I have a reservation here', icon: '🏨' },
  { id: 'stop-here', text: 'Please stop here', icon: '🛑' },
  { id: 'wait-for-me', text: 'Please wait for me', icon: '⏳' },
  { id: 'how-much', text: 'How much will it cost?', icon: '💰' },
  { id: 'show-map', text: 'Please show me on the map', icon: '🗺️' },
];

function loadHistory(): AddressHandoff[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveHistory(entries: AddressHandoff[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); } catch {}
}

interface AddressHandoffScreenProps {
  myLanguage: TranslateLanguage;
  theirLanguage: TranslateLanguage;
  onPickLanguage: (which: 'my' | 'their') => void;
}

export function AddressHandoffScreen({ myLanguage, theirLanguage, onPickLanguage }: AddressHandoffScreenProps) {
  const navigate = useNavigate();
  const { translate } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [address, setAddress] = useState('');
  const [selectedHelper, setSelectedHelper] = useState<string | null>('take-me');
  const [isTranslating, setIsTranslating] = useState(false);
  const [result, setResult] = useState<AddressHandoff | null>(null);
  const [history, setHistory] = useState<AddressHandoff[]>(loadHistory);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 150);
    return () => {
      speechSynthesis.cancel();
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, []);

  const resetControlsTimer = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setControlsVisible(false), 6000);
  }, []);

  const handleTranslate = useCallback(async () => {
    const text = address.trim();
    if (!text || isTranslating) return;
    setIsTranslating(true);

    const helper = selectedHelper ? HELPER_PHRASES.find(h => h.id === selectedHelper) : null;
    const fullText = helper ? `${helper.text}: ${text}` : text;

    const addressResult = await translate(text, myLanguage.name, theirLanguage.name);
    let helperTranslated: string | null = null;
    if (helper) {
      const helperResult = await translate(helper.text, myLanguage.name, theirLanguage.name);
      helperTranslated = helperResult.text || null;
    }

    setIsTranslating(false);

    if (addressResult.text) {
      const entry: AddressHandoff = {
        id: `${text}::${theirLanguage.code}::${Date.now()}`,
        original: text,
        translated: addressResult.text,
        helperPhrase: helper?.text || null,
        helperTranslated,
        sourceLang: myLanguage.name,
        targetLang: theirLanguage.name,
        targetSpeechCode: theirLanguage.speechCode,
        timestamp: Date.now(),
      };
      setResult(entry);
      setHistory(prev => {
        const next = [entry, ...prev.filter(h => h.original !== text || h.targetLang !== theirLanguage.name)].slice(0, MAX_HISTORY);
        saveHistory(next);
        return next;
      });
      resetControlsTimer();
    } else {
      toast.error('Translation failed. Please try again.');
    }
  }, [address, selectedHelper, translate, myLanguage, theirLanguage, isTranslating, resetControlsTimer]);

  const handleSpeak = useCallback((text: string, langCode: string) => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    speechSynthesis.speak(utterance);
    resetControlsTimer();
  }, [resetControlsTimer]);

  const handleSpeakAll = useCallback(() => {
    if (!result) return;
    const fullText = result.helperTranslated
      ? `${result.helperTranslated}. ${result.translated}`
      : result.translated;
    handleSpeak(fullText, result.targetSpeechCode);
  }, [result, handleSpeak]);

  const handleCopy = useCallback(() => {
    if (!result) return;
    const text = result.helperTranslated
      ? `${result.helperTranslated}\n${result.translated}`
      : result.translated;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  const handleReset = useCallback(() => {
    speechSynthesis.cancel();
    setResult(null);
    setAddress('');
    setIsSpeaking(false);
    setCopied(false);
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  const handleLoadHistory = useCallback((entry: AddressHandoff) => {
    setResult(entry);
    setAddress(entry.original);
    setShowHistory(false);
    resetControlsTimer();
  }, [resetControlsTimer]);

  const getFontSize = (text: string): string => {
    const len = text.length;
    if (len <= 20) return 'text-4xl';
    if (len <= 50) return 'text-3xl';
    if (len <= 100) return 'text-2xl';
    if (len <= 200) return 'text-xl';
    return 'text-lg';
  };

  // ─── Full-screen handoff display ─────────────────────────
  if (result) {
    return (
      <div
        className="fixed inset-0 z-50 bg-gray-950 flex flex-col select-none"
        onClick={() => { if (!controlsVisible) resetControlsTimer(); else resetControlsTimer(); }}
        role="presentation"
      >
        {/* Top controls */}
        <div className={`absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-[env(safe-area-inset-top,16px)] pb-4 bg-gradient-to-b from-black/70 to-transparent transition-opacity duration-500 ${controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <button
            onClick={e => { e.stopPropagation(); handleReset(); }}
            className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm hover:bg-white/20 active:scale-95 transition-all min-w-[48px] min-h-[48px] flex items-center justify-center"
            aria-label="Edit address"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm">
            <FlagIcon countryCode={theirLanguage.countryCode} size="sm" />
            <span className="text-sm font-bold text-white/90">{theirLanguage.name}</span>
          </div>
          <button
            onClick={e => { e.stopPropagation(); handleSpeakAll(); }}
            className={`p-3 rounded-2xl backdrop-blur-sm active:scale-95 transition-all min-w-[48px] min-h-[48px] flex items-center justify-center ${isSpeaking ? 'bg-orange-500' : 'bg-white/10 hover:bg-white/20'}`}
            aria-label="Play audio"
          >
            <Volume2 className={`w-5 h-5 ${isSpeaking ? 'text-white animate-pulse' : 'text-white'}`} />
          </button>
        </div>

        {/* Center display */}
        <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-8 py-28">
          {/* Helper phrase */}
          {result.helperTranslated && (
            <p className="text-lg font-bold text-orange-400 text-center mb-6 leading-relaxed">
              {result.helperTranslated}
            </p>
          )}

          {/* Translated address */}
          <div className="flex items-start gap-3 justify-center max-w-2xl">
            <MapPin className="w-8 h-8 text-orange-400 shrink-0 mt-1" />
            <p className={`${getFontSize(result.translated)} font-bold text-white text-center leading-[1.35] break-words`}>
              {result.translated}
            </p>
          </div>

          {/* Original address */}
          <p className="text-sm text-white/25 text-center mt-8 max-w-md leading-relaxed font-medium">
            {result.original}
          </p>
        </div>

        {/* Bottom controls */}
        <div className={`absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-3 px-6 pb-[env(safe-area-inset-bottom,28px)] pt-6 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-500 ${controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <button
            onClick={e => { e.stopPropagation(); handleCopy(); }}
            className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white/70 text-sm font-bold flex items-center gap-2 transition-all active:scale-95 min-h-[48px]"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={e => { e.stopPropagation(); handleReset(); }}
            className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white/70 text-sm font-bold flex items-center gap-2 transition-all active:scale-95 min-h-[48px]"
          >
            <RotateCcw className="w-4 h-4" />
            New
          </button>
        </div>

        {!controlsVisible && (
          <div className="absolute bottom-10 left-0 right-0 flex justify-center pointer-events-none" aria-hidden="true">
            <span className="text-xs text-white/15 font-medium">Tap to show controls</span>
          </div>
        )}
      </div>
    );
  }

  // ─── Input screen ────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] bg-[#FAF7F2] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 h-[56px] shrink-0 bg-white border-b border-gray-100/80">
        <button
          onClick={() => navigate('/translate2')}
          className="p-2.5 -ml-2 rounded-2xl hover:bg-gray-50 active:scale-95 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-orange-500" />
          <h1 className="text-[17px] font-bold text-foreground">Show Address</h1>
        </div>
        <div className="w-11" />
      </header>

      <div className="flex-1 overflow-y-auto pb-8">
        {/* Language target pill */}
        <div className="mx-4 mt-4 flex items-center justify-center">
          <button
            onClick={() => onPickLanguage('their')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-gray-200/80 hover:border-orange-200 active:scale-[0.97] transition-all min-h-[40px] shadow-sm"
          >
            <span className="text-xs text-muted-foreground font-medium">Translate to</span>
            <FlagIcon countryCode={theirLanguage.countryCode} size="sm" />
            <span className="text-sm font-bold text-foreground">{theirLanguage.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>

        {/* Address input */}
        <div className="mx-4 mt-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden">
            <div className="flex items-center gap-2 px-4 pt-4 pb-1">
              <MapPin className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Destination</span>
            </div>
            <textarea
              ref={textareaRef}
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Paste or type an address, hotel name, station…"
              rows={3}
              className="w-full px-4 py-3 text-[16px] text-foreground placeholder:text-gray-300 resize-none focus:outline-none bg-transparent leading-relaxed"
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleTranslate();
                }
              }}
            />
            {address.trim() && (
              <div className="flex justify-end px-3 pb-3">
                <button
                  onClick={() => setAddress('')}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-95 transition-all"
                  aria-label="Clear"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Helper phrase picker */}
        <div className="mx-4 mt-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">Add a message</p>
          <div className="flex flex-wrap gap-2">
            {HELPER_PHRASES.map(hp => (
              <button
                key={hp.id}
                onClick={() => setSelectedHelper(prev => prev === hp.id ? null : hp.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-all active:scale-[0.96] min-h-[36px] ${
                  selectedHelper === hp.id
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-white border border-gray-200/80 text-foreground hover:border-orange-200'
                }`}
              >
                <span>{hp.icon}</span>
                <span>{hp.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Translate button */}
        <div className="mx-4 mt-5">
          <button
            onClick={handleTranslate}
            disabled={!address.trim() || isTranslating}
            className="w-full py-4 rounded-2xl bg-orange-500 text-white font-bold text-base flex items-center justify-center gap-2.5 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] min-h-[56px] shadow-lg shadow-orange-200/50"
          >
            {isTranslating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Translating…
              </>
            ) : (
              <>
                <MapPin className="w-5 h-5" />
                Show to Driver
              </>
            )}
          </button>
        </div>

        {/* Recent addresses */}
        {history.length > 0 && (
          <div className="mx-4 mt-6">
            <button
              onClick={() => setShowHistory(v => !v)}
              className="flex items-center gap-2 mb-3 w-full"
            >
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-bold text-foreground">Recent Addresses</span>
              <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground ml-auto transition-transform ${showHistory ? 'rotate-180' : ''}`} />
            </button>
            {showHistory && (
              <div className="space-y-2 animate-fade-in">
                {history.slice(0, 8).map(entry => (
                  <button
                    key={entry.id}
                    onClick={() => handleLoadHistory(entry)}
                    className="w-full text-left bg-white rounded-2xl p-3.5 border border-gray-100/80 hover:border-orange-200 active:scale-[0.98] transition-all min-h-[52px]"
                  >
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground font-bold truncate">{entry.original}</p>
                        <p className="text-sm text-orange-600 mt-1 truncate font-semibold">{entry.translated}</p>
                        <p className="text-[11px] text-muted-foreground mt-1 font-medium">{entry.targetLang}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Helper text */}
        {!address.trim() && history.length === 0 && (
          <div className="flex flex-col items-center pt-10 px-8 text-center">
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-4">
              <MapPin className="w-7 h-7 text-orange-400" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[260px] font-medium">
              Paste a hotel name, address, or landmark — then hand your phone to the driver or staff.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
