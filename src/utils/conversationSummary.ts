/**
 * Lightweight conversation summariser.
 * Produces a 1-2 sentence intent-only summary from the most recent messages.
 * Designed to be injected into refreshed voice sessions or text-mode requests
 * so context is preserved without sending the full conversation history.
 */

import { TranslateMessage } from '@/types/translate';

/** How many turns (completed message pairs) before we regenerate the summary */
const SUMMARY_INTERVAL = 2;

/** Maximum recent messages to consider when building a summary */
const MAX_RECENT_MESSAGES = 6;

let cachedSummary = '';
let turnsSinceLastSummary = 0;

/**
 * Call after every completed turn. Returns the current summary string
 * (may be empty for the first couple of turns).
 */
export function updateSummary(messages: TranslateMessage[]): string {
  turnsSinceLastSummary++;

  if (turnsSinceLastSummary < SUMMARY_INTERVAL || messages.length < 2) {
    return cachedSummary;
  }

  // Take only the most recent messages
  const recent = messages.slice(-MAX_RECENT_MESSAGES);
  cachedSummary = buildSummary(recent);
  turnsSinceLastSummary = 0;
  return cachedSummary;
}

/**
 * Get the current summary without triggering a rebuild.
 */
export function getCurrentSummary(): string {
  return cachedSummary;
}

/**
 * Reset state (e.g. when user starts a new conversation).
 */
export function resetSummary(): void {
  cachedSummary = '';
  turnsSinceLastSummary = 0;
}

// ─── Internal ───

function buildSummary(messages: TranslateMessage[]): string {
  // Extract only the user-side original texts to capture intent
  const intents = messages
    .filter((m) => m.status !== 'error')
    .map((m) => m.originalText.trim())
    .filter(Boolean);

  if (intents.length === 0) return '';

  // Deduplicate consecutive identical intents
  const deduped: string[] = [];
  for (const t of intents) {
    if (deduped[deduped.length - 1] !== t) deduped.push(t);
  }

  // Condense into a compact summary: take the last 3 unique intents
  const latest = deduped.slice(-3);

  // Build a short narrative
  if (latest.length === 1) {
    return `User said: "${truncate(latest[0], 80)}".`;
  }

  const earlier = latest.slice(0, -1).map((t) => truncate(t, 50)).join('; ');
  const last = truncate(latest[latest.length - 1], 80);

  return `Earlier: ${earlier}. Latest: "${last}".`;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + '…';
}
