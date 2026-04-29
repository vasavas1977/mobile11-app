import { useState, useEffect } from 'react';
import { ArrowLeft, MessageSquare, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SUPPORTED_LANGUAGES } from '@/types/translate';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { TranslateSessionDetail } from './TranslateSessionDetail';
import { TranslateHeader } from './TranslateHeader';

interface TranslationSession {
  id: string;
  source_language: string;
  target_language: string;
  messages: any[];
  message_count: number;
  created_at: string;
  ended_at: string | null;
}

interface TranslateHistoryProps {
  onBack: () => void;
}

export function TranslateHistory({ onBack }: TranslateHistoryProps) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<TranslationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<TranslationSession | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchSessions = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('translation_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      setSessions((data as TranslationSession[]) || []);
      setLoading(false);
    };
    fetchSessions();
  }, [user]);

  if (selectedSession) {
    return (
      <TranslateSessionDetail
        session={selectedSession}
        onBack={() => setSelectedSession(null)}
      />
    );
  }

  const getLang = (code: string) => SUPPORTED_LANGUAGES.find(l => l.code === code);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  };

  const getPreview = (messages: any[]) => {
    if (!messages || messages.length === 0) return 'No messages';
    const first = messages[0];
    return first?.originalText?.slice(0, 60) || 'No preview';
  };

  return (
    <div className="min-h-[100dvh] bg-white">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-base font-semibold text-foreground">Translation History</h1>
        </div>
      </header>

      <div className="px-4 py-4">
        {!user && (
          <div className="text-center py-12">
            <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Sign in to view your translation history</p>
          </div>
        )}

        {user && loading && (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {user && !loading && sessions.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">No conversations yet</p>
            <p className="text-xs text-muted-foreground">Your translation sessions will appear here</p>
          </div>
        )}

        {user && !loading && sessions.length > 0 && (
          <div className="space-y-2">
            {sessions.map(session => {
              const srcLang = getLang(session.source_language);
              const tgtLang = getLang(session.target_language);
              return (
                <button
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className="w-full text-left p-4 rounded-2xl border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-1.5">
                      <FlagIcon countryCode={srcLang?.countryCode || ''} size="sm" />
                      <span className="text-xs font-medium text-foreground">{srcLang?.name || session.source_language}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">→</span>
                    <div className="flex items-center gap-1.5">
                      <FlagIcon countryCode={tgtLang?.countryCode || ''} size="sm" />
                      <span className="text-xs font-medium text-foreground">{tgtLang?.name || session.target_language}</span>
                    </div>
                    <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatDate(session.created_at)}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{getPreview(session.messages as any[])}</p>
                  <p className="text-xs text-muted-foreground mt-1">{session.message_count} message{session.message_count !== 1 ? 's' : ''}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
