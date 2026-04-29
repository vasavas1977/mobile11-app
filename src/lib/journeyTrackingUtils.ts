import { supabase } from '@/integrations/supabase/client';

// Session ID management
export function getOrCreateSessionId(): string {
  let sessionId = sessionStorage.getItem('journey_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('journey_session_id', sessionId);
  }
  return sessionId;
}

// Device type detection
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
  return 'desktop';
}

// UTM parameter parsing
export function getUTMParams(): { utm_source?: string; utm_medium?: string; utm_campaign?: string } {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source') || undefined,
    utm_medium: params.get('utm_medium') || undefined,
    utm_campaign: params.get('utm_campaign') || undefined,
  };
}

// Event queue for batching
type PageEvent = {
  session_id: string;
  page_path: string;
  page_title: string;
  event_type: string;
  event_detail?: string;
  entered_at: string;
  left_at?: string;
  duration_seconds?: number;
  scroll_depth_percent?: number;
};

let eventQueue: PageEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

export async function flushEvents() {
  if (eventQueue.length === 0) return;
  const events = [...eventQueue];
  eventQueue = [];

  try {
    await supabase.from('page_events').insert(events as any);
  } catch (e) {
    // Re-queue on failure
    eventQueue.push(...events);
  }
}

export function queueEvent(event: PageEvent) {
  eventQueue.push(event);
  // Auto-flush every 10 seconds
  if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushTimer = null;
      flushEvents();
    }, 10000);
  }
}

// Beacon-based flush for page unload
export function flushEventsBeacon() {
  if (eventQueue.length === 0) return;
  const events = [...eventQueue];
  eventQueue = [];
  
  const body = JSON.stringify(events);
  // Use sendBeacon for reliable delivery on page exit
  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' });
    // sendBeacon to Supabase REST API
    const url = `${import.meta.env.VITE_SUPABASE_URL || 'https://jaqyvbjllsanrnpzlyjw.supabase.co'}/rest/v1/page_events`;
    const headers = {
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphcXl2YmpsbHNhbnJucHpseWp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MzkwNjksImV4cCI6MjA3NDUxNTA2OX0.EVJdlMp1i1chtGKxdQ66ysmC-iAGefvr9JFLlvzaC34',
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    };
    // sendBeacon doesn't support headers, so fall back to fetch keepalive
    fetch(url, {
      method: 'POST',
      headers: { ...headers, Authorization: `Bearer ${headers.apikey}` },
      body: JSON.stringify(events),
      keepalive: true,
    }).catch(() => {});
  }
}

// CTA click tracker - call this from strategic buttons
export function trackCTAClick(label: string) {
  const sessionId = sessionStorage.getItem('journey_session_id');
  if (!sessionId) return;
  
  queueEvent({
    session_id: sessionId,
    page_path: window.location.pathname,
    page_title: document.title,
    event_type: 'cta_click',
    event_detail: label,
    entered_at: new Date().toISOString(),
  });
}

// Update session on exit
export async function updateSessionOnExit(sessionId: string, outcome?: string) {
  const startedAt = sessionStorage.getItem('journey_started_at');
  const totalDuration = startedAt 
    ? Math.round((Date.now() - parseInt(startedAt)) / 1000) 
    : 0;
  const pagesViewed = parseInt(sessionStorage.getItem('journey_pages_viewed') || '0');

  const updateData: Record<string, any> = {
    exit_page: window.location.pathname,
    total_duration_seconds: totalDuration,
    total_pages_viewed: pagesViewed,
    ended_at: new Date().toISOString(),
  };
  
  if (outcome) {
    updateData.outcome = outcome;
  } else if (pagesViewed <= 1 && totalDuration < 10) {
    updateData.outcome = 'bounce';
  } else {
    updateData.outcome = 'active_exit';
  }

  // Use fetch with keepalive for reliable delivery
  const url = `${import.meta.env.VITE_SUPABASE_URL || 'https://jaqyvbjllsanrnpzlyjw.supabase.co'}/rest/v1/visitor_sessions?session_id=eq.${sessionId}`;
  const apikey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphcXl2YmpsbHNhbnJucHpseWp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MzkwNjksImV4cCI6MjA3NDUxNTA2OX0.EVJdlMp1i1chtGKxdQ66ysmC-iAGefvr9JFLlvzaC34';
  
  fetch(url, {
    method: 'PATCH',
    headers: {
      apikey,
      Authorization: `Bearer ${apikey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(updateData),
    keepalive: true,
  }).catch(() => {});
}

// Mark session as converted
export async function markConversion(sessionId?: string) {
  const sid = sessionId || sessionStorage.getItem('journey_session_id');
  if (!sid) return;
  
  await supabase
    .from('visitor_sessions')
    .update({ 
      outcome: 'conversion', 
      converted_at: new Date().toISOString() 
    } as any)
    .eq('session_id', sid);
}
