import { Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import { useTranslateSession } from '@/hooks/useTranslateSession';
import { useRecentLanguages } from '@/hooks/useRecentLanguages';
import { useTripOnboarding } from '@/hooks/useTripOnboarding';
import { Translate2Home } from '@/components/translate2/Translate2Home';
import { LiveConversationScreen } from '@/components/translate2/conversation/LiveConversationScreen';
import { QuickPhraseScreen } from '@/components/translate2/QuickPhraseScreen';
import { TypeTranslateScreen } from '@/components/translate2/TypeTranslateScreen';
import { ShowModeScreen } from '@/components/translate2/ShowModeScreen';
import { AddressHandoffScreen } from '@/components/translate2/AddressHandoffScreen';
import { Translate2Settings } from '@/components/translate2/Translate2Settings';
import { Translate2History } from '@/components/translate2/Translate2History';
import { LanguagePickerSheet } from '@/components/translate/picker/LanguagePickerSheet';
import { FirstUseTripSetupSheet } from '@/components/translate2/onboarding/FirstUseTripSetupSheet';
import { TranslateLanguage, SUPPORTED_LANGUAGES } from '@/types/translate';
import { Helmet } from 'react-helmet-async';

export default function Translate2Page() {
  const session = useTranslateSession();
  const { recents, addRecent } = useRecentLanguages();
  const { showFirstUseSetup, completeOnboarding, dismissSetup } = useTripOnboarding();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'my' | 'their'>('my');
  const [recentPhrases, setRecentPhrases] = useState<{ original: string; translated: string; targetLang: string }[]>([]);
  const [setupOpen, setSetupOpen] = useState(showFirstUseSetup);

  const openPicker = (which: 'my' | 'their') => {
    setPickerTarget(which);
    setPickerOpen(true);
  };

  const handlePickLanguage = (lang: TranslateLanguage) => {
    if (pickerTarget === 'my') session.setMyLanguage(lang);
    else session.setTheirLanguage(lang);
    addRecent(lang);
  };

  const addRecentPhrase = (phrase: { original: string; translated: string; targetLang: string }) => {
    setRecentPhrases(prev => [phrase, ...prev.filter(p => p.original !== phrase.original)].slice(0, 5));
  };

  const handleSetupComplete = (destination: string, myLangCode: string, theirLangCode: string) => {
    completeOnboarding(destination, myLangCode, theirLangCode);
    const myLang = SUPPORTED_LANGUAGES.find(l => l.code === myLangCode);
    const theirLang = SUPPORTED_LANGUAGES.find(l => l.code === theirLangCode);
    if (myLang) session.setMyLanguage(myLang);
    if (theirLang) session.setTheirLanguage(theirLang);
    setSetupOpen(false);
  };

  const handleSetupDismiss = () => {
    dismissSetup();
    setSetupOpen(false);
  };

  return (
    <>
      <Helmet>
        <title>Mobile11 Translate — Premium Travel Translation</title>
        <meta name="description" content="Premium travel translation with voice conversation, quick phrases, type-to-translate and show mode." />
      </Helmet>

      <Routes>
        <Route index element={
          <Translate2Home
            session={session}
            onPickLanguage={openPicker}
            recentPhrases={recentPhrases}
            onShowSetup={() => setSetupOpen(true)}
          />
        } />
        <Route path="conversation" element={
          <LiveConversationScreen
            myLanguage={session.myLanguage}
            theirLanguage={session.theirLanguage}
            setTheirLanguage={session.setTheirLanguage}
            myGender={session.myGender}
            theirGender={session.theirGender}
            setMyGender={session.setMyGender}
            setTheirGender={session.setTheirGender}
            messages={session.messages}
            addMessage={session.addMessage}
            clearMessages={session.clearMessages}
            swapLanguages={session.swapLanguages}
            layoutMode={session.layoutMode}
            setLayoutMode={session.setLayoutMode}
            fontSize={session.fontSize}
            setFontSize={session.setFontSize}
            onPickLanguage={openPicker}
            conversationMode={session.conversationMode}
            setConversationMode={session.setConversationMode}
          />
        } />
        <Route path="phrases" element={
          <QuickPhraseScreen
            myLanguage={session.myLanguage}
            theirLanguage={session.theirLanguage}
            onAddRecent={addRecentPhrase}
          />
        } />
        <Route path="type" element={
          <TypeTranslateScreen
            myLanguage={session.myLanguage}
            theirLanguage={session.theirLanguage}
            onSwap={session.swapLanguages}
            onPickLanguage={openPicker}
            onAddRecent={addRecentPhrase}
          />
        } />
        <Route path="address" element={
          <AddressHandoffScreen
            myLanguage={session.myLanguage}
            theirLanguage={session.theirLanguage}
            onPickLanguage={openPicker}
          />
        } />
        <Route path="show" element={
          <ShowModeScreen
            myLanguage={session.myLanguage}
            theirLanguage={session.theirLanguage}
            onPickLanguage={openPicker}
          />
        } />
        <Route path="settings" element={
          <Translate2Settings
            layoutMode={session.layoutMode}
            onLayoutChange={session.setLayoutMode}
            inputMode={session.inputMode}
            onInputModeChange={session.setInputMode}
            fontSize={session.fontSize}
            onFontSizeChange={session.setFontSize}
          />
        } />
        <Route path="history" element={<Translate2History />} />
      </Routes>

      <LanguagePickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handlePickLanguage}
        currentCode={pickerTarget === 'my' ? session.myLanguage.code : session.theirLanguage.code}
        title={pickerTarget === 'my' ? 'Your Language' : 'Their Language'}
        recentLanguages={recents}
      />

      <FirstUseTripSetupSheet
        open={setupOpen}
        onComplete={handleSetupComplete}
        onDismiss={handleSetupDismiss}
      />
    </>
  );
}
