import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { hapticImpact, ImpactStyle } from '@/lib/haptics';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Mail, 
  Globe, 
  MessageCircle,
  Phone,
  User,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { LineIcon } from '@/components/icons/LineIcon';
import { FileText } from 'lucide-react';
import { SpamInbox } from './SpamInbox';
import { AgentConversationView } from './AgentConversationView';
import { useConversationRatingsBatch } from '@/hooks/useConversationRating';
import { ConversationRatingDisplay } from '@/components/shared/ConversationRatingDisplay';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Conversation {
  id: string;
  subject: string | null;
  channel: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  assigned_to: string | null;
  contact?: {
    id: string;
    name: string | null;
    email: string | null;
    phone?: string | null;
    whatsapp_phone?: string | null;
  };
  last_message?: {
    content: string;
    created_at: string;
    sender_type: string;
  };
}

const channelIcons: Record<string, any> = {
  email: Mail,
  web: Globe,
  line: LineIcon,
  facebook: MessageCircle,
  instagram: MessageCircle,
  tiktok: MessageCircle,
  whatsapp: MessageCircle,
  voice: Phone,
  form: FileText
};

const channelColors: Record<string, string> = {
  email: 'bg-purple-500',
  web: 'bg-blue-500',
  line: 'bg-[#00B900]', // Official LINE green
  facebook: 'bg-indigo-500',
  instagram: 'bg-pink-500',
  tiktok: 'bg-black',
  whatsapp: 'bg-green-600',
  voice: 'bg-orange-500',
  form: 'bg-emerald-500'
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-500/10 text-gray-500',
  medium: 'bg-blue-500/10 text-blue-500',
  high: 'bg-orange-500/10 text-orange-500',
  urgent: 'bg-red-500/10 text-red-500'
};

export function AgentInbox() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');
  const [spamCount, setSpamCount] = useState(0);
  const [pageSize] = useState(50);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [spamTarget, setSpamTarget] = useState<Conversation | null>(null);
  const [markingSpam, setMarkingSpam] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const fetchIdRef = useRef(0);

  // Fetch spam count
  useEffect(() => {
    const fetchSpamCount = async () => {
      const { count } = await supabase
        .from('spam_log')
        .select('*', { count: 'exact', head: true });
      setSpamCount(count || 0);
    };
    fetchSpamCount();

    // Subscribe to spam log changes
    const channel = supabase
      .channel('spam-count')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'spam_log' 
      }, () => {
        fetchSpamCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    setConversations([]);
    fetchIdRef.current++;
    const initialFetchId = fetchIdRef.current;
    fetchConversationsInner(false, initialFetchId, true);
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('inbox-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'conversations' 
      }, () => {
        fetchIdRef.current++;
        fetchConversationsInner(false, fetchIdRef.current, false);
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'conversation_messages'
      }, () => {
        fetchIdRef.current++;
        fetchConversationsInner(false, fetchIdRef.current, false);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab, channelFilter, priorityFilter]);

  const fetchConversationsInner = async (loadMore = false, currentFetchId?: number, showLoading = false) => {
    const myFetchId = currentFetchId ?? ++fetchIdRef.current;
    try {
      const offset = loadMore ? conversations.length : 0;

      let query = supabase
        .from('conversations')
        .select(`
          *,
          contacts (
            id,
            name,
            email,
            phone,
            whatsapp_phone
          )
        `)
        .order('updated_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      // Apply tab filter
      if (activeTab === 'mine') {
        query = query.eq('assigned_to', user?.id);
      } else if (activeTab === 'unassigned') {
        query = query.is('assigned_to', null);
      }

      // Apply status filter based on tab
      if (activeTab === 'resolved') {
        query = query.eq('status', 'resolved');
      } else if (activeTab === 'closed') {
        query = query.eq('status', 'closed');
      } else {
        query = query.in('status', ['open', 'pending']);
      }

      if (channelFilter !== 'all') {
        query = query.eq('channel', channelFilter);
      }

      if (priorityFilter !== 'all') {
        query = query.eq('priority', priorityFilter);
      }

      const { data, error } = await query;

      // Abort if a newer fetch has started
      if (myFetchId !== fetchIdRef.current) return;

      if (error) throw error;

      if (!data || data.length === 0) {
        if (!loadMore) setConversations([]);
        setHasMore(false);
        return;
      }

      setHasMore(data.length === pageSize);

      const convIds = data.map(c => c.id);
      
      const { data: allMessages } = await supabase
        .from('conversation_messages')
        .select('conversation_id, content, created_at, sender_type, metadata')
        .in('conversation_id', convIds)
        .eq('is_internal_note', false)
        .order('created_at', { ascending: false })
        .limit(500);

      // Abort if a newer fetch has started
      if (myFetchId !== fetchIdRef.current) return;

      const messageMap = new Map<string, any>();
      (allMessages || []).forEach(msg => {
        if (!messageMap.has(msg.conversation_id)) {
          messageMap.set(msg.conversation_id, msg);
        }
      });

      const conversationsWithMessages = data.map(conv => ({
        ...conv,
        contact: Array.isArray(conv.contacts) ? conv.contacts[0] : conv.contacts,
        last_message: messageMap.get(conv.id) || null
      }));

      if (loadMore) {
        setConversations(prev => [...prev, ...conversationsWithMessages]);
      } else {
        setConversations(conversationsWithMessages);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      if (myFetchId === fetchIdRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  };

  // Batch fetch ratings for visible conversations
  const convIds = conversations.map(c => c.id);
  const { data: ratingsMap } = useConversationRatingsBatch(convIds);

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.subject?.toLowerCase().includes(query) ||
      conv.contact?.name?.toLowerCase().includes(query) ||
      conv.contact?.email?.toLowerCase().includes(query) ||
      conv.contact?.phone?.toLowerCase().includes(query) ||
      conv.contact?.whatsapp_phone?.toLowerCase().includes(query)
    );
  });

  const handleAssignToMe = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    await supabase
      .from('conversations')
      .update({ assigned_to: user.id })
      .eq('id', conversationId);

    fetchConversationsInner();
  };

  const handleLoadMore = () => {
    setLoadingMore(true);
    fetchConversationsInner(true);
  };

  const handleMarkAsSpam = async () => {
    if (!spamTarget) return;
    setMarkingSpam(true);
    try {
      const contactEmail = spamTarget.contact?.email || 'unknown';

      await supabase.from('spam_log').insert({
        from_email: contactEmail,
        subject: spamTarget.subject,
        message_preview: spamTarget.last_message?.content?.substring(0, 500) || null,
        matched_rules: ['manual:agent_marked'],
      });

      await supabase.from('conversations').update({
        status: 'closed',
        resolved_at: new Date().toISOString(),
      }).eq('id', spamTarget.id);

      if (spamTarget.channel === 'email' && contactEmail !== 'unknown') {
        await supabase.from('spam_filter_rules').insert({
          rule_type: 'email',
          value: contactEmail,
          description: 'Auto-blocked: manually marked as spam by agent',
          is_active: true,
          match_in: ['from'],
        });
      }

      toast({ title: 'Marked as spam', description: 'Conversation closed and logged as spam' });
      setSpamTarget(null);
      fetchConversationsInner();
    } catch (error) {
      console.error('Error marking as spam:', error);
      toast({ title: 'Error', description: 'Failed to mark as spam', variant: 'destructive' });
    } finally {
      setMarkingSpam(false);
    }
  };

  return (
    <div className="flex h-full min-h-0">
      {/* Conversation List */}
      <div className="w-full lg:w-96 border-r border-[#F3F0EB] flex flex-col min-h-0 bg-[#FAF7F2]">
        {/* Search & Filters */}
        <div className="p-4 border-b border-[#F3F0EB] space-y-3 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="flex-1 bg-white border-[#E5E7EB] text-[#374151]">
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="web">Web Chat</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="line">LINE</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="form">Contact Form</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="flex-1 bg-white border-[#E5E7EB] text-[#374151]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid grid-cols-6 mx-4 mt-2 bg-[#F3F0EB]">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="mine" className="text-xs">Mine</TabsTrigger>
            <TabsTrigger value="unassigned" className="text-xs">Unassigned</TabsTrigger>
            <TabsTrigger value="resolved" className="text-xs">Resolved</TabsTrigger>
            <TabsTrigger value="closed" className="text-xs">Closed</TabsTrigger>
            <TabsTrigger value="spam" className="text-xs flex items-center gap-1">
              <ShieldAlert className="h-3 w-3" />
              Spam
              {spamCount > 0 && (
                <Badge variant="destructive" className="h-4 px-1 text-[10px] ml-1">
                  {spamCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Spam Tab Content */}
          {activeTab === 'spam' ? (
            <div className="flex-1 overflow-y-auto">
              <SpamInbox />
            </div>
          ) : (
          <TabsContent value={activeTab} className="flex-1 overflow-y-auto m-0 p-0">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No conversations found</p>
              </div>
            ) : (
              <div className="divide-y divide-[#F3F0EB]">
                {filteredConversations.map((conv) => {
                  const ChannelIcon = channelIcons[conv.channel] || MessageCircle;
                  return (
                    <div
                      key={conv.id}
                      onClick={() => {
                        hapticImpact(ImpactStyle.Light);
                        if (isMobile) {
                          navigate(`/agent/conversation/${conv.id}`);
                        } else {
                          setSelectedConversationId(conv.id);
                        }
                      }}
                      className={cn(
                        "p-4 hover:bg-white cursor-pointer transition-colors min-h-[72px] active:bg-white",
                        selectedConversationId === conv.id && "bg-white border-l-2 border-l-orange-500"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-white',
                          channelColors[conv.channel] || 'bg-gray-500'
                        )}>
                          <ChannelIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate text-[#1A1A1A]">
                              {conv.contact?.name || conv.contact?.email || 'Unknown'}
                            </span>
                            <Badge variant="outline" className={cn('text-[10px] px-1.5 border-[hsl(var(--border))]', priorityColors[conv.priority])}>
                              {conv.priority}
                            </Badge>
                            {conv.priority === 'high' && (conv as any).metadata?.ai_paused_reason === 'customer_requested_human' && (
                              <Badge variant="destructive" className="text-[10px] px-1.5">
                                Escalated
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium text-[#374151] truncate">
                            {conv.subject || 'No subject'}
                          </p>
                          <div className="flex items-center gap-1">
                            {(conv.last_message as any)?.metadata?.source === 'voice' && (
                              <span title="Voice conversation" className="text-xs">🎤</span>
                            )}
                            <p className="text-xs text-[#6B7280] truncate">
                              {conv.last_message?.content || 'No messages yet'}
                            </p>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-1 text-xs text-[#6B7280]">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                            </div>
                            <div className="flex items-center gap-1.5">
                              {ratingsMap?.get(conv.id) && (
                                <ConversationRatingDisplay
                                  rating={ratingsMap.get(conv.id)!}
                                  compact
                                />
                              )}
                              {!conv.assigned_to && activeTab !== 'resolved' && (
                              <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-xs border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100"
                                  onClick={(e) => handleAssignToMe(conv.id, e)}
                                >
                                  Assign to me
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                                title="Mark as Spam"
                                onClick={(e) => { e.stopPropagation(); setSpamTarget(conv); }}
                              >
                                <ShieldAlert className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {hasMore && (
                  <div className="p-4 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]"
                    >
                      {loadingMore ? 'Loading...' : 'Load More'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Desktop: Inline Conversation or Empty State */}
      <div className="hidden lg:flex flex-1 min-h-0">
        {selectedConversationId ? (
          <div className="flex-1 min-h-0">
            <AgentConversationView key={selectedConversationId} conversationIdProp={selectedConversationId} hideBackButton />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-[#FAF7F2]">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-[#9CA3AF]/30" />
              <p className="text-lg font-semibold text-[#9CA3AF]">Select a conversation</p>
              <p className="text-sm text-[#9CA3AF]">Choose a conversation from the list to view details</p>
            </div>
          </div>
        )}
      </div>

      {/* Spam Confirmation Dialog */}
      <AlertDialog open={!!spamTarget} onOpenChange={(open) => { if (!open) setSpamTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Spam?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="mb-3">
                  This will close the conversation and log it as spam.
                </p>
                {spamTarget?.channel === 'email' && spamTarget?.contact?.email && (
                  <p className="text-sm font-medium text-red-600">
                    The sender ({spamTarget.contact.email}) will be automatically blocked from future emails.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={markingSpam}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMarkAsSpam}
              disabled={markingSpam}
              className="bg-red-600 hover:bg-red-700"
            >
              {markingSpam ? 'Marking...' : 'Yes, Mark as Spam'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
