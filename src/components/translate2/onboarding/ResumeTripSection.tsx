import { useNavigate } from 'react-router-dom';
import { RotateCcw, ChevronRight } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '@/types/translate';
import { getDestinationPack } from '@/data/destinationPacks';
import { FlagIcon } from '@/components/ui/FlagIcon';

interface RecentTrip {
  destination: string;
  langCode: string;
  lastUsed: number;
}

interface ResumeTripSectionProps {
  trips: RecentTrip[];
  onResume: (langCode: string) => void;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function ResumeTripSection({ trips, onResume }: ResumeTripSectionProps) {
  const navigate = useNavigate();

  if (trips.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <RotateCcw className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-bold text-foreground">Resume Trip</h2>
      </div>
      <div className="space-y-2">
        {trips.slice(0, 3).map((trip, i) => {
          const pack = getDestinationPack(trip.destination);
          const lang = SUPPORTED_LANGUAGES.find(l => l.code === trip.langCode);
          if (!pack || !lang) return null;

          return (
            <button
              key={i}
              onClick={() => {
                onResume(trip.langCode);
                navigate('/translate2/phrases', { state: { destinationPack: pack.id } });
              }}
              className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100/80 hover:border-orange-200 active:scale-[0.98] transition-all"
            >
              <span className="text-lg">{pack.flag}</span>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-bold text-foreground truncate">English ↔ {lang.name}</p>
                <p className="text-[11px] text-muted-foreground font-medium">{pack.name} · {timeAgo(trip.lastUsed)}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
