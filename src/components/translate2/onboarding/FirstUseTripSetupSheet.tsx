import { useState } from 'react';
import { X, ChevronRight, Globe, Sparkles } from 'lucide-react';
import { SUPPORTED_LANGUAGES, TranslateLanguage } from '@/types/translate';
import { DESTINATION_PACKS } from '@/data/destinationPacks';
import { FlagIcon } from '@/components/ui/FlagIcon';

interface FirstUseTripSetupSheetProps {
  open: boolean;
  onComplete: (destination: string, myLangCode: string, theirLangCode: string) => void;
  onDismiss: () => void;
}

const POPULAR_DESTINATIONS = DESTINATION_PACKS.slice(0, 5);
const POPULAR_MY_LANGS = SUPPORTED_LANGUAGES.filter(l => ['en', 'zh', 'ko', 'ja'].includes(l.code));

type Step = 'destination' | 'language' | 'ready';

export function FirstUseTripSetupSheet({ open, onComplete, onDismiss }: FirstUseTripSetupSheetProps) {
  const [step, setStep] = useState<Step>('destination');
  const [selectedDest, setSelectedDest] = useState<string | null>(null);
  const [myLang, setMyLang] = useState<TranslateLanguage>(SUPPORTED_LANGUAGES[0]);

  if (!open) return null;

  const selectedPack = DESTINATION_PACKS.find(p => p.id === selectedDest);

  const handleDestSelect = (destId: string) => {
    setSelectedDest(destId);
    setStep('language');
  };

  const handleLangSelect = (lang: TranslateLanguage) => {
    setMyLang(lang);
    setStep('ready');
  };

  const handleComplete = () => {
    if (!selectedPack) return;
    onComplete(selectedPack.id, myLang.code, selectedPack.languageCodes[0]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-500" />
            <h2 className="text-base font-bold text-foreground">Set Up Your Trip</h2>
          </div>
          <button onClick={onDismiss} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 pb-4">
          {(['destination', 'language', 'ready'] as Step[]).map(s => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s === step ? 'w-6 bg-orange-500' : 'w-1.5 bg-gray-200'
              }`}
            />
          ))}
        </div>

        <div className="px-5 pb-8">
          {/* Step 1: Destination */}
          {step === 'destination' && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-4">Where are you traveling?</p>
                <div className="space-y-2">
                  {POPULAR_DESTINATIONS.map(pack => (
                    <button
                      key={pack.id}
                      onClick={() => handleDestSelect(pack.id)}
                      className="w-full flex items-center gap-3.5 p-4 rounded-2xl border border-gray-200 hover:border-orange-200 hover:bg-orange-50/50 active:scale-[0.98] transition-all"
                    >
                      <span className="text-2xl">{pack.flag}</span>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-bold text-foreground">{pack.name}</p>
                        <p className="text-[11px] text-muted-foreground font-medium">{pack.tagline}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={onDismiss} className="w-full text-center text-sm text-muted-foreground font-medium py-2 hover:text-foreground transition-colors">
                Skip setup
              </button>
            </div>
          )}

          {/* Step 2: Your language */}
          {step === 'language' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground font-medium mb-4">What language do you speak?</p>
              <div className="space-y-2">
                {POPULAR_MY_LANGS.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => handleLangSelect(lang)}
                    className="w-full flex items-center gap-3.5 p-4 rounded-2xl border border-gray-200 hover:border-orange-200 hover:bg-orange-50/50 active:scale-[0.98] transition-all"
                  >
                    <FlagIcon countryCode={lang.countryCode} size="md" />
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold text-foreground">{lang.nativeName}</p>
                      <p className="text-[11px] text-muted-foreground font-medium">{lang.name}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
              <button onClick={() => setStep('destination')} className="w-full text-center text-sm text-muted-foreground font-medium py-2 hover:text-foreground transition-colors">
                ← Back
              </button>
            </div>
          )}

          {/* Step 3: Ready */}
          {step === 'ready' && selectedPack && (
            <div className="space-y-5">
              <div className="text-center py-2">
                <span className="text-4xl">{selectedPack.flag}</span>
                <h3 className="text-lg font-bold text-foreground mt-3">
                  {myLang.name} ↔ {selectedPack.name}
                </h3>
                <p className="text-sm text-muted-foreground font-medium mt-1">
                  We'll set up the best phrases and mode for your trip
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 border border-orange-100/80">
                  <Globe className="w-4 h-4 text-orange-600 shrink-0" />
                  <p className="text-xs font-medium text-orange-800">{selectedPack.phrases.length} curated travel phrases</p>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100/80">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <p className="text-xs font-medium text-blue-800">Smart mode recommendation for your trip</p>
                </div>
              </div>

              <button
                onClick={handleComplete}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-200/50 hover:shadow-orange-300/50 active:scale-[0.98] transition-all"
              >
                Start My Trip Setup
              </button>
              <button onClick={() => setStep('language')} className="w-full text-center text-sm text-muted-foreground font-medium py-2 hover:text-foreground transition-colors">
                ← Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
