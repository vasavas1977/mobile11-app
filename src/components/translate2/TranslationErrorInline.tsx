import { RefreshCw, WifiOff, MicOff, Loader2, MessageSquareText } from 'lucide-react';

export type TranslationErrorType = 'connection' | 'mic' | 'translation' | 'reconnecting';

interface TranslationErrorInlineProps {
  message?: string;
  errorType?: TranslationErrorType;
  onRetry?: () => void;
  onSwitchToText?: () => void;
  className?: string;
  compact?: boolean;
}

export function TranslationErrorInline({
  message = 'Voice is temporarily unavailable.',
  errorType = 'translation',
  onRetry,
  onSwitchToText,
  className = '',
  compact = false,
}: TranslationErrorInlineProps) {
  const isReconnecting = errorType === 'reconnecting';

  const Icon = isReconnecting ? Loader2 : errorType === 'mic' ? MicOff : WifiOff;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Icon className={`w-3.5 h-3.5 text-muted-foreground/60 shrink-0 ${isReconnecting ? 'animate-spin' : ''}`} />
        <span className="text-xs font-medium text-muted-foreground">{message}</span>
        {onRetry && !isReconnecting && (
          <button
            onClick={onRetry}
            className="text-xs font-semibold text-foreground/70 underline underline-offset-2 hover:text-foreground active:scale-95 transition-all"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-2xl bg-gray-50/80 border border-gray-200/50 p-4 ${className}`}>
      {/* Main message row */}
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-gray-100/80 flex items-center justify-center shrink-0 mt-0.5">
          <Icon className={`w-4 h-4 text-muted-foreground/60 ${isReconnecting ? 'animate-spin' : ''}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-foreground/80 leading-snug">{message}</p>
          {isReconnecting && (
            <p className="text-[11px] text-muted-foreground/50 mt-0.5">This usually takes a moment</p>
          )}
        </div>
        {onRetry && !isReconnecting && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-200/60 text-[12px] font-semibold text-foreground/70 hover:bg-gray-50 active:scale-[0.97] transition-all min-h-[36px] shrink-0 shadow-sm"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        )}
      </div>

      {/* Text mode fallback */}
      {onSwitchToText && !isReconnecting && (
        <button
          onClick={onSwitchToText}
          className="flex items-center justify-center gap-2 w-full mt-3 py-2.5 rounded-xl bg-white border border-gray-200/50 text-[12px] font-semibold text-foreground/60 hover:text-foreground/80 hover:bg-gray-50 active:scale-[0.98] transition-all"
        >
          <MessageSquareText className="w-3.5 h-3.5" />
          Switch to text mode
        </button>
      )}
    </div>
  );
}
