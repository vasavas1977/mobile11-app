import { Button } from '@/components/ui/button';
import { CreditCard } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export function PaymentMethodCard() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const handleManagePayment = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        body: {}
      });
      
      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast({
        title: t('myEsims.error'),
        description: error.message || t('myEsims.paymentError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-gray-100 rounded-2xl p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-base mb-1">
              {t('myEsims.managePaymentMethod')}
            </h3>
            <p className="text-gray-600 text-sm">
              {t('myEsims.paymentDescription')}
            </p>
          </div>
        </div>
        
        <Button 
          onClick={handleManagePayment}
          disabled={loading}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 flex-shrink-0"
        >
          {loading ? t('myEsims.loading') : t('myEsims.managePayment')}
        </Button>
      </div>
    </div>
  );
}
