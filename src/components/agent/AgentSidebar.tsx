import { NavLink, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Inbox, 
  Users,
  BookOpen,
  BarChart3,
  Settings,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AgentSidebarProps {
  isSupervisor: boolean;
}

interface QueueStats {
  open: number;
  pending: number;
  myConversations: number;
}

export function AgentSidebar({ isSupervisor }: AgentSidebarProps) {
  const location = useLocation();
  const [stats, setStats] = useState<QueueStats>({ open: 0, pending: 0, myConversations: 0 });

  useEffect(() => {
    fetchStats();
    const channel = supabase
      .channel('conversation-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => { fetchStats(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchStats = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      const [openRes, pendingRes, myRes] = await Promise.all([
        supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('assigned_to', user.user?.id).in('status', ['open', 'pending'])
      ]);
      setStats({ open: openRes.count || 0, pending: pendingRes.count || 0, myConversations: myRes.count || 0 });
    } catch (error) { console.error('Error fetching stats:', error); }
  };

  const navItems = [
    { to: '/agent', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/agent/inbox', icon: Inbox, label: 'Inbox', badge: stats.open + stats.pending },
  ];

  const supervisorItems = [
    { to: '/agent/team', icon: Users, label: 'Team' },
    { to: '/agent/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/agent/knowledge-base', icon: BookOpen, label: 'Knowledge Base' },
  ];

  return (
    <aside className="w-64 border-r border-[#F3F0EB] bg-white flex flex-col">
      {/* Logo */}
      <Link to="/" className="block p-4 border-b border-[#F3F0EB] hover:bg-[#FAF7F2] transition-colors group">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-orange-500">Contact Center</h1>
            <p className="text-xs text-[#9CA3AF] mt-1">Omnichannel Support</p>
          </div>
          <Home className="h-4 w-4 text-[#9CA3AF] opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </Link>

      {/* Queue Stats */}
      <div className="p-4 border-b border-[#F3F0EB]">
        <h3 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">Queue Overview</h3>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#FAF7F2] rounded-2xl p-2 text-center">
            <div className="text-lg font-bold text-orange-500">{stats.open}</div>
            <div className="text-[10px] text-[#9CA3AF] font-medium">Open</div>
          </div>
          <div className="bg-[#FAF7F2] rounded-2xl p-2 text-center">
            <div className="text-lg font-bold text-yellow-500">{stats.pending}</div>
            <div className="text-[10px] text-[#9CA3AF] font-medium">Pending</div>
          </div>
          <div className="bg-[#FAF7F2] rounded-2xl p-2 text-center">
            <div className="text-lg font-bold text-orange-500">{stats.myConversations}</div>
            <div className="text-[10px] text-[#9CA3AF] font-medium">Mine</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isActive ? 'bg-orange-500/10 text-orange-500' : 'text-[#9CA3AF] hover:text-[#1A1A1A] hover:bg-[#FAF7F2]'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            <span className="flex-1">{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}

        {isSupervisor && (
          <>
            <div className="pt-4 pb-2">
              <h3 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider px-3">Supervisor</h3>
            </div>
            {supervisorItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    isActive ? 'bg-orange-500/10 text-orange-500' : 'text-[#9CA3AF] hover:text-[#1A1A1A] hover:bg-[#FAF7F2]'
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Settings */}
      <div className="p-4 border-t border-[#F3F0EB]">
        <NavLink
          to="/agent/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
              isActive ? 'bg-orange-500/10 text-orange-500' : 'text-[#9CA3AF] hover:text-[#1A1A1A] hover:bg-[#FAF7F2]'
            )
          }
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  );
}
