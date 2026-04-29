import { useState } from 'react';
import { useTranslateSession } from '@/hooks/useTranslateSession';
import { TranslateWelcome } from '@/components/translate/TranslateWelcome';
import { TranslateConversation } from '@/components/translate/TranslateConversation';
import { TranslateHistory } from '@/components/translate/TranslateHistory';
import { LanguagePickerDrawer } from '@/components/translate/LanguagePickerDrawer';
import { TranslateHeader } from '@/components/translate/TranslateHeader';
import { TranslateLanguage } from '@/types/translate';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type Screen = 'welcome' | 'conversation' | 'history';

export default function TranslatePage() {
  const session = useTranslateSession();
  const { user } = useAuth();
  const [screen, setScreen] = useState<Screen>('welcome');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'my' | 'their'>('my');

  const openPicker = (which: 'my' | 'their') => {
    setPickerTarget(which);
    setPickerOpen(true);
  };

  const handlePickLanguage = (lang: TranslateLanguage) => {
    if (pickerTarget === 'my') {
      session.setMyLanguage(lang);
    } else {
      session.setTheirLanguage(lang);
    }
  };

  const handleEndSession = async () => {
    if (user && session.messages.length > 0) {
      try {
        const messagesJson = session.messages.map(m => ({
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
    setScreen('welcome');
  };

  return (
    <>
      <Helmet>
        <title>Mobile11 Translate — Realtime Travel Translation</title>
        <meta name="description" content="Communicate anywhere with Mobile11 Realtime Translation. Voice-powered travel translator for 17+ languages." />
      </Helmet>

      {screen === 'welcome' ? (
        <div className="min-h-[100dvh] bg-white">
          <TranslateHeader myLanguage={session.myLanguage} theirLanguage={session.theirLanguage} showLanguages={false} />
          <TranslateWelcome
            myLanguage={session.myLanguage}
            theirLanguage={session.theirLanguage}
            onSwap={session.swapLanguages}
            onPickLanguage={openPicker}
            onStart={() => setScreen('conversation')}
            onHistory={() => setScreen('history')}
          />
        </div>
      ) : screen === 'history' ? (
        <TranslateHistory onBack={() => setScreen('welcome')} />
      ) : (
        <TranslateConversation
          {...session}
          onEndSession={handleEndSession}
          onLanguageTap={openPicker}
        />
      )}

      <LanguagePickerDrawer
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handlePickLanguage}
        currentCode={pickerTarget === 'my' ? session.myLanguage.code : session.theirLanguage.code}
        title={pickerTarget === 'my' ? 'Your Language' : 'Their Language'}
      />
    </>
  );
}
