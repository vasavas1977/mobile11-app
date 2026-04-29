import { useEffect, useState, useLayoutEffect } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/useAuth';
import { useAgentNotifications } from '@/hooks/useAgentNotifications';
import { useAgentCheck } from '@/hooks/useAgentCheck';
import { AgentSidebar } from '@/components/agent/AgentSidebar';
import { AgentMobileNav } from '@/components/agent/AgentMobileNav';
import { AgentMobileHeader } from '@/components/agent/AgentMobileHeader';
import { AgentInbox } from '@/components/agent/AgentInbox';
import { AgentConversationView } from '@/components/agent/AgentConversationView';
import { AgentDashboard } from '@/components/agent/AgentDashboard';
import { AgentTeamView } from '@/components/agent/AgentTeamView';
import { AgentAnalyticsView } from '@/components/agent/AgentAnalyticsView';
import { AgentSettingsView } from '@/components/agent/AgentSettingsView';
import { AgentKnowledgeBaseView } from '@/components/agent/AgentKnowledgeBaseView';
import { AgentStatusToggle } from '@/components/agent/AgentStatusToggle';
import { AgentPushToggle } from '@/components/agent/AgentPushToggle';
import { AgentPwaInstallBanner } from '@/components/agent/AgentPwaInstallBanner';
import { AgentQuickLogin } from '@/components/agent/AgentQuickLogin';
import { Button } from '@/components/ui/button';
import { LogOut, Headphones, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface QueueStats {
  open: number;
  pending: number;
  myConversations: number;
}

export default function AgentPage() {
  const { user, signOut } = useAuth();
  const { isAgent, isSupervisor, loading } = useAgentCheck();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<QueueStats>({ open: 0, pending: 0, myConversations: 0 });
  const { unreadCount } = useAgentNotifications(user?.id);
  const { setTheme } = useTheme();

  // Force light theme for agent portal
  useLayoutEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
    setTheme('light');
    return () => {
      setTheme('dark');
    };
  }, [setTheme]);

  // Store last agent email for quick re-login
  useEffect(() => {
    if (user?.email) {
      localStorage.setItem('agent_last_email', user.email);
    }
  }, [user?.email]);

  useEffect(() => {
    // Only deny access after auth AND role check are both fully resolved
    if (!loading && user && !isAgent) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the agent portal.",
        variant: "destructive"
      });
      navigate('/');
    }
  }, [user, isAgent, loading, navigate, toast]);

  useEffect(() => {
    if (user) {
      fetchStats();
      
      const channel = supabase
        .channel('agent-page-stats')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'conversations' 
        }, () => {
          fetchStats();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const [openRes, pendingRes, myRes] = await Promise.all([
        supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('conversations').select('id', { count: 'exact', head: true })
          .eq('assigned_to', userData.user?.id)
          .in('status', ['open', 'pending'])
      ]);

      setStats({
        open: openRes.count || 0,
        pending: pendingRes.count || 0,
        myConversations: myRes.count || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAF7F2]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-3">
            <Headphones className="h-6 w-6 text-orange-500 animate-pulse" />
          </div>
          <p className="text-[#9CA3AF] font-medium">Loading agent portal...</p>
        </div>
      </div>
    );
  }

  // Show quick login instead of redirecting away
  // Preserve the intended agent destination for post-login redirect
  if (!user) {
    const currentPath = window.location.pathname + window.location.search;
    if (currentPath !== '/agent' && currentPath.startsWith('/agent')) {
      sessionStorage.setItem('post_auth_next', currentPath);
    }
    return <AgentQuickLogin />;
  }

  if (!isAgent) {
    return null;
  }

  return (
    <div className="flex h-screen bg-[#FAF7F2]">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <AgentSidebar isSupervisor={isSupervisor} />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <AgentMobileHeader stats={stats} unreadCount={unreadCount} />
        
        {/* Desktop Header */}
        <header className="hidden md:block border-b border-[#F3F0EB] bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
                <Headphones className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-[#1A1A1A]">
                Agent Portal
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <AgentPushToggle />
              <AgentStatusToggle />
              <div className="text-sm text-[#9CA3AF] font-medium">
                {user.email}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="gap-2 rounded-xl hover:bg-[#FAF7F2] text-[#1A1A1A]"
              >
                <Home className="h-4 w-4" />
                Exit to Site
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="gap-2 rounded-xl border-[#F3F0EB] hover:bg-[#FAF7F2] text-[#1A1A1A]"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        {/* PWA Install Banner */}
        <AgentPwaInstallBanner />

        {/* Main content */}
        <main className="flex-1 overflow-hidden pb-16 md:pb-0">
          <Routes>
            <Route index element={<AgentDashboard />} />
            <Route path="inbox" element={<AgentInbox />} />
            <Route path="conversation/:conversationId" element={<AgentConversationView />} />
            <Route path="team" element={<AgentTeamView />} />
            <Route path="analytics" element={<AgentAnalyticsView />} />
            <Route path="knowledge-base" element={<AgentKnowledgeBaseView />} />
            <Route path="settings" element={<AgentSettingsView />} />
          </Routes>
        </main>

        {/* Mobile Bottom Navigation */}
        <AgentMobileNav inboxCount={stats.open + stats.pending} />
      </div>
    </div>
  );
}
