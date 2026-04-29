import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { AdminPreviewProvider } from '@/contexts/AdminPreviewContext';
import { AdminCustomerPreviewBanner } from './AdminCustomerPreviewBanner';
import { EsimDetailCard } from '@/components/my-esims/EsimDetailCard';
import { InstallationBanner } from '@/components/my-esims/InstallationBanner';
import { InstallationFAQs } from '@/components/my-esims/InstallationFAQs';
import { PackageHistoryList, computePackageStatuses } from '@/components/my-esims/PackageHistoryList';
import { KycVerificationBanner } from '@/components/my-esims/KycVerificationBanner';
import { isEsimExpired } from '@/utils/esimValidity';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export function AdminEsimDetailPreview() {
  const { userId, orderId } = useParams<{ userId: string; orderId: string }>();
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

  // Fetch order details
  const { data: order, isLoading } = useQuery({
    queryKey: ['admin-preview-esim-detail', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          esim_packages:package_id (
            name,
            country_name,
            country_code,
            data_amount,
            validity_days,
            carrier,
            included_countries,
            package_type,
            daily_data_reset,
            daily_reset_amount,
            speed_after_limit,
            kyc,
            is_local_sim
          )
        `)
        .eq('id', orderId!)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!orderId
  });

  // Fetch all packages for this ICCID to find the currently active one
  const { data: allPackagesForIccid } = useQuery({
    queryKey: ['admin-preview-all-packages', order?.iccid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          cached_usage,
          esim_packages:package_id (
            data_amount,
            validity_days,
            package_type
          )
        `)
        .eq('iccid', order!.iccid!)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!order?.iccid
  });

  // Find the currently active package using FIFO chain logic
  const activePackageOrder = useMemo(() => {
    if (!allPackagesForIccid || allPackagesForIccid.length === 0) return null;
    
    const statusMap = computePackageStatuses(allPackagesForIccid as any);
    
    for (const pkg of allPackagesForIccid) {
      if (statusMap.get(pkg.id) === 'active') {
        return pkg;
      }
    }
    
    return null;
  }, [allPackagesForIccid]);

  // Check installation status
  const { data: installationStatus } = useQuery({
    queryKey: ['admin-preview-installation-status', orderId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('check-installation-status', {
        body: { orderId }
      });
      if (error) throw error;
      return data;
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    enabled: !!orderId && order?.status === 'completed' && !!order?.iccid
  });

  const isInstalled = !!installationStatus?.installation?.device?.installTime;

  const customerName = profile 
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || null
    : null;

  const pkg = order?.esim_packages;
  const countryName = pkg?.country_name || 'eSIM';
  const rawProvider = pkg?.carrier || pkg?.name?.split(' ')[0] || 'Mobile11';
  const provider = (rawProvider.length > 50 && rawProvider.includes(':')) || 
    (Array.isArray(pkg?.included_countries) && pkg.included_countries.length > 1)
    ? 'Multi-carrier' : rawProvider;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2]">
        <AdminCustomerPreviewBanner 
          customerName={customerName}
          customerEmail={profile?.email || null}
        />
        <div className="flex items-center justify-center pt-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#FAF7F2]">
        <AdminCustomerPreviewBanner 
          customerName={customerName}
          customerEmail={profile?.email || null}
        />
        <div className="container mx-auto px-4 pt-24 pb-12 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">eSIM Not Found</h1>
          <Button onClick={() => navigate(`/admin/users/${userId}/preview/esims`)}>
            Back to eSIMs
          </Button>
        </div>
      </div>
    );
  }

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
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm">
              <Link 
                to={`/admin/users/${userId}/preview/esims`} 
                className="text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                My eSIMs
              </Link>
              <span className="text-gray-400">&gt;</span>
              <span className="text-gray-700 font-medium">{countryName}: {provider}</span>
            </nav>
            
            {/* Installation Status Banner */}
            {order.status === 'completed' && order.iccid && isInstalled && (
              <InstallationBanner isInstalled={true} />
            )}
            
            {/* KYC Verification Notice */}
            {pkg?.kyc && (
              <KycVerificationBanner carrier={pkg.carrier} />
            )}
            
            {/* Main eSIM Info Card */}
            <EsimDetailCard 
              order={order} 
              isInstalled={isInstalled} 
              autoRenewalEnabled={order.auto_renewal_enabled ?? false}
              activePackageOrderId={activePackageOrder?.id}
            />
            
            {/* Package History Accordion - Only show for installed eSIMs */}
            {isInstalled && order.iccid && (
              <div className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] overflow-hidden">
                <Accordion type="single" collapsible>
                  <AccordionItem value="history" className="border-0">
                    <AccordionTrigger className="px-6 py-4 text-gray-800 font-semibold hover:no-underline">
                      Package History
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4">
                      <PackageHistoryList iccid={order.iccid} />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}
            
            {/* Installation FAQs */}
            <InstallationFAQs />
          </div>
        </main>
      </div>
    </AdminPreviewProvider>
  );
}
