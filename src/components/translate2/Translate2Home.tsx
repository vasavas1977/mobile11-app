import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Mic, Keyboard, Monitor, Clock, ChevronRight } from 'lucide-react';
import { Translate2Header } from './Translate2Header';
import { LanguagePairPill } from './LanguagePairPill';
import { DestinationCard } from './DestinationCard';
import { SmartTripRecommendationCard } from './onboarding/SmartTripRecommendationCard';
import { OfflineEssentialsPrompt } from './onboarding/OfflineEssentialsPrompt';
import { ResumeTripSection } from './onboarding/ResumeTripSection';
import { SmartSuggestions } from './SmartSuggestions';
import { SUPPORTED_LANGUAGES } from '@/types/translate';
import { useTravelContext } from '@/hooks/useTravelContext';
import { useTripOnboarding } from '@/hooks/useTripOnboarding';
import { useSwipeModeNavigation } from '@/hooks/useSwipeModeNavigation';
import { getDestinationPack, DESTINATION_PACKS } from '@/data/destinationPacks';

interface Translate2HomeProps {
  session: {
    myLanguage: any;
    theirLanguage: any;
    swapLanguages: () => void;
    setTheirLanguage: (lang: any) => void;
  };
  onPickLanguage: (which: 'my' | 'their') => void;
  recentPhrases: { original: string; translated: string; targetLang: string }[];
  onShowSetup: () => void;
}

export function Translate2Home({ session, onPickLanguage, recentPhrases, onShowSetup }: Translate2HomeProps) {
  const navigate = useNavigate();
  const { primaryRecommendation } = useTravelContext();
  const { prefs, buildRecommendation, markOfflineEssentialsSaved, addRecentTrip } = useTripOnboarding();
  const { swipeHandlers } = useSwipeModeNavigation();
  const [offlineDismissed, setOfflineDismissed] = useState(false);

  const handleSetLanguage = (langCode: string) => {
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
    if (lang) {
      session.setTheirLanguage(lang);
      addRecentTrip(langCode, langCode);
    }
  };

  const smartRec = buildRecommendation(
    prefs.preferredTheirLangCode || session.theirLanguage.code
  );

  const showSmartCard = prefs.hasCompletedOnboarding && smartRec;
  const showDestinationCard = !showSmartCard && primaryRecommendation;

  return (
    <div className="min-h-[100dvh] bg-white" {...swipeHandlers}>
      <Translate2Header title="Mobile11 Translate" showSettings />

      <div className="px-4 pt-4 pb-32 space-y-5">
        {/* Language pair */}
        <LanguagePairPill
          myLanguage={session.myLanguage}
          theirLanguage={session.theirLanguage}
          onSwap={session.swapLanguages}
          onPickLanguage={onPickLanguage}
        />

        {/* Smart trip recommendation (post-onboarding) */}
        {showSmartCard && smartRec && (
          <SmartTripRecommendationCard
            recommendation={smartRec}
            onSetLanguage={handleSetLanguage}
          />
        )}

        {/* Destination recommendation (fallback) */}
        {showDestinationCard && primaryRecommendation && (
          <DestinationCard
            recommendation={primaryRecommendation}
            onSetLanguage={handleSetLanguage}
          />
        )}

        {/* Offline essentials prompt */}
        {smartRec && !offlineDismissed && (
          <OfflineEssentialsPrompt
            destinationName={smartRec.destinationName}
            phrases={smartRec.offlineEssentials}
            alreadySaved={prefs.savedOfflineEssentials}
            onSave={markOfflineEssentialsSaved}
            onDismiss={() => setOfflineDismissed(true)}
          />
        )}

        {/* ─── Primary CTA: Voice ─── */}
        <div className="flex flex-col items-center pt-2 pb-1">
          <button
            onClick={() => navigate('/translate2/conversation')}
            className="w-[76px] h-[76px] rounded-full bg-gradient-to-b from-gray-800 to-gray-900 flex items-center justify-center shadow-[0_8px_30px_-4px_rgba(0,0,0,0.35)] active:scale-[0.88] active:duration-75 transition-all relative group"
          >
            {/* Glass highlight */}
            <div
              className="absolute inset-[1px] rounded-full pointer-events-none"
              style={{ background: 'linear-gradient(170deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 45%)' }}
            />
            <Mic className="w-7 h-7 text-white relative z-10" />
          </button>
          <p className="text-[13px] font-medium text-muted-foreground mt-3 tracking-[-0.01em]">Tap to speak</p>
          <p className="text-[11px] text-muted-foreground/50 mt-0.5">Real-time translation starts instantly</p>
        </div>

        {/* ─── Smart contextual suggestions ─── */}
        <SmartSuggestions
          theirLangCode={session.theirLanguage.code}
          theirLangName={session.theirLanguage.name}
          hasRecentPhrases={recentPhrases.length > 0}
        />

        {/* ─── Secondary modes ─── */}
        <div className="grid grid-cols-3 gap-2.5">
          <button
            onClick={() => navigate('/translate2/phrases')}
            className="flex flex-col items-center gap-2 py-3.5 px-2 rounded-2xl bg-[#FAF7F2] border border-gray-200/60 hover:border-orange-200 transition-all active:scale-[0.98]"
          >
            <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
              <span className="text-base">💬</span>
            </div>
            <span className="text-[11px] font-bold text-foreground leading-tight text-center">Phrases</span>
          </button>

          <button
            onClick={() => navigate('/translate2/type')}
            className="flex flex-col items-center gap-2 py-3.5 px-2 rounded-2xl bg-[#FAF7F2] border border-gray-200/60 hover:border-orange-200 transition-all active:scale-[0.98]"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
              <Keyboard className="w-4.5 h-4.5 text-blue-500" />
            </div>
            <span className="text-[11px] font-bold text-foreground leading-tight text-center">Type</span>
          </button>

          <button
            onClick={() => navigate('/translate2/show')}
            className="flex flex-col items-center gap-2 py-3.5 px-2 rounded-2xl bg-[#FAF7F2] border border-gray-200/60 hover:border-orange-200 transition-all active:scale-[0.98]"
          >
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
              <Monitor className="w-4.5 h-4.5 text-gray-600" />
            </div>
            <span className="text-[11px] font-bold text-foreground leading-tight text-center">Show</span>
          </button>
        </div>

        {/* Resume trip context */}
        {prefs.recentTripContexts.length > 0 && (
          <ResumeTripSection
            trips={prefs.recentTripContexts}
            onResume={handleSetLanguage}
          />
        )}

        {/* Recent phrases */}
        {recentPhrases.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-bold text-foreground">Recent Translations</h2>
            </div>
            <div className="space-y-2">
              {recentPhrases.map((phrase, i) => (
                <div key={i} className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100/80">
                  <p className="text-sm font-medium text-foreground">{phrase.original}</p>
                  <p className="text-sm text-orange-600 mt-1.5 font-semibold">{phrase.translated}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Destination phrase packs */}
        {(() => {
          const matchedPack = getDestinationPack(session.theirLanguage.code);
          const otherPacks = DESTINATION_PACKS.filter(p => p.id !== matchedPack?.id).slice(0, 3);
          return (
            <div>
              <h2 className="text-sm font-bold text-foreground mb-3">
                {matchedPack ? 'Phrase Packs for Your Trip' : 'Destination Phrase Packs'}
              </h2>

              {matchedPack && (
                <button
                  onClick={() => navigate('/translate2/phrases', { state: { destinationPack: matchedPack.id } })}
                  className="w-full flex items-center gap-3.5 p-4 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100/80 hover:border-orange-200 active:scale-[0.98] transition-all min-h-[64px] mb-3"
                >
                  <span className="text-2xl">{matchedPack.flag}</span>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold text-foreground">{matchedPack.name} Phrase Pack</p>
                    <p className="text-[11px] text-muted-foreground font-medium">{matchedPack.phrases.length} curated phrases</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              )}

              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1" data-swipe-ignore>
                {otherPacks.map(pack => (
                  <button
                    key={pack.id}
                    onClick={() => navigate('/translate2/phrases', { state: { destinationPack: pack.id } })}
                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-[#FAF7F2] border border-gray-200/60 whitespace-nowrap hover:border-orange-200 transition-all active:scale-[0.98] min-h-[44px]"
                  >
                    <span className="text-lg">{pack.flag}</span>
                    <span className="text-xs font-bold text-foreground">{pack.name}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        {/* History link */}
        <button
          onClick={() => navigate('/translate2/history')}
          className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
        >
          <Clock className="w-4 h-4" />
          View Session History
        </button>
      </div>
    </div>
  );
}