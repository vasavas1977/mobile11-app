import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface SavedCard {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  name: string;
  isDefault: boolean;
}

const CardBrandIcon: React.FC<{ brand: string }> = ({ brand }) => {
  const brandColors: Record<string, string> = {
    visa: 'bg-blue-600',
    mastercard: 'bg-red-500',
    amex: 'bg-blue-400',
    discover: 'bg-orange-500',
    default: 'bg-gray-500'
  };
  
  const color = brandColors[brand.toLowerCase()] || brandColors.default;
  
  return (
    <div className={`w-12 h-8 ${color} rounded flex items-center justify-center`}>
      <CreditCard className="w-5 h-5 text-white" />
    </div>
  );
};

export const SavedCardsSection: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCards, setIsLoadingCards] = useState(true);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);

  useEffect(() => {
    if (user) {
      fetchPaymentMethods();
    } else {
      setIsLoadingCards(false);
    }
  }, [user]);

  const fetchPaymentMethods = async () => {
    if (!user) return;
    
    setIsLoadingCards(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('list-payment-methods', {
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (error) throw error;
      setSavedCards(data?.cards || []);
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
    } finally {
      setIsLoadingCards(false);
    }
  };

  const handleManageCards = async () => {
    if (!user) {
      toast.error('Please log in to manage your cards');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        toast.error('Unable to open payment management. Please try again.');
      }
    } catch (error) {
      console.error('Failed to open customer portal:', error);
      toast.error('Card management is being set up. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">{t('profile.cards.title')}</h2>
        
        {isLoadingCards ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : savedCards.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              {t('profile.cards.noCards')}
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
              {t('profile.cards.noCardsDesc')}
            </p>
            <Button 
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-6"
              onClick={handleManageCards}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('profile.cards.opening')}
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('profile.cards.addNew')}
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {savedCards.map((card) => (
              <div 
                key={card.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <CardBrandIcon brand={card.brand} />
                  <div>
                    <p className="font-medium text-gray-900 capitalize">
                      {card.brand} •••• {card.last4}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t('profile.cards.expires')} {card.exp_month}/{card.exp_year}
                    </p>
                  </div>
                </div>
                {card.isDefault && (
                  <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                    {t('profile.cards.default')}
                  </span>
                )}
              </div>
            ))}
            
            <Button 
              className="w-full rounded-full bg-gray-900 text-white hover:bg-gray-800 mt-4"
              onClick={handleManageCards}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('profile.cards.opening')}
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {t('profile.cards.manageCards')}
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};