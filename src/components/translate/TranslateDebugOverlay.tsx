import { useEffect, useState } from 'react';
import { subscribeDebugState, type TranslateDebugState } from '@/utils/translateDebugLogger';

/**
 * Dev-only floating overlay showing live translation debug state.
 * Only renders in development builds — returns null in production.
 */
export function TranslateDebugOverlay() {
  const [state, setState] = useState<TranslateDebugState | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    return subscribeDebugState(setState);
  }, []);

  // Auto-refresh session age every second
  useEffect(() => {
    if (!state?.sessionStartTime || state.mode === 'idle') return;
    const id = setInterval(() => setState(s => s ? { ...s } : s), 1000);
    return () => clearInterval(id);
  }, [state?.sessionStartTime, state?.mode]);

  if (!import.meta.env.DEV || !state || state.mode === 'idle') return null;

  const sessionAge = state.sessionStartTime
    ? Math.round((Date.now() - state.sessionStartTime) / 1000)
    : 0;

  return (
    <>
      <button
        onClick={() => setVisible(v => !v)}
        className="fixed top-2 right-2 z-[9999] w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
        title="Toggle debug overlay"
      >
        D
      </button>

      {visible && (
        <div className="fixed top-10 right-2 z-[9999] bg-gray-900/90 text-green-300 text-[11px] font-mono p-3 rounded-lg shadow-xl max-w-[220px] leading-relaxed backdrop-blur-sm">
          <div className="text-indigo-300 font-bold mb-1 text-xs">🔧 Translate Debug</div>
          <Row label="Mode" value={state.mode} />
          <Row label="Turns" value={String(state.turnCount)} />
          <Row label="Session" value={`${sessionAge}s`} />
          <Row label="Summary" value={state.summaryLength ? `${state.summaryLength}ch` : '—'} />
          {state.lastRefreshReason && <Row label="Refresh" value={state.lastRefreshReason} />}
          {state.lastReconnectDurationMs != null && <Row label="Reconnect" value={`${state.lastReconnectDurationMs}ms`} />}
          {state.lastTranslationDurationMs != null && <Row label="Translate" value={`${state.lastTranslationDurationMs}ms`} />}
        </div>
      )}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-gray-400">{label}</span>
      <span className="text-green-200">{value}</span>
    </div>
  );
}
