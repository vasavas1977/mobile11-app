import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    // Audio not available
  }
}

export function useAgentNotifications(userId: string | undefined) {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const unreadConversationsRef = useRef<Set<string>>(new Set());

  // Extract active conversation ID from URL
  const activeConversationId = location.pathname.match(/\/agent\/conversation\/([^/]+)/)?.[1] ?? null;

  // When agent views a conversation, clear it from unread
  useEffect(() => {
    if (activeConversationId && unreadConversationsRef.current.has(activeConversationId)) {
      unreadConversationsRef.current.delete(activeConversationId);
      setUnreadCount(unreadConversationsRef.current.size);
    }
  }, [activeConversationId]);

  const handleNewMessage = useCallback((payload: any) => {
    const msg = payload.new;
    if (!msg) return;

    // Only notify for customer messages
    if (msg.sender_type !== 'customer') return;

    // Don't notify if agent is viewing this conversation
    if (msg.conversation_id === activeConversationId) return;

    // Track unread
    unreadConversationsRef.current.add(msg.conversation_id);
    const newCount = unreadConversationsRef.current.size;
    setUnreadCount(newCount);

    // Set PWA app icon badge (window context — works on iOS 16.4+)
    if ('setAppBadge' in navigator) {
      (navigator as any).setAppBadge(newCount).catch(() => {});
    }

    // Play sound
    playNotificationSound();

    // Show toast
    const preview = msg.content?.length > 80 ? msg.content.slice(0, 80) + '…' : msg.content;
    toast('New customer message', {
      description: preview || 'New message received',
      duration: 6000,
      action: {
        label: 'View',
        onClick: () => {
          unreadConversationsRef.current.delete(msg.conversation_id);
          setUnreadCount(unreadConversationsRef.current.size);
          navigate(`/agent/conversation/${msg.conversation_id}`);
        },
      },
    });
  }, [activeConversationId, navigate]);

  // Keep callback ref fresh
  const callbackRef = useRef(handleNewMessage);
  callbackRef.current = handleNewMessage;

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('agent-in-app-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'conversation_messages',
        filter: 'sender_type=eq.customer',
      }, (payload) => {
        callbackRef.current(payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Listen for push notifications forwarded from service worker
  useEffect(() => {
    if (!userId || !('serviceWorker' in navigator)) return;

    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NOTIFICATION_CLICKED') {
        const cid = event.data.conversation_id;
        if (cid) {
          unreadConversationsRef.current.delete(cid);
          setUnreadCount(unreadConversationsRef.current.size);
        }
        if ('clearAppBadge' in navigator) {
          (navigator as any).clearAppBadge().catch(() => {});
        }
        return;
      }

      if (event.data?.type !== 'PUSH_RECEIVED') return;
      const { title, body, data } = event.data;
      const conversationId = data?.conversation_id;

      // Skip if viewing this conversation
      if (conversationId && conversationId === activeConversationId) return;

      // Track unread
      if (conversationId) {
        unreadConversationsRef.current.add(conversationId);
        setUnreadCount(unreadConversationsRef.current.size);
      }

      // Set PWA app icon badge from window context (iOS requires this — SW context doesn't support setAppBadge)
      if ('setAppBadge' in navigator) {
        const badgeCount = unreadConversationsRef.current.size || 1;
        (navigator as any).setAppBadge(badgeCount).catch(() => {});
      }

      playNotificationSound();

      toast(title || 'New customer message', {
        description: body || 'New message received',
        duration: 6000,
        action: conversationId ? {
          label: 'View',
          onClick: () => {
            unreadConversationsRef.current.delete(conversationId);
            setUnreadCount(unreadConversationsRef.current.size);
            navigate(`/agent/conversation/${conversationId}`);
          },
        } : undefined,
      });
    };

    navigator.serviceWorker.addEventListener('message', handleSWMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleSWMessage);
  }, [userId, activeConversationId, navigate]);

  // Sync PWA badge on visibility/focus (iOS only honors setAppBadge from window context)
  useEffect(() => {
    const syncBadge = () => {
      if (!('setAppBadge' in navigator)) return;
      const count = unreadConversationsRef.current.size;
      if (count > 0) {
        (navigator as any).setAppBadge(count).catch(() => {});
      } else {
        (navigator as any).clearAppBadge?.().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', syncBadge);
    window.addEventListener('focus', syncBadge);
    return () => {
      document.removeEventListener('visibilitychange', syncBadge);
      window.removeEventListener('focus', syncBadge);
    };
  }, []);

  const clearUnread = useCallback(() => {
    unreadConversationsRef.current.clear();
    setUnreadCount(0);
    if ('clearAppBadge' in navigator) {
      (navigator as any).clearAppBadge().catch(() => {});
    }
  }, []);

  return { unreadCount, clearUnread };
}
