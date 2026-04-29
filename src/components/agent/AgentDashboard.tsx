import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Users,
  AlertTriangle,
  Mail,
  Globe,
  MessageCircle,
  Phone,
  TrendingUp
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { LineIcon } from '@/components/icons/LineIcon';

interface DashboardStats {
  openConversations: number;
  pendingConversations: number;
  resolvedToday: number;
  myActiveConversations: number;
  onlineAgents: number;
}

interface RecentConversation {
  id: string;
  subject: string;
  channel: string;
  status: string;
  created_at: string;
  contact?: { name: string; email: string };
}

interface EscalatedConversation {
  id: string;
  subject: string | null;
  channel: string;
  created_at: string;
  updated_at: string;
  metadata: any;
  contact?: { name: string | null; email: string | null };
}

const channelIcons: Record<string, any> = {
  email: Mail,
  web: Globe,
  line: LineIcon,
  facebook: MessageCircle,
  voice: Phone,
};

const channelColors: Record<string, string> = {
  web: 'bg-blue-500',
  email: 'bg-purple-500',
  line: 'bg-[#00B900]',
  facebook: 'bg-indigo-500',
  instagram: 'bg-pink-500',
  whatsapp: 'bg-green-600',
  voice: 'bg-orange-500'
};

export function AgentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    openConversations: 0, pendingConversations: 0, resolvedToday: 0,
    myActiveConversations: 0, onlineAgents: 0
  });
  const [recentConversations, setRecentConversations] = useState<RecentConversation[]>([]);
  const [escalatedConversations, setEscalatedConversations] = useState<EscalatedConversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboardData(); }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [openRes, pendingRes, resolvedRes, myRes, onlineRes, recentRes, escalatedRes] = await Promise.all([
        supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('status', 'resolved').gte('resolved_at', today.toISOString()),
        supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('assigned_to', user.id).in('status', ['open', 'pending']),
        supabase.from('agent_status').select('id', { count: 'exact', head: true }).eq('status', 'online'),
        supabase.from('conversations').select(`id, subject, channel, status, created_at, contacts (name, email)`).in('status', ['open', 'pending']).order('created_at', { ascending: false }).limit(5),
        supabase.from('conversations').select(`id, subject, channel, created_at, updated_at, metadata, contacts (name, email)`).eq('status', 'open').eq('priority', 'high').order('updated_at', { ascending: false }).limit(10)
      ]);

      setStats({
        openConversations: openRes.count || 0,
        pendingConversations: pendingRes.count || 0,
        resolvedToday: resolvedRes.count || 0,
        myActiveConversations: myRes.count || 0,
        onlineAgents: onlineRes.count || 0
      });

      if (recentRes.data) {
        setRecentConversations(recentRes.data.map(c => ({ ...c, contact: Array.isArray(c.contacts) ? c.contacts[0] : c.contacts })));
      }
      if (escalatedRes.data) {
        setEscalatedConversations(
          escalatedRes.data
            .filter(c => (c.metadata as any)?.ai_paused_reason === 'customer_requested_human')
            .map(c => ({ ...c, contact: Array.isArray(c.contacts) ? c.contacts[0] : c.contacts }))
        );
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Open', value: stats.openConversations, icon: MessageSquare, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
    { title: 'Pending', value: stats.pendingConversations, icon: Clock, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
    { title: 'Resolved', value: stats.resolvedToday, icon: CheckCircle2, color: 'text-green-500', bgColor: 'bg-green-500/10' },
    { title: 'My Active', value: stats.myActiveConversations, icon: AlertCircle, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
    { title: 'Online', value: stats.onlineAgents, icon: Users, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  ];

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-2xl shadow-sm" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 overflow-y-auto h-full">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map((stat) => (
          <div key={stat.title} className="bg-white rounded-2xl shadow-sm border border-[#F3F0EB] p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl shrink-0 ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-[#1A1A1A]">{stat.value}</p>
                <p className="text-xs text-[#9CA3AF] font-medium truncate">{stat.title}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Needs Human Attention */}
      {escalatedConversations.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
          <div className="p-4 md:p-5 pb-2 md:pb-3">
            <h3 className="text-base md:text-lg font-bold flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              Needs Human Attention
              <Badge variant="destructive" className="ml-2 rounded-xl">{escalatedConversations.length}</Badge>
            </h3>
          </div>
          <div className="px-4 md:px-5 pb-4 md:pb-5 space-y-2">
            {escalatedConversations.map((conv) => {
              const ChannelIcon = channelIcons[conv.channel] || MessageCircle;
              return (
                <div
                  key={conv.id}
                  onClick={() => navigate(`/agent/conversation/${conv.id}`)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-red-50 hover:bg-red-100 active:bg-red-100 transition-colors cursor-pointer border border-red-100 min-h-[64px]"
                >
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0', channelColors[conv.channel] || 'bg-gray-500')}>
                    <ChannelIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate text-sm text-[#1A1A1A]">
                      {conv.contact?.name || conv.contact?.email || 'Unknown'}
                    </p>
                    <p className="text-xs text-[#9CA3AF] truncate">{conv.subject || 'No subject'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant="destructive" className="text-[10px] rounded-lg">Escalated</Badge>
                    <p className="text-[10px] text-[#9CA3AF] mt-1">
                      {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Conversations */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#F3F0EB] overflow-hidden">
        <div className="p-4 md:p-5 pb-2 md:pb-3">
          <h3 className="text-base md:text-lg font-bold flex items-center gap-2 text-[#1A1A1A]">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            Recent Conversations
          </h3>
        </div>
        <div className="px-4 md:px-5 pb-4 md:pb-5">
          {recentConversations.length === 0 ? (
            <p className="text-[#9CA3AF] text-center py-8 text-sm">No active conversations</p>
          ) : (
            <div className="space-y-2">
              {recentConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => navigate(`/agent/conversation/${conv.id}`)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF7F2] hover:bg-[#F3F0EB] active:bg-[#F3F0EB] transition-colors cursor-pointer min-h-[64px]"
                >
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${channelColors[conv.channel] || 'bg-gray-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate text-sm text-[#1A1A1A]">{conv.subject || 'No subject'}</p>
                    <p className="text-xs text-[#9CA3AF] truncate">
                      {conv.contact?.name || conv.contact?.email || 'Unknown'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[10px] px-2.5 py-1 rounded-xl font-semibold ${
                      conv.status === 'open' ? 'bg-orange-500/10 text-orange-500' :
                      conv.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                      'bg-green-500/10 text-green-500'
                    }`}>
                      {conv.status}
                    </span>
                    <p className="text-[10px] text-[#9CA3AF] mt-1">
                      {formatDistanceToNow(new Date(conv.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
