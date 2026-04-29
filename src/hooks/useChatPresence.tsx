import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface PresenceState {
  isTyping: boolean;
  userId: string;
  userName: string;
}

export function useChatPresence(
  conversationId: string | null,
  userId: string | undefined,
  userName: string,
  userType: 'agent' | 'customer'
) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!conversationId || !userId) return;

    const channel = supabase.channel(`presence-${conversationId}`, {
      config: { presence: { key: `${userType}-${userId}` } }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceState>();
        const typing: string[] = [];
        
        Object.values(state).forEach((presences) => {
          presences.forEach((presence: PresenceState) => {
            // Only show typing from the other party
            if (presence.isTyping && 
                ((userType === 'agent' && !presence.userId.startsWith('agent')) ||
                 (userType === 'customer' && presence.userId.startsWith('agent')))) {
              typing.push(presence.userName || 'Support');
            }
          });
        });
        
        setTypingUsers(typing);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            isTyping: false,
            userId: `${userType}-${userId}`,
            userName
          });
        }
      });

    channelRef.current = channel;

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [conversationId, userId, userName, userType]);

  const setTyping = useCallback(async (isTyping: boolean) => {
    if (!channelRef.current || !userId) return;

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    await channelRef.current.track({
      isTyping,
      userId: `${userType}-${userId}`,
      userName
    });

    // Auto-stop typing after 3 seconds of inactivity
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(async () => {
        if (channelRef.current) {
          await channelRef.current.track({
            isTyping: false,
            userId: `${userType}-${userId}`,
            userName
          });
        }
      }, 3000);
    }
  }, [userId, userName, userType]);

  return { typingUsers, setTyping };
}
