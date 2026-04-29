import { useNavigate } from 'react-router-dom';
import { Plane, ChevronRight, Shield } from 'lucide-react';
import { DestinationRecommendation } from '@/hooks/useTravelContext';
import { FlagIcon } from '@/components/ui/FlagIcon';

interface DestinationCardProps {
  recommendation: DestinationRecommendation;
  onSetLanguage: (langCode: string) => void;
}

export function DestinationCard({ recommendation, onSetLanguage }: DestinationCardProps) {
  const navigate = useNavigate();
  const { destination, suggestedLanguage, topCategories, greeting } = recommendation;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50/80 border border-orange-100/80 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
            <Plane className="w-5 h-5 text-orange-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-foreground truncate">{greeting}</p>
            <p className="text-[11px] text-muted-foreground font-medium">
              {destination.source === 'order' ? 'Based on your eSIM' : 'Popular destination'}
            </p>
          </div>
        </div>
        <span className="text-2xl shrink-0">{destination.flag}</span>
      </div>

      {/* Quick-set language */}
      <div className="px-4 pb-3">
        <button
          onClick={() => onSetLanguage(suggestedLanguage.code)}
          className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-white/80 border border-orange-100/60 hover:bg-white active:scale-[0.98] transition-all min-h-[52px]"
        >
          <div className="flex items-center gap-2.5">
            <FlagIcon countryCode={suggestedLanguage.countryCode} size="sm" />
            <span className="text-sm font-bold text-foreground">
              Set to {suggestedLanguage.name}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Top categories */}
      <div className="px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar" data-swipe-ignore>
        {topCategories.slice(0, 4).map(cat => (
          <button
            key={cat.id}
            onClick={() => navigate('/translate2/phrases', { state: { category: cat.id } })}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-white/70 border border-orange-50 text-xs font-bold text-foreground whitespace-nowrap hover:bg-white active:scale-[0.97] transition-all min-h-[40px]"
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Emergency shortcut */}
      <div className="px-4 pb-4">
        <button
          onClick={() => navigate('/translate2/phrases', { state: { category: 'emergency' } })}
          className="w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-red-50/80 border border-red-100/80 hover:bg-red-100/60 active:scale-[0.98] transition-all min-h-[48px]"
        >
          <Shield className="w-4 h-4 text-red-500 shrink-0" />
          <span className="text-xs font-bold text-red-700 flex-1 text-left">Emergency phrases for {destination.countryName}</span>
          <ChevronRight className="w-3.5 h-3.5 text-red-400 shrink-0" />
        </button>
      </div>
    </div>
  );
}
