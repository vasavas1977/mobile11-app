import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Circle, MessageSquare, Clock, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export function AgentTeamView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: agents, isLoading } = useQuery({
    queryKey: ['agent-team-status'],
    queryFn: async () => {
      const { data: agentStatuses } = await supabase
        .from('agent_status')
        .select('*')
        .order('last_activity_at', { ascending: false });

      if (!agentStatuses) return [];

      const userIds = agentStatuses.map(a => a.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email, first_name, last_name')
        .in('user_id', userIds);

      const today = new Date().toISOString().split('T')[0];
      const { data: metrics } = await supabase
        .from('agent_metrics_daily')
        .select('*')
        .eq('date', today)
        .in('agent_id', userIds);

      return agentStatuses.map(agent => {
        const profile = profiles?.find(p => p.user_id === agent.user_id);
        const metric = metrics?.find(m => m.agent_id === agent.user_id);
        return { ...agent, profile, todayMetrics: metric };
      });
    },
    refetchInterval: 15000,
  });

  // Unassigned conversations for reassignment
  const { data: unassignedConvs } = useQuery({
    queryKey: ['unassigned-conversations'],
    queryFn: async () => {
      const { data } = await supabase
        .from('conversations')
        .select('id, subject, channel, priority, created_at, contact:contacts(name, email)')
        .is('assigned_to', null)
        .in('status', ['open', 'pending'])
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    refetchInterval: 15000,
  });

  const assignMutation = useMutation({
    mutationFn: async ({ conversationId, agentId }: { conversationId: string; agentId: string }) => {
      const { error } = await supabase
        .from('conversations')
        .update({ assigned_to: agentId })
        .eq('id', conversationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-team-status'] });
      queryClient.invalidateQueries({ queryKey: ['unassigned-conversations'] });
      toast({ title: 'Conversation assigned' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to assign conversation', variant: 'destructive' });
    },
  });

  const stats = {
    online: agents?.filter(a => a.status === 'online').length || 0,
    busy: agents?.filter(a => a.status === 'busy').length || 0,
    offline: agents?.filter(a => a.status === 'offline').length || 0,
    totalActive: agents?.reduce((sum, a) => sum + (a.active_conversations || 0), 0) || 0,
  };

  const getAgentName = (agent: any) => {
    if (!agent.profile) return 'Unknown';
    return agent.profile.first_name
      ? `${agent.profile.first_name} ${agent.profile.last_name || ''}`.trim()
      : agent.profile.email;
  };

  const statusColor = (s: string) =>
    s === 'online' ? 'bg-green-500' : s === 'busy' ? 'bg-yellow-500' : 'bg-gray-300';

  const onlineAgents = agents?.filter(a => a.status !== 'offline') || [];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <h1 className="text-2xl font-bold text-[#1A1A1A]">Team Management</h1>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Online', value: stats.online, icon: <Circle className="h-4 w-4 fill-green-500 text-green-500" /> },
          { label: 'Busy', value: stats.busy, icon: <Circle className="h-4 w-4 fill-yellow-500 text-yellow-500" /> },
          { label: 'Offline', value: stats.offline, icon: <Circle className="h-4 w-4 fill-gray-300 text-gray-300" /> },
          { label: 'Active Chats', value: stats.totalActive, icon: <MessageSquare className="h-4 w-4 text-orange-500" /> },
        ].map(s => (
          <Card key={s.label} className="bg-white border-[#E5E7EB]">
            <CardContent className="p-4 flex items-center gap-3">
              {s.icon}
              <div>
                <p className="text-2xl font-bold text-[#1A1A1A]">{s.value}</p>
                <p className="text-sm text-[#6B7280]">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Agent Table */}
      <Card className="bg-white border-[#E5E7EB]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#1A1A1A]">
            <Users className="h-5 w-5" />
            All Agents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-[#6B7280]">Loading agents...</div>
          ) : (
            <div className="rounded-md border border-[#E5E7EB] overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[#374151]">Agent</TableHead>
                    <TableHead className="text-[#374151]">Status</TableHead>
                    <TableHead className="text-[#374151]">Active</TableHead>
                    <TableHead className="text-[#374151]">Max</TableHead>
                    <TableHead className="text-[#374151]">Handled Today</TableHead>
                    <TableHead className="text-[#374151]">Resolved Today</TableHead>
                    <TableHead className="text-[#374151]">Last Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents?.map(agent => (
                    <TableRow key={agent.id}>
                      <TableCell>
                        <p className="font-medium text-[#1A1A1A]">{getAgentName(agent)}</p>
                        <p className="text-xs text-[#6B7280]">{agent.profile?.email}</p>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusColor(agent.status)} text-white`}>{agent.status}</Badge>
                      </TableCell>
                      <TableCell className="text-[#1A1A1A]">{agent.active_conversations}</TableCell>
                      <TableCell className="text-[#1A1A1A]">{agent.max_conversations}</TableCell>
                      <TableCell className="text-[#1A1A1A]">{agent.todayMetrics?.conversations_handled || 0}</TableCell>
                      <TableCell className="text-[#1A1A1A]">{agent.todayMetrics?.conversations_resolved || 0}</TableCell>
                      <TableCell className="text-sm text-[#6B7280]">
                        {agent.last_activity_at
                          ? formatDistanceToNow(new Date(agent.last_activity_at), { addSuffix: true })
                          : 'Never'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!agents || agents.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-[#6B7280]">No agents found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unassigned Conversations */}
      <Card className="bg-white border-[#E5E7EB]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#1A1A1A]">
            <RefreshCw className="h-5 w-5" />
            Unassigned Conversations ({unassignedConvs?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!unassignedConvs || unassignedConvs.length === 0 ? (
            <p className="text-center py-6 text-[#6B7280]">All conversations are assigned 🎉</p>
          ) : (
            <div className="space-y-3">
              {unassignedConvs.map((conv: any) => {
                const contact = Array.isArray(conv.contact) ? conv.contact[0] : conv.contact;
                return (
                  <div key={conv.id} className="flex items-center justify-between p-3 rounded-lg border border-[#E5E7EB] bg-[#FAF7F2]">
                    <div className="min-w-0">
                      <p className="font-medium text-[#1A1A1A] truncate">{contact?.name || contact?.email || 'Unknown'}</p>
                      <p className="text-sm text-[#6B7280] truncate">{conv.subject || 'No subject'}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] text-[#374151] border-[#D1D5DB] bg-white">{conv.channel}</Badge>
                        <Badge variant="outline" className="text-[10px] text-[#374151] border-[#D1D5DB] bg-white">{conv.priority}</Badge>
                      </div>
                    </div>
                    <Select onValueChange={(agentId) => assignMutation.mutate({ conversationId: conv.id, agentId })}>
                      <SelectTrigger className="w-[160px] h-8 text-xs bg-white border-[#E5E7EB] text-[#1A1A1A]">
                        <SelectValue placeholder="Assign to..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-[#E5E7EB]">
                        {onlineAgents.map(agent => (
                          <SelectItem key={agent.user_id} value={agent.user_id} className="text-xs">
                            {getAgentName(agent)} ({agent.active_conversations}/{agent.max_conversations})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
