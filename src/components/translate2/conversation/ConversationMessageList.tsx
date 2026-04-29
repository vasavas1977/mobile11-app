import { useRef, useEffect } from 'react';
import { Volume2 } from 'lucide-react';
import { TranslateMessage, FontSizeLevel, SUPPORTED_LANGUAGES } from '@/types/translate';
import { FlagIcon } from '@/components/ui/FlagIcon';

interface ConversationMessageListProps {
  messages: TranslateMessage[];
  fontSize: FontSizeLevel;
  children?: React.ReactNode;
}

const fontSizeMap: Record<FontSizeLevel, string> = {
  small: 'text-[13px]',
  default: 'text-[15px]',
  large: 'text-lg',
};

const speakText = (text: string, langCode: string) => {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
  if (!lang) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang.speechCode;
  speechSynthesis.speak(u);
};

export function ConversationMessageList({ messages, fontSize, children }: ConversationMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, children]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 pb-8 space-y-4" role="log" aria-label="Conversation messages">
      {messages.map((msg, i) => {
        const sourceLang = SUPPORTED_LANGUAGES.find(l => l.code === msg.sourceLang);
        const targetLang = SUPPORTED_LANGUAGES.find(l => l.code === msg.targetLang);

        return (
          <div
            key={msg.id}
            className="rounded-2xl bg-white border border-gray-100/70 shadow-[0_1px_3px_-1px_rgba(0,0,0,0.04)] overflow-hidden animate-fade-in"
            style={{ animationDelay: `${Math.min(i * 30, 150)}ms` }}
          >
            {/* Original */}
            <div className="px-4 pt-3.5 pb-2.5">
              <div className="flex items-center gap-2 mb-1">
                <FlagIcon countryCode={sourceLang?.countryCode || ''} size="sm" />
                <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
                  {sourceLang?.name}
                </span>
                <button
                  onClick={() => speakText(msg.originalText, msg.sourceLang)}
                  className="ml-auto p-1.5 -mr-1 rounded-full hover:bg-gray-50 active:scale-95 transition-all"
                  aria-label={`Play original in ${sourceLang?.name}`}
                >
                  <Volume2 className="w-3.5 h-3.5 text-muted-foreground/40" />
                </button>
              </div>
              <p className={`${fontSizeMap[fontSize]} text-foreground/70 leading-relaxed`}>
                {msg.originalText}
              </p>
            </div>

            {/* Divider */}
            <div className="mx-4 border-t border-gray-100/50" />

            {/* Translation */}
            <div className="px-4 pt-2.5 pb-3.5">
              <div className="flex items-center gap-2 mb-1">
                <FlagIcon countryCode={targetLang?.countryCode || ''} size="sm" />
                <span className="text-[10px] font-semibold text-orange-500/60 uppercase tracking-widest">
                  {targetLang?.name}
                </span>
                <button
                  onClick={() => speakText(msg.translatedText, msg.targetLang)}
                  className="ml-auto p-1.5 -mr-1 rounded-full hover:bg-orange-50/60 active:scale-95 transition-all"
                  aria-label={`Play translation in ${targetLang?.name}`}
                >
                  <Volume2 className="w-3.5 h-3.5 text-orange-400/50" />
                </button>
              </div>
              <p className={`${fontSizeMap[fontSize]} text-foreground font-medium leading-relaxed`}>
                {msg.translatedText}
              </p>
            </div>
          </div>
        );
      })}

      {children}
    </div>
  );
}
