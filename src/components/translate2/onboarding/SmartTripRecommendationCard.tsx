import { useNavigate } from 'react-router-dom';
import { Sparkles, ChevronRight, Mic, MessageSquare, Keyboard, Monitor } from 'lucide-react';
import { TripRecommendation, SuggestedMode } from '@/hooks/useTripOnboarding';
import { FlagIcon } from '@/components/ui/FlagIcon';

interface SmartTripRecommendationCardProps {
  recommendation: TripRecommendation;
  onSetLanguage: (langCode: string) => void;
}

const MODE_ICONS: Record<SuggestedMode, typeof Mic> = {
  conversation: Mic,
  phrases: MessageSquare,
  type: Keyboard,
  show: Monitor,
};

const MODE_LABELS: Record<SuggestedMode, string> = {
  conversation: 'Start Conversation',
  phrases: 'Quick Phrases',
  type: 'Type to Translate',
  show: 'Show Mode',
};

const MODE_ROUTES: Record<SuggestedMode, string> = {
  conversation: '/translate2/conversation',
  phrases: '/translate2/phrases',
  type: '/translate2/type',
  show: '/translate2/show',
};

export function SmartTripRecommendationCard({ recommendation, onSetLanguage }: SmartTripRecommendationCardProps) {
  const navigate = useNavigate();
  const { destinationName, flag, suggestedLang, suggestedMode, modeReason, pack } = recommendation;
  const ModeIcon = MODE_ICONS[suggestedMode];

  return (
    <div className="rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50/50 to-orange-50/30 border border-blue-100/60 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-foreground">Smart Setup for {destinationName} {flag}</p>
          <p className="text-[11px] text-muted-foreground font-medium">Personalized for your trip</p>
        </div>
      </div>

      {/* Language suggestion */}
      <div className="px-4 pb-3">
        <button
          onClick={() => onSetLanguage(suggestedLang.code)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/80 border border-blue-100/60 hover:bg-white active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-2.5">
            <FlagIcon countryCode={suggestedLang.countryCode} size="sm" />
            <span className="text-sm font-bold text-foreground">Use English ↔ {suggestedLang.name}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Suggested mode */}
      <div className="px-4 pb-3">
        <button
          onClick={() => {
            onSetLanguage(suggestedLang.code);
            navigate(MODE_ROUTES[suggestedMode]);
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 active:scale-[0.98] transition-all shadow-sm"
        >
          <ModeIcon className="w-5 h-5 text-white shrink-0" />
          <div className="flex-1 text-left">
            <p className="text-sm font-bold">{MODE_LABELS[suggestedMode]}</p>
            <p className="text-[11px] text-white/70 font-medium">{modeReason}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-white/50" />
        </button>
      </div>

      {/* Phrase pack link */}
      {pack && (
        <div className="px-4 pb-4">
          <button
            onClick={() => navigate('/translate2/phrases', { state: { destinationPack: pack.id } })}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/60 border border-blue-50 hover:bg-white active:scale-[0.98] transition-all"
          >
            <span className="text-base">{pack.flag}</span>
            <span className="text-xs font-bold text-foreground flex-1 text-left">{pack.phrases.length} phrases for {destinationName}</span>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      )}
    </div>
  );
}
