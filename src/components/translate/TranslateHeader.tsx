import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TranslateLanguage } from '@/types/translate';
import { FlagIcon } from '@/components/ui/FlagIcon';

interface TranslateHeaderProps {
  myLanguage: TranslateLanguage;
  theirLanguage: TranslateLanguage;
  onLanguageTap?: (which: 'my' | 'their') => void;
  showLanguages?: boolean;
}

export function TranslateHeader({ myLanguage, theirLanguage, onLanguageTap, showLanguages = true }: TranslateHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="flex items-center justify-between px-4 h-14">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>

        <div className="flex items-center gap-1">
          <span className="text-sm font-semibold tracking-tight text-foreground">Mobile11</span>
          <span className="text-sm text-muted-foreground">Translate</span>
        </div>

        {showLanguages ? (
          <div className="flex items-center gap-2">
            <button onClick={() => onLanguageTap?.('my')} className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-gray-100">
              <FlagIcon countryCode={myLanguage.countryCode} size="sm" />
            </button>
            <span className="text-xs text-muted-foreground">⇄</span>
            <button onClick={() => onLanguageTap?.('their')} className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-gray-100">
              <FlagIcon countryCode={theirLanguage.countryCode} size="sm" />
            </button>
          </div>
        ) : (
          <div className="w-10" />
        )}
      </div>
    </header>
  );
}
