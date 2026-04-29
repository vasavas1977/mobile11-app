// ─── Conflict Detection Engine for Fallback Policy Engine ────────────────────

export interface ConflictRule {
  id: string;
  rule_name: string;
  scope: string;
  primary_provider_id: string | null;
  fallback_provider_id: string | null;
  trigger_condition: string;
  trigger_threshold: number;
  priority: number;
  is_enabled: boolean;
  primary_provider_name?: string | null;
  fallback_provider_name?: string | null;
}

export type ConflictType =
  | 'overlap'
  | 'loop'
  | 'same_supplier'
  | 'incomplete_chain'
  | 'priority_collision'
  | 'return_conflict';

export interface ConflictWarning {
  type: ConflictType;
  severity: 'critical' | 'warning' | 'info';
  ruleIds: string[];
  ruleNames: string[];
  message: string;
}

const CONFLICT_LABELS: Record<ConflictType, string> = {
  overlap: 'Overlap',
  loop: 'Loop Risk',
  same_supplier: 'Same Supplier',
  incomplete_chain: 'Incomplete Chain',
  priority_collision: 'Priority Collision',
  return_conflict: 'Return Conflict',
};

const CONFLICT_BADGE_COLORS: Record<ConflictType, string> = {
  overlap: 'bg-amber-50 text-amber-700 border-amber-200',
  loop: 'bg-red-50 text-red-700 border-red-200',
  same_supplier: 'bg-red-50 text-red-700 border-red-200',
  incomplete_chain: 'bg-orange-50 text-orange-700 border-orange-200',
  priority_collision: 'bg-purple-50 text-purple-700 border-purple-200',
  return_conflict: 'bg-amber-50 text-amber-700 border-amber-200',
};

export { CONFLICT_LABELS, CONFLICT_BADGE_COLORS };

/**
 * Run all conflict checks against the full set of rules.
 */
export function detectConflicts(rules: ConflictRule[]): ConflictWarning[] {
  const warnings: ConflictWarning[] = [];
  const enabled = rules.filter(r => r.is_enabled);

  // 1. Overlap: same scope + trigger condition on enabled rules
  for (let i = 0; i < enabled.length; i++) {
    for (let j = i + 1; j < enabled.length; j++) {
      const a = enabled[i], b = enabled[j];
      if (
        a.scope === b.scope &&
        a.trigger_condition === b.trigger_condition &&
        a.primary_provider_id === b.primary_provider_id
      ) {
        warnings.push({
          type: 'overlap',
          severity: 'warning',
          ruleIds: [a.id, b.id],
          ruleNames: [a.rule_name, b.rule_name],
          message: `"${a.rule_name}" and "${b.rule_name}" overlap — same scope, trigger, and primary supplier`,
        });
      }
    }
  }

  // 2. Fallback loops: A→B and B→A
  for (let i = 0; i < enabled.length; i++) {
    for (let j = i + 1; j < enabled.length; j++) {
      const a = enabled[i], b = enabled[j];
      if (
        a.primary_provider_id && a.fallback_provider_id &&
        b.primary_provider_id && b.fallback_provider_id &&
        a.primary_provider_id === b.fallback_provider_id &&
        a.fallback_provider_id === b.primary_provider_id &&
        a.trigger_condition === b.trigger_condition
      ) {
        warnings.push({
          type: 'loop',
          severity: 'critical',
          ruleIds: [a.id, b.id],
          ruleNames: [a.rule_name, b.rule_name],
          message: `Circular fallback loop: "${a.rule_name}" and "${b.rule_name}" route traffic back and forth on the same trigger`,
        });
      }
    }
  }

  // 3. Primary = fallback
  for (const r of rules) {
    if (r.primary_provider_id && r.primary_provider_id === r.fallback_provider_id) {
      warnings.push({
        type: 'same_supplier',
        severity: 'critical',
        ruleIds: [r.id],
        ruleNames: [r.rule_name],
        message: `"${r.rule_name}" has identical primary and fallback suppliers`,
      });
    }
  }

  // 4. Incomplete chain: enabled rule with no fallback
  for (const r of enabled) {
    if (!r.fallback_provider_id) {
      warnings.push({
        type: 'incomplete_chain',
        severity: 'warning',
        ruleIds: [r.id],
        ruleNames: [r.rule_name],
        message: `"${r.rule_name}" is enabled but has no fallback supplier configured`,
      });
    }
  }

  // 5. Priority collisions
  const prioMap = new Map<number, ConflictRule[]>();
  enabled.forEach(r => {
    const list = prioMap.get(r.priority) || [];
    list.push(r);
    prioMap.set(r.priority, list);
  });
  prioMap.forEach((group, prio) => {
    if (group.length > 1) {
      warnings.push({
        type: 'priority_collision',
        severity: 'warning',
        ruleIds: group.map(r => r.id),
        ruleNames: group.map(r => r.rule_name),
        message: `Priority ${prio} collision: ${group.map(r => `"${r.rule_name}"`).join(', ')}`,
      });
    }
  });

  return warnings;
}

/**
 * Get conflicts for a specific rule.
 */
export function getConflictsForRule(ruleId: string, allConflicts: ConflictWarning[]): ConflictWarning[] {
  return allConflicts.filter(c => c.ruleIds.includes(ruleId));
}
