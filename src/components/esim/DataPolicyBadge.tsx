interface DataPolicyBadgeProps {
  dataAmount: string;
  compact?: boolean;
}

export function DataPolicyBadge({ dataAmount, compact = false }: DataPolicyBadgeProps) {
  const isUnlimited = dataAmount.toLowerCase().includes('unlimited') || dataAmount.toLowerCase().includes('∞');
  
  if (!isUnlimited) return null;

  return (
    <p className="text-xs text-muted-foreground mt-2">
      *Fair use policy applies
    </p>
  );
}
