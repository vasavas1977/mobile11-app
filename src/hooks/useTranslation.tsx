import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TranslationResult {
  text: string | null;
  error: string | null;
}

export function useTranslation() {
  const translate = useCallback(async (text: string, sourceLang: string, targetLang: string): Promise<TranslationResult> => {
    try {
      const { data, error } = await supabase.functions.invoke('translate-text', {
        body: { text, sourceLang, targetLang },
      });

      if (error) {
        console.error('Translation error:', error);
        return { text: null, error: 'Translation failed. Please try again.' };
      }

      if (data?.error) {
        return { text: null, error: data.error };
      }

      return { text: data?.translatedText || null, error: data?.translatedText ? null : 'No translation received.' };
    } catch (err) {
      console.error('Translation error:', err);
      return { text: null, error: 'Connection error. Check your internet and try again.' };
    }
  }, []);

  return { translate };
}
