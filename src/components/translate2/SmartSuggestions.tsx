import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { Mic, Keyboard, Monitor, MapPin, ChevronRight } from 'lucide-react';
import { getScenarioNavigation } from '@/data/travelScenarios';

interface SmartSuggestionsProps {
  theirLangCode: string;
  theirLangName: string;
  hasRecentPhrases: boolean;
}

interface Suggestion {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  action: () => void;
  featured?: boolean;
}

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

/** Contextual greeting based on time */
function getGreeting(time: ReturnType<typeof getTimeOfDay>): string {
  switch (time) {
    case 'morning': return 'Good morning';
    case 'afternoon': return 'Good afternoon';
    case 'evening': return 'Good evening';
    case 'night': return 'Still exploring?';
  }
}

/** Build contextual suggestions based on time, destination, and activity */
function buildSuggestions(
  time: ReturnType<typeof getTimeOfDay>,
  langCode: string,
  hasRecent: boolean,
  navigate: (path: string, opts?: any) => void,
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Time-based featured suggestion
  if (time === 'morning') {
    suggestions.push({
      id: 'morning-hotel',
      emoji: '🏨',
      title: 'Checking out of hotel?',
      subtitle: 'Common phrases for reception',
      featured: true,
      action: () => {
        const { path, state } = getScenarioNavigation('hotel', langCode);
        navigate(path, { state });
      },
    });
  } else if (time === 'afternoon') {
    suggestions.push({
      id: 'afternoon-explore',
      emoji: '🗺️',
      title: 'Exploring the area?',
      subtitle: 'Ask for directions in the local language',
      featured: true,
      action: () => {
        const { path, state } = getScenarioNavigation('directions', langCode);
        navigate(path, { state });
      },
    });
  } else if (time === 'evening') {
    suggestions.push({
      id: 'evening-food',
      emoji: '🍽️',
      title: 'Looking for dinner?',
      subtitle: 'Order food, ask about the menu',
      featured: true,
      action: () => {
        const { path, state } = getScenarioNavigation('restaurant', langCode);
        navigate(path, { state });
      },
    });
  } else {
    suggestions.push({
      id: 'night-taxi',
      emoji: '🚕',
      title: 'Need a ride back?',
      subtitle: 'Taxi phrases and show your address',
      featured: true,
      action: () => {
        const { path, state } = getScenarioNavigation('taxi', langCode);
        navigate(path, { state });
      },
    });
  }

  // Always-relevant contextual actions
  suggestions.push({
    id: 'address',
    emoji: '📍',
    title: 'Show an address',
    subtitle: 'Hand your phone to the driver',
    action: () => navigate('/translate2/address'),
  });

  suggestions.push({
    id: 'shopping',
    emoji: '🛍️',
    title: 'Shopping or bargaining',
    subtitle: 'Ask about price, size, colors',
    action: () => {
      const { path, state } = getScenarioNavigation('shopping', langCode);
      navigate(path, { state });
    },
  });

  if (!hasRecent) {
    suggestions.push({
      id: 'emergency',
      emoji: '🆘',
      title: 'Emergency phrases',
      subtitle: 'Medical, police, help',
      action: () => {
        const { path, state } = getScenarioNavigation('emergency', langCode);
        navigate(path, { state });
      },
    });
  }

  return suggestions;
}

export function SmartSuggestions({ theirLangCode, theirLangName, hasRecentPhrases }: SmartSuggestionsProps) {
  const navigate = useNavigate();
  const time = useMemo(() => getTimeOfDay(), []);
  const greeting = getGreeting(time);

  const suggestions = useMemo(
    () => buildSuggestions(time, theirLangCode, hasRecentPhrases, navigate),
    [time, theirLangCode, hasRecentPhrases, navigate],
  );

  const featured = suggestions.find(s => s.featured);
  const others = suggestions.filter(s => !s.featured).slice(0, 3);

  return (
    <div className="space-y-3">
      {/* Contextual greeting */}
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-bold text-foreground">{greeting}</h2>
        <span className="text-[11px] text-muted-foreground/60 font-medium">
          Translating to {theirLangName}
        </span>
      </div>

      {/* Featured suggestion */}
      {featured && (
        <button
          onClick={featured.action}
          className="w-full flex items-center gap-3.5 p-4 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100/80 hover:border-orange-200 active:scale-[0.98] transition-all group"
        >
          <span className="text-2xl">{featured.emoji}</span>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-foreground">{featured.title}</p>
            <p className="text-[11px] text-muted-foreground font-medium">{featured.subtitle}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
        </button>
      )}

      {/* Quick action chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5" data-swipe-ignore>
        {others.map((s) => (
          <button
            key={s.id}
            onClick={s.action}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-[#FAF7F2] border border-gray-200/60 whitespace-nowrap hover:border-orange-200 transition-all active:scale-[0.98]"
          >
            <span className="text-base">{s.emoji}</span>
            <span className="text-xs font-bold text-foreground">{s.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
