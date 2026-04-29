import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface AddNewCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCardAdded?: () => void;
}

export function AddNewCardDialog({ open, onOpenChange, onCardAdded }: AddNewCardDialogProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const handleAddCard = async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('create-setup-session', {
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
        body: {},
      });

      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating setup session:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden rounded-2xl border-0 bg-white">
        {/* Header */}
        <div className="relative p-6 pb-4" style={{ backgroundColor: '#FAF7F2' }}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 text-center">
              {t('cart.addNewCardTitle') || 'Pay with credit card'}
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="p-6 pt-4 space-y-5 bg-white">
          {/* Card Brand Icons */}
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-8 bg-white border border-gray-200 rounded flex items-center justify-center">
              <span className="text-[#1A1F71] font-bold text-xs">VISA</span>
            </div>
            <div className="w-12 h-8 bg-white border border-gray-200 rounded flex items-center justify-center">
              <div className="flex">
                <div className="w-3 h-3 bg-red-500 rounded-full -mr-1"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full opacity-80"></div>
              </div>
            </div>
            <div className="w-12 h-8 bg-white border border-gray-200 rounded flex items-center justify-center">
              <span className="text-[#D32029] font-bold text-[10px]">UnionPay</span>
            </div>
            <div className="w-12 h-8 bg-white border border-gray-200 rounded flex items-center justify-center">
              <span className="text-[#006FCF] font-bold text-xs">AMEX</span>
            </div>
          </div>

          {/* Information Text */}
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              {t('cart.secureCardInfo') || 'You will be redirected to Stripe to securely process your payment.'}
            </p>
            <p className="text-xs text-gray-500">
              {t('cart.cardInfoSafe') || 'Your card information is never stored on our servers.'}
            </p>
          </div>

          {/* Powered by Stripe */}
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <span className="text-xs">{t('cart.poweredByStripe') || 'Powered by stripe'}</span>
            <svg className="w-8 h-4" viewBox="0 0 60 25" fill="currentColor">
              <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a10.04 10.04 0 01-4.56 1.02c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.56zm-6.3-5.63c-1.03 0-1.83.76-2.07 2.68h4.15c-.01-1.64-.67-2.68-2.08-2.68zM45.34 5.22V20h-4.14V8.67l-1.1.17v-3.5l5.24-.12zM36.94 2.68c0 1.47-1.18 2.55-2.6 2.55s-2.6-1.08-2.6-2.55c0-1.46 1.18-2.55 2.6-2.55s2.6 1.09 2.6 2.55zm-4.67 2.54h4.14V20h-4.14V5.22zM28.71 5.22V20h-4.14v-1.43a5.55 5.55 0 01-3.5 1.69c-3.28 0-5.59-2.99-5.59-7.74 0-5.18 2.69-7.52 5.75-7.52 1.27 0 2.47.46 3.34 1.43V5.22h4.14zm-4.14 7.52c0-2.5-1.01-3.98-2.64-3.98-1.64 0-2.64 1.49-2.64 3.98s1.01 3.98 2.64 3.98c1.64 0 2.64-1.49 2.64-3.98zM11.16 5.22V8.9H9.88v3.27h1.28v4.77c0 2.55 1.68 3.32 4.42 3.06v-3.22c-1.05.06-1.44-.16-1.44-1.09v-3.52h1.44V5.22h-4.42zm-5.2 0V20H1.83V5.22h4.13z"/>
            </svg>
          </div>

          {/* Add Card Button */}
          <Button
            onClick={handleAddCard}
            disabled={loading}
            className="w-full py-6 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-semibold text-base"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('cart.redirecting') || 'Redirecting...'}
              </>
            ) : (
              t('cart.addCard') || 'Pay with credit card'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
