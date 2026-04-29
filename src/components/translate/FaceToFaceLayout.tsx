import { TranslateMessage, FontSizeLevel, SUPPORTED_LANGUAGES } from '@/types/translate';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { Volume2 } from 'lucide-react';

interface FaceToFaceLayoutProps {
  messages: TranslateMessage[];
  fontSize: FontSizeLevel;
  myLangCode: string;
  theirLangCode: string;
  streamingInput?: string;
  streamingOutput?: string;
}

const sizeMap: Record<FontSizeLevel, string> = {
  small: 'text-lg',
  default: 'text-2xl',
  large: 'text-4xl',
};

export function FaceToFaceLayout({ messages, fontSize, myLangCode, theirLangCode, streamingInput, streamingOutput }: FaceToFaceLayoutProps) {
  const lastMsg = messages[messages.length - 1];
  const theirLang = SUPPORTED_LANGUAGES.find(l => l.code === theirLangCode);
  const myLang = SUPPORTED_LANGUAGES.find(l => l.code === myLangCode);

  const speakText = (text: string, code: string) => {
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
    if (!lang) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang.speechCode;
    speechSynthesis.speak(u);
  };

  const isStreaming = !!(streamingInput || streamingOutput);

  // Use streaming content if available, otherwise use last message
  const topText = isStreaming
    ? (streamingOutput || '…')
    : lastMsg
      ? (lastMsg.speaker === 'user' ? lastMsg.translatedText : lastMsg.originalText)
      : '';
  const topLang = theirLangCode;

  const bottomText = isStreaming
    ? (streamingInput || '…')
    : lastMsg
      ? (lastMsg.speaker === 'user' ? lastMsg.originalText : lastMsg.translatedText)
      : '';
  const bottomLang = myLangCode;

  if (!lastMsg && !isStreaming) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Start speaking to see translations</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Top half - rotated 180° for the other person */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 border-b border-gray-200" style={{ transform: 'rotate(180deg)' }}>
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <FlagIcon countryCode={SUPPORTED_LANGUAGES.find(l => l.code === topLang)?.countryCode || ''} size="sm" />
            <span className="text-sm text-muted-foreground">{SUPPORTED_LANGUAGES.find(l => l.code === topLang)?.name}</span>
            {isStreaming && (
              <span className="flex gap-0.5 ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" style={{ animationDelay: '0.15s' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" style={{ animationDelay: '0.3s' }} />
              </span>
            )}
          </div>
          <p className={`${sizeMap[fontSize]} font-semibold text-foreground leading-relaxed`}>{topText}</p>
          {!isStreaming && topText && (
            <button onClick={() => speakText(topText, topLang)} className="p-2 rounded-full hover:bg-gray-200 mx-auto">
              <Volume2 className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className={`h-px ${isStreaming ? 'bg-orange-400 animate-pulse' : 'bg-orange-300'}`} />

      {/* Bottom half - normal orientation for user */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <FlagIcon countryCode={SUPPORTED_LANGUAGES.find(l => l.code === bottomLang)?.countryCode || ''} size="sm" />
            <span className="text-sm text-muted-foreground">{SUPPORTED_LANGUAGES.find(l => l.code === bottomLang)?.name}</span>
            {isStreaming && (
              <span className="flex gap-0.5 ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '0.15s' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '0.3s' }} />
              </span>
            )}
          </div>
          <p className={`${sizeMap[fontSize]} font-semibold text-foreground leading-relaxed`}>{bottomText}</p>
          {!isStreaming && bottomText && (
            <button onClick={() => speakText(bottomText, bottomLang)} className="p-2 rounded-full hover:bg-gray-100 mx-auto">
              <Volume2 className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
