import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { InstallEsimDialog } from './InstallEsimDialog';

interface CachedUsage {
  validFrom?: string | null;
  validUntil?: string | null;
  notYetActivated?: boolean;
}

interface StickyEsimActionBarProps {
  order: {
    id: string;
    order_id: string;
    status: string;
    iccid?: string;
    qr_code?: string;
    smdp_address?: string;
    activation_code?: string;
    download_link?: string;
    cached_usage?: CachedUsage | unknown;
    auto_renewal_enabled?: boolean;
    esim_packages?: {
      name: string;
      country_name: string;
      country_code: string;
      data_amount: string;
      validity_days: number;
      carrier?: string;
      package_type?: string;
        qos_speed?: string;
        speed_after_limit?: string;
        is_local_sim?: boolean;
      };
    };
  isInstalled: boolean;
  autoRenewalEnabled: boolean;
  expired: boolean;
}

export function StickyEsimActionBar({ 
  order, 
  isInstalled, 
  autoRenewalEnabled, 
  expired 
}: StickyEsimActionBarProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [installDialogOpen, setInstallDialogOpen] = useState(false);
  const pkg = order.esim_packages;
  const isLocalSim = pkg?.is_local_sim === true;

  // Check if TUGE/DOCOMO (no top-up support)
  const isTuge = pkg?.carrier === 'DOCOMO';
  
  // Determine which button to show
  const showInstallButton = !isInstalled;
  const showTopUpButton = isInstalled && !expired && !autoRenewalEnabled && !isLocalSim && !isTuge;

  // Don't render if no button should be shown
  if (!showInstallButton && !showTopUpButton) {
    return null;
  }

  const handleTopUp = () => {
    const params = new URLSearchParams();
    params.set('country', pkg?.country_name || '');
    params.set('extend', order.id);
    params.set('type', pkg?.package_type || '');
    
    // Only pass speed for day_pass to lock the backup speed option
    if (pkg?.package_type === 'day_pass') {
      params.set('speed', (pkg as any)?.speed_after_limit || '');
    }
    
    navigate(`/packages?${params.toString()}`);
  };

  return (
    <>
      {/* Sticky bottom bar - mobile only */}
      <div 
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 md:hidden"
        style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
      >
        {showInstallButton && (
          <Button 
            onClick={() => setInstallDialogOpen(true)}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl h-12"
          >
            {t('myEsims.stickyInstallButton')}
          </Button>
        )}
        
        {showTopUpButton && (
          <Button 
            onClick={handleTopUp}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl h-12"
          >
            {t('myEsims.stickyTopUpButton')}
          </Button>
        )}
      </div>

      {/* Sticky bottom bar - desktop/tablet */}
      <div 
        className="hidden md:block fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm z-50"
        style={{ paddingBottom: '24px' }}
      >
        <div className="flex justify-end px-6 lg:px-24">
          {showInstallButton && (
            <Button 
              onClick={() => setInstallDialogOpen(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-full shadow-lg h-12 mr-16"
            >
              {t('myEsims.stickyInstallButton')}
            </Button>
          )}
          
          {showTopUpButton && (
            <Button 
              onClick={handleTopUp}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-full shadow-lg h-12 mr-16"
            >
              {t('myEsims.stickyTopUpButton')}
            </Button>
          )}
        </div>
      </div>

      {/* Install eSIM Dialog */}
      <InstallEsimDialog
        open={installDialogOpen}
        onOpenChange={setInstallDialogOpen}
        order={order}
      />
    </>
  );
}
