import { TranslateLanguage } from '@/types/translate';
import { LanguageListItem } from './LanguageListItem';

interface LanguageSectionProps {
  title: string;
  languages: TranslateLanguage[];
  selectedCode?: string;
  onSelect: (lang: TranslateLanguage) => void;
}

export function LanguageSection({ title, languages, selectedCode, onSelect }: LanguageSectionProps) {
  if (languages.length === 0) return null;

  return (
    <div className="mb-5">
      <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-1.5 px-1">
        {title}
      </p>
      <div className="space-y-0.5">
        {languages.map(lang => (
          <LanguageListItem
            key={lang.code}
            lang={lang}
            isSelected={lang.code === selectedCode}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
