import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

type AgentStatus = 'online' | 'away' | 'busy' | 'offline';

const statusConfig: Record<AgentStatus, { label: string; color: string }> = {
  online: { label: 'Online', color: 'text-green-500' },
  away: { label: 'Away', color: 'text-yellow-500' },
  busy: { label: 'Busy', color: 'text-red-500' },
  offline: { label: 'Offline', color: 'text-muted-foreground' },
};

export function AgentStatusToggle() {
  const { user } = useAuth();
  const [status, setStatus] = useState<AgentStatus>('offline');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchStatus();
    }
  }, [user]);

  const fetchStatus = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('agent_status')
      .select('status')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setStatus(data.status as AgentStatus);
    } else if (error?.code === 'PGRST116') {
      // No record exists, create one
      await supabase.from('agent_status').insert({
        user_id: user.id,
        status: 'offline'
      });
    }
  };

  const updateStatus = async (newStatus: AgentStatus) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('agent_status')
        .upsert({
          user_id: user.id,
          status: newStatus,
          last_activity_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (!error) {
        setStatus(newStatus);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentConfig = statusConfig[status];

  return (
    <Select 
      value={status} 
      onValueChange={(value) => updateStatus(value as AgentStatus)}
      disabled={loading}
    >
      <SelectTrigger className="w-[130px] bg-white border-[#E5E7EB] text-[#1A1A1A]">
        <SelectValue>
          <div className="flex items-center gap-2">
            <Circle className={cn('h-2 w-2 fill-current', currentConfig.color)} />
            <span className="text-[#1A1A1A]">{currentConfig.label}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-white border-[#E5E7EB]">
        {(Object.entries(statusConfig) as [AgentStatus, typeof statusConfig[AgentStatus]][]).map(
          ([key, config]) => (
            <SelectItem key={key} value={key}>
              <div className="flex items-center gap-2">
                <Circle className={cn('h-2 w-2 fill-current', config.color)} />
                <span>{config.label}</span>
              </div>
            </SelectItem>
          )
        )}
      </SelectContent>
    </Select>
  );
}
