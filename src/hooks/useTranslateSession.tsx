import { useState, useCallback, useEffect } from 'react';
import {
  TranslateLanguage,
  TranslateMessage,
  LayoutMode,
  InputMode,
  FontSizeLevel,
  ConversationMode,
  SUPPORTED_LANGUAGES,
} from '@/types/translate';

export type VoiceGender = 'male' | 'female';

const MODE_STORAGE_KEY = 'translate.mode';

function readStoredMode(): ConversationMode {
  if (typeof window === 'undefined') return 'practical';
  try {
    const v = localStorage.getItem(MODE_STORAGE_KEY);
    return v === 'natural' ? 'natural' : 'practical';
  } catch { return 'practical'; }
}

export function useTranslateSession() {
  const [myLanguage, setMyLanguage] = useState<TranslateLanguage>(SUPPORTED_LANGUAGES[0]); // English
  const [theirLanguage, setTheirLanguage] = useState<TranslateLanguage>(SUPPORTED_LANGUAGES[1]); // Thai
  const [myGender, setMyGender] = useState<VoiceGender>('female');
  const [theirGender, setTheirGender] = useState<VoiceGender>('female');
  const [messages, setMessages] = useState<TranslateMessage[]>([]);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('single');
  const [inputMode, setInputMode] = useState<InputMode>('hold-to-talk');
  const [fontSize, setFontSize] = useState<FontSizeLevel>('large');
  const [conversationMode, setConversationModeState] = useState<ConversationMode>(readStoredMode);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const setConversationMode = useCallback((m: ConversationMode) => {
    setConversationModeState(m);
    try { localStorage.setItem(MODE_STORAGE_KEY, m); } catch {}
  }, []);

  // Sync across tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === MODE_STORAGE_KEY && (e.newValue === 'practical' || e.newValue === 'natural')) {
        setConversationModeState(e.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const swapLanguages = useCallback(() => {
    setMyLanguage(prev => {
      setTheirLanguage(prev);
      return theirLanguage;
    });
    setMyGender(prevG => {
      setTheirGender(prevG);
      return theirGender;
    });
  }, [theirLanguage, theirGender]);

  const addMessage = useCallback((msg: TranslateMessage) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    myLanguage,
    setMyLanguage,
    theirLanguage,
    setTheirLanguage,
    myGender,
    setMyGender,
    theirGender,
    setTheirGender,
    messages,
    addMessage,
    clearMessages,
    layoutMode,
    setLayoutMode,
    inputMode,
    setInputMode,
    fontSize,
    setFontSize,
    isRecording,
    setIsRecording,
    isTranslating,
    setIsTranslating,
    swapLanguages,
    conversationMode,
    setConversationMode,
  };
}
