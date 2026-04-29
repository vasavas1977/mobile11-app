import { History, ArrowUpCircle, ArrowDownCircle, Loader2, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useOrganizationCreditTransactions } from '@/hooks/useOrganizationCredit';
import { format } from 'date-fns';

interface OrgTransactionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: {
    id: string;
    name: string;
    credit_balance: number;
  };
}

export function OrgTransactionsDialog({ open, onOpenChange, organization }: OrgTransactionsDialogProps) {
  const { data: transactions = [], isLoading } = useOrganizationCreditTransactions(organization.id);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'topup':
        return <ArrowUpCircle className="h-4 w-4 text-emerald-600" />;
      case 'purchase':
        return <ArrowDownCircle className="h-4 w-4 text-red-600" />;
      case 'refund':
        return <RefreshCw className="h-4 w-4 text-blue-600" />;
      default:
        return <History className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'topup':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Top Up</Badge>;
      case 'purchase':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Purchase</Badge>;
      case 'refund':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Refund</Badge>;
      case 'adjustment':
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Adjustment</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Transaction History
          </DialogTitle>
          <DialogDescription>
            Credit transactions for {organization.name}
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 bg-muted rounded-lg mb-4">
          <p className="text-sm text-muted-foreground">Current Balance</p>
          <p className="text-2xl font-bold">฿{(organization.credit_balance || 0).toLocaleString()}</p>
        </div>

        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div 
                  key={tx.id} 
                  className="flex items-start gap-3 p-3 bg-card border rounded-lg"
                >
                  <div className="mt-1">
                    {getTypeIcon(tx.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      {getTypeBadge(tx.type)}
                      <span className={`font-semibold ${tx.amount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {tx.amount > 0 ? '+' : ''}฿{Math.abs(tx.amount).toLocaleString()}
                      </span>
                    </div>
                    {tx.description && (
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {tx.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <span>{format(new Date(tx.created_at), 'MMM d, yyyy h:mm a')}</span>
                      <span>Balance: ฿{tx.balance_after.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
