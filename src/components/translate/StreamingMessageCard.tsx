import { SUPPORTED_LANGUAGES, FontSizeLevel } from '@/types/translate';
import { FlagIcon } from '@/components/ui/FlagIcon';

interface StreamingMessageCardProps {
  inputText: string;
  outputText: string;
  sourceLangCode: string;
  targetLangCode: string;
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

export function StreamingMessageCard({ inputText, outputText, sourceLangCode, targetLangCode, fontSize }: StreamingMessageCardProps) {
  const sourceLang = SUPPORTED_LANGUAGES.find(l => l.code === sourceLangCode);
  const targetLang = SUPPORTED_LANGUAGES.find(l => l.code === targetLangCode);

  return (
    <div className="flex flex-col gap-2 items-end">
      {/* Input (what user is saying) */}
      {inputText && (
        <div className="max-w-[90%] rounded-2xl px-4 py-3 bg-blue-50 border border-blue-200 border-dashed">
          <div className="flex items-center gap-2 mb-1">
            <FlagIcon countryCode={sourceLang?.countryCode || ''} size="sm" />
            <span className={`${subFontMap[fontSize]} text-muted-foreground font-medium`}>
              {sourceLang?.name}
            </span>
            <span className="ml-auto flex gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '0.15s' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '0.3s' }} />
            </span>
          </div>
          <p className={`${fontSizeMap[fontSize]} text-foreground font-medium leading-relaxed`}>
            {inputText}
          </p>
        </div>
      )}

      {/* Output (translation) */}
      {outputText && (
        <div className="max-w-[90%] rounded-2xl px-4 py-3 bg-orange-50 border border-orange-200 border-dashed">
          <div className="flex items-center gap-2 mb-1">
            <FlagIcon countryCode={targetLang?.countryCode || ''} size="sm" />
            <span className={`${subFontMap[fontSize]} text-muted-foreground font-medium`}>
              {targetLang?.name}
            </span>
            <span className="ml-auto flex gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" style={{ animationDelay: '0.15s' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" style={{ animationDelay: '0.3s' }} />
            </span>
          </div>
          <p className={`${fontSizeMap[fontSize]} text-foreground font-medium leading-relaxed`}>
            {outputText}
          </p>
        </div>
      )}
    </div>
  );
}
