import { ArrowLeftRight } from 'lucide-react';
import { TranslateLanguage } from '@/types/translate';
import { FlagIcon } from '@/components/ui/FlagIcon';

interface LanguagePairPillProps {
  myLanguage: TranslateLanguage;
  theirLanguage: TranslateLanguage;
  onSwap: () => void;
  onPickLanguage: (which: 'my' | 'their') => void;
}

export function LanguagePairPill({ myLanguage, theirLanguage, onSwap, onPickLanguage }: LanguagePairPillProps) {
  return (
    <div className="flex items-center gap-2 px-4" role="group" aria-label="Language pair selector">
      <button
        onClick={() => onPickLanguage('my')}
        className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-white border border-gray-200/80 hover:border-orange-200 active:scale-[0.97] transition-all flex-1 min-w-0 min-h-[52px] shadow-sm"
        aria-label={`Source language: ${myLanguage.name}`}
      >
        <FlagIcon countryCode={myLanguage.countryCode} size="md" />
        <div className="text-left min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{myLanguage.name}</p>
          <p className="text-[11px] text-muted-foreground truncate">{myLanguage.nativeName}</p>
        </div>
      </button>

      <button
        onClick={onSwap}
        className="p-2.5 rounded-full bg-orange-50 border border-orange-200/80 hover:bg-orange-100 active:scale-90 active:rotate-180 transition-all shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center shadow-sm"
        aria-label="Swap languages"
      >
        <ArrowLeftRight className="w-4 h-4 text-orange-500" />
      </button>

      <button
        onClick={() => onPickLanguage('their')}
        className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-white border border-gray-200/80 hover:border-orange-200 active:scale-[0.97] transition-all flex-1 min-w-0 min-h-[52px] shadow-sm"
        aria-label={`Target language: ${theirLanguage.name}`}
      >
        <FlagIcon countryCode={theirLanguage.countryCode} size="md" />
        <div className="text-left min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{theirLanguage.name}</p>
          <p className="text-[11px] text-muted-foreground truncate">{theirLanguage.nativeName}</p>
        </div>
      </button>
    </div>
  );
}
