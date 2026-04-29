import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreditCard, Plus, ChevronRight, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SavedCard {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  name: string;
  isDefault: boolean;
}

interface ManagePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  currentPaymentMethodId?: string | null;
  onPaymentMethodSet?: () => void;
}

const CardBrandIcon = ({ brand }: { brand: string }) => {
  const brandLower = brand.toLowerCase();
  
  // Simple colored brand indicators
  const brandColors: Record<string, string> = {
    visa: '#1A1F71',
    mastercard: '#EB001B',
    amex: '#006FCF',
    discover: '#FF6000',
    jcb: '#0E4C96',
    unionpay: '#D32029',
  };

  return (
    <div 
      className="w-10 h-6 rounded flex items-center justify-center text-xs font-bold text-white uppercase"
      style={{ backgroundColor: brandColors[brandLower] || '#6B7280' }}
    >
      {brand.slice(0, 4)}
    </div>
  );
};

export function ManagePaymentDialog({ 
  open, 
  onOpenChange, 
  orderId,
  currentPaymentMethodId,
  onPaymentMethodSet
}: ManagePaymentDialogProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(currentPaymentMethodId || null);
  const [saving, setSaving] = useState(false);
  const [addingCard, setAddingCard] = useState(false);

  useEffect(() => {
    if (open) {
      fetchPaymentMethods();
    }
  }, [open]);

  useEffect(() => {
    if (currentPaymentMethodId) {
      setSelectedCardId(currentPaymentMethodId);
    }
  }, [currentPaymentMethodId]);

  const fetchPaymentMethods = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('list-payment-methods');
      
      if (error) throw error;
      
      setCards(data?.cards || []);
      
      // If no card is selected yet, select the first one or the default
      if (!selectedCardId && data?.cards?.length > 0) {
        const defaultCard = data.cards.find((c: SavedCard) => c.isDefault);
        setSelectedCardId(defaultCard?.id || data.cards[0].id);
      }
    } catch (error: any) {
      console.error('Error fetching payment methods:', error);
      toast({
        title: t('myEsims.error'),
        description: error.message || 'Failed to load payment methods',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewCard = async () => {
    setAddingCard(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-setup-session', {
        body: { orderId }
      });
      
      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast({
        title: t('myEsims.error'),
        description: error.message || 'Failed to add new card',
        variant: 'destructive',
      });
    } finally {
      setAddingCard(false);
    }
  };

  const handleUseCard = async () => {
    if (!selectedCardId) return;
    
    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke('set-renewal-payment-method', {
        body: { orderId, paymentMethodId: selectedCardId }
      });
      
      if (error) throw error;
      
      toast({
        title: t('managePayment.cardUpdated'),
        description: t('managePayment.cardUpdatedDesc'),
      });
      
      onPaymentMethodSet?.();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: t('myEsims.error'),
        description: error.message || 'Failed to update payment method',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const formatExpiry = (month: number, year: number) => {
    return `${String(month).padStart(2, '0')} / ${String(year).slice(-2)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#F5F1EC] border-none max-w-md p-0 rounded-3xl overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl font-semibold text-gray-800">
            {t('managePayment.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-6">
          {/* Saved Cards Section */}
          <div>
            <h3 className="text-base font-semibold text-gray-800 mb-1">
              {t('managePayment.savedCards')}
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              {t('managePayment.selectCard')}
            </p>
            <p className="text-xs text-gray-500 mb-4">
              {t('managePayment.manageFromProfile')}
            </p>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : cards.length > 0 ? (
              <div className="space-y-3">
                {cards.map((card) => (
                  <label
                    key={card.id}
                    className={`flex items-center gap-3 p-4 bg-white rounded-xl cursor-pointer transition-all ${
                      selectedCardId === card.id 
                        ? 'ring-2 ring-orange-500' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <CardBrandIcon brand={card.brand} />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm">
                        {card.name || `•••• ${card.last4}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t('managePayment.expires')} {formatExpiry(card.exp_month, card.exp_year)}
                      </p>
                    </div>
                    <input
                      type="radio"
                      name="payment-method"
                      checked={selectedCardId === card.id}
                      onChange={() => setSelectedCardId(card.id)}
                      className="w-5 h-5 text-orange-500 border-gray-300 focus:ring-orange-500"
                    />
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 py-4 text-center">
                {t('managePayment.noCards')}
              </p>
            )}
          </div>

          {/* Divider with text */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#F5F1EC] px-4 text-sm text-gray-500">
                {t('managePayment.payWithNewCard')}
              </span>
            </div>
          </div>

          {/* Add New Card Option */}
          <button
            onClick={handleAddNewCard}
            disabled={addingCard}
            className="w-full flex items-center gap-3 p-4 bg-white rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              {addingCard ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              ) : (
                <Plus className="w-5 h-5 text-gray-600" />
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-800 text-sm">
                {t('managePayment.addNewCard')}
              </p>
              <p className="text-xs text-gray-500">
                {t('managePayment.supportedCards')}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          {/* Use Card Button */}
          <Button
            onClick={handleUseCard}
            disabled={!selectedCardId || saving || cards.length === 0}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-6 rounded-xl"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              t('managePayment.useCard')
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
