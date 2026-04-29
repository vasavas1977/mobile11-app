import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  getOrCreateSessionId,
  getDeviceType,
  getUTMParams,
  queueEvent,
  flushEvents,
  flushEventsBeacon,
  updateSessionOnExit,
} from '@/lib/journeyTrackingUtils';

export function useJourneyTracker() {
  const location = useLocation();
  const prevPathRef = useRef<string | null>(null);
  const prevEnteredAtRef = useRef<number>(Date.now());
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionInitRef = useRef(false);

  // Initialize session on mount
  useEffect(() => {
    if (sessionInitRef.current) return;
    sessionInitRef.current = true;

    const sessionId = getOrCreateSessionId();
    const utmParams = getUTMParams();
    const now = Date.now();
    sessionStorage.setItem('journey_started_at', now.toString());
    sessionStorage.setItem('journey_pages_viewed', '0');

    // Create session row with user_id if logged in
    const initSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('visitor_sessions').insert({
        session_id: sessionId,
        landing_page: window.location.pathname,
        referrer: document.referrer || null,
        device_type: getDeviceType(),
        utm_source: utmParams.utm_source || null,
        utm_medium: utmParams.utm_medium || null,
        utm_campaign: utmParams.utm_campaign || null,
        started_at: new Date(now).toISOString(),
        user_id: user?.id || null,
      } as any);
    };
    initSession();

    // Update user_id if user logs in mid-session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.id) {
        supabase.from('visitor_sessions')
          .update({ user_id: session.user.id } as any)
          .eq('session_id', sessionId)
          .then(() => {});
      }
    });

    // Handle page exit
    const handleBeforeUnload = () => {
      // Record time on current page
      if (prevPathRef.current) {
        const duration = Math.round((Date.now() - prevEnteredAtRef.current) / 1000);
        queueEvent({
          session_id: sessionId,
          page_path: prevPathRef.current,
          page_title: document.title,
          event_type: 'page_exit',
          entered_at: new Date(prevEnteredAtRef.current).toISOString(),
          left_at: new Date().toISOString(),
          duration_seconds: duration,
        });
      }
      flushEventsBeacon();
      updateSessionOnExit(sessionId);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      subscription.unsubscribe();
    };
  }, []);

  // Track page changes
  useEffect(() => {
    const sessionId = sessionStorage.getItem('journey_session_id');
    if (!sessionId) return;

    const now = Date.now();
    const fullPath = location.pathname + location.search;

    // Record previous page duration
    if (prevPathRef.current && prevPathRef.current !== fullPath) {
      const duration = Math.round((now - prevEnteredAtRef.current) / 1000);
      queueEvent({
        session_id: sessionId,
        page_path: prevPathRef.current,
        page_title: document.title,
        event_type: 'page_view',
        entered_at: new Date(prevEnteredAtRef.current).toISOString(),
        left_at: new Date(now).toISOString(),
        duration_seconds: duration,
      });
    }

    // Record immediate page_enter for the new page (so we can see what page user is on)
    queueEvent({
      session_id: sessionId,
      page_path: fullPath,
      page_title: document.title,
      event_type: 'page_enter',
      entered_at: new Date(now).toISOString(),
    });

    // Update page count
    const count = parseInt(sessionStorage.getItem('journey_pages_viewed') || '0') + 1;
    sessionStorage.setItem('journey_pages_viewed', count.toString());

    prevPathRef.current = fullPath;
    prevEnteredAtRef.current = now;
  }, [location.pathname, location.search]);

  // Idle detection (60 seconds)
  useEffect(() => {
    const resetIdle = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        const sessionId = sessionStorage.getItem('journey_session_id');
        if (!sessionId) return;
        queueEvent({
          session_id: sessionId,
          page_path: prevPathRef.current || window.location.pathname + window.location.search,
          page_title: document.title,
          event_type: 'idle',
          event_detail: 'User idle for 60s',
          entered_at: new Date().toISOString(),
        });
      }, 60000);
    };

    const events = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(e => document.addEventListener(e, resetIdle, { passive: true }));
    resetIdle();

    return () => {
      events.forEach(e => document.removeEventListener(e, resetIdle));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  // Periodic flush
  useEffect(() => {
    const interval = setInterval(flushEvents, 10000);
    return () => clearInterval(interval);
  }, []);
}

// Wrapper component for use in JSX
export function JourneyTracker() {
  useJourneyTracker();
  return null;
}
