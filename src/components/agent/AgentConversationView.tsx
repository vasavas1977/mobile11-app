import { useEffect, useState, useRef } from 'react';
import { linkifyText } from '@/utils/linkifyText';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  Send, 
  User, 
  Mail, 
  Phone,
  Clock,
  StickyNote,
  Search,
  Globe,
  MessageCircle,
  Bot,
  BotOff,
  ShieldAlert,
  Eye,
  EyeOff,
  MessageSquarePlus,
  Sparkles,
  Copy
} from 'lucide-react';
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
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { LineIcon } from '@/components/icons/LineIcon';
import { useToast } from '@/hooks/use-toast';
import { useChatPresence } from '@/hooks/useChatPresence';
import { TypingIndicator } from '@/components/tickets/TypingIndicator';
import { ChatAttachments, type Attachment } from '@/components/chat/ChatAttachments';
import { ChatFileUpload } from '@/components/chat/ChatFileUpload';
import { LineStickerPicker } from '@/components/chat/LineStickerPicker';
import { getStickerImageUrl } from '@/lib/lineStickers';
import { EmailContent } from './EmailContent';
import { useConversationRating } from '@/hooks/useConversationRating';
import { ConversationRatingDisplay } from '@/components/shared/ConversationRatingDisplay';
import { AIScoreCard } from '@/components/admin/contact-center/AIScoreCard';

interface ConversationMetadata {
  to_email?: string;
  last_message_id?: string;
  [key: string]: unknown;
}

interface Conversation {
  id: string;
  subject: string | null;
  channel: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  created_at: string;
  first_response_at: string | null;
  metadata?: ConversationMetadata | null;
  contact?: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    line_display_name: string | null;
    line_picture_url: string | null;
    facebook_display_name: string | null;
    facebook_picture_url: string | null;
  };
}

interface Message {
  id: string;
  content: string;
  sender_type: string;
  sender_id: string | null;
  is_internal_note: boolean;
  created_at: string;
  metadata?: any;
  attachments?: any;
}

interface CannedResponse {
  id: string;
  title: string;
  content: string;
  shortcut: string | null;
}

interface KBArticle {
  id: string;
  title: string;
  content: string;
  category: string;
}

interface AgentConversationViewProps {
  conversationIdProp?: string;
  hideBackButton?: boolean;
}

export function AgentConversationView({ conversationIdProp, hideBackButton }: AgentConversationViewProps = {}) {
  const params = useParams();
  const conversationId = conversationIdProp || params.conversationId;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [cannedResponses, setCannedResponses] = useState<CannedResponse[]>([]);
  const [kbArticles, setKBArticles] = useState<KBArticle[]>([]);
  const [kbSearch, setKBSearch] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [selectedFromEmail, setSelectedFromEmail] = useState<string>('support@mobile11.com');
  const [showProfileImage, setShowProfileImage] = useState(false);
  const [sendingSticker, setSendingSticker] = useState(false);
  const [showCloseConfirmDialog, setShowCloseConfirmDialog] = useState(false);
  const [facebookMessageTag, setFacebookMessageTag] = useState<string>('');
  const [togglingBot, setTogglingBot] = useState(false);
  const [showSpamConfirm, setShowSpamConfirm] = useState(false);
  const [markingSpam, setMarkingSpam] = useState(false);
  // New: notes improvements
  const [showNotesInThread, setShowNotesInThread] = useState(true);
  const [sidebarNoteText, setSidebarNoteText] = useState('');
  const [sendingSidebarNote, setSendingSidebarNote] = useState(false);
  
  const SUPPORTED_EMAILS = ['support@mobile11.com', 'business@mobile11.com'];
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);
  const initialScrollDone = useRef(false);
  
  // Fetch rating
  const { data: conversationRating } = useConversationRating(conversationId);

  // Typing presence
  const { typingUsers, setTyping } = useChatPresence(
    conversationId || null,
    user?.id,
    user?.email?.split('@')[0] || 'Agent',
    'agent'
  );

  // Derived: internal notes only
  const internalNotes = messages.filter(m => m.is_internal_note);
  // Derived: filtered messages for thread display
  const displayMessages = showNotesInThread ? messages : messages.filter(m => !m.is_internal_note);

  useEffect(() => {
    if (conversationId) {
      fetchConversation();
      fetchMessages();
      fetchCannedResponses();
      fetchKBArticles();
      
      const pollInterval = setInterval(() => {
        fetchMessages();
      }, 3000);
      
      const channel = supabase
        .channel(`conversation-${conversationId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_messages',
          filter: `conversation_id=eq.${conversationId}`
        }, (payload) => {
          setMessages(prev => {
            const exists = prev.some(m => m.id === (payload.new as Message).id);
            if (exists) return prev;
            setTimeout(() => scrollToBottom(), 100);
            return [...prev, payload.new as Message];
          });
        })
        .subscribe();

      return () => {
        clearInterval(pollInterval);
        supabase.removeChannel(channel);
      };
    }
  }, [conversationId]);

  useEffect(() => {
    if (messages.length > 0 && !initialScrollDone.current) {
      initialScrollDone.current = true;
      scrollToBottom('instant');
    }
  }, [messages.length]);

  useEffect(() => {
    initialScrollDone.current = false;
    prevMessageCountRef.current = 0;
  }, [conversationId]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const fetchConversation = async () => {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        contacts (
          id,
          name,
          email,
          phone,
          line_display_name,
          line_picture_url,
          facebook_display_name,
          facebook_picture_url
        )
      `)
      .eq('id', conversationId)
      .single();

    if (data) {
      const metadata = data.metadata as ConversationMetadata | null;
      const conv: Conversation = {
        id: data.id,
        subject: data.subject,
        channel: data.channel,
        status: data.status,
        priority: data.priority,
        assigned_to: data.assigned_to,
        created_at: data.created_at,
        first_response_at: data.first_response_at,
        metadata,
        contact: Array.isArray(data.contacts) ? data.contacts[0] : data.contacts
      };
      setConversation(conv);
      
      if (metadata?.to_email && SUPPORTED_EMAILS.includes(metadata.to_email)) {
        setSelectedFromEmail(metadata.to_email);
      }
    }
    setLoading(false);
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (data) {
      const isNewMessage = data.length > prevMessageCountRef.current;
      prevMessageCountRef.current = data.length;
      
      setMessages(data);
      
      if (isNewMessage && data.length > 0) {
        scrollToBottom();
      }
    }
  };

  const fetchCannedResponses = async () => {
    const { data } = await supabase
      .from('canned_responses')
      .select('*')
      .order('title');

    if (data) {
      setCannedResponses(data);
    }
  };

  const fetchKBArticles = async () => {
    const { data } = await supabase
      .from('kb_articles')
      .select('*')
      .eq('is_published', true)
      .order('title');

    if (data) {
      setKBArticles(data);
    }
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && pendingAttachments.length === 0) || !user || !conversationId) return;

    setSending(true);
    setTyping(false);
    
    try {
      if (conversation?.channel === 'email' && !isInternalNote) {
        const { data, error } = await supabase.functions.invoke('send-agent-reply', {
          body: {
            conversationId,
            message: newMessage.trim() || (pendingAttachments.length > 0 ? '[Attachment]' : ''),
            agentId: user.id,
            fromEmail: selectedFromEmail,
            attachments: pendingAttachments.length > 0 ? pendingAttachments : undefined,
            isInternalNote: false
          }
        });
        if (error) throw error;
        await fetchMessages();
      } else if (conversation?.channel === 'line' && !isInternalNote) {
        const { data, error } = await supabase.functions.invoke('send-line-reply', {
          body: {
            conversationId,
            message: newMessage.trim() || (pendingAttachments.length > 0 ? '[Attachment]' : ''),
            agentId: user.id,
            attachments: pendingAttachments.length > 0 ? pendingAttachments : undefined
          }
        });
        if (error) throw error;
        await fetchMessages();
      } else if (conversation?.channel === 'facebook' && !isInternalNote) {
        const { data, error } = await supabase.functions.invoke('send-facebook-reply', {
          body: {
            conversationId,
            message: newMessage.trim() || (pendingAttachments.length > 0 ? '[Attachment]' : ''),
            agentId: user.id,
            attachments: pendingAttachments.length > 0 ? pendingAttachments : undefined,
            messageTag: facebookMessageTag || undefined
          }
        });
        if (error) throw error;
        await fetchMessages();
      } else if (conversation?.channel === 'whatsapp' && !isInternalNote) {
        const { data, error } = await supabase.functions.invoke('send-whatsapp-reply', {
          body: {
            conversationId,
            message: newMessage.trim() || (pendingAttachments.length > 0 ? '[Attachment]' : ''),
            agentId: user.id,
            attachments: pendingAttachments.length > 0 ? pendingAttachments : undefined
          }
        });
        if (error) throw error;
        await fetchMessages();
      } else {
        const messageData: any = {
          conversation_id: conversationId,
          sender_type: 'agent',
          sender_id: user.id,
          content: newMessage.trim() || (pendingAttachments.length > 0 ? '[Attachment]' : ''),
          is_internal_note: isInternalNote
        };
        if (pendingAttachments.length > 0) {
          messageData.attachments = pendingAttachments;
        }
        const { error } = await supabase.from('conversation_messages').insert(messageData);
        if (error) throw error;

        const updates: any = { updated_at: new Date().toISOString() };
        if (!conversation?.first_response_at && !isInternalNote) {
          updates.first_response_at = new Date().toISOString();
        }
        if (conversation?.status === 'open' && !isInternalNote) {
          updates.status = 'pending';
        }
        await supabase.from('conversations').update(updates).eq('id', conversationId);
      }

      setNewMessage('');
      setIsInternalNote(false);
      setPendingAttachments([]);
      setFacebookMessageTag('');
      
      if (!isInternalNote) {
        toast({
          title: 'Message sent',
          description: conversation?.channel === 'email' ? `Email sent from ${selectedFromEmail}` : 
                       conversation?.channel === 'facebook' ? 'Facebook message sent' :
                       conversation?.channel === 'line' ? 'LINE message sent' :
                       'Message sent successfully'
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const handleSendSticker = async (packageId: string, stickerId: string) => {
    if (!user || !conversationId || conversation?.channel !== 'line') return;

    setSendingSticker(true);
    
    try {
      const { error } = await supabase.functions.invoke('send-line-reply', {
        body: {
          conversationId,
          message: '',
          agentId: user.id,
          sticker: { packageId, stickerId }
        }
      });
      if (error) throw error;
      await fetchMessages();
      toast({ title: 'Sticker sent', description: 'Sticker sent successfully' });
    } catch (error) {
      console.error('Error sending sticker:', error);
      toast({ title: 'Error', description: 'Failed to send sticker', variant: 'destructive' });
    } finally {
      setSendingSticker(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    setTyping(true);
  };
  
  const handleAttachmentsUploaded = (attachments: Attachment[]) => {
    setPendingAttachments(prev => [...prev, ...attachments]);
  };
  
  const removePendingAttachment = (index: number) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!conversationId) return;
    if (newStatus === 'closed') {
      setShowCloseConfirmDialog(true);
      return;
    }
    const updates: any = { status: newStatus };
    if (newStatus === 'resolved') {
      updates.resolved_at = new Date().toISOString();
    }
    await supabase.from('conversations').update(updates).eq('id', conversationId);
    fetchConversation();
  };

  const handleConfirmClose = async () => {
    if (!conversationId) return;
    await supabase.from('conversations').update({ 
      status: 'closed',
      resolved_at: new Date().toISOString() 
    }).eq('id', conversationId);
    setShowCloseConfirmDialog(false);
    fetchConversation();
  };

  const handlePriorityChange = async (newPriority: string) => {
    if (!conversationId) return;
    await supabase.from('conversations').update({ priority: newPriority }).eq('id', conversationId);
    fetchConversation();
  };

  const insertCannedResponse = (content: string) => {
    setNewMessage(prev => prev + content);
  };

  const isBotPaused = !!(conversation?.metadata as any)?.ai_paused;
  const botPauseReason = (conversation?.metadata as any)?.ai_paused_reason as string | undefined;
  const botPausedAt = (conversation?.metadata as any)?.ai_paused_at as string | undefined;
  
  const getPauseReasonLabel = (reason?: string) => {
    switch (reason) {
      case 'agent_replied': return 'Agent replied (auto-resume in 5 min)';
      case 'manual_agent_toggle': return 'Manually paused by agent';
      case 'customer_requested_human': return 'Customer requested human (auto-resume in 60 min)';
      case 'customer_requested_human_menu': return 'Customer escalated via menu (auto-resume in 60 min)';
      case 'escalated': return 'Escalated (auto-resume in 60 min)';
      default: return reason || 'Unknown reason';
    }
  };

  const handleToggleBot = async () => {
    if (!conversationId || !conversation) return;
    setTogglingBot(true);
    try {
      const currentMetadata = (conversation.metadata || {}) as Record<string, any>;
      const newPaused = !isBotPaused;
      const updatedMetadata = {
        ...currentMetadata,
        ai_paused: newPaused,
        ai_paused_at: newPaused ? new Date().toISOString() : null,
        ai_paused_reason: newPaused ? 'manual_agent_toggle' : null
      };
      await supabase.from('conversations').update({ metadata: updatedMetadata }).eq('id', conversationId);
      setConversation(prev => prev ? { ...prev, metadata: updatedMetadata } : prev);
      toast({
        title: newPaused ? 'Bot Paused' : 'Bot Resumed',
        description: newPaused ? 'AI bot will not respond to this conversation' : 'AI bot will now respond to new messages'
      });
    } catch (error) {
      console.error('Error toggling bot:', error);
      toast({ title: 'Error', description: 'Failed to toggle bot status', variant: 'destructive' });
    } finally {
      setTogglingBot(false);
    }
  };

  const handleMarkAsSpam = async () => {
    if (!conversationId || !conversation) return;
    setMarkingSpam(true);
    try {
      const contactEmail = conversation.contact?.email || 'unknown';
      const lastCustomerMsg = messages.filter(m => m.sender_type === 'customer').pop();

      await supabase.from('spam_log').insert({
        from_email: contactEmail,
        subject: conversation.subject,
        message_preview: lastCustomerMsg?.content?.substring(0, 500) || null,
        matched_rules: ['manual:agent_marked'],
      });

      await supabase.from('conversations').update({
        status: 'closed',
        resolved_at: new Date().toISOString(),
      }).eq('id', conversationId);

      if (conversation.channel === 'email' && contactEmail !== 'unknown') {
        await supabase.from('spam_filter_rules').insert({
          rule_type: 'email',
          value: contactEmail,
          description: `Auto-blocked: manually marked as spam by agent`,
          is_active: true,
          match_in: ['from'],
        });
      }

      toast({ title: 'Marked as spam', description: 'Conversation closed and logged as spam' });
      setShowSpamConfirm(false);
      navigate('/agent/inbox');
    } catch (error) {
      console.error('Error marking as spam:', error);
      toast({ title: 'Error', description: 'Failed to mark as spam', variant: 'destructive' });
    } finally {
      setMarkingSpam(false);
    }
  };

  // Quick-note: quote a customer message
  const handleQuickNote = (msg: Message) => {
    const excerpt = msg.content.length > 120 ? msg.content.substring(0, 120) + '...' : msg.content;
    setIsInternalNote(true);
    setNewMessage(`> "${excerpt}"\n\n`);
    // Focus the textarea
    setTimeout(() => {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      }
    }, 50);
  };

  // Send note from sidebar
  const handleSendSidebarNote = async () => {
    if (!sidebarNoteText.trim() || !user || !conversationId) return;
    setSendingSidebarNote(true);
    try {
      const { error } = await supabase.from('conversation_messages').insert({
        conversation_id: conversationId,
        sender_type: 'agent',
        sender_id: user.id,
        content: sidebarNoteText.trim(),
        is_internal_note: true
      });
      if (error) throw error;
      setSidebarNoteText('');
      await fetchMessages();
    } catch (error) {
      console.error('Error sending note:', error);
      toast({ title: 'Error', description: 'Failed to add note', variant: 'destructive' });
    } finally {
      setSendingSidebarNote(false);
    }
  };

  const filteredKBArticles = kbArticles.filter(article =>
    article.title.toLowerCase().includes(kbSearch.toLowerCase()) ||
    article.content.toLowerCase().includes(kbSearch.toLowerCase())
  );

  const isAISummary = (msg: Message) => {
    return msg.metadata?.helper_summary === true || msg.metadata?.source === 'ai_summary';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-muted-foreground">Loading conversation...</div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Conversation not found</div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-w-0">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {/* Header */}
        <div className="p-2 sm:p-4 border-b border-[#F3F0EB] flex items-center justify-between bg-white shadow-sm gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {!hideBackButton && (
              <Button variant="ghost" size="icon" onClick={() => navigate('/agent/inbox')} className="text-[#1A1A1A] hover:bg-[#FAF7F2]">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            {conversation.channel === 'line' && conversation.contact?.line_picture_url ? (
              <button 
                onClick={() => setShowProfileImage(true)}
                className="relative cursor-pointer hover:opacity-80 transition-opacity"
              >
                <img 
                  src={conversation.contact.line_picture_url} 
                  alt={conversation.contact.line_display_name || 'LINE User'}
                  className="w-10 h-10 rounded-full object-cover border-2 border-[#00B900]"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#00B900] flex items-center justify-center">
                  <LineIcon className="h-3 w-3 text-white" />
                </div>
              </button>
            ) : conversation.channel === 'facebook' && conversation.contact?.facebook_picture_url ? (
              <button 
                onClick={() => setShowProfileImage(true)}
                className="relative cursor-pointer hover:opacity-80 transition-opacity"
              >
                <img 
                  src={conversation.contact.facebook_picture_url} 
                  alt={conversation.contact.facebook_display_name || 'Facebook User'}
                  className="w-10 h-10 rounded-full object-cover border-2 border-[#1877F2]"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#1877F2] flex items-center justify-center">
                  <MessageCircle className="h-3 w-3 text-white" />
                </div>
              </button>
            ) : (
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0',
                conversation.channel === 'line' ? 'bg-[#00B900]' :
                conversation.channel === 'facebook' ? 'bg-[#1877F2]' :
                conversation.channel === 'email' ? 'bg-purple-500' :
                conversation.channel === 'web' ? 'bg-blue-500' :
                'bg-gray-500'
              )}>
                {conversation.channel === 'line' ? <LineIcon className="h-5 w-5" /> :
                 conversation.channel === 'facebook' ? <MessageCircle className="h-5 w-5" /> :
                 conversation.channel === 'email' ? <Mail className="h-5 w-5" /> :
                 conversation.channel === 'web' ? <Globe className="h-5 w-5" /> :
                 <MessageCircle className="h-5 w-5" />}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="font-semibold text-[#1A1A1A] text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">{conversation.subject || 'No subject'}</h2>
                <Badge variant="outline" className={cn(
                  'text-[10px] px-1.5 capitalize shrink-0',
                  conversation.channel === 'line' && 'border-[#00B900] text-[#00B900]',
                  conversation.channel === 'facebook' && 'border-[#1877F2] text-[#1877F2]'
                )}>
                  {conversation.channel}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-[#9CA3AF] truncate">
                {conversation.contact?.name || conversation.contact?.email || 'Unknown'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {!conversation.assigned_to && user && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await supabase.from('conversations').update({ assigned_to: user.id }).eq('id', conversationId);
                  fetchConversation();
                  toast({ title: 'Assigned to you' });
                }}
                className="gap-1 text-[11px] font-medium h-8 px-2 border-blue-300 text-blue-600 bg-blue-50 hover:bg-blue-100"
              >
                <User className="h-3 w-3" />
                <span className="hidden sm:inline">Assign to me</span>
              </Button>
            )}
            {(conversation.channel === 'facebook' || conversation.channel === 'line' || conversation.channel === 'web') && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleBot}
                disabled={togglingBot}
                className={cn(
                  'gap-1 text-[11px] font-medium h-8 px-2',
                  isBotPaused
                    ? 'border-orange-300 text-orange-600 bg-orange-50 hover:bg-orange-100'
                    : 'border-emerald-300 text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                )}
              >
                {isBotPaused ? <BotOff className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                <span className="hidden sm:inline">{isBotPaused ? 'Bot Paused' : 'Bot Active'}</span>
                {isBotPaused && botPauseReason && (
                  <span className="hidden md:inline text-[9px] text-orange-500 ml-1">
                    ({getPauseReasonLabel(botPauseReason)})
                  </span>
                )}
              </Button>
            )}
            <Select value={conversation.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[100px] h-8 text-xs bg-white border-[#E5E7EB] text-[#1A1A1A]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#E5E7EB]">
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={conversation.priority} onValueChange={handlePriorityChange}>
              <SelectTrigger className="w-[80px] h-8 text-xs bg-white border-[#E5E7EB] text-[#1A1A1A]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#E5E7EB]">
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSpamConfirm(true)}
              className="gap-1 text-[11px] font-medium h-8 px-2 border-red-300 text-red-600 bg-red-50 hover:bg-red-100"
              title="Mark as Spam"
            >
              <ShieldAlert className="h-3 w-3" />
              <span className="hidden sm:inline">Spam</span>
            </Button>
          </div>
        </div>

        {/* Notes toggle bar */}
        <div className="flex items-center justify-between px-4 py-1.5 bg-[#FAFAF8] border-b border-[#F3F0EB]">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6B7280]">
              {internalNotes.length} note{internalNotes.length !== 1 ? 's' : ''}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNotesInThread(!showNotesInThread)}
            className="gap-1.5 text-xs h-7 px-2 text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F3F0EB]"
          >
            {showNotesInThread ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {showNotesInThread ? 'Hide Notes' : 'Show Notes'}
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-[#FAF7F2]">
          {displayMessages.map((msg) => {
            const attachments = msg.attachments as Attachment[] | null;
            const aiSummary = isAISummary(msg);
            return (
              <div
                key={msg.id}
                className={cn(
                  'flex group relative',
                  (msg.sender_type === 'agent' || msg.sender_type === 'bot') ? 'justify-end' : 'justify-start'
                )}
              >
                {/* Quick-note button on hover for customer messages */}
                {msg.sender_type === 'customer' && (
                  <button
                    onClick={() => handleQuickNote(msg)}
                    className="absolute -left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-full p-1 z-10"
                    title="Add note about this message"
                  >
                    <MessageSquarePlus className="h-3.5 w-3.5 text-amber-700" />
                  </button>
                )}
                <div
                  className={cn(
                    'max-w-[80%] sm:max-w-[70%] rounded-2xl p-3',
                    msg.is_internal_note && aiSummary
                      ? 'bg-blue-50 border border-blue-200 text-[#1A1A1A]'
                      : msg.is_internal_note
                      ? 'bg-amber-50 border border-amber-200 text-[#1A1A1A]'
                      : msg.sender_type === 'agent'
                      ? 'bg-orange-500 text-white'
                      : msg.sender_type === 'bot'
                      ? 'bg-purple-100 border border-purple-200 text-[#1A1A1A]'
                      : 'bg-white border border-[#E5E7EB] text-[#1A1A1A]'
                  )}
                >
                  {msg.is_internal_note && aiSummary && (
                    <div className="flex items-center gap-1 text-xs text-blue-600 mb-1">
                      <Sparkles className="h-3 w-3" />
                      AI Summary
                    </div>
                  )}
                  {msg.is_internal_note && !aiSummary && (
                    <div className="flex items-center gap-1 text-xs text-amber-700 mb-1">
                      <StickyNote className="h-3 w-3" />
                      Internal Note
                    </div>
                  )}
                  {msg.sender_type === 'bot' && !msg.is_internal_note && (
                    <div className="flex items-center gap-1 text-xs text-purple-600 mb-1">
                      {(msg.metadata as any)?.source === 'voice' ? '🎤 Voice Bot' : '🤖 Bot'}
                    </div>
                  )}
                  {msg.metadata?.sticker && (
                    <img
                      src={getStickerImageUrl(msg.metadata.sticker.stickerId)}
                      alt="Sticker"
                      className="w-24 h-24 object-contain"
                    />
                  )}
                  {msg.content && !/^\[(?:attachment|sticker|image|video|audio|file|image, .*|video, .*)\]$/i.test(msg.content) && (
                    conversation?.channel === 'email' && msg.metadata?.has_html ? (
                      <EmailContent content={msg.content} metadata={msg.metadata} />
                    ) : msg.is_internal_note ? (
                      <p className="text-sm whitespace-pre-wrap">
                        {msg.content.split(/(https?:\/\/[^\s]+|\/agent\/conversation\/[^\s]+)/g).map((part, i) => {
                          if (part.match(/^\/agent\/conversation\//)) {
                            return (
                              <a
                                key={i}
                                href={part}
                                onClick={(e) => { e.preventDefault(); navigate(part); }}
                                className="text-blue-600 underline hover:text-blue-800 cursor-pointer"
                              >
                                {part}
                              </a>
                            );
                          }
                          if (part.match(/^https?:\/\//)) {
                            const agentPath = part.match(/\/agent\/conversation\/[^\s]+/);
                            if (agentPath) {
                              return (
                                <a
                                  key={i}
                                  href={agentPath[0]}
                                  onClick={(e) => { e.preventDefault(); navigate(agentPath[0]); }}
                                  className="text-blue-600 underline hover:text-blue-800 cursor-pointer"
                                >
                                  {part}
                                </a>
                              );
                            }
                            return (
                              <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
                                {part}
                              </a>
                            );
                          }
                          return part;
                        })}
                      </p>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{linkifyText(msg.content)}</p>
                    )
                  )}
                  {attachments && attachments.length > 0 && (
                    <ChatAttachments 
                      attachments={attachments} 
                      storageBucket="ticket-attachments"
                      className={msg.content && !/^\[(?:attachment|sticker|image|video|audio|file|image, .*|video, .*)\]$/i.test(msg.content) ? "mt-2" : ""}
                    />
                  )}
                  <p className={cn(
                    'text-[10px] mt-1',
                    msg.sender_type === 'agent' && !msg.is_internal_note
                      ? 'text-white/70'
                      : 'text-[#9CA3AF]'
                  )}>
                    {format(new Date(msg.created_at), 'HH:mm')}
                  </p>
                </div>
              </div>
            );
          })}
          <TypingIndicator typingUsers={typingUsers} />
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-3 sm:p-4 border-t border-[#F3F0EB] bg-white shrink-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Button
              variant={isInternalNote ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsInternalNote(!isInternalNote)}
              className={cn(
                "gap-1 rounded-xl text-xs",
                isInternalNote 
                  ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                  : 'bg-white border-[#E5E7EB] text-[#1A1A1A] hover:bg-[#F3F4F6]'
              )}
            >
              <StickyNote className="h-3 w-3" />
              Internal Note
            </Button>
            
            {conversation?.channel === 'email' && !isInternalNote && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#9CA3AF]" />
                <Select value={selectedFromEmail} onValueChange={setSelectedFromEmail}>
                  <SelectTrigger className="w-[180px] h-8 text-xs bg-white border-[#E5E7EB] text-[#1A1A1A]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#E5E7EB]">
                    {SUPPORTED_EMAILS.map((email) => (
                      <SelectItem key={email} value={email} className="text-xs">
                        {email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {conversation?.channel === 'facebook' && !isInternalNote && (
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-[#9CA3AF]" />
                <Select value={facebookMessageTag || 'standard'} onValueChange={(v) => setFacebookMessageTag(v === 'standard' ? '' : v)}>
                  <SelectTrigger className="w-[160px] h-8 text-xs bg-white border-[#E5E7EB] text-[#1A1A1A]">
                    <SelectValue placeholder="Message Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#E5E7EB]">
                    <SelectItem value="standard" className="text-xs">Standard Reply (24h)</SelectItem>
                    <SelectItem value="POST_PURCHASE_UPDATE" className="text-xs">Order Update</SelectItem>
                    <SelectItem value="ACCOUNT_UPDATE" className="text-xs">Account Update</SelectItem>
                    <SelectItem value="CONFIRMED_EVENT_UPDATE" className="text-xs">Event Update</SelectItem>
                    <SelectItem value="HUMAN_AGENT" className="text-xs">Human Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          {pendingAttachments.length > 0 && (
            <ChatAttachments 
              attachments={pendingAttachments} 
              removable 
              onRemove={removePendingAttachment}
              className="mb-2"
            />
          )}
          
          <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
            <div className="flex-1 flex gap-2 min-w-0 overflow-hidden">
              <ChatFileUpload
                conversationId={conversationId || ''}
                onUploadComplete={handleAttachmentsUploaded}
                disabled={sending || sendingSticker}
              />
              {conversation?.channel === 'line' && !isInternalNote && (
                <LineStickerPicker
                  onSelectSticker={handleSendSticker}
                  disabled={sending || sendingSticker}
                />
              )}
              <Textarea
                value={newMessage}
                onChange={handleInputChange}
                placeholder={isInternalNote ? 'Add an internal note...' : 'Type your message...'}
                className="min-h-[80px] resize-none flex-1 min-w-0 bg-white border-[#E5E7EB] text-[#1A1A1A] placeholder:text-[#9CA3AF]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleSendMessage();
                  }
                }}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={(!newMessage.trim() && pendingAttachments.length === 0) || sending}
              className="shrink-0 w-full sm:w-auto sm:self-end z-10 bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-[#9CA3AF] mt-1">
            Press Cmd+Enter to send
          </p>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="hidden lg:block w-80 border-l border-[#F3F0EB] bg-white overflow-y-auto">
        <Tabs defaultValue="contact" className="h-full flex flex-col">
          <TabsList className="grid grid-cols-4 m-2">
            <TabsTrigger value="contact" className="text-xs">Contact</TabsTrigger>
            <TabsTrigger value="notes" className="text-xs">
              Notes
              {internalNotes.length > 0 && (
                <span className="ml-1 bg-amber-100 text-amber-700 rounded-full text-[10px] px-1.5 py-0.5 font-medium">
                  {internalNotes.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="canned" className="text-xs">Canned</TabsTrigger>
            <TabsTrigger value="kb" className="text-xs">KB</TabsTrigger>
          </TabsList>

          {/* Contact Info */}
          <TabsContent value="contact" className="p-4 space-y-4 m-0">
            <Card className="bg-white border-[#E5E7EB]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-[#1A1A1A]">Contact Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-[#6B7280]" />
                  <span className="text-sm text-[#1A1A1A]">{conversation.contact?.name || 'Unknown'}</span>
                </div>
                {conversation.contact?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-[#6B7280]" />
                    <span className="text-sm text-[#374151]">{conversation.contact.email}</span>
                  </div>
                )}
                {conversation.contact?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-[#6B7280]" />
                    <span className="text-sm text-[#374151]">{conversation.contact.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#6B7280]" />
                  <span className="text-sm text-[#374151]">
                    Created {formatDistanceToNow(new Date(conversation.created_at), { addSuffix: true })}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-[#E5E7EB]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-[#1A1A1A]">Conversation Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Channel</span>
                  <Badge variant="outline" className="capitalize border-[#E5E7EB] text-[#1A1A1A]">{conversation.channel}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Status</span>
                  <Badge variant="outline" className="capitalize border-[#E5E7EB] text-[#1A1A1A]">{conversation.status}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Priority</span>
                  <Badge variant="outline" className="capitalize border-[#E5E7EB] text-[#1A1A1A]">{conversation.priority}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* AI Quality Score */}
            <AIScoreCard conversationId={conversationId!} />

            {/* Customer Rating */}
            <Card className="bg-white border-[#E5E7EB]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-[#1A1A1A]">Customer Rating</CardTitle>
              </CardHeader>
              <CardContent>
                {conversationRating ? (
                  <ConversationRatingDisplay
                    rating={conversationRating.rating}
                    feedbackText={conversationRating.feedback_text}
                  />
                ) : (
                  <p className="text-xs text-[#9CA3AF]">No rating yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="flex-1 flex flex-col m-0 min-h-0">
            {/* Add note input */}
            <div className="p-3 border-b border-[#F3F0EB]">
              <Textarea
                value={sidebarNoteText}
                onChange={(e) => setSidebarNoteText(e.target.value)}
                placeholder="Add a quick note..."
                className="min-h-[60px] resize-none text-sm bg-amber-50/50 border-amber-200 text-[#1A1A1A] placeholder:text-[#9CA3AF]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleSendSidebarNote();
                  }
                }}
              />
              <Button
                onClick={handleSendSidebarNote}
                disabled={!sidebarNoteText.trim() || sendingSidebarNote}
                size="sm"
                className="mt-2 w-full bg-amber-500 hover:bg-amber-600 text-white text-xs gap-1"
              >
                <StickyNote className="h-3 w-3" />
                Add Note
              </Button>
            </div>
            {/* Notes list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {internalNotes.length === 0 ? (
                <p className="text-sm text-[#9CA3AF] text-center py-8">No notes yet</p>
              ) : (
                [...internalNotes].reverse().map((note) => {
                  const ai = isAISummary(note);
                  return (
                    <div
                      key={note.id}
                      className={cn(
                        'rounded-lg p-3 text-sm',
                        ai
                          ? 'bg-blue-50 border border-blue-200'
                          : 'bg-amber-50 border border-amber-200'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1 text-xs font-medium">
                          {ai ? (
                            <>
                              <Sparkles className="h-3 w-3 text-blue-500" />
                              <span className="text-blue-600">AI Summary</span>
                            </>
                          ) : (
                            <>
                              <StickyNote className="h-3 w-3 text-amber-600" />
                              <span className="text-amber-700">Note</span>
                            </>
                          )}
                        </div>
                        <span className="text-[10px] text-[#9CA3AF]">
                          {format(new Date(note.created_at), 'MMM d, HH:mm')}
                        </span>
                      </div>
                      <p className="text-[#1A1A1A] whitespace-pre-wrap text-xs leading-relaxed">
                        {note.content}
                      </p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(note.content);
                          toast({ title: 'Copied to clipboard' });
                        }}
                        className="mt-1.5 flex items-center gap-1 text-[10px] text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                      >
                        <Copy className="h-3 w-3" />
                        Copy
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* Canned Responses */}
          <TabsContent value="canned" className="p-4 m-0">
            <div className="space-y-2">
              {cannedResponses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No canned responses available
                </p>
              ) : (
                cannedResponses.map((response) => (
                  <Card
                    key={response.id}
                    className="bg-white border-[#E5E7EB] cursor-pointer hover:bg-[#F9FAFB] transition-colors"
                    onClick={() => insertCannedResponse(response.content)}
                  >
                    <CardContent className="p-3">
                      <p className="text-sm font-medium text-[#1A1A1A]">{response.title}</p>
                      <p className="text-xs text-[#6B7280] line-clamp-2 mt-1">
                        {response.content}
                      </p>
                      {response.shortcut && (
                        <Badge variant="outline" className="mt-2 text-[10px]">
                          /{response.shortcut}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Knowledge Base */}
          <TabsContent value="kb" className="p-4 m-0">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search knowledge base..."
                  value={kbSearch}
                  onChange={(e) => setKBSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {filteredKBArticles.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No articles found
                </p>
              ) : (
                filteredKBArticles.slice(0, 10).map((article) => (
                  <Card
                    key={article.id}
                    className="bg-white border-[#E5E7EB] cursor-pointer hover:bg-[#F9FAFB] transition-colors"
                    onClick={() => insertCannedResponse(article.content)}
                  >
                    <CardContent className="p-3">
                      <p className="text-sm font-medium text-[#1A1A1A]">{article.title}</p>
                      <Badge variant="outline" className="mt-1 text-[10px] border-[#E5E7EB] text-[#374151]">
                        {article.category}
                      </Badge>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Profile Image Enlarged Dialog */}
      <Dialog open={showProfileImage} onOpenChange={setShowProfileImage}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-transparent border-0">
          <div className="relative">
            {(conversation.contact?.line_picture_url || conversation.contact?.facebook_picture_url) && (
              <img 
                src={conversation.channel === 'facebook' 
                  ? conversation.contact.facebook_picture_url! 
                  : conversation.contact.line_picture_url!
                } 
                alt={conversation.channel === 'facebook'
                  ? (conversation.contact.facebook_display_name || 'Facebook User')
                  : (conversation.contact.line_display_name || 'LINE User')
                }
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />
            )}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent rounded-b-lg">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center",
                  conversation.channel === 'facebook' ? 'bg-[#1877F2]' : 'bg-[#00B900]'
                )}>
                  {conversation.channel === 'facebook' 
                    ? <MessageCircle className="h-4 w-4 text-white" />
                    : <LineIcon className="h-4 w-4 text-white" />
                  }
                </div>
                <span className="text-white font-medium">
                  {conversation.channel === 'facebook'
                    ? (conversation.contact?.facebook_display_name || conversation.contact?.name || 'Facebook User')
                    : (conversation.contact?.line_display_name || conversation.contact?.name || 'LINE User')
                  }
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Close Confirmation Dialog */}
      <AlertDialog open={showCloseConfirmDialog} onOpenChange={setShowCloseConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close this conversation?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="mb-3">
                  Closed conversations are permanently archived and won't appear in the main tabs.
                </p>
                <p className="font-medium text-foreground">
                  Only use "Closed" for:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>Spam messages</li>
                  <li>Duplicate conversations</li>
                  <li>Test messages</li>
                </ul>
                <p className="mt-3 text-sm">
                  If the customer's issue was resolved, use <strong>"Resolved"</strong> instead.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClose}>
              Yes, Close Conversation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Spam Confirmation Dialog */}
      <AlertDialog open={showSpamConfirm} onOpenChange={setShowSpamConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Spam?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="mb-3">
                  This will close the conversation and log it as spam.
                </p>
                {conversation.channel === 'email' && conversation.contact?.email && (
                  <p className="text-sm font-medium text-red-600">
                    The sender ({conversation.contact.email}) will be automatically blocked from future emails.
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
