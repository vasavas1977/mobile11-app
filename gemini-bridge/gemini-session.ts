/**
 * Gemini Live Session
 * Manages a single per-call WebSocket connection to Gemini BidiGenerateContent.
 * Bridges bidirectional audio between Jambonz (L16 PCM) and Gemini (PCM base64).
 */

import { config } from "./config.ts";
import { logStage } from "./supabase-logger.ts";
// +emergency-recovery: remote-config dependency removed (Option B). Voice and
// flags resolve from config.ts (env or source default) only.

// Phase 0 diagnostic: bounded queue + async flusher. Read once at boot;
// toggling requires bridge restart (documented in README).
const DIAG_ENABLED = Deno.env.get("VOICE_DIAG") === "1";
const DIAG_SECRET = Deno.env.get("VOICE_DIAG_SECRET") ?? "";
const DIAG_ENDPOINT = config.supabaseUrl
  ? `${config.supabaseUrl.replace(/\/+$/, "")}/functions/v1/voice-diag`
  : "";
const DIAG_QUEUE_CAP = 200;
const DIAG_FLUSH_MS = 10_000;

type DiagEvent = Record<string, unknown>;
const diagQueue: DiagEvent[] = [];
let diagDropped = 0;

function diagPush(event: DiagEvent): void {
  if (!DIAG_ENABLED || !DIAG_SECRET || !DIAG_ENDPOINT) return;
  if (diagQueue.length >= DIAG_QUEUE_CAP) {
    diagQueue.shift();
    diagDropped++;
  }
  diagQueue.push(event);
}

async function diagFlush(): Promise<void> {
  if (diagQueue.length === 0) return;
  const batch = diagQueue.splice(0, diagQueue.length);
  try {
    await fetch(DIAG_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Diag-Secret": DIAG_SECRET },
      body: JSON.stringify(batch),
    });
  } catch {
    // discard on failure — no retry
  }
}

if (DIAG_ENABLED && DIAG_SECRET && DIAG_ENDPOINT) {
  setInterval(() => { diagFlush(); }, DIAG_FLUSH_MS);
  console.log("[GeminiSession] VOICE_DIAG enabled (bridge)");
}

function diagUuid(): string {
  return (crypto as any).randomUUID
    ? (crypto as any).randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function diagEmitFromBridge(opts: {
  liveSessionId: string;
  conversationId?: string | null;
  turnId: number;
  conversationTurnCount: number;
  refreshTrigger?: "none" | "turn_count" | "timer" | "reconnect";
  refreshedThisTurn?: boolean;
  vadCommitToFirstAudioMs?: number | null;
  extra?: Record<string, unknown>;
}): void {
  if (!DIAG_ENABLED) return;
  diagPush({
    client_event_id: diagUuid(),
    live_session_id: opts.liveSessionId,
    conversation_id: opts.conversationId ?? null,
    turn_id: opts.turnId,
    conversation_turn_count: opts.conversationTurnCount,
    refresh_trigger: opts.refreshTrigger ?? "none",
    refreshed_this_turn: !!opts.refreshedThisTurn,
    server_prompt_had_history: false,
    vad_commit_to_first_audio_ms: opts.vadCommitToFirstAudioMs ?? null,
    name_adoption_state: "unknown",
    channel: "pstn",
    ts_client: Date.now(),
    extra: { ...(opts.extra ?? {}), diagDropped },
  });
}

function bufferToBase64(buffer: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToText(data: Uint8Array): string {
  return new TextDecoder().decode(data);
}

/**
 * Resample L16 PCM from 24kHz to 16kHz using linear interpolation.
 * Gemini outputs 24kHz; Jambonz expects 16kHz.
 */
function resample24kTo16k(input: Uint8Array): Uint8Array {
  // Input is raw bytes of signed 16-bit LE samples at 24kHz
  const inputSamples = new Int16Array(input.buffer, input.byteOffset, input.byteLength / 2);
  const ratio = 24000 / 16000; // 1.5
  const outputLength = Math.floor(inputSamples.length / ratio);
  const outputSamples = new Int16Array(outputLength);

  for (let i = 0; i < outputLength; i++) {
    const srcIndex = i * ratio;
    const srcFloor = Math.floor(srcIndex);
    const frac = srcIndex - srcFloor;

    if (srcFloor + 1 < inputSamples.length) {
      outputSamples[i] = Math.round(
        inputSamples[srcFloor] * (1 - frac) + inputSamples[srcFloor + 1] * frac
      );
    } else {
      outputSamples[i] = inputSamples[srcFloor];
    }
  }

  return new Uint8Array(outputSamples.buffer);
}

async function wsDataToText(data: unknown): Promise<string | null> {
  if (typeof data === "string") return data;

  if (data instanceof Blob) {
    const ab = await data.arrayBuffer();
    return uint8ArrayToText(new Uint8Array(ab));
  }

  if (data instanceof ArrayBuffer) {
    return uint8ArrayToText(new Uint8Array(data));
  }

  if (data instanceof Uint8Array) {
    return uint8ArrayToText(data);
  }

  return null;
}

export type GeminiSessionCallbacks = {
  cid?: string;
  getElapsedMs?: () => number;
  getMsSinceFlush?: () => number;
  onAudio: (pcmBinary: Uint8Array) => void;
  onTranscript: (text: string) => void;
  onInterrupted: (partialModelText: string) => void;
  onTurnComplete: () => void;
  onError: (error: string) => void;
  onReady: () => void;
  onClose: (code?: number, reason?: string, lastEventType?: string, audioReceived?: boolean) => void;
  // +logs-3: fired ONCE on the first audio chunk of any model turn.
  // server.ts uses this as the primary "cancel inbound suppression" signal.
  onFirstModelAudio?: () => void;
  // +voice-native-sms-rating: fired with the FULL finalized text after a turn ends.
  onUserTurnComplete?: (text: string) => void;
  onModelTurnComplete?: (text: string) => void;
  // +emergency-recovery: post-ready Gemini diagnostics (telemetry-only).
  onGeminiFirstServerEvent?: (eventType: string) => void;
  onModelTextOnly?: (textLen: number) => void;
  onGeminiMalformedEvent?: (errMsg: string, rawSample: string) => void;
  // ── plan v3: redacted shape-only finish-reason dump ──
  // Fired on every serverContent frame that signals end-of-turn or finish.
  // Payload is keys + types only — never includes transcript/model text.
  onFinishReasonWireDump?: (payload: Record<string, unknown>) => void;
};

export class GeminiSession {
  private ws: WebSocket | null = null;
  private callbacks: GeminiSessionCallbacks;
  private isSetupComplete = false;
  private systemInstruction: string;
  private keepaliveTimer: ReturnType<typeof setInterval> | null = null;
  private fullTranscript = "";
  private receivedFirstMessage = false;
  private setupCompleteAt = 0;
  private cid: string;

  // Phase 0 diag identity
  private diagLiveSessionId: string = (crypto as any).randomUUID
    ? (crypto as any).randomUUID()
    : `s_${Date.now()}`;
  private diagTurnId = 0;
  private diagConversationTurnCount = 0;
  diagConversationId: string | null = null;
  // +logs-3: per-turn first-audio flag. Resets on turn_complete / interrupted.
  private firstAudioFiredThisTurn = false;
  // +voice-native: per-turn finalized-text buffers
  private modelTurnBuffer = "";
  private userTurnBuffer = "";
  // +emergency-recovery: post-ready diagnostic state
  private firstServerEventFired = false;
  lastEventType: string = "none";
  private audioReceived = false;
  private modelTextOnlyFiredThisTurn = false;
  // +gemini-3.1-setup-fix: payload shape marker emitted on session start so the
  // monitor can attribute behaviour to the setup contract.
  lastSetupPayloadShape: string = "unknown";
  // +pr2-ctxcompress-telemetry: most recent totalTokenCount from Gemini's
  // usageMetadata frames. server.ts reads this when emitting model_reply_latency
  // so the latency row is attributable to actual context size. null when
  // Gemini has not surfaced usageMetadata on this session yet.
  lastTotalTokenCount: number | null = null;

  constructor(systemInstruction: string, callbacks: GeminiSessionCallbacks) {
    this.systemInstruction = systemInstruction;
    this.callbacks = callbacks;
    this.cid = callbacks.cid ?? "n/a";
  }

  /** Returns current Gemini WebSocket state as a readable string. */
  geminiWsState(): string {
    if (!this.ws) return "null";
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return "connecting";
      case WebSocket.OPEN: return "open";
      case WebSocket.CLOSING: return "closing";
      case WebSocket.CLOSED: return "closed";
      default: return `unknown(${this.ws.readyState})`;
    }
  }

  private logGeminiEvent(type: string, extra = ""): void {
    const sinceFlush = this.callbacks.getMsSinceFlush?.() ?? -1;
    const sinceSetup = this.setupCompleteAt === 0 ? -1 : Date.now() - this.setupCompleteAt;
    console.log(
      `[gemini_event] cid=${this.cid} type=${type} elapsed_since_flush_ms=${sinceFlush} elapsed_since_setup_ms=${sinceSetup}${extra ? " " + extra : ""}`,
    );
  }

  async connect(): Promise<void> {
    const wsUrl = `${config.geminiWsBase}?key=${config.googleApiKey}`;
    console.log(
      `[GeminiSession] Connecting to ${config.geminiWsBase} model=${config.geminiModel}`,
    );

    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error("[GeminiSession] Connection timed out after 15s");
        this.close();
        reject(new Error("Gemini connection timed out"));
      }, 15000);

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("[GeminiSession] WebSocket opened, sending setup...");
        // +gemini-3.1-setup-fix: read voice from config (env or source default).
        const _voice = config.voiceName;

        // +gemini-3.1-setup-fix: Setup payload contract for
        // models/gemini-3.1-flash-live-preview (Live API v1beta).
        //
        // VAD: keep the explicit automaticActivityDetection block with the
        // Thai-tuned values (prefixPaddingMs=200, silenceDurationMs=1000) that
        // were previously documented in mem://contact-center/voice-bot-bridge-specifications.
        // The 3.1 default is `disabled: false`; we set it explicitly so intent
        // is unambiguous and the values match prior production tuning.
        //
        // Greeting: NOT sent here. Per Google's Live API docs, on
        // gemini-3.1-flash-live-preview, `clientContent` is only valid for
        // seeding initial history (and only if `initial_history_in_client_content`
        // is set). Post-setup text turns must use `realtimeInput.text`.
        // See sendInitialGreeting() below.
        //
        // +pr2-ctxcompress-telemetry: enable native context window compression.
        // Field is a top-level setup sibling of `model`/`generationConfig`,
        // verified against Vertex BidiGenerateContentSetup reference
        // (https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/multimodal-live)
        // and Gemini Live session-management docs
        // (https://ai.google.dev/gemini-api/docs/live-session). camelCase
        // matches our existing `generationConfig` convention on this v1beta WS
        // endpoint. We pass `slidingWindow: {}` to use server-side defaults
        // rather than guess specific triggerTokens/targetTokens — Google's own
        // examples ship the empty form. Documented bounds (only consulted if
        // we later need explicit values): triggerTokens 5,000–128,000;
        // targetTokens 0–128,000.
        //
        // UX TRADE-OFF: when compression fires, the server prunes the oldest
        // turns from context. The bot may forget facts established very early
        // in a long call. This is the documented mechanism, not a bug —
        // verification call must explicitly probe a turn-1 fact at turn ≥8.
        const setupMessage = {
          setup: {
            model: config.geminiModel,
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: _voice,
                  },
                },
              },
              maxOutputTokens: 300,
            },
            systemInstruction: {
              parts: [{ text: this.systemInstruction }],
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            realtimeInputConfig: config.vadDriveTurnEnd
              ? {
                  // PR 5 drive mode: bridge owns turn boundaries. We disable
                  // Gemini's automatic VAD entirely and will signal turns via
                  // realtimeInput.activityStart / activityEnd from server.ts.
                  // prefixPaddingMs / silenceDurationMs are meaningless when
                  // disabled, so we omit them to make intent unambiguous.
                  automaticActivityDetection: { disabled: true },
                }
              : {
                  automaticActivityDetection: {
                    disabled: false,
                    prefixPaddingMs: 200,
                    silenceDurationMs: 1000,
                  },
                },
            contextWindowCompression: {
              slidingWindow: {},
            },
          },
        };

        this.lastSetupPayloadShape = config.vadDriveTurnEnd
          ? "v3.1.greeting=realtimeInput.text+vad=manual-drive+ctxcompress=sliding-default"
          : "v3.1.greeting=realtimeInput.text+vad=auto-server+ctxcompress=sliding-default";
        this.ws?.send(JSON.stringify(setupMessage));
        console.log(`[GeminiSession] Setup message sent shape=${this.lastSetupPayloadShape}`);

        // +pr2-native-ctx-compression: one-shot proof that we sent the
        // contextWindowCompression field in the setup payload. The bridge
        // cannot observe Google's internal compression — this row only proves
        // the config was sent. Indirect signal that compression is working
        // remains model_reply_latency (and total_token_count when available).
        try {
          logStage(
            { cid: this.cid },
            "context_compression_configured",
            undefined,
            {
              strategy: "slidingWindow",
              trigger_tokens: null,
              target_tokens: null,
              sent_in_setup: true,
            },
          );
        } catch (err) {
          console.warn(`[GeminiSession] context_compression_configured log failed: ${err}`);
        }
      };

      this.ws.onmessage = async (event: MessageEvent) => {
        if (!this.receivedFirstMessage) {
          this.receivedFirstMessage = true;

          let preview = "(unknown)";
          if (typeof event.data === "string") {
            preview = event.data.substring(0, 200);
          } else if (event.data instanceof Blob) {
            preview = `(blob size=${event.data.size})`;
          } else if (event.data instanceof ArrayBuffer) {
            preview = `(arraybuffer bytes=${event.data.byteLength})`;
          } else if (event.data instanceof Uint8Array) {
            preview = `(uint8array bytes=${event.data.byteLength})`;
          } else {
            preview = `(${typeof event.data})`;
          }

          console.log(`[GeminiSession] First message received: ${preview}`);
        }

        await this.handleMessage(event, () => {
          clearTimeout(timeout);
          this.startKeepalive();
          resolve();
        });
      };

      this.ws.onerror = (err) => {
        clearTimeout(timeout);
        console.error("[GeminiSession] WebSocket error:", err);
        console.log(`[gemini_ws] cid=${this.cid} state=error close_code=null reason=ws_error elapsed_ms_since_setup=${this.setupCompleteAt === 0 ? -1 : Date.now() - this.setupCompleteAt}`);
        this.callbacks.onError("Gemini WebSocket error");
        reject(new Error("Gemini WebSocket error"));
      };

      this.ws.onclose = (event: CloseEvent) => {
        clearTimeout(timeout);
        this.stopKeepalive();
        const sinceSetup = this.setupCompleteAt === 0 ? -1 : Date.now() - this.setupCompleteAt;
        console.log(
          `[GeminiSession] Closed: code=${event.code} reason="${event.reason}" wasClean=${event.wasClean} setupComplete=${this.isSetupComplete} model=${config.geminiModel}`,
        );
        console.log(
          `[gemini_ws] cid=${this.cid} state=closed close_code=${event.code} reason="${event.reason}" wasClean=${event.wasClean} elapsed_ms_since_setup=${sinceSetup}`,
        );

        if (!this.isSetupComplete) {
          reject(
            new Error(
              `Gemini closed before setup complete: ${event.code} ${event.reason}`,
            ),
          );
        }

        this.callbacks.onClose(
          typeof event.code === "number" ? event.code : undefined,
          event.reason,
          this.lastEventType,
          this.audioReceived,
        );
      };
    });
  }

  private async handleMessage(
    event: MessageEvent,
    onSetupResolve?: () => void,
  ): Promise<void> {
    try {
      const text = await wsDataToText(event.data);

      if (!text) {
        console.warn("[GeminiSession] Unsupported WS message type");
        return;
      }

      let msg: any;
      try {
        msg = JSON.parse(text);
      } catch (parseErr) {
        const sample = text.substring(0, 200);
        console.warn(`[GeminiSession] Non-JSON message received: ${sample}`);
        try {
          this.callbacks.onGeminiMalformedEvent?.(
            (parseErr as Error)?.message ?? "parse_error",
            sample,
          );
        } catch { /* fail-open */ }
        return;
      }

      // +emergency-recovery: classify the event type and fire first-event hook once.
      const eventType =
        msg.setupComplete ? "setupComplete" :
        msg.sessionUpdate ? "sessionUpdate" :
        msg.serverContent?.interrupted ? "interrupted" :
        msg.serverContent?.turnComplete ? "turnComplete" :
        msg.serverContent?.modelTurn ? "modelTurn" :
        msg.serverContent?.inputTranscription ? "inputTranscription" :
        msg.serverContent?.transcription ? "transcription" :
        msg.serverContent ? "serverContent" :
        msg.toolCall ? "toolCall" :
        "unknown";
      this.lastEventType = eventType;
      if (!this.firstServerEventFired) {
        this.firstServerEventFired = true;
        try { this.callbacks.onGeminiFirstServerEvent?.(eventType); } catch { /* fail-open */ }
      }

      if (msg.setupComplete || msg.sessionUpdate || msg.serverContent !== undefined) {
        if (!this.isSetupComplete) {
          this.isSetupComplete = true;
          this.setupCompleteAt = Date.now();
          console.log("[GeminiSession] Setup complete");
          console.log(`[gemini_ws] cid=${this.cid} state=open close_code=null reason=setup_complete elapsed_ms_since_setup=0`);
          this.callbacks.onReady();
          onSetupResolve?.();

          if (!msg.serverContent) return;
        }
      }

      // +pr2-ctxcompress-telemetry: capture totalTokenCount whenever Gemini
      // surfaces it. Field appears on serverContent and standalone
      // usageMetadata frames; we accept either. Stays null until first
      // observed — server.ts logs null explicitly rather than inferring.
      const um = msg.usageMetadata ?? msg.serverContent?.usageMetadata;
      if (um && typeof um.totalTokenCount === "number") {
        this.lastTotalTokenCount = um.totalTokenCount;
      }

      if (msg.serverContent) {
        const content = msg.serverContent;

        // ── plan v3: redacted shape-only finish dump ──
        // Fires on interrupted/turnComplete/generationComplete frames so we
        // can diagnose finish reasons without ever logging transcript text.
        const sc = content as Record<string, unknown>;
        const hasInterrupted = Boolean(sc.interrupted);
        const hasTurnComplete = Boolean(sc.turnComplete);
        const hasGenerationComplete = Boolean(
          (sc as { generationComplete?: unknown }).generationComplete,
        );
        if (hasInterrupted || hasTurnComplete || hasGenerationComplete) {
          try {
            const candidates = (sc as { candidates?: Array<Record<string, unknown>> }).candidates;
            const finishReason =
              candidates && candidates.length > 0
                ? (candidates[0] as { finishReason?: unknown }).finishReason ?? null
                : null;
            this.callbacks.onFinishReasonWireDump?.({
              event_keys: Object.keys(msg as Record<string, unknown>),
              server_content_keys: Object.keys(sc),
              has_interrupted: hasInterrupted,
              has_turn_complete: hasTurnComplete,
              has_generation_complete: hasGenerationComplete,
              has_model_turn: Boolean(sc.modelTurn),
              has_candidates: Array.isArray(candidates),
              candidate_count: Array.isArray(candidates) ? candidates.length : 0,
              finish_reason: finishReason,
              has_input_transcription: Boolean(sc.inputTranscription),
              has_output_transcription: Boolean(
                (sc as { outputTranscription?: unknown }).outputTranscription,
              ),
            });
          } catch { /* fail-open */ }
        }

        const userTxt =
          content.inputTranscription?.text ??
          content.transcription?.text ??
          null;
        if (typeof userTxt === "string" && userTxt.length > 0) {
          this.userTurnBuffer += (this.userTurnBuffer ? " " : "") + userTxt;
        }

        if (content.interrupted) {
          this.logGeminiEvent("interrupted");
          this.firstAudioFiredThisTurn = false;
          this.modelTextOnlyFiredThisTurn = false;
          if (this.userTurnBuffer) {
            try { this.callbacks.onUserTurnComplete?.(this.userTurnBuffer); } catch { /* noop */ }
            this.userTurnBuffer = "";
          }
          const partialModelText = this.modelTurnBuffer;
          this.modelTurnBuffer = "";
          this.callbacks.onInterrupted(partialModelText);
          return;
        }

        if (content.turnComplete) {
          this.logGeminiEvent("turn_complete");
          this.diagTurnId += 1;
          this.diagConversationTurnCount += 1;
          diagEmitFromBridge({
            liveSessionId: this.diagLiveSessionId,
            conversationId: this.diagConversationId,
            turnId: this.diagTurnId,
            conversationTurnCount: this.diagConversationTurnCount,
            refreshTrigger: "none",
            refreshedThisTurn: false,
          });
          // +emergency-recovery: if turn ended with text but never produced audio,
          // surface that explicitly.
          if (
            !this.firstAudioFiredThisTurn &&
            this.modelTurnBuffer &&
            !this.modelTextOnlyFiredThisTurn
          ) {
            this.modelTextOnlyFiredThisTurn = true;
            try {
              this.callbacks.onModelTextOnly?.(this.modelTurnBuffer.length);
            } catch { /* fail-open */ }
          }
          this.firstAudioFiredThisTurn = false;
          this.modelTextOnlyFiredThisTurn = false;
          if (this.userTurnBuffer) {
            try { this.callbacks.onUserTurnComplete?.(this.userTurnBuffer); } catch { /* noop */ }
            this.userTurnBuffer = "";
          }
          if (this.modelTurnBuffer) {
            try { this.callbacks.onModelTurnComplete?.(this.modelTurnBuffer); } catch { /* noop */ }
            this.modelTurnBuffer = "";
          }
          this.callbacks.onTurnComplete();
          return;
        }

        if (content.modelTurn?.parts) {
          for (const part of content.modelTurn.parts) {
            if (part.inlineData?.data) {
              const pcm24k = base64ToBuffer(part.inlineData.data);
              const pcm16k = resample24kTo16k(pcm24k);
              this.audioReceived = true;
              this.logGeminiEvent("audio", `bytes=${pcm16k.length}`);
              if (!this.firstAudioFiredThisTurn) {
                this.firstAudioFiredThisTurn = true;
                try { this.callbacks.onFirstModelAudio?.(); } catch { /* never throw on hot path */ }
              }
              this.callbacks.onAudio(pcm16k);
            }

            if (part.text) {
              this.fullTranscript += `${part.text} `;
              this.modelTurnBuffer += (this.modelTurnBuffer ? " " : "") + part.text;
              this.logGeminiEvent("transcript", `chars=${part.text.length}`);
              this.callbacks.onTranscript(part.text);
            }
          }
        }
      }
    } catch (err) {
      console.warn("[GeminiSession] Failed to parse message:", err);
    }
  }

  sendAudio(pcmBinary: Uint8Array): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.isSetupComplete) {
      return;
    }

    const b64 = bufferToBase64(pcmBinary);

    try {
      this.ws.send(
        JSON.stringify({
          realtimeInput: {
            audio: {
              data: b64,
              mimeType: "audio/pcm;rate=16000",
            },
          },
        }),
      );
    } catch (err) {
      console.warn("[GeminiSession] sendAudio error:", err);
    }
  }

  /**
   * PR 5 drive mode: signal start of a user turn. Only meaningful when the
   * session was set up with VAD_DRIVE_TURN_END=1 (auto VAD disabled).
   * server.ts gates the call on config.vadDriveTurnEnd.
   * Returns true if the message was sent.
   */
  sendActivityStart(): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.isSetupComplete) {
      return false;
    }
    try {
      this.ws.send(JSON.stringify({ realtimeInput: { activityStart: {} } }));
      return true;
    } catch (err) {
      console.warn("[GeminiSession] sendActivityStart error:", err);
      return false;
    }
  }

  /**
   * PR 5 drive mode: signal end of a user turn.
   */
  sendActivityEnd(): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.isSetupComplete) {
      return false;
    }
    try {
      this.ws.send(JSON.stringify({ realtimeInput: { activityEnd: {} } }));
      return true;
    } catch (err) {
      console.warn("[GeminiSession] sendActivityEnd error:", err);
      return false;
    }
  }

  /**
   * +gemini-3.1-setup-fix: fire a one-shot synthetic prompt that asks Gemini
   * to greet first.
   *
   * IMPORTANT: On models/gemini-3.1-flash-live-preview, `clientContent` is
   * only valid for seeding initial history (and only when the session was set
   * up with `initial_history_in_client_content`). Sending a `clientContent`
   * turn after `setupComplete` returns WS close 1008 with reason
   * "Operation is not implemented, or supported, or enabled."
   *
   * The 3.1 contract requires `realtimeInput.text` for post-setup text turns.
   * Source: https://ai.google.dev/gemini-api/docs/live-guide
   */
  sendInitialGreeting(promptText: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.isSetupComplete) {
      console.warn("[GeminiSession] sendInitialGreeting: not ready, skipping");
      return;
    }
    try {
      this.ws.send(JSON.stringify({
        realtimeInput: {
          text: promptText,
        },
      }));
      console.log(`[GeminiSession] greeting prompt sent via realtimeInput.text (chars=${promptText.length})`);
    } catch (err) {
      console.warn("[GeminiSession] sendInitialGreeting error:", err);
    }
  }

  getTranscript(): string {
    return this.fullTranscript.trim();
  }

  /**
   * Snapshot the current per-turn buffers WITHOUT clearing them. Used by
   * server.ts on call cleanup to flush any in-progress turn into
   * conversation_messages with `was_call_ended: true`.
   */
  peekTurnBuffers(): { user: string; model: string } {
    return { user: this.userTurnBuffer, model: this.modelTurnBuffer };
  }

  private startKeepalive(): void {
    this.stopKeepalive();

    this.keepaliveTimer = setInterval(() => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.isSetupComplete) {
        return;
      }

      try {
        this.ws.send(
          JSON.stringify({
            realtimeInput: {
              audio: {
                data: "",
                mimeType: "audio/pcm;rate=16000",
              },
            },
          }),
        );
      } catch {
        // ignore
      }
    }, 25000);
  }

  private stopKeepalive(): void {
    if (this.keepaliveTimer) {
      clearInterval(this.keepaliveTimer);
      this.keepaliveTimer = null;
    }
  }

  close(): void {
    this.stopKeepalive();

    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;

      try {
        this.ws.close();
      } catch {
        // ignore
      }

      this.ws = null;
    }

    this.isSetupComplete = false;
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN && this.isSetupComplete;
  }
}
