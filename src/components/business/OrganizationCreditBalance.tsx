import { CreditCard, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useOrganizationCredit } from '@/hooks/useOrganizationCredit';

interface OrganizationCreditBalanceProps {
  orgId: string | null;
  compact?: boolean;
}

export function OrganizationCreditBalance({ orgId, compact = false }: OrganizationCreditBalanceProps) {
  const navigate = useNavigate();
  const { data: credit, isLoading } = useOrganizationCredit(orgId);

  if (isLoading || !credit) {
    return null;
  }

  const balance = credit.credit_balance || 0;

  if (compact) {
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        className="gap-2 text-gray-700 hover:bg-gray-100"
        onClick={() => navigate('/business/transactions')}
      >
        <CreditCard className="h-4 w-4 text-emerald-600" />
        <span className="font-semibold">฿{balance.toLocaleString()}</span>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl shadow-sm">
      <div className="p-2 bg-emerald-100 rounded-lg">
        <CreditCard className="h-4 w-4 text-emerald-600" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-gray-500">Credit Balance</p>
        <p className="font-semibold text-gray-900">฿{balance.toLocaleString()}</p>
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-8 w-8 p-0"
        onClick={() => navigate('/business/transactions')}
      >
        <History className="h-4 w-4 text-gray-500" />
      </Button>
    </div>
  );
}
