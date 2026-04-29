import { MapPin, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTravelContext } from '@/hooks/useTravelContext';
import { TranslateLanguage, SUPPORTED_LANGUAGES } from '@/types/translate';

interface CountryAutoChipProps {
  currentTheirCode: string;
  onApply: (lang: TranslateLanguage) => void;
}

const DISMISS_KEY = 'translate.autoChip.dismissed';

export function CountryAutoChip({ currentTheirCode, onApply }: CountryAutoChipProps) {
  const { primaryRecommendation } = useTravelContext();
  const [dismissed, setDismissed] = useState<string | null>(null);

  useEffect(() => {
    try { setDismissed(localStorage.getItem(DISMISS_KEY)); } catch {}
  }, []);

  if (!primaryRecommendation || primaryRecommendation.destination.source !== 'order') return null;

  const dest = primaryRecommendation.destination;
  if (dest.languageCode === currentTheirCode) return null;
  if (dismissed === dest.countryCode) return null;

  const lang = SUPPORTED_LANGUAGES.find(l => l.code === dest.languageCode);
  if (!lang) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(dest.countryCode);
    try { localStorage.setItem(DISMISS_KEY, dest.countryCode); } catch {}
  };

  return (
    <button
      onClick={() => onApply(lang)}
      className="mx-4 mt-2 flex items-center gap-2 px-3 py-2 rounded-full bg-orange-50 border border-orange-200/70 hover:bg-orange-100 active:scale-[0.98] transition-all w-fit"
    >
      <MapPin className="w-3.5 h-3.5 text-orange-600" />
      <span className="text-[12px] font-semibold text-foreground">
        {dest.flag} Auto: {dest.countryName} → {lang.name}
      </span>
      <span
        onClick={handleDismiss}
        role="button"
        aria-label="Dismiss"
        className="ml-1 -mr-1 w-5 h-5 flex items-center justify-center rounded-full hover:bg-orange-200/70"
      >
        <X className="w-3 h-3 text-orange-700" />
      </span>
    </button>
  );
}
