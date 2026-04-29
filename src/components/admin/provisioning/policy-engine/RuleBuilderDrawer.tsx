import { useState, useEffect, useMemo, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  ChevronLeft, ChevronRight, Save, Power, X, AlertTriangle, CheckCircle2,
  Info, Plus, Trash2, FlaskConical, ShieldAlert, ArrowRight
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface Provider {
  id: string;
  provider_name: string;
}

interface TriggerCondition {
  id: string;
  metric: string;
  operator: string;
  threshold: string;
  timeWindow: string;
  occurrenceCount: string;
}

interface RuleFormData {
  // Step 1
  ruleName: string;
  description: string;
  status: 'draft' | 'enabled' | 'disabled';
  priority: string;
  ruleOwner: string;
  internalNotes: string;
  // Step 2
  scopeType: string;
  applyToAll: boolean;
  selectedRegions: string[];
  selectedCountries: string[];
  selectedPackages: string[];
  selectedChannels: string[];
  selectedSuppliers: string[];
  // Step 3
  conditionLogic: 'AND' | 'OR';
  conditions: TriggerCondition[];
  // Step 4
  primarySupplierId: string;
  fallbackSupplierId: string;
  secondaryFallbackSupplierId: string;
  routeMethod: string;
  maxRetries: string;
  cooldownMinutes: string;
  autoReturn: boolean;
  returnThreshold: string;
  emergencyStop: boolean;
}

const EMPTY_CONDITION: () => TriggerCondition = () => ({
  id: crypto.randomUUID(),
  metric: '',
  operator: 'greater_than',
  threshold: '',
  timeWindow: '5',
  occurrenceCount: '1',
});

const DEFAULT_FORM: RuleFormData = {
  ruleName: '',
  description: '',
  status: 'draft',
  priority: '10',
  ruleOwner: '',
  internalNotes: '',
  scopeType: 'global',
  applyToAll: true,
  selectedRegions: [],
  selectedCountries: [],
  selectedPackages: [],
  selectedChannels: [],
  selectedSuppliers: [],
  conditionLogic: 'AND',
  conditions: [EMPTY_CONDITION()],
  primarySupplierId: '',
  fallbackSupplierId: '',
  secondaryFallbackSupplierId: '',
  routeMethod: 'priority',
  maxRetries: '3',
  cooldownMinutes: '15',
  autoReturn: true,
  returnThreshold: '90',
  emergencyStop: false,
};

const METRICS = [
  { value: 'api_timeout_count', label: 'API Timeout Count' },
  { value: 'fail_rate_percent', label: 'Failure Rate (%)' },
  { value: 'http_5xx_count', label: 'HTTP 5xx Count' },
  { value: 'avg_latency_ms', label: 'Avg Latency (ms)' },
  { value: 'sync_age_minutes', label: 'Sync Age (min)' },
  { value: 'supplier_status', label: 'Supplier Status' },
  { value: 'inventory_unavailable', label: 'Inventory Unavailable' },
  { value: 'manual_override', label: 'Manual Override' },
];

const OPERATORS = [
  { value: 'greater_than', label: '>' },
  { value: 'greater_than_or_equal', label: '≥' },
  { value: 'equals', label: '=' },
  { value: 'not_equals', label: '≠' },
  { value: 'contains', label: 'contains' },
  { value: 'in_list', label: 'in list' },
];

const STEPS = [
  { num: 1, label: 'Basic Info' },
  { num: 2, label: 'Scope' },
  { num: 3, label: 'Conditions' },
  { num: 4, label: 'Routing' },
  { num: 5, label: 'Validate' },
  { num: 6, label: 'Save' },
];

// ─── Existing rule shape for editing ────────────────────────────────────────────
interface ExistingRule {
  id: string;
  rule_name: string;
  scope: string;
  primary_provider_id: string | null;
  fallback_provider_id: string | null;
  trigger_condition: string;
  trigger_threshold: number;
  priority: number;
  is_enabled: boolean;
  cooldown_minutes: number;
  notes: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editRule?: ExistingRule | null;
  onSaved?: () => void;
}

export function RuleBuilderDrawer({ open, onOpenChange, editRule, onSaved }: Props) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<RuleFormData>(DEFAULT_FORM);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [existingRules, setExistingRules] = useState<ExistingRule[]>([]);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Load providers + existing rules for conflict check
  useEffect(() => {
    if (!open) return;
    (async () => {
      const [{ data: prov }, { data: rules }] = await Promise.all([
        supabase.from('esim_providers').select('id, provider_name'),
        supabase.from('fallback_rules').select('id, rule_name, scope, primary_provider_id, fallback_provider_id, trigger_condition, trigger_threshold, priority, is_enabled, cooldown_minutes, notes'),
      ]);
      setProviders(prov || []);
      setExistingRules((rules || []) as ExistingRule[]);
    })();
  }, [open]);

  // Populate form for edit mode
  useEffect(() => {
    if (!open) {
      setStep(1);
      setForm(DEFAULT_FORM);
      setDirty(false);
      return;
    }
    if (editRule) {
      setForm({
        ...DEFAULT_FORM,
        ruleName: editRule.rule_name,
        status: editRule.is_enabled ? 'enabled' : 'draft',
        priority: String(editRule.priority),
        scopeType: editRule.scope,
        internalNotes: editRule.notes || '',
        primarySupplierId: editRule.primary_provider_id || '',
        fallbackSupplierId: editRule.fallback_provider_id || '',
        cooldownMinutes: String(editRule.cooldown_minutes),
        conditions: [{
          ...EMPTY_CONDITION(),
          metric: editRule.trigger_condition,
          threshold: String(editRule.trigger_threshold),
        }],
      });
    }
  }, [open, editRule]);

  const update = <K extends keyof RuleFormData>(key: K, value: RuleFormData[K]) => {
    setForm(f => ({ ...f, [key]: value }));
    setDirty(true);
  };

  const providerName = (id: string) => providers.find(p => p.id === id)?.provider_name || '—';

  // ─── Validation ─────────────────────────────────────────────────────────────
  const step1Valid = form.ruleName.trim().length >= 3;
  const step3Valid = form.conditions.length > 0 && form.conditions.every(c => c.metric && c.threshold);
  const step4Valid = !!form.primarySupplierId && !!form.fallbackSupplierId && form.primarySupplierId !== form.fallbackSupplierId;

  const canProceed = (s: number) => {
    if (s === 1) return step1Valid;
    if (s === 3) return step3Valid;
    if (s === 4) return step4Valid;
    return true;
  };

  // ─── Conflict detection (using shared engine + builder-specific checks) ────
  const conflicts = useMemo(() => {
    const warnings: string[] = [];
    const others = existingRules.filter(r => r.id !== editRule?.id);

    // Same primary+fallback+condition overlap
    others.forEach(r => {
      if (
        r.primary_provider_id === form.primarySupplierId &&
        r.fallback_provider_id === form.fallbackSupplierId &&
        form.conditions.some(c => c.metric === r.trigger_condition) &&
        r.is_enabled
      ) {
        warnings.push(`Overlaps with active rule "${r.rule_name}" on same supplier pair and condition`);
      }
    });

    // Same priority collision
    others.forEach(r => {
      if (String(r.priority) === form.priority && r.is_enabled) {
        warnings.push(`Priority ${form.priority} conflicts with "${r.rule_name}"`);
      }
    });

    // Missing fallback
    if (form.primarySupplierId && !form.fallbackSupplierId) {
      warnings.push('No fallback supplier selected — incomplete chain');
    }

    // Primary = fallback
    if (form.primarySupplierId && form.primarySupplierId === form.fallbackSupplierId) {
      warnings.push('Primary and fallback suppliers are identical');
    }

    // Circular route via secondary
    if (form.primarySupplierId && form.primarySupplierId === form.secondaryFallbackSupplierId) {
      warnings.push('Secondary fallback is the same as primary — creates circular route');
    }

    // Loop detection: check if a reverse rule exists
    others.forEach(r => {
      if (
        r.is_enabled &&
        r.primary_provider_id === form.fallbackSupplierId &&
        r.fallback_provider_id === form.primarySupplierId &&
        form.conditions.some(c => c.metric === r.trigger_condition)
      ) {
        warnings.push(`Loop risk: "${r.rule_name}" routes in the opposite direction on the same trigger`);
      }
    });

    return warnings;
  }, [form, existingRules, editRule]);

  // ─── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async (enableOnSave: boolean) => {
    setSaving(true);
    try {
      const mainCondition = form.conditions[0];
      const payload = {
        rule_name: form.ruleName.trim(),
        scope: form.scopeType,
        primary_provider_id: form.primarySupplierId || null,
        fallback_provider_id: form.fallbackSupplierId || null,
        trigger_condition: mainCondition?.metric || 'manual_override',
        trigger_threshold: Number(mainCondition?.threshold) || 0,
        priority: Number(form.priority) || 10,
        is_enabled: enableOnSave ? true : form.status === 'enabled',
        cooldown_minutes: Number(form.cooldownMinutes) || 15,
        notes: [form.description, form.internalNotes].filter(Boolean).join(' | ') || null,
      };

      if (editRule) {
        const { error } = await supabase.from('fallback_rules').update(payload).eq('id', editRule.id);
        if (error) throw error;
        toast({ title: 'Rule updated', description: payload.rule_name });
      } else {
        const { error } = await supabase.from('fallback_rules').insert(payload);
        if (error) throw error;
        toast({ title: 'Rule created', description: payload.rule_name });
      }

      setDirty(false);
      onSaved?.();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: 'Error saving rule', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (dirty) {
      if (!window.confirm('You have unsaved changes. Discard?')) return;
    }
    onOpenChange(false);
  };

  // ─── Add/Remove condition rows ──────────────────────────────────────────────
  const addCondition = () => {
    update('conditions', [...form.conditions, EMPTY_CONDITION()]);
  };
  const removeCondition = (id: string) => {
    update('conditions', form.conditions.filter(c => c.id !== id));
  };
  const updateCondition = (id: string, field: keyof TriggerCondition, value: string) => {
    update('conditions', form.conditions.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 overflow-hidden flex flex-col">
        {/* Header */}
        <SheetHeader className="px-6 pt-5 pb-4 border-b border-[#F3F0EB] bg-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center">
                <ShieldAlert className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <SheetTitle className="text-sm font-bold text-foreground">
                  {editRule ? 'Edit Fallback Rule' : 'Create Fallback Rule'}
                </SheetTitle>
                <p className="text-[10px] text-[#6B7280]">
                  {editRule ? `Editing "${editRule.rule_name}"` : 'Define automated failover logic for supplier redundancy'}
                </p>
              </div>
            </div>
            {dirty && (
              <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 bg-amber-50 text-amber-700 border-amber-200">
                Unsaved
              </Badge>
            )}
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-1 mt-3">
            {STEPS.map((s, i) => (
              <div key={s.num} className="flex items-center gap-1">
                <button
                  onClick={() => { if (s.num < step) setStep(s.num); }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                    step === s.num
                      ? 'bg-orange-50 text-orange-700 border border-orange-200'
                      : step > s.num
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-pointer hover:bg-emerald-100'
                      : 'bg-[#FAFAF8] text-[#9CA3AF] border border-[#F3F0EB]'
                  }`}
                >
                  {step > s.num ? (
                    <CheckCircle2 className="h-2.5 w-2.5" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full bg-current/10 flex items-center justify-center text-[8px] font-bold">{s.num}</span>
                  )}
                  {s.label}
                </button>
                {i < STEPS.length - 1 && <ChevronRight className="h-3 w-3 text-[#E5E7EB]" />}
              </div>
            ))}
          </div>
        </SheetHeader>

        {/* Conflict banner */}
        {conflicts.length > 0 && step >= 3 && (
          <div className="mx-6 mt-3 bg-amber-50 rounded-lg border border-amber-200 px-3 py-2 flex-shrink-0">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle className="h-3 w-3 text-amber-600" />
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Conflict Warnings</p>
            </div>
            {conflicts.map((c, i) => (
              <p key={i} className="text-[10px] text-amber-700">• {c}</p>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {step === 1 && <Step1BasicInfo form={form} update={update} />}
          {step === 2 && <Step2Scope form={form} update={update} />}
          {step === 3 && (
            <Step3Conditions
              form={form}
              update={update}
              addCondition={addCondition}
              removeCondition={removeCondition}
              updateCondition={updateCondition}
            />
          )}
          {step === 4 && <Step4Routing form={form} update={update} providers={providers} />}
          {step === 5 && <Step5Validate form={form} providers={providers} conflicts={conflicts} existingRules={existingRules} />}
          {step === 6 && <Step6Save form={form} providers={providers} saving={saving} onSaveDraft={() => handleSave(false)} onEnable={() => handleSave(true)} editMode={!!editRule} />}
        </div>

        {/* Footer nav */}
        <div className="px-6 py-3 border-t border-[#F3F0EB] bg-white flex items-center justify-between flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-[11px] border-[#E5E7EB]"
            disabled={step <= 1}
            onClick={() => setStep(s => s - 1)}
          >
            <ChevronLeft className="h-3 w-3" />Back
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 text-[11px] text-[#6B7280]" onClick={handleClose}>
              Cancel
            </Button>
            {step < 6 ? (
              <Button
                size="sm"
                className="h-8 gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-[11px]"
                disabled={!canProceed(step)}
                onClick={() => setStep(s => s + 1)}
              >
                Continue<ChevronRight className="h-3 w-3" />
              </Button>
            ) : (
              <Button
                size="sm"
                className="h-8 gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-[11px]"
                disabled={saving || !step1Valid || !step4Valid}
                onClick={() => handleSave(false)}
              >
                <Save className="h-3 w-3" />{saving ? 'Saving...' : editRule ? 'Update Rule' : 'Save Rule'}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 1 — Basic Info
// ═══════════════════════════════════════════════════════════════════════════════

function Step1BasicInfo({ form, update }: { form: RuleFormData; update: <K extends keyof RuleFormData>(k: K, v: RuleFormData[K]) => void }) {
  return (
    <div className="space-y-4">
      <StepHeader title="Basic Information" desc="Name and classify this fallback rule." />

      <FormField label="Rule Name" required hint="Descriptive name, e.g. 'USIMSA → TUGE: High Failure Rate'">
        <Input
          className="h-9 text-xs border-[#E5E7EB] bg-[#FAFAF8]"
          placeholder="e.g. USIMSA → TUGE: API Timeout"
          value={form.ruleName}
          onChange={e => update('ruleName', e.target.value)}
          maxLength={120}
        />
        {form.ruleName.length > 0 && form.ruleName.trim().length < 3 && (
          <p className="text-[9px] text-red-500 mt-0.5">Rule name must be at least 3 characters</p>
        )}
      </FormField>

      <FormField label="Description" hint="Explain what this rule does and when it should trigger">
        <Textarea
          className="text-xs border-[#E5E7EB] bg-[#FAFAF8] min-h-[60px] resize-none"
          placeholder="Route traffic to TUGE when USIMSA API response time exceeds threshold..."
          value={form.description}
          onChange={e => update('description', e.target.value)}
          maxLength={500}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Status" required>
          <Select value={form.status} onValueChange={v => update('status', v as RuleFormData['status'])}>
            <SelectTrigger className="h-9 text-xs border-[#E5E7EB] bg-[#FAFAF8]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="enabled">Enabled</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Priority" required hint="Lower number = higher priority">
          <Input
            type="number"
            className="h-9 text-xs border-[#E5E7EB] bg-[#FAFAF8]"
            placeholder="1"
            value={form.priority}
            onChange={e => update('priority', e.target.value)}
            min={1}
            max={999}
          />
        </FormField>
      </div>

      <FormField label="Rule Owner" hint="Who maintains this rule">
        <Input
          className="h-9 text-xs border-[#E5E7EB] bg-[#FAFAF8]"
          placeholder="e.g. Network Ops Team"
          value={form.ruleOwner}
          onChange={e => update('ruleOwner', e.target.value)}
          maxLength={100}
        />
      </FormField>

      <FormField label="Internal Notes" hint="Visible only to admins">
        <Textarea
          className="text-xs border-[#E5E7EB] bg-[#FAFAF8] min-h-[50px] resize-none"
          placeholder="Internal context, links, or rationale..."
          value={form.internalNotes}
          onChange={e => update('internalNotes', e.target.value)}
          maxLength={500}
        />
      </FormField>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 2 — Scope
// ═══════════════════════════════════════════════════════════════════════════════

function Step2Scope({ form, update }: { form: RuleFormData; update: <K extends keyof RuleFormData>(k: K, v: RuleFormData[K]) => void }) {
  const scopeTypes = [
    { value: 'global', label: 'Global', desc: 'Applies to all routes and suppliers' },
    { value: 'regional', label: 'Regional', desc: 'Applies to specific regions' },
    { value: 'country', label: 'Country', desc: 'Applies to specific countries' },
    { value: 'package', label: 'Package', desc: 'Applies to specific packages' },
    { value: 'channel', label: 'Channel', desc: 'Applies to specific sales channels' },
    { value: 'supplier', label: 'Supplier', desc: 'Applies to specific supplier mappings' },
  ];

  return (
    <div className="space-y-4">
      <StepHeader title="Scope" desc="Define where this rule applies." />

      <FormField label="Scope Type" required>
        <div className="grid grid-cols-3 gap-2">
          {scopeTypes.map(s => (
            <button
              key={s.value}
              onClick={() => update('scopeType', s.value)}
              className={`text-left rounded-lg border px-3 py-2 transition-colors ${
                form.scopeType === s.value
                  ? 'bg-orange-50 border-orange-200 ring-1 ring-orange-200'
                  : 'bg-[#FAFAF8] border-[#F3F0EB] hover:border-[#E5E7EB]'
              }`}
            >
              <p className={`text-[11px] font-semibold ${form.scopeType === s.value ? 'text-orange-700' : 'text-foreground'}`}>{s.label}</p>
              <p className="text-[9px] text-[#9CA3AF] mt-0.5">{s.desc}</p>
            </button>
          ))}
        </div>
      </FormField>

      {form.scopeType !== 'global' && (
        <>
          <div className="flex items-center gap-2 bg-[#FAFAF8] rounded-lg border border-[#F3F0EB] px-3 py-2">
            <Checkbox
              checked={form.applyToAll}
              onCheckedChange={v => update('applyToAll', !!v)}
              id="apply-all"
            />
            <label htmlFor="apply-all" className="text-[11px] font-medium text-foreground cursor-pointer">
              Apply to all {form.scopeType === 'regional' ? 'regions' : form.scopeType === 'country' ? 'countries' : form.scopeType === 'package' ? 'packages' : form.scopeType === 'channel' ? 'channels' : 'suppliers'}
            </label>
          </div>

          {!form.applyToAll && (
            <div className="bg-[#FAFAF8] rounded-lg border border-[#F3F0EB] p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Info className="h-3 w-3 text-[#9CA3AF]" />
                <p className="text-[10px] text-[#6B7280]">
                  Granular selection will be available once scope-specific data is configured. For now, this rule will apply to all entries within the selected scope type.
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {form.scopeType === 'global' && (
        <div className="bg-emerald-50 rounded-lg border border-emerald-200 px-3 py-2 flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
          <p className="text-[10px] text-emerald-700">This rule will apply to all suppliers, routes, and packages globally.</p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 3 — Trigger Conditions
// ═══════════════════════════════════════════════════════════════════════════════

function Step3Conditions({
  form, update, addCondition, removeCondition, updateCondition,
}: {
  form: RuleFormData;
  update: <K extends keyof RuleFormData>(k: K, v: RuleFormData[K]) => void;
  addCondition: () => void;
  removeCondition: (id: string) => void;
  updateCondition: (id: string, field: keyof TriggerCondition, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <StepHeader title="Trigger Conditions" desc="Define when this fallback rule should activate." />

      {/* Logic toggle */}
      {form.conditions.length > 1 && (
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Match</p>
          {(['AND', 'OR'] as const).map(logic => (
            <button
              key={logic}
              onClick={() => update('conditionLogic', logic)}
              className={`px-3 py-1 rounded-md text-[10px] font-semibold border transition-colors ${
                form.conditionLogic === logic
                  ? 'bg-orange-50 text-orange-700 border-orange-200'
                  : 'bg-[#FAFAF8] text-[#6B7280] border-[#F3F0EB] hover:border-[#E5E7EB]'
              }`}
            >
              {logic}
            </button>
          ))}
          <p className="text-[9px] text-[#9CA3AF]">
            {form.conditionLogic === 'AND' ? 'All conditions must be true' : 'Any condition can trigger'}
          </p>
        </div>
      )}

      {/* Condition rows */}
      <div className="space-y-2">
        {form.conditions.map((cond, idx) => (
          <div key={cond.id} className="bg-white rounded-xl border border-[#F3F0EB] p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-wider">Condition {idx + 1}</span>
              {form.conditions.length > 1 && (
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-red-50" onClick={() => removeCondition(cond.id)}>
                  <Trash2 className="h-3 w-3 text-red-400" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-5 gap-2">
              <div className="col-span-2">
                <label className="text-[8px] font-bold text-[#9CA3AF] uppercase tracking-wider block mb-0.5">Metric</label>
                <Select value={cond.metric} onValueChange={v => updateCondition(cond.id, 'metric', v)}>
                  <SelectTrigger className="h-8 text-[10px] border-[#E5E7EB] bg-[#FAFAF8]"><SelectValue placeholder="Select metric" /></SelectTrigger>
                  <SelectContent>
                    {METRICS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[8px] font-bold text-[#9CA3AF] uppercase tracking-wider block mb-0.5">Operator</label>
                <Select value={cond.operator} onValueChange={v => updateCondition(cond.id, 'operator', v)}>
                  <SelectTrigger className="h-8 text-[10px] border-[#E5E7EB] bg-[#FAFAF8]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {OPERATORS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[8px] font-bold text-[#9CA3AF] uppercase tracking-wider block mb-0.5">Threshold</label>
                <Input
                  className="h-8 text-[10px] border-[#E5E7EB] bg-[#FAFAF8]"
                  placeholder="50"
                  value={cond.threshold}
                  onChange={e => updateCondition(cond.id, 'threshold', e.target.value)}
                />
              </div>
              <div>
                <label className="text-[8px] font-bold text-[#9CA3AF] uppercase tracking-wider block mb-0.5">Window (min)</label>
                <Input
                  className="h-8 text-[10px] border-[#E5E7EB] bg-[#FAFAF8]"
                  placeholder="5"
                  value={cond.timeWindow}
                  onChange={e => updateCondition(cond.id, 'timeWindow', e.target.value)}
                />
              </div>
            </div>

            <div className="mt-2">
              <label className="text-[8px] font-bold text-[#9CA3AF] uppercase tracking-wider block mb-0.5">Required Consecutive Occurrences</label>
              <Input
                className="h-8 text-[10px] border-[#E5E7EB] bg-[#FAFAF8] w-24"
                placeholder="1"
                value={cond.occurrenceCount}
                onChange={e => updateCondition(cond.id, 'occurrenceCount', e.target.value)}
              />
            </div>

            {!cond.metric && (
              <p className="text-[9px] text-red-500 mt-1">Select a metric</p>
            )}
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" className="h-8 gap-1.5 text-[11px] border-[#E5E7EB] w-full" onClick={addCondition}>
        <Plus className="h-3 w-3" />Add Condition
      </Button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 4 — Fallback Routing
// ═══════════════════════════════════════════════════════════════════════════════

function Step4Routing({ form, update, providers }: { form: RuleFormData; update: <K extends keyof RuleFormData>(k: K, v: RuleFormData[K]) => void; providers: Provider[] }) {
  return (
    <div className="space-y-4">
      <StepHeader title="Fallback Routing" desc="Configure supplier failover chain and recovery behavior." />

      {/* Supplier chain */}
      <div className="bg-white rounded-xl border border-[#F3F0EB] p-4">
        <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-3">Routing Chain</p>

        <div className="flex items-center gap-2 mb-4">
          <SupplierSelect
            label="Primary Supplier"
            value={form.primarySupplierId}
            onChange={v => update('primarySupplierId', v)}
            providers={providers}
            excludeIds={[form.fallbackSupplierId, form.secondaryFallbackSupplierId]}
            required
          />
          <ArrowRight className="h-4 w-4 text-[#9CA3AF] flex-shrink-0 mt-5" />
          <SupplierSelect
            label="Fallback Supplier"
            value={form.fallbackSupplierId}
            onChange={v => update('fallbackSupplierId', v)}
            providers={providers}
            excludeIds={[form.primarySupplierId, form.secondaryFallbackSupplierId]}
            required
          />
          <ArrowRight className="h-4 w-4 text-[#9CA3AF] flex-shrink-0 mt-5" />
          <SupplierSelect
            label="2nd Fallback (optional)"
            value={form.secondaryFallbackSupplierId}
            onChange={v => update('secondaryFallbackSupplierId', v)}
            providers={providers}
            excludeIds={[form.primarySupplierId, form.fallbackSupplierId]}
          />
        </div>

        {form.primarySupplierId && form.primarySupplierId === form.fallbackSupplierId && (
          <p className="text-[9px] text-red-500">Primary and fallback suppliers cannot be the same</p>
        )}
      </div>

      {/* Retry & cooldown */}
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Route Selection Method">
          <Select value={form.routeMethod} onValueChange={v => update('routeMethod', v)}>
            <SelectTrigger className="h-9 text-xs border-[#E5E7EB] bg-[#FAFAF8]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">Priority Order</SelectItem>
              <SelectItem value="round_robin">Round Robin</SelectItem>
              <SelectItem value="least_failures">Least Failures</SelectItem>
              <SelectItem value="lowest_latency">Lowest Latency</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Max Retry Count">
          <Input
            type="number"
            className="h-9 text-xs border-[#E5E7EB] bg-[#FAFAF8]"
            value={form.maxRetries}
            onChange={e => update('maxRetries', e.target.value)}
            min={0}
            max={10}
          />
        </FormField>

        <FormField label="Cooldown Before Retry (min)" hint="Wait time before retrying primary">
          <Input
            type="number"
            className="h-9 text-xs border-[#E5E7EB] bg-[#FAFAF8]"
            value={form.cooldownMinutes}
            onChange={e => update('cooldownMinutes', e.target.value)}
            min={1}
            max={1440}
          />
        </FormField>

        <FormField label="Return Threshold (%)" hint="Health score to auto-return to primary">
          <Input
            type="number"
            className="h-9 text-xs border-[#E5E7EB] bg-[#FAFAF8]"
            value={form.returnThreshold}
            onChange={e => update('returnThreshold', e.target.value)}
            min={50}
            max={100}
            disabled={!form.autoReturn}
          />
        </FormField>
      </div>

      {/* Toggles */}
      <div className="grid grid-cols-2 gap-3">
        <ToggleField
          label="Auto Return to Primary"
          desc="Automatically route back when primary recovers"
          checked={form.autoReturn}
          onChange={v => update('autoReturn', v)}
        />
        <ToggleField
          label="Emergency Stop"
          desc="Halt all routing if both suppliers fail"
          checked={form.emergencyStop}
          onChange={v => update('emergencyStop', v)}
          danger
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 5 — Simulation & Validation
// ═══════════════════════════════════════════════════════════════════════════════

function Step5Validate({ form, providers, conflicts, existingRules }: { form: RuleFormData; providers: Provider[]; conflicts: string[]; existingRules: ExistingRule[] }) {
  const provName = (id: string) => providers.find(p => p.id === id)?.provider_name || '—';

  const checks = [
    { label: 'Rule name is set', pass: form.ruleName.trim().length >= 3 },
    { label: 'At least one trigger condition defined', pass: form.conditions.length > 0 && form.conditions[0]?.metric !== '' },
    { label: 'Primary supplier selected', pass: !!form.primarySupplierId },
    { label: 'Fallback supplier selected', pass: !!form.fallbackSupplierId },
    { label: 'Primary ≠ Fallback', pass: !form.primarySupplierId || form.primarySupplierId !== form.fallbackSupplierId },
    { label: 'No circular routing', pass: !form.secondaryFallbackSupplierId || form.secondaryFallbackSupplierId !== form.primarySupplierId },
    { label: 'No priority conflicts', pass: !existingRules.some(r => String(r.priority) === form.priority && r.is_enabled) },
  ];

  const allPass = checks.every(c => c.pass);
  const affectedRoutes = form.scopeType === 'global' ? existingRules.length : Math.ceil(existingRules.length / 3);

  return (
    <div className="space-y-4">
      <StepHeader title="Validation & Simulation" desc="Review rule configuration before saving." />

      {/* Validation checks */}
      <div className="bg-white rounded-xl border border-[#F3F0EB] p-4">
        <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-2">Validation Checks</p>
        <div className="space-y-1.5">
          {checks.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              {c.pass ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
              )}
              <span className={`text-[11px] ${c.pass ? 'text-foreground' : 'text-red-600 font-medium'}`}>{c.label}</span>
            </div>
          ))}
        </div>
        <div className={`mt-3 rounded-md px-3 py-2 ${allPass ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
          <p className={`text-[10px] font-semibold ${allPass ? 'text-emerald-700' : 'text-amber-700'}`}>
            {allPass ? '✓ All checks passed — ready to save' : '⚠ Fix issues above before enabling this rule'}
          </p>
        </div>
      </div>

      {/* Conflict warnings */}
      {conflicts.length > 0 && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-2">Conflict Warnings</p>
          {conflicts.map((c, i) => (
            <div key={i} className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-3 w-3 text-amber-600 flex-shrink-0" />
              <p className="text-[10px] text-amber-700">{c}</p>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="bg-white rounded-xl border border-[#F3F0EB] p-4">
        <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-2">Rule Summary</p>
        <div className="grid grid-cols-2 gap-2">
          <SummaryField label="Rule Name" value={form.ruleName || '—'} />
          <SummaryField label="Priority" value={form.priority} />
          <SummaryField label="Scope" value={form.scopeType} />
          <SummaryField label="Status" value={form.status} />
          <SummaryField label="Primary" value={provName(form.primarySupplierId)} />
          <SummaryField label="Fallback" value={provName(form.fallbackSupplierId)} />
          <SummaryField label="Conditions" value={`${form.conditions.length} (${form.conditionLogic})`} />
          <SummaryField label="Cooldown" value={`${form.cooldownMinutes} min`} />
        </div>
      </div>

      {/* Affected routes */}
      <div className="bg-[#FAFAF8] rounded-lg border border-[#F3F0EB] px-3 py-2 flex items-center gap-2">
        <Info className="h-3.5 w-3.5 text-[#9CA3AF]" />
        <p className="text-[10px] text-[#6B7280]">
          <span className="font-semibold">Estimated affected routes:</span> {affectedRoutes} ({form.scopeType} scope)
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 6 — Save
// ═══════════════════════════════════════════════════════════════════════════════

function Step6Save({ form, providers, saving, onSaveDraft, onEnable, editMode }: {
  form: RuleFormData; providers: Provider[]; saving: boolean; onSaveDraft: () => void; onEnable: () => void; editMode: boolean;
}) {
  const provName = (id: string) => providers.find(p => p.id === id)?.provider_name || '—';

  return (
    <div className="space-y-4">
      <StepHeader title={editMode ? 'Update Rule' : 'Save Rule'} desc="Choose how to save this fallback rule." />

      {/* Final summary card */}
      <div className="bg-white rounded-xl border border-[#F3F0EB] p-4">
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert className="h-4 w-4 text-orange-500" />
          <p className="text-[12px] font-bold text-foreground">{form.ruleName || 'Unnamed Rule'}</p>
          <Badge variant="outline" className={`text-[8px] px-1.5 py-0 h-4 ml-auto ${form.status === 'enabled' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-[#FAF7F2] text-[#6B7280] border-[#E5E7EB]'}`}>
            {form.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-700 border-blue-200">
            {provName(form.primarySupplierId)}
          </Badge>
          <ArrowRight className="h-3 w-3 text-[#9CA3AF]" />
          <Badge variant="outline" className="text-[9px] bg-purple-50 text-purple-700 border-purple-200">
            {provName(form.fallbackSupplierId)}
          </Badge>
          {form.secondaryFallbackSupplierId && (
            <>
              <ArrowRight className="h-3 w-3 text-[#9CA3AF]" />
              <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-700 border-amber-200">
                {provName(form.secondaryFallbackSupplierId)}
              </Badge>
            </>
          )}
        </div>
        <p className="text-[10px] text-[#6B7280]">
          {form.conditions.length} condition{form.conditions.length !== 1 ? 's' : ''} • {form.scopeType} scope • Priority {form.priority} • {form.cooldownMinutes}min cooldown
        </p>
      </div>

      {/* Save actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onSaveDraft}
          disabled={saving}
          className="bg-white rounded-xl border border-[#F3F0EB] p-4 text-left hover:border-orange-200 hover:bg-orange-50/30 transition-colors disabled:opacity-50"
        >
          <div className="flex items-center gap-2 mb-1">
            <Save className="h-4 w-4 text-[#6B7280]" />
            <p className="text-[12px] font-bold text-foreground">{editMode ? 'Update Rule' : 'Save as Draft'}</p>
          </div>
          <p className="text-[9px] text-[#9CA3AF]">
            {editMode ? 'Save changes without changing enabled status' : 'Save the rule without enabling it. You can review and enable later.'}
          </p>
        </button>

        <button
          onClick={onEnable}
          disabled={saving}
          className="bg-emerald-50 rounded-xl border border-emerald-200 p-4 text-left hover:bg-emerald-100/50 transition-colors disabled:opacity-50"
        >
          <div className="flex items-center gap-2 mb-1">
            <Power className="h-4 w-4 text-emerald-600" />
            <p className="text-[12px] font-bold text-emerald-700">Save & Enable</p>
          </div>
          <p className="text-[9px] text-emerald-600/80">
            Save and immediately activate this rule in the policy engine. It will start evaluating live traffic.
          </p>
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Shared sub-components
// ═══════════════════════════════════════════════════════════════════════════════

function StepHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-1">
      <h3 className="text-[13px] font-bold text-foreground">{title}</h3>
      <p className="text-[10px] text-[#6B7280]">{desc}</p>
    </div>
  );
}

function FormField({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1 block">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[9px] text-[#9CA3AF] mt-0.5">{hint}</p>}
    </div>
  );
}

function SupplierSelect({ label, value, onChange, providers, excludeIds, required }: {
  label: string; value: string; onChange: (v: string) => void; providers: Provider[]; excludeIds: string[]; required?: boolean;
}) {
  const filtered = providers.filter(p => !excludeIds.filter(Boolean).includes(p.id));
  return (
    <div className="flex-1">
      <label className="text-[8px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-0.5 block">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-[10px] border-[#E5E7EB] bg-[#FAFAF8]"><SelectValue placeholder="Select..." /></SelectTrigger>
        <SelectContent>
          {!required && <SelectItem value="">None</SelectItem>}
          {filtered.map(p => <SelectItem key={p.id} value={p.id}>{p.provider_name}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function ToggleField({ label, desc, checked, onChange, danger }: {
  label: string; desc: string; checked: boolean; onChange: (v: boolean) => void; danger?: boolean;
}) {
  return (
    <div className={`rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
      checked
        ? danger ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'
        : 'bg-[#FAFAF8] border-[#F3F0EB] hover:border-[#E5E7EB]'
    }`} onClick={() => onChange(!checked)}>
      <div className="flex items-center justify-between">
        <p className={`text-[11px] font-semibold ${checked ? (danger ? 'text-red-700' : 'text-emerald-700') : 'text-foreground'}`}>{label}</p>
        <div className={`w-8 h-4 rounded-full transition-colors flex items-center px-0.5 ${
          checked ? (danger ? 'bg-red-500' : 'bg-emerald-500') : 'bg-[#E5E7EB]'
        }`}>
          <div className={`w-3 h-3 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
        </div>
      </div>
      <p className="text-[9px] text-[#9CA3AF] mt-0.5">{desc}</p>
    </div>
  );
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#FAFAF8] rounded-md border border-[#F3F0EB] px-2.5 py-1.5">
      <p className="text-[8px] font-bold text-[#9CA3AF] uppercase tracking-wider">{label}</p>
      <p className="text-[10px] font-medium text-foreground mt-0.5">{value}</p>
    </div>
  );
}
