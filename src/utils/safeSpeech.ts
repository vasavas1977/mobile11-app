/**
 * Safe speech synthesis helper.
 * - Cancels any in-progress utterance before starting a new one
 * - Picks the best available system voice (prefers cloud / Natural / Premium voices)
 * - Tracks speaking state via callback
 * - Returns a cancel function
 */

let currentUtterance: SpeechSynthesisUtterance | null = null;
let voicesReady: Promise<SpeechSynthesisVoice[]> | null = null;

const PREMIUM_NAME_HINTS = [
  'natural', 'neural', 'premium', 'enhanced', 'studio', 'wavenet',
  'google', 'siri', 'samantha', 'daniel', 'karen', 'moira',
];

function ensureVoicesLoaded(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return Promise.resolve([]);
  }
  if (voicesReady) return voicesReady;

  voicesReady = new Promise((resolve) => {
    const existing = window.speechSynthesis.getVoices();
    if (existing && existing.length > 0) {
      resolve(existing);
      return;
    }
    const handler = () => {
      const v = window.speechSynthesis.getVoices();
      if (v && v.length > 0) {
        window.speechSynthesis.removeEventListener('voiceschanged', handler);
        resolve(v);
      }
    };
    window.speechSynthesis.addEventListener('voiceschanged', handler);
    // Fallback timeout — resolve with whatever's available
    setTimeout(() => resolve(window.speechSynthesis.getVoices() || []), 1500);
  });
  return voicesReady;
}

function scoreVoice(voice: SpeechSynthesisVoice, langCode: string): number {
  const name = voice.name.toLowerCase();
  const lang = voice.lang.toLowerCase();
  const target = langCode.toLowerCase();
  const targetPrefix = target.split('-')[0];
  const voicePrefix = lang.split('-')[0];

  let score = 0;

  // Language match (mandatory baseline)
  if (lang === target) score += 1000;
  else if (voicePrefix === targetPrefix) score += 500;
  else return -1; // not a match

  // Prefer cloud / network voices (usually higher quality)
  if (!voice.localService) score += 200;

  // Prefer voices with premium-sounding names
  for (const hint of PREMIUM_NAME_HINTS) {
    if (name.includes(hint)) {
      score += 100;
      break;
    }
  }

  // Avoid obviously low-quality system voices
  if (name.includes('compact') || name.includes('eloquence')) score -= 150;

  // Slight preference for default voice when nothing else differentiates
  if (voice.default) score += 10;

  return score;
}

function pickBestVoice(voices: SpeechSynthesisVoice[], langCode: string): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  let best: SpeechSynthesisVoice | null = null;
  let bestScore = -1;
  for (const v of voices) {
    const s = scoreVoice(v, langCode);
    if (s > bestScore) {
      bestScore = s;
      best = v;
    }
  }
  return bestScore >= 0 ? best : null;
}

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  onStateChange?: (speaking: boolean) => void;
}

export function safeSpeakText(
  text: string,
  langCode: string,
  optionsOrCallback?: SpeakOptions | ((speaking: boolean) => void),
): () => void {
  if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return () => {};
  }

  const options: SpeakOptions =
    typeof optionsOrCallback === 'function'
      ? { onStateChange: optionsOrCallback }
      : (optionsOrCallback || {});

  const rate = options.rate ?? 0.95;
  const pitch = options.pitch ?? 1.0;

  // Always cancel any previous speech
  speechSynthesis.cancel();
  currentUtterance = null;

  const speakNow = (voice: SpeechSynthesisVoice | null) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = rate;
    utterance.pitch = pitch;
    if (voice) utterance.voice = voice;
    utterance.onstart = () => options.onStateChange?.(true);
    utterance.onend = () => {
      currentUtterance = null;
      options.onStateChange?.(false);
    };
    utterance.onerror = () => {
      currentUtterance = null;
      options.onStateChange?.(false);
    };
    currentUtterance = utterance;
    speechSynthesis.speak(utterance);
  };

  // Try to use the best available voice; fall back to default if voices not ready
  ensureVoicesLoaded().then((voices) => {
    speakNow(pickBestVoice(voices, langCode));
  }).catch(() => speakNow(null));

  return () => {
    speechSynthesis.cancel();
    currentUtterance = null;
    options.onStateChange?.(false);
  };
}

export function cancelSpeech() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  currentUtterance = null;
}
