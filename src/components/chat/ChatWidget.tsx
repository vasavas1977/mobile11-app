import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, X, Send, Minimize2, Paperclip, Loader2, Bot, User, RotateCcw, Mic, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import { useChatPresence } from '@/hooks/useChatPresence';
import { TypingIndicator } from '@/components/tickets/TypingIndicator';
import { ChatAttachments, type Attachment } from './ChatAttachments';
import ChatMessageContent from './ChatMessageContent';
import { useToast } from '@/hooks/use-toast';
import { ChannelSelection } from './ChannelSelection';
import { IntentSelection } from './IntentSelection';
import { type ChatChannel, CHAT_CHANNELS } from '@/lib/chatChannels';
import { useLanguage } from '@/contexts/LanguageContext';
import { detectDevice } from '@/lib/deviceDetection';
import { QuickReplies } from './QuickReplies';
import { PackageList } from './PackageList';
import { ChatVoiceMode } from './ChatVoiceMode';
import { ChatRatingPrompt } from './ChatRatingPrompt';

// Package info from AI response
interface PackageInfo {
  id: string;
  name: string;
  country_name: string;
  data_amount: string;
  validity_days: number;
  price: number;
  currency: string;
  package_type: string | null;
  cartUrl: string;
}

interface Message {
  id: string;
  content: string;
  sender_type: 'customer' | 'agent' | 'system' | 'ai';
  created_at: string;
  is_internal_note?: boolean;
  attachments?: Attachment[];
  packages?: PackageInfo[];
  configuratorUrl?: string;
  detectedDays?: number;
  // Raw DB metadata (used to persist AI package suggestions)
  metadata?: any;
}
// Generate a random session token
function generateSessionToken(): string {
  return 'guest_' + crypto.randomUUID();
}

// Shared escalation handler: updates conversation metadata, persists escalation message, triggers agent summary
async function handleWebEscalation(
  convId: string,
  escalationMessage: string,
  source: 'ai_streaming' | 'ai_nonstreaming' | 'manual' | 'voice'
) {
  try {
    // 1. Update conversation metadata (ai_paused, priority, status) — matches LINE/Facebook behavior
    const { data: conv } = await supabase
      .from('conversations')
      .select('metadata')
      .eq('id', convId)
      .single();

    const existingMeta = (conv?.metadata as Record<string, any>) || {};
    await supabase.from('conversations').update({
      status: 'open',
      priority: 'high',
      metadata: {
        ...existingMeta,
        ai_paused: true,
        ai_paused_at: new Date().toISOString(),
        ai_paused_reason: 'customer_requested_human',
        escalation_source: source,
      },
    }).eq('id', convId);

    // 2. Persist escalation system message so agents see it in conversation thread & realtime triggers
    await supabase.from('conversation_messages').insert({
      conversation_id: convId,
      content: escalationMessage,
      sender_type: 'system',
      is_internal_note: false,
      metadata: { escalation_notice: true, source },
    });

    // 3. Generate agent helper summary (non-blocking)
    supabase.functions.invoke('agent-helper-summary', {
      body: { conversationId: convId },
    }).catch(err => console.error('[ChatWidget] agent-helper-summary error:', err));

    console.log(`[ChatWidget] Web escalation completed (${source}) for conversation ${convId}`);
  } catch (err) {
    console.error('[ChatWidget] handleWebEscalation error:', err);
  }
}

// Get or create session token from localStorage
function getGuestSessionToken(): string {
  const STORAGE_KEY = 'mobile11_guest_session_token';
  let token = localStorage.getItem(STORAGE_KEY);
  if (!token) {
    token = generateSessionToken();
    localStorage.setItem(STORAGE_KEY, token);
  }
  return token;
}

export function ChatWidget() {
  const { user } = useAuth();
  const { language: currentLanguage, t } = useLanguage();
  const [isMounted, setIsMounted] = useState(false);
  // Persist isOpen state in localStorage so chat stays open across tab switches
  const [isOpen, setIsOpen] = useState(() => {
    try {
      return localStorage.getItem('mobile11_chat_open') === 'true';
    } catch { return false; }
  });

  // Ensure component is mounted before rendering portal
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  // Persist conversationId to maintain conversation across page navigation
  const [conversationId, setConversationId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('mobile11_chat_conversation_id');
    } catch { return null; }
  });
  const [contactId, setContactId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [guestName, setGuestName] = useState('');
  // Persist showChannelSelection - if user previously selected a channel, skip it on remount
  const [showChannelSelection, setShowChannelSelection] = useState(() => {
    try {
      const saved = localStorage.getItem('mobile11_chat_channel_selected');
      return saved !== 'true'; // Show selection if NOT previously selected
    } catch { return true; }
  });
  const [sessionChecked, setSessionChecked] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [escalatedToHuman, setEscalatedToHuman] = useState(false);
  // Track when reset happened to filter messages after reset
  const [resetTimestamp, setResetTimestamp] = useState<string | null>(null);
  const [hasErudaOverlay, setHasErudaOverlay] = useState(false);
  // Welcome back prompt state
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [pendingSession, setPendingSession] = useState<{ contact: any; conversation: any } | null>(null);
  const [chatMode, setChatMode] = useState<'freetext'>('freetext');
  const [chatIntent, setChatIntent] = useState<'sales' | 'support' | null>(null);
  const [chatError, setChatError] = useState(false);
  const [showIntentSelection, setShowIntentSelection] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [showRating, setShowRating] = useState(false);
  // Drag state for movable chat window
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  // Drag state for movable chat bubble (FAB)
  const [bubblePosition, setBubblePosition] = useState<{ x: number; y: number } | null>(null);
  const isBubbleDragging = useRef(false);
  const bubbleDragStart = useRef<{ x: number; y: number } | null>(null);
  const bubbleDragOffset = useRef({ x: 0, y: 0 });
  const [ratingChannel, setRatingChannel] = useState<'web' | 'voice'>('web');
  const [conversationClosed, setConversationClosed] = useState(false);
  const debugClicksEnabled = useMemo(
    () => new URLSearchParams(window.location.search).get('debugClicks') === 'true',
    []
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const userJustSentMessageRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isOpenRef = useRef(isOpen);
  const { toast } = useToast();

  // Track if user is near the bottom of messages
  // voiceModeRef keeps handleMessagesScroll stable without re-binding on every voiceMode toggle
  const voiceModeRef = useRef(voiceMode);
  voiceModeRef.current = voiceMode;

  const handleMessagesScroll = () => {
    // During voice mode, never disable auto-scroll — transcripts must always stay visible
    if (voiceModeRef.current) return;
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    shouldAutoScrollRef.current = isNearBottom;
  };

  // Keep isOpenRef in sync with isOpen state and persist to localStorage
  useEffect(() => {
    isOpenRef.current = isOpen;
    // Clear unread count when chat is opened
    if (isOpen) {
      setUnreadCount(0);
    }
    // Persist isOpen state
    try {
      localStorage.setItem('mobile11_chat_open', String(isOpen));
    } catch {}
  }, [isOpen]);


  // Persist showChannelSelection to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mobile11_chat_channel_selected', String(!showChannelSelection));
    } catch {}
  }, [showChannelSelection]);

  // Persist conversationId to localStorage for cross-navigation persistence
  useEffect(() => {
    try {
      if (conversationId) {
        localStorage.setItem('mobile11_chat_conversation_id', conversationId);
      }
    } catch {}
  }, [conversationId]);

  // Save scroll position when tab loses focus, restore when it regains focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && messagesContainerRef.current) {
        // Save scroll position when tab loses focus
        const scrollTop = messagesContainerRef.current.scrollTop;
        try {
          sessionStorage.setItem('mobile11_chat_scroll', String(scrollTop));
        } catch {}
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Restore scroll position when chat opens and messages are loaded
  useEffect(() => {
    if (isOpen && messagesContainerRef.current && messages.length > 0) {
      try {
        const savedScroll = sessionStorage.getItem('mobile11_chat_scroll');
        if (savedScroll) {
          // Small delay to ensure messages are rendered
          setTimeout(() => {
            if (messagesContainerRef.current) {
              messagesContainerRef.current.scrollTop = parseInt(savedScroll, 10);
            }
          }, 100);
          sessionStorage.removeItem('mobile11_chat_scroll');
        }
      } catch {}
    }
  }, [isOpen, messages.length]);

  // Detect Eruda (mobile debug overlay) which can intercept clicks in bottom-right
  useEffect(() => {
    const detect = () => {
      const el = document.querySelector(
        '#eruda-entry-btn, .eruda-entry-btn, [class*="eruda-entry-btn"], #eruda'
      );
      setHasErudaOverlay(Boolean(el));
    };

    detect();

    const observer = new MutationObserver(detect);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  // Optional: global click capture logger to confirm which element receives the click
  // Enable with: ?debugClicks=true
  useEffect(() => {
    if (!debugClicksEnabled) return;

    const handler = (e: PointerEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      const topEl = document.elementFromPoint(x, y);
      console.log('[ChatWidget debugClicks] pointerdown', { x, y, target: e.target, topEl });
    };

    window.addEventListener('pointerdown', handler, true);
    return () => window.removeEventListener('pointerdown', handler, true);
  }, [debugClicksEnabled]);
  // Create a Supabase client with guest session token header for non-authenticated users
  const guestSessionToken = useMemo(() => !user ? getGuestSessionToken() : null, [user]);
  
  const guestSupabase = useMemo(() => {
    if (user || !guestSessionToken) return null;
    
    // Create a new client with the guest session token header
    // Use different storage key and disable session persistence to avoid GoTrueClient conflicts
    return createClient(
      'https://jaqyvbjllsanrnpzlyjw.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphcXl2YmpsbHNhbnJucHpseWp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MzkwNjksImV4cCI6MjA3NDUxNTA2OX0.EVJdlMp1i1chtGKxdQ66ysmC-iAGefvr9JFLlvzaC34',
      {
        auth: {
          persistSession: false,
          storageKey: 'mobile11-guest-chat'
        },
        global: {
          headers: {
            'x-guest-session-token': guestSessionToken
          }
        }
      }
    );
  }, [user, guestSessionToken]);

  // Use the appropriate client
  const getClient = () => user ? supabase : guestSupabase!;
  
  // Typing presence
  const { typingUsers, setTyping } = useChatPresence(
    conversationId,
    user?.id || guestSessionToken || undefined,
    user?.email?.split('@')[0] || guestName || 'Guest',
    'customer'
  );

  // Listen for external open requests (e.g., from Support page "Live Chat" button)
  useEffect(() => {
    const handleOpenChatWidget = () => {
      setIsOpen(true);
      setIsMinimized(false);
    };
    
    window.addEventListener('openChatWidget', handleOpenChatWidget);
    return () => window.removeEventListener('openChatWidget', handleOpenChatWidget);
  }, []);

  // Check for ?chat=open URL parameter to auto-open chat on any page
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('chat') === 'open') {
      setIsOpen(true);
      setIsMinimized(false);
      // Clean up URL to remove ?chat=open
      urlParams.delete('chat');
      const newSearch = urlParams.toString();
      const cleanUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '');
      window.history.replaceState({}, '', cleanUrl);
    }
  }, []);

  // Check for existing guest session and resume conversation
  const checkExistingGuestSession = async () => {
    if (user || !guestSessionToken || !guestSupabase) return null;
    
    try {
      // Find contact by session_token
      const { data: contact } = await guestSupabase
        .from('contacts')
        .select('id, name, email')
        .eq('session_token', guestSessionToken)
        .maybeSingle();
      
      if (!contact) return null;
      
      // Find the latest open/pending conversation for this contact
      const { data: conversation } = await guestSupabase
        .from('conversations')
        .select('id, status')
        .eq('contact_id', contact.id)
        .eq('channel', 'web')
        .in('status', ['open', 'pending'])
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      return { contact, conversation };
    } catch (error) {
      console.error('[ChatWidget] Error checking existing session:', error);
      return null;
    }
  };

  // Check for existing authenticated user session
  const checkExistingUserSession = async () => {
    if (!user) return null;
    
    try {
      // First check if we have a persisted conversationId
      const persistedConversationId = localStorage.getItem('mobile11_chat_conversation_id');
      
      if (persistedConversationId) {
        // Verify the conversation still exists and is open
        const { data: conversation } = await supabase
          .from('conversations')
          .select('id, status')
          .eq('id', persistedConversationId)
          .in('status', ['open', 'pending'])
          .maybeSingle();
        
        if (conversation) {
          // Find the contact for this user
          const { data: contact } = await supabase
            .from('contacts')
            .select('id, name')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle();
          
          if (contact) {
            return { contact, conversation };
          }
        }
      }
      
      // Fallback: find latest open conversation for this user's contact
      const { data: contact } = await supabase
        .from('contacts')
        .select('id, name')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();
      
      if (!contact) return null;
      
      const { data: conversation } = await supabase
        .from('conversations')
        .select('id, status')
        .eq('contact_id', contact.id)
        .eq('channel', 'web')
        .in('status', ['open', 'pending'])
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      return conversation ? { contact, conversation } : null;
    } catch (error) {
      console.error('[ChatWidget] Error checking user session:', error);
      return null;
    }
  };

  // Reset sessionChecked when chat closes so next open triggers a fresh check
  useEffect(() => {
    if (!isOpen) {
      setSessionChecked(false);
    }
  }, [isOpen]);

  // Resume session when chat opens (for both authenticated users and guests)
  useEffect(() => {
    if (!isOpen || sessionChecked) return;
    // For guests, wait until the guest client is ready before checking
    if (!user && (!guestSupabase || !guestSessionToken)) return;
    
    const resumeSession = async () => {
      setSessionChecked(true);
      
      // Handle both authenticated users and guests
      const existingSession = user 
        ? await checkExistingUserSession() 
        : await checkExistingGuestSession();
      
      if (existingSession?.contact && existingSession?.conversation) {
        // Check idle time using localStorage timestamp for quick check
        const IDLE_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour
        const lastActivity = localStorage.getItem('mobile11_chat_last_activity');
        const idleMs = lastActivity ? Date.now() - parseInt(lastActivity, 10) : Infinity;
        
        if (idleMs < IDLE_THRESHOLD_MS) {
          // Idle less than 1 hour - auto-resume silently
          console.log('[ChatWidget] Idle < 1 hour, auto-resuming silently');
          const { contact, conversation } = existingSession;
          setContactId(contact.id);
          setGuestName(contact.name || '');
          setConversationId(conversation.id);
          setChatMode('freetext');
          setShowResumePrompt(false);
          setShowChannelSelection(false);
          setPendingSession(null);
        } else {
          // Idle more than 1 hour - show resume prompt
          console.log('[ChatWidget] Idle > 1 hour, showing resume prompt');
          setPendingSession({ contact: existingSession.contact, conversation: existingSession.conversation });
          setShowResumePrompt(true);
          setShowChannelSelection(false);
        }
      } else {
        // No DB session found - check for persisted freetext conversation
        const persistedConversationId = localStorage.getItem('mobile11_chat_conversation_id');
        if (persistedConversationId) {
          console.log('[ChatWidget] Found persisted freetext session, showing resume prompt');
          setPendingSession(null);
          setShowResumePrompt(true);
          setShowChannelSelection(false);
          return;
        }

        // No valid session found - show channel selection
        console.log('[ChatWidget] No valid session found, showing channel selection');
        try {
          localStorage.removeItem('mobile11_chat_conversation_id');
        } catch {}
        setConversationId(null);
        setShowIntentSelection(false);
        setShowChannelSelection(true);
      }
    };
    
    resumeSession();
  }, [isOpen, sessionChecked, user, guestSupabase, guestSessionToken, currentLanguage]);

  // Contact linking: when anonymous user signs in, link their contact to authenticated user
  const prevUserRef = useRef<string | null>(null);
  useEffect(() => {
    const currentUserId = user?.id || null;
    const prevUserId = prevUserRef.current;
    prevUserRef.current = currentUserId;

    // Only act when user transitions from null → authenticated
    if (!prevUserId && currentUserId && contactId) {
      (async () => {
        try {
          // Check if authenticated user already has a contact
          const { data: existingContact } = await supabase
            .from('contacts')
            .select('id')
            .eq('user_id', currentUserId)
            .limit(1)
            .maybeSingle();

          if (existingContact && existingContact.id !== contactId) {
            // User has existing contact — move conversation to that contact
            if (conversationId) {
              await supabase
                .from('conversations')
                .update({ contact_id: existingContact.id })
                .eq('id', conversationId);
            }
            setContactId(existingContact.id);
            console.log('[ChatWidget] Linked conversation to existing contact', existingContact.id);
          } else if (!existingContact) {
            // No existing contact — claim the anonymous contact
            await supabase
              .from('contacts')
              .update({ user_id: currentUserId })
              .eq('id', contactId);
            console.log('[ChatWidget] Claimed anonymous contact for user', currentUserId);
          }
        } catch (err) {
          console.error('[ChatWidget] Contact linking error:', err);
        }
      })();
    }
  }, [user?.id, contactId, conversationId]);


  const handleContinueConversation = async () => {
    if (!pendingSession) {
      // Resume from persisted conversationId
      console.log('[ChatWidget] Resuming freetext session from localStorage');
      setChatMode('freetext');
      setShowResumePrompt(false);
      setShowChannelSelection(false);
      return;
    }
    
    const { contact, conversation } = pendingSession;
    
    setContactId(contact.id);
    setGuestName(contact.name || '');
    setConversationId(conversation.id);
    
    // Check for last reset marker to filter messages
    const client = user ? supabase : guestSupabase!;
    const { data: resetMarker } = await client
      .from('conversation_messages')
      .select('created_at')
      .eq('conversation_id', conversation.id)
      .eq('content', '[CONTEXT_RESET]')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (resetMarker) {
      setResetTimestamp(resetMarker.created_at);
    }
    
    setMessages([{
      id: 'welcome-back',
      content: t('chatbot.messages.welcomeBack') as string,
      sender_type: 'system',
      created_at: new Date().toISOString(),
    }]);
    
    setChatMode('freetext');
    setShowResumePrompt(false);
    setPendingSession(null);
  };

  // Handle "Start new topic" from welcome back prompt
  const handleStartFreshConversation = () => {
    try {
      localStorage.removeItem('mobile11_chat_conversation_id');
      localStorage.removeItem('mobile11_chatbot_flow_state');
    } catch {}
    setConversationId(null);
    setMessages([]);
    setEscalatedToHuman(false);
    setShowResumePrompt(false);
    setPendingSession(null);
    // Go straight to AI chat
    handleTalkToSupport();
  };

  // Smart auto-scroll: only scroll when user sends a message or was already at bottom
  useEffect(() => {
    if (shouldAutoScrollRef.current || userJustSentMessageRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      userJustSentMessageRef.current = false;
    }
  }, [messages]);

  // Voice mode: always scroll to bottom when messages update
  useEffect(() => {
    if (voiceMode) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }, [messages, voiceMode]);

  const stripThinkingText = (text: string): string => {
    let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
    cleaned = cleaned.replace(/\*{0,2}(thinking|reasoning|chain.of.thought)\*{0,2}[:\s]*/gi, '');
    return cleaned.replace(/^\s+|\s+$/g, '').replace(/\n{2,}/g, '\n');
  };

  const normalizeDbMessage = (msg: any): Message | null => {
    const metadata = msg?.metadata ?? undefined;
    const isAi = Boolean(metadata?.is_ai);
    // Normalize 'bot' sender_type (from save-voice-transcript) to 'ai'
    const senderType = msg.sender_type === 'bot' ? 'ai' : (isAi ? 'ai' : msg.sender_type);
    
    // Strip thinking text from content
    let content = msg.content;
    if (senderType === 'ai') {
      content = stripThinkingText(content);
      if (!content) return null; // Skip empty thinking-only messages
    }
    // Stricter filter for legacy voice messages that may contain reasoning artifacts
    const isVoice = metadata?.source === 'voice' || metadata?.voice_session;
    if (isVoice && senderType === 'ai') {
      // Drop voice messages that look like internal reasoning (markdown headers, bullet lists, etc.)
      if (/^(#{1,3}\s|[-*]\s|>\s|```)/m.test(content) && content.length > 200) {
        return null;
      }
    }

    return {
      id: msg.id,
      content,
      sender_type: senderType,
      created_at: msg.created_at,
      is_internal_note: msg.is_internal_note,
      attachments: msg.attachments ?? undefined,
      packages: metadata?.packages ?? undefined,
      configuratorUrl: metadata?.configuratorUrl ?? undefined,
      metadata,
    };
  };

  // Fetch messages from database
  const fetchMessages = async () => {
    if (!conversationId) return;
    
    const client = getClient();
    if (!client) return;

    try {
      const { data, error } = await client
        .from('conversation_messages')
        .select('id, content, sender_type, created_at, is_internal_note, attachments, metadata')
        .eq('conversation_id', conversationId)
        .eq('is_internal_note', false)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      if (data) {
        setMessages(prev => {
          // Keep welcome message
          const welcomeMsg = prev.find(m => m.id === 'welcome' || m.id === 'welcome-back');
          let fetchedMessages = (data as any[]).map(normalizeDbMessage).filter((m): m is Message => m !== null);
          
          // If reset happened, only show messages AFTER the reset timestamp
          if (resetTimestamp) {
            const resetTime = new Date(resetTimestamp).getTime();
            fetchedMessages = fetchedMessages.filter(msg => 
              new Date(msg.created_at).getTime() >= resetTime
            );
          }
          
          // NOTE: removed early return here — it was bypassing the local-message
          // preservation block below, causing voice_* ephemeral bubbles to vanish
          // when DB returns no rows (e.g. fresh session / after reset).
          
          // Merge, avoiding duplicates and PRESERVING local-only data (packages, configuratorUrl)
          const allMessages: Message[] = welcomeMsg ? [welcomeMsg] : [];
          
          fetchedMessages.forEach(msg => {
            if (!allMessages.some(m => m.id === msg.id)) {
              // Check if we have existing local data for this message (e.g., packages)
              const existingLocal = prev.find(m => m.id === msg.id);
              
              // Check if this DB message matches a local voice_* message by content+timestamp
              // This prevents duplicates when save-voice-transcript persists messages to DB
              const matchingVoiceLocal = prev.find(m =>
                m.id.startsWith('voice_') &&
                m.content === msg.content &&
                Math.abs(new Date(m.created_at).getTime() - new Date(msg.created_at).getTime()) < 10000
              );
              
              if (matchingVoiceLocal) {
                // Replace the voice_* local message with DB version in allMessages
                // (it will be removed from local-only preservation below since we mark it as matched)
                // For now just add the DB version — the local one won't be re-added below
                // because we'll filter it out
              }
              
              allMessages.push({
                ...msg,
                packages: existingLocal?.packages || msg.packages,
                configuratorUrl: existingLocal?.configuratorUrl || msg.configuratorUrl
              });
            }
          });
          
          // IMPORTANT: Also keep AI messages that aren't in DB yet (they have ai- prefix IDs)
          // and system/escalation messages — but skip voice_* messages that already have a DB match
          prev.forEach(localMsg => {
            const isLocalOnly = localMsg.id.startsWith('ai-') || 
                               localMsg.id.startsWith('escalate-') ||
                               localMsg.id.startsWith('system-reset-') ||
                               localMsg.id.startsWith('temp-') ||
                               localMsg.id.startsWith('voice_');
            if (isLocalOnly && !allMessages.some(m => m.id === localMsg.id)) {
              // Skip voice_* messages that were already replaced by their DB counterparts
              if (localMsg.id.startsWith('voice_')) {
                const hasDbMatch = allMessages.some(m =>
                  !m.id.startsWith('voice_') &&
                  m.content === localMsg.content &&
                  Math.abs(new Date(m.created_at).getTime() - new Date(localMsg.created_at).getTime()) < 10000
                );
                if (hasDbMatch) return; // Skip — DB version already added
              }
              allMessages.push(localMsg);
            }
          });
          
          // Sort by created_at to maintain order
          return allMessages.sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });
      }
    } catch (err) {
      console.error('Error in fetchMessages:', err);
    }
  };

  // Subscribe to new messages + polling fallback for guests
  useEffect(() => {
    if (!conversationId) return;

    const client = getClient();
    if (!client) return;

    // Initial fetch
    fetchMessages();

    // Set up real-time subscription
    const channel = client
      .channel(`conversation-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const newMessage = normalizeDbMessage(payload.new);
          if (!newMessage) return; // Skip thinking-only messages
          // Update last activity on incoming messages
          try { localStorage.setItem('mobile11_chat_last_activity', String(Date.now())); } catch {}
          if (!newMessage.is_internal_note) {
            setMessages(prev => {
              // Avoid duplicates
              if (prev.some(m => m.id === newMessage.id)) return prev;
              
              // Check if this message already exists as a local AI or voice message (by content match)
              // This happens when AI/voice response is saved to DB after being added locally
              const existingLocalMsg = prev.find(m => 
                (m.id.startsWith('ai-') || m.id.startsWith('voice_')) && 
                m.content === newMessage.content &&
                Math.abs(new Date(m.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 10000
              );
              
              if (existingLocalMsg) {
                // Replace local message with DB version, MERGE packages from both sources
                return prev.map(m => 
                  m.id === existingLocalMsg.id 
                    ? { 
                        ...newMessage, 
                        packages: existingLocalMsg.packages || newMessage.packages, 
                        configuratorUrl: existingLocalMsg.configuratorUrl || newMessage.configuratorUrl 
                      }
                    : m
                );
              }
              
              return [...prev, newMessage];
            });
            // Increment unread count if chat is closed and message is from agent
            if (!isOpenRef.current && newMessage.sender_type === 'agent') {
              setUnreadCount(prev => prev + 1);
            }
          }
        }
      )
      .subscribe();

    // Polling fallback every 5 seconds for reliability (especially for guests)
    const pollInterval = setInterval(fetchMessages, 5000);

    return () => {
      client.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [conversationId, user, guestSupabase]);

  const initializeConversationUI = async (newConversationId: string) => {
    setConversationId(newConversationId);

    const welcomeContent = t('chatbot.messages.welcome') as string;

    // Add welcome message locally
    setMessages([
      {
        id: 'welcome',
        content: welcomeContent,
        sender_type: 'system',
        created_at: new Date().toISOString(),
      },
    ]);

    // Persist welcome message to DB so AI knows greeting was already shown
    try {
      const client = getClient();
      if (client) {
        await client.from('conversation_messages').insert({
          conversation_id: newConversationId,
          content: welcomeContent,
          sender_type: 'ai',
          is_internal_note: false,
        });
      }
    } catch (e) {
      console.error('Failed to persist welcome message:', e);
    }
  };

  // Start anonymous conversation for guests
  const startAnonymousConversation = async () => {
    setIsLoading(true);
    const client = getClient();

    if (!client) {
      console.error('No Supabase client available');
      toast({ title: 'Error', description: 'Unable to start chat', variant: 'destructive' });
      setChatError(true);
      setIsLoading(false);
      return;
    }

    try {
      // Generate anonymous guest name
      const anonymousName = `Guest_${guestSessionToken?.slice(-6) || crypto.randomUUID().slice(0, 6)}`;
      
      // Create anonymous contact
      const { data: contact, error: contactError } = await client
        .from('contacts')
        .insert({
          name: anonymousName,
          session_token: guestSessionToken
        })
        .select('id')
        .single();

      if (contactError) {
        console.error('Error creating anonymous contact:', contactError);
        throw contactError;
      }

      const newContactId = contact.id;
      setContactId(newContactId);
      setGuestName(anonymousName);

      // Create conversation
      const { data: conversation, error: convError } = await client
        .from('conversations')
        .insert({
          contact_id: newContactId,
          channel: 'web',
          status: 'open',
          subject: 'Web Chat',
          metadata: chatIntent ? { intent: chatIntent } : undefined,
        })
        .select('id')
        .single();

      if (convError) throw convError;
      initializeConversationUI(conversation.id);
    } catch (error) {
      console.error('Error starting anonymous conversation:', error);
      setChatError(true);
      toast({ title: 'Error', description: 'Unable to start chat. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Start conversation for logged-in users
  const startUserConversation = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const client = supabase;

    try {
      let newContactId = contactId;

      if (!newContactId) {
        // Prefer user_id-based lookup (safe with RLS)
        const { data: byUser } = await client
          .from('contacts')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (byUser?.id) {
          newContactId = byUser.id;
        } else {
          const contactData = {
            user_id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.email?.split('@')[0],
          };

          const { data: contact, error: contactError } = await client
            .from('contacts')
            .insert(contactData)
            .select('id')
            .single();

          if (contactError) {
            // If email is already used, create a user-only contact
            if (contactError.code === '23505') {
              const { data: fallbackContact, error: fallbackError } = await client
                .from('contacts')
                .insert({ user_id: user.id, name: user.user_metadata?.full_name || user.email?.split('@')[0] })
                .select('id')
                .single();

              if (fallbackError) throw fallbackError;
              newContactId = fallbackContact.id;
            } else {
              throw contactError;
            }
          } else {
            newContactId = contact.id;
          }
        }

        setContactId(newContactId);
        setGuestName(user.user_metadata?.full_name || user.email?.split('@')[0] || '');
      }

      // Create conversation
      const { data: conversation, error: convError } = await client
        .from('conversations')
        .insert({
          contact_id: newContactId,
          channel: 'web',
          status: 'open',
          subject: 'Web Chat',
          metadata: chatIntent ? { intent: chatIntent } : undefined,
        })
        .select('id')
        .single();

      if (convError) throw convError;
      initializeConversationUI(conversation.id);
    } catch (error) {
      console.error('Error starting user conversation:', error);
      setChatError(true);
      toast({ title: 'Error', description: 'Unable to start chat. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle quick reply button clicks
  const handleQuickReply = (message: string) => {
    if (!message || !conversationId) return;
    setInput(message);
    // Trigger send immediately
    setTimeout(() => {
      const form = document.querySelector('form[data-chat-form]') as HTMLFormElement;
      if (form) {
        form.requestSubmit();
      }
    }, 50);
  };

  const sendMessage = async () => {
    if ((!input.trim() && pendingAttachments.length === 0) || !conversationId) return;
    
    // Flag to auto-scroll after sending
    userJustSentMessageRef.current = true;
    // Update last activity timestamp for idle detection
    try { localStorage.setItem('mobile11_chat_last_activity', String(Date.now())); } catch {}

    const client = getClient();
    if (!client) return;

    const messageContent = input.trim() || (pendingAttachments.length > 0 ? '[Attachment]' : '');
    setInput('');
    setTyping(false);
    const attachmentsToSend = [...pendingAttachments];
    setPendingAttachments([]);

    // Optimistically add message with temp ID
    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: tempId,
      content: messageContent,
      sender_type: 'customer',
      created_at: new Date().toISOString(),
      attachments: attachmentsToSend.length > 0 ? attachmentsToSend : undefined
    }]);

    try {
      const messageData: any = {
        conversation_id: conversationId,
        content: messageContent,
        sender_type: 'customer',
        sender_id: user?.id || null
      };
      
      if (attachmentsToSend.length > 0) {
        messageData.attachments = attachmentsToSend;
      }
      
      const { data: savedMessage, error: msgError } = await client
        .from('conversation_messages')
        .insert(messageData)
        .select('id')
        .single();

      if (msgError) {
        console.error('Message send error:', msgError);
        throw msgError;
      }

      // Replace temp message with real ID to prevent duplicates from realtime subscription
      if (savedMessage?.id) {
        setMessages(prev => prev.map(m => 
          m.id === tempId ? { ...m, id: savedMessage.id } : m
        ));
      }

      // Update conversation timestamp
      await client
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      // ═══ NOTIFY AGENTS for every web chat message ═══
      if (conversationId) {
        supabase.functions.invoke('notify-agents', {
          body: {
            conversationId,
            messagePreview: messageContent,
            channel: 'web',
            senderName: 'Web Chat Customer'
          }
        }).catch(err => console.error('Failed to notify agents:', err));
      }

      // Handle "bot" keyword to return from human agent to AI
      const normalizedMsg = messageContent.toLowerCase().trim();
      if (escalatedToHuman && normalizedMsg === 'bot') {
        console.log('[ChatWidget] "bot" keyword detected, returning to AI mode');
        setEscalatedToHuman(false);
        setMessages(prev => [...prev, {
          id: `bot-return-${Date.now()}`,
          content: '🔄 Starting fresh! Feel free to ask a new question!',
          sender_type: 'system',
          created_at: new Date().toISOString()
        }]);
        return; // Don't process "bot" as a real message for AI
      }

      // Get AI response if not escalated
      // Filter image attachments to send for vision analysis
      const imageAttachmentsForAI = attachmentsToSend
        .filter(a => ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(a.type))
        .map(a => ({ path: a.path, type: a.type, name: a.name }));
      
      if (!escalatedToHuman) {
        console.log('[ChatWidget] Getting AI response for:', messageContent, 'with', imageAttachmentsForAI.length, 'images');
        await getAIResponse(messageContent, savedMessage?.id || null, imageAttachmentsForAI);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  // Get AI response for user message with SSE streaming
  const getAIResponse = async (userMessage: string, messageId: string | null, imageAttachments: { path: string; type: string; name: string }[] = []) => {
    if (!conversationId) {
      console.log('[ChatWidget] No conversationId, skipping AI response');
      return;
    }

    console.log('[ChatWidget] Requesting AI response (streaming) for:', userMessage);
    setIsAiTyping(true);

    // Detect user's device for installation guidance
    const deviceInfo = detectDevice();

    // Create placeholder AI message for streaming
    const streamingMsgId = `ai-streaming-${Date.now()}`;
    let streamedContent = '';
    let metadata: any = null;
    let finalData: any = null;

    try {
      const response = await fetch(
        `https://jaqyvbjllsanrnpzlyjw.supabase.co/functions/v1/ai-chat-response`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage,
            conversationId,
            language: currentLanguage,
            messageId,
            deviceInfo,
            userId: user?.id || null,
            baseUrl: window.location.origin,
            chatMode: chatMode,
            attachments: imageAttachments.length > 0 ? imageAttachments : undefined,
            intent: chatIntent || undefined
          }),
        }
      );

      console.log('[ChatWidget] AI response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ChatWidget] AI response error:', response.status, errorText);
        const errorMsg = t('chatbot.messages.errorResponse') as string;
        setMessages(prev => [...prev, {
          id: `error-${Date.now()}`,
          content: errorMsg,
          sender_type: 'system',
          created_at: new Date().toISOString()
        }]);
        return;
      }

      // Check if response is SSE stream
      const contentType = response.headers.get('content-type');
      const isSSE = contentType?.includes('text/event-stream');

      if (isSSE && response.body) {
        // Handle SSE streaming
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let hasAddedPlaceholder = false;

        let streamTimeoutId: ReturnType<typeof setTimeout> | null = null;
        const resetStreamTimeout = () => {
          if (streamTimeoutId) clearTimeout(streamTimeoutId);
          streamTimeoutId = setTimeout(() => {
            console.error('[ChatWidget] Stream timeout - no data for 30s');
            reader.cancel();
          }, 30000);
        };
        resetStreamTimeout();

        while (true) {
          const { done, value } = await reader.read();
          if (streamTimeoutId) clearTimeout(streamTimeoutId);
          if (done) break;
          resetStreamTimeout();

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE lines
          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
            let line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);

            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':') || line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') {
              break;
            }

            try {
              const parsed = JSON.parse(jsonStr);
              
              if (parsed.type === 'metadata') {
                // Store metadata for later use
                metadata = parsed;
                console.log('[ChatWidget] Received metadata:', metadata);
              } else if (parsed.type === 'delta') {
                // Append content and update message
                streamedContent += parsed.content;
                
                if (!hasAddedPlaceholder) {
                  // Add placeholder message for streaming
                  hasAddedPlaceholder = true;
                  setMessages(prev => [...prev, {
                    id: streamingMsgId,
                    content: streamedContent,
                    sender_type: 'ai',
                    created_at: new Date().toISOString(),
                    packages: metadata?.packages?.length > 0 ? metadata.packages : undefined,
                    configuratorUrl: metadata?.configuratorUrl || undefined,
                    detectedDays: metadata?.detectedDays || undefined,
                  }]);
                } else {
                  // Update existing streaming message
                  setMessages(prev => prev.map(m => 
                    m.id === streamingMsgId 
                      ? { ...m, content: streamedContent }
                      : m
                  ));
                }
              } else if (parsed.type === 'done') {
                // Final message with sanitized content and confidence
                finalData = parsed;
                streamedContent = parsed.content;
                
                // Update message with final content
                setMessages(prev => prev.map(m => 
                  m.id === streamingMsgId 
                    ? { ...m, content: streamedContent }
                    : m
                ));
              }
            } catch (e) {
              // Malformed JSON - put back in buffer and wait for next chunk
              buffer = line + '\n' + buffer;
              break; // break inner loop to read more data from stream
            }
          }
        }

        // Save final message to database
        if (streamedContent && (metadata || finalData)) {
          const client = getClient();
          if (client) {
            const aiMessageData = {
              conversation_id: conversationId,
              content: streamedContent,
              sender_type: 'agent',
              sender_id: null,
              metadata: {
                is_ai: true,
                confidence: finalData?.confidence || 0.85,
                packages: metadata?.packages?.length > 0 ? metadata.packages : null,
                configuratorUrl: metadata?.configuratorUrl || null,
                detectedDays: metadata?.detectedDays || null,
              }
            };

            const { data: insertedMsg, error: aiMsgError } = await client
              .from('conversation_messages')
              .insert(aiMessageData)
              .select('id, created_at')
              .single();

            if (!aiMsgError && insertedMsg) {
              // Replace streaming ID with real DB ID
              setMessages(prev => prev.map(m => 
                m.id === streamingMsgId 
                  ? { ...m, id: insertedMsg.id, created_at: insertedMsg.created_at }
                  : m
              ));
            }

            // Check if should escalate
            if (finalData?.escalate) {
              console.log('AI suggests escalation, notifying user');
              setMessages(prev => [...prev, {
                id: `escalate-${Date.now()}`,
                content: t('chatbot.messages.connectingAgent') as string,
                sender_type: 'system',
                created_at: new Date().toISOString()
              }]);
              setEscalatedToHuman(true);
              
              if (conversationId) {
                const escMsg = t('chatbot.messages.connectingAgent') as string;
                handleWebEscalation(conversationId, escMsg, 'ai_streaming');
                supabase.functions.invoke('notify-agents', {
                  body: { conversationId, messagePreview: '🚨 Customer requested human agent', channel: 'web', senderName: 'Web Chat Customer' }
                }).catch(err => console.error('Failed to notify agents:', err));
                supabase.functions.invoke('notify-line-group', {
                  body: { conversationId, customerName: 'Web Chat Customer', channel: 'web', messagePreview: '🚨 Customer requested human agent (AI escalation)' }
                }).catch(err => console.error('Failed to notify LINE group:', err));
              }
            }

            // Set device_incompatible flag on conversation if detected
            if (finalData?.deviceIncompatible && conversationId) {
              console.log('[ChatWidget] Device incompatible detected, setting metadata');
              const client = getClient();
              if (client) {
                client.from('conversations').select('metadata').eq('id', conversationId).single().then(({ data: convData }) => {
                  if (convData) {
                    client.from('conversations').update({
                      metadata: { ...(convData.metadata as Record<string, unknown> || {}), device_incompatible: true },
                      updated_at: new Date().toISOString()
                    }).eq('id', conversationId).then(() => {});
                  }
                });
              }
            }

            // Check if AI suggests showing rating prompt (conversation resolved)
            if (finalData?.requestRating) {
              console.log('[ChatWidget] AI triggered rating prompt');
              setRatingChannel('web');
              setShowRating(true);
            }
          }
        }
      } else {
        // Fallback: handle non-streaming JSON response
        const data = await response.json();
        console.log('[ChatWidget] AI response data (non-streaming):', data);

        if (data.shouldRespond && data.response) {
          const client = getClient();
          if (!client) return;

          const aiMessageData = {
            conversation_id: conversationId,
            content: data.response,
            sender_type: 'agent',
            sender_id: null,
            metadata: {
              is_ai: true,
              confidence: data.confidence,
              packages: data.packages?.length > 0 ? data.packages : null,
              configuratorUrl: data.configuratorUrl || null,
              detectedDays: data.detectedDays || null,
            }
          };

          const { data: insertedMsg, error: aiMsgError } = await client
            .from('conversation_messages')
            .insert(aiMessageData)
            .select('id, created_at')
            .single();

          if (aiMsgError) {
            console.error('Error saving AI message:', aiMsgError);
            setMessages(prev => [...prev, {
              id: `ai-${Date.now()}`,
              content: data.response,
              sender_type: 'ai',
              created_at: new Date().toISOString(),
              packages: data.packages?.length > 0 ? data.packages : undefined,
              configuratorUrl: data.configuratorUrl || undefined,
              detectedDays: data.detectedDays || undefined,
            }]);
          } else {
            setMessages(prev => {
              if (prev.some(m => m.id === insertedMsg.id)) {
                return prev.map(m => m.id === insertedMsg.id 
                  ? { ...m, packages: data.packages?.length > 0 ? data.packages : undefined, configuratorUrl: data.configuratorUrl || undefined, detectedDays: data.detectedDays || undefined }
                  : m
                );
              }
              return [...prev, {
                id: insertedMsg.id,
                content: data.response,
                sender_type: 'ai',
                created_at: insertedMsg.created_at,
                packages: data.packages?.length > 0 ? data.packages : undefined,
                configuratorUrl: data.configuratorUrl || undefined,
                detectedDays: data.detectedDays || undefined,
              }];
            });
          }

          if (data.escalate) {
            console.log('AI suggests escalation, notifying user');
            setMessages(prev => [...prev, {
              id: `escalate-${Date.now()}`,
              content: t('chatbot.messages.connectingAgent') as string,
              sender_type: 'system',
              created_at: new Date().toISOString()
            }]);
            setEscalatedToHuman(true);
            
            if (conversationId) {
              const escMsg = t('chatbot.messages.connectingAgent') as string;
              handleWebEscalation(conversationId, escMsg, 'ai_nonstreaming');
              supabase.functions.invoke('notify-agents', {
                body: { conversationId, messagePreview: '🚨 Customer requested human agent', channel: 'web', senderName: 'Web Chat Customer' }
              }).catch(err => console.error('Failed to notify agents:', err));
              supabase.functions.invoke('notify-line-group', {
                body: { conversationId, customerName: 'Web Chat Customer', channel: 'web', messagePreview: '🚨 Customer requested human agent (AI escalation)' }
              }).catch(err => console.error('Failed to notify LINE group:', err));
            }
          }
        }
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      // Show fallback error message to user
      const fallbackMsg = t('chatbot.messages.errorFallback') as string;
      setMessages(prev => {
        // Only add error if no AI response was already streamed
        const hasStreamedResponse = prev.some(m => m.id?.startsWith('ai-streaming-'));
        if (!hasStreamedResponse || !prev.some(m => m.id?.startsWith('ai-streaming-') && m.content)) {
          return [...prev, {
            id: `error-${Date.now()}`,
            content: fallbackMsg,
            sender_type: 'system',
            created_at: new Date().toISOString()
          }];
        }
        return prev;
      });
    } finally {
      setIsAiTyping(false);
    }
  };

  // Handle request for human agent
  const handleRequestHuman = () => {
    const escMsg = t('chatbot.messages.connectingAgent') as string;
    setEscalatedToHuman(true);
    setMessages(prev => [...prev, {
      id: `escalate-${Date.now()}`,
      content: escMsg,
      sender_type: 'system',
      created_at: new Date().toISOString()
    }]);
    
    if (conversationId) {
      handleWebEscalation(conversationId, escMsg, 'manual');
      supabase.functions.invoke('notify-agents', {
        body: { conversationId, messagePreview: '🚨 Customer requested human agent', channel: 'web', senderName: 'Web Chat Customer' }
      }).catch(err => console.error('Failed to notify agents:', err));
      supabase.functions.invoke('notify-line-group', {
        body: { conversationId, customerName: 'Web Chat Customer', channel: 'web', messagePreview: '🚨 Customer manually requested human agent' }
      }).catch(err => console.error('Failed to notify LINE group:', err));
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    setTyping(true);
  };
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !conversationId) return;
    
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    
    setUploading(true);
    const uploaded: Attachment[] = [];
    
    try {
      for (const file of Array.from(files)) {
        if (file.size > MAX_FILE_SIZE) {
          toast({ title: 'File too large', description: `${file.name} exceeds 10MB`, variant: 'destructive' });
          continue;
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
          toast({ title: 'Invalid file type', description: `${file.name} not supported`, variant: 'destructive' });
          continue;
        }
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${conversationId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error } = await supabase.storage.from('ticket-attachments').upload(fileName, file);
        if (error) throw error;
        
        uploaded.push({ name: file.name, path: fileName, type: file.type, size: file.size });
      }
      
      if (uploaded.length > 0) {
        setPendingAttachments(prev => [...prev, ...uploaded]);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleOpen = () => {
    // Visible confirmation that the click handler fired
    toast({ title: 'Opening chat…' });

    console.log('Chat button clicked - handleOpen called');
    setIsOpen(true);
    setIsMinimized(false);

    // Show intent selection when opening chat (for new conversations)
    console.log('Showing intent selection');
    setShowIntentSelection(true);
    setShowChannelSelection(false);
  };

  const handleIntentSelect = (intent: 'sales' | 'support') => {
    setChatIntent(intent);
    setShowIntentSelection(false);
    setShowChannelSelection(true);
  };

  const handleChannelSelect = (channel: ChatChannel) => {
    if (channel === 'web') {
      // Go straight to AI freetext chat
      setShowChannelSelection(false);
      handleTalkToSupport();
    } else if (channel === 'line') {
      // Open LINE Official Account in new tab
      const lineUrl = CHAT_CHANNELS.line.url;
      if (lineUrl) {
        window.open(lineUrl, '_blank');
      }
    } else if (channel === 'facebook') {
      // Open Facebook Messenger in new tab
      const fbUrl = CHAT_CHANNELS.facebook.url;
      if (fbUrl) {
        window.open(fbUrl, '_blank');
      }
    } else if (channel === 'whatsapp') {
      return;
    }
  };

  // Handle sign-in click from channel selection — minimize widget so auth modal is visible
  const handleChatSignIn = () => {
    setIsMinimized(true);
    window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { tab: 'signin' } }));
  };

  // Auto-restore chat widget after user signs in
  const prevUserForRestoreRef = useRef<string | null>(user?.id || null);
  useEffect(() => {
    const currentUserId = user?.id || null;
    const prevUserId = prevUserForRestoreRef.current;
    prevUserForRestoreRef.current = currentUserId;

    if (!prevUserId && currentUserId && isMinimized) {
      setIsMinimized(false);
    }
  }, [user?.id, isMinimized]);

  // Handle escalation to AI support from flow-based chat (conversational mode)
  const handleTalkToSupport = async () => {
    setChatMode('freetext');
    setShowChannelSelection(false);
    setChatError(false);
    // Keep AI active - don't set escalatedToHuman to true
    // This allows AI to respond conversationally as a support agent
    
    // Start a conversation if not already started
    if (!conversationId) {
      setIsLoading(true);
      if (user) {
        await startUserConversation();
      } else {
        await startAnonymousConversation();
      }
    }
    
    // Add AI welcome message (not escalation message)
    setMessages(prev => [...prev, {
      id: `ai-welcome-${Date.now()}`,
      content: t('chatbot.messages.aiWelcome') as string,
      sender_type: 'ai',
      created_at: new Date().toISOString()
    }]);
  };

  // Handle reset conversation (clear context, start fresh topic)
  const handleResetConversation = async () => {
    const now = new Date().toISOString();
    
    // Track reset timestamp to filter out old messages
    setResetTimestamp(now);
    
    // Add system message locally
    const resetMessage: Message = {
      id: `system-reset-${Date.now()}`,
      content: t('chatbot.messages.resetConversation') as string,
      sender_type: 'system',
      created_at: now
    };
    
    setMessages([resetMessage]);
    
    // Insert hidden reset marker to DB so backend knows to ignore previous context
    if (conversationId) {
      const client = getClient();
      await client?.from('conversation_messages').insert({
        conversation_id: conversationId,
        content: '[CONTEXT_RESET]',
        sender_type: 'system',
        is_internal_note: true,
        created_at: now
      });
      console.log('[ChatWidget] Context reset marker inserted at:', now);
    }
    
    // Clear persisted conversationId so a fresh one is created next time
    try { localStorage.removeItem('mobile11_chat_conversation_id'); } catch {}
  };

  // Don't render until mounted to ensure document.body is available
  if (!isMounted) return null;

  // Position chat button above sticky checkout bar to avoid blocking
  const chatButtonStyle: React.CSSProperties = bubblePosition
    ? {
        pointerEvents: 'auto',
        left: `${bubblePosition.x}px`,
        top: `${bubblePosition.y}px`,
        right: 'auto',
        bottom: 'auto',
      }
    : {
        pointerEvents: 'auto',
        right: '1.5rem',
        bottom: hasErudaOverlay ? '8rem' : '6.5rem',
      };

  // Bubble drag handlers
  const handleBubblePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    bubbleDragStart.current = { x: e.clientX, y: e.clientY };
    isBubbleDragging.current = false;
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    bubbleDragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    el.setPointerCapture(e.pointerId);
  };

  const handleBubblePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!bubbleDragStart.current) return;
    const dx = e.clientX - bubbleDragStart.current.x;
    const dy = e.clientY - bubbleDragStart.current.y;
    if (!isBubbleDragging.current && Math.sqrt(dx * dx + dy * dy) < 5) return;
    isBubbleDragging.current = true;
    const el = e.currentTarget;
    const maxX = window.innerWidth - el.offsetWidth;
    const maxY = window.innerHeight - el.offsetHeight;
    const newX = Math.max(0, Math.min(maxX, e.clientX - bubbleDragOffset.current.x));
    const newY = Math.max(0, Math.min(maxY, e.clientY - bubbleDragOffset.current.y));
    setBubblePosition({ x: newX, y: newY });
  };

  const handleBubblePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    const wasDragging = isBubbleDragging.current;
    bubbleDragStart.current = null;
    isBubbleDragging.current = false;
    if (!wasDragging) {
      handleOpen();
    }
  };

  // Drag handlers for movable chat window
  const handleDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only drag from header area, not buttons
    if ((e.target as HTMLElement).closest('button')) return;
    isDraggingRef.current = true;
    const chatEl = (e.currentTarget as HTMLElement).closest('[data-chat-window]') as HTMLElement;
    if (!chatEl) return;
    const rect = chatEl.getBoundingClientRect();
    dragOffsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const handleDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const chatEl = (e.currentTarget as HTMLElement).closest('[data-chat-window]') as HTMLElement;
    if (!chatEl) return;
    const maxX = window.innerWidth - chatEl.offsetWidth;
    const maxY = window.innerHeight - chatEl.offsetHeight;
    const newX = Math.max(0, Math.min(maxX, e.clientX - dragOffsetRef.current.x));
    const newY = Math.max(0, Math.min(maxY, e.clientY - dragOffsetRef.current.y));
    setDragPosition({ x: newX, y: newY });
  };

  const handleDragEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const chatWindowStyle: React.CSSProperties = dragPosition
    ? {
        pointerEvents: 'auto',
        left: `${dragPosition.x}px`,
        top: `${dragPosition.y}px`,
        right: 'auto',
        bottom: 'auto',
      }
    : {
        pointerEvents: 'auto',
        right: '1.5rem',
        bottom: hasErudaOverlay ? '9rem' : '6rem',
      };

  return createPortal(
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed z-[10000]"
            style={{ ...chatButtonStyle, touchAction: 'none', cursor: 'grab' }}
            onPointerDown={handleBubblePointerDown}
            onPointerMove={handleBubblePointerMove}
            onPointerUp={handleBubblePointerUp}
          >
            <Button
              type="button"
              size="lg"
              className="h-12 w-12 rounded-full bg-white border border-orange-200 hover:border-orange-300 text-orange-500 shadow-md hover:shadow-lg relative pointer-events-none"
            >
              <MessageCircle className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? 'auto' : '600px'
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "fixed z-[10000] w-[380px] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-8rem)] bg-[#FAF7F2] border border-gray-200 rounded-xl shadow-2xl overflow-hidden flex flex-col",
              isMinimized && "h-auto"
            )}
            style={chatWindowStyle}
            data-chat-window
          >
            {/* Header — draggable handle */}
            <div
              className="bg-white border-b border-gray-200 text-gray-900 p-4 flex items-center justify-between select-none"
              style={{ cursor: isDraggingRef.current ? 'grabbing' : 'grab', touchAction: 'none' }}
              onPointerDown={handleDragStart}
              onPointerMove={handleDragMove}
              onPointerUp={handleDragEnd}
            >
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-gray-300" />
                <MessageCircle className="h-5 w-5 text-orange-500" />
                <span className="font-semibold">{t('chatbot.widget.chatTitle')}</span>
              </div>
              <div className="flex items-center gap-1">
                {/* Reset button - only show in freetext mode with active conversation */}
                {chatMode === 'freetext' && conversationId && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      onClick={() => {
                        if (voiceMode) {
                          setVoiceMode(false);
                        } else {
                          setVoiceMode(true);
                        }
                      }}
                      title={voiceMode 
                        ? (t('chatbot.widget.endVoiceMode'))
                        : (t('chatbot.widget.voiceMode'))
                      }
                    >
                      <Mic className={cn("h-4 w-4", voiceMode && "text-orange-500")} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      onClick={handleResetConversation}
                      title={t('chatbot.widget.newTopic')}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  onClick={() => { setIsOpen(false); setDragPosition(null); }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Intent Selection */}
                {showIntentSelection && !showChannelSelection && !showResumePrompt && (
                  <IntentSelection onSelectIntent={handleIntentSelect} />
                )}

                {/* Channel Selection */}
                {showChannelSelection && !showIntentSelection && (
                  <ChannelSelection 
                    onSelectChannel={handleChannelSelect} 
                    intent={chatIntent}
                    onSignInClick={handleChatSignIn}
                    isLoggedIn={!!user}
                  />
                )}

                {/* Loading state while starting chat */}
                {isLoading && !showChannelSelection && chatMode === 'freetext' && (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {t('chatbot.widget.startingChat')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Welcome Back Resume/Reset Prompt */}
                {showResumePrompt && !showChannelSelection && (
                  <div className="flex-1 flex items-center justify-center p-6 bg-[#FAF7F2]">
                    <div className="w-full max-w-xs text-center space-y-4">
                      <div>
                        <p className="text-lg font-semibold text-foreground">{t('chatbot.widget.welcomeBack')}</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          {t('chatbot.widget.previousConversation')}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Button 
                          className="w-full" 
                          variant="default" 
                          onClick={handleContinueConversation}
                        >
                          {t('chatbot.widget.continueConversation')}
                        </Button>
                        <Button 
                          className="w-full bg-white border-orange-300 text-orange-700 hover:bg-orange-50 hover:text-orange-800 hover:border-orange-400" 
                          variant="outline" 
                          onClick={handleStartFreshConversation}
                        >
                          {t('chatbot.widget.startNewTopic')}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Free-text Chat (AI support mode) */}
                {!showChannelSelection && !showResumePrompt && chatMode === 'freetext' && conversationId && (
                  <>
                    <div 
                      ref={messagesContainerRef}
                      data-chat-messages
                      onScroll={handleMessagesScroll}
                      className={cn("flex-1 min-h-0 overflow-y-auto p-4 space-y-3 bg-[#FAF7F2]", voiceMode && "pb-24")}
                    >
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            "max-w-[80%] rounded-lg text-sm",
                            message.sender_type === 'customer'
                              ? "bg-orange-500 text-white ml-auto"
                              : message.sender_type === 'system'
                              ? "bg-white text-gray-600 border border-gray-200 mx-auto text-center"
                              : message.sender_type === 'ai'
                              ? "bg-white text-gray-900 border border-gray-200"
                              : "bg-white text-gray-900 border border-gray-200"
                          )}
                        >
                          {/* AI/Agent indicator */}
                          {(message.sender_type === 'ai' || message.sender_type === 'agent') && (
                            <div className="flex items-center gap-1.5 px-3 pt-2 text-xs text-gray-500">
                              {message.sender_type === 'ai' ? (
                                <>
                                  <Bot className="h-3 w-3" />
                                  <span>AI Assistant</span>
                                </>
                              ) : (
                                <>
                                  <User className="h-3 w-3" />
                                  <span>Agent</span>
                                </>
                              )}
                            </div>
                          )}
                          {message.content && message.content !== '[Attachment]' && (
                            <ChatMessageContent content={message.content} senderType={message.sender_type} />
                          )}
                          {/* Package List - display when AI recommends packages */}
                          {message.packages && message.packages.length > 0 && (
                            <div className="px-3 pb-3">
                              <PackageList 
                                packages={message.packages.map(pkg => ({
                                  id: pkg.id,
                                  name: pkg.name,
                                  price: pkg.price,
                                  currency: pkg.currency,
                                  packageType: pkg.package_type,
                                  validityDays: pkg.validity_days,
                                  dataAmount: pkg.data_amount,
                                  cartUrl: pkg.cartUrl
                                }))}
                                configuratorUrl={message.configuratorUrl}
                                country={message.packages[0]?.country_name}
                                initialDays={message.detectedDays}
                              />
                            </div>
                          )}
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="p-2">
                              <ChatAttachments attachments={message.attachments} />
                            </div>
                          )}
                          {(!message.attachments || message.attachments.length === 0) && !message.packages?.length && (
                            <div className="pb-2" />
                          )}
                        </div>
                        ))}
                        
                        {/* Quick Replies - show after welcome message if only 1 message (welcome) */}
                        {messages.length === 1 && messages[0].sender_type === 'system' && !isAiTyping && (
                          <QuickReplies 
                            onQuickReply={handleQuickReply}
                            disabled={isLoading}
                          />
                        )}
                        
                        {isAiTyping && (
                          <div className="flex items-center gap-2 text-gray-500 text-sm">
                            <Bot className="h-4 w-4 animate-pulse" />
                            <span>{t('chatbot.widget.agentTyping')}</span>
                          </div>
                        )}
                        <TypingIndicator typingUsers={typingUsers} compact />
                        {showRating && conversationId && (
                          <ChatRatingPrompt
                            conversationId={conversationId}
                            channel={ratingChannel}
                            onRatingSubmitted={() => {
                              const closingTexts: Record<string, string> = {
                                en: 'Thank you for your rating! 🙏 This conversation will be closed now. Have a great day!',
                                th: 'ขอบคุณสำหรับการให้คะแนนค่ะ! 🙏 บทสนทนานี้จะถูกปิดแล้วนะคะ ขอให้มีวันที่ดีค่ะ!',
                              };
                              const closingText = closingTexts[currentLanguage] || closingTexts.en;
                              setMessages(prev => [...prev, {
                                id: `closing_${Date.now()}`,
                                content: closingText,
                                sender_type: 'ai',
                                created_at: new Date().toISOString(),
                              }]);
                              setConversationClosed(true);
                            }}
                            onComplete={() => setShowRating(false)}
                          />
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                    {/* Request Human button */}
                    {!escalatedToHuman && !conversationClosed && messages.length > 2 && (
                      <div className="px-4 py-2 border-t border-gray-200 bg-white">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                          onClick={handleRequestHuman}
                        >
                          {t('chatbot.widget.talkToHuman')}
                        </Button>
                      </div>
                    )}

                    {/* Voice Mode - replaces input area */}
                    {voiceMode ? (
                      <ChatVoiceMode
                        conversationId={conversationId}
                        onTranscript={(role, text) => {
                          // Turn-complete signal: finalize the live message with a unique ID
                          if (text === '__turn_complete__') {
                            shouldAutoScrollRef.current = true;
                            setMessages(prev => {
                              const liveId = `voice_${role}_live`;
                              const idx = prev.findIndex(m => m.id === liveId);
                              if (idx === -1) return prev;
                              // If the live bubble was a placeholder (listening/thinking),
                              // drop it instead of finalizing — the cleaned final text was
                              // already emitted just before this signal in the new flow.
                              const cur = prev[idx];
                              if (cur.content === '🎙 Listening…' || cur.content === '💭 Thinking…') {
                                return prev.filter(m => m.id !== liveId);
                              }
                              return prev.map((m, i) => i === idx ? { ...m, id: `voice_${role}_${Date.now()}` } : m);
                            });
                            return;
                          }
                          // Map display-only sentinels (when live transcript toggle is OFF)
                          // to friendly placeholders.
                          let displayText = text;
                          if (text === '__listening__') displayText = '🎙 Listening…';
                          else if (text === '__thinking__') displayText = '💭 Thinking…';
                          // Keep active live transcript pinned at the bottom
                          const liveId = `voice_${role}_live`;
                          shouldAutoScrollRef.current = true;
                          setMessages(prev => {
                            const nowIso = new Date().toISOString();
                            const existing = prev.find(m => m.id === liveId);
                            const withoutLive = prev.filter(m => m.id !== liveId);

                            return [
                              ...withoutLive,
                              {
                                ...(existing ?? {
                                  id: liveId,
                                  sender_type: role === 'customer' ? 'customer' : 'ai',
                                }),
                                id: liveId,
                                content: displayText,
                                sender_type: role === 'customer' ? 'customer' : 'ai',
                                created_at: nowIso,
                              },
                            ];
                          });
                        }}
                        onVoiceSessionEnd={(transcript) => {
                          // Fire-and-forget: persist voice transcript to database
                          if (conversationId && transcript.length > 0) {
                            supabase.functions.invoke('save-voice-transcript', {
                              body: { conversation_id: conversationId, transcript },
                            }).then(({ error }) => {
                              if (error) {
                                console.error('[ChatWidget] Failed to save voice transcript:', error);
                              } else {
                                console.log(`[ChatWidget] Voice transcript saved (${transcript.length} turns)`);
                              }
                            });
                          }
                        }}
                        onEnd={() => {
                          setVoiceMode(false);
                          // Show rating prompt after voice session ends
                          if (conversationId) {
                            setRatingChannel('voice');
                            setShowRating(true);
                          }
                        }}
                        onEscalation={() => {
                          console.log('[ChatWidget] Voice escalation triggered');
                          setVoiceMode(false);
                          setEscalatedToHuman(true);
                          const escMsg = t('chatbot.widget.voiceEscalation');
                          setMessages(prev => [...prev, {
                            id: `escalate-voice-${Date.now()}`,
                            content: escMsg,
                            sender_type: 'system',
                            created_at: new Date().toISOString()
                          }]);
                          if (conversationId) {
                            handleWebEscalation(conversationId, escMsg, 'voice');
                            supabase.functions.invoke('notify-agents', {
                              body: { conversationId, messagePreview: '🎤🚨 Customer requested human agent via voice', channel: 'web', senderName: 'Voice Chat Customer' }
                            }).catch(err => console.error('Failed to notify agents:', err));
                            supabase.functions.invoke('notify-line-group', {
                              body: { conversationId, customerName: 'Voice Chat Customer', channel: 'web', messagePreview: '🎤🚨 Customer requested human agent during voice call' }
                            }).catch(err => console.error('Failed to notify LINE group:', err));
                          }
                        }}
                      />
                    ) : (
                      <>
                        {/* Pending Attachments */}
                        {pendingAttachments.length > 0 && (
                          <div className="px-4 py-2 border-t border-gray-200 bg-white">
                            <ChatAttachments 
                              attachments={pendingAttachments} 
                              removable 
                              onRemove={(i) => setPendingAttachments(prev => prev.filter((_, idx) => idx !== i))}
                            />
                          </div>
                        )}

                        {/* Input */}
                        {conversationClosed ? (
                          <div className="p-4 border-t border-gray-200 bg-gray-50 text-center">
                            <p className="text-xs text-muted-foreground">
                              {currentLanguage === 'th' ? 'บทสนทนานี้ถูกปิดแล้ว' : 'This conversation has been closed'}
                            </p>
                          </div>
                        ) : (
                          <div className="p-4 border-t border-gray-200 bg-white">
                            <input
                              type="file"
                              ref={fileInputRef}
                              className="hidden"
                              multiple
                              accept="image/*,application/pdf"
                              onChange={handleFileSelect}
                            />
                            <form 
                              data-chat-form
                              onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                              className="flex gap-2"
                            >
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading || !conversationId}
                              >
                                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                              </Button>
                              <Input
                                value={input}
                                onChange={handleInputChange}
                                placeholder={t('chatbot.widget.typeMessage')}
                                className="flex-1 bg-gray-100 border-gray-200 text-gray-900 placeholder:text-gray-500 focus:ring-orange-500 focus:border-orange-500"
                              />
                              <Button type="submit" size="icon" disabled={!input.trim() && pendingAttachments.length === 0} className="bg-orange-500 hover:bg-orange-600 text-white">
                                <Send className="h-4 w-4" />
                              </Button>
                            </form>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                {/* Fallback: catch dead state when no other section renders */}
                {!showChannelSelection && !showIntentSelection && !showResumePrompt && !conversationId && !isLoading && (
                  <div className="flex-1 flex items-center justify-center p-4">
                    {chatError ? (
                      <div className="text-center space-y-3">
                        <p className="text-sm text-muted-foreground">
                          {t('chatbot.widget.unableToStart')}
                        </p>
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setChatError(false);
                              setShowChannelSelection(true);
                            }}
                          >
                            {t('chatbot.widget.back')}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setChatError(false);
                              handleTalkToSupport();
                            }}
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            {t('chatbot.widget.retry')}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {t('chatbot.widget.startingChat')}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
}
