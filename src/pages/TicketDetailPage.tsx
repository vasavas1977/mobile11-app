import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { hapticKeypress } from "@/lib/haptics";
import { useAuth } from "@/hooks/useAuth";
import { useAgentCheck } from "@/hooks/useAgentCheck";
import { Header } from "@/components/layout/Header";
import { FooterAiralo } from "@/components/landing/FooterAiralo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TicketStatusBadge } from "@/components/tickets/TicketStatusBadge";
import { TicketPriorityBadge } from "@/components/tickets/TicketPriorityBadge";
import { MessageBubble } from "@/components/tickets/MessageBubble";
import { TypingIndicator } from "@/components/tickets/TypingIndicator";
import { FileUpload } from "@/components/tickets/FileUpload";
import { ArrowLeft, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  user_id: string;
}

interface Message {
  id: string;
  content: string;
  sender_type: string;
  created_at: string;
  sender_id: string | null;
  is_internal_note: boolean;
  attachments?: any;
}

export default function TicketDetailPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAgent } = useAgentCheck();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [typingTimeout, setTypingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useEffect(() => {
    if (ticketId && user) {
      fetchTicket();
      fetchConversationAndMessages();
    }
  }, [ticketId, user]);

  useEffect(() => {
    if (conversationId && user) {
      const unsubscribe = subscribeToMessages();
      const presenceChannel = subscribeToPresence();
      
      return () => {
        unsubscribe();
        supabase.removeChannel(presenceChannel);
      };
    }
  }, [conversationId, user]);

  const fetchTicket = async () => {
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("id", ticketId)
        .single();

      if (error) throw error;
      setTicket(data);
    } catch (error) {
      console.error("Error fetching ticket:", error);
      toast.error("Failed to load ticket");
    } finally {
      setLoading(false);
    }
  };

  const fetchConversationAndMessages = async () => {
    try {
      // First get the conversation linked to this ticket
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .select("id")
        .eq("ticket_id", ticketId)
        .maybeSingle();

      if (convError) throw convError;

      if (conversation) {
        setConversationId(conversation.id);
        
        // Fetch messages from conversation_messages
        const { data: convMessages, error: msgError } = await supabase
          .from("conversation_messages")
          .select("*")
          .eq("conversation_id", conversation.id)
          .eq("is_internal_note", false) // Don't show internal notes to customers
          .order("created_at", { ascending: true });

        if (msgError) throw msgError;
        setMessages(convMessages || []);
      } else {
        // Fallback to legacy ticket_messages for old tickets without conversations
        console.log("No conversation found, falling back to legacy ticket_messages");
        const { data: legacyMessages, error: legacyError } = await supabase
          .from("ticket_messages")
          .select("*")
          .eq("ticket_id", ticketId)
          .order("created_at", { ascending: true });

        if (legacyError) throw legacyError;
        
        // Transform legacy messages to match the new format
        const transformedMessages = (legacyMessages || []).map(msg => ({
          id: msg.id,
          content: msg.message,
          sender_type: msg.sender_type,
          created_at: msg.created_at,
          sender_id: msg.user_id,
          is_internal_note: msg.is_internal_note,
          attachments: msg.attachments,
        }));
        setMessages(transformedMessages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const subscribeToMessages = () => {
    if (!conversationId) return () => {};

    const channel = supabase
      .channel(`conversation_${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversation_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          // Don't show internal notes to customers
          if (!newMsg.is_internal_note) {
            setMessages((prev) => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribeToPresence = () => {
    const presenceChannel = supabase.channel(`ticket_presence_${ticketId}`, {
      config: { presence: { key: user?.id } },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const typing = Object.values(state)
          .flat()
          .filter((presence: any) => presence.typing && presence.user_id !== user?.id)
          .map((presence: any) => presence.user_name);
        setTypingUsers(typing);
      })
      .subscribe();

    return presenceChannel;
  };

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    hapticKeypress();

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Broadcast typing state
    const presenceChannel = supabase.channel(`ticket_presence_${ticketId}`);
    presenceChannel.track({
      user_id: user?.id,
      user_name: isAgent ? "Support Team" : "You",
      typing: true,
      online_at: new Date().toISOString(),
    });

    // Set timeout to stop typing indicator
    const timeout = setTimeout(() => {
      presenceChannel.track({
        user_id: user?.id,
        user_name: isAgent ? "Support Team" : "You",
        typing: false,
        online_at: new Date().toISOString(),
      });
    }, 3000);

    setTypingTimeout(timeout);
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && selectedFiles.length === 0) || !user) return;

    setSending(true);
    
    // Stop typing indicator
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    const presenceChannel = supabase.channel(`ticket_presence_${ticketId}`);
    presenceChannel.track({
      user_id: user?.id,
      user_name: isAgent ? "Support Team" : "You",
      typing: false,
      online_at: new Date().toISOString(),
    });

    try {
      // Upload files first if any
      let attachments = null;
      if (selectedFiles.length > 0) {
        attachments = [];
        for (const file of selectedFiles) {
          const fileName = `${ticketId}/${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('ticket-attachments')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          attachments.push({
            name: file.name,
            path: fileName,
            size: file.size,
            type: file.type,
          });
        }
      }

      if (conversationId) {
        // Write to conversation_messages (new system)
        const { error } = await supabase.from("conversation_messages").insert({
          conversation_id: conversationId,
          content: newMessage || "(File attachments)",
          sender_type: isAgent ? "agent" : "customer",
          sender_id: user.id,
          attachments: attachments,
        });

        if (error) throw error;
      } else {
        // Fallback to legacy ticket_messages for old tickets
        const { error } = await supabase.from("ticket_messages").insert({
          ticket_id: ticketId,
          user_id: user.id,
          message: newMessage || "(File attachments)",
          sender_type: isAgent ? "admin" : "customer",
          attachments: attachments,
        });

        if (error) throw error;
        
        // Manually add to messages for legacy tickets (no realtime subscription)
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          content: newMessage || "(File attachments)",
          sender_type: isAgent ? "admin" : "customer",
          sender_id: user.id,
          created_at: new Date().toISOString(),
          is_internal_note: false,
          attachments: attachments,
        }]);
      }
      
      setNewMessage("");
      setSelectedFiles([]);
      toast.success("Message sent");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  // Transform message for MessageBubble component (expects 'message' field)
  const transformMessageForBubble = (msg: Message) => ({
    id: msg.id,
    message: msg.content,
    sender_type: msg.sender_type === "agent" ? "admin" : msg.sender_type,
    created_at: msg.created_at,
    is_internal_note: msg.is_internal_note,
    attachments: msg.attachments,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Ticket not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate("/tickets")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tickets
        </Button>

        {isAgent && (
          <Alert className="mb-4 border-primary/50 bg-primary/5">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <AlertDescription className="text-foreground">
              <span className="font-semibold">Admin Mode:</span> Your responses will be sent as Support Team
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-card rounded-lg border p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-mono text-muted-foreground">
                  {ticket.ticket_number}
                </span>
                <TicketStatusBadge status={ticket.status} />
                <TicketPriorityBadge priority={ticket.priority} />
              </div>
              <h1 className="text-2xl font-bold text-foreground">{ticket.subject}</h1>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="capitalize">{ticket.category.replace("_", " ")}</span>
            <span>•</span>
            <span>Created {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}</span>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6 mb-6 max-h-[500px] overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No messages yet</p>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={transformMessageForBubble(message)}
                isCurrentUser={message.sender_id === user?.id}
              />
            ))
          )}
          <TypingIndicator typingUsers={typingUsers} />
        </div>

        {ticket.status !== "closed" && (
          <div className="bg-card rounded-lg border p-4 space-y-4">
            <Textarea
              placeholder="Type your message here..."
              value={newMessage}
              onChange={handleTyping}
              rows={4}
            />
            <FileUpload onFilesSelected={setSelectedFiles} />
            <div className="flex justify-end">
              <Button 
                onClick={handleSendMessage} 
                disabled={sending || (!newMessage.trim() && selectedFiles.length === 0)}
              >
                <Send className="mr-2 h-4 w-4" />
                {sending ? "Sending..." : "Send Message"}
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <FooterAiralo />
    </div>
  );
}
