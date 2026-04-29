import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { getSortedScenarios, getScenarioNavigation } from '@/data/travelScenarios';

interface TravelScenarioShortcutsProps {
  langCode?: string;
}

export function TravelScenarioShortcuts({ langCode }: TravelScenarioShortcutsProps) {
  const navigate = useNavigate();
  const scenarios = getSortedScenarios(langCode);

  const handleTap = (scenarioId: string) => {
    const { path, state } = getScenarioNavigation(scenarioId, langCode);
    navigate(path, { state });
  };

  // Separate the address shortcut for featured treatment
  const addressScenario = scenarios.find(s => s.id === 'address');
  const otherScenarios = scenarios.filter(s => s.id !== 'address');

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-bold text-foreground">I need to…</h2>

      {/* Featured: Show Address */}
      {addressScenario && (
        <button
          onClick={() => handleTap('address')}
          className="w-full flex items-center gap-3.5 p-4 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100/80 hover:border-orange-200 active:scale-[0.98] transition-all min-h-[60px]"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-left flex-1">
            <p className="text-sm font-bold text-foreground">Show Address to Driver</p>
            <p className="text-[11px] text-muted-foreground font-medium">Paste address → translate → hand phone</p>
          </div>
        </button>
      )}

      {/* Scenario grid */}
      <div className="grid grid-cols-4 gap-2">
        {otherScenarios.map((s) => (
          <button
            key={s.id}
            onClick={() => handleTap(s.id)}
            className={`
              flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl
              border transition-all active:scale-[0.95] min-h-[72px]
              ${s.isUrgent
                ? 'bg-red-50 border-red-100/80 hover:border-red-200'
                : 'bg-[#FAF7F2] border-gray-200/60 hover:border-orange-200'
              }
            `}
          >
            <span className="text-xl leading-none">{s.icon}</span>
            <span className={`text-[11px] font-bold leading-tight ${s.isUrgent ? 'text-red-700' : 'text-foreground'}`}>
              {s.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
