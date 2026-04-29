import { useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAdminTopUpCredit } from '@/hooks/useOrganizationCredit';

interface TopUpCreditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: {
    id: string;
    name: string;
    credit_balance: number;
  };
}

export function TopUpCreditDialog({ open, onOpenChange, organization }: TopUpCreditDialogProps) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const topUpMutation = useAdminTopUpCredit();

  const currentBalance = organization.credit_balance || 0;
  const addAmount = parseFloat(amount) || 0;
  const newBalance = currentBalance + addAmount;

  const handleSubmit = async () => {
    if (addAmount <= 0) return;

    await topUpMutation.mutateAsync({
      organizationId: organization.id,
      amount: addAmount,
      note: note || undefined,
    });

    setAmount('');
    setNote('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Top Up Credit
          </DialogTitle>
          <DialogDescription>
            Add credit to {organization.name}'s account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Current Balance</p>
            <p className="text-2xl font-bold">฿{currentBalance.toLocaleString()}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (THB)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea
              id="note"
              placeholder="e.g., Payment received via bank transfer, Ref: ABC123"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>

          {addAmount > 0 && (
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <p className="text-sm text-emerald-700">New Balance</p>
              <p className="text-2xl font-bold text-emerald-700">฿{newBalance.toLocaleString()}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={addAmount <= 0 || topUpMutation.isPending}
          >
            {topUpMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Confirm Top Up'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
