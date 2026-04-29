import { useState } from 'react';
import { CreditCard, Wallet, Loader2, ArrowUpCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { useOrganizationCredit } from '@/hooks/useOrganizationCredit';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const PRESET_AMOUNTS = [5000, 10000, 25000, 50000];
const MIN_AMOUNT = 1000;

interface BusinessTopUpDialogProps {
  trigger?: React.ReactNode;
}

export function BusinessTopUpDialog({ trigger }: BusinessTopUpDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [isLoading, setIsLoading] = useState(false);

  const { currentOrg } = useOrganizationContext();
  const { data: credit } = useOrganizationCredit(currentOrg?.id || null);

  const currentBalance = credit?.credit_balance || 0;
  const finalAmount = selectedAmount || (customAmount ? parseInt(customAmount, 10) : 0);
  const newBalance = currentBalance + finalAmount;

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    const numValue = value.replace(/[^0-9]/g, '');
    setCustomAmount(numValue);
    setSelectedAmount(null);
  };

  const handleSubmit = async () => {
    if (!currentOrg?.id) {
      toast.error('No organization selected');
      return;
    }

    if (finalAmount < MIN_AMOUNT) {
      toast.error(`Minimum top-up amount is ฿${MIN_AMOUNT.toLocaleString()}`);
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-org-topup-payment', {
        body: {
          amount: finalAmount,
          organizationId: currentOrg.id,
          paymentMethod
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        // Open Stripe checkout in new tab
        window.open(data.url, '_blank');
        setOpen(false);
        toast.success('Redirecting to payment...');
      } else {
        throw new Error('No payment URL received');
      }
    } catch (error: any) {
      console.error('Top-up error:', error);
      toast.error(error.message || 'Failed to initiate payment');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedAmount(null);
    setCustomAmount('');
    setPaymentMethod('stripe');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-full gap-2">
            <ArrowUpCircle className="h-4 w-4" />
            Top Up Credit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <Wallet className="h-5 w-5 text-orange-600" />
            Top Up Organization Credit
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Add credit to your organization account for eSIM purchases.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Balance */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-500">Current Balance</p>
            <p className="text-2xl font-bold text-gray-900">฿{currentBalance.toLocaleString()}</p>
          </div>

          {/* Amount Selection */}
          <div className="space-y-3">
            <Label className="text-gray-700">Select Amount</Label>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => handleAmountSelect(amount)}
                  className={cn(
                    "p-3 rounded-xl border-2 text-center font-semibold transition-all",
                    selectedAmount === amount
                      ? "border-orange-500 bg-orange-50 text-orange-700"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  )}
                >
                  ฿{amount.toLocaleString()}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="customAmount" className="text-gray-700">Or enter custom amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">฿</span>
                <Input
                  id="customAmount"
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter amount (min ฿1,000)"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  className="pl-8 bg-white border-gray-200 text-gray-900 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <Label className="text-gray-700">Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-2">
              <div className={cn(
                "flex items-center space-x-3 p-3 rounded-xl border-2 transition-all cursor-pointer",
                paymentMethod === 'stripe'
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              )}>
                <RadioGroupItem value="stripe" id="stripe" />
                <Label htmlFor="stripe" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CreditCard className="h-4 w-4 text-gray-600" />
                  <span className="text-gray-900">Credit/Debit Card</span>
                </Label>
              </div>
              {/* Future: PromptPay option */}
              {/* <div className={cn(
                "flex items-center space-x-3 p-3 rounded-xl border-2 transition-all cursor-pointer",
                paymentMethod === '2c2p'
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              )}>
                <RadioGroupItem value="2c2p" id="2c2p" />
                <Label htmlFor="2c2p" className="flex items-center gap-2 cursor-pointer flex-1">
                  <QrCode className="h-4 w-4 text-gray-600" />
                  <span className="text-gray-900">PromptPay (Thai Bank Transfer)</span>
                </Label>
              </div> */}
            </RadioGroup>
          </div>

          {/* New Balance Preview */}
          {finalAmount > 0 && (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <p className="text-sm text-emerald-700">New Balance After Top-Up</p>
              <p className="text-2xl font-bold text-emerald-700">฿{newBalance.toLocaleString()}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="flex-1 rounded-full border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || finalAmount < MIN_AMOUNT}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-full gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Proceed to Payment
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
