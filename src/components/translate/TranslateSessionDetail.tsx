import { ArrowLeft } from 'lucide-react';
import { TranslateMessageCard } from './TranslateMessageCard';
import { TranslateMessage, SUPPORTED_LANGUAGES } from '@/types/translate';
import { FlagIcon } from '@/components/ui/FlagIcon';

interface TranslateSessionDetailProps {
  session: {
    id: string;
    source_language: string;
    target_language: string;
    messages: any[];
    message_count: number;
    created_at: string;
  };
  onBack: () => void;
}

export function TranslateSessionDetail({ session, onBack }: TranslateSessionDetailProps) {
  const srcLang = SUPPORTED_LANGUAGES.find(l => l.code === session.source_language);
  const tgtLang = SUPPORTED_LANGUAGES.find(l => l.code === session.target_language);

  const messages: TranslateMessage[] = (session.messages || []).map((m: any) => ({
    ...m,
    timestamp: new Date(m.timestamp),
  }));

  const dateStr = new Date(session.created_at).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-[100dvh] bg-white flex flex-col">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <FlagIcon countryCode={srcLang?.countryCode || ''} size="sm" />
              <span className="text-xs text-muted-foreground">⇄</span>
              <FlagIcon countryCode={tgtLang?.countryCode || ''} size="sm" />
              <span className="text-xs text-muted-foreground ml-1">{dateStr}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No messages in this session</p>
        ) : (
          messages.map(msg => (
            <TranslateMessageCard key={msg.id} message={msg} fontSize="default" />
          ))
        )}
      </div>
    </div>
  );
}
