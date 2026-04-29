import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { FooterAiralo } from '@/components/landing/FooterAiralo';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useParams, Link, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { DecorationShapes } from '@/components/my-esims/DecorationShapes';
import { EsimDetailCard } from '@/components/my-esims/EsimDetailCard';
import { QuickActionsRow } from '@/components/my-esims/QuickActionsRow';
import { InstallationBanner } from '@/components/my-esims/InstallationBanner';
import { ReadyToUseSection } from '@/components/my-esims/ReadyToUseSection';
import { InstallationFAQs } from '@/components/my-esims/InstallationFAQs';
import { StickyEsimActionBar } from '@/components/my-esims/StickyEsimActionBar';
import { PackageHistoryList, computePackageStatuses } from '@/components/my-esims/PackageHistoryList';
import { InstallEsimDialog } from '@/components/my-esims/InstallEsimDialog';
import { KycVerificationBanner } from '@/components/my-esims/KycVerificationBanner';
import { isEsimExpired } from '@/utils/esimValidity';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function MyEsimDetailPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useLanguage();
  const [installDialogOpen, setInstallDialogOpen] = useState(false);

  // Redirect to auth page if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { state: { from: `/my-esims/${orderId}` } });
    }
  }, [loading, user, navigate, orderId]);

  const { data: order, isLoading } = useQuery({
    queryKey: ['esim-detail', orderId],
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
            is_local_sim,
            esim_providers:provider_id (
              provider_code
            )
          )
        `)
        .eq('id', orderId!)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!orderId
  });

  // Fetch all packages for this ICCID to find the currently active one
  const { data: allPackagesForIccid } = useQuery({
    queryKey: ['esim-all-packages', order?.iccid],
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

  // Find the currently active package using FIFO chain logic with exhausted detection
  const activePackageOrder = useMemo(() => {
    if (!allPackagesForIccid || allPackagesForIccid.length === 0) return null;
    
    // Use the same FIFO logic as PackageHistoryList
    const statusMap = computePackageStatuses(allPackagesForIccid as any);
    
    for (const pkg of allPackagesForIccid) {
      if (statusMap.get(pkg.id) === 'active') {
        return pkg;
      }
    }
    
    return null;
  }, [allPackagesForIccid]);

  // Check actual installation status from USIMSA API (with aggressive caching to reduce API calls)
  const { data: installationStatus } = useQuery({
    queryKey: ['installation-status', orderId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('check-installation-status', {
        body: { orderId }
      });
      if (error) throw error;
      return data;
    },
    staleTime: 30 * 60 * 1000,      // 30 minutes - installation status rarely changes
    gcTime: 60 * 60 * 1000,         // Keep in cache for 1 hour
    refetchOnWindowFocus: false,    // Don't refetch on tab focus
    refetchOnMount: false,          // Don't refetch on component mount
    refetchOnReconnect: false,      // Don't refetch on network reconnect
    enabled: !!user && !!orderId && order?.status === 'completed' && !!order?.iccid
  });

  const isInstalled = !!installationStatus?.installation?.device?.installTime;

  // Calculate if eSIM is expired based on cached usage data
  const expired = useMemo(() => {
    const usage = order?.cached_usage as { validUntil?: string | null } | null;
    if (usage?.validUntil) {
      return isEsimExpired(usage.validUntil);
    }
    return false;
  }, [order?.cached_usage]);

  // Check if this is a top-up/extension order
  const isTopUp = useMemo(() => {
    if (!order) return false;
    const webhook = order.webhook_data && typeof order.webhook_data === 'object' 
      ? (order.webhook_data as Record<string, unknown>) : null;
    return (
      (webhook?.isExtension === true) ||
      (typeof order.order_id === 'string' && order.order_id.startsWith('EXT-'))
    );
  }, [order]);

  // Check for install query param to auto-open install dialog
  useEffect(() => {
    if (searchParams.get('install') === 'true' && order && !isTopUp) {
      setInstallDialogOpen(true);
      // Remove the query param after opening
      searchParams.delete('install');
      setSearchParams(searchParams, { replace: true });
    }
  }, [order, searchParams, isTopUp, setSearchParams]);
  if (loading || isLoading) {
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

  // Handle order not found
  if (!order) {
    return (
      <div className="min-h-screen bg-[#FAF7F2]">
        <Header />
        <div className="container mx-auto px-4 pt-44 pb-12 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">{t('myEsims.notFound')}</h1>
          <Button onClick={() => navigate('/my-esims')}>
            {t('myEsims.backToList')}
          </Button>
        </div>
        <FooterAiralo />
      </div>
    );
  }

  const pkg = order.esim_packages;
  const countryName = pkg?.country_name || 'eSIM';
  const rawProvider = pkg?.carrier || pkg?.name?.split(' ')[0] || 'Mobile11';
  const provider = (rawProvider.length > 50 && rawProvider.includes(':')) || 
    (Array.isArray(pkg?.included_countries) && pkg.included_countries.length > 1)
    ? 'Multi-carrier' : rawProvider;
  const isLocalSim = pkg?.is_local_sim === true;
  
  // Check if this is a TUGE/DOCOMO eSIM (no top-up/auto-renewal support)
  const isTuge = pkg?.carrier === 'DOCOMO';

  return (
    <div className="min-h-screen bg-[#FAF7F2] relative">
      <Header />
      
      {/* Decorative background shapes */}
      <DecorationShapes />
      
      <main className="container mx-auto px-4 pt-44 md:pt-48 pb-24 md:pb-12 relative z-10">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm">
            <Link 
              to="/my-esims" 
              className="text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              {t('myEsims.title')}
            </Link>
            <span className="text-gray-400">&gt;</span>
            <span className="text-gray-700 font-medium">{countryName}: {provider}</span>
          </nav>
          
          {/* Installation Status Banner - Only show when actually installed */}
          {order.status === 'completed' && order.iccid && isInstalled && (
            <InstallationBanner isInstalled={true} />
          )}
          
          {/* KYC Verification Notice - Show for packages requiring KYC */}
          {pkg?.kyc && (
            <KycVerificationBanner carrier={pkg.carrier} />
          )}
          
          {/* Main eSIM Info Card - Pass activePackageOrderId to display correct usage */}
          <EsimDetailCard 
            order={order} 
            isInstalled={isInstalled} 
            autoRenewalEnabled={order.auto_renewal_enabled ?? false}
            activePackageOrderId={activePackageOrder?.id}
          />
          
          {/* Ready to Use Section - Only show for uninstalled eSIMs, hide for top-ups */}
          {!isInstalled && !isTopUp && (
            <ReadyToUseSection order={order} />
          )}
          
          {/* Quick Actions Row - hide for top-ups, local SIMs, and TUGE eSIMs */}
          {!isTopUp && !isLocalSim && !isTuge && (
            <QuickActionsRow order={order} isInstalled={isInstalled} />
          )}
          
          {/* Package History Accordion - Only show for installed eSIMs */}
          {isInstalled && (
            <div className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] overflow-hidden">
              <Accordion type="single" collapsible>
                <AccordionItem value="history" className="border-0">
                  <AccordionTrigger className="px-6 py-4 text-gray-800 font-semibold hover:no-underline">
                    {t('myEsims.packageHistory')}
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    <PackageHistoryList iccid={order.iccid} />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}
          
          {/* Ready to Use Accordion */}
          <div className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] overflow-hidden">
            <Accordion type="single" collapsible>
              <AccordionItem value="ready" className="border-0">
                <AccordionTrigger className="px-6 py-4 text-gray-800 font-semibold hover:no-underline">
                  {t('myEsims.readyToUse')}
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <div className="text-gray-600 text-sm space-y-2">
                    <p>{t('myEsims.readyToUseStep1')}</p>
                    <p>{t('myEsims.readyToUseStep2')}</p>
                    <p>{t('myEsims.readyToUseStep3')}</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
          
          {/* Installation FAQs */}
          <InstallationFAQs />
        </div>
      </main>
      
      <FooterAiralo />
      
      {/* Sticky Action Bar - mobile only, hide for top-ups, local SIMs, and TUGE */}
      {!isTopUp && !isLocalSim && !isTuge && (
        <StickyEsimActionBar 
          order={order} 
          isInstalled={isInstalled} 
          autoRenewalEnabled={order.auto_renewal_enabled ?? false}
          expired={expired}
        />
      )}
      
      {/* Install eSIM Dialog - triggered by ?install=true query param */}
      <InstallEsimDialog
        open={installDialogOpen}
        onOpenChange={setInstallDialogOpen}
        order={order}
      />
    </div>
  );
}
