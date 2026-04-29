import { useRef, useEffect, useState, useCallback } from 'react';
import { TranslateMessage, TranslateLanguage, LayoutMode, InputMode, FontSizeLevel, OutputMode } from '@/types/translate';
import { TranslateMessageCard } from './TranslateMessageCard';
import { TranslateControls } from './TranslateControls';
import { QuickPhraseTray } from './QuickPhraseTray';
import { SettingsSheet } from './SettingsSheet';
import { StreamingMessageCard } from './StreamingMessageCard';
import { FaceToFaceLayout } from './FaceToFaceLayout';
import { SideBySideLayout } from './SideBySideLayout';
import { TranslateHeader } from './TranslateHeader';
import { useTranslation } from '@/hooks/useTranslation';
import { useRealtimeTranslation } from '@/hooks/useRealtimeTranslation';

interface TranslateConversationProps {
  myLanguage: TranslateLanguage;
  theirLanguage: TranslateLanguage;
  messages: TranslateMessage[];
  addMessage: (msg: TranslateMessage) => void;
  clearMessages: () => void;
  layoutMode: LayoutMode;
  setLayoutMode: (m: LayoutMode) => void;
  inputMode: InputMode;
  setInputMode: (m: InputMode) => void;
  fontSize: FontSizeLevel;
  setFontSize: (s: FontSizeLevel) => void;
  isRecording: boolean;
  setIsRecording: (r: boolean) => void;
  isTranslating: boolean;
  setIsTranslating: (t: boolean) => void;
  onEndSession: () => void;
  onLanguageTap: (which: 'my' | 'their') => void;
}

export function TranslateConversation(props: TranslateConversationProps) {
  const {
    myLanguage, theirLanguage, messages, addMessage, clearMessages,
    layoutMode, setLayoutMode, inputMode, setInputMode,
    fontSize, setFontSize, isRecording, setIsRecording,
    isTranslating, setIsTranslating, onEndSession, onLanguageTap,
  } = props;

  const [showSettings, setShowSettings] = useState(false);
  const [showPhrases, setShowPhrases] = useState(false);
  const [outputMode, setOutputMode] = useState<OutputMode>('voice');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { translate } = useTranslation();

  const {
    startSession,
    stopSession,
    isConnected,
    isConnecting,
    isAiSpeaking,
    audioLevel,
    streamingInput,
    streamingOutput,
  } = useRealtimeTranslation({ addMessage, messages });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleStartRecording = useCallback(async () => {
    try {
      // Start a single bidirectional session — no speaker switching needed
      const started = await startSession(
        myLanguage.name,
        theirLanguage.name,
        myLanguage.speechCode,
        theirLanguage.speechCode,
        outputMode,
        true, // bidirectional
      );
      setIsRecording(Boolean(started));
    } catch {
      setIsRecording(false);
    }
  }, [startSession, setIsRecording, myLanguage, theirLanguage, outputMode]);

  const handleStopRecording = useCallback(() => {
    setIsRecording(false);
    stopSession();
  }, [stopSession, setIsRecording]);

  const handleOutputModeChange = useCallback((mode: OutputMode) => {
    setOutputMode(mode);
    const shouldRestart = isConnected || isConnecting || isRecording;
    if (shouldRestart) {
      setIsRecording(false);
      stopSession();
      setTimeout(async () => {
        try {
          const started = await startSession(
            myLanguage.name,
            theirLanguage.name,
            myLanguage.speechCode,
            theirLanguage.speechCode,
            mode,
            true,
          );
          setIsRecording(Boolean(started));
        } catch {
          setIsRecording(false);
        }
      }, 300);
    }
  }, [startSession, myLanguage, theirLanguage, isConnected, isConnecting, isRecording, setIsRecording, stopSession]);

  const handleQuickPhrase = useCallback(async (text: string) => {
    setIsTranslating(true);
    const result = await translate(text, myLanguage.name, theirLanguage.name);
    setIsTranslating(false);

    if (result.text) {
      addMessage({
        id: crypto.randomUUID(),
        originalText: text,
        translatedText: result.text,
        sourceLang: myLanguage.code,
        targetLang: theirLanguage.code,
        speaker: 'user',
        timestamp: new Date(),
      });

      const utterance = new SpeechSynthesisUtterance(result.text);
      utterance.lang = theirLanguage.speechCode;
      speechSynthesis.speak(utterance);
    }
  }, [translate, myLanguage, theirLanguage, addMessage, setIsTranslating]);

  return (
    <div className="flex flex-col h-[100dvh] bg-white">
      <TranslateHeader
        myLanguage={myLanguage}
        theirLanguage={theirLanguage}
        onLanguageTap={onLanguageTap}
      />

      {/* Content area — no speaker toggle */}
      {layoutMode === 'face-to-face' ? (
        <FaceToFaceLayout messages={messages} fontSize={fontSize} myLangCode={myLanguage.code} theirLangCode={theirLanguage.code}
          streamingInput={streamingInput} streamingOutput={streamingOutput} />
      ) : layoutMode === 'side-by-side' ? (
        <SideBySideLayout messages={messages} fontSize={fontSize} myLangCode={myLanguage.code} theirLangCode={theirLanguage.code}
          streamingInput={streamingInput} streamingOutput={streamingOutput} />
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && !streamingInput && !streamingOutput && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-muted-foreground text-sm">Tap the microphone to start</p>
              <p className="text-muted-foreground text-xs mt-1">Speak either language — we'll auto-detect</p>
            </div>
          )}
          {messages.map(msg => (
            <TranslateMessageCard key={msg.id} message={msg} fontSize={fontSize} />
          ))}
          {(streamingInput || streamingOutput) && (
            <StreamingMessageCard
              inputText={streamingInput}
              outputText={streamingOutput}
              sourceLangCode={myLanguage.code}
              targetLangCode={theirLanguage.code}
              fontSize={fontSize}
            />
          )}
        </div>
      )}

      {/* Controls */}
      <div className="relative">
        <QuickPhraseTray open={showPhrases} onClose={() => setShowPhrases(false)} onSelect={handleQuickPhrase} />
        <TranslateControls
          isRecording={isRecording || isConnected}
          isTranslating={isTranslating || isConnecting}
          inputMode={inputMode}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          onToggleSettings={() => setShowSettings(true)}
          onTogglePhrases={() => setShowPhrases(p => !p)}
          isAiSpeaking={isAiSpeaking}
          audioLevel={audioLevel}
          isLive={isConnected}
          outputMode={outputMode}
        />
      </div>

      <SettingsSheet
        open={showSettings}
        onClose={() => setShowSettings(false)}
        layoutMode={layoutMode}
        onLayoutChange={setLayoutMode}
        inputMode={inputMode}
        onInputModeChange={setInputMode}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        outputMode={outputMode}
        onOutputModeChange={handleOutputModeChange}
        onEndSession={() => { setShowSettings(false); handleStopRecording(); onEndSession(); }}
      />
    </div>
  );
}
