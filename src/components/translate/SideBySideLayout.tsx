import { TranslateMessage, FontSizeLevel, SUPPORTED_LANGUAGES } from '@/types/translate';
import { FlagIcon } from '@/components/ui/FlagIcon';

interface SideBySideLayoutProps {
  messages: TranslateMessage[];
  fontSize: FontSizeLevel;
  myLangCode: string;
  theirLangCode: string;
  streamingInput?: string;
  streamingOutput?: string;
}

const sizeMap: Record<FontSizeLevel, string> = {
  small: 'text-[13px]',
  default: 'text-[15px]',
  large: 'text-lg',
};

export function SideBySideLayout({ messages, fontSize, myLangCode, theirLangCode, streamingInput, streamingOutput }: SideBySideLayoutProps) {
  const myLang = SUPPORTED_LANGUAGES.find(l => l.code === myLangCode);
  const theirLang = SUPPORTED_LANGUAGES.find(l => l.code === theirLangCode);

  return (
    <div className="flex-1 flex">
      {/* Left — My language */}
      <div className="flex-1 min-w-0 border-r border-gray-100/60 overflow-y-auto">
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-3 py-2.5 border-b border-gray-100/50 flex items-center gap-2 z-10">
          <FlagIcon countryCode={myLang?.countryCode || ''} size="sm" />
          <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">{myLang?.name}</span>
        </div>
        <div className="p-3 space-y-2.5">
          {messages.map(msg => {
            const text = msg.speaker === 'user' ? msg.originalText : msg.translatedText;
            return (
              <div key={msg.id} className={`px-3 py-2.5 rounded-xl ${msg.speaker === 'user' ? 'bg-blue-50/40' : 'bg-gray-50/60'}`}>
                <p className={`${sizeMap[fontSize]} text-foreground/85 leading-relaxed break-words`}>{text}</p>
              </div>
            );
          })}
          {streamingInput && (
            <div className="px-3 py-2.5 rounded-xl bg-blue-50/30 border border-blue-200/30 border-dashed">
              <p className={`${sizeMap[fontSize]} text-foreground/85 leading-relaxed break-words`}>
                {streamingInput}
                <span className="inline-block w-[1.5px] h-[0.85em] bg-blue-400/50 animate-pulse ml-0.5 align-middle rounded-full" />
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right — Their language */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-3 py-2.5 border-b border-gray-100/50 flex items-center gap-2 z-10">
          <FlagIcon countryCode={theirLang?.countryCode || ''} size="sm" />
          <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">{theirLang?.name}</span>
        </div>
        <div className="p-3 space-y-2.5">
          {messages.map(msg => {
            const text = msg.speaker === 'user' ? msg.translatedText : msg.originalText;
            return (
              <div key={msg.id} className={`px-3 py-2.5 rounded-xl ${msg.speaker === 'other' ? 'bg-orange-50/30' : 'bg-gray-50/60'}`}>
                <p className={`${sizeMap[fontSize]} text-foreground/85 leading-relaxed break-words`}>{text}</p>
              </div>
            );
          })}
          {streamingOutput && (
            <div className="px-3 py-2.5 rounded-xl bg-orange-50/25 border border-orange-200/30 border-dashed">
              <p className={`${sizeMap[fontSize]} text-foreground/85 leading-relaxed break-words`}>
                {streamingOutput}
                <span className="inline-block w-[1.5px] h-[0.85em] bg-orange-400/50 animate-pulse ml-0.5 align-middle rounded-full" />
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
