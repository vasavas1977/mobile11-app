import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Clock, CheckCircle, TrendingUp, MessageSquare } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

const CHART_COLORS = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899'];

export function AgentAnalyticsView() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['agent-analytics'],
    queryFn: async () => {
      const today = new Date();
      const last30Days = subDays(today, 30);

      const { data: conversations } = await supabase
        .from('conversations')
        .select('created_at, resolved_at, first_response_at, status, channel, priority')
        .gte('created_at', last30Days.toISOString());

      // Daily volume (last 7 days)
      const dailyVolume = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i);
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);
        const count = conversations?.filter(c => {
          const created = new Date(c.created_at);
          return created >= dayStart && created <= dayEnd;
        }).length || 0;
        dailyVolume.push({ date: format(date, 'EEE'), conversations: count });
      }

      // Channel distribution
      const channelData = [
        { name: 'Web', value: conversations?.filter(c => c.channel === 'web').length || 0 },
        { name: 'Email', value: conversations?.filter(c => c.channel === 'email').length || 0 },
        { name: 'LINE', value: conversations?.filter(c => c.channel === 'line').length || 0 },
        { name: 'Facebook', value: conversations?.filter(c => c.channel === 'facebook').length || 0 },
        { name: 'WhatsApp', value: conversations?.filter(c => c.channel === 'whatsapp').length || 0 },
      ].filter(c => c.value > 0);

      // Priority distribution
      const priorityData = [
        { name: 'Low', value: conversations?.filter(c => c.priority === 'low').length || 0, color: '#6B7280' },
        { name: 'Medium', value: conversations?.filter(c => c.priority === 'medium').length || 0, color: '#3B82F6' },
        { name: 'High', value: conversations?.filter(c => c.priority === 'high').length || 0, color: '#F97316' },
        { name: 'Urgent', value: conversations?.filter(c => c.priority === 'urgent').length || 0, color: '#EF4444' },
      ].filter(c => c.value > 0);

      const resolvedConvs = conversations?.filter(c => c.resolved_at && c.first_response_at) || [];
      const avgResponseTime = resolvedConvs.length > 0
        ? resolvedConvs.reduce((sum, c) => sum + (new Date(c.first_response_at!).getTime() - new Date(c.created_at).getTime()), 0) / resolvedConvs.length / 60000
        : 0;
      const avgResolutionTime = resolvedConvs.length > 0
        ? resolvedConvs.reduce((sum, c) => sum + (new Date(c.resolved_at!).getTime() - new Date(c.created_at).getTime()), 0) / resolvedConvs.length / 3600000
        : 0;
      const resolutionRate = conversations?.length
        ? (conversations.filter(c => c.status === 'resolved').length / conversations.length) * 100
        : 0;

      return {
        dailyVolume,
        channelData,
        priorityData,
        totalConversations: conversations?.length || 0,
        resolvedCount: conversations?.filter(c => c.status === 'resolved').length || 0,
        avgResponseTime: avgResponseTime.toFixed(1),
        avgResolutionTime: avgResolutionTime.toFixed(1),
        resolutionRate: resolutionRate.toFixed(1),
      };
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-8 text-[#6B7280]">Loading analytics...</div>;
  }

  const statCards = [
    { title: 'Total (30d)', value: analytics?.totalConversations || 0, icon: MessageSquare },
    { title: 'Resolved', value: analytics?.resolvedCount || 0, icon: CheckCircle },
    { title: 'Avg Response', value: `${analytics?.avgResponseTime || 0} min`, icon: Clock },
    { title: 'Resolution Rate', value: `${analytics?.resolutionRate || 0}%`, icon: TrendingUp },
  ];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <h1 className="text-2xl font-bold text-[#1A1A1A]">Analytics</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(stat => (
          <Card key={stat.title} className="bg-white border-[#E5E7EB]">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-[#6B7280]">{stat.title}</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">{stat.value}</p>
              </div>
              <stat.icon className="h-8 w-8 text-[#9CA3AF]" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-white border-[#E5E7EB]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#1A1A1A]">
              <BarChart3 className="h-5 w-5" />
              Volume (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.dailyVolume || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: 8 }} />
                  <Bar dataKey="conversations" fill="#F97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E5E7EB]">
          <CardHeader>
            <CardTitle className="text-[#1A1A1A]">Channel Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {analytics?.channelData && analytics.channelData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.channelData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {analytics.channelData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-[#6B7280]">No data</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-[#E5E7EB]">
        <CardHeader>
          <CardTitle className="text-[#1A1A1A]">Priority Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {analytics?.priorityData && analytics.priorityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.priorityData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#6B7280', fontSize: 12 }} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: 8 }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {analytics.priorityData.map((entry: any, index: number) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-[#6B7280]">No data</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
