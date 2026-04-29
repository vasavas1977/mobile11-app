import { Volume2 } from 'lucide-react';
import { TranslateMessage, FontSizeLevel, TranslateLanguage } from '@/types/translate';
import { FlagIcon } from '@/components/ui/FlagIcon';

interface ConversationFaceToFaceProps {
  messages: TranslateMessage[];
  fontSize: FontSizeLevel;
  myLanguage: TranslateLanguage;
  theirLanguage: TranslateLanguage;
  streamingInput: string;
  streamingOutput: string;
}

const sizeMap: Record<FontSizeLevel, string> = {
  small: 'text-xl',
  default: 'text-2xl',
  large: 'text-4xl',
};

export function ConversationFaceToFace({
  messages,
  fontSize,
  myLanguage,
  theirLanguage,
  streamingInput,
  streamingOutput,
}: ConversationFaceToFaceProps) {
  const lastMsg = messages[messages.length - 1];
  const isStreaming = !!(streamingInput || streamingOutput);

  const topText = isStreaming
    ? (streamingOutput || '…')
    : lastMsg
    ? (lastMsg.speaker === 'user' ? lastMsg.translatedText : lastMsg.originalText)
    : '';

  const bottomText = isStreaming
    ? (streamingInput || '…')
    : lastMsg
    ? (lastMsg.speaker === 'user' ? lastMsg.originalText : lastMsg.translatedText)
    : '';

  const speakText = (text: string, lang: TranslateLanguage) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang.speechCode;
    speechSynthesis.speak(u);
  };

  if (!lastMsg && !isStreaming) return null;

  return (
    <div className="flex-1 flex flex-col">
      {/* Top — rotated for other person */}
      <div
        className="flex-1 flex items-center justify-center p-6 bg-gray-50/60"
        style={{ transform: 'rotate(180deg)' }}
      >
        <div className="text-center space-y-3 max-w-full px-2">
          <div className="flex items-center justify-center gap-2">
            <FlagIcon countryCode={theirLanguage.countryCode} size="sm" />
            <span className="text-[12px] text-muted-foreground/70 font-semibold tracking-wide uppercase">
              {theirLanguage.name}
            </span>
            {isStreaming && (
              <span className="flex gap-[3px] ml-1" aria-hidden="true">
                {[0, 0.15, 0.3].map((d, i) => (
                  <span key={i} className="w-[3px] h-[3px] rounded-full bg-orange-400/50 animate-pulse" style={{ animationDelay: `${d}s` }} />
                ))}
              </span>
            )}
          </div>
          <p className={`${sizeMap[fontSize]} font-bold text-foreground leading-snug break-words`}>
            {topText}
            {isStreaming && (
              <span className="inline-block w-[2px] h-[0.8em] bg-orange-400/50 animate-pulse ml-0.5 align-middle rounded-full" aria-hidden="true" />
            )}
          </p>
          {!isStreaming && topText && (
            <button
              onClick={() => speakText(topText, theirLanguage)}
              className="p-3 rounded-full bg-gray-100/80 hover:bg-gray-200/60 active:scale-95 transition-all mx-auto min-w-[48px] min-h-[48px] flex items-center justify-center"
              aria-label="Play audio"
            >
              <Volume2 className="w-4.5 h-4.5 text-muted-foreground/50" />
            </button>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="relative h-px" aria-hidden="true">
        <div className={`absolute inset-0 ${
          isStreaming
            ? 'bg-gradient-to-r from-blue-300/60 via-orange-300/60 to-blue-300/60 animate-pulse'
            : 'bg-gray-200/60'
        }`} />
      </div>

      {/* Bottom — user */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="text-center space-y-3 max-w-full px-2">
          <div className="flex items-center justify-center gap-2">
            <FlagIcon countryCode={myLanguage.countryCode} size="sm" />
            <span className="text-[12px] text-muted-foreground/70 font-semibold tracking-wide uppercase">
              {myLanguage.name}
            </span>
            {isStreaming && (
              <span className="flex gap-[3px] ml-1" aria-hidden="true">
                {[0, 0.15, 0.3].map((d, i) => (
                  <span key={i} className="w-[3px] h-[3px] rounded-full bg-blue-400/50 animate-pulse" style={{ animationDelay: `${d}s` }} />
                ))}
              </span>
            )}
          </div>
          <p className={`${sizeMap[fontSize]} font-bold text-foreground leading-snug break-words`}>
            {bottomText}
            {isStreaming && (
              <span className="inline-block w-[2px] h-[0.8em] bg-blue-400/50 animate-pulse ml-0.5 align-middle rounded-full" aria-hidden="true" />
            )}
          </p>
          {!isStreaming && bottomText && (
            <button
              onClick={() => speakText(bottomText, myLanguage)}
              className="p-3 rounded-full bg-gray-100/80 hover:bg-gray-200/60 active:scale-95 transition-all mx-auto min-w-[48px] min-h-[48px] flex items-center justify-center"
              aria-label="Play audio"
            >
              <Volume2 className="w-4.5 h-4.5 text-muted-foreground/50" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
