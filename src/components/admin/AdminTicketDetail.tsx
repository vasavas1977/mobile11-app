import { useState, useEffect } from "react";
import { hapticKeypress } from "@/lib/haptics";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { TicketStatusBadge } from "@/components/tickets/TicketStatusBadge";
import { TicketPriorityBadge } from "@/components/tickets/TicketPriorityBadge";
import { MessageBubble } from "@/components/tickets/MessageBubble";
import { TypingIndicator } from "@/components/tickets/TypingIndicator";
import { FileUpload } from "@/components/tickets/FileUpload";
import { StatusSelect } from "./tickets/StatusSelect";
import { PrioritySelect } from "./tickets/PrioritySelect";
import { AssignmentDropdown } from "./tickets/AssignmentDropdown";
import { InternalNoteForm } from "./tickets/InternalNoteForm";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { format } from "date-fns";

interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
  updated_at: string;
  first_response_at: string | null;
  resolved_at: string | null;
  assigned_to: string | null;
  user_id: string | null;
  email: string;
  name: string;
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

interface Admin {
  id: string;
  name: string;
}

export const AdminTicketDetail = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [typingTimeout, setTypingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);

  useEffect(() => {
    if (ticketId && user) {
      fetchTicket();
      fetchConversationAndMessages();
      fetchAdmins();
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
      toast({
        title: "Error",
        description: "Failed to load ticket",
        variant: "destructive",
      });
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
        
        // Fetch messages from conversation_messages (including internal notes for admins)
        const { data: convMessages, error: msgError } = await supabase
          .from("conversation_messages")
          .select("*")
          .eq("conversation_id", conversation.id)
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

  const fetchAdmins = async () => {
    try {
      // First get admin user IDs
      const { data: adminRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (rolesError) throw rolesError;

      const adminUserIds = adminRoles?.map(r => r.user_id) || [];

      if (adminUserIds.length === 0) {
        setAdmins([]);
        return;
      }

      // Then get profiles for those users
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name")
        .in("user_id", adminUserIds);

      if (error) throw error;

      setAdmins(
        (data || []).map((admin: any) => ({
          id: admin.user_id,
          name: `${admin.first_name} ${admin.last_name}`.trim(),
        }))
      );
    } catch (error) {
      console.error("Error fetching admins:", error);
    }
  };

  const subscribeToMessages = () => {
    if (!conversationId) return () => {};

    const channel = supabase
      .channel(`admin-conversation-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversation_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          fetchConversationAndMessages();
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
    setReplyMessage(e.target.value);
    hapticKeypress();

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Broadcast typing state
    const presenceChannel = supabase.channel(`ticket_presence_${ticketId}`);
    presenceChannel.track({
      user_id: user?.id,
      user_name: "Support Team",
      typing: true,
      online_at: new Date().toISOString(),
    });

    // Set timeout to stop typing indicator
    const timeout = setTimeout(() => {
      presenceChannel.track({
        user_id: user?.id,
        user_name: "Support Team",
        typing: false,
        online_at: new Date().toISOString(),
      });
    }, 3000);

    setTypingTimeout(timeout);
  };

  const handleSendReply = async () => {
    if ((!replyMessage.trim() && attachments.length === 0) || !user) return;

    setIsSending(true);
    
    // Stop typing indicator
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    const presenceChannel = supabase.channel(`ticket_presence_${ticketId}`);
    presenceChannel.track({
      user_id: user?.id,
      user_name: "Support Team",
      typing: false,
      online_at: new Date().toISOString(),
    });

    try {
      // Upload files first if any
      let attachmentData = null;
      if (attachments.length > 0) {
        attachmentData = [];
        for (const file of attachments) {
          const fileName = `${ticketId}/${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('ticket-attachments')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          attachmentData.push({
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
          content: replyMessage || "(File attachments)",
          sender_type: "agent",
          sender_id: user.id,
          is_internal_note: false,
          attachments: attachmentData,
        });

        if (error) throw error;
      } else {
        // Fallback to legacy ticket_messages for old tickets
        const { error } = await supabase.from("ticket_messages").insert({
          ticket_id: ticketId,
          user_id: user.id,
          message: replyMessage || "(File attachments)",
          sender_type: "admin",
          is_internal_note: false,
          attachments: attachmentData,
        });

        if (error) throw error;
        
        // Manually refresh messages for legacy tickets
        fetchConversationAndMessages();
      }

      // Update first_response_at if this is the first admin response
      if (!ticket?.first_response_at) {
        await supabase
          .from("support_tickets")
          .update({ first_response_at: new Date().toISOString() })
          .eq("id", ticketId);
      }

      setReplyMessage("");
      setAttachments([]);
      toast({
        title: "Reply sent",
        description: "Your response has been sent to the customer",
      });
    } catch (error) {
      console.error("Error sending reply:", error);
      toast({
        title: "Error",
        description: "Failed to send reply",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleInternalNoteAdded = () => {
    fetchConversationAndMessages();
  };

  const handleRefresh = () => {
    fetchTicket();
    fetchConversationAndMessages();
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
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Ticket not found</h2>
        <Button onClick={() => navigate("/admin/tickets")}>Back to Tickets</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/tickets")}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle>Ticket #{ticket.ticket_number}</CardTitle>
                    <TicketStatusBadge status={ticket.status} />
                    <TicketPriorityBadge priority={ticket.priority} />
                  </div>
                  <h2 className="text-xl font-semibold">{ticket.subject}</h2>
                  <p className="text-sm text-muted-foreground">
                    Category: <span className="capitalize">{ticket.category}</span>
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <StatusSelect
                    ticketId={ticket.id}
                    currentStatus={ticket.status}
                    onStatusChange={handleRefresh}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <PrioritySelect
                    ticketId={ticket.id}
                    currentPriority={ticket.priority}
                    onPriorityChange={handleRefresh}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Assignment</label>
                  <AssignmentDropdown
                    ticketId={ticket.id}
                    currentAssignedTo={ticket.assigned_to}
                    currentUserId={user?.id || ""}
                    admins={admins}
                    onAssignmentChange={handleRefresh}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold">Messages</h3>
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {messages.map((message) => (
                    <div key={message.id}>
                      {message.is_internal_note ? (
                        <div className="p-4 border border-amber-500/20 bg-amber-500/5 rounded-lg">
                          <div className="flex items-center gap-2 text-amber-600 mb-2">
                            <span className="text-xs font-medium">INTERNAL NOTE</span>
                          </div>
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {format(new Date(message.created_at), "PPp")}
                          </p>
                        </div>
                      ) : (
                        <MessageBubble
                          message={transformMessageForBubble(message)}
                          isCurrentUser={message.sender_type === "customer"}
                        />
                      )}
                    </div>
                  ))}
                  <TypingIndicator typingUsers={typingUsers} />
                </div>
              </div>

              {ticket.status !== "closed" && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="font-semibold">Reply to Customer</h3>
                    <Textarea
                      value={replyMessage}
                      onChange={handleTyping}
                      placeholder="Type your reply..."
                      className="min-h-[120px]"
                    />
                    <FileUpload onFilesSelected={setAttachments} />
                    <Button 
                      onClick={handleSendReply} 
                      disabled={isSending || (!replyMessage.trim() && attachments.length === 0)}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isSending ? "Sending..." : "Send Reply"}
                    </Button>
                  </div>

                  <InternalNoteForm
                    ticketId={ticket.id}
                    conversationId={conversationId}
                    userId={user?.id || ""}
                    onNoteAdded={handleInternalNoteAdded}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="text-sm">{ticket.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-sm">{ticket.email}</p>
              </div>
              <Separator />
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p className="text-sm">{format(new Date(ticket.created_at), "PPp")}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                <p className="text-sm">{format(new Date(ticket.updated_at), "PPp")}</p>
              </div>
              {ticket.first_response_at && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">First Response</label>
                  <p className="text-sm">{format(new Date(ticket.first_response_at), "PPp")}</p>
                </div>
              )}
              {ticket.resolved_at && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Resolved</label>
                  <p className="text-sm">{format(new Date(ticket.resolved_at), "PPp")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
