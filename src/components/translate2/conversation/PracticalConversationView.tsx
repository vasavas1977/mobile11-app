import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, BookOpen, Siren, Camera, Loader2, ArrowLeftRight, Type as TypeIcon } from 'lucide-react';
import { TranslateLanguage, TranslateMessage, FontSizeLevel } from '@/types/translate';
import { useVoiceCapture } from '@/hooks/useVoiceCapture';
import { useTranslation } from '@/hooks/useTranslation';
import { MessageReplayActions } from './MessageReplayActions';
import { CountryAutoChip } from './CountryAutoChip';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { toast } from 'sonner';
import { safeSpeakText } from '@/utils/safeSpeech';

interface PracticalConversationViewProps {
  myLanguage: TranslateLanguage;
  theirLanguage: TranslateLanguage;
  setTheirLanguage: (l: TranslateLanguage) => void;
  messages: TranslateMessage[];
  addMessage: (m: TranslateMessage) => void;
  swapLanguages: () => void;
  fontSize: FontSizeLevel;
  setFontSize: (s: FontSizeLevel) => void;
}

const FONT_CLASSES: Record<FontSizeLevel, string> = {
  small: 'text-[15px]',
  default: 'text-[17px]',
  large: 'text-[21px]',
};

const NEXT_FONT: Record<FontSizeLevel, FontSizeLevel> = {
  small: 'default',
  default: 'large',
  large: 'small',
};

export function PracticalConversationView({
  myLanguage,
  theirLanguage,
  setTheirLanguage,
  messages,
  addMessage,
  swapLanguages,
  fontSize,
  setFontSize,
}: PracticalConversationViewProps) {
  const navigate = useNavigate();
  const { startCapture, stopCapture, isCapturing } = useVoiceCapture();
  const { translate } = useTranslation();

  const [activeSpeaker, setActiveSpeaker] = useState<'user' | 'other'>('user');
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isHoldingRef = useRef(false);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, isProcessing]);

  const speakerLang = activeSpeaker === 'user' ? myLanguage : theirLanguage;
  const targetLang = activeSpeaker === 'user' ? theirLanguage : myLanguage;

  const handlePressStart = useCallback(async () => {
    if (isProcessing || isCapturing) return;
    isHoldingRef.current = true;
    await startCapture(speakerLang.speechCode);
  }, [isProcessing, isCapturing, startCapture, speakerLang.speechCode]);

  const handlePressEnd = useCallback(async () => {
    if (!isHoldingRef.current) return;
    isHoldingRef.current = false;
    setIsProcessing(true);
    try {
      const transcript = await stopCapture(speakerLang.speechCode);
      if (!transcript || transcript.trim().length === 0) {
        toast('Didn\'t catch that — try again');
        return;
      }
      const result = await translate(transcript, speakerLang.name, targetLang.name);
      if (!result.text) {
        toast.error(result.error || 'Translation failed');
        return;
      }
      const msg: TranslateMessage = {
        id: crypto.randomUUID(),
        originalText: transcript,
        translatedText: result.text,
        sourceLang: speakerLang.code,
        targetLang: targetLang.code,
        speaker: activeSpeaker,
        timestamp: new Date(),
        mode: 'voice',
        status: 'done',
      };
      addMessage(msg);

      // Auto-speak translated voice with best available system voice
      try {
        safeSpeakText(result.text, targetLang.speechCode, { rate: 0.95 });
      } catch {}

      // Auto-flip to the other speaker for natural turn-taking
      setActiveSpeaker(prev => (prev === 'user' ? 'other' : 'user'));
    } finally {
      setIsProcessing(false);
    }
  }, [stopCapture, translate, speakerLang, targetLang, activeSpeaker, addMessage]);

  const handlePressCancel = useCallback(() => {
    if (!isHoldingRef.current) return;
    isHoldingRef.current = false;
    // Best-effort cancel: stopCapture but ignore the result
    stopCapture(speakerLang.speechCode).catch(() => {});
  }, [stopCapture, speakerLang.speechCode]);

  const renderMessage = (msg: TranslateMessage) => {
    const isUser = msg.speaker === 'user';
    return (
      <div key={msg.id} className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
        <div
          className={`max-w-[88%] p-4 rounded-3xl shadow-sm ${
            isUser
              ? 'bg-blue-50 border border-blue-100/70 rounded-bl-md'
              : 'bg-orange-50 border border-orange-100/70 rounded-br-md'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <FlagIcon countryCode={(isUser ? myLanguage : theirLanguage).countryCode} size="sm" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {(isUser ? myLanguage : theirLanguage).name}
            </span>
          </div>
          <p className={`${FONT_CLASSES[fontSize]} text-foreground/90 leading-snug font-medium`}>
            {msg.originalText}
          </p>
          <div className="my-2 border-t border-foreground/10" />
          <div className="flex items-center gap-1.5 mb-1">
            <FlagIcon countryCode={(isUser ? theirLanguage : myLanguage).countryCode} size="sm" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {(isUser ? theirLanguage : myLanguage).name}
            </span>
          </div>
          <p className={`${FONT_CLASSES[fontSize]} text-foreground leading-snug font-bold`}>
            {msg.translatedText}
          </p>
          <MessageReplayActions
            text={msg.translatedText}
            speechCode={(isUser ? theirLanguage : myLanguage).speechCode}
          />
        </div>
      </div>
    );
  };

  const isEmpty = messages.length === 0;
  const micBusy = isCapturing || isProcessing;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <CountryAutoChip currentTheirCode={theirLanguage.code} onApply={setTheirLanguage} />

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pt-3 pb-2 space-y-3">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-8">
            <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center mb-4">
              <Mic className="w-7 h-7 text-foreground/40" />
            </div>
            <p className="text-base font-semibold text-foreground">Tap & hold to talk</p>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              Pick who's speaking, hold the mic, then release. We'll translate and read it aloud.
            </p>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        {isProcessing && (
          <div className="flex justify-center py-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-foreground/5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-foreground/60" />
              <span className="text-[12px] font-semibold text-foreground/60">Translating…</span>
            </div>
          </div>
        )}
      </div>

      {/* Speaker selector */}
      <div className="px-4 pt-2 pb-1 flex items-center justify-center gap-2">
        <button
          onClick={() => setActiveSpeaker('user')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-full border transition-all ${
            activeSpeaker === 'user'
              ? 'bg-foreground text-background border-foreground shadow-sm'
              : 'bg-white text-foreground border-border hover:border-foreground/30'
          }`}
        >
          <FlagIcon countryCode={myLanguage.countryCode} size="sm" />
          <span className="text-[12px] font-bold">Me · {myLanguage.name}</span>
        </button>
        <button
          onClick={swapLanguages}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-foreground/5 hover:bg-foreground/10 active:scale-95 transition-all"
          aria-label="Swap languages"
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-foreground/70" />
        </button>
        <button
          onClick={() => setActiveSpeaker('other')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-full border transition-all ${
            activeSpeaker === 'other'
              ? 'bg-foreground text-background border-foreground shadow-sm'
              : 'bg-white text-foreground border-border hover:border-foreground/30'
          }`}
        >
          <FlagIcon countryCode={theirLanguage.countryCode} size="sm" />
          <span className="text-[12px] font-bold">Them · {theirLanguage.name}</span>
        </button>
      </div>

      {/* Big mic button */}
      <div className="px-4 pt-3 pb-2 flex flex-col items-center">
        <button
          onPointerDown={handlePressStart}
          onPointerUp={handlePressEnd}
          onPointerLeave={handlePressCancel}
          onPointerCancel={handlePressCancel}
          disabled={isProcessing}
          className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all select-none touch-none ${
            isCapturing
              ? 'bg-red-500 scale-110 shadow-[0_0_0_8px_rgba(239,68,68,0.18)]'
              : isProcessing
                ? 'bg-foreground/40'
                : 'bg-foreground active:scale-95 shadow-lg'
          }`}
          aria-label={isCapturing ? 'Release to translate' : 'Hold to talk'}
        >
          {isProcessing ? (
            <Loader2 className="w-7 h-7 text-background animate-spin" />
          ) : (
            <Mic className="w-7 h-7 text-background" />
          )}
        </button>
        <p className="mt-2 text-[11px] font-semibold text-muted-foreground">
          {isCapturing ? 'Listening… release to translate' : micBusy ? 'Working…' : 'Hold to talk'}
        </p>
      </div>

      {/* Bottom action bar */}
      <div className="px-3 pb-3 pt-1 safe-bottom flex items-center justify-around gap-2 bg-white/95 backdrop-blur border-t border-border/40">
        <BarButton
          icon={<BookOpen className="w-4 h-4" />}
          label="Phrases"
          onClick={() => navigate('/translate2/phrases')}
        />
        <BarButton
          icon={<Siren className="w-4 h-4" />}
          label="Emergency"
          onClick={() => navigate('/translate2/phrases', { state: { category: 'emergency' } })}
          tone="danger"
        />
        <BarButton
          icon={<TypeIcon className="w-4 h-4" />}
          label="Type"
          onClick={() => navigate('/translate2/type')}
        />
        <BarButton
          icon={<Camera className="w-4 h-4" />}
          label="Camera"
          disabled
          badge="Soon"
        />
        <BarButton
          icon={<span className="text-[10px] font-bold">{fontSize === 'small' ? 'A−' : fontSize === 'large' ? 'A+' : 'A'}</span>}
          label="Size"
          onClick={() => setFontSize(NEXT_FONT[fontSize])}
        />
      </div>
    </div>
  );
}

function BarButton({
  icon, label, onClick, disabled, badge, tone,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  badge?: string;
  tone?: 'danger';
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-xl transition-all active:scale-95 ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-foreground/5'
      } ${tone === 'danger' ? 'text-red-600' : 'text-foreground/80'}`}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      {badge && (
        <span className="absolute -top-1 right-1 text-[8px] font-bold bg-foreground/80 text-background px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </button>
  );
}
