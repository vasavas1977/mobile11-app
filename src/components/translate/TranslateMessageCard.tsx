import { Volume2 } from 'lucide-react';
import { TranslateMessage, SUPPORTED_LANGUAGES, FontSizeLevel } from '@/types/translate';
import { FlagIcon } from '@/components/ui/FlagIcon';

interface TranslateMessageCardProps {
  message: TranslateMessage;
  fontSize: FontSizeLevel;
}

const fontSizeMap: Record<FontSizeLevel, string> = {
  small: 'text-base',
  default: 'text-lg',
  large: 'text-2xl',
};

const subFontMap: Record<FontSizeLevel, string> = {
  small: 'text-xs',
  default: 'text-sm',
  large: 'text-base',
};

export function TranslateMessageCard({ message, fontSize }: TranslateMessageCardProps) {
  const sourceLang = SUPPORTED_LANGUAGES.find(l => l.code === message.sourceLang);
  const targetLang = SUPPORTED_LANGUAGES.find(l => l.code === message.targetLang);
  const isUser = message.speaker === 'user';

  const speakText = (text: string, langCode: string) => {
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
    if (!lang) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang.speechCode;
    speechSynthesis.speak(utterance);
  };

  return (
    <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
      {/* Original */}
      <div className={`max-w-[90%] rounded-2xl px-4 py-3 ${
        isUser ? 'bg-blue-50 border border-blue-100' : 'bg-white border border-gray-200'
      }`}>
        <div className="flex items-center gap-2 mb-1">
          <FlagIcon countryCode={sourceLang?.countryCode || ''} size="sm" />
          <span className={`${subFontMap[fontSize]} text-muted-foreground font-medium`}>
            {sourceLang?.name}
          </span>
          <button
            onClick={() => speakText(message.originalText, message.sourceLang)}
            className="ml-auto p-1 rounded-full hover:bg-gray-100"
          >
            <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
        <p className={`${fontSizeMap[fontSize]} text-foreground font-medium leading-relaxed`}>
          {message.originalText}
        </p>
      </div>

      {/* Translated */}
      <div className={`max-w-[90%] rounded-2xl px-4 py-3 ${
        isUser ? 'bg-orange-50 border border-orange-100' : 'bg-gray-50 border border-gray-200'
      }`}>
        <div className="flex items-center gap-2 mb-1">
          <FlagIcon countryCode={targetLang?.countryCode || ''} size="sm" />
          <span className={`${subFontMap[fontSize]} text-muted-foreground font-medium`}>
            {targetLang?.name}
          </span>
          <button
            onClick={() => speakText(message.translatedText, message.targetLang)}
            className="ml-auto p-1 rounded-full hover:bg-gray-100"
          >
            <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
        <p className={`${fontSizeMap[fontSize]} text-foreground font-medium leading-relaxed`}>
          {message.translatedText}
        </p>
      </div>
    </div>
  );
}
