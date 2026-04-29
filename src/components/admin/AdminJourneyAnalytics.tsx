import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, MousePointerClick, TrendingDown, ArrowRightLeft, ChevronDown, ChevronUp, RefreshCw, Users, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface SessionRow {
  id: string;
  session_id: string;
  landing_page: string | null;
  exit_page: string | null;
  device_type: string | null;
  total_duration_seconds: number | null;
  total_pages_viewed: number | null;
  outcome: string | null;
  started_at: string;
  ended_at: string | null;
  referrer: string | null;
  utm_source: string | null;
  user_id: string | null;
}

interface PageEventRow {
  id: string;
  session_id: string;
  page_path: string | null;
  page_title: string | null;
  event_type: string;
  event_detail: string | null;
  entered_at: string | null;
  left_at: string | null;
  duration_seconds: number | null;
}

const outcomeColors: Record<string, string> = {
  conversion: 'bg-green-500/20 text-green-400 border-green-500/30',
  bounce: 'bg-red-500/20 text-red-400 border-red-500/30',
  idle_exit: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  active_exit: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  active: 'bg-muted text-muted-foreground border-border',
};

export function AdminJourneyAnalytics() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7');
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [sessionEvents, setSessionEvents] = useState<Record<string, PageEventRow[]>>({});
  const [dwellData, setDwellData] = useState<{ page: string; avgDuration: number }[]>([]);
  const [userProfiles, setUserProfiles] = useState<Record<string, { email: string; name: string | null }>>({});

  const fetchData = async () => {
    setLoading(true);
    const since = new Date();
    since.setDate(since.getDate() - parseInt(timeRange));

    const { data } = await supabase
      .from('visitor_sessions')
      .select('*')
      .gte('started_at', since.toISOString())
      .order('started_at', { ascending: false })
      .limit(500) as any;

    setSessions(data || []);

    // Fetch user profiles for identified sessions
    const userIds = Array.from(new Set<string>((data || []).filter((s: any) => s.user_id).map((s: any) => String(s.user_id))));
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email, full_name')
        .in('user_id', userIds) as any;
      if (profiles) {
        const profileMap: Record<string, { email: string; name: string | null }> = {};
        profiles.forEach((p: any) => {
          profileMap[p.user_id] = { email: p.email || '', name: p.full_name || null };
        });
        setUserProfiles(profileMap);
      }
    }

    // Fetch page dwell time averages
    const { data: events } = await supabase
      .from('page_events')
      .select('page_path, duration_seconds')
      .eq('event_type', 'page_view')
      .gte('entered_at', since.toISOString())
      .not('duration_seconds', 'is', null) as any;

    if (events) {
      const grouped: Record<string, number[]> = {};
      events.forEach((e: any) => {
        if (!e.page_path || !e.duration_seconds) return;
        const key = e.page_path.length > 30 ? e.page_path.substring(0, 30) + '...' : e.page_path;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(e.duration_seconds);
      });
      const dwell = Object.entries(grouped)
        .map(([page, durations]) => ({
          page,
          avgDuration: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
        }))
        .sort((a, b) => b.avgDuration - a.avgDuration)
        .slice(0, 15);
      setDwellData(dwell);
    }

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [timeRange]);

  const toggleSession = async (sessionId: string) => {
    if (expandedSession === sessionId) {
      setExpandedSession(null);
      return;
    }
    setExpandedSession(sessionId);
    if (!sessionEvents[sessionId]) {
      const { data } = await supabase
        .from('page_events')
        .select('*')
        .eq('session_id', sessionId)
        .order('entered_at', { ascending: true }) as any;
      setSessionEvents(prev => ({ ...prev, [sessionId]: data || [] }));
    }
  };

  // Summary stats
  const totalSessions = sessions.length;
  const avgDuration = totalSessions > 0
    ? Math.round(sessions.reduce((sum, s) => sum + (s.total_duration_seconds || 0), 0) / totalSessions)
    : 0;
  const avgPages = totalSessions > 0
    ? (sessions.reduce((sum, s) => sum + (s.total_pages_viewed || 0), 0) / totalSessions).toFixed(1)
    : '0';
  const bounceCount = sessions.filter(s => s.outcome === 'bounce').length;
  const bounceRate = totalSessions > 0 ? ((bounceCount / totalSessions) * 100).toFixed(1) : '0';
  const conversionCount = sessions.filter(s => s.outcome === 'conversion').length;
  const conversionRate = totalSessions > 0 ? ((conversionCount / totalSessions) * 100).toFixed(1) : '0';

  // Funnel data
  const landingCount = totalSessions;
  const packageViewCount = sessions.filter(s => {
    const lp = s.landing_page || '';
    const ep = s.exit_page || '';
    return lp.includes('/esim/') || ep.includes('/esim/') || (s.total_pages_viewed || 0) > 1;
  }).length;
  const checkoutCount = sessions.filter(s => {
    const ep = s.exit_page || '';
    return ep.includes('/checkout') || ep.includes('/cart') || s.outcome === 'conversion';
  }).length;

  const funnelData = [
    { name: 'Landing', value: landingCount, fill: 'hsl(var(--primary))' },
    { name: 'Package View', value: packageViewCount, fill: 'hsl(var(--primary) / 0.75)' },
    { name: 'Cart/Checkout', value: checkoutCount, fill: 'hsl(var(--primary) / 0.5)' },
    { name: 'Conversion', value: conversionCount, fill: 'hsl(var(--chart-1))' },
  ];

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0s';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customer Journey</h1>
          <p className="text-sm text-muted-foreground">Track visitor behavior from landing to conversion</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 24h</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span className="text-xs">Total Sessions</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{totalSessions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Avg Duration</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{formatDuration(avgDuration)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingDown className="h-4 w-4" />
              <span className="text-xs">Bounce Rate</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{bounceRate}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <MousePointerClick className="h-4 w-4" />
              <span className="text-xs">Conversion Rate</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{conversionRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel + Dwell Time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {funnelData.map((step, i) => {
                const pct = landingCount > 0 ? ((step.value / landingCount) * 100).toFixed(0) : '0';
                return (
                  <div key={step.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{step.name}</span>
                      <span className="text-foreground font-medium">{step.value} ({pct}%)</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${landingCount > 0 ? (step.value / landingCount) * 100 : 0}%`,
                          backgroundColor: step.fill 
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Avg. Page Dwell Time</CardTitle>
          </CardHeader>
          <CardContent>
            {dwellData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dwellData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis 
                    type="category" 
                    dataKey="page" 
                    width={120} 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} 
                  />
                  <Tooltip 
                    formatter={(val: number) => [`${val}s`, 'Avg Duration']}
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Bar dataKey="avgDuration" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No dwell time data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Session Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Recent Sessions ({totalSessions})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 text-muted-foreground font-medium">Time</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">User</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Landing</th>
                  <th className="text-left p-3 text-muted-foreground font-medium hidden md:table-cell">Pages</th>
                  <th className="text-left p-3 text-muted-foreground font-medium hidden md:table-cell">Duration</th>
                  <th className="text-left p-3 text-muted-foreground font-medium hidden lg:table-cell">Device</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Outcome</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {sessions.slice(0, 50).map(session => (
                  <>
                    <tr 
                      key={session.id} 
                      className="border-b border-border hover:bg-muted/20 cursor-pointer"
                      onClick={() => toggleSession(session.session_id)}
                    >
                      <td className="p-3 text-foreground whitespace-nowrap">
                        {format(new Date(session.started_at), 'MMM d, HH:mm')}
                      </td>
                      <td className="p-3 max-w-[180px] truncate">
                        {session.user_id && userProfiles[session.user_id] ? (
                          <button
                            className="text-primary hover:underline text-left truncate block max-w-full"
                            onClick={(e) => { e.stopPropagation(); navigate(`/admin/users/${session.user_id}`); }}
                          >
                            {userProfiles[session.user_id].name || userProfiles[session.user_id].email}
                          </button>
                        ) : (
                          <span className="text-muted-foreground">Guest</span>
                        )}
                      </td>
                      <td className="p-3 text-foreground max-w-[200px] truncate">
                        {session.landing_page || '/'}
                      </td>
                      <td className="p-3 text-foreground hidden md:table-cell">
                        {session.total_pages_viewed || 0}
                      </td>
                      <td className="p-3 text-foreground hidden md:table-cell">
                        {formatDuration(session.total_duration_seconds)}
                      </td>
                      <td className="p-3 hidden lg:table-cell">
                        <span className="text-muted-foreground capitalize">{session.device_type || 'unknown'}</span>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className={outcomeColors[session.outcome || 'active']}>
                          {session.outcome || 'active'}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {expandedSession === session.session_id 
                          ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        }
                      </td>
                    </tr>
                    {expandedSession === session.session_id && (
                      <tr key={`${session.id}-detail`}>
                        <td colSpan={8} className="p-0">
                          <div className="bg-muted/10 p-4 border-b border-border">
                            <div className="text-xs text-muted-foreground mb-3 flex gap-4 flex-wrap">
                              {session.referrer && <span>Referrer: {session.referrer}</span>}
                              {session.utm_source && <span>UTM: {session.utm_source}</span>}
                              <span>Exit: {session.exit_page || 'N/A'}</span>
                            </div>
                            <div className="space-y-2">
                              {(sessionEvents[session.session_id] || []).map((event, i) => (
                                <div key={event.id} className="flex items-center gap-3 text-xs">
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                  <span className="text-muted-foreground w-16">
                                    {event.entered_at ? format(new Date(event.entered_at), 'HH:mm:ss') : '--'}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {event.event_type}
                                  </Badge>
                                  <span className="text-foreground truncate">
                                    {event.page_path}
                                    {event.event_detail && ` — ${event.event_detail}`}
                                  </span>
                                  {event.duration_seconds != null && (
                                    <span className="text-muted-foreground ml-auto">{event.duration_seconds}s</span>
                                  )}
                                </div>
                              ))}
                              {!sessionEvents[session.session_id] && (
                                <p className="text-xs text-muted-foreground">Loading events...</p>
                              )}
                              {sessionEvents[session.session_id]?.length === 0 && (
                                <p className="text-xs text-muted-foreground">No events recorded</p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
                {sessions.length === 0 && !loading && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      No sessions recorded yet. Data will appear as visitors browse the site.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
