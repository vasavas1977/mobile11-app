import { Mic, MicOff, Loader2, Volume2, VolumeX, RefreshCw, AlertCircle } from 'lucide-react';
import { useMemo, useCallback, useRef, useState, useEffect } from 'react';

type VoiceState = 'idle' | 'connecting' | 'listening' | 'speaking' | 'reconnecting' | 'muted' | 'error';

interface ConversationMicButtonProps {
  isLive: boolean;
  isConnecting: boolean;
  isAiSpeaking: boolean;
  isReconnecting?: boolean;
  audioLevel: number;
  isMuted?: boolean;
  isSpeakerMuted?: boolean;
  hasError?: boolean;
  onStart: () => void;
  onStop: () => void;
  onToggleMute?: () => void;
  onToggleSpeaker?: () => void;
}

interface StateVisuals {
  label: string;
  sublabel?: string;
  dotColor: string;
  labelColor: string;
  bg: string;
  shadow: string;
  glowRgb: string;
  iconColor: string;
}

const STATE_CONFIG: Record<VoiceState, StateVisuals> = {
  idle: {
    label: 'Tap to speak',
    dotColor: '',
    labelColor: 'text-muted-foreground',
    bg: 'from-gray-800 to-gray-900',
    shadow: '0 8px 30px -4px rgba(0,0,0,0.35)',
    glowRgb: '0,0,0',
    iconColor: 'text-white',
  },
  connecting: {
    label: 'Connecting',
    dotColor: '',
    labelColor: 'text-muted-foreground',
    bg: 'from-gray-600 to-gray-700',
    shadow: '0 4px 16px -4px rgba(0,0,0,0.2)',
    glowRgb: '0,0,0',
    iconColor: 'text-white/80',
  },
  listening: {
    label: 'Listening',
    dotColor: 'bg-emerald-400',
    labelColor: 'text-emerald-600',
    bg: 'from-emerald-500 to-emerald-600',
    shadow: '0 6px 28px -4px rgba(16,185,129,0.4)',
    glowRgb: '16,185,129',
    iconColor: 'text-white',
  },
  speaking: {
    label: 'Translating',
    dotColor: 'bg-blue-400',
    labelColor: 'text-blue-600',
    bg: 'from-blue-500 to-blue-600',
    shadow: '0 6px 28px -4px rgba(59,130,246,0.4)',
    glowRgb: '59,130,246',
    iconColor: 'text-white',
  },
  reconnecting: {
    label: 'Reconnecting',
    sublabel: 'Hold on…',
    dotColor: 'bg-amber-400',
    labelColor: 'text-amber-600',
    bg: 'from-amber-500 to-amber-600',
    shadow: '0 4px 20px -4px rgba(217,119,6,0.3)',
    glowRgb: '217,119,6',
    iconColor: 'text-white/90',
  },
  muted: {
    label: 'Muted',
    dotColor: 'bg-red-400',
    labelColor: 'text-red-500',
    bg: 'from-red-400 to-red-500',
    shadow: '0 6px 24px -4px rgba(239,68,68,0.3)',
    glowRgb: '239,68,68',
    iconColor: 'text-white',
  },
  error: {
    label: 'Tap to retry',
    dotColor: '',
    labelColor: 'text-muted-foreground',
    bg: 'from-gray-500 to-gray-600',
    shadow: '0 4px 16px -4px rgba(0,0,0,0.2)',
    glowRgb: '0,0,0',
    iconColor: 'text-white',
  },
};

function CrossfadeIcon({ voiceState }: { voiceState: VoiceState }) {
  const base = 'w-7 h-7 text-white absolute inset-0 m-auto transition-all duration-500 ease-out';

  return (
    <div className="relative w-7 h-7">
      <Mic className={base} style={{ opacity: voiceState === 'idle' || voiceState === 'listening' ? 1 : 0, transform: voiceState === 'idle' || voiceState === 'listening' ? 'scale(1)' : 'scale(0.8)' }} />
      <Volume2 className={base} style={{ opacity: voiceState === 'speaking' ? 1 : 0, transform: voiceState === 'speaking' ? 'scale(1)' : 'scale(0.8)' }} />
      <MicOff className={base} style={{ opacity: voiceState === 'muted' ? 1 : 0, transform: voiceState === 'muted' ? 'scale(1)' : 'scale(0.8)' }} />
      <AlertCircle className={base} style={{ opacity: voiceState === 'error' ? 1 : 0, transform: voiceState === 'error' ? 'scale(1)' : 'scale(0.8)' }} />
      <Loader2
        className={`${base} animate-spin`}
        style={{ opacity: voiceState === 'connecting' ? 1 : 0, animationDuration: '1.6s' }}
      />
      <RefreshCw
        className={`w-6 h-6 text-white/90 absolute inset-0 m-auto transition-all duration-500 ease-out animate-spin`}
        style={{ opacity: voiceState === 'reconnecting' ? 1 : 0, animationDuration: '2.5s' }}
      />
    </div>
  );
}

function useSmoothedAudioLevel(rawLevel: number, factor = 0.22) {
  const smoothedRef = useRef(0);
  const target = Math.min(rawLevel, 1);
  const k = target > smoothedRef.current ? factor : factor * 0.35;
  smoothedRef.current += (target - smoothedRef.current) * k;
  return smoothedRef.current;
}

export function ConversationMicButton({
  isLive,
  isConnecting,
  isAiSpeaking,
  isReconnecting = false,
  audioLevel,
  isMuted = false,
  isSpeakerMuted = false,
  hasError = false,
  onStart,
  onStop,
  onToggleMute,
  onToggleSpeaker,
}: ConversationMicButtonProps) {
  const pressTimeRef = useRef(0);
  const smoothLevel = useSmoothedAudioLevel(audioLevel);

  const voiceState: VoiceState = useMemo(() => {
    if (hasError && !isLive && !isConnecting) return 'error';
    if (isConnecting && !isReconnecting) return 'connecting';
    if (isReconnecting) return 'reconnecting';
    if (!isLive) return 'idle';
    if (isMuted) return 'muted';
    if (isAiSpeaking) return 'speaking';
    return 'listening';
  }, [isLive, isConnecting, isAiSpeaking, isReconnecting, isMuted, hasError]);

  const [displayLabel, setDisplayLabel] = useState(STATE_CONFIG[voiceState].label);
  const [displayLabelColor, setDisplayLabelColor] = useState(STATE_CONFIG[voiceState].labelColor);
  const labelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const newConfig = STATE_CONFIG[voiceState];
    if (labelTimerRef.current !== null) clearTimeout(labelTimerRef.current);
    labelTimerRef.current = setTimeout(() => {
      setDisplayLabel(newConfig.label);
      setDisplayLabelColor(newConfig.labelColor);
    }, 140);
    return () => {
      if (labelTimerRef.current !== null) clearTimeout(labelTimerRef.current);
    };
  }, [voiceState]);

  const config = STATE_CONFIG[voiceState];
  const isDisabled = voiceState === 'connecting' || voiceState === 'reconnecting';

  const handlePress = useCallback(() => {
    if (isDisabled) return;
    const now = Date.now();
    if (now - pressTimeRef.current < 300) return;
    pressTimeRef.current = now;
    if (isLive) onStop();
    else onStart();
  }, [isDisabled, isLive, onStart, onStop]);

  const isListening = voiceState === 'listening';
  const isSpeaking = voiceState === 'speaking';

  const clampedLevel = Math.min(smoothLevel, 0.85);

  // Listening rings
  const ringScale = isListening ? 1 + clampedLevel * 0.4 : 1;
  const ringOpacity = isListening ? Math.min(0.5, clampedLevel * 2) : 0;
  const ring2Scale = isListening ? 1 + clampedLevel * 0.25 : 1;
  const ring2Opacity = isListening ? Math.min(0.25, clampedLevel * 1.2) : 0;

  // Glow
  const glowIntensity = isListening
    ? 0.05 + clampedLevel * 0.12
    : isSpeaking ? 0.08 : 0.015;

  // Dynamic shadow
  const dynamicShadow = isListening
    ? `0 6px ${20 + clampedLevel * 14}px -4px rgba(16,185,129,${0.25 + clampedLevel * 0.2})`
    : config.shadow;

  const showMuteButton = isLive && !isConnecting && onToggleMute;
  const showSpeakerButton = isLive && !isConnecting && onToggleSpeaker;
  const showSideButtons = showMuteButton || showSpeakerButton;
  const showLiveDot = isLive && !isDisabled && !!config.dotColor;

  return (
    <div className="flex flex-col items-center gap-3.5" role="status" aria-live="polite">
      <div className="relative flex items-center justify-center gap-6">
        {/* Mic mute toggle */}
        {showMuteButton && (
          <button
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            className={`w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all duration-300 ease-out active:scale-90 border ${
              isMuted
                ? 'bg-red-50 border-red-200/60 shadow-sm'
                : 'bg-white border-gray-200/50 shadow-sm'
            }`}
          >
            {isMuted ? (
              <MicOff className="w-[19px] h-[19px] text-red-500 transition-colors duration-300" />
            ) : (
              <Mic className="w-[19px] h-[19px] text-gray-400 transition-colors duration-300" />
            )}
          </button>
        )}

        {/* Main button */}
        <div className="relative flex items-center justify-center">
          {/* Ambient glow */}
          <div
            className="absolute w-[120px] h-[120px] rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle, rgba(${config.glowRgb},${glowIntensity}) 0%, transparent 70%)`,
              transition: 'background 700ms ease-out',
            }}
            aria-hidden="true"
          />

          {/* Listening ring 1 */}
          <div
            className="absolute w-[96px] h-[96px] rounded-full pointer-events-none"
            style={{
              transform: `scale(${ringScale})`,
              opacity: ringOpacity,
              border: '1.5px solid rgba(16,185,129,0.25)',
              transition: 'transform 200ms ease-out, opacity 200ms ease-out',
              willChange: isListening ? 'transform, opacity' : 'auto',
            }}
            aria-hidden="true"
          />

          {/* Listening ring 2 */}
          <div
            className="absolute w-[110px] h-[110px] rounded-full pointer-events-none"
            style={{
              transform: `scale(${ring2Scale})`,
              opacity: ring2Opacity,
              border: '1px solid rgba(16,185,129,0.12)',
              transition: 'transform 280ms ease-out, opacity 280ms ease-out',
              willChange: isListening ? 'transform, opacity' : 'auto',
            }}
            aria-hidden="true"
          />

          {/* Speaking pulse rings */}
          <div
            className="absolute w-[98px] h-[98px] rounded-full pointer-events-none"
            style={{
              opacity: isSpeaking ? 0.5 : 0,
              border: '1.5px solid rgba(59,130,246,0.18)',
              animation: 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              transition: 'opacity 800ms ease-out',
            }}
            aria-hidden="true"
          />
          <div
            className="absolute w-[114px] h-[114px] rounded-full pointer-events-none"
            style={{
              opacity: isSpeaking ? 0.25 : 0,
              border: '1px solid rgba(59,130,246,0.08)',
              animation: 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite 2s',
              transition: 'opacity 800ms ease-out',
            }}
            aria-hidden="true"
          />

          {/* Connecting spinner */}
          <div
            className={`absolute w-[96px] h-[96px] rounded-full border-[1.5px] border-t-transparent pointer-events-none animate-spin ${
              voiceState === 'reconnecting' ? 'border-amber-300/35' : 'border-gray-300/35'
            }`}
            style={{
              animationDuration: '2.2s',
              opacity: isDisabled ? 1 : 0,
              transition: 'opacity 600ms ease-out',
            }}
            aria-hidden="true"
          />

          {/* Button */}
          <button
            onClick={handlePress}
            disabled={isDisabled}
            aria-label={config.label}
            className={`
              relative w-[76px] h-[76px] rounded-full flex items-center justify-center z-10
              bg-gradient-to-b ${config.bg}
              active:scale-[0.88] active:duration-75
              disabled:cursor-not-allowed
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400
            `}
            style={{
              boxShadow: dynamicShadow,
              transition: 'background 800ms cubic-bezier(0.16,1,0.3,1), box-shadow 200ms ease-out, transform 75ms ease-out',
            }}
          >
            {/* Glass highlight */}
            <div
              className="absolute inset-[1px] rounded-full pointer-events-none"
              style={{
                background: 'linear-gradient(170deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 45%)',
              }}
              aria-hidden="true"
            />

            <span className="relative z-10">
              <CrossfadeIcon voiceState={voiceState} />
            </span>

            {showLiveDot && (
              <span
                className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-[2px] border-white transition-all duration-600 ${config.dotColor}`}
                aria-hidden="true"
              />
            )}
          </button>
        </div>

        {/* Speaker toggle */}
        {showSideButtons && (
          showSpeakerButton ? (
            <button
              onClick={onToggleSpeaker}
              aria-label={isSpeakerMuted ? 'Unmute speaker' : 'Mute speaker'}
              className={`w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all duration-300 ease-out active:scale-90 border ${
                isSpeakerMuted
                  ? 'bg-gray-100 border-gray-200/60 shadow-sm'
                  : 'bg-white border-gray-200/50 shadow-sm'
              }`}
            >
              {isSpeakerMuted ? (
                <VolumeX className="w-[19px] h-[19px] text-gray-400 transition-colors duration-300" />
              ) : (
                <Volume2 className="w-[19px] h-[19px] text-gray-500 transition-colors duration-300" />
              )}
            </button>
          ) : (
            <div className="w-[52px] h-[52px]" aria-hidden="true" />
          )
        )}
      </div>

      {/* Status label */}
      <div className="flex flex-col items-center gap-0.5 min-h-[24px] justify-center select-none">
        <div className="flex items-center gap-1.5">
          {showLiveDot && (
            <span
              className={`w-[5px] h-[5px] rounded-full shrink-0 transition-all duration-700 ${config.dotColor}`}
              aria-hidden="true"
            />
          )}
          <span className={`text-[13px] font-medium tracking-[-0.01em] transition-colors duration-700 ${displayLabelColor}`}>
            {displayLabel}
          </span>
        </div>
        {config.sublabel && (
          <span className="text-[11px] text-muted-foreground/50 transition-opacity duration-600">
            {config.sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
