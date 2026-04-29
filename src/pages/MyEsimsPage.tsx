import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { FooterAiralo } from '@/components/landing/FooterAiralo';
import { Button } from '@/components/ui/button';
import { Smartphone, RefreshCw, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { EsimCard } from '@/components/my-esims/EsimCard';
import { DecorationShapes } from '@/components/my-esims/DecorationShapes';

export default function MyEsimsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Redirect to auth popup if not logged in
  useEffect(() => {
    if (!loading && !user) {
      sessionStorage.setItem('post_auth_next', '/my-esims');
      window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { tab: 'signin' } }));
      navigate('/', { replace: true });
    }
  }, [loading, user, navigate]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['user-esims', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          cached_usage,
          usage_cached_at,
          cached_installation,
          installation_cached_at,
          auto_renewal_enabled,
          renewal_payment_method_id,
          renewal_failure_count,
          esim_packages:package_id (
            name,
            country_name,
            country_code,
            data_amount,
            validity_days,
            carrier,
            package_type
          )
        `)
        .eq('user_id', user!.id)
        .in('status', ['completed', 'processing'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Enhanced refresh that calls usage API for each order
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Call usage API for each order to refresh cache (sequential to avoid rate limits)
      for (const order of orders) {
        try {
          await supabase.functions.invoke('check-esim-usage', {
            body: { orderId: order.id, forceRefresh: true }
          });
        } catch (err) {
          console.error('Error refreshing usage for order:', order.id, err);
        }
      }
      // Refetch orders from database to get updated cache
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Show loading spinner only while auth is loading
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2]">
        <Header />
        <div className="flex items-center justify-center pt-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  // Return null while redirecting to auth
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] relative">
      <Header />
      
      {/* Decorative background shapes */}
      <DecorationShapes />
      
      <main className="container mx-auto px-4 pt-44 md:pt-48 pb-12 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
                {t('myEsims.title')}
              </h1>
              <p className="text-gray-600 mt-2">
                {t('myEsims.subtitle')}
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex-shrink-0 border-gray-300 hover:bg-gray-50"
              size="sm"
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {isRefreshing ? t('myEsims.refreshing') || 'Refreshing...' : t('myEsims.refresh')}
            </Button>
          </div>

          {/* eSIMs Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-12 text-center">
              <Smartphone className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('myEsims.noEsims')}</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {t('myEsims.noEsimsDescription')}
              </p>
              <Button 
                onClick={() => navigate('/packages')}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8"
              >
                {t('myEsims.browsePackages')}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {orders.map((order) => (
                <EsimCard 
                  key={order.id} 
                  order={order} 
                  onClick={() => navigate(`/my-esims/${order.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      
      <FooterAiralo />
    </div>
  );
}
