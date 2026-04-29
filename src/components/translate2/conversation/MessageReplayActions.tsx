import { Volume2, Rabbit, Copy, Check } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { safeSpeakText } from '@/utils/safeSpeech';

interface MessageReplayActionsProps {
  text: string;
  speechCode: string;
}

export function MessageReplayActions({ text, speechCode }: MessageReplayActionsProps) {
  const [copied, setCopied] = useState(false);

  const speak = useCallback((rate: number) => {
    if (!text) return;
    try {
      safeSpeakText(text, speechCode, { rate });
    } catch (e) {
      console.warn('TTS failed', e);
    }
  }, [text, speechCode]);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied');
      setTimeout(() => setCopied(false), 1200);
    } catch {
      toast.error('Copy failed');
    }
  }, [text]);

  return (
    <div className="flex items-center gap-1.5 mt-2">
      <button
        onClick={() => speak(1)}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-foreground/5 hover:bg-foreground/10 active:scale-95 transition-all text-[11px] font-semibold text-foreground/80"
        aria-label="Replay"
      >
        <Volume2 className="w-3 h-3" />
        Replay
      </button>
      <button
        onClick={() => speak(0.65)}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-foreground/5 hover:bg-foreground/10 active:scale-95 transition-all text-[11px] font-semibold text-foreground/80"
        aria-label="Replay slowly"
      >
        <Rabbit className="w-3 h-3" />
        Slow
      </button>
      <button
        onClick={copy}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-foreground/5 hover:bg-foreground/10 active:scale-95 transition-all text-[11px] font-semibold text-foreground/80"
        aria-label="Copy"
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}
