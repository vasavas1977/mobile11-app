/**
 * Session Health Monitor — detects degraded voice sessions and triggers auto-refresh.
 *
 * Tracks:
 *  - Time-to-first-audio per turn (rising latency)
 *  - Reconnect frequency (reconnect storms)
 *  - Transcript event gaps (missing transcripts)
 *  - Consecutive silent turns (no audio received)
 *
 * When degradation score exceeds threshold, emits a refresh recommendation.
 * Includes cooldown to prevent refresh loops.
 */

export type HealthEvent =
  | { type: 'turn_start' }
  | { type: 'first_audio' }
  | { type: 'turn_complete'; hadAudio: boolean; hadTranscript: boolean }
  | { type: 'reconnect' }
  | { type: 'refresh_complete' };

export type HealthStatus = 'healthy' | 'degraded' | 'refresh_recommended';

export interface HealthSnapshot {
  status: HealthStatus;
  score: number; // 0–100, higher = worse
  avgFirstAudioMs: number;
  recentReconnects: number;
  missedTranscripts: number;
  silentTurns: number;
}

interface HealthConfig {
  /** Latency above this (ms) adds to score */
  latencyWarningMs: number;
  /** Latency above this (ms) strongly adds to score */
  latencyCriticalMs: number;
  /** Max reconnects within window before scoring high */
  maxReconnectsInWindow: number;
  /** Reconnect tracking window (ms) */
  reconnectWindowMs: number;
  /** Score threshold for 'degraded' status */
  degradedThreshold: number;
  /** Score threshold for 'refresh_recommended' */
  refreshThreshold: number;
  /** Min time between auto-refresh recommendations (ms) */
  refreshCooldownMs: number;
  /** Sliding window of turns to track */
  turnWindowSize: number;
}

const DEFAULT_CONFIG: HealthConfig = {
  latencyWarningMs: 2000,
  latencyCriticalMs: 4000,
  maxReconnectsInWindow: 2,
  reconnectWindowMs: 60_000,
  degradedThreshold: 30,
  refreshThreshold: 60,
  refreshCooldownMs: 45_000, // Don't recommend refresh more than once per 45s
  turnWindowSize: 5,
};

export class SessionHealthMonitor {
  private config: HealthConfig;
  private turnStartTime: number | null = null;
  private gotFirstAudio = false;
  private firstAudioLatencies: number[] = [];
  private reconnectTimestamps: number[] = [];
  private missedTranscripts = 0;
  private silentTurns = 0;
  private lastRefreshRecommendation = 0;
  private onRefreshRecommended: (() => void) | null = null;

  constructor(
    onRefreshRecommended?: () => void,
    config?: Partial<HealthConfig>,
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.onRefreshRecommended = onRefreshRecommended ?? null;
  }

  /** Record a health event */
  record(event: HealthEvent): void {
    const now = Date.now();

    switch (event.type) {
      case 'turn_start':
        this.turnStartTime = now;
        this.gotFirstAudio = false;
        break;

      case 'first_audio':
        if (this.turnStartTime && !this.gotFirstAudio) {
          this.gotFirstAudio = true;
          const latency = now - this.turnStartTime;
          this.firstAudioLatencies.push(latency);
          if (this.firstAudioLatencies.length > this.config.turnWindowSize) {
            this.firstAudioLatencies.shift();
          }
        }
        break;

      case 'turn_complete':
        if (!event.hadAudio) this.silentTurns++;
        else this.silentTurns = Math.max(0, this.silentTurns - 1); // Decay on success
        if (!event.hadTranscript) this.missedTranscripts++;
        else this.missedTranscripts = Math.max(0, this.missedTranscripts - 1);
        this.checkAndEmit(now);
        break;

      case 'reconnect':
        this.reconnectTimestamps.push(now);
        // Prune old entries
        this.reconnectTimestamps = this.reconnectTimestamps.filter(
          t => now - t < this.config.reconnectWindowMs
        );
        this.checkAndEmit(now);
        break;

      case 'refresh_complete':
        // Reset degradation signals after a successful refresh
        this.firstAudioLatencies = [];
        this.missedTranscripts = 0;
        this.silentTurns = 0;
        break;
    }
  }

  /** Get current health snapshot */
  getSnapshot(): HealthSnapshot {
    const score = this.computeScore();
    let status: HealthStatus = 'healthy';
    if (score >= this.config.refreshThreshold) status = 'refresh_recommended';
    else if (score >= this.config.degradedThreshold) status = 'degraded';

    const avgLatency =
      this.firstAudioLatencies.length > 0
        ? this.firstAudioLatencies.reduce((a, b) => a + b, 0) / this.firstAudioLatencies.length
        : 0;

    const now = Date.now();
    const recentReconnects = this.reconnectTimestamps.filter(
      t => now - t < this.config.reconnectWindowMs
    ).length;

    return {
      status,
      score: Math.round(score),
      avgFirstAudioMs: Math.round(avgLatency),
      recentReconnects,
      missedTranscripts: this.missedTranscripts,
      silentTurns: this.silentTurns,
    };
  }

  /** Reset all state (e.g. on session stop) */
  reset(): void {
    this.turnStartTime = null;
    this.gotFirstAudio = false;
    this.firstAudioLatencies = [];
    this.reconnectTimestamps = [];
    this.missedTranscripts = 0;
    this.silentTurns = 0;
    this.lastRefreshRecommendation = 0;
  }

  private computeScore(): number {
    let score = 0;

    // Latency component (0–40 points)
    if (this.firstAudioLatencies.length > 0) {
      const avg = this.firstAudioLatencies.reduce((a, b) => a + b, 0) / this.firstAudioLatencies.length;
      if (avg > this.config.latencyCriticalMs) score += 40;
      else if (avg > this.config.latencyWarningMs) {
        score += 15 + 25 * ((avg - this.config.latencyWarningMs) / (this.config.latencyCriticalMs - this.config.latencyWarningMs));
      }
    }

    // Reconnect component (0–30 points)
    const now = Date.now();
    const recentReconnects = this.reconnectTimestamps.filter(t => now - t < this.config.reconnectWindowMs).length;
    score += Math.min(30, recentReconnects * 15);

    // Missing transcripts component (0–15 points)
    score += Math.min(15, this.missedTranscripts * 5);

    // Silent turns component (0–15 points)
    score += Math.min(15, this.silentTurns * 8);

    return Math.min(100, score);
  }

  private checkAndEmit(now: number): void {
    const score = this.computeScore();
    if (score >= this.config.refreshThreshold) {
      if (now - this.lastRefreshRecommendation > this.config.refreshCooldownMs) {
        this.lastRefreshRecommendation = now;
        console.log(`[SessionHealth] Refresh recommended (score=${Math.round(score)})`);
        this.onRefreshRecommended?.();
      }
    }
  }
}
