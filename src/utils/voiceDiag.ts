/**
 * Voice bot Phase 0 diagnostic emitter (webchat side).
 *
 * Default OFF: enabled only when localStorage.voice_diag holds the shared
 * secret. When disabled, getDiagSecret() returns "" and createDiagEmitter()
 * returns null so callers pay zero CPU per turn (a single pointer check).
 *
 * Batching: events flushed every 10s OR every 20 events, whichever first.
 * Also flushed on `pagehide` and on explicit close(). Transport is
 * navigator.sendBeacon when available, falling back to fetch({ keepalive }).
 */

const DIAG_LS_KEY = "voice_diag";
const FLUSH_INTERVAL_MS = 10_000;
const FLUSH_BATCH_SIZE = 20;
const ENDPOINT_PATH = "/functions/v1/voice-diag";

export type DiagRefreshTrigger = "none" | "turn_count" | "timer" | "reconnect";
export type DiagChannel = "webchat" | "pstn";

export type DiagEvent = {
  client_event_id: string;
  live_session_id: string;
  conversation_id?: string | null;
  turn_id: number;
  conversation_turn_count: number;
  refresh_trigger: DiagRefreshTrigger;
  refreshed_this_turn: boolean;
  server_prompt_had_history: boolean;
  vad_commit_to_first_audio_ms?: number | null;
  name_adoption_state?: string;
  channel: DiagChannel;
  ts_client: number;
  extra?: Record<string, unknown>;
};

export function getDiagSecret(): string {
  try {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(DIAG_LS_KEY) || "";
  } catch {
    return "";
  }
}

export function isDiagEnabled(): boolean {
  return getDiagSecret().length > 0;
}

function getEndpoint(): string | null {
  const url =
    (import.meta as any)?.env?.VITE_SUPABASE_URL ||
    (typeof window !== "undefined" && (window as any).__SUPABASE_URL__) ||
    "";
  if (!url) return null;
  return `${String(url).replace(/\/+$/, "")}${ENDPOINT_PATH}`;
}

export type DiagEmitter = {
  emit: (event: DiagEvent) => void;
  flush: () => void;
  close: () => void;
};

export function createDiagEmitter(): DiagEmitter | null {
  const secret = getDiagSecret();
  if (!secret) return null;
  const endpoint = getEndpoint();
  if (!endpoint) return null;

  let queue: DiagEvent[] = [];
  let timer: ReturnType<typeof setInterval> | null = null;
  let warnedFailure = false;
  let closed = false;

  const post = (events: DiagEvent[]) => {
    if (events.length === 0) return;
    const payload = JSON.stringify(events);

    try {
      if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        const blob = new Blob([payload], { type: "application/json" });
        // Note: sendBeacon doesn't support custom headers. 
        // If the edge function requires X-Diag-Secret, we must use fetch.
        // We use fetch with keepalive as the primary transport.
      }
      
      void fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Diag-Secret": secret,
        },
        body: payload,
        keepalive: true,
      })
        .then((res) => {
          if (!res.ok && !warnedFailure) {
            warnedFailure = true;
            console.warn(`[voice-diag] POST failed: ${res.status}`);
          }
        })
        .catch((err) => {
          if (!warnedFailure) {
            warnedFailure = true;
            console.warn("[voice-diag] POST error:", err);
          }
        });
    } catch (err) {
      if (!warnedFailure) {
        warnedFailure = true;
        console.warn("[voice-diag] POST threw:", err);
      }
    }
  };

  const flush = () => {
    if (queue.length === 0) return;
    const batch = queue.splice(0, queue.length);
    post(batch);
  };

  const emit = (event: DiagEvent) => {
    if (closed) return;
    queue.push(event);
    if (queue.length >= FLUSH_BATCH_SIZE) flush();
  };

  timer = setInterval(flush, FLUSH_INTERVAL_MS);

  const onPageHide = () => flush();
  if (typeof window !== "undefined") {
    window.addEventListener("pagehide", onPageHide);
  }

  const close = () => {
    if (closed) return;
    closed = true;
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    if (typeof window !== "undefined") {
      window.removeEventListener("pagehide", onPageHide);
    }
    flush();
  };

  return { emit, flush, close };
}

export function newClientEventId(): string {
  if (typeof crypto !== "undefined" && (crypto as any).randomUUID) {
    return (crypto as any).randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
