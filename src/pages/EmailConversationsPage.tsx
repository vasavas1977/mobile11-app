import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { FooterAiralo } from '@/components/landing/FooterAiralo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Mail, Search, ArrowLeft, Clock, MessageSquare } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface EmailConversation {
  id: string;
  subject: string | null;
  status: string;
  channel: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any> | null;
  contact: {
    email: string | null;
    name: string | null;
  } | null;
  message_count: number;
  last_message: string | null;
}

export default function EmailConversationsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: profile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['email-conversations', user?.id, profile?.email],
    queryFn: async () => {
      // Get conversations where contact email matches user's profile email
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
        .eq('channel', 'email')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Get message counts and last message for each conversation
      const conversationsWithDetails = await Promise.all(
        (data || []).map(async (conv) => {
          const { count } = await supabase
            .from('conversation_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_internal_note', false);

          const { data: lastMsg } = await supabase
            .from('conversation_messages')
            .select('content')
            .eq('conversation_id', conv.id)
            .eq('is_internal_note', false)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...conv,
            contact: conv.contacts,
            message_count: count || 0,
            last_message: lastMsg?.content || null
          };
        })
      );

      return conversationsWithDetails as EmailConversation[];
    },
    enabled: !!user && !!profile?.email
  });

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = !searchQuery || 
      conv.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.last_message?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      open: 'default',
      pending: 'secondary',
      resolved: 'outline',
      closed: 'outline'
    };
    
    const colors: Record<string, string> = {
      open: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      resolved: 'bg-green-500/10 text-green-500 border-green-500/20',
      closed: 'bg-muted text-muted-foreground'
    };

    return (
      <Badge variant={variants[status] || 'secondary'} className={colors[status] || ''}>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Email Conversations</h1>
              <p className="text-muted-foreground">View your email support history</p>
            </div>
          </div>

          {/* Search and Filters */}
          <Card className="border-0 shadow-elevation">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="open">Open</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="resolved">Resolved</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardContent>
          </Card>

          {/* Conversations List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <Card className="border-0 shadow-elevation">
              <CardContent className="py-12 text-center">
                <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No email conversations found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'Your email support history will appear here'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredConversations.map((conv) => (
                <Card 
                  key={conv.id} 
                  className="border-0 shadow-elevation hover:shadow-glow transition-shadow cursor-pointer"
                  onClick={() => navigate(`/email-conversations/${conv.id}`)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h3 className="font-medium truncate">
                              {conv.subject || 'No subject'}
                            </h3>
                            {conv.last_message && (
                              <p className="text-sm text-muted-foreground truncate mt-1">
                                {conv.last_message}
                              </p>
                            )}
                          </div>
                          <div className="flex-shrink-0">
                            {getStatusBadge(conv.status)}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {conv.message_count} messages
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <FooterAiralo />
    </div>
  );
}
