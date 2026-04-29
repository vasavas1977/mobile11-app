import { useState, useCallback } from 'react';
import { TranslateConversation } from '@/components/translate/TranslateConversation';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface Translate2ConversationProps {
  session: any;
  onPickLanguage: (which: 'my' | 'their') => void;
}

export function Translate2Conversation({ session, onPickLanguage }: Translate2ConversationProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentSpeaker, setCurrentSpeaker] = useState<'user' | 'other'>('user');

  const handleEndSession = useCallback(async () => {
    if (user && session.messages.length > 0) {
      try {
        const messagesJson = session.messages.map((m: any) => ({
          id: m.id,
          originalText: m.originalText,
          translatedText: m.translatedText,
          sourceLang: m.sourceLang,
          targetLang: m.targetLang,
          speaker: m.speaker,
          timestamp: m.timestamp.toISOString(),
        }));

        await supabase.from('translation_sessions').insert({
          user_id: user.id,
          source_language: session.myLanguage.code,
          target_language: session.theirLanguage.code,
          messages: messagesJson as any,
          message_count: session.messages.length,
          ended_at: new Date().toISOString(),
        });
      } catch (e) {
        console.error('Failed to save translation session:', e);
      }
    }

    session.clearMessages();
    setCurrentSpeaker('user');
    navigate('/translate2');
  }, [user, session, navigate]);

  return (
    <TranslateConversation
      {...session}
      currentSpeaker={currentSpeaker}
      setCurrentSpeaker={setCurrentSpeaker}
      onEndSession={handleEndSession}
      onLanguageTap={onPickLanguage}
    />
  );
}
