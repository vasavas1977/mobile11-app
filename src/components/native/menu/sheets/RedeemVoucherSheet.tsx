import React, { useState } from 'react';
import { AiraloBottomSheet } from './AiraloBottomSheet';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface RedeemVoucherSheetProps {
  open: boolean;
  onClose: () => void;
}

export const RedeemVoucherSheet: React.FC<RedeemVoucherSheetProps> = ({
  open,
  onClose,
}) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleRedeem = async () => {
    if (!code.trim() || !user?.id) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('redeem-voucher', {
        body: { code: code.trim().toUpperCase(), userId: user.id },
      });
      if (error) throw error;
      toast({ title: 'Voucher redeemed!', description: 'Your balance has been updated.' });
      queryClient.invalidateQueries({ queryKey: ['user-loyalty'] });
      setCode('');
      onClose();
    } catch (err: any) {
      toast({
        title: 'Redemption failed',
        description: err?.message || 'Invalid or expired voucher code.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AiraloBottomSheet open={open} onClose={onClose} title="Redeem voucher">
      <div className="p-5 space-y-4">
        <p className="text-[15px] text-gray-700">
          Enter your Mobile11 Money or eSIM voucher code below to add credit to your account.
        </p>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ENTER CODE"
          className="w-full h-12 px-4 border border-gray-300 rounded-2xl text-center text-lg font-bold tracking-widest uppercase bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
        <button
          onClick={handleRedeem}
          disabled={!code.trim() || isLoading}
          className="w-full h-12 rounded-full bg-orange-500 hover:bg-orange-600 text-gray-900 font-bold text-[15px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Redeem'}
        </button>
      </div>
    </AiraloBottomSheet>
  );
};
