/**
 * Audio utilities for real-time voice translation.
 * Uses AudioWorklet for low-latency off-main-thread PCM capture & resampling.
 * Falls back to ScriptProcessorNode for older browsers.
 * 
 * Filter chain tuned for speech clarity across languages:
 * - High-pass at 80Hz (single stage) — cuts rumble/wind without losing male fundamentals
 * - Low-pass at 7500Hz — preserves consonant clarity (s, f, th, sh) while cutting noise
 * - Noise gate with soft knee — avoids hard clipping on quiet speakers
 */

const TARGET_SAMPLE_RATE = 16000;
const PLAYBACK_SAMPLE_RATE = 24000;
const DEFAULT_CHUNK_INTERVAL_MS = 20;

// Noise gate threshold — 0.008 RMS (~-42dB) is gentle enough for soft/mobile speakers
// while still gating ambient room noise
const NOISE_GATE_THRESHOLD = 0.008;
// Soft-knee width: samples between threshold and threshold*KNEE_RATIO get attenuated
// rather than hard-gated, preventing choppy on/off transitions
const NOISE_GATE_KNEE_RATIO = 2.5; // gate fully opens at threshold * 2.5

// AudioWorklet processor code — captures, resamples, and converts PCM off main thread
const WORKLET_CODE = `
class PcmCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = [];
    this._bufferLength = 0;
    this._interval = 20;
    this._lastSend = currentTime;
    this._fromRate = 0;
    this._toRate = 0;
    this._noiseGateThreshold = 0.008;
    this._noiseGateKneeRatio = 2.5;
    this.port.onmessage = (e) => {
      if (e.data.interval) this._interval = e.data.interval;
      if (e.data.fromRate) this._fromRate = e.data.fromRate;
      if (e.data.toRate) this._toRate = e.data.toRate;
      if (e.data.noiseGateThreshold !== undefined) this._noiseGateThreshold = e.data.noiseGateThreshold;
      if (e.data.noiseGateKneeRatio !== undefined) this._noiseGateKneeRatio = e.data.noiseGateKneeRatio;
    };
  }
  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input) return true;
    this._buffer.push(new Float32Array(input));
    this._bufferLength += input.length;
    const elapsed = (currentTime - this._lastSend) * 1000;
    if (elapsed >= this._interval) {
      const merged = new Float32Array(this._bufferLength);
      let offset = 0;
      for (const buf of this._buffer) {
        merged.set(buf, offset);
        offset += buf.length;
      }
      this._buffer = [];
      this._bufferLength = 0;
      this._lastSend = currentTime;

      // RMS calculation
      let sumSq = 0;
      for (let i = 0; i < merged.length; i++) sumSq += merged[i] * merged[i];
      const rms = Math.sqrt(sumSq / merged.length);

      const thresh = this._noiseGateThreshold;
      const kneeTop = thresh * this._noiseGateKneeRatio;

      if (rms < thresh) {
        // Below gate — send silence
        const silentLen = this._fromRate && this._toRate && this._fromRate !== this._toRate
          ? Math.round(merged.length / (this._fromRate / this._toRate))
          : merged.length;
        const silent = new Int16Array(silentLen);
        this.port.postMessage(silent.buffer, [silent.buffer]);
        return true;
      }

      // Soft-knee attenuation: smoothly ramp gain from 0→1 between thresh and kneeTop
      let gain = 1.0;
      if (rms < kneeTop) {
        gain = (rms - thresh) / (kneeTop - thresh);
        gain = gain * gain; // Quadratic curve for smoother transition
      }

      // Convert float32 to int16, applying soft-knee gain
      let pcm16 = new Int16Array(merged.length);
      for (let i = 0; i < merged.length; i++) {
        const s = Math.max(-1, Math.min(1, merged[i] * gain));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }

      // Resample in-worklet if needed
      if (this._fromRate && this._toRate && this._fromRate !== this._toRate) {
        const ratio = this._fromRate / this._toRate;
        const outLen = Math.round(pcm16.length / ratio);
        const resampled = new Int16Array(outLen);
        for (let i = 0; i < outLen; i++) {
          const srcIdx = i * ratio;
          const floor = Math.floor(srcIdx);
          const ceil = Math.min(floor + 1, pcm16.length - 1);
          const frac = srcIdx - floor;
          resampled[i] = Math.round(pcm16[floor] * (1 - frac) + pcm16[ceil] * frac);
        }
        pcm16 = resampled;
      }

      this.port.postMessage(pcm16.buffer, [pcm16.buffer]);
    }
    return true;
  }
}
registerProcessor('pcm-capture-processor', PcmCaptureProcessor);
`;

let workletBlobUrl: string | null = null;

function getWorkletUrl(): string {
  if (!workletBlobUrl) {
    const blob = new Blob([WORKLET_CODE], { type: 'application/javascript' });
    workletBlobUrl = URL.createObjectURL(blob);
  }
  return workletBlobUrl;
}

/**
 * Fast Base64 encoding using chunk-based String.fromCharCode
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const len = bytes.length;
  const CHUNK = 8192;
  let binary = '';
  for (let i = 0; i < len; i += CHUNK) {
    const slice = bytes.subarray(i, Math.min(i + CHUNK, len));
    binary += String.fromCharCode.apply(null, slice as unknown as number[]);
  }
  return btoa(binary);
}

/**
 * Resample Int16 PCM from one sample rate to another using linear interpolation.
 * Used only by the ScriptProcessor fallback path (main thread).
 */
function resampleInt16(input: Int16Array, fromRate: number, toRate: number): Int16Array {
  if (fromRate === toRate) return input;
  const ratio = fromRate / toRate;
  const outputLength = Math.round(input.length / ratio);
  const output = new Int16Array(outputLength);
  for (let i = 0; i < outputLength; i++) {
    const srcIndex = i * ratio;
    const srcFloor = Math.floor(srcIndex);
    const srcCeil = Math.min(srcFloor + 1, input.length - 1);
    const frac = srcIndex - srcFloor;
    output[i] = Math.round(input[srcFloor] * (1 - frac) + input[srcCeil] * frac);
  }
  return output;
}

/**
 * Captures microphone audio and returns raw PCM chunks via callback.
 * 
 * Audio pipeline tuned for multilingual speech clarity:
 * - getUserMedia with echoCancellation + noiseSuppression + autoGainControl
 * - Single high-pass at 80Hz (preserves male voice fundamentals, cuts rumble)
 * - Presence boost at 2.5kHz (+3dB) to enhance consonant clarity on weak mics
 * - Low-pass at 7500Hz (preserves s/f/sh/th consonants, cuts high-freq noise)
 * - Soft-knee noise gate in worklet (no hard clipping on quiet speakers)
 * 
 * Uses AudioWorklet for low-latency off-thread processing + resampling when available.
 */
export async function startMicCapture(
  onChunk: (pcm16Base64: string) => void,
  chunkIntervalMs = DEFAULT_CHUNK_INTERVAL_MS
): Promise<{ stop: () => void; analyser: AnalyserNode; stream: MediaStream }> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      // Don't force sampleRate — let the browser use native rate to avoid
      // browser-internal resampling artifacts (especially on mobile).
      // We resample to 16kHz in the worklet with proper interpolation.
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });

  // Use native sample rate to avoid double-resampling
  // (browser resamples mic → requested rate, then we'd resample again to 16kHz)
  const audioCtx = new AudioContext({ latencyHint: 'interactive' });
  const actualRate = audioCtx.sampleRate;
  const needsResample = actualRate !== TARGET_SAMPLE_RATE;

  console.log(`[Audio] Mic capture started — native: ${actualRate}Hz, target: ${TARGET_SAMPLE_RATE}Hz, resampling: ${needsResample}, chunk: ${chunkIntervalMs}ms`);

  const source = audioCtx.createMediaStreamSource(stream);

  // High-pass at 80Hz — single stage, gentle slope
  // Cuts rumble/wind/AC without losing male vocal fundamentals (F0 ~85-155Hz)
  // Previous 150+200Hz cascade was too aggressive for deep male voices
  const highpass = audioCtx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 80;
  highpass.Q.value = 0.71; // Butterworth — flat passband
  source.connect(highpass);

  // Presence boost at 2.5kHz — enhances consonant clarity
  // Especially helpful for weak mobile mics where speech sounds muddy
  // +3dB narrow peak to bring out speech intelligibility
  const presenceBoost = audioCtx.createBiquadFilter();
  presenceBoost.type = 'peaking';
  presenceBoost.frequency.value = 2500;
  presenceBoost.Q.value = 1.5; // Moderate width — covers ~1.5-4kHz
  presenceBoost.gain.value = 3; // +3dB — subtle but effective
  highpass.connect(presenceBoost);

  // Low-pass at 7500Hz — preserves consonant formants (s=4-8kHz, f=1.5-7kHz)
  // Previous 3200Hz cutoff was destroying speech clarity (sibilants, fricatives)
  const lowpass = audioCtx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 7500;
  lowpass.Q.value = 0.71;
  presenceBoost.connect(lowpass);

  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  lowpass.connect(analyser);

  let cleanup: () => void;

  // Try AudioWorklet first (lower latency, off main thread, includes resampling + soft-knee gate)
  if (audioCtx.audioWorklet) {
    try {
      await audioCtx.audioWorklet.addModule(getWorkletUrl());
      const workletNode = new AudioWorkletNode(audioCtx, 'pcm-capture-processor');
      workletNode.port.postMessage({ 
        interval: chunkIntervalMs,
        fromRate: needsResample ? actualRate : 0,
        toRate: needsResample ? TARGET_SAMPLE_RATE : 0,
        noiseGateThreshold: NOISE_GATE_THRESHOLD,
        noiseGateKneeRatio: NOISE_GATE_KNEE_RATIO,
      });
      workletNode.port.onmessage = (e: MessageEvent<ArrayBuffer>) => {
        onChunk(arrayBufferToBase64(e.data));
      };
      lowpass.connect(workletNode);
      workletNode.connect(audioCtx.destination);

      cleanup = () => {
        workletNode.port.close();
        workletNode.disconnect();
        highpass.disconnect();
        presenceBoost.disconnect();
        lowpass.disconnect();
        source.disconnect();
        stream.getTracks().forEach((t) => t.stop());
        audioCtx.close();
      };

      return { stop: cleanup, analyser, stream };
    } catch (err) {
      console.warn('[Audio] AudioWorklet failed, falling back to ScriptProcessor:', err);
    }
  }

  // Fallback: ScriptProcessorNode (with matching soft-knee noise gate)
  const bufferSize = 2048;
  const processor = audioCtx.createScriptProcessor(bufferSize, 1, 1);
  let pcmBuffer: Float32Array[] = [];
  let lastSendTime = Date.now();

  processor.onaudioprocess = (e) => {
    const inputData = e.inputBuffer.getChannelData(0);
    pcmBuffer.push(new Float32Array(inputData));

    if (Date.now() - lastSendTime >= chunkIntervalMs) {
      const totalLength = pcmBuffer.reduce((sum, buf) => sum + buf.length, 0);
      const merged = new Float32Array(totalLength);
      let offset = 0;
      for (const buf of pcmBuffer) {
        merged.set(buf, offset);
        offset += buf.length;
      }
      pcmBuffer = [];
      lastSendTime = Date.now();

      // RMS calculation
      let sumSq = 0;
      for (let i = 0; i < merged.length; i++) sumSq += merged[i] * merged[i];
      const rms = Math.sqrt(sumSq / merged.length);

      const kneeTop = NOISE_GATE_THRESHOLD * NOISE_GATE_KNEE_RATIO;

      if (rms < NOISE_GATE_THRESHOLD) {
        // Below gate — send silence
        const silentLen = needsResample ? Math.round(merged.length / (actualRate / TARGET_SAMPLE_RATE)) : merged.length;
        const silent = new Int16Array(silentLen);
        onChunk(arrayBufferToBase64(silent.buffer as ArrayBuffer));
        return;
      }

      // Soft-knee gain
      let gain = 1.0;
      if (rms < kneeTop) {
        const t = (rms - NOISE_GATE_THRESHOLD) / (kneeTop - NOISE_GATE_THRESHOLD);
        gain = t * t; // Quadratic for smooth transition
      }

      const pcm16Raw = float32ToPcm16(merged, gain);
      const pcm16 = needsResample ? resampleInt16(pcm16Raw, actualRate, TARGET_SAMPLE_RATE) : pcm16Raw;
      onChunk(arrayBufferToBase64(pcm16.buffer as ArrayBuffer));
    }
  };

  lowpass.connect(processor);
  processor.connect(audioCtx.destination);

  cleanup = () => {
    processor.disconnect();
    highpass.disconnect();
    presenceBoost.disconnect();
    lowpass.disconnect();
    source.disconnect();
    stream.getTracks().forEach((t) => t.stop());
    audioCtx.close();
  };

  return { stop: cleanup, analyser, stream };
}
// ─── Leading silence detection threshold ───
// Samples below this absolute value are considered silence (~-60dB)
const SILENCE_THRESHOLD = 0.005;
// Minimum samples to trim (don't trim if silence is very short — likely just encoding artifact)
const MIN_SILENCE_SAMPLES = 48; // 2ms at 24kHz

/**
 * Trim leading silence from a Float32Array of audio samples.
 * Returns a subarray starting from the first non-silent sample.
 * Only trims if leading silence is meaningful (>2ms).
 */
function trimLeadingSilence(samples: Float32Array): Float32Array {
  let firstNonSilent = 0;
  for (let i = 0; i < samples.length; i++) {
    if (Math.abs(samples[i]) > SILENCE_THRESHOLD) {
      firstNonSilent = i;
      break;
    }
    if (i === samples.length - 1) {
      // Entire buffer is silence — return as-is (it's intentional padding)
      return samples;
    }
  }
  // Only trim if the silence was substantial
  if (firstNonSilent < MIN_SILENCE_SAMPLES) return samples;
  // Keep a tiny fade-in ramp (24 samples = 1ms) to avoid click
  const keepFrom = Math.max(0, firstNonSilent - 24);
  return samples.subarray(keepFrom);
}

/**
 * Queued audio playback — schedules PCM chunks sequentially
 * so they play back-to-back without overlap.
 * 
 * Optimized for smooth, click-free playback:
 * - Crossfade ramps at chunk boundaries to eliminate clicks
 * - Turn-generation tracking prevents stale audio from old turns
 * - Gain ramp-down on flush prevents pop artifacts on interrupt
 * - Uses 'interactive' latency hint for minimum system buffer
 * - Trims leading silence from first chunk per turn
 */
export class AudioPlaybackQueue {
  private ctx: AudioContext;
  private gainNode: GainNode;
  private compressorNode: DynamicsCompressorNode;
  private nextStartTime = 0;
  private activeSources = new Set<AudioBufferSourceNode>();
  private _isPlaying = false;
  private onPlayingChange?: (playing: boolean) => void;
  private checkIdleTimer: ReturnType<typeof setTimeout> | null = null;
  private isFirstChunkOfTurn = true;
  private turnGeneration = 0; // Monotonic counter — chunks from old turns are discarded
  private visibilityHandler: (() => void) | null = null;
  private userVolume = 2.0; // Track user-set volume separately from flush ramps

  // Crossfade duration in seconds — short enough to be inaudible, long enough to kill clicks
  private static readonly CROSSFADE_S = 0.002; // 2ms
  // Samples for crossfade ramp at PLAYBACK_SAMPLE_RATE
  private static readonly CROSSFADE_SAMPLES = Math.ceil(0.002 * PLAYBACK_SAMPLE_RATE); // ~48 samples

  constructor(onPlayingChange?: (playing: boolean) => void) {
    this.ctx = new AudioContext({
      sampleRate: PLAYBACK_SAMPLE_RATE,
      latencyHint: 'interactive',
    });
    this.onPlayingChange = onPlayingChange;
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = this.userVolume;

    this.compressorNode = this.ctx.createDynamicsCompressor();
    this.compressorNode.threshold.value = -3;
    this.compressorNode.ratio.value = 4;
    this.compressorNode.knee.value = 10;
    this.compressorNode.attack.value = 0.003;
    this.compressorNode.release.value = 0.15;

    this.gainNode.connect(this.compressorNode);
    this.compressorNode.connect(this.ctx.destination);

    this.visibilityHandler = () => {
      if (document.visibilityState === "visible" && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", this.visibilityHandler);
  }

  async resume(): Promise<void> {
    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }
  }

  get isPlaying(): boolean {
    return this._isPlaying;
  }

  /**
   * Apply a short fade-in at the start and fade-out at the end of audio data
   * to eliminate clicks at chunk boundaries.
   */
  private applyCrossfade(data: Float32Array): void {
    const rampLen = Math.min(AudioPlaybackQueue.CROSSFADE_SAMPLES, Math.floor(data.length / 4));
    if (rampLen < 2) return;
    // Fade in
    for (let i = 0; i < rampLen; i++) {
      data[i] *= i / rampLen;
    }
    // Fade out
    for (let i = 0; i < rampLen; i++) {
      data[data.length - 1 - i] *= i / rampLen;
    }
  }

  enqueue(pcm16Base64: string, generation?: number): void {
    if (this.ctx.state === "closed") return;

    // Discard chunks from previous turns
    if (generation !== undefined && generation < this.turnGeneration) return;

    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    const pcm16 = base64ToArrayBuffer(pcm16Base64);
    const samples = new Int16Array(pcm16);
    let float32 = new Float32Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
      float32[i] = samples[i] / 32768;
    }

    // Trim leading silence from the first chunk of each turn
    if (this.isFirstChunkOfTurn) {
      const trimmed = trimLeadingSilence(float32);
      if (trimmed !== float32) {
        const newArr = new Float32Array(trimmed.length);
        newArr.set(trimmed);
        float32 = newArr;
      }
      this.isFirstChunkOfTurn = false;
    }

    if (float32.length === 0) return;

    const now = this.ctx.currentTime;
    // Detect a real scheduling gap (not just continuous back-to-back chunks).
    // For continuous chunks, schedule butt-to-butt with NO overlap and NO
    // per-chunk fade — the 24kHz PCM stream is continuous, boundaries align
    // sample-perfectly. Overlapping raw (un-faded) signals would sum and clip.
    const hasGap = this.nextStartTime === 0 || now > this.nextStartTime;

    // Only crossfade when there's a real boundary (start of turn, or after a
    // scheduling gap). Continuous in-stream chunks need no fade — they're
    // contiguous samples of the same waveform.
    if (hasGap) {
      this.applyCrossfade(float32);
    }

    const buffer = this.ctx.createBuffer(1, float32.length, PLAYBACK_SAMPLE_RATE);
    buffer.getChannelData(0).set(float32);

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gainNode);

    // For continuous chunks: schedule exactly at nextStartTime (no overlap, no gap).
    // For chunks after a gap: start at `now` and apply crossfade for click suppression.
    const startTime = hasGap ? Math.max(now, this.nextStartTime) : this.nextStartTime;
    this.nextStartTime = startTime + buffer.duration;

    source.start(startTime);
    this.activeSources.add(source);

    if (!this._isPlaying) {
      this._isPlaying = true;
      this.onPlayingChange?.(true);
    }

    if (this.checkIdleTimer) {
      clearTimeout(this.checkIdleTimer);
      this.checkIdleTimer = null;
    }

    source.onended = () => {
      this.activeSources.delete(source);
      if (this.activeSources.size === 0 && this._isPlaying) {
        // Short delay to allow for slight scheduling gaps between chunks
        this.checkIdleTimer = setTimeout(() => {
          if (this.activeSources.size === 0 && this._isPlaying) {
            this._isPlaying = false;
            this.onPlayingChange?.(false);
          }
        }, 25);
      }
    };
  }

  /** Mark start of new turn — trims silence and increments generation */
  markNewTurn(): void {
    this.isFirstChunkOfTurn = true;
    this.turnGeneration++;
  }

  /** Current turn generation — pass to enqueue() to enable stale-chunk rejection */
  get currentGeneration(): number {
    return this.turnGeneration;
  }

  /** Smoothly adjust playback volume (0.5–2.5). */
  setVolume(level: number): void {
    const clamped = Math.max(0.5, Math.min(2.5, level));
    this.userVolume = clamped;
    this.gainNode.gain.linearRampToValueAtTime(clamped, this.ctx.currentTime + 0.05);
  }

  get volume(): number {
    return this.userVolume;
  }

  /** Mute/unmute speaker output without losing the volume setting. */
  mute(): void {
    this.gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.05);
  }

  unmute(): void {
    this.gainNode.gain.linearRampToValueAtTime(this.userVolume, this.ctx.currentTime + 0.05);
  }

  /** 
   * Flush all queued/playing audio immediately.
   * Uses a fast gain ramp-down (5ms) before stopping sources to prevent a pop.
   */
  flush(): void {
    // Cancel any pending idle check
    if (this.checkIdleTimer) {
      clearTimeout(this.checkIdleTimer);
      this.checkIdleTimer = null;
    }

    // Increment generation so any in-flight enqueue calls from the old turn are rejected
    this.turnGeneration++;

    // Fast gain ramp to zero to prevent click/pop on abrupt stop
    const now = this.ctx.currentTime;
    const currentGain = this.gainNode.gain.value;
    this.gainNode.gain.cancelScheduledValues(now);
    this.gainNode.gain.setValueAtTime(currentGain, now);
    this.gainNode.gain.linearRampToValueAtTime(0, now + 0.005); // 5ms ramp

    // Stop all sources after the ramp completes
    setTimeout(() => {
      for (const source of this.activeSources) {
        try { source.stop(); } catch {}
      }
      this.activeSources.clear();
      this.nextStartTime = 0;
      this.isFirstChunkOfTurn = true;

      // Restore gain to user-set volume for next turn
      this.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
      this.gainNode.gain.setValueAtTime(this.userVolume, this.ctx.currentTime);
    }, 8); // slightly longer than the 5ms ramp

    if (this._isPlaying) {
      this._isPlaying = false;
      this.onPlayingChange?.(false);
    }
  }

  stop(): void {
    // Hard stop — no ramp needed since we're tearing down
    if (this.checkIdleTimer) clearTimeout(this.checkIdleTimer);
    for (const source of this.activeSources) {
      try { source.stop(); } catch {}
    }
    this.activeSources.clear();
    if (this._isPlaying) {
      this._isPlaying = false;
      this.onPlayingChange?.(false);
    }
    if (this.visibilityHandler) {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
      this.visibilityHandler = null;
    }
    if (this.ctx.state !== "closed") {
      this.ctx.close();
    }
  }
}
/** Convert Float32 [-1,1] to Int16 PCM, with optional gain multiplier */
function float32ToPcm16(float32: Float32Array, gain = 1.0): Int16Array {
  const pcm16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i] * gain));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return pcm16;
}

/** Base64 to ArrayBuffer */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
