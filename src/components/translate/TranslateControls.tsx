import { Mic, MicOff, Settings, MessageSquare } from 'lucide-react';
import { InputMode, OutputMode } from '@/types/translate';

interface TranslateControlsProps {
  isRecording: boolean;
  isTranslating: boolean;
  inputMode: InputMode;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onToggleSettings: () => void;
  onTogglePhrases: () => void;
  isAiSpeaking?: boolean;
  audioLevel?: number;
  isLive?: boolean;
  outputMode?: OutputMode;
}

export function TranslateControls({
  isRecording,
  isTranslating,
  inputMode,
  onStartRecording,
  onStopRecording,
  onToggleSettings,
  onTogglePhrases,
  isAiSpeaking,
  audioLevel = 0,
  isLive,
  outputMode = 'voice',
}: TranslateControlsProps) {
  const handleMicAction = () => {
    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  };

  const ringScale = isLive ? 1 + audioLevel * 1.5 : 1;
  const isTextOnly = outputMode === 'text-only';

  return (
    <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 py-4 safe-bottom">
      <div className="flex items-center justify-center gap-6">
        {/* Quick phrases */}
        <button
          onClick={onTogglePhrases}
          className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <MessageSquare className="w-5 h-5 text-foreground" />
        </button>

        {/* Main mic button */}
        <div className="relative flex items-center justify-center">
          {/* Audio level ring */}
          {isLive && (
            <div
              className="absolute w-20 h-20 rounded-full border-2 border-orange-300 opacity-50 transition-transform duration-100"
              style={{ transform: `scale(${ringScale})` }}
            />
          )}
          {/* AI speaking indicator */}
          {isAiSpeaking && !isTextOnly && (
            <div className="absolute w-24 h-24 rounded-full border-2 border-blue-400 animate-ping opacity-30" />
          )}
          <button
            onClick={handleMicAction}
            disabled={isTranslating}
            className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-lg z-10 ${
              isRecording
                ? 'bg-red-500 shadow-red-200'
                : isTranslating
                ? 'bg-gray-300'
                : 'bg-orange-500 hover:bg-orange-600 shadow-orange-200'
            }`}
          >
            {isRecording ? (
              <>
                <MicOff className="w-7 h-7 text-white" />
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-400 animate-pulse" />
              </>
            ) : (
              <Mic className="w-7 h-7 text-white" />
            )}
          </button>
        </div>

        {/* Settings */}
        <button
          onClick={onToggleSettings}
          className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <Settings className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Recording hint */}
      <p className="text-xs text-muted-foreground text-center mt-2">
        {isRecording
          ? isAiSpeaking && !isTextOnly
            ? 'Translating...'
            : isTextOnly
            ? 'Listening… Text only'
            : 'Listening... Speak now'
          : isTranslating
          ? 'Connecting...'
          : isTextOnly
          ? 'Tap to start (text only)'
          : 'Tap to start live translation'}
      </p>
    </div>
  );
}
