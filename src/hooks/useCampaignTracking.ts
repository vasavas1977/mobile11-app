import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TrackEventParams {
  campaignId: string;
  eventType: 'view' | 'click' | 'dismiss' | 'conversion';
  metadata?: Record<string, any>;
}

export function useCampaignTracking() {
  const getSessionId = useCallback(() => {
    let sessionId = sessionStorage.getItem('campaign_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      sessionStorage.setItem('campaign_session_id', sessionId);
    }
    return sessionId;
  }, []);

  const trackEvent = useCallback(async ({ campaignId, eventType, metadata = {} }: TrackEventParams) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const sessionId = getSessionId();
      
      const { error } = await supabase.from('campaign_analytics').insert({
        campaign_id: campaignId,
        event_type: eventType,
        user_id: user?.id || null,
        session_id: sessionId,
        page_url: window.location.pathname,
        metadata,
      });

      if (error) {
        console.error('Failed to track campaign event:', error);
      }
    } catch (err) {
      console.error('Campaign tracking error:', err);
    }
  }, [getSessionId]);

  const trackView = useCallback((campaignId: string, metadata?: Record<string, any>) => {
    trackEvent({ campaignId, eventType: 'view', metadata });
  }, [trackEvent]);

  const trackClick = useCallback((campaignId: string, metadata?: Record<string, any>) => {
    trackEvent({ campaignId, eventType: 'click', metadata });
  }, [trackEvent]);

  const trackDismiss = useCallback((campaignId: string, metadata?: Record<string, any>) => {
    trackEvent({ campaignId, eventType: 'dismiss', metadata });
  }, [trackEvent]);

  const trackConversion = useCallback((campaignId: string, metadata?: Record<string, any>) => {
    trackEvent({ campaignId, eventType: 'conversion', metadata });
  }, [trackEvent]);

  return {
    trackEvent,
    trackView,
    trackClick,
    trackDismiss,
    trackConversion,
  };
}
