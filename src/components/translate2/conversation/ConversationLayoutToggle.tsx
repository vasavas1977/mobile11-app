import { List, Columns2, RotateCw } from 'lucide-react';
import { LayoutMode } from '@/types/translate';

interface ConversationLayoutToggleProps {
  layoutMode: LayoutMode;
  onLayoutChange: (mode: LayoutMode) => void;
}

const layouts: { mode: LayoutMode; icon: React.ElementType; label: string }[] = [
  { mode: 'single', icon: List, label: 'List' },
  { mode: 'side-by-side', icon: Columns2, label: 'Side' },
  { mode: 'face-to-face', icon: RotateCw, label: 'Face' },
];

export function ConversationLayoutToggle({ layoutMode, onLayoutChange }: ConversationLayoutToggleProps) {
  return (
    <div className="flex items-center gap-0.5 bg-gray-100/70 rounded-xl p-[3px]" role="tablist" aria-label="Layout mode">
      {layouts.map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          role="tab"
          aria-selected={layoutMode === mode}
          onClick={() => onLayoutChange(mode)}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[11px] font-semibold transition-all duration-200 min-h-[36px] ${
            layoutMode === mode
              ? 'bg-white text-foreground shadow-[0_1px_3px_-1px_rgba(0,0,0,0.08)]'
              : 'text-muted-foreground/70 hover:text-foreground active:bg-white/50'
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}
