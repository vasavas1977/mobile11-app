import { useState, useCallback, useEffect } from 'react';
import { TranslateDebugOverlay } from '@/components/translate/TranslateDebugOverlay';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeTranslation } from '@/hooks/useRealtimeTranslation';
import { TranslationErrorInline } from '../TranslationErrorInline';
import { useSwipeModeNavigation } from '@/hooks/useSwipeModeNavigation';
import { toast } from 'sonner';
import {
  TranslateLanguage,
  TranslateMessage,
  LayoutMode,
  FontSizeLevel,
  OutputMode,
  ConversationMode,
} from '@/types/translate';
import { ConversationHeader } from './ConversationHeader';
import { ConversationEmptyState } from './ConversationEmptyState';
import { ConversationMicButton } from './ConversationMicButton';
import { ConversationStreamingArea } from './ConversationStreamingArea';
import { ConversationMessageList } from './ConversationMessageList';
import { ConversationFaceToFace } from './ConversationFaceToFace';
import { ConversationLayoutToggle } from './ConversationLayoutToggle';
import { SideBySideLayout } from '@/components/translate/SideBySideLayout';
import { ModeToggle } from './ModeToggle';
import { PracticalConversationView } from './PracticalConversationView';

interface LiveConversationScreenProps {
  myLanguage: TranslateLanguage;
  theirLanguage: TranslateLanguage;
  setTheirLanguage: (l: TranslateLanguage) => void;
  myGender: 'male' | 'female';
  theirGender: 'male' | 'female';
  setMyGender: (g: 'male' | 'female') => void;
  setTheirGender: (g: 'male' | 'female') => void;
  messages: TranslateMessage[];
  addMessage: (msg: TranslateMessage) => void;
  clearMessages: () => void;
  swapLanguages: () => void;
  layoutMode: LayoutMode;
  setLayoutMode: (m: LayoutMode) => void;
  fontSize: FontSizeLevel;
  setFontSize: (s: FontSizeLevel) => void;
  onPickLanguage: (which: 'my' | 'their') => void;
  conversationMode: ConversationMode;
  setConversationMode: (m: ConversationMode) => void;
}

export function LiveConversationScreen({
  myLanguage,
  theirLanguage,
  setTheirLanguage,
  myGender,
  theirGender,
  setMyGender,
  setTheirGender,
  messages,
  addMessage,
  clearMessages,
  swapLanguages,
  layoutMode,
  setLayoutMode,
  fontSize,
  setFontSize,
  onPickLanguage,
  conversationMode,
  setConversationMode,
}: LiveConversationScreenProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [outputMode] = useState<OutputMode>('voice');

  const {
    startSession,
    stopSession,
    isConnected,
    isConnecting,
    isAiSpeaking,
    isReconnecting,
    audioLevel,
    streamingInput,
    streamingOutput,
    connectionError,
    errorType,
    clearError,
    isMuted,
    toggleMute,
    isSpeakerMuted,
    toggleSpeaker,
    autoRetryExhausted,
  } = useRealtimeTranslation({ addMessage, messages });

  const { swipeHandlers } = useSwipeModeNavigation({ disabled: isConnected });

  const handleStart = useCallback(async () => {
    clearError();
    await startSession(
      myLanguage.name,
      theirLanguage.name,
      myLanguage.speechCode,
      theirLanguage.speechCode,
      outputMode,
      // Bidirectional: either side can speak; script detection + foreign-script guard
      // in useRealtimeTranslation prevent French/Korean drift.
      true,
      { sourceGender: myGender, targetGender: theirGender },
    );
  }, [startSession, clearError, myLanguage, theirLanguage, outputMode, myGender, theirGender]);

  const handleStop = useCallback(() => {
    stopSession();
  }, [stopSession]);

  const handleEndSession = useCallback(async () => {
    stopSession();
    if (user && messages.length > 0) {
      try {
        const messagesJson = messages.map(m => ({
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
          source_language: myLanguage.code,
          target_language: theirLanguage.code,
          messages: messagesJson as any,
          message_count: messages.length,
          ended_at: new Date().toISOString(),
        });
      } catch (e) {
        console.error('Failed to save translation session:', e);
      }
    }
    clearMessages();
    navigate('/translate2');
  }, [stopSession, user, messages, clearMessages, navigate, myLanguage, theirLanguage]);

  // Auto-switch to text mode after retries exhausted (3s delay so user sees message)
  useEffect(() => {
    if (!autoRetryExhausted) return;
    const timer = setTimeout(() => {
      stopSession();
      clearError();
      navigate('/translate2');
      toast('Using text mode instead');
    }, 3000);
    return () => clearTimeout(timer);
  }, [autoRetryExhausted, stopSession, clearError, navigate]);

  // When user toggles to Practical mode, cleanly stop any active Gemini Live session
  useEffect(() => {
    if (conversationMode === 'practical' && (isConnected || isConnecting)) {
      stopSession();
    }
  }, [conversationMode, isConnected, isConnecting, stopSession]);

  const handleModeChange = useCallback((m: ConversationMode) => {
    if (m === conversationMode) return;
    if (isConnected || isConnecting) stopSession();
    setConversationMode(m);
  }, [conversationMode, isConnected, isConnecting, stopSession, setConversationMode]);

  const isEmpty = messages.length === 0 && !streamingInput && !streamingOutput;
  const isStreaming = !!(streamingInput || streamingOutput);
  const isFaceToFace = layoutMode === 'face-to-face';
  const isSideBySide = layoutMode === 'side-by-side';

  const micControls = (
    <ConversationMicButton
      isLive={isConnected}
      isConnecting={isConnecting}
      isAiSpeaking={isAiSpeaking}
      isReconnecting={isReconnecting}
      audioLevel={audioLevel}
      isMuted={isMuted}
      isSpeakerMuted={isSpeakerMuted}
      hasError={!!connectionError}
      onStart={handleStart}
      onStop={handleStop}
      onToggleMute={toggleMute}
      onToggleSpeaker={toggleSpeaker}
    />
  );

  return (
    <div className="flex flex-col h-[100dvh] bg-white" {...swipeHandlers}>
      <TranslateDebugOverlay />
      <ConversationHeader
        myLanguage={myLanguage}
        theirLanguage={theirLanguage}
        myGender={myGender}
        theirGender={theirGender}
        onChangeMyGender={setMyGender}
        onChangeTheirGender={setTheirGender}
        onSwap={swapLanguages}
        onPickLanguage={onPickLanguage}
        isLive={isConnected}
        isConnecting={isConnecting}
        isReconnecting={isReconnecting}
      />

      <ModeToggle mode={conversationMode} onChange={handleModeChange} />

      {conversationMode === 'practical' ? (
        <PracticalConversationView
          myLanguage={myLanguage}
          theirLanguage={theirLanguage}
          setTheirLanguage={setTheirLanguage}
          messages={messages}
          addMessage={addMessage}
          swapLanguages={swapLanguages}
          fontSize={fontSize}
          setFontSize={setFontSize}
        />
      ) : (
        <>
      {/* Layout toggle */}
      {!isFaceToFace && (
        <div className="flex items-center justify-center py-2 border-b border-gray-100/40 bg-white">
          <ConversationLayoutToggle layoutMode={layoutMode} onLayoutChange={setLayoutMode} />
        </div>
      )}

      {/* Content */}
      {isFaceToFace ? (
        <>
          <ConversationFaceToFace
            messages={messages}
            fontSize={fontSize}
            myLanguage={myLanguage}
            theirLanguage={theirLanguage}
            streamingInput={streamingInput}
            streamingOutput={streamingOutput}
          />
          {/* Floating mic */}
          <div className="absolute bottom-0 left-0 right-0 z-20 flex justify-center pb-6 safe-bottom">
            {micControls}
          </div>
          {/* Layout toggle overlay */}
          <div className="absolute top-[120px] right-3 z-20">
            <ConversationLayoutToggle layoutMode={layoutMode} onLayoutChange={setLayoutMode} />
          </div>
        </>
      ) : isSideBySide ? (
        <>
          <SideBySideLayout
            messages={messages}
            fontSize={fontSize}
            myLangCode={myLanguage.code}
            theirLangCode={theirLanguage.code}
            streamingInput={streamingInput}
            streamingOutput={streamingOutput}
          />
          <div className="bg-white/98 backdrop-blur-lg border-t border-gray-100/60 px-4 pt-5 pb-3 safe-bottom">
            {micControls}
          </div>
        </>
      ) : (
        <>
          {isEmpty ? (
            <ConversationEmptyState />
          ) : (
            <ConversationMessageList messages={messages} fontSize={fontSize}>
              {isStreaming && (
                <ConversationStreamingArea
                  inputText={streamingInput}
                  outputText={streamingOutput}
                  sourceLangCode={myLanguage.code}
                  targetLangCode={theirLanguage.code}
                  fontSize={fontSize}
                />
              )}
            </ConversationMessageList>
          )}

          {/* Error — single calm surface, hidden during auto-retry */}
          {connectionError && !isReconnecting && errorType !== 'reconnecting' && (
            <div className="px-4 py-2">
              <TranslationErrorInline
                message={connectionError}
                errorType={errorType}
                onRetry={handleStart}
                onSwitchToText={() => {
                  stopSession();
                  clearError();
                  navigate('/translate2');
                  toast('Using text mode instead');
                }}
              />
            </div>
          )}

          {/* Bottom controls */}
          <div className="bg-white/98 backdrop-blur-lg border-t border-gray-100/60 px-4 pt-5 pb-3 safe-bottom">
            {micControls}
          </div>
        </>
      )}
        </>
      )}
    </div>
  );
}
