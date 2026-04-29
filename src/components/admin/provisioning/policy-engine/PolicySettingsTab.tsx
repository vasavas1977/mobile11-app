import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Save, ShieldOff, RotateCcw, Download, Bell, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function PolicySettingsTab() {
  const { toast } = useToast();
  const [evaluationMode, setEvaluationMode] = useState('priority_ordered');
  const [defaultCooldown, setDefaultCooldown] = useState('15');
  const [conflictBehavior, setConflictBehavior] = useState('warn');
  const [maxChainDepth, setMaxChainDepth] = useState('2');
  const [autoRecovery, setAutoRecovery] = useState('health_check');
  const [safeMode, setSafeMode] = useState('require_approval');

  // Governance
  const [requireApproval, setRequireApproval] = useState(true);
  const [approvalNote, setApprovalNote] = useState('');

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-md bg-[#FAF7F2] border border-[#F3F0EB] flex items-center justify-center flex-shrink-0 mt-0.5">
          <Settings className="h-3.5 w-3.5 text-[#6B7280]" />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-foreground">Policy Engine Configuration</p>
          <p className="text-[9px] text-[#9CA3AF]">Global settings, governance controls, and safety actions for the fallback policy engine.</p>
        </div>
      </div>

      {/* Governance Controls */}
      <div className="bg-white rounded-xl border border-[#F3F0EB] p-4">
        <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <AlertTriangle className="h-3 w-3 text-orange-500" /> Governance Controls
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-lg border border-[#F3F0EB] bg-[#FAFAF8] p-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] font-semibold text-foreground">Require Approval for Rule Changes</p>
              <Switch checked={requireApproval} onCheckedChange={setRequireApproval} className="scale-75" />
            </div>
            <p className="text-[9px] text-[#9CA3AF]">When enabled, rule changes must be reviewed and approved before going live.</p>
          </div>

          <div className="rounded-lg border border-[#F3F0EB] bg-[#FAFAF8] p-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] font-semibold text-foreground">Rule Versioning</p>
              <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
            </div>
            <p className="text-[9px] text-[#9CA3AF]">All rule changes are versioned. View history and rollback from the rule menu.</p>
          </div>

          <div className="rounded-lg border border-[#F3F0EB] bg-[#FAFAF8] p-3">
            <p className="text-[11px] font-semibold text-foreground mb-1">Default Approval Note</p>
            <Textarea
              className="text-[10px] border-[#E5E7EB] bg-white min-h-[40px] resize-none"
              placeholder="Required justification for rule changes..."
              value={approvalNote}
              onChange={e => setApprovalNote(e.target.value)}
            />
          </div>

          <div className="rounded-lg border border-[#F3F0EB] bg-[#FAFAF8] p-3">
            <p className="text-[11px] font-semibold text-foreground mb-1">Change Tracking</p>
            <div className="space-y-1">
              {[
                { label: 'Created by', value: 'Auto-captured' },
                { label: 'Last modified by', value: 'Auto-captured' },
                { label: 'Last enabled by', value: 'Auto-captured' },
                { label: 'Last simulated at', value: 'Auto-captured' },
              ].map(f => (
                <div key={f.label} className="flex items-center justify-between">
                  <span className="text-[9px] text-[#6B7280]">{f.label}</span>
                  <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-3.5 bg-blue-50 text-blue-600 border-blue-200">{f.value}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Evaluation Mode */}
        <SettingCard title="Global Evaluation Mode" description="How rules are evaluated when multiple rules could match">
          <Select value={evaluationMode} onValueChange={setEvaluationMode}>
            <SelectTrigger className="h-8 text-[11px] border-[#E5E7EB] bg-[#FAFAF8]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="priority_ordered">Priority Ordered (first match wins)</SelectItem>
              <SelectItem value="all_matching">All Matching (execute all applicable)</SelectItem>
              <SelectItem value="weighted">Weighted Score</SelectItem>
            </SelectContent>
          </Select>
        </SettingCard>

        {/* Default Cooldown */}
        <SettingCard title="Default Cooldown Duration" description="Minutes to wait before a rule can trigger again">
          <div className="flex items-center gap-2">
            <Input className="h-8 text-[11px] border-[#E5E7EB] bg-[#FAFAF8] w-20" value={defaultCooldown} onChange={e => setDefaultCooldown(e.target.value)} />
            <span className="text-[10px] text-[#9CA3AF]">minutes</span>
          </div>
        </SettingCard>

        {/* Conflict Behavior */}
        <SettingCard title="Conflict Warning Behavior" description="What happens when overlapping rules are detected">
          <Select value={conflictBehavior} onValueChange={setConflictBehavior}>
            <SelectTrigger className="h-8 text-[11px] border-[#E5E7EB] bg-[#FAFAF8]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="warn">Warn admin but allow</SelectItem>
              <SelectItem value="block">Block conflicting rule activation</SelectItem>
              <SelectItem value="silent">Silent (no warnings)</SelectItem>
            </SelectContent>
          </Select>
        </SettingCard>

        {/* Max Chain Depth */}
        <SettingCard title="Max Fallback Chain Depth" description="Maximum number of fallback hops before stopping">
          <div className="flex items-center gap-2">
            <Input className="h-8 text-[11px] border-[#E5E7EB] bg-[#FAFAF8] w-20" value={maxChainDepth} onChange={e => setMaxChainDepth(e.target.value)} />
            <span className="text-[10px] text-[#9CA3AF]">hops</span>
          </div>
        </SettingCard>

        {/* Auto-Recovery */}
        <SettingCard title="Auto-Recovery Behavior" description="How the engine handles return to primary after recovery">
          <Select value={autoRecovery} onValueChange={setAutoRecovery}>
            <SelectTrigger className="h-8 text-[11px] border-[#E5E7EB] bg-[#FAFAF8]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="health_check">Auto-return when health check passes</SelectItem>
              <SelectItem value="manual">Manual return only</SelectItem>
              <SelectItem value="gradual">Gradual canary rollback</SelectItem>
            </SelectContent>
          </Select>
        </SettingCard>

        {/* Safe Mode */}
        <SettingCard title="Safe Mode Defaults" description="Behavior for critical or untested changes">
          <Select value={safeMode} onValueChange={setSafeMode}>
            <SelectTrigger className="h-8 text-[11px] border-[#E5E7EB] bg-[#FAFAF8]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="require_approval">Require admin approval</SelectItem>
              <SelectItem value="dry_run">Dry-run first</SelectItem>
              <SelectItem value="auto">Auto-apply (no safeguard)</SelectItem>
            </SelectContent>
          </Select>
        </SettingCard>
      </div>

      {/* Notification settings */}
      <div className="bg-white rounded-xl border border-[#F3F0EB] p-4">
        <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Bell className="h-3 w-3 text-[#9CA3AF]" /> Notification Settings
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { label: 'Rule Triggered', status: 'enabled' },
            { label: 'Failover Executed', status: 'enabled' },
            { label: 'Recovery Complete', status: 'enabled' },
            { label: 'Conflict Detected', status: 'enabled' },
            { label: 'Rule Enabled', status: 'enabled' },
            { label: 'Approval Required', status: 'enabled' },
            { label: 'Safe Mode Active', status: 'enabled' },
            { label: 'Rollback Executed', status: 'enabled' },
          ].map(n => (
            <div key={n.label} className="bg-[#FAFAF8] rounded-md border border-[#F3F0EB] px-2.5 py-2 flex items-center justify-between">
              <span className="text-[10px] font-medium text-foreground">{n.label}</span>
              <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 bg-emerald-50 text-emerald-700 border-emerald-200">On</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <Button size="sm" className="h-8 gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-[11px]" onClick={() => toast({ title: 'Settings saved', description: 'Policy engine configuration updated' })}>
          <Save className="h-3 w-3" />Save Configuration
        </Button>
      </div>
    </div>
  );
}

function SettingCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-[#F3F0EB] p-3.5">
      <p className="text-[11px] font-semibold text-foreground mb-0.5">{title}</p>
      <p className="text-[9px] text-[#9CA3AF] mb-2">{description}</p>
      {children}
    </div>
  );
}
