import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { FooterAiralo } from '@/components/landing/FooterAiralo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Mail, User, Headphones, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow, format } from 'date-fns';

interface Message {
  id: string;
  content: string;
  sender_type: string;
  sender_id: string | null;
  created_at: string;
  is_internal_note: boolean;
  metadata: Record<string, any> | null;
  attachments: any[] | null;
}

interface Conversation {
  id: string;
  subject: string | null;
  status: string;
  channel: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any> | null;
  contacts: {
    email: string | null;
    name: string | null;
  } | null;
}

export default function EmailConversationDetailPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const { data: conversation, isLoading: loadingConversation } = useQuery({
    queryKey: ['email-conversation', conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          subject,
          status,
          channel,
          created_at,
          updated_at,
          metadata,
          contacts:contact_id (
            email,
            name
          )
        `)
        .eq('id', conversationId!)
        .single();

      if (error) throw error;
      return data as Conversation;
    },
    enabled: !!conversationId && !!user
  });

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['email-conversation-messages', conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', conversationId!)
        .eq('is_internal_note', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!conversationId && !!user
  });

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      resolved: 'bg-green-500/10 text-green-500 border-green-500/20',
      closed: 'bg-muted text-muted-foreground'
    };

    return (
      <Badge variant="outline" className={colors[status] || ''}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5">
        <Header />
        <div className="flex items-center justify-center pt-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const isLoading = loadingConversation || loadingMessages;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/email-conversations')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold truncate">
                {conversation?.subject || 'Email Conversation'}
              </h1>
              <p className="text-muted-foreground text-sm">
                {conversation?.contacts?.email}
              </p>
            </div>
            {conversation && getStatusBadge(conversation.status)}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !conversation ? (
            <Card className="border-0 shadow-elevation">
              <CardContent className="py-12 text-center">
                <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Conversation not found</h3>
                <p className="text-muted-foreground mb-4">
                  This conversation may have been deleted or you don't have access to it.
                </p>
                <Button onClick={() => navigate('/email-conversations')}>
                  Back to Conversations
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Conversation Info */}
              <Card className="border-0 shadow-elevation">
                <CardContent className="py-4">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">From:</span>
                      <span>{conversation.contacts?.email || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Started:</span>
                      <span>{format(new Date(conversation.created_at), 'PPp')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Messages Thread */}
              <Card className="border-0 shadow-elevation">
                <CardHeader>
                  <CardTitle className="text-lg">Conversation Thread</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-[600px]">
                    <div className="space-y-6">
                      {messages.map((message) => {
                        const isCustomer = message.sender_type === 'customer';
                        const isAgent = message.sender_type === 'agent';
                        
                        return (
                          <div
                            key={message.id}
                            className={`flex gap-3 ${isCustomer ? '' : 'flex-row-reverse'}`}
                          >
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarFallback className={isAgent ? 'bg-primary/20 text-primary' : 'bg-muted'}>
                                {isAgent ? <Headphones className="h-4 w-4" /> : <User className="h-4 w-4" />}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`flex-1 max-w-[80%] ${isCustomer ? '' : 'text-right'}`}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">
                                  {isAgent ? 'Support Team' : conversation.contacts?.name || 'You'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                                </span>
                              </div>
                              <div
                                className={`rounded-lg p-4 text-sm ${
                                  isAgent
                                    ? 'bg-primary/10 text-foreground'
                                    : 'bg-muted text-foreground'
                                } ${isCustomer ? 'rounded-tl-none' : 'rounded-tr-none'}`}
                              >
                                {/* Email headers if present */}
                                {message.metadata?.email_from && (
                                  <div className="text-xs text-muted-foreground mb-2 pb-2 border-b border-border/50">
                                    <div>From: {message.metadata.email_from}</div>
                                    {message.metadata.email_subject && (
                                      <div>Subject: {message.metadata.email_subject}</div>
                                    )}
                                  </div>
                                )}
                                <div className="whitespace-pre-wrap break-words">
                                  {message.content}
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {format(new Date(message.created_at), 'PPp')}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
      
      <FooterAiralo />
    </div>
  );
}
