import { ArrowUpDown, Volume2, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TranslateLanguage } from '@/types/translate';
import { FlagIcon } from '@/components/ui/FlagIcon';

interface TranslateWelcomeProps {
  myLanguage: TranslateLanguage;
  theirLanguage: TranslateLanguage;
  onSwap: () => void;
  onPickLanguage: (which: 'my' | 'their') => void;
  onStart: () => void;
  onHistory?: () => void;
}

export function TranslateWelcome({ myLanguage, theirLanguage, onSwap, onPickLanguage, onStart, onHistory }: TranslateWelcomeProps) {
  const speakName = (lang: TranslateLanguage) => {
    const utterance = new SpeechSynthesisUtterance(lang.nativeName);
    utterance.lang = lang.speechCode;
    speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] px-6 py-8 bg-white">
      {/* Logo area */}
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Mobile11 Translate</h1>
        <p className="text-sm text-muted-foreground mt-1">Communicate anywhere</p>
      </div>

      {/* Language selectors */}
      <div className="w-full max-w-sm space-y-3">
        {/* My Language */}
        <button
          onClick={() => onPickLanguage('my')}
          className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-200 bg-gray-50/50 hover:bg-gray-100/80 transition-colors"
        >
          <FlagIcon countryCode={myLanguage.countryCode} size="lg" />
          <div className="flex-1 text-left">
            <p className="text-base font-semibold text-foreground">{myLanguage.nativeName}</p>
            <p className="text-xs text-muted-foreground">{myLanguage.name} · Your language</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); speakName(myLanguage); }}
            className="p-2 rounded-full hover:bg-gray-200"
          >
            <Volume2 className="w-4 h-4 text-muted-foreground" />
          </button>
        </button>

        {/* Swap button */}
        <div className="flex justify-center">
          <button
            onClick={onSwap}
            className="p-3 rounded-full border border-gray-200 bg-white hover:bg-gray-50 shadow-sm transition-all active:scale-95"
          >
            <ArrowUpDown className="w-5 h-5 text-orange-500" />
          </button>
        </div>

        {/* Their Language */}
        <button
          onClick={() => onPickLanguage('their')}
          className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-200 bg-gray-50/50 hover:bg-gray-100/80 transition-colors"
        >
          <FlagIcon countryCode={theirLanguage.countryCode} size="lg" />
          <div className="flex-1 text-left">
            <p className="text-base font-semibold text-foreground">{theirLanguage.nativeName}</p>
            <p className="text-xs text-muted-foreground">{theirLanguage.name} · Their language</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); speakName(theirLanguage); }}
            className="p-2 rounded-full hover:bg-gray-200"
          >
            <Volume2 className="w-4 h-4 text-muted-foreground" />
          </button>
        </button>
      </div>

      {/* Start button */}
      <Button onClick={onStart} size="lg" className="w-full max-w-sm mt-8 h-14 text-base font-semibold rounded-2xl">
        Start Translating
      </Button>

      {/* History button */}
      {onHistory && (
        <button
          onClick={onHistory}
          className="flex items-center gap-2 mt-3 px-4 py-2.5 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <History className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground font-medium">View History</span>
        </button>
      )}

      {/* Upsell */}
      <div className="mt-6 px-4 py-3 rounded-xl bg-orange-50 border border-orange-100 max-w-sm w-full">
        <p className="text-xs text-center text-orange-700 font-medium">
          ✨ Included with Mobile11 Travel eSIM plans
        </p>
      </div>
    </div>
  );
}
