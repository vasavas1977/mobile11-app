import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Smartphone, Monitor, Tablet, Globe, Clock, MapPin, LogOut } from 'lucide-react';
import { AdminEmptyState } from '../ui/AdminEmptyState';

interface OrderJourneyTimelineProps {
  userId: string;
  orderCreatedAt: string;
}

interface SessionData {
  session_id: string;
  landing_page: string;
  exit_page: string | null;
  referrer: string | null;
  device_type: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  started_at: string;
  ended_at: string | null;
  total_duration_seconds: number | null;
  total_pages_viewed: number | null;
  outcome: string | null;
}

interface PageEvent {
  id: string;
  session_id: string;
  page_path: string;
  page_title: string;
  event_type: string;
  event_detail: string | null;
  entered_at: string;
  left_at: string | null;
  duration_seconds: number | null;
  scroll_depth_percent: number | null;
}

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return '—';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function getDurationColor(seconds: number | null | undefined): string {
  if (!seconds) return 'text-[#9CA3AF]';
  if (seconds < 30) return 'text-emerald-600';
  if (seconds <= 300) return 'text-orange-500';
  return 'text-red-500';
}

function DeviceIcon({ type }: { type: string | null }) {
  if (type === 'mobile') return <Smartphone className="h-3.5 w-3.5" />;
  if (type === 'tablet') return <Tablet className="h-3.5 w-3.5" />;
  return <Monitor className="h-3.5 w-3.5" />;
}

function getPageLabel(path: string): string {
  if (path === '/') return 'Home';
  const segments = path.split('/').filter(Boolean);
  if (segments[0] === 'esim' && segments.length >= 2) {
    return segments.length >= 3 ? 'Package Selection' : `eSIM – ${segments[1].replace(/-/g, ' ')}`;
  }
  const labels: Record<string, string> = {
    cart: 'Cart',
    checkout: 'Checkout',
    'payment-success': 'Payment Success',
    'payment-failed': 'Payment Failed',
    profile: 'Profile',
    login: 'Login',
    register: 'Register',
    'qr-payment': 'QR Payment',
  };
  return labels[segments[0]] || path;
}

export function OrderJourneyTimeline({ userId, orderCreatedAt }: OrderJourneyTimelineProps) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionData | null>(null);
  const [events, setEvents] = useState<PageEvent[]>([]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchJourney = async () => {
      setLoading(true);
      try {
        // Find sessions for this user, ordered by proximity to order time
        const orderTime = new Date(orderCreatedAt).toISOString();
        const twoHoursBefore = new Date(new Date(orderCreatedAt).getTime() - 2 * 60 * 60 * 1000).toISOString();
        const twoHoursAfter = new Date(new Date(orderCreatedAt).getTime() + 2 * 60 * 60 * 1000).toISOString();

        const { data: sessions } = await supabase
          .from('visitor_sessions')
          .select('*')
          .eq('user_id', userId)
          .gte('started_at', twoHoursBefore)
          .lte('started_at', twoHoursAfter)
          .order('started_at', { ascending: false })
          .limit(5) as any;

        if (!sessions || sessions.length === 0) {
          // Fallback: get most recent session for this user
          const { data: fallback } = await supabase
            .from('visitor_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('started_at', { ascending: false })
            .limit(1) as any;

          if (!fallback || fallback.length === 0) {
            setSession(null);
            setEvents([]);
            setLoading(false);
            return;
          }
          sessions?.push(...fallback);
        }

        // Pick the session closest to order time
        const orderMs = new Date(orderCreatedAt).getTime();
        const closest = (sessions as SessionData[]).reduce((best, s) => {
          const diff = Math.abs(new Date(s.started_at).getTime() - orderMs);
          const bestDiff = Math.abs(new Date(best.started_at).getTime() - orderMs);
          return diff < bestDiff ? s : best;
        });

        setSession(closest);

        // Fetch page events for this session
        const { data: pageEvents } = await supabase
          .from('page_events')
          .select('*')
          .eq('session_id', closest.session_id)
          .order('entered_at', { ascending: true }) as any;

        // Deduplicate: consolidate page_enter + page_view for same path into one entry
        const consolidated: PageEvent[] = [];
        const seen = new Map<string, PageEvent>();

        for (const evt of (pageEvents || [])) {
          const key = evt.page_path;
          if (evt.event_type === 'page_enter') {
            if (!seen.has(key)) {
              seen.set(key, { ...evt });
              consolidated.push(evt);
            }
          } else if (evt.event_type === 'page_view' || evt.event_type === 'page_exit') {
            const existing = seen.get(key);
            if (existing) {
              existing.left_at = evt.left_at || evt.entered_at;
              existing.duration_seconds = evt.duration_seconds || existing.duration_seconds;
            } else {
              seen.set(key, { ...evt });
              consolidated.push(evt);
            }
          } else if (evt.event_type === 'cta_click' || evt.event_type === 'idle') {
            consolidated.push(evt);
          }
        }

        setEvents(consolidated);
      } catch (err) {
        console.error('Journey fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchJourney();
  }, [userId, orderCreatedAt]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!session) {
    return <AdminEmptyState title="No journey data" description="No browsing session found for this customer near the order time." />;
  }

  const pageEvents = events.filter(e => e.event_type === 'page_enter' || e.event_type === 'page_view' || e.event_type === 'page_exit');
  const ctaEvents = events.filter(e => e.event_type === 'cta_click');

  return (
    <div className="space-y-4">
      {/* Session metadata */}
      <div className="bg-[#FAF7F2] rounded-lg border border-[#F3F0EB] p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#6B7280]">
            <DeviceIcon type={session.device_type} />
            <span className="capitalize">{session.device_type || 'unknown'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
            <Clock className="h-3 w-3" />
            <span>{formatDuration(session.total_duration_seconds)}</span>
            <span className="mx-1">·</span>
            <span>{session.total_pages_viewed || pageEvents.length} pages</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#9CA3AF]">
          {session.referrer && (
            <span className="flex items-center gap-1"><Globe className="h-3 w-3" />Referrer: {new URL(session.referrer).hostname || session.referrer}</span>
          )}
          {session.utm_source && <span>utm_source: {session.utm_source}</span>}
          {session.utm_medium && <span>utm_medium: {session.utm_medium}</span>}
          {session.utm_campaign && <span>utm_campaign: {session.utm_campaign}</span>}
          {session.outcome && (
            <span className={`font-medium ${session.outcome === 'conversion' ? 'text-emerald-600' : session.outcome === 'bounce' ? 'text-red-500' : 'text-[#6B7280]'}`}>
              Outcome: {session.outcome}
            </span>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="relative pl-6">
        {/* Vertical line */}
        <div className="absolute left-[9px] top-2 bottom-2 w-px bg-[#F3F0EB]" />

        {pageEvents.map((event, idx) => {
          const isLast = idx === pageEvents.length - 1;
          const isExit = isLast && (event.event_type === 'page_exit' || session.exit_page === event.page_path);
          const hasCta = ctaEvents.some(c => c.page_path === event.page_path);

          return (
            <div key={event.id || idx} className="relative pb-4 last:pb-0">
              {/* Dot */}
              <div className={`absolute -left-6 top-1 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center ${
                isExit
                  ? 'border-red-400 bg-red-50'
                  : hasCta
                    ? 'border-orange-400 bg-orange-50'
                    : 'border-[#E5E7EB] bg-white'
              }`}>
                {isExit ? (
                  <LogOut className="h-2.5 w-2.5 text-red-500" />
                ) : (
                  <div className={`w-2 h-2 rounded-full ${hasCta ? 'bg-orange-400' : 'bg-[#D1D5DB]'}`} />
                )}
              </div>

              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-[#1A1A1A] truncate">{event.page_path}</p>
                  <p className="text-[11px] text-[#9CA3AF]">{getPageLabel(event.page_path)}</p>
                  {hasCta && (
                    <div className="mt-0.5">
                      {ctaEvents.filter(c => c.page_path === event.page_path).map((c, ci) => (
                        <span key={ci} className="text-[10px] bg-orange-50 text-orange-600 border border-orange-200 rounded px-1.5 py-0.5 mr-1">
                          CTA: {c.event_detail}
                        </span>
                      ))}
                    </div>
                  )}
                  {isExit && (
                    <span className="text-[10px] font-medium text-red-500 mt-0.5 block">Exit page</span>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`text-xs font-mono ${getDurationColor(event.duration_seconds)}`}>
                    {formatDuration(event.duration_seconds)}
                  </span>
                  <p className="text-[10px] text-[#9CA3AF]">
                    {new Date(event.entered_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {pageEvents.length === 0 && (
          <p className="text-xs text-[#9CA3AF] py-4">No page events recorded for this session.</p>
        )}
      </div>
    </div>
  );
}
