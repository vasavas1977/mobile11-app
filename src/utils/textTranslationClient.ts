/**
 * Stateless text translation client — REST-based, no WebSocket / Gemini Live dependency.
 * Supports request cancellation when the user retypes quickly.
 */

import { supabase } from '@/integrations/supabase/client';

export interface TranslateTextParams {
  text: string;
  sourceLang: string;
  targetLang: string;
  /** Optional conversation summary for context (not full history) */
  summary?: string;
}

export interface TranslateTextResult {
  translatedText: string | null;
  detectedSourceLang: string | null;
  error: string | null;
}

let activeController: AbortController | null = null;

/**
 * Translate text via the `translate-text` edge function (REST).
 * Automatically aborts any in-flight request when called again.
 */
export async function translateText(params: TranslateTextParams): Promise<TranslateTextResult> {
  // Abort previous request if still pending
  if (activeController) {
    activeController.abort();
    activeController = null;
  }

  const controller = new AbortController();
  activeController = controller;

  try {
    const { text, sourceLang, targetLang, summary } = params;

    if (!text.trim()) {
      return { translatedText: null, detectedSourceLang: null, error: 'No text provided.' };
    }

    const { data, error } = await supabase.functions.invoke('translate-text', {
      body: { text, sourceLang, targetLang, summary },
    });

    // If this request was aborted while waiting, discard result
    if (controller.signal.aborted) {
      return { translatedText: null, detectedSourceLang: null, error: null };
    }

    if (error) {
      console.error('[textTranslationClient] invoke error:', error);
      const msg = error?.message || '';
      if (/network|fetch|load failed/i.test(msg)) {
        return { translatedText: null, detectedSourceLang: null, error: 'No internet connection. Check your network and tap Retry.' };
      }
      return { translatedText: null, detectedSourceLang: null, error: 'Translation service is temporarily unavailable. Tap Retry.' };
    }

    if (data?.error) {
      // Map backend errors to user-friendly messages
      const backendError = data.error as string;
      if (/rate limit/i.test(backendError)) {
        return { translatedText: null, detectedSourceLang: null, error: 'Too many requests. Please wait a moment and try again.' };
      }
      if (/unavailable/i.test(backendError)) {
        return { translatedText: null, detectedSourceLang: null, error: 'Translation service is busy. Please try again shortly.' };
      }
      return { translatedText: null, detectedSourceLang: null, error: backendError };
    }

    return {
      translatedText: data?.translatedText ?? null,
      detectedSourceLang: data?.detectedSourceLang ?? null,
      error: data?.translatedText ? null : 'No translation received. Tap Retry to try again.',
    };
  } catch (err: any) {
    if (err?.name === 'AbortError' || controller.signal.aborted) {
      return { translatedText: null, detectedSourceLang: null, error: null };
    }
    console.error('[textTranslationClient] error:', err);
    return { translatedText: null, detectedSourceLang: null, error: 'No internet connection. Check your network and tap Retry.' };
  } finally {
    if (activeController === controller) {
      activeController = null;
    }
  }
}

/** Cancel any in-flight translation request. */
export function cancelTranslation(): void {
  if (activeController) {
    activeController.abort();
    activeController = null;
  }
}
