import { Check } from 'lucide-react';
import { TranslateLanguage } from '@/types/translate';
import { FlagIcon } from '@/components/ui/FlagIcon';

interface LanguageListItemProps {
  lang: TranslateLanguage;
  isSelected: boolean;
  onSelect: (lang: TranslateLanguage) => void;
}

export function LanguageListItem({ lang, isSelected, onSelect }: LanguageListItemProps) {
  return (
    <button
      onClick={() => onSelect(lang)}
      className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-150 active:scale-[0.98] min-h-[52px] ${
        isSelected
          ? 'bg-orange-50 border border-orange-200/80 shadow-sm'
          : 'hover:bg-gray-50/80 border border-transparent'
      }`}
    >
      <FlagIcon countryCode={lang.countryCode} size="md" />
      <div className="flex-1 text-left min-w-0">
        <p className="text-[15px] font-semibold text-foreground leading-tight truncate">
          {lang.nativeName}
        </p>
        <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">
          {lang.name}
        </p>
      </div>
      {isSelected && (
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
          <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
        </div>
      )}
    </button>
  );
}
