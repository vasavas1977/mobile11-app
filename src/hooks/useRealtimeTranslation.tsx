import { useRef, useState, useCallback } from 'react';
import { GeminiLiveClient } from '@/utils/geminiLiveClient';
import { startMicCapture, AudioPlaybackQueue } from '@/utils/audioUtils';
import { supabase } from '@/integrations/supabase/client';
import { TranslateMessage, OutputMode } from '@/types/translate';
import { translateText, cancelTranslation } from '@/utils/textTranslationClient';
import { updateSummary, getCurrentSummary, resetSummary } from '@/utils/conversationSummary';
import { cleanTranscript, parseSrcMarker } from '@/utils/voiceTranscriptCorrections';
import { isLikelySourceScript, detectSpokenLanguage, filterToSourceScript, containsForeignScript, isDisallowedLanguage } from '@/utils/scriptDetection';
import { normalizeLanguageCode } from '@/utils/normalizeLanguageCode';
import type { TranslationErrorType } from '@/components/translate2/TranslationErrorInline';
import {
  debugSessionStart, debugSessionStop, debugTurnComplete,
  debugRefreshStart, debugRefreshComplete, debugReconnectStart,
  debugReconnectEnd, debugTextTranslation, debugSummaryUpdate,
} from '@/utils/translateDebugLogger';
import { SessionHealthMonitor } from '@/utils/sessionHealthMonitor';

interface UseRealtimeTranslationProps {
  addMessage: (msg: TranslateMessage) => void;
  messages: TranslateMessage[];
}

export function useRealtimeTranslation({ addMessage, messages }: UseRealtimeTranslationProps) {
  const messagesRef = useRef<TranslateMessage[]>(messages);
  messagesRef.current = messages;
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [streamingInput, setStreamingInput] = useState('');
  const [streamingOutput, setStreamingOutput] = useState('');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<TranslationErrorType>('connection');
  const errorSetRef = useRef(false); // Prevent duplicate errors from onError + onClose firing together
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const isSpeakerMutedRef = useRef(false);
  const [isTextTranslating, setIsTextTranslating] = useState(false);
  const [wasInterrupted, setWasInterrupted] = useState(false);
  const isMutedRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const isConnectingRef = useRef(false);
  const autoRetryCountRef = useRef(0);
  const autoRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [autoRetryExhausted, setAutoRetryExhausted] = useState(false);
  const reconnectTimestampsRef = useRef<number[]>([]);
  const isAutoRetryingRef = useRef(false);

  const clientRef = useRef<GeminiLiveClient | null>(null);
  const micRef = useRef<{ stop: () => void; analyser: AnalyserNode } | null>(null);
  const queueRef = useRef<AudioPlaybackQueue | null>(null);
  const animFrameRef = useRef<number>(0);
  const mountedRef = useRef(true);
  const aiSpeakingRef = useRef(false);
  const inputBufferRef = useRef('');
  const outputBufferRef = useRef('');
  // Store both languages for bidirectional mode
  const langANameRef = useRef('');
  const langBNameRef = useRef('');
  const langACodeRef = useRef('');
  const langBCodeRef = useRef('');
  const bidirectionalRef = useRef(false);
  // Legacy: kept for unidirectional fallback
  const sourceLangRef = useRef('');
  const targetLangRef = useRef('');
  const sourceCodeRef = useRef('');
  const targetCodeRef = useRef('');
  const sourceGenderRef = useRef<'male' | 'female'>('female');
  const targetGenderRef = useRef<'male' | 'female'>('female');
  const outputModeRef = useRef<OutputMode>('voice');
  const healthRef = useRef<SessionHealthMonitor | null>(null);
  const turnHadAudioRef = useRef(false);
  const turnHadTranscriptRef = useRef(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  // Throttle audioLevel state updates to ~30fps to reduce React re-renders
  const lastAudioLevelUpdateRef = useRef(0);
  // Track most recent mic loudness for cross-checking server-side interrupts
  const lastMicLevelRef = useRef(0);
  // Turn boundary guards — reject late fragments after turnComplete
  const turnCompletedAtRef = useRef(0);
  const sealedTurnIdRef = useRef<string | null>(null);
  // Track whether model text (authoritative) has arrived this turn
  const turnHasModelTextRef = useRef(false);
  // Per-turn audio buffer — only flushed to playback after onTurnComplete validates the turn
  const pendingAudioRef = useRef<string[]>([]);
  // Tracks if the current turn was triggered by confirmed user input (vs. unsolicited bot speech)
  const userInputThisTurnRef = useRef(false);
  // Generation id assigned to the currently-streaming turn
  const currentTurnIdRef = useRef<string | null>(null);
  // Set when we detect input/output drifted into a non-allowed language → drop turn + refresh session
  const turnHasForeignScriptRef = useRef(false);

  // ─── Voice cleanup ───
  const cleanup = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    micRef.current?.stop();
    micRef.current = null;
    streamRef.current = null;
    queueRef.current?.stop();
    queueRef.current = null;
    clientRef.current?.disconnect();
    clientRef.current = null;
    healthRef.current?.reset();
    healthRef.current = null;
    inputBufferRef.current = '';
    outputBufferRef.current = '';
    pendingAudioRef.current = [];
    userInputThisTurnRef.current = false;
    currentTurnIdRef.current = null;
    turnHasForeignScriptRef.current = false;
    isMutedRef.current = false;
    isSpeakerMutedRef.current = false;
    isConnectingRef.current = false;
    setIsMuted(false);
    setIsSpeakerMuted(false);
    setIsReconnecting(false);
  }, []);

  // ─── Shared auto-retry helper ───
  const triggerAutoRetry = useCallback((reason: string) => {
    const retryCount = autoRetryCountRef.current;
    if (retryCount >= 2) {
      // Retries exhausted → surface fallback
      console.warn(`[VoiceRecovery] Retries exhausted (reason: ${reason})`);
      autoRetryCountRef.current = 0;
      isAutoRetryingRef.current = false;
      setAutoRetryExhausted(true);
      setIsConnecting(false);
      setIsReconnecting(false);
      setErrorType('connection');
      setConnectionError('Voice is temporarily unavailable. Switching to text.');
      return;
    }
    autoRetryCountRef.current = retryCount + 1;
    isAutoRetryingRef.current = true;
    const delay = retryCount === 0 ? 1500 : 3000;
    console.log(`[VoiceRecovery] Auto-retry ${retryCount + 1}/2 (reason: ${reason}) in ${delay}ms`);
    setErrorType('reconnecting');
    setConnectionError(`Reconnecting… (attempt ${retryCount + 2})`);
    setIsConnecting(true);

    if (autoRetryTimerRef.current) clearTimeout(autoRetryTimerRef.current);
    autoRetryTimerRef.current = setTimeout(() => {
      if (mountedRef.current) {
        isConnectingRef.current = false; // allow startSession to proceed
        startSessionRef.current?.(
          langANameRef.current || sourceLangRef.current,
          langBNameRef.current || targetLangRef.current,
          langACodeRef.current || sourceCodeRef.current,
          langBCodeRef.current || targetCodeRef.current,
          outputModeRef.current,
          bidirectionalRef.current,
          { sourceGender: sourceGenderRef.current, targetGender: targetGenderRef.current },
        );
      }
    }, delay);
  }, []);

  // ─── Reconnect-loop detection ───
  const checkReconnectLoop = useCallback((): boolean => {
    const now = Date.now();
    reconnectTimestampsRef.current.push(now);
    // Keep last 60s of timestamps
    reconnectTimestampsRef.current = reconnectTimestampsRef.current.filter(t => now - t < 60000);
    if (reconnectTimestampsRef.current.length >= 5) {
      console.warn('[VoiceRecovery] Reconnect loop detected (5+ reconnects in 60s)');
      reconnectTimestampsRef.current = [];
      return true;
    }
    return false;
  }, []);

  // Stable ref to startSession for use inside triggerAutoRetry
  const startSessionRef = useRef<typeof startSession | null>(null);

  // ─── Voice mode: start Gemini Live session ───
  const startSession = useCallback(async (
    sourceLangName: string,
    targetLangName: string,
    sourceCode: string,
    targetCode: string,
    outputMode: OutputMode = 'voice',
    bidirectional: boolean = false,
    opts: { sourceGender?: 'male' | 'female'; targetGender?: 'male' | 'female' } = {},
  ): Promise<boolean> => {
    if (isConnectingRef.current) return false;
    isConnectingRef.current = true;
    isAutoRetryingRef.current = false;
    setIsConnecting(true);

    const safetyTimeout = setTimeout(() => {
      if (isConnectingRef.current) {
        console.warn('[VoiceRecovery] Connection timeout after 15s (reason: init_timeout)');
        isConnectingRef.current = false;
        cleanup();
        setIsConnected(false); setIsAiSpeaking(false); setAudioLevel(0);
        if (mountedRef.current) {
          triggerAutoRetry('init_timeout');
        }
      }
    }, 15000);

    sourceLangRef.current = sourceLangName;
    targetLangRef.current = targetLangName;
    sourceCodeRef.current = sourceCode;
    targetCodeRef.current = targetCode;
    outputModeRef.current = outputMode;
    bidirectionalRef.current = bidirectional;
    sourceGenderRef.current = opts.sourceGender ?? 'female';
    targetGenderRef.current = opts.targetGender ?? 'female';

    if (bidirectional) {
      langANameRef.current = sourceLangName;
      langBNameRef.current = targetLangName;
      langACodeRef.current = sourceCode;
      langBCodeRef.current = targetCode;
    }

    const isTextOnly = outputMode === 'text-only';
    const modeLabel = isTextOnly ? 'text_only' : 'voice_text';

    try {
      console.log('[RealtimeTranslation] Starting voice session', {
        mode: modeLabel, bidirectional,
        langA: sourceLangName, langB: targetLangName,
      });

      let queue: AudioPlaybackQueue | null = null;
      let queueResumePromise: Promise<void> | null = null;
      let aiSpeakingStartedAt = 0;
      let lastConfirmedUserSpeechAt = 0;
      let lastInputTranscriptAt = 0;
      let lastInputTranscriptText = '';
      let lastBargeInTime = 0;
      let loudSinceMs = 0;
      let lastEchoLogAt = 0;
      const BARGE_IN_THRESHOLD = 0.25;
      const STRONG_MIC_THRESHOLD = 0.42;
      const BARGE_IN_COOLDOWN_MS = 300;
      const BARGE_IN_SUSTAIN_MS = 200;
      const AI_START_GRACE_MS = 1200;
      const TRANSCRIPT_CONFIRM_WINDOW_MS = 1500;

      const normalizeInterruptText = (text: string) =>
        text
          .normalize('NFKC')
          .toLocaleLowerCase()
          .replace(/[^\p{L}\p{N}\s]/gu, ' ')
          .replace(/\s+/g, ' ')
          .trim();

      const isEchoLikeTranscript = (text: string) => {
        const normalizedInput = normalizeInterruptText(text);
        const normalizedOutput = normalizeInterruptText(outputBufferRef.current);
        if (!normalizedInput || !normalizedOutput) return false;
        return normalizedOutput.includes(normalizedInput) || normalizedInput.includes(normalizedOutput);
      };

      const hasRecentConfirmedSpeech = (nowMs: number) =>
        lastConfirmedUserSpeechAt > 0 && nowMs - lastConfirmedUserSpeechAt <= TRANSCRIPT_CONFIRM_WINDOW_MS;

      const hasRecentInputTranscript = (nowMs: number) =>
        lastInputTranscriptAt > 0 && nowMs - lastInputTranscriptAt <= TRANSCRIPT_CONFIRM_WINDOW_MS;

      const logEchoIgnored = (nowMs: number, reason: string) => {
        if (nowMs - lastEchoLogAt < 800) return;
        lastEchoLogAt = nowMs;
        console.log('[RealtimeTranslation] Echo ignored', {
          reason,
          micLevel: lastMicLevelRef.current.toFixed(2),
          transcript: lastInputTranscriptText ? lastInputTranscriptText.slice(0, 80) : undefined,
        });
      };

      // Track when AI playback ended + what it just said — used to suppress
      // self-echo turns where the mic picks up our own TTS output after playback.
      let aiSpeakingEndedAt = 0;
      let lastSpokenOutput = '';
      let previousSpokenOutput = '';
      const POST_PLAYBACK_ECHO_WINDOW_MS = 4000;
      const MIC_TAIL_AFTER_PLAYBACK_MS = 600;
      const ECHO_TOKEN_OVERLAP_THRESHOLD = 0.6;
      const OUTPUT_DEDUP_TOKEN_OVERLAP_THRESHOLD = 0.7;

      // Token-set overlap (Jaccard-ish): |intersection| / |smaller set|
      const tokenOverlapRatio = (a: string, b: string): number => {
        const ta = new Set(normalizeInterruptText(a).split(' ').filter(Boolean));
        const tb = new Set(normalizeInterruptText(b).split(' ').filter(Boolean));
        if (ta.size === 0 || tb.size === 0) return 0;
        let inter = 0;
        for (const t of ta) if (tb.has(t)) inter++;
        return inter / Math.min(ta.size, tb.size);
      };

      if (!isTextOnly) {
        queue = new AudioPlaybackQueue((playing) => {
          aiSpeakingRef.current = playing;
          if (playing) {
            aiSpeakingStartedAt = Date.now();
            lastConfirmedUserSpeechAt = 0;
            lastInputTranscriptAt = 0;
            lastInputTranscriptText = '';
            lastBargeInTime = 0;
            loudSinceMs = 0;
            lastEchoLogAt = 0;
          } else {
            // Playback just stopped — record when, and snapshot what was said
            aiSpeakingEndedAt = Date.now();
            lastSpokenOutput = outputBufferRef.current || lastSpokenOutput;
          }
          if (mountedRef.current) setIsAiSpeaking(playing);
        });
        queueRef.current = queue;
        queueResumePromise = queue.resume();
      }

      let liveClient: GeminiLiveClient | null = null;
      let lastMicGateLogAt = 0;
      const mic = await startMicCapture((pcm16Base64) => {
        if (!liveClient?.connected || isMutedRef.current) return;
        // Half-duplex: drop mic chunks while AI is speaking + a short tail
        // after playback ends, to prevent the speaker→mic echo loop.
        const nowMs = Date.now();
        const sincePlaybackEnded = aiSpeakingEndedAt > 0 ? nowMs - aiSpeakingEndedAt : Infinity;
        if (aiSpeakingRef.current || sincePlaybackEnded < MIC_TAIL_AFTER_PLAYBACK_MS) {
          if (nowMs - lastMicGateLogAt > 1000) {
            lastMicGateLogAt = nowMs;
            console.log('[mic] gated during AI playback', {
              aiSpeaking: aiSpeakingRef.current,
              sincePlaybackEnded,
            });
          }
          return;
        }
        liveClient.sendAudio(pcm16Base64);
      });
      micRef.current = mic;
      streamRef.current = mic.stream;

      if (queueResumePromise) await queueResumePromise;

      const { data, error: fnError } = await supabase.functions.invoke<{ wsUrl: string; setupMessage: any }>('translate-voice-token', {
        body: {
          sourceLang: sourceLangName, targetLang: targetLangName,
          sourceCode, targetCode, outputMode, bidirectional,
          sourceGender: sourceGenderRef.current,
          targetGender: targetGenderRef.current,
        },
      });

      if (fnError || !data?.wsUrl) throw new Error(fnError?.message || 'Failed to get translation session');

      // Create health monitor — on degradation, trigger the same refresh path
      // as turn/time-based refresh (gets a fresh token from the edge function)
      let pendingHealthRefresh = false;
      const healthMonitor = new SessionHealthMonitor(() => {
        if (pendingHealthRefresh) return; // Prevent double-trigger
        pendingHealthRefresh = true;
        console.log('[RealtimeTranslation] Health monitor triggered degradation refresh');
        // We schedule this as a microtask so it doesn't block the health check
        queueMicrotask(async () => {
          try {
            debugRefreshStart('turn_limit');
            if (mountedRef.current) setIsReconnecting(true);
            const summary = getCurrentSummary();
            const { data: freshData, error: freshError } = await supabase.functions.invoke('translate-voice-token', {
              body: {
                sourceLang: sourceLangRef.current, targetLang: targetLangRef.current,
                sourceCode: sourceCodeRef.current, targetCode: targetCodeRef.current,
                outputMode: outputModeRef.current, bidirectional: bidirectionalRef.current,
                sourceGender: sourceGenderRef.current,
                targetGender: targetGenderRef.current,
                ...(summary ? { summary } : {}),
              },
            });
            if (!freshError && freshData?.wsUrl && clientRef.current) {
              await clientRef.current.refreshWithNewSession(freshData.wsUrl, freshData.setupMessage);
              healthMonitor.record({ type: 'refresh_complete' });
              debugRefreshComplete();
            }
          } catch (err) {
            console.warn('[RealtimeTranslation] Health-triggered refresh failed:', err);
          } finally {
            pendingHealthRefresh = false;
            if (mountedRef.current) setIsReconnecting(false);
          }
        });
      });
      healthRef.current = healthMonitor;

      const client = new GeminiLiveClient({
        onReady: () => {
          console.log('[RealtimeTranslation] Voice setup complete');
          clearTimeout(safetyTimeout);
          isConnectingRef.current = false;
          debugSessionStart('voice');
          if (mountedRef.current) { setIsConnected(true); setIsConnecting(false); setIsReconnecting(false); }
        },
        onAudio: (pcm16Base64) => {
          // Narrow orphan-fragment guard: only reject audio that arrives
          // within ~250ms of the previous turn seal (true late dribble).
          // Anything later is the start of the next turn — let it through.
          const ORPHAN_AUDIO_GUARD_MS = 250;
          const audioElapsed = Date.now() - turnCompletedAtRef.current;
          if (turnCompletedAtRef.current > 0 && audioElapsed < ORPHAN_AUDIO_GUARD_MS) {
            return;
          }
          // Any fresh audio = new turn started → unlock seal immediately.
          if (turnCompletedAtRef.current > 0) turnCompletedAtRef.current = 0;
          // Assign a turn id on first audio of a new turn
          if (!currentTurnIdRef.current) {
            currentTurnIdRef.current = crypto.randomUUID();
          }
          // Buffer audio — do NOT enqueue until onTurnComplete validates the turn
          if (!isTextOnly) {
            pendingAudioRef.current.push(pcm16Base64);
          }
          // Track first audio for health monitoring
          if (!turnHadAudioRef.current) {
            turnHadAudioRef.current = true;
            healthMonitor.record({ type: 'first_audio' });
          }
        },
        onTranscript: (text) => {
          if (isTextOnly && text) {
            outputBufferRef.current += (outputBufferRef.current ? ' ' : '') + text;
            if (mountedRef.current) setStreamingOutput(outputBufferRef.current);
          }
        },
        onInputTranscript: (text) => {
          // Narrow orphan-fragment guard (300ms). Real next-turn input
          // arrives well after that; only true late dribble is dropped.
          const ORPHAN_TEXT_GUARD_MS = 300;
          const elapsed = Date.now() - turnCompletedAtRef.current;
          if (turnCompletedAtRef.current > 0 && elapsed < ORPHAN_TEXT_GUARD_MS) {
            console.log('[RealtimeTranslation] Late input fragment dropped', { elapsed, text: text.slice(0, 60) });
            return;
          }
          // Any new input = new turn started — unlock the seal immediately.
          if (turnCompletedAtRef.current > 0) turnCompletedAtRef.current = 0;

          // Full cleaning pipeline: spurious spaces, domain terms, filler, wrong-script
          let cleaned = cleanTranscript(text, sourceCodeRef.current);
          if (!bidirectionalRef.current && !isTextOnly) {
            cleaned = filterToSourceScript(cleaned, sourceCodeRef.current, targetCodeRef.current);
          }
          if (!cleaned.trim()) return;

          // Foreign-language guard: drop input if it's in a language outside
          // the allowed pair (catches both non-Latin scripts AND foreign Latin
          // languages like German appearing in an EN↔TH session).
          const allowed = bidirectionalRef.current
            ? [langACodeRef.current, langBCodeRef.current]
            : [sourceCodeRef.current, targetCodeRef.current];
          const langCheck = isDisallowedLanguage(cleaned, allowed);
          if (langCheck.disallowed) {
            console.log('[lang-gate] dropped foreign input', {
              detected: langCheck.detected,
              allowed: allowed.map(c => c.split('-')[0].toLowerCase()),
              text: cleaned.slice(0, 80),
            });
            turnHasForeignScriptRef.current = true;
            return;
          }

          // Post-playback echo guard: within N ms after AI finished speaking,
          // if the incoming transcript substantially overlaps what we just said
          // (token-set overlap, not just substring), it's almost certainly the
          // mic picking up our own TTS through the speaker. Also drop if the
          // input script matches the language we just output (same-script echo).
          const nowMs = Date.now();
          const sincePlaybackEnded = aiSpeakingEndedAt > 0 ? nowMs - aiSpeakingEndedAt : Infinity;
          if (
            !aiSpeakingRef.current
            && sincePlaybackEnded < POST_PLAYBACK_ECHO_WINDOW_MS
            && lastSpokenOutput
          ) {
            const ni = normalizeInterruptText(cleaned);
            const lo = normalizeInterruptText(lastSpokenOutput);
            const substringEcho = !!(ni && lo && (lo.includes(ni) || ni.includes(lo)));
            const overlap = tokenOverlapRatio(cleaned, lastSpokenOutput);
            const tokenEcho = overlap >= ECHO_TOKEN_OVERLAP_THRESHOLD;

            // Same-script-as-output echo: bidirectional only — if we just
            // output langB and the input is in langB's script within the
            // window, it's almost certainly self-echo.
            let sameScriptEcho = false;
            if (bidirectionalRef.current && langACodeRef.current && langBCodeRef.current) {
              const spoken = detectSpokenLanguage(lastSpokenOutput, langACodeRef.current, langBCodeRef.current);
              const heard = detectSpokenLanguage(cleaned, langACodeRef.current, langBCodeRef.current);
              if (spoken !== 'unknown' && heard === spoken) sameScriptEcho = true;
            }

            if (substringEcho || tokenEcho || sameScriptEcho) {
              console.log('[RealtimeTranslation] Post-playback echo dropped', {
                sincePlaybackEnded,
                overlap: overlap.toFixed(2),
                reason: substringEcho ? 'substring' : tokenEcho ? 'token_overlap' : 'same_script_as_output',
                transcript: cleaned.slice(0, 80),
              });
              return;
            }
          }

          if (aiSpeakingRef.current) {
            const sinceAiStart = nowMs - aiSpeakingStartedAt;
            lastInputTranscriptAt = nowMs;
            lastInputTranscriptText = cleaned;

            if (sinceAiStart < AI_START_GRACE_MS) {
              logEchoIgnored(nowMs, 'within_ai_grace_window');
            } else if (isEchoLikeTranscript(cleaned)) {
              logEchoIgnored(nowMs, 'transcript_matches_ai_output');
            } else {
              const hadRecentConfirmedSpeech = hasRecentConfirmedSpeech(nowMs);
              lastConfirmedUserSpeechAt = nowMs;
              if (!hadRecentConfirmedSpeech) {
                console.log('[RealtimeTranslation] Transcript-confirmed user speech detected', {
                  transcript: cleaned.slice(0, 80),
                });
              }
            }
          }

          // Mark this turn as user-initiated (real input arrived, not unsolicited bot speech)
          userInputThisTurnRef.current = true;

          inputBufferRef.current += (inputBufferRef.current ? ' ' : '') + cleaned;
          if (mountedRef.current) setStreamingInput(inputBufferRef.current);
        },
        onOutputTranscript: (text) => {
          // Narrow orphan-fragment guard (300ms).
          const ORPHAN_TEXT_GUARD_MS = 300;
          const elapsed = Date.now() - turnCompletedAtRef.current;
          if (turnCompletedAtRef.current > 0 && elapsed < ORPHAN_TEXT_GUARD_MS) {
            console.log('[RealtimeTranslation] Late output fragment dropped', { elapsed, text: text.slice(0, 60) });
            return;
          }
          // Fresh output = new turn started → unlock the seal.
          if (turnCompletedAtRef.current > 0) turnCompletedAtRef.current = 0;

          if (!isTextOnly) {
            // Check if this is authoritative model text (marked by geminiLiveClient)
            // Model text replaces buffer entirely; audio transcription appends/deduplicates
            const isModelText = turnHasModelTextRef.current === false;
            // After the first model text arrives via the client's turnHasModelText flag,
            // subsequent calls are also model text. We detect model text by checking
            // if the client just set turnHasModelText — but since we can't peek into the
            // client state here, we rely on the client suppressing audio transcription.
            // So any text that arrives here when turnHasModelText is false in the client
            // is either model text or interim audio transcription.

            const current = outputBufferRef.current.trim();
            // Deduplicate incremental fragments: if new text starts with existing buffer, replace
            if (current && text.startsWith(current)) {
              outputBufferRef.current = text;
            } else if (current && current.includes(text.trim())) {
              // Already contained — skip
            } else {
              outputBufferRef.current += (outputBufferRef.current ? ' ' : '') + text;
            }
            if (mountedRef.current) setStreamingOutput(outputBufferRef.current);
            return;
          }
          const parsed = parseSrcMarker(text);
          if (parsed) {
            inputBufferRef.current = parsed.srcText;
            if (mountedRef.current) setStreamingInput(inputBufferRef.current);
            if (parsed.remainingOutput) {
              outputBufferRef.current += (outputBufferRef.current ? ' ' : '') + parsed.remainingOutput;
              if (mountedRef.current) setStreamingOutput(outputBufferRef.current);
            }
          } else if (isLikelySourceScript(text, sourceCodeRef.current, targetCodeRef.current)) {
            inputBufferRef.current += (inputBufferRef.current ? ' ' : '') + text;
            if (mountedRef.current) setStreamingInput(inputBufferRef.current);
          } else {
            outputBufferRef.current += (outputBufferRef.current ? ' ' : '') + text;
            if (mountedRef.current) setStreamingOutput(outputBufferRef.current);
          }
        },
        onTurnComplete: () => {
          const inputText = inputBufferRef.current.trim();
          const outputText = outputBufferRef.current.trim();
          const previousSealAt = turnCompletedAtRef.current;
          const sinceLastTurnMs = previousSealAt > 0 ? Date.now() - previousSealAt : -1;

          // Snapshot the just-translated output so the post-playback echo guard
          // can compare against it even after buffers are reset. Also keep the
          // prior output for self-loop dedup below.
          if (outputText) {
            previousSpokenOutput = lastSpokenOutput;
            lastSpokenOutput = outputText;
          }

          // Reset buffers immediately so any late fragment that slips through
          // starts from empty and is clearly identifiable as orphan.
          inputBufferRef.current = '';
          outputBufferRef.current = '';

          // Note: turnCompletedAtRef is sealed only for committed turns (below).
          // Dropped turns (foreign-script, unsolicited, self-loop, fragment) must
          // NOT seal — otherwise the next turn's audio head is silently rejected.
          sealedTurnIdRef.current = crypto.randomUUID();
          turnHasModelTextRef.current = false;

          // Record health event
          healthMonitor.record({
            type: 'turn_complete',
            hadAudio: turnHadAudioRef.current,
            hadTranscript: !!(inputText || outputText),
          });

          // Drop tiny / fragment-only turns (e.g. "mi")
          const wordCharCount = (inputText.match(/\p{L}/gu) || []).length;
          const isFragment = inputText.length < 3 || wordCharCount < 2;

          // Dedup against last committed message — leftover fragment within 5s
          const lastMsg = messagesRef.current[messagesRef.current.length - 1];
          const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
          let isDuplicate = false;
          if (lastMsg && Date.now() - lastMsg.timestamp.getTime() < 5000) {
            const ni = normalize(inputText);
            const li = normalize(lastMsg.originalText);
            const no = normalize(outputText);
            const lo = normalize(lastMsg.translatedText);
            if (ni && li && (li.includes(ni) || ni.includes(li))) isDuplicate = true;
            if (no && lo && (lo.includes(no) || no.includes(lo))) isDuplicate = true;
          }

          // Unsolicited turn: bot spoke without any confirmed user input
          const isUnsolicited = !userInputThisTurnRef.current;
          // Foreign-script drift detected during this turn
          const isForeignScript = turnHasForeignScriptRef.current;

          const pendingChunks = pendingAudioRef.current;
          pendingAudioRef.current = [];
          const turnId = currentTurnIdRef.current;
          currentTurnIdRef.current = null;

          // Output self-loop guard: if this turn's output is a near-duplicate
          // of the previous turn's output, Gemini self-looped on its own TTS.
          let isOutputSelfLoop = false;
          if (outputText && previousSpokenOutput) {
            const outOverlap = tokenOverlapRatio(outputText, previousSpokenOutput);
            if (outOverlap >= OUTPUT_DEDUP_TOKEN_OVERLAP_THRESHOLD) {
              isOutputSelfLoop = true;
              console.log('[RealtimeTranslation] Output self-loop detected', {
                overlap: outOverlap.toFixed(2),
                output: outputText.slice(0, 80),
                previous: previousSpokenOutput.slice(0, 80),
              });
            }
          }

          const shouldDrop = isForeignScript || isUnsolicited || isOutputSelfLoop || (inputText && outputText && (isFragment || isDuplicate)) || (!inputText && !outputText && pendingChunks.length > 0);

          if (shouldDrop) {
            console.log('[RealtimeTranslation] Turn dropped', {
              reason: isForeignScript ? 'foreign_script' : isUnsolicited ? 'unsolicited' : isOutputSelfLoop ? 'output_self_loop' : isFragment ? 'fragment' : isDuplicate ? 'duplicate' : 'empty_transcript',
              audioChunksDiscarded: pendingChunks.length,
              input: inputText, output: outputText, sinceLastTurnMs, turnId,
            });
            // Audio buffer discarded — bot will not speak this turn.
            // On foreign-script drift, refresh the Gemini session to clear bad model state
            if (isForeignScript) {
              console.log('[RealtimeTranslation] Foreign-script turn dropped, refreshing session');
              // Clear stale half-duplex / echo state so the next user turn isn't gated.
              aiSpeakingRef.current = false;
              aiSpeakingEndedAt = 0;
              lastSpokenOutput = '';
              previousSpokenOutput = '';
              turnCompletedAtRef.current = 0;
              queueRef.current?.flush();
              queueMicrotask(async () => {
                try {
                  const summary = getCurrentSummary();
                  const { data: freshData } = await supabase.functions.invoke('translate-voice-token', {
                    body: {
                      sourceLang: sourceLangRef.current, targetLang: targetLangRef.current,
                      sourceCode: sourceCodeRef.current, targetCode: targetCodeRef.current,
                      outputMode: outputModeRef.current, bidirectional: bidirectionalRef.current,
                      ...(summary ? { summary } : {}),
                    },
                  });
                  if (freshData?.wsUrl && clientRef.current) {
                    await clientRef.current.refreshWithNewSession(freshData.wsUrl, freshData.setupMessage);
                  }
                } catch (err) {
                  console.warn('[RealtimeTranslation] Drift refresh failed:', err);
                }
              });
            }
          } else if (inputText && outputText) {
            // Flush buffered audio to playback queue now that the turn is validated
            if (!isTextOnly && queue && pendingChunks.length > 0) {
              console.log('[RealtimeTranslation] Buffered audio flushed to queue', {
                chunks: pendingChunks.length, turnId,
              });
              for (const chunk of pendingChunks) {
                queue.enqueue(chunk, queue.currentGeneration);
              }
            }

            let sourceLang = sourceCodeRef.current;
            let targetLang = targetCodeRef.current;
            let speaker: 'user' | 'other' = 'user';

            if (bidirectionalRef.current) {
              const detected = detectSpokenLanguage(inputText, langACodeRef.current, langBCodeRef.current);
              if (detected === 'langB') {
                sourceLang = langBCodeRef.current;
                targetLang = langACodeRef.current;
                speaker = 'other';
              } else {
                sourceLang = langACodeRef.current;
                targetLang = langBCodeRef.current;
                speaker = 'user';
              }
            }

            const newMsg: TranslateMessage = {
              id: crypto.randomUUID(),
              originalText: inputText,
              translatedText: outputText,
              sourceLang: normalizeLanguageCode(sourceLang),
              targetLang: normalizeLanguageCode(targetLang),
              speaker,
              timestamp: new Date(),
              mode: 'voice',
              status: 'done',
            };
            addMessage(newMsg);

            // Seal committed turn so late orphan fragments are rejected.
            turnCompletedAtRef.current = Date.now();

            // Update rolling summary for session refresh context
            const summary = updateSummary([...messagesRef.current, newMsg]);
            debugTurnComplete();
            debugSummaryUpdate(summary.length);
          }

          turnHadAudioRef.current = false;
          turnHadTranscriptRef.current = false;
          // Reset for next turn
          userInputThisTurnRef.current = false;
          turnHasForeignScriptRef.current = false;
          // Signal new turn to health monitor and playback queue
          healthMonitor.record({ type: 'turn_start' });
          queueRef.current?.markNewTurn();
          if (mountedRef.current) { setStreamingInput(''); setStreamingOutput(''); }
        },
        onError: (error) => {
          console.error('[VoiceRecovery] WebSocket error (reason: websocket_error):', error);
          if (mountedRef.current && !errorSetRef.current) {
            errorSetRef.current = true;
            setTimeout(() => { errorSetRef.current = false; }, 500);
            // Don't show error — let onClose handle auto-retry
          }
        },
        onClose: (code, reason) => {
          console.log('[VoiceRecovery] Closed', { code, reason });
          isConnectingRef.current = false;
          if (mountedRef.current) {
            setIsConnected(false); setIsConnecting(false);
            // Abnormal closure → auto-retry instead of showing error
            if (code !== 1000 && code !== undefined && !errorSetRef.current) {
              errorSetRef.current = true;
              setTimeout(() => { errorSetRef.current = false; }, 500);
              cleanup();
              setIsAiSpeaking(false); setAudioLevel(0);
              triggerAutoRetry('websocket_error');
            }
          }
        },
        onInterrupted: () => {
          const nowMs = Date.now();
          const elapsed = nowMs - aiSpeakingStartedAt;
          const hasConfirmedSpeech = hasRecentConfirmedSpeech(nowMs);
          const hasTranscriptEvidence = hasRecentInputTranscript(nowMs);
          const hasStrongMic = lastMicLevelRef.current > STRONG_MIC_THRESHOLD;
          const canInterrupt = aiSpeakingRef.current && (
            elapsed >= AI_START_GRACE_MS
              ? hasConfirmedSpeech || hasStrongMic
              : hasConfirmedSpeech && hasStrongMic
          );

          if (!canInterrupt) {
            const reason = !aiSpeakingRef.current
              ? 'ai_not_speaking'
              : elapsed < AI_START_GRACE_MS
                ? 'within_ai_grace_window'
                : hasTranscriptEvidence
                  ? 'input_transcript_looks_like_echo'
                  : 'no_recent_user_speech';
            console.log('[RealtimeTranslation] Server interrupt rejected', {
              reason,
              micLevel: lastMicLevelRef.current.toFixed(2),
              transcript: lastInputTranscriptText ? lastInputTranscriptText.slice(0, 80) : undefined,
            });
            return;
          }

          console.log('[RealtimeTranslation] Server interrupt accepted', {
            reason: hasConfirmedSpeech ? 'transcript_confirmed' : 'strong_local_mic',
            micLevel: lastMicLevelRef.current.toFixed(2),
          });

          queue?.flush();
          lastConfirmedUserSpeechAt = 0;
          lastInputTranscriptAt = 0;
          lastInputTranscriptText = '';
          if (mountedRef.current) {
            setStreamingInput(''); setStreamingOutput('');
            setWasInterrupted(true);
            // Clear interrupted state after a brief display period
            setTimeout(() => { if (mountedRef.current) setWasInterrupted(false); }, 1500);
          }
        },
        onReconnecting: () => {
          isConnectingRef.current = true;
          errorSetRef.current = false;
          healthMonitor.record({ type: 'reconnect' });
          debugReconnectStart();
          // Detect reconnect loop
          if (checkReconnectLoop()) {
            cleanup();
            if (mountedRef.current) {
              setIsConnected(false); setIsConnecting(false); setIsReconnecting(false);
              setAutoRetryExhausted(true);
              setErrorType('connection');
              setConnectionError('Voice connection is unstable. Switching to text.');
              console.warn('[VoiceRecovery] Reconnect loop triggered fallback (reason: reconnect_loop)');
            }
            return;
          }
          if (mountedRef.current) {
            setIsReconnecting(true);
            setIsConnecting(true);
            setErrorType('reconnecting');
            setConnectionError('Reconnecting…');
          }
        },
        onReconnectFailed: () => {
          isConnectingRef.current = false;
          errorSetRef.current = false;
          debugReconnectEnd(false);
          if (mountedRef.current) {
            setIsConnected(false); setIsConnecting(false); setIsReconnecting(false);
            setErrorType('connection');
            setConnectionError('Voice is temporarily unavailable. You can still use text.');
          }
        },
        onSessionRefresh: async () => {
          debugRefreshStart('turn_limit');
          if (mountedRef.current) setIsReconnecting(true);
          try {
            const summary = getCurrentSummary();
            const { data: freshData, error: freshError } = await supabase.functions.invoke('translate-voice-token', {
              body: {
                sourceLang: sourceLangRef.current, targetLang: targetLangRef.current,
                sourceCode: sourceCodeRef.current, targetCode: targetCodeRef.current,
                outputMode: outputModeRef.current, bidirectional: bidirectionalRef.current,
                sourceGender: sourceGenderRef.current,
                targetGender: targetGenderRef.current,
                ...(summary ? { summary } : {}),
              },
            });
            if (!freshError && freshData?.wsUrl) {
              await client.refreshWithNewSession(freshData.wsUrl, freshData.setupMessage);
              healthMonitor.record({ type: 'refresh_complete' });
              debugRefreshComplete();
            }
          } catch (err) {
            console.warn('[RealtimeTranslation] Session refresh failed:', err);
          } finally {
            if (mountedRef.current) setIsReconnecting(false);
          }
        },
      });

      liveClient = client;
      clientRef.current = client;
      await client.connect(data.wsUrl, data.setupMessage);

      const updateLevel = () => {
        if (!micRef.current?.analyser) return;
        const arr = new Uint8Array(micRef.current.analyser.frequencyBinCount);
        micRef.current.analyser.getByteFrequencyData(arr);
        const avg = arr.reduce((s, v) => s + v, 0) / arr.length / 255;
        lastMicLevelRef.current = avg;

        // Throttle React state updates to ~30fps (every ~33ms) to reduce re-renders
        const now = performance.now();
        if (now - lastAudioLevelUpdateRef.current > 33) {
          lastAudioLevelUpdateRef.current = now;
          if (mountedRef.current) setAudioLevel(avg);
        }

        // Client-side barge-in: require sustained loudness + fresh transcript-confirmed user speech.
        if (aiSpeakingRef.current && !isMutedRef.current) {
          const nowMs = Date.now();
          const sinceAiStart = nowMs - aiSpeakingStartedAt;
          const pastGrace = sinceAiStart >= AI_START_GRACE_MS;
          if (avg > BARGE_IN_THRESHOLD) {
            if (loudSinceMs === 0) loudSinceMs = nowMs;
            const sustained = nowMs - loudSinceMs >= BARGE_IN_SUSTAIN_MS;
            const hasConfirmedSpeech = hasRecentConfirmedSpeech(nowMs);
            const hasTranscriptEvidence = hasRecentInputTranscript(nowMs);

            if (sustained && !pastGrace) {
              logEchoIgnored(nowMs, 'within_ai_grace_window');
            } else if (sustained && hasConfirmedSpeech && nowMs - lastBargeInTime > BARGE_IN_COOLDOWN_MS) {
              lastBargeInTime = nowMs;
              console.log('[RealtimeTranslation] Transcript-confirmed barge-in, flushing playback', {
                micLevel: avg.toFixed(2),
                transcript: lastInputTranscriptText ? lastInputTranscriptText.slice(0, 80) : undefined,
              });
              queueRef.current?.flush();
              lastConfirmedUserSpeechAt = 0;
              lastInputTranscriptAt = 0;
              lastInputTranscriptText = '';
              loudSinceMs = 0;
            } else if (sustained) {
              logEchoIgnored(
                nowMs,
                hasTranscriptEvidence ? 'input_transcript_looks_like_echo' : 'no_recent_input_transcript',
              );
            }
          } else {
            loudSinceMs = 0;
          }
        } else {
          loudSinceMs = 0;
        }


        animFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      return true;
    } catch (err: any) {
      const msg = err?.message || 'Unknown error';
      console.error('[RealtimeTranslation] Start failed:', msg);
      clearTimeout(safetyTimeout);
      cleanup();
      setIsConnected(false); setIsConnecting(false); setIsAiSpeaking(false); setAudioLevel(0);

      if (msg === 'Session cancelled') return false;

      const isMicError = err?.name === 'NotAllowedError' || /not allowed by the user agent|permission|denied/i.test(msg);

      if (isMicError) {
        console.warn('[VoiceRecovery] Mic permission denied (reason: mic_permission_denied)');
        setErrorType('mic');
        setConnectionError('Microphone access is off. You can still type instead.');
        return false;
      }

      // Determine reason for structured logging
      const reason = /edge function|load failed|network/i.test(msg) ? 'network_error'
        : /token/i.test(msg) ? 'token_error' : 'unknown';
      
      // Use shared auto-retry
      triggerAutoRetry(reason);
      return false;
    }
  }, [addMessage, cleanup, triggerAutoRetry]);

  // Keep ref in sync for use inside triggerAutoRetry
  startSessionRef.current = startSession;

  const stopSession = useCallback(() => {
    cleanup();
    resetSummary();
    debugSessionStop();
    isConnectingRef.current = false;
    setIsConnected(false); setIsConnecting(false); setIsAiSpeaking(false); setAudioLevel(0);
    setStreamingInput(''); setStreamingOutput('');
  }, [cleanup]);

  // ─── Text mode: stateless REST translation (no WebSocket) ───
  const sendTextTranslation = useCallback(async (
    text: string,
    sourceLangName: string,
    targetLangName: string,
    sourceCode: string,
    targetCode: string,
  ): Promise<TranslateMessage | null> => {
    if (!text.trim()) return null;

    debugSessionStart('text');
    setIsTextTranslating(true);
    const t0 = Date.now();

    try {
      const summary = getCurrentSummary();
      const result = await translateText({
        text,
        sourceLang: sourceLangName,
        targetLang: targetLangName,
        ...(summary ? { summary } : {}),
      });

      debugTextTranslation(Date.now() - t0);

      if (result.error) {
        console.error('[RealtimeTranslation] Text translation error:', result.error);
        // Still create a message so the user sees the error inline
        const errorMsg: TranslateMessage = {
          id: crypto.randomUUID(),
          originalText: text,
          translatedText: result.error,
          sourceLang: normalizeLanguageCode(sourceCode),
          targetLang: normalizeLanguageCode(targetCode),
          speaker: 'user',
          timestamp: new Date(),
          mode: 'text',
          status: 'error',
        };
        addMessage(errorMsg);
        return errorMsg;
      }

      if (!result.translatedText) return null;

      const msg: TranslateMessage = {
        id: crypto.randomUUID(),
        originalText: text,
        translatedText: result.translatedText,
        sourceLang: normalizeLanguageCode(sourceCode),
        targetLang: normalizeLanguageCode(targetCode),
        speaker: 'user',
        timestamp: new Date(),
        mode: 'text',
        status: 'done',
      };
      addMessage(msg);
      const summaryText = updateSummary([...messagesRef.current, msg]);
      debugSummaryUpdate(summaryText.length);
      return msg;
    } finally {
      if (mountedRef.current) setIsTextTranslating(false);
    }
  }, [addMessage]);

  // ─── Text mode: cancel in-flight request ───
  const cancelTextTranslation = useCallback(() => {
    cancelTranslation();
    setIsTextTranslating(false);
  }, []);

  const clearError = useCallback(() => {
    errorSetRef.current = false;
    setConnectionError(null);
    autoRetryCountRef.current = 0;
    setAutoRetryExhausted(false);
    if (autoRetryTimerRef.current) {
      clearTimeout(autoRetryTimerRef.current);
      autoRetryTimerRef.current = null;
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      isMutedRef.current = next;
      const track = streamRef.current?.getAudioTracks()[0];
      if (track) track.enabled = !next;
      return next;
    });
  }, []);

  const toggleSpeaker = useCallback(() => {
    setIsSpeakerMuted((prev) => {
      const next = !prev;
      isSpeakerMutedRef.current = next;
      if (queueRef.current) {
        if (next) queueRef.current.mute();
        else queueRef.current.unmute();
      }
      return next;
    });
  }, []);

  return {
    // Voice mode
    startSession,
    stopSession,
    isConnected,
    isConnecting,
    isAiSpeaking,
    isReconnecting,
    wasInterrupted,
    audioLevel,
    streamingInput,
    streamingOutput,
    // Text mode
    sendTextTranslation,
    cancelTextTranslation,
    isTextTranslating,
    // Shared
    connectionError,
    errorType,
    clearError,
    isMuted,
    toggleMute,
    isSpeakerMuted,
    toggleSpeaker,
    autoRetryExhausted,
  };
}
