import { useState } from 'react';
import { WifiOff, Check, X } from 'lucide-react';
import { DestinationPhrase } from '@/data/destinationPacks';

interface OfflineEssentialsPromptProps {
  destinationName: string;
  phrases: DestinationPhrase[];
  alreadySaved: string[];
  onSave: (phraseIds: string[]) => void;
  onDismiss: () => void;
}

export function OfflineEssentialsPrompt({ destinationName, phrases, alreadySaved, onSave, onDismiss }: OfflineEssentialsPromptProps) {
  const [saved, setSaved] = useState(false);
  const unsavedPhrases = phrases.filter(p => !alreadySaved.includes(p.id));

  if (unsavedPhrases.length === 0 || saved) return null;

  const handleSave = () => {
    onSave(unsavedPhrases.map(p => p.id));
    setSaved(true);
  };

  return (
    <div className="rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50/50 border border-slate-200/80 overflow-hidden">
      <div className="px-4 py-3 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
          <WifiOff className="w-4 h-4 text-slate-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-foreground">Save essentials offline</p>
          <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
            {unsavedPhrases.length} key phrases for {destinationName} — works without internet
          </p>
        </div>
        <button onClick={onDismiss} className="p-1 rounded-full hover:bg-gray-100 shrink-0">
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Preview top 3 */}
      <div className="px-4 pb-2">
        {unsavedPhrases.slice(0, 3).map(p => (
          <p key={p.id} className="text-[11px] text-muted-foreground font-medium py-0.5 truncate">
            • {p.text}
          </p>
        ))}
        {unsavedPhrases.length > 3 && (
          <p className="text-[10px] text-muted-foreground/70 font-medium py-0.5">
            +{unsavedPhrases.length - 3} more
          </p>
        )}
      </div>

      <div className="px-4 pb-4">
        <button
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 active:scale-[0.98] transition-all"
        >
          <WifiOff className="w-3.5 h-3.5" />
          Save for Offline
        </button>
      </div>
    </div>
  );
}
