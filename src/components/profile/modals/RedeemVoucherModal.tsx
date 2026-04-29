import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Ticket, Loader2, Gift, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface RedeemVoucherModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RedeemVoucherModal: React.FC<RedeemVoucherModalProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<{ amount: string; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) { toast.error(t('profile.voucher.enterCode')); return; }
    if (!user?.id) { toast.error(t('profile.voucher.loginRequired')); return; }

    setIsLoading(true);
    setSuccess(null);
    
    try {
      // First try the new Mobile11 Money code redemption
      const { data: redeemData, error: redeemError } = await supabase.functions.invoke('redeem-mobile11-code', {
        body: { code: code.toUpperCase().trim() }
      });

      if (redeemError) {
        console.error('Redeem error:', redeemError);
        toast.error('Failed to redeem code. Please try again.');
        return;
      }

      if (redeemData?.success) {
        // Successfully redeemed as Mobile11 Money code
        setSuccess({
          amount: redeemData.displayAmount,
          message: redeemData.message
        });
        queryClient.invalidateQueries({ queryKey: ['user-loyalty'] });
        queryClient.invalidateQueries({ queryKey: ['loyalty-transactions'] });
        setCode('');
        return;
      }

      // If it's a checkout code, inform the user
      if (redeemData?.isCheckoutCode) {
        toast.error(t('profile.voucher.useAtCheckout') || 'This code should be applied at checkout');
        return;
      }

      // If not found in promo_codes, try legacy voucher_codes table
      const { data: voucher, error: fetchError } = await supabase
        .from('voucher_codes').select('*').eq('code', code.toUpperCase().trim()).single();
      
      if (fetchError || !voucher) { 
        toast.error(redeemData?.error || t('profile.voucher.invalid')); 
        return; 
      }
      if (voucher.is_used) { toast.error(t('profile.voucher.alreadyUsed')); return; }
      if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) { toast.error(t('profile.voucher.expired')); return; }

      await supabase.from('voucher_codes').update({ is_used: true, used_by: user.id, used_at: new Date().toISOString() }).eq('id', voucher.id);

      if (voucher.voucher_type === 'mobile11_money') {
        const { data: loyalty } = await supabase.from('user_loyalty').select('mobile11_money_balance').eq('user_id', user.id).single();
        const newBalance = (loyalty?.mobile11_money_balance || 0) + voucher.value_amount;
        await supabase.from('user_loyalty').update({ mobile11_money_balance: newBalance }).eq('user_id', user.id);
        await supabase.from('mobile11_money_transactions').insert({ user_id: user.id, amount: voucher.value_amount, type: 'voucher', description: `Voucher redeemed: ${voucher.code}` });
        
        setSuccess({
          amount: `฿${voucher.value_amount.toFixed(2)}`,
          message: t('profile.voucher.successMoney').replace('{amount}', voucher.value_amount.toFixed(2))
        });
      } else {
        toast.success(t('profile.voucher.successEsim'));
        onOpenChange(false);
      }
      
      queryClient.invalidateQueries({ queryKey: ['user-loyalty'] });
      queryClient.invalidateQueries({ queryKey: ['loyalty-transactions'] });
      setCode('');
    } catch (error) {
      toast.error('Failed to redeem code: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSuccess(null);
    setCode('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white border-gray-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <Gift className="w-5 h-5 text-orange-500" />
            {t('profile.voucher.title')}
          </DialogTitle>
          <DialogDescription className="text-gray-600">{t('profile.voucher.description')}</DialogDescription>
        </DialogHeader>
        
        {success ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{success.amount}</p>
              <p className="text-gray-600 mt-2">{success.message}</p>
            </div>
            <Button 
              onClick={handleClose} 
              className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full"
            >
              {t('common.done') || 'Done'}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="voucherCode" className="text-gray-900">{t('profile.voucher.codeLabel')}</Label>
              <div className="relative">
                <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input id="voucherCode" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder={t('profile.voucher.placeholder')} className="h-12 rounded-xl pl-10 uppercase bg-white border-gray-300 text-gray-900" required />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1 rounded-full bg-white border-gray-300 text-gray-900 hover:bg-gray-50">{t('profile.voucher.cancel')}</Button>
              <Button type="submit" disabled={isLoading || !code.trim()} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-full">
                {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('profile.voucher.redeeming')}</> : t('profile.voucher.redeem')}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
