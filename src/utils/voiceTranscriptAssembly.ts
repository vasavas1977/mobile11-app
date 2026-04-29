/**
 * Shared transcript assembly for Gemini Live voice channels.
 *
 * Gemini Live emits `outputAudioTranscription` as APPEND-ONLY DELTAS — each
 * event carries a small fragment (often 1–3 words) that must be concatenated
 * to the running buffer for the current turn. The previous implementation
 * mistakenly classified deltas as snapshots via `startsWith` heuristics and
 * had a subtle reset bug that wiped the buffer on every chunk, causing the
 * live bubble to display only the latest 1–2 words instead of the full
 * sentence. This module fixes that with explicit turn-keyed append semantics.
 *
 * Used by both ChatVoiceMode (customer widget) and VoiceBotTester (admin).
 */

export type TranscriptSource = "assistant-audio" | "user-input";

export interface TranscriptBuffer {
  sessionId: string;
  turnId: string;
  source: TranscriptSource;
  text: string;
  /** Last delta appended — used for narrow adjacent-duplicate guard. */
  lastDelta?: string;
}

export interface TranscriptChunk {
  sessionId: string;
  turnId: string;
  source: TranscriptSource;
  text: string;
  /**
   * If true, `text` is a delta to append. If false, it's a full snapshot
   * that should replace the buffer. Gemini Live's outputAudioTranscription
   * is delta-only; the flag exists so callers from other surfaces (e.g. SDKs
   * that emit snapshots) can opt out of append semantics safely.
   */
  isDelta: boolean;
}

/**
 * Append a transcript chunk to the running buffer, starting a fresh buffer
 * when the turn / session / source identity changes. Whitespace is preserved
 * verbatim — never trim or normalize per chunk, because word boundaries
 * carry semantically meaningful spaces (" สวัสดี" + "ค่ะ" ≠ "สวัสดีค่ะ").
 *
 * Idempotency note: a narrow `lastDelta === incoming` guard rejects exact
 * back-to-back duplicates from the SDK. This may eat a legitimate repeated
 * token in rare cases; strong dedupe belongs at the persistence layer.
 */
export function appendTranscriptChunk(
  buffer: TranscriptBuffer | null,
  chunk: TranscriptChunk,
): TranscriptBuffer {
  if (!chunk.text) {
    return buffer ?? {
      sessionId: chunk.sessionId,
      turnId: chunk.turnId,
      source: chunk.source,
      text: "",
    };
  }

  const isNewBuffer =
    !buffer ||
    buffer.turnId !== chunk.turnId ||
    buffer.sessionId !== chunk.sessionId ||
    buffer.source !== chunk.source;

  if (isNewBuffer) {
    return {
      sessionId: chunk.sessionId,
      turnId: chunk.turnId,
      source: chunk.source,
      text: chunk.text,
      lastDelta: chunk.isDelta ? chunk.text : undefined,
    };
  }

  // Snapshot — replace.
  if (!chunk.isDelta) {
    return { ...buffer!, text: chunk.text };
  }

  // Delta — narrow adjacent-duplicate guard, then append verbatim.
  if (buffer!.lastDelta === chunk.text) return buffer!;

  return {
    ...buffer!,
    text: buffer!.text + chunk.text,
    lastDelta: chunk.text,
  };
}
