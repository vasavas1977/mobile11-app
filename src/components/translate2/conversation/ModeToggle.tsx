import { Sparkles, Hand } from 'lucide-react';
import { ConversationMode } from '@/types/translate';

interface ModeToggleProps {
  mode: ConversationMode;
  onChange: (m: ConversationMode) => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  const isPractical = mode === 'practical';
  return (
    <div className="px-4 pt-2 pb-2 bg-white">
      <div
        role="tablist"
        aria-label="Translation mode"
        className="relative inline-flex w-full max-w-md mx-auto rounded-full bg-muted/40 border border-border/50 p-1"
      >
        {/* Sliding thumb */}
        <span
          aria-hidden
          className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-foreground shadow-sm transition-transform duration-300 ease-out ${
            isPractical ? 'translate-x-0' : 'translate-x-[calc(100%+4px)]'
          }`}
          style={{ left: 4 }}
        />
        <button
          role="tab"
          aria-selected={isPractical}
          onClick={() => onChange('practical')}
          className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 py-2 text-[13px] font-semibold rounded-full transition-colors ${
            isPractical ? 'text-background' : 'text-muted-foreground'
          }`}
        >
          <Hand className="w-3.5 h-3.5" />
          Practical
        </button>
        <button
          role="tab"
          aria-selected={!isPractical}
          onClick={() => onChange('natural')}
          className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 py-2 text-[13px] font-semibold rounded-full transition-colors ${
            !isPractical ? 'text-background' : 'text-muted-foreground'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Natural
        </button>
      </div>
      <p className="mt-1.5 text-[11px] text-center text-muted-foreground">
        {isPractical
          ? 'Tap & hold to talk. Big text, replay, and phrasebook.'
          : 'Hands-free. Just speak — we handle turns automatically.'}
      </p>
    </div>
  );
}
