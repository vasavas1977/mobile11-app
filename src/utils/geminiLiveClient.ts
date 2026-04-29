/**
 * Browser WebSocket client for Gemini Live API.
 * Manages bidirectional audio streaming with real-time turn-taking.
 * Includes auto-reconnect with exponential backoff, keepalive pings,
 * backpressure handling, and session auto-refresh to prevent context
 * accumulation latency.
 */

import { correctTranscription } from "./voiceTranscriptCorrections";

export type GeminiAssistantPartType = "spoken" | "thought" | "text" | "tool";

export type GeminiAssistantMeta = {
  sessionId: string;
  turnId: string;
  partType: GeminiAssistantPartType;
};

export type GeminiDiagRefreshTrigger = "none" | "turn_count" | "timer" | "reconnect";

export type GeminiDiagEventInput = {
  liveSessionId: string;
  turnId: number;
  conversationTurnCount: number;
  refreshTrigger: GeminiDiagRefreshTrigger;
  refreshedThisTurn: boolean;
  vadCommitToFirstAudioMs: number | null;
  extra?: Record<string, unknown>;
};

export type GeminiLiveCallbacks = {
  onReady: () => void;
  onAudio: (pcm16Base64: string) => void;
  onTranscript: (text: string, isPartial: boolean) => void;
  onTurnComplete: () => void;
  onError: (error: string) => void;
  onClose: (code?: number, reason?: string) => void;
  onInterrupted: () => void;
  onReconnecting?: (attempt: number) => void;
  onReconnectFailed?: () => void;
  onSessionRefresh?: () => void;
  /** Native Gemini input transcription (customer speech) */
  onInputTranscript?: (text: string) => void;
  /**
   * Authoritative spoken-output channel — the words the bot actually speaks.
   * Sourced ONLY from outputAudioTranscription / part.outputAudioTranscription.
   * THIS is what should feed the customer-facing bubble.
   */
  onAssistantSpokenTranscript?: (text: string, meta: GeminiAssistantMeta) => void;
  /**
   * Non-spoken assistant text: thoughts, raw model text, etc.
   * For debug/observability only — must NOT feed customer UI.
   */
  onAssistantRawText?: (text: string, meta: GeminiAssistantMeta) => void;
  /** Tool / function-call events. Debug/observability only. */
  onAssistantToolEvent?: (event: unknown, meta: GeminiAssistantMeta) => void;
  /**
   * @deprecated Mixed channel — kept for transitional compatibility.
   * New code MUST use onAssistantSpokenTranscript. This now ONLY receives
   * the spoken-audio transcription (never raw model text or thoughts).
   */
  onOutputTranscript?: (text: string) => void;
  /** Phase 0 diagnostic hook. When absent, no diag work happens (zero CPU). */
  onDiagEvent?: (event: GeminiDiagEventInput) => void;
};

const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_BASE_MS = 300;     // First retry after 300ms
const RECONNECT_MAX_MS = 3000;     // Cap at 3s
const KEEPALIVE_INTERVAL_MS = 25000;
const MAX_BUFFERED_AMOUNT = 65536; // 64KB backpressure threshold
const SESSION_REFRESH_MS = 3 * 60 * 1000; // 3 minutes — prevent context buildup
const MAX_TURNS_BEFORE_REFRESH = 4; // Refresh early to avoid latency degradation

export class GeminiLiveClient {
  private ws: WebSocket | null = null;
  private callbacks: GeminiLiveCallbacks;
  private isSetupComplete = false;
  private keepaliveTimer: ReturnType<typeof setInterval> | null = null;
  private sessionRefreshTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private turnCount = 0;
  private wsUrl: string | null = null;
  private setupMessage: any = null;
  private intentionalClose = false;
  private pendingConnectReject: ((reason?: unknown) => void) | null = null;
  private pendingSetupTimeout: ReturnType<typeof setTimeout> | null = null;
  private isModelTurnActive = false;
  private pendingRefresh = false;
  private _wasInterrupted = false;
  /**
   * Translation source priority (one-directional rule):
   * - modelTurn.parts[].text is AUTHORITATIVE for translated output.
   *   Once it arrives in a turn, outputAudioTranscription is suppressed.
   * - outputAudioTranscription is interim-only: it fills the gap before
   *   model text arrives but is replaced (not appended) when model text lands.
   * - turnHasModelText: set true when modelTurn text arrives; reset on turnComplete/interrupted.
   * - turnHasOutputTranscription: legacy flag kept for compat, also reset per turn.
   */
  private turnHasModelText = false;
  private turnHasOutputTranscription = false;

  // Session + turn identity for channel routing and stale-event filtering
  private activeSessionId: string = (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : `s_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  private currentTurnId: string = (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : `t_${Date.now()}`;
  private turnInProgress = false;

  // Phase 0 diagnostic state.
  // - liveSessionId: regenerated on every (re)connect / refresh — the field
  //   used to detect "context wipes" caused by client-side refresh.
  // - conversationTurnCount: monotonic across the entire conversation, never
  //   reset by refreshes. Used to map screenshot's "4–5 turn reset".
  // - vadCommitTs: marks the moment user audio commits (turn ends client-side)
  //   so we can measure VAD-commit → first-audio-out latency.
  // - lastRefreshTrigger / refreshedThisTurn: tagged when a refresh is
  //   triggered, consumed and reset on the next turnComplete diag emit.
  private liveSessionId: string = "";
  private conversationTurnCount = 0;
  private vadCommitTs: number | null = null;
  private firstAudioOutTs: number | null = null;
  private lastRefreshTrigger: GeminiDiagRefreshTrigger = "none";
  private refreshedThisTurn = false;

  private newTurnId(): string {
    this.currentTurnId = (typeof crypto !== "undefined" && crypto.randomUUID)
      ? crypto.randomUUID()
      : `t_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    return this.currentTurnId;
  }

  private newSessionId(): string {
    this.activeSessionId = (typeof crypto !== "undefined" && crypto.randomUUID)
      ? crypto.randomUUID()
      : `s_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    this.liveSessionId = this.activeSessionId;
    return this.activeSessionId;
  }

  /** Public read of the current diagnostic live session id (UI badge). */
  get diagLiveSessionId(): string {
    return this.liveSessionId;
  }

  constructor(callbacks: GeminiLiveCallbacks) {
    this.callbacks = callbacks;
    // Make sure liveSessionId is initialized even before first connect.
    this.liveSessionId = this.activeSessionId;
  }

  private emitDiag(opts: {
    refreshTrigger: GeminiDiagRefreshTrigger;
    refreshedThisTurn: boolean;
    extra?: Record<string, unknown>;
  }) {
    const cb = this.callbacks.onDiagEvent;
    if (!cb) return;
    let vadMs: number | null = null;
    if (this.vadCommitTs != null && this.firstAudioOutTs != null) {
      vadMs = Math.max(0, Math.round(this.firstAudioOutTs - this.vadCommitTs));
    }
    try {
      cb({
        liveSessionId: this.liveSessionId,
        turnId: this.turnCount,
        conversationTurnCount: this.conversationTurnCount,
        refreshTrigger: opts.refreshTrigger,
        refreshedThisTurn: opts.refreshedThisTurn,
        vadCommitToFirstAudioMs: vadMs,
        extra: opts.extra,
      });
    } catch {
      // never let diag throw
    }
  }

  /** Called by the host (ChatVoiceMode) when the user finishes speaking. */
  markVadCommit(): void {
    if (!this.callbacks.onDiagEvent) return;
    this.vadCommitTs = (typeof performance !== "undefined" ? performance.now() : Date.now());
    this.firstAudioOutTs = null;
  }

  /** Whether the last model turn was interrupted by user barge-in */
  get wasInterrupted(): boolean {
    return this._wasInterrupted;
  }

  async connect(wsUrl: string, setupMessage: any): Promise<void> {
    this.wsUrl = wsUrl;
    this.setupMessage = setupMessage;
    this.intentionalClose = false;
    this.reconnectAttempts = 0;
    return this.doConnect(wsUrl, setupMessage);
  }

  private clearPendingConnect() {
    if (this.pendingSetupTimeout) {
      clearTimeout(this.pendingSetupTimeout);
      this.pendingSetupTimeout = null;
    }
    this.pendingConnectReject = null;
  }

  private doConnect(wsUrl: string, setupMessage: any): Promise<void> {
    // New WS = new logical session. Bumping the id invalidates any in-flight
    // events from a previously closed/swapped session before they reach the UI.
    this.newSessionId();
    this.turnInProgress = false;
    const SETUP_TIMEOUT_MS = 15000;
    this.clearPendingConnect();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.clearPendingConnect();
        this.cleanupWs();
        reject(new Error("Connection timed out – Gemini did not respond within 15 seconds. Please try again."));
      }, SETUP_TIMEOUT_MS);

      this.pendingSetupTimeout = timeout;
      this.pendingConnectReject = reject;

      try {
        this.ws = new WebSocket(wsUrl);
        this.ws.binaryType = "arraybuffer";

        this.ws.onopen = () => {
          try {
            this.ws!.send(JSON.stringify(setupMessage));
          } catch (err) {
            this.clearPendingConnect();
            this.callbacks.onError("Failed to send setup message");
            reject(new Error("Failed to send setup message"));
          }
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event, () => {
            this.clearPendingConnect();
            this.startKeepalive();
            this.startSessionRefreshTimer();
            this.turnCount = 0;
            resolve();
          });
        };

        this.ws.onerror = () => {
          this.clearPendingConnect();
          this.callbacks.onError("WebSocket connection error");
          reject(new Error("WebSocket error"));
        };

        this.ws.onclose = (event) => {
          this.clearPendingConnect();
          this.stopKeepalive();
          this.stopSessionRefreshTimer();

          console.log("[GeminiLive] Socket closed", {
            code: event.code,
            reason: event.reason || "no close reason",
            setupComplete: this.isSetupComplete,
            intentionalClose: this.intentionalClose,
          });

          if (event.code === 1008 && !this.isSetupComplete) {
            const errorMsg = `Model not supported for bidiGenerateContent (code 1008). This usually means the model name is invalid or your API key doesn't have access. Details: ${event.reason}`;
            this.callbacks.onError(errorMsg);
            this.callbacks.onClose(event.code, event.reason);
            reject(new Error(errorMsg));
            return;
          }

          if (!this.isSetupComplete) {
            const closeReason = event.reason || "no close reason";
            const errorMsg = `WebSocket closed during setup (code ${event.code}: ${closeReason})`;
            this.callbacks.onError(errorMsg);
            this.callbacks.onClose(event.code, event.reason);
            reject(new Error(errorMsg));
            return;
          }

          if (!this.intentionalClose) {
            console.log(`[GeminiLive] Unexpected close (code ${event.code}, reason: ${event.reason || 'none'}), attempting reconnect...`);
            this.lastRefreshTrigger = "reconnect";
            this.refreshedThisTurn = true;
            this.attemptReconnect();
            return;
          }

          this.callbacks.onClose(event.code, event.reason);
        };
      } catch (err) {
        this.clearPendingConnect();
        reject(err);
      }
    });
  }

  /** Exponential backoff: 300ms → 600ms → 1200ms → capped at 3s */
  private getReconnectDelay(): number {
    const delay = Math.min(RECONNECT_BASE_MS * Math.pow(2, this.reconnectAttempts - 1), RECONNECT_MAX_MS);
    // Add jitter (±20%) to prevent thundering herd
    return delay * (0.8 + Math.random() * 0.4);
  }

  private async attemptReconnect() {
    if (!this.wsUrl || !this.setupMessage || this.intentionalClose) return;

    this.reconnectAttempts++;
    if (this.reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
      console.warn("[GeminiLive] Max reconnect attempts reached");
      this.callbacks.onReconnectFailed?.();
      this.callbacks.onClose(1006, 'max_reconnect_attempts_exceeded');
      return;
    }

    const delay = this.getReconnectDelay();
    console.log(`[GeminiLive] Reconnecting attempt ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} (delay ${Math.round(delay)}ms)...`);
    this.callbacks.onReconnecting?.(this.reconnectAttempts);
    this.isSetupComplete = false;

    await new Promise(r => setTimeout(r, delay));

    if (this.intentionalClose) return;

    try {
      await this.doConnect(this.wsUrl!, this.setupMessage!);
      this.reconnectAttempts = 0;
      console.log("[GeminiLive] Reconnected successfully");
    } catch (err) {
      console.error("[GeminiLive] Reconnect failed:", err);
      this.attemptReconnect();
    }
  }

  /** Proactively refresh session to reset Gemini's accumulated context */
  private startSessionRefreshTimer() {
    this.stopSessionRefreshTimer();
    this.sessionRefreshTimer = setTimeout(() => {
      if (!this.wsUrl || !this.setupMessage || this.intentionalClose) return;
      if (this.isModelTurnActive) {
        console.log("[GeminiLive] Time-based refresh deferred — model turn active");
        this.pendingRefresh = true;
        return;
      }
      console.log("[GeminiLive] Session auto-refresh triggered (5 min limit)");
      this.lastRefreshTrigger = "timer";
      this.refreshedThisTurn = true;
      if (this.callbacks.onSessionRefresh) {
        this.callbacks.onSessionRefresh();
      } else {
        this.refreshSession();
      }
    }, SESSION_REFRESH_MS);
  }

  private stopSessionRefreshTimer() {
    if (this.sessionRefreshTimer) {
      clearTimeout(this.sessionRefreshTimer);
      this.sessionRefreshTimer = null;
    }
  }

  /** Clean disconnect + reconnect to reset Gemini context */
  async refreshSession(): Promise<void> {
    if (!this.wsUrl || !this.setupMessage || this.intentionalClose) return;

    this.stopKeepalive();
    this.stopSessionRefreshTimer();
    this.isSetupComplete = false;
    this.cleanupWs();

    this.callbacks.onReconnecting?.(0);

    try {
      await this.doConnect(this.wsUrl, this.setupMessage);
      console.log("[GeminiLive] Session refreshed successfully");
    } catch (err) {
      console.error("[GeminiLive] Session refresh failed:", err);
      this.callbacks.onReconnectFailed?.();
      this.callbacks.onClose(1006, 'session_refresh_failed');
    }
  }

  /** Disconnect old WS and connect with fresh credentials */
  async refreshWithNewSession(newWsUrl: string, newSetupMessage: any): Promise<void> {
    if (this.intentionalClose) return;

    this.stopKeepalive();
    this.stopSessionRefreshTimer();
    this.isSetupComplete = false;
    this.cleanupWs();

    this.wsUrl = newWsUrl;
    this.setupMessage = newSetupMessage;

    try {
      await this.doConnect(newWsUrl, newSetupMessage);
      this.reconnectAttempts = 0;
      console.log("[GeminiLive] Refreshed with new session credentials");
    } catch (err) {
      console.error("[GeminiLive] New session refresh failed:", err);
      this.callbacks.onReconnectFailed?.();
      this.callbacks.onClose(1006, 'new_session_refresh_failed');
    }
  }

  private startKeepalive() {
    this.stopKeepalive();
    this.keepaliveTimer = setInterval(() => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.isSetupComplete) return;
      try {
        this.ws.send(JSON.stringify({
          realtimeInput: {
            audio: {
              data: "",
              mimeType: "audio/pcm;rate=16000",
            },
          },
        }));
      } catch {
      }
    }, KEEPALIVE_INTERVAL_MS);
  }

  private stopKeepalive() {
    if (this.keepaliveTimer) {
      clearInterval(this.keepaliveTimer);
      this.keepaliveTimer = null;
    }
  }

  private handleMessage(event: MessageEvent, onSetupResolve?: (value: void) => void) {
    try {
      let msg: any;

      if (typeof event.data === "string") {
        msg = JSON.parse(event.data);
      } else if (event.data instanceof ArrayBuffer) {
        const text = new TextDecoder().decode(event.data);
        try {
          msg = JSON.parse(text);
        } catch {
          return;
        }
      } else {
        return;
      }

      if (msg.setupComplete || msg.sessionUpdate || msg.serverContent !== undefined) {
        if (!this.isSetupComplete) {
          this.isSetupComplete = true;
          this.callbacks.onReady();
          onSetupResolve?.();
          if (!msg.serverContent) return;
        }
      }

      const inputText = msg.serverContent?.inputTranscription?.text ?? msg.serverContent?.inputTranscript?.text;
      if (inputText) {
        this.callbacks.onInputTranscript?.(correctTranscription(inputText));
      }

      // SPOKEN CHANNEL — authoritative source for what the bot actually says.
      // This is the only channel that should reach the customer-facing bubble.
      const outputText = msg.serverContent?.outputTranscription?.text ?? msg.serverContent?.outputTranscript?.text;
      if (outputText) {
        this.turnHasOutputTranscription = true;
        if (!this.turnInProgress) {
          this.turnInProgress = true;
          this.newTurnId();
        }
        const corrected = correctTranscription(outputText);
        const meta: GeminiAssistantMeta = {
          sessionId: this.activeSessionId,
          turnId: this.currentTurnId,
          partType: "spoken",
        };
        this.callbacks.onAssistantSpokenTranscript?.(corrected, meta);
        // Legacy alias — spoken-only, never raw text.
        this.callbacks.onOutputTranscript?.(corrected);
      }

      if (msg.serverContent) {
        const content = msg.serverContent;

        if (content.interrupted) {
          this._wasInterrupted = true;
          this.isModelTurnActive = false;
          this.turnHasOutputTranscription = false;
          this.turnHasModelText = false;
          this.turnInProgress = false;
          this.callbacks.onInterrupted();
          return;
        }

        if (content.turnComplete) {
          this.isModelTurnActive = false;
          this.turnHasOutputTranscription = false;
          this.turnHasModelText = false;
          this.turnInProgress = false;
          this.callbacks.onTurnComplete();

          // Phase 0 diagnostic: emit one event per turn boundary.
          this.conversationTurnCount += 1;
          this.emitDiag({
            refreshTrigger: this.lastRefreshTrigger,
            refreshedThisTurn: this.refreshedThisTurn,
          });
          // Reset per-turn diag flags AFTER emit so this turn's row reflects
          // whether the just-completed turn was the one that refreshed.
          this.lastRefreshTrigger = "none";
          this.refreshedThisTurn = false;
          this.vadCommitTs = null;
          this.firstAudioOutTs = null;

          // Handle deferred refresh first
          if (this.pendingRefresh) {
            console.log("[GeminiLive] Executing deferred refresh after turn complete");
            this.pendingRefresh = false;
            this.turnCount = 0;
            this.lastRefreshTrigger = "turn_count";
            if (this.callbacks.onSessionRefresh) {
              this.callbacks.onSessionRefresh();
            } else {
              this.refreshSession();
            }
            return;
          }

          this.turnCount++;
          if (this.turnCount >= MAX_TURNS_BEFORE_REFRESH) {
            // Defer turn-based refresh: don't fire immediately on the turn
            // boundary because the next user utterance often starts within
            // ~300ms and the refresh would cut it off. Mark pendingRefresh
            // so it runs at the END of the NEXT turn instead, by which point
            // playback has fully drained and the session is genuinely idle.
            console.log(`[GeminiLive] Turn-based refresh deferred (will fire after next turn)`);
            this.turnCount = 0;
            this.pendingRefresh = true;
          }
          return;
        }

        if (content.modelTurn?.parts) {
          this._wasInterrupted = false; // New model turn clears interrupted flag
          this.isModelTurnActive = true;
          if (!this.turnInProgress) {
            this.turnInProgress = true;
            this.newTurnId();
          }
          const sessionId = this.activeSessionId;
          const turnId = this.currentTurnId;

          for (const part of content.modelTurn.parts) {
            if (part.inlineData?.data) {
              if (this.firstAudioOutTs == null && this.vadCommitTs != null) {
                this.firstAudioOutTs = (typeof performance !== "undefined" ? performance.now() : Date.now());
              }
              this.callbacks.onAudio(part.inlineData.data);
              continue;
            }

            // Spoken transcription embedded inside a part (some response shapes)
            if (part.outputAudioTranscription?.text) {
              const txt = correctTranscription(part.outputAudioTranscription.text);
              this.turnHasOutputTranscription = true;
              this.callbacks.onAssistantSpokenTranscript?.(txt, {
                sessionId, turnId, partType: "spoken",
              });
              this.callbacks.onOutputTranscript?.(txt);
              continue;
            }

            // Tool / function-call payloads — debug only, never to bubble
            if (part.functionCall || part.functionResponse) {
              this.callbacks.onAssistantToolEvent?.(part, {
                sessionId, turnId, partType: "tool",
              });
              continue;
            }

            // Thoughts (Gemini sometimes flags reasoning parts with thought:true)
            if (part.thought === true) {
              this.callbacks.onAssistantRawText?.(part.text ?? "", {
                sessionId, turnId, partType: "thought",
              });
              continue;
            }

            // Plain model text — NOT spoken. Route to raw debug channel only.
            // Legacy onTranscript is preserved for non-voice consumers (translate path)
            // that legitimately want model text. Customer voice UI must NOT subscribe
            // to onTranscript / onAssistantRawText.
            if (part.text) {
              this.turnHasModelText = true;
              this.callbacks.onTranscript(part.text, false);
              this.callbacks.onAssistantRawText?.(part.text, {
                sessionId, turnId, partType: "text",
              });
            }
          }
        }
      }

      if (msg.toolCall) {
        this.callbacks.onAssistantToolEvent?.(msg.toolCall, {
          sessionId: this.activeSessionId,
          turnId: this.currentTurnId,
          partType: "tool",
        });
        console.log("[GeminiLive] Tool call:", msg.toolCall);
      }
    } catch {
    }
  }


  sendAudio(pcm16Base64: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.isSetupComplete) {
      return;
    }

    if (this.ws.bufferedAmount > MAX_BUFFERED_AMOUNT) {
      return;
    }

    try {
      this.ws.send(JSON.stringify({
        realtimeInput: {
          audio: {
            data: pcm16Base64,
            mimeType: "audio/pcm;rate=16000",
          },
        },
      }));
    } catch (err) {
      console.warn("[GeminiLive] sendAudio error:", err);
      this.callbacks.onError("Failed to send audio data");
    }
  }

  sendText(text: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.isSetupComplete) {
      return;
    }

    try {
      this.ws.send(JSON.stringify({
        clientContent: {
          turns: [{ role: "user", parts: [{ text }] }],
          turnComplete: true,
        },
      }));
    } catch (err) {
      console.warn("[GeminiLive] sendText error:", err);
      this.callbacks.onError("Failed to send text");
    }
  }

  disconnect() {
    this.intentionalClose = true;
    this.stopKeepalive();
    this.stopSessionRefreshTimer();

    if (!this.isSetupComplete && this.pendingConnectReject) {
      const rejectPending = this.pendingConnectReject;
      this.clearPendingConnect();
      rejectPending(new Error("Session cancelled"));
    }

    this.cleanupWs();
    this.isSetupComplete = false;
  }

  private cleanupWs() {
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN && this.isSetupComplete;
  }
}
