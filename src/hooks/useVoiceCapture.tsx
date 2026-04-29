import { useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Browser SpeechRecognition fallback
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export function useVoiceCapture() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const browserTranscriptRef = useRef<string>('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [useBrowserSTT, setUseBrowserSTT] = useState(false);

  const startCapture = useCallback(async (languageCode?: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true }
      });
      streamRef.current = stream;
      audioChunksRef.current = [];
      browserTranscriptRef.current = '';

      // Start MediaRecorder for cloud STT
      if (!useBrowserSTT) {
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        mediaRecorder.start();
      }

      // Also start browser SpeechRecognition as fallback / primary
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        if (languageCode) recognition.lang = languageCode;
        recognitionRef.current = recognition;

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = 0; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              transcript += event.results[i][0].transcript + ' ';
            }
          }
          browserTranscriptRef.current = transcript.trim();
        };
        recognition.onerror = () => {};
        recognition.start();
      }

      setIsCapturing(true);
    } catch (err) {
      console.error('Mic access failed:', err);
      toast.error('Microphone access required for voice translation');
    }
  }, [useBrowserSTT]);

  const stopCapture = useCallback(async (languageCode: string): Promise<string | null> => {
    // Stop browser recognition
    try { recognitionRef.current?.stop(); } catch {}

    // Set language on recognition if available
    if (recognitionRef.current) {
      recognitionRef.current.lang = languageCode;
    }

    // If using browser STT directly, just return its result
    if (useBrowserSTT) {
      setIsCapturing(false);
      streamRef.current?.getTracks().forEach(t => t.stop());
      // Give a small delay for final results
      await new Promise(r => setTimeout(r, 300));
      const text = browserTranscriptRef.current;
      return text || null;
    }

    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        setIsCapturing(false);
        // Fallback to browser transcript
        const fallback = browserTranscriptRef.current;
        resolve(fallback || null);
        return;
      }

      mediaRecorder.onstop = async () => {
        setIsCapturing(false);
        streamRef.current?.getTracks().forEach(t => t.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size < 1000) {
          // Try browser fallback
          const fallback = browserTranscriptRef.current;
          resolve(fallback || null);
          return;
        }

        try {
          const arrayBuffer = await audioBlob.arrayBuffer();
          const uint8 = new Uint8Array(arrayBuffer);
          let binary = '';
          uint8.forEach(b => binary += String.fromCharCode(b));
          const base64 = btoa(binary);

          const langMap: Record<string, string> = {
            'en-US': 'en', 'th-TH': 'th', 'ja-JP': 'ja', 'ko-KR': 'ko',
            'zh-CN': 'zh', 'fr-FR': 'fr', 'de-DE': 'de', 'es-ES': 'es',
            'pt-BR': 'pt', 'ar-SA': 'ar', 'id-ID': 'id', 'ms-MY': 'ms',
            'ru-RU': 'ru', 'it-IT': 'it', 'nl-NL': 'nl', 'he-IL': 'he',
            'pl-PL': 'pl',
          };

          const { data, error } = await supabase.functions.invoke('transcribe-voice-chunk', {
            body: { audio_base64: base64, language: langMap[languageCode] || 'en' },
          });

          if (error || !data?.text) {
            console.warn('Cloud STT failed, switching to browser STT fallback');
            setUseBrowserSTT(true);
            // Use browser transcript as fallback
            const fallback = browserTranscriptRef.current;
            resolve(fallback || null);
            return;
          }

          resolve(data.text);
        } catch (err) {
          console.error('Transcription failed, using browser fallback:', err);
          setUseBrowserSTT(true);
          const fallback = browserTranscriptRef.current;
          resolve(fallback || null);
        }
      };

      mediaRecorder.stop();
    });
  }, [useBrowserSTT]);

  return { startCapture, stopCapture, isCapturing };
}
