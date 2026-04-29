import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, PhoneOff, Volume2, RefreshCw, VolumeX, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { GeminiLiveClient } from '@/utils/geminiLiveClient';
import { startMicCapture, AudioPlaybackQueue } from '@/utils/audioUtils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  appendTranscriptChunk,
  type TranscriptBuffer,
} from '@/utils/voiceTranscriptAssembly';
import { cleanTranscript, cleanAssistantTranscript } from '@/utils/voiceTranscriptCorrections';
import {
  createDiagEmitter,
  isDiagEnabled,
  newClientEventId,
  type DiagEmitter,
} from '@/utils/voiceDiag';

const LIVE_TRANSCRIPT_LS_KEY = 'voice.showLiveTranscript';

// Name-adoption observability: heuristic only — the real gating is in the
// system prompt. The previous "address" regex (พี่|คุณ followed by ANY token)
// fired on every Thai pronoun + verb pair (e.g. "พี่ เคยใช้") and polluted
// telemetry. Only log a name when the customer EXPLICITLY self-introduces
// AND the captured token is not on the stop-word list.
const SELF_INTRO_RE = /(?:ผมชื่อ|ฉันชื่อ|หนูชื่อ|ดิฉันชื่อ|เรียกผมว่า|เรียกฉันว่า|my name is|i['']?m\s+(?=[A-Z])|call me|this is)\s+([A-Za-zก-๙][A-Za-zก-๙]{1,29})/i;
const NAME_CORRECTION_RE = /(?:ไม่ใช่|that['']?s not|it['']?s actually|no,?\s*i['']?m)/i;
// Tokens that must NEVER be logged as adopted names (Thai pronouns, common
// verbs, particles, English fillers). Lowercased for matching.
const NAME_STOP_WORDS = new Set([
  'พี่', 'น้อง', 'คุณ', 'ผม', 'ฉัน', 'หนู', 'ดิฉัน', 'เรา', 'มัน', 'เขา',
  'เคย', 'เคยใช้', 'ใช้', 'ต้องการ', 'ซื้อ', 'ไป', 'มา', 'อยาก', 'ขอ',
  'ครับ', 'ค่ะ', 'คะ', 'นะ', 'จ้ะ', 'จ้า', 'ใช่', 'ไม่', 'ไม่ใช่',
  'eSIM', 'esim', 'sim', 'แพ็ก', 'แพ็กเกจ', 'แผน', 'ลิงก์',
  'i', 'me', 'you', 'he', 'she', 'we', 'they', 'the', 'a', 'an', 'is', 'am',
]);
function isPlausibleName(token: string | null | undefined): boolean {
  if (!token) return false;
  const t = token.trim();
  if (t.length < 2 || t.length > 20) return false;
  if (NAME_STOP_WORDS.has(t) || NAME_STOP_WORDS.has(t.toLowerCase())) return false;
  // Reject anything that looks like a verb fragment / particle (contains spaces)
  if (/\s/.test(t)) return false;
  return true;
}

export interface VoiceTranscriptEntry {
  role: 'customer' | 'ai';
  text: string;
  timestamp: string;
}

interface ChatVoiceModeProps {
  onTranscript: (role: 'customer' | 'ai', text: string) => void;
  onEnd: () => void;
  onVoiceSessionEnd?: (transcript: VoiceTranscriptEntry[]) => void;
  onEscalation?: () => void;
  conversationId?: string | null;
}

const MAX_RESTART_ATTEMPTS = 3;
const INITIAL_BACKOFF_MS = 2000;

// Escalation detection keywords — broad fragments to handle Gemini's natural paraphrasing
const ESCALATION_AI_PHRASES = [
  // English fragments
  'contact you', 'get back to you', 'representative will', 'agent will',
  'team will reach', 'connect you with', 'transfer you to',
  'type your name and phone', 'name and phone number',
  // Thai fragments
  'ติดต่อกลับ', 'เจ้าหน้าที่จะ', 'แจ้งเรื่อง', 'ทีมงานจะ',
  'พิมพ์ชื่อและเบอร์', 'ชื่อและเบอร์โทร', 'ต่อสายให้',
];

// Customer escalation keywords
const ESCALATION_CUSTOMER_KEYWORDS = [
  'talk to agent', 'talk to a human', 'speak to agent', 'speak to a human',
  'human agent', 'real person', 'representative',
  'เจ้าหน้าที่', 'คุยกับคน', 'ต่อสาย', 'ขอคุยกับคน',
];

function detectEscalation(text: string, phrases: string[]): boolean {
  const lower = text.toLowerCase();
  return phrases.some(phrase => lower.includes(phrase));
}

export function ChatVoiceMode({ onTranscript, onEnd, onVoiceSessionEnd, onEscalation, conversationId }: ChatVoiceModeProps) {
  const { language: currentLanguage, t } = useLanguage();
  const { toast } = useToast();
  const [status, setStatus] = useState<'connecting' | 'active' | 'reconnecting' | 'error'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [volume, setVolume] = useState(2.0);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [retryAfterMsg, setRetryAfterMsg] = useState<string | null>(null);

  const clientRef = useRef<GeminiLiveClient | null>(null);
  const micRef = useRef<{ stop: () => void; analyser: AnalyserNode } | null>(null);
  const queueRef = useRef<AudioPlaybackQueue | null>(null);
  const aiSpeakingRef = useRef(false);
  const animFrameRef = useRef<number>(0);
  const bargeinDebounceStartRef = useRef<number>(0);
  const bargeinConfirmedRef = useRef(false);
  const baselineAudioLevelRef = useRef(0);

  // Display-only toggle. Does NOT touch buffering, finalization, or persistence.
  const [showLiveTranscript, setShowLiveTranscript] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(LIVE_TRANSCRIPT_LS_KEY) === 'true';
  });
  const showLiveTranscriptRef = useRef(showLiveTranscript);
  useEffect(() => {
    showLiveTranscriptRef.current = showLiveTranscript;
    try {
      window.localStorage.setItem(LIVE_TRANSCRIPT_LS_KEY, String(showLiveTranscript));
    } catch { /* localStorage unavailable */ }
  }, [showLiveTranscript]);

  // Observability + name lifecycle (heuristic — prompt does the real gating).
  const adoptedNameRef = useRef<string | null>(null);
  const turnCountRef = useRef(0);
  const mountedRef = useRef(true);
  const isStartingRef = useRef(false);
  const restartAttemptsRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcriptLogRef = useRef<VoiceTranscriptEntry[]>([]);
  // Lifted so handleEnd can check whether a buffered partial was already
  // persisted by persistTurn before pushing it to the legacy safety-net log.
  const committedTurnKeysRef = useRef<Set<string>>(new Set());
  const escalationFiredRef = useRef(false);
  const turnCompletedAtRef = useRef(0);

  // Tracks whether this voice session has accumulated any turns. Once true,
  // every subsequent attach (scheduled refresh, network-drop reconnect, page
  // resume, manual retry) must request memory injection — only the very
  // first connect of the session is exempt.
  const hasPriorTurnsRef = useRef(false);
  // Cause of the next startVoice() call. Set by onClose / page-visibility /
  // online handlers; consumed (and reset) by startVoice. Defaults to
  // 'first_connect' for the initial mount.
  const restartReasonRef = useRef<'first_connect' | 'ws_close' | 'network_resume' | 'page_resume' | 'manual_retry'>('first_connect');

  // Phase 0 diag — created once per voice session, only if enabled.
  const diagEmitterRef = useRef<DiagEmitter | null>(null);
  const diagEnabled = useRef(isDiagEnabled()).current;
  const [diagSessionIdShort, setDiagSessionIdShort] = useState<string>('');
  // Phase 1 — last refresh response from chat-voice-token, consumed by the
  // next onDiagEvent so SQL can verify memory injection end-to-end.
  const lastRefreshResponseRef = useRef<{
    history_source: 'memory_summary' | 'none';
    memory_completeness: 'complete' | 'partial' | 'none';
    resume_reason: string;
    injected_slots: string[];
    history_chars: number;
  } | null>(null);

  // Native Gemini transcription buffers
  const customerTranscriptBufferRef = useRef('');
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, []);

  // Defense-in-depth sanitizer for voice transcript text.
  // Primary fix lives in (a) the edge function (thinkingBudget=0 + OUTPUT FORMAT
  // rules) and (b) geminiLiveClient channel routing (only spoken transcription
  // reaches the bubble). This cleaner is a last line of defense for explicit
  // markers we know we don't want rendered.
  const cleanVoiceTranscript = useCallback((input: string): string => {
    if (!input) return '';
    let s = input;
    s = s.replace(/```[\s\S]*?```/g, '');
    s = s.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
    s = s.replace(/<thought>[\s\S]*?<\/thought>/gi, '');
    s = s.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');
    s = s.replace(/<scratchpad>[\s\S]*?<\/scratchpad>/gi, '');
    s = s.replace(/<think>[\s\S]*?<\/think>/gi, '');
    s = s.replace(/^(Thought|Thinking|Reasoning|Plan|Action|Observation):\s.*$/gim, '');
    s = s.replace(/\[SRC\][\s\S]*?\[\/SRC\]/gi, '');
    s = s.replace(/\n{3,}/g, '\n\n').trim();
    return s;
  }, []);

  // NOTE: applyChunk used to live here. It was replaced by the shared
  // appendTranscriptChunk in voiceTranscriptAssembly.ts. The previous
  // implementation also had a reset bug (`aiTurnId = null` set immediately
  // after assignment) that wiped the buffer on every chunk, causing the
  // bubble to display only the most recent 1–2 words.

  const cleanup = useCallback(() => {
    // Clear any pending retry timer
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    cancelAnimationFrame(animFrameRef.current);
    micRef.current?.stop();
    micRef.current = null;
    queueRef.current?.stop();
    queueRef.current = null;
    clientRef.current?.disconnect();
    clientRef.current = null;
    isStartingRef.current = false;
    customerTranscriptBufferRef.current = '';
    if (diagEmitterRef.current) {
      diagEmitterRef.current.close();
      diagEmitterRef.current = null;
    }
  }, []);

  useEffect(() => {
    startVoice();
  }, []);

  // Page-visibility & network-online recovery. If the WS dropped while the
  // tab was backgrounded or the network was offline, tag the cause and
  // restart so chat-voice-token rebuilds the system prompt with memory.
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      if (!mountedRef.current) return;
      if (clientRef.current?.connected) return;
      if (isStartingRef.current) return;
      console.log('[ChatVoice] Page resumed — restarting voice with memory');
      restartReasonRef.current = 'page_resume';
      cleanup();
      startVoice();
    };
    const handleOnline = () => {
      if (!mountedRef.current) return;
      if (clientRef.current?.connected) return;
      if (isStartingRef.current) return;
      console.log('[ChatVoice] Network resumed — restarting voice with memory');
      restartReasonRef.current = 'network_resume';
      cleanup();
      startVoice();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('online', handleOnline);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const startVoice = async () => {
    // Single-flight guard: prevent concurrent startVoice calls
    if (isStartingRef.current) return;
    isStartingRef.current = true;

    try {
      setStatus('connecting');
      setRetryAfterMsg(null);

      const aiSpeakingTimeout = { timer: null as ReturnType<typeof setTimeout> | null };
      
      const queue = new AudioPlaybackQueue((playing) => {
        aiSpeakingRef.current = playing;
        if (mountedRef.current) setAiSpeaking(playing);
        
        if (playing) {
          aiSpeakingTimeout.timer = setTimeout(() => {
            if (aiSpeakingRef.current) {
              console.warn('[ChatVoice] AI speaking safety timeout — forcing mic re-enable');
              aiSpeakingRef.current = false;
              if (mountedRef.current) setAiSpeaking(false);
            }
          }, 10000);
        } else {
          if (aiSpeakingTimeout.timer) {
            clearTimeout(aiSpeakingTimeout.timer);
            aiSpeakingTimeout.timer = null;
          }
        }
      });
      queueRef.current = queue;

      // Memory injection policy:
      //   - Very first connect of the session → no memory (nothing to inject).
      //   - Every subsequent attach (refresh / reconnect / resume / retry) →
      //     request memory so the bot doesn't re-greet or re-ask captured slots.
      const reason = restartReasonRef.current;
      const isFirstConnect = reason === 'first_connect' && !hasPriorTurnsRef.current;
      const { data, error: fnError } = await supabase.functions.invoke("chat-voice-token", {
        body: {
          conversation_id: conversationId || undefined,
          language: currentLanguage,
          is_first_connect: isFirstConnect,
          resume_reason: isFirstConnect ? 'first_connect' : reason,
          last_known_turn_id: hasPriorTurnsRef.current ? `t_${turnCountRef.current}` : undefined,
        },
      });
      // Reset for the next call; onClose / handlers will set it again as needed.
      restartReasonRef.current = 'first_connect';

      // Handle 429 rate limit
      if (fnError) {
        // Try to parse structured 429 response
        const errMsg = fnError.message || '';
        if (errMsg.includes('429') || errMsg.includes('Too many')) {
          isStartingRef.current = false;
          setStatus('error');
          setRetryAfterMsg(t('chatbot.voice.tooManySessions'));
          return;
        }
        throw new Error(errMsg || "Failed to get voice session");
      }

      if (!data?.wsUrl) {
        throw new Error("Failed to get voice session");
      }

      await queue.resume();

      // Per-turn assistant transcript buffer. Replaces the previous
      // string-based aiTranscriptBuffer + buggy reset logic. The shared
      // appendTranscriptChunk identifies turn boundaries by sessionId+turnId
      // and appends deltas verbatim, fixing the "1–2 words at a time" bug.
      let aiBuffer: TranscriptBuffer | null = null;

      // User input transcript: Gemini Live emits incremental fragments without
      // a stable turnId on this surface, so we synthesize one per utterance —
      // a new utterance starts when the buffer is empty (after turnComplete /
      // interrupt cleared it). Same append semantics as the assistant channel.
      let userBuffer: TranscriptBuffer | null = null;
      let userUtteranceId = 0;

      // Idempotency: per-turn commit key prevents double-persistence when
      // turnComplete races with interrupt or close. Lifted to a ref so
      // handleEnd's safety-net flush can avoid re-pushing already-persisted
      // turns into transcriptLogRef.
      const committedTurnKeys = committedTurnKeysRef.current;

      const persistTurn = (
        role: 'customer' | 'ai',
        text: string,
        turnKey: string,
        completed: boolean,
      ) => {
        // Defense-in-depth marker stripping (thoughts, code blocks, [SRC]).
        let cleaned = cleanVoiceTranscript(text).trim();
        if (!cleaned) return;

        // Channel-specific cleaner: user STT goes through the full
        // correction pipeline (filler/wrong-script/Mobile11/eSIM); the
        // assistant transcript only gets the lighter Thai-whitespace
        // collapse so brand tokens and URLs are preserved.
        if (role === 'customer') {
          cleaned = cleanTranscript(cleaned, currentLanguage || 'en').trim();
        } else {
          cleaned = cleanAssistantTranscript(cleaned).trim();
        }
        if (!cleaned) return;

        if (committedTurnKeys.has(turnKey)) return;
        committedTurnKeys.add(turnKey);

        // NOTE: We intentionally do NOT push into transcriptLogRef here.
        // Per-turn DB persistence below is the source of truth. The legacy
        // session-end batch save (handleEnd → onVoiceSessionEnd) is now a
        // pure safety net for transcript fragments that were never committed
        // (e.g. user hangs up mid-utterance before turnComplete fires).
        // Pushing here caused every turn to be inserted twice with identical
        // content + timestamps — see duplicate transcript bug.

        // Per-turn DB persistence so the full transcript appears in chat
        // history immediately after each turn — not only on call end. The
        // edge function blind-inserts; ChatWidget already dedupes voice
        // messages by content+timestamp on reload, so reopening the
        // conversation does not produce visible duplicates.
        if (conversationId) {
          supabase.functions.invoke('save-voice-transcript', {
            body: {
              conversation_id: conversationId,
              transcript: [{
                role,
                text: cleaned,
                timestamp: new Date().toISOString(),
              }],
            },
          }).then(({ error }) => {
            if (error) {
              console.warn('[ChatVoice] Per-turn persist failed:', error);
            } else if (import.meta.env.VITE_VOICE_DEBUG === 'true') {
              console.debug('[ChatVoice] Persisted turn', { role, turnKey, completed, len: cleaned.length });
            }
          }).catch(err => {
            console.warn('[ChatVoice] Per-turn persist threw:', err);
          });
        }
      };

      const flushAssistantBuffer = (completed: boolean) => {
        if (!aiBuffer || !aiBuffer.text) return;
        const turnKey = `ai:${aiBuffer.sessionId}:${aiBuffer.turnId}`;
        const rawText = aiBuffer.text;
        persistTurn('ai', rawText, turnKey, completed);
        // Send cleaned text to bubble too, replacing any partial.
        const finalText = cleanAssistantTranscript(cleanVoiceTranscript(rawText)).trim();
        if (finalText) onTranscript('ai', finalText);
        onTranscript('ai', '__turn_complete__');

        // Observability: detect name adoption in assistant turn text.
        // Disabled "address" heuristic (พี่|คุณ + token) — it false-fired
        // on every Thai pronoun + verb pair. Self-intro detection now
        // happens on the customer-side flush below, where it belongs.
        // (No-op here on purpose; do not re-add an inference-based logger.)

        turnCountRef.current += 1;
        hasPriorTurnsRef.current = true;
        aiBuffer = null;
      };

      const flushUserBuffer = (completed: boolean) => {
        if (!userBuffer || !userBuffer.text) return;
        const turnKey = `user:${userBuffer.sessionId}:${userBuffer.turnId}`;
        const rawText = userBuffer.text;
        persistTurn('customer', rawText, turnKey, completed);
        // Send cleaned text to bubble too, replacing any partial.
        const finalText = cleanTranscript(cleanVoiceTranscript(rawText), currentLanguage || 'en').trim();
        if (finalText) onTranscript('customer', finalText);
        onTranscript('customer', '__turn_complete__');

        // Observability: name correction / self-intro detection.
        try {
          if (NAME_CORRECTION_RE.test(finalText) && adoptedNameRef.current) {
            console.log('[voice.name.dropped]', {
              conversationId,
              previousName: adoptedNameRef.current,
              reason: 'user_correction',
            });
            adoptedNameRef.current = null;
          }
          const intro = finalText.match(SELF_INTRO_RE);
          const candidate = intro ? intro[1].trim().split(/\s+/)[0] : null;
          if (candidate && isPlausibleName(candidate)) {
            console.log('[voice.name.self_intro]', {
              conversationId,
              name: candidate,
            });
            adoptedNameRef.current = candidate;
          }
        } catch { /* never block flush on observability */ }

        hasPriorTurnsRef.current = true;
        userBuffer = null;
        customerTranscriptBufferRef.current = '';
      };


      const client = new GeminiLiveClient({
        onReady: () => {
          if (mountedRef.current) {
            setStatus('active');
            // Reset restart counter on successful connection
            restartAttemptsRef.current = 0;
          }
        },
        onAudio: (pcm16Base64) => {
          queue.enqueue(pcm16Base64);
        },
        onTranscript: () => {
          // Intentionally ignored. Raw model text is NOT spoken output and
          // must not reach the customer bubble. The spoken channel is
          // onAssistantSpokenTranscript below.
        },
        onAssistantRawText: (text, meta) => {
          // Debug-only sink for raw / thought parts. Never feed UI.
          if (import.meta.env.VITE_VOICE_DEBUG === 'true') {
            console.debug('[ChatVoice][debug:raw]', meta.partType, text.slice(0, 200));
          }
        },
        onAssistantToolEvent: (event, meta) => {
          if (import.meta.env.VITE_VOICE_DEBUG === 'true') {
            console.debug('[ChatVoice][debug:tool]', meta, event);
          }
        },
        onInputTranscript: (text) => {
          // Phase 0 diag: each input fragment updates vadCommitTs so it ends
          // up ≈ time of the last user fragment ≈ end-of-user-speech.
          if (diagEnabled) clientRef.current?.markVadCommit();

          // Synthesize a per-utterance turnId — a fresh utterance begins
          // whenever the buffer was cleared (by previous turnComplete /
          // interrupt). Without this the shared assembler would never
          // recognize utterance boundaries on the input channel.
          if (!userBuffer) {
            userUtteranceId += 1;
            // Force-finalize any stale customer live bubble from a previous turn.
            onTranscript('customer', '__turn_complete__');
          }

          userBuffer = appendTranscriptChunk(userBuffer, {
            sessionId: 'user-input',
            turnId: `u_${userUtteranceId}`,
            source: 'user-input',
            text: userBuffer ? ` ${text}` : text, // space between fragments
            isDelta: true,
          });

          // Mirror to legacy ref so existing handleEnd / cleanup paths still work.
          customerTranscriptBufferRef.current = userBuffer.text;
          // Display gate: only stream live partials when the user opted in.
          // Buffering / persistence above is unchanged either way.
          if (showLiveTranscriptRef.current) {
            onTranscript('customer', userBuffer.text);
          } else {
            onTranscript('customer', '__listening__');
          }

          if (!escalationFiredRef.current && detectEscalation(userBuffer.text, ESCALATION_CUSTOMER_KEYWORDS)) {
            console.log('[ChatVoice] Escalation detected in customer transcript');
          }
        },
        onAssistantSpokenTranscript: (text, meta) => {
          // Skip late transcript fragments arriving immediately after
          // turnComplete (prevents orphaned bubbles from race conditions).
          if (Date.now() - turnCompletedAtRef.current < 300) {
            return;
          }

          // Append delta to the running buffer. The shared assembler handles
          // turn boundaries, snapshot replacement, and adjacent-duplicate
          // dedupe — replacing the previous buggy reset that wiped the
          // buffer on every chunk.
          aiBuffer = appendTranscriptChunk(aiBuffer, {
            sessionId: meta.sessionId,
            turnId: meta.turnId,
            source: 'assistant-audio',
            text,
            isDelta: true,
          });

          const cleaned = cleanVoiceTranscript(aiBuffer.text);
          if (cleaned) {
            // Display gate: stream live partials only when toggle is ON.
            // Buffer accumulation above happens regardless so the final
            // cleaned text is always available on turnComplete.
            if (showLiveTranscriptRef.current) {
              onTranscript('ai', cleaned);
            } else {
              onTranscript('ai', '__thinking__');
            }
            if (!escalationFiredRef.current && detectEscalation(cleaned, ESCALATION_AI_PHRASES)) {
              console.log('[ChatVoice] Escalation detected in AI transcript — triggering escalation');
              escalationFiredRef.current = true;
              setTimeout(() => {
                if (mountedRef.current && onEscalation) {
                  onEscalation();
                }
              }, 2000);
            }
          }
        },
        onTurnComplete: () => {
          turnCompletedAtRef.current = Date.now();
          // Customer first (they spoke before AI replied), then AI.
          flushUserBuffer(true);
          flushAssistantBuffer(true);
        },
        onError: (error) => {
          console.error('[ChatVoice] Error:', error);
          if (mountedRef.current) {
            toast({
              title: t('chatbot.voice.errorTitle'),
              description: error,
              variant: 'destructive',
            });
          }
        },
        onClose: (code?: number, reason?: string) => {
          if (!mountedRef.current) return;
          console.log(`[ChatVoice] WebSocket closed (code=${code}, reason=${reason || 'none'})`);

          // Abnormal flush: persist whatever is in the buffers as partial
          // transcripts before the reconnect attempt. completed=false signals
          // the turn did not reach turnComplete.
          flushAssistantBuffer(false);
          flushUserBuffer(false);

          // Bounded restart with exponential backoff
          restartAttemptsRef.current++;
          if (restartAttemptsRef.current > MAX_RESTART_ATTEMPTS) {
            console.warn('[ChatVoice] Max restart attempts reached, showing error');
            setStatus('error');
            toast({
              title: t('chatbot.voice.connectionLost'),
              description: t('chatbot.voice.tapRetry'),
              variant: 'destructive',
            });
            isStartingRef.current = false;
            return;
          }

          setStatus('reconnecting');
          const backoff = INITIAL_BACKOFF_MS * Math.pow(2, restartAttemptsRef.current - 1);
          console.log(`[ChatVoice] Scheduling restart attempt ${restartAttemptsRef.current}/${MAX_RESTART_ATTEMPTS} in ${backoff}ms`);
          
          retryTimerRef.current = setTimeout(() => {
            if (mountedRef.current && !clientRef.current?.connected) {
              // Tag the restart cause so chat-voice-token re-injects memory.
              restartReasonRef.current = 'ws_close';
              cleanup();
              startVoice();
            }
          }, backoff);
        },
        onInterrupted: () => {
          queue.flush();

          // Barge-in or interrupt: flush partial buffers as completed=false
          // so the persistence layer knows the turn was cut short.
          flushAssistantBuffer(false);
          flushUserBuffer(false);

          bargeinDebounceStartRef.current = 0;
          bargeinConfirmedRef.current = false;
        },
        onReconnecting: (attempt) => {
          if (mountedRef.current) {
            setStatus('reconnecting');
            queue.flush();
          }
        },
        onReconnectFailed: () => {
          if (mountedRef.current) {
            setStatus('error');
            isStartingRef.current = false;
            toast({
              title: t('chatbot.voice.connectionLost'),
              description: t('chatbot.voice.couldNotReconnect'),
              variant: 'destructive',
            });
          }
        },
        onSessionRefresh: async () => {
          if (mountedRef.current) {
            // Flush any in-flight buffer as partial before swapping sessions.
            flushAssistantBuffer(false);
            aiBuffer = null;
            queue.flush();
            try {
              const { data: freshData, error: freshError } = await supabase.functions.invoke("chat-voice-token", {
                body: {
                  conversation_id: conversationId || undefined,
                  language: currentLanguage,
                  is_first_connect: false,
                  resume_reason: "scheduled_refresh",
                  // Stamp the most recent turn we believe is persisted so the
                  // edge function can wait briefly if our async transcript
                  // write hasn't landed yet.
                  last_known_turn_id: `t_${turnCountRef.current}`,
                },
              });
              if (!freshError && freshData?.wsUrl) {
                await client.refreshWithNewSession(freshData.wsUrl, freshData.setupMessage);
                // Stash the response on the client for the next diag emission.
                lastRefreshResponseRef.current = {
                  history_source: freshData.history_source ?? 'none',
                  memory_completeness: freshData.memory_completeness ?? 'none',
                  resume_reason: freshData.resume_reason ?? 'scheduled_refresh',
                  injected_slots: Array.isArray(freshData.injected_slots) ? freshData.injected_slots : [],
                  history_chars: typeof freshData.history_chars === 'number' ? freshData.history_chars : 0,
                };
                // No post-refresh nudge: with SESSION MEMORY in the system
                // prompt, the bot already knows where it is in the flow.
                // The previous "Continue the conversation naturally" hint
                // burned an extra turn and could confuse stage tracking.
              }
            } catch (err) {
              console.warn('[ChatVoice] Session refresh token fetch failed:', err);
            }
          }
        },
        onDiagEvent: diagEnabled
          ? (event) => {
              const emitter = diagEmitterRef.current;
              if (!emitter) return;
              // Update visible badge on session-id change.
              const slice = (event.liveSessionId || '').slice(0, 8);
              if (slice && slice !== diagSessionIdShort) {
                setDiagSessionIdShort(slice);
              }
              const refreshResp = lastRefreshResponseRef.current;
              emitter.emit({
                client_event_id: newClientEventId(),
                live_session_id: event.liveSessionId,
                conversation_id: conversationId || null,
                turn_id: event.turnId,
                conversation_turn_count: event.conversationTurnCount,
                refresh_trigger: event.refreshTrigger,
                refreshed_this_turn: event.refreshedThisTurn,
                server_prompt_had_history: refreshResp ? refreshResp.history_source === 'memory_summary' : false,
                vad_commit_to_first_audio_ms: event.vadCommitToFirstAudioMs ?? null,
                name_adoption_state: adoptedNameRef.current ? 'adopted' : 'unknown',
                channel: 'webchat',
                ts_client: Date.now(),
                extra: {
                  ...(event.extra || {}),
                  // Phase 1: memory injection observability. Slot NAMES only —
                  // never values — so debug doesn't require reproducing PII.
                  history_source: refreshResp?.history_source ?? 'none',
                  memory_completeness: refreshResp?.memory_completeness ?? 'none',
                  resume_reason: refreshResp?.resume_reason ?? 'first_connect',
                  injected_slots: refreshResp?.injected_slots ?? [],
                  history_chars: refreshResp?.history_chars ?? 0,
                },
              });
            }
          : undefined,
      });

      if (diagEnabled && !diagEmitterRef.current) {
        diagEmitterRef.current = createDiagEmitter();
      }

      clientRef.current = client;
      await client.connect(data.wsUrl, data.setupMessage);
      if (diagEnabled) {
        setDiagSessionIdShort((client.diagLiveSessionId || '').slice(0, 8));
      }

      const mic = await startMicCapture((pcm16Base64) => {
        if (isMutedRef.current || !client.connected) return;

        if (!aiSpeakingRef.current) {
          bargeinDebounceStartRef.current = 0;
          bargeinConfirmedRef.current = false;
          client.sendAudio(pcm16Base64);
        } else {
          if (bargeinConfirmedRef.current) {
            client.sendAudio(pcm16Base64);
          } else {
            const currentLevel = baselineAudioLevelRef.current;
            const threshold = currentLevel * 2.5;
            const analyserData = new Uint8Array(mic.analyser.frequencyBinCount);
            mic.analyser.getByteFrequencyData(analyserData);
            const avg = analyserData.reduce((sum, v) => sum + v, 0) / analyserData.length / 255;

            if (avg > Math.max(threshold, 0.08)) {
              if (bargeinDebounceStartRef.current === 0) {
                bargeinDebounceStartRef.current = Date.now();
              } else if (Date.now() - bargeinDebounceStartRef.current >= 150) {
                bargeinConfirmedRef.current = true;
                client.sendAudio(pcm16Base64);
              }
            } else {
              bargeinDebounceStartRef.current = 0;
            }
          }
        }
      }, 40);
      micRef.current = mic;

      const updateLevel = () => {
        if (!mic.analyser || !mountedRef.current) return;
        const data = new Uint8Array(mic.analyser.frequencyBinCount);
        mic.analyser.getByteFrequencyData(data);
        const avg = data.reduce((sum, v) => sum + v, 0) / data.length;
        const normalized = avg / 255;
        setAudioLevel(normalized);

        if (aiSpeakingRef.current && !bargeinConfirmedRef.current) {
          baselineAudioLevelRef.current = baselineAudioLevelRef.current * 0.95 + normalized * 0.05;
        }

        animFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      isStartingRef.current = false;
    } catch (err: any) {
      console.error('[ChatVoice] Failed to start:', err);
      isStartingRef.current = false;
      if (mountedRef.current) {
        setStatus('error');
        toast({
          title: t('chatbot.voice.couldNotStart'),
          description: err.message || 'Please try again',
          variant: 'destructive',
        });
      }
    }
  };

  const handleRetry = () => {
    restartAttemptsRef.current = 0;
    restartReasonRef.current = 'manual_retry';
    cleanup();
    startVoice();
  };

  const handleMuteToggle = () => {
    setIsMuted(prev => {
      isMutedRef.current = !prev;
      return !prev;
    });
  };

  const handleEnd = () => {
    // Flush any buffered transcript that hasn't been committed via onTurnComplete yet
    // (e.g. user hangs up mid-sentence before Gemini sends turnComplete).
    // Only push if no committed turn key matches this partial — otherwise we
    // would double-persist a turn that persistTurn already wrote.
    if (customerTranscriptBufferRef.current) {
      const custText = customerTranscriptBufferRef.current.trim();
      if (custText) {
        // Heuristic safety: if any committed key exists with similar tail
        // content, skip. Otherwise push for the safety-net path.
        const alreadyCommitted = Array.from(committedTurnKeysRef.current).length > 0
          && transcriptLogRef.current.some(e => e.role === 'customer' && e.text === custText);
        if (!alreadyCommitted) {
          transcriptLogRef.current.push({
            role: 'customer',
            text: custText,
            timestamp: new Date().toISOString(),
          });
        }
      }
      customerTranscriptBufferRef.current = '';
    }

    // Deduplicate consecutive same-role entries before persisting
    const deduped: VoiceTranscriptEntry[] = [];
    for (const entry of transcriptLogRef.current) {
      const last = deduped[deduped.length - 1];
      if (last && last.role === entry.role && last.text === entry.text) continue;
      deduped.push(entry);
    }

    if (onVoiceSessionEnd && deduped.length > 0) {
      onVoiceSessionEnd(deduped);
    }
    cleanup();
    onEnd();
  };

  return (
    <div className="p-4 border-t border-border bg-background space-y-3">
      {diagEnabled && (
        <div className="flex items-center justify-center">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-muted text-muted-foreground border border-border">
            DIAG · {diagSessionIdShort || '--------'}
          </span>
        </div>
      )}
      {/* Status */}
      <div className="flex items-center justify-center gap-2 text-sm">
        {status === 'connecting' && (
          <>
            <div className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-muted-foreground">
              {t('chatbot.voice.connecting')}
            </span>
          </>
        )}
        {status === 'reconnecting' && (
          <>
            <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />
            <span className="text-yellow-600 font-medium">
              {t('chatbot.voice.reconnecting')}
            </span>
          </>
        )}
        {status === 'active' && (
          <>
            <Volume2 className={cn("h-4 w-4 text-orange-500", aiSpeaking && "animate-pulse")} />
            <span className="text-foreground font-medium">
              {t('chatbot.voice.voiceModeActive')}
            </span>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="h-2 w-2 rounded-full bg-destructive" />
            <span className="text-destructive text-center">
              {retryAfterMsg || t('chatbot.voice.connectionError')}
            </span>
          </>
        )}
      </div>

      {/* Audio Level Meter */}
      {(status === 'active' || status === 'reconnecting') && (
        <div className="flex justify-center gap-[3px] h-8 items-end">
          {Array.from({ length: 20 }).map((_, i) => {
            const barHeight = status === 'reconnecting' ? 4 : Math.max(4, Math.min(32, audioLevel * 32 * (1 + Math.sin(i * 0.8 + Date.now() / 200) * 0.3)));
            return (
              <div
                key={i}
                className={cn(
                  "w-1 rounded-full transition-all duration-75",
                  isMuted || status === 'reconnecting' ? "bg-muted" : "bg-orange-400"
                )}
                style={{ height: isMuted || status === 'reconnecting' ? 4 : `${barHeight}px` }}
              />
            );
          })}
        </div>
      )}

      {/* Volume Slider */}
      {(status === 'active' || status === 'reconnecting') && (
        <div className="flex items-center justify-center gap-2 px-4">
          <VolumeX className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <input
            type="range"
            min={0.5}
            max={2.5}
            step={0.05}
            value={volume}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setVolume(val);
              queueRef.current?.setVolume(val);
            }}
            className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
            style={{ maxWidth: 140 }}
          />
          <Volume2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleMuteToggle}
          disabled={status !== 'active'}
          className={cn(
            "gap-1.5",
            isMuted && "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
          )}
        >
          {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          {isMuted
            ? t('chatbot.voice.muted')
            : t('chatbot.voice.mic')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowLiveTranscript(v => !v)}
          className="gap-1.5"
          title={showLiveTranscript ? 'Hide live transcript' : 'Show live transcript'}
          aria-label={showLiveTranscript ? 'Hide live transcript' : 'Show live transcript'}
        >
          {showLiveTranscript ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </Button>
        {status === 'error' && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            className="gap-1.5"
          >
            <RefreshCw className="h-4 w-4" />
            {t('chatbot.voice.retry')}
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleEnd}
          className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <PhoneOff className="h-4 w-4" />
          {t('chatbot.voice.endVoice')}
        </Button>
      </div>
    </div>
  );
}
