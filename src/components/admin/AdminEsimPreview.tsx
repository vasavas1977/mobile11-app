import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Smartphone, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AdminPreviewProvider } from '@/contexts/AdminPreviewContext';
import { AdminCustomerPreviewBanner } from './AdminCustomerPreviewBanner';
import { EsimCard } from '@/components/my-esims/EsimCard';

export function AdminEsimPreview() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  // Fetch customer profile for banner
  const { data: profile } = useQuery({
    queryKey: ['admin-preview-profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('user_id', userId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId
  });

  // Fetch customer's eSIMs
  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-preview-esims', userId],
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
            package_type,
            qos_speed,
            speed_after_limit
          )
        `)
        .eq('user_id', userId!)
        .in('status', ['completed', 'processing'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Enhanced refresh that calls usage API for each order
  const handleRefresh = async () => {
    setIsRefreshing(true);
    let successCount = 0;
    let failCount = 0;
    try {
      for (const order of orders) {
        try {
          const { error } = await supabase.functions.invoke('check-esim-usage', {
            body: { orderId: order.id, forceRefresh: true }
          });
          if (error) { failCount++; } else { successCount++; }
        } catch (err) {
          console.error('Error refreshing usage for order:', order.id, err);
          failCount++;
        }
        // Wait 2 seconds between calls to avoid USIMSA rate limiting
        await new Promise(r => setTimeout(r, 2000));
      }
      await refetch();
      if (failCount > 0) {
        toast.warning(`Refreshed ${successCount}/${orders.length} eSIMs. ${failCount} failed.`);
      } else {
        toast.success(`Refreshed all ${successCount} eSIMs successfully.`);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const customerName = profile 
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || null
    : null;

  return (
    <AdminPreviewProvider 
      userId={userId!}
      customerName={customerName}
      customerEmail={profile?.email}
    >
      <div className="min-h-screen bg-[#FAF7F2] relative">
        {/* Admin Preview Banner */}
        <AdminCustomerPreviewBanner 
          customerName={customerName}
          customerEmail={profile?.email || null}
        />
        
        {/* Content with top padding for banner */}
        <main className="container mx-auto px-4 pt-20 pb-12">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
                  My eSIMs
                </h1>
                <p className="text-gray-600 mt-2">
                  Manage your eSIMs and data packages
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
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
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
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No eSIMs Found</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  This customer hasn't purchased any eSIMs yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {orders.map((order) => (
                  <EsimCard 
                    key={order.id} 
                    order={order} 
                    onClick={() => navigate(`/admin/users/${userId}/preview/esims/${order.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </AdminPreviewProvider>
  );
}
