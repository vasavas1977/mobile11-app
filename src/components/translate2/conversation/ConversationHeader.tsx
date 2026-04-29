import { ArrowLeft, ArrowLeftRight, Maximize2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TranslateLanguage } from '@/types/translate';
import { FlagIcon } from '@/components/ui/FlagIcon';

type Gender = 'male' | 'female';

interface ConversationHeaderProps {
  myLanguage: TranslateLanguage;
  theirLanguage: TranslateLanguage;
  myGender: Gender;
  theirGender: Gender;
  onChangeMyGender: (g: Gender) => void;
  onChangeTheirGender: (g: Gender) => void;
  onSwap: () => void;
  onPickLanguage: (which: 'my' | 'their') => void;
  isLive: boolean;
  isConnecting: boolean;
  isReconnecting?: boolean;
}

function GenderToggle({
  value,
  onChange,
  label,
}: {
  value: Gender;
  onChange: (g: Gender) => void;
  label: string;
}) {
  return (
    <div
      className="inline-flex items-center rounded-full bg-white border border-gray-200/70 p-0.5 shadow-sm"
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        onClick={() => onChange('female')}
        className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-[-0.01em] transition-colors min-h-[22px] ${
          value === 'female'
            ? 'bg-pink-100 text-pink-600'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        aria-pressed={value === 'female'}
        aria-label={`${label} female voice`}
      >
        ♀
      </button>
      <button
        type="button"
        onClick={() => onChange('male')}
        className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-[-0.01em] transition-colors min-h-[22px] ${
          value === 'male'
            ? 'bg-blue-100 text-blue-600'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        aria-pressed={value === 'male'}
        aria-label={`${label} male voice`}
      >
        ♂
      </button>
    </div>
  );
}

export function ConversationHeader({
  myLanguage,
  theirLanguage,
  myGender,
  theirGender,
  onChangeMyGender,
  onChangeTheirGender,
  onSwap,
  onPickLanguage,
  isLive,
  isConnecting,
  isReconnecting = false,
}: ConversationHeaderProps) {
  const navigate = useNavigate();

  const statusConfig = isReconnecting
    ? { bg: 'bg-amber-50/80', border: 'border-amber-200/40', dot: 'bg-amber-400 animate-pulse', text: 'text-amber-600', label: 'Resuming…' }
    : isConnecting
    ? { bg: 'bg-amber-50', border: 'border-amber-200/50', dot: 'bg-amber-400 animate-pulse', text: 'text-amber-600', label: 'Connecting…' }
    : isLive
    ? { bg: 'bg-emerald-50', border: 'border-emerald-200/50', dot: 'bg-emerald-500 animate-pulse', text: 'text-emerald-600', label: 'Live' }
    : { bg: 'bg-gray-50', border: 'border-gray-200/50', dot: 'bg-gray-300', text: 'text-muted-foreground', label: 'Ready' };

  return (
    <header className="bg-white/98 backdrop-blur-lg border-b border-gray-100/60 safe-top shrink-0">
      {/* Top row */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <button
          onClick={() => navigate('/translate2')}
          className="p-2.5 -ml-1 rounded-2xl hover:bg-gray-50 active:scale-95 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Back to home"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>

        {/* Status pill */}
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-all duration-600 ${statusConfig.bg} border ${statusConfig.border}`}
          role="status"
          aria-live="polite"
        >
          <div className={`w-[6px] h-[6px] rounded-full transition-all duration-600 ${statusConfig.dot}`} />
          <span className={`text-[11px] font-bold tracking-[-0.01em] ${statusConfig.text}`}>
            {statusConfig.label}
          </span>
        </div>

        <button
          onClick={() => navigate('/translate2/show')}
          className="p-2.5 -mr-1 rounded-2xl hover:bg-gray-50 active:scale-95 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Open Show Mode"
        >
          <Maximize2 className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Language pair */}
      <div className="flex items-center justify-center gap-3 px-4 pb-2">
        <div className="flex flex-col items-center gap-1.5">
          <button
            onClick={() => onPickLanguage('my')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gray-50/80 border border-gray-200/50 hover:border-gray-300/60 active:scale-[0.97] transition-all min-h-[48px]"
            aria-label={`Source: ${myLanguage.name}`}
          >
            <FlagIcon countryCode={myLanguage.countryCode} size="sm" />
            <span className="text-[13px] font-bold text-foreground tracking-[-0.01em]">{myLanguage.name}</span>
          </button>
          <GenderToggle value={myGender} onChange={onChangeMyGender} label={`${myLanguage.name} voice`} />
        </div>

        <button
          onClick={onSwap}
          className="p-2.5 rounded-full bg-orange-50/80 border border-orange-200/50 hover:bg-orange-100/60 active:scale-90 active:rotate-180 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Swap languages"
        >
          <ArrowLeftRight className="w-4 h-4 text-orange-500" />
        </button>

        <div className="flex flex-col items-center gap-1.5">
          <button
            onClick={() => onPickLanguage('their')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gray-50/80 border border-gray-200/50 hover:border-gray-300/60 active:scale-[0.97] transition-all min-h-[48px]"
            aria-label={`Target: ${theirLanguage.name}`}
          >
            <FlagIcon countryCode={theirLanguage.countryCode} size="sm" />
            <span className="text-[13px] font-bold text-foreground tracking-[-0.01em]">{theirLanguage.name}</span>
          </button>
          <GenderToggle value={theirGender} onChange={onChangeTheirGender} label={`${theirLanguage.name} voice`} />
        </div>
      </div>
      <div className="h-2" />
    </header>
  );
}
