/**
 * Development-only logging for translation system diagnostics.
 * All logging is gated behind `import.meta.env.DEV` — zero overhead in production.
 */

const isDev = import.meta.env.DEV;
const PREFIX = '%c[TranslateDebug]';
const STYLE = 'color:#6366f1;font-weight:bold';

export interface TranslateDebugState {
  mode: 'voice' | 'text' | 'idle';
  turnCount: number;
  sessionStartTime: number | null;
  lastRefreshReason: string | null;
  lastRefreshTime: number | null;
  lastReconnectDurationMs: number | null;
  lastTranslationDurationMs: number | null;
  summaryLength: number;
}

let state: TranslateDebugState = createInitialState();
let reconnectStartTime: number | null = null;
let listeners: Array<(s: TranslateDebugState) => void> = [];

function createInitialState(): TranslateDebugState {
  return {
    mode: 'idle',
    turnCount: 0,
    sessionStartTime: null,
    lastRefreshReason: null,
    lastRefreshTime: null,
    lastReconnectDurationMs: null,
    lastTranslationDurationMs: null,
    summaryLength: 0,
  };
}

function emit() {
  for (const fn of listeners) fn({ ...state });
}

// ─── Public API ───

export function debugSessionStart(mode: 'voice' | 'text') {
  if (!isDev) return;
  state = { ...createInitialState(), mode, sessionStartTime: Date.now() };
  console.log(PREFIX, STYLE, `Session started — mode=${mode}`);
  emit();
}

export function debugSessionStop() {
  if (!isDev) return;
  const age = state.sessionStartTime ? ((Date.now() - state.sessionStartTime) / 1000).toFixed(1) : '?';
  console.log(PREFIX, STYLE, `Session stopped — ${state.turnCount} turns, ${age}s`);
  state = createInitialState();
  emit();
}

export function debugTurnComplete() {
  if (!isDev) return;
  state = { ...state, turnCount: state.turnCount + 1 };
  console.log(PREFIX, STYLE, `Turn ${state.turnCount} complete`);
  emit();
}

export function debugRefreshStart(reason: 'turn_limit' | 'timeout' | 'manual') {
  if (!isDev) return;
  reconnectStartTime = Date.now();
  state = { ...state, lastRefreshReason: reason };
  console.log(PREFIX, STYLE, `Refresh starting — reason=${reason}`);
  emit();
}

export function debugRefreshComplete() {
  if (!isDev) return;
  const duration = reconnectStartTime ? Date.now() - reconnectStartTime : null;
  reconnectStartTime = null;
  state = { ...state, lastRefreshTime: Date.now(), lastReconnectDurationMs: duration };
  console.log(PREFIX, STYLE, `Refresh complete — ${duration ? duration + 'ms' : 'unknown'}`);
  emit();
}

export function debugReconnectStart() {
  if (!isDev) return;
  reconnectStartTime = Date.now();
  console.log(PREFIX, STYLE, 'Reconnecting…');
}

export function debugReconnectEnd(success: boolean) {
  if (!isDev) return;
  const duration = reconnectStartTime ? Date.now() - reconnectStartTime : null;
  reconnectStartTime = null;
  state = { ...state, lastReconnectDurationMs: duration };
  console.log(PREFIX, STYLE, `Reconnect ${success ? 'succeeded' : 'failed'} — ${duration ? duration + 'ms' : 'unknown'}`);
  emit();
}

export function debugTextTranslation(durationMs: number) {
  if (!isDev) return;
  state = { ...state, lastTranslationDurationMs: durationMs, turnCount: state.turnCount + 1 };
  console.log(PREFIX, STYLE, `Text translation — ${durationMs}ms (turn ${state.turnCount})`);
  emit();
}

export function debugSummaryUpdate(summaryLength: number) {
  if (!isDev) return;
  state = { ...state, summaryLength };
  console.log(PREFIX, STYLE, `Summary updated — ${summaryLength} chars`);
  emit();
}

/** Subscribe to state changes (for debug overlay). Returns unsubscribe fn. */
export function subscribeDebugState(fn: (s: TranslateDebugState) => void): () => void {
  if (!isDev) return () => {};
  listeners.push(fn);
  fn({ ...state }); // immediate emit
  return () => { listeners = listeners.filter(l => l !== fn); };
}

export function getDebugState(): TranslateDebugState {
  return { ...state };
}
