import { SUPPORTED_LANGUAGES, FontSizeLevel } from '@/types/translate';
import { FlagIcon } from '@/components/ui/FlagIcon';

interface ConversationStreamingAreaProps {
  inputText: string;
  outputText: string;
  sourceLangCode: string;
  targetLangCode: string;
  fontSize: FontSizeLevel;
}

const fontSizeMap: Record<FontSizeLevel, string> = {
  small: 'text-[15px]',
  default: 'text-lg',
  large: 'text-2xl',
};

export function ConversationStreamingArea({
  inputText,
  outputText,
  sourceLangCode,
  targetLangCode,
  fontSize,
}: ConversationStreamingAreaProps) {
  const sourceLang = SUPPORTED_LANGUAGES.find(l => l.code === sourceLangCode);
  const targetLang = SUPPORTED_LANGUAGES.find(l => l.code === targetLangCode);

  if (!inputText && !outputText) return null;

  return (
    <div className="animate-fade-in" role="status" aria-live="polite" aria-label="Live translation in progress">
      <div className="rounded-2xl overflow-hidden border border-blue-100/40 shadow-[0_1px_4px_-2px_rgba(59,130,246,0.06)]">
        {/* Input */}
        {inputText && (
          <div className="px-4 pt-3.5 pb-3 bg-blue-50/25">
            <div className="flex items-center gap-2 mb-1.5">
              <FlagIcon countryCode={sourceLang?.countryCode || ''} size="sm" />
              <span className="text-[10px] font-semibold text-blue-500/50 uppercase tracking-widest">
                {sourceLang?.name}
              </span>
              <span className="ml-auto flex items-center gap-[3px]" aria-hidden="true">
                {[0, 0.15, 0.3].map((delay, i) => (
                  <span
                    key={i}
                    className="w-[3px] h-[3px] rounded-full bg-blue-400/40 animate-pulse"
                    style={{ animationDelay: `${delay}s` }}
                  />
                ))}
              </span>
            </div>
            <p className={`${fontSizeMap[fontSize]} text-foreground/75 font-medium leading-relaxed`}>
              {inputText}
              <span
                className="inline-block w-[1.5px] h-[0.85em] bg-blue-400/50 animate-pulse ml-0.5 align-middle rounded-full"
                aria-hidden="true"
              />
            </p>
          </div>
        )}

        {inputText && outputText && (
          <div className="mx-4 border-t border-blue-100/25" />
        )}

        {/* Output */}
        {outputText && (
          <div className="px-4 pt-3 pb-3.5 bg-orange-50/15">
            <div className="flex items-center gap-2 mb-1.5">
              <FlagIcon countryCode={targetLang?.countryCode || ''} size="sm" />
              <span className="text-[10px] font-semibold text-orange-500/50 uppercase tracking-widest">
                {targetLang?.name}
              </span>
              <span className="ml-auto flex items-center gap-[3px]" aria-hidden="true">
                {[0, 0.15, 0.3].map((delay, i) => (
                  <span
                    key={i}
                    className="w-[3px] h-[3px] rounded-full bg-orange-400/40 animate-pulse"
                    style={{ animationDelay: `${delay}s` }}
                  />
                ))}
              </span>
            </div>
            <p className={`${fontSizeMap[fontSize]} text-foreground font-semibold leading-relaxed`}>
              {outputText}
              <span
                className="inline-block w-[1.5px] h-[0.85em] bg-orange-400/50 animate-pulse ml-0.5 align-middle rounded-full"
                aria-hidden="true"
              />
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
