import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { QuickInstallTab } from './QuickInstallTab';
import { ManualInstallTab } from './ManualInstallTab';
import { AndroidInstallTab } from './AndroidInstallTab';
import { TroubleshootingTab } from './TroubleshootingTab';
import { detectDevice, getRecommendedTab } from '@/lib/deviceDetection';
import { Smartphone, Zap, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface InstallationGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrCode: string;
  downloadLink: string;
  orderId: string;
  smdpAddress?: string;
  activationCode?: string;
  onCopy: (text: string, label: string) => void;
}

export function InstallationGuide({
  open,
  onOpenChange,
  qrCode,
  downloadLink,
  orderId,
  smdpAddress,
  activationCode,
  onCopy
}: InstallationGuideProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>('quick-install');
  const [deviceInfo, setDeviceInfo] = useState(detectDevice());

  useEffect(() => {
    // Detect device and set recommended tab when dialog opens
    if (open) {
      const info = detectDevice();
      setDeviceInfo(info);
      setActiveTab(getRecommendedTab());
    }
  }, [open]);

  // Get device-specific banner
  const getDeviceBanner = () => {
    if (deviceInfo.supportsOneClick) {
      return (
        <Alert className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900 dark:text-green-100">
            <strong>{t('esim.installDialog.badges.recommended')}!</strong> {t('esim.installDialog.deviceBanner.supportsOneClick')}
          </AlertDescription>
        </Alert>
      );
    } else if (deviceInfo.isAndroid) {
      return (
        <Alert className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <Smartphone className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900 dark:text-blue-100">
            {t('esim.installDialog.deviceBanner.androidDetected')}
          </AlertDescription>
        </Alert>
      );
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Smartphone className="h-6 w-6 text-primary" />
            {t('esim.installDialog.title')}
          </DialogTitle>
          <DialogDescription>
            {t('esim.installDialog.subtitle')}
          </DialogDescription>
        </DialogHeader>

        {/* Device Detection Banner */}
        {getDeviceBanner()}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="quick-install" className="relative">
              <Zap className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">{t('esim.installDialog.tabs.quickInstall')}</span>
              <span className="sm:hidden">{t('esim.installDialog.tabs.quick')}</span>
              {deviceInfo.supportsOneClick && (
                <Badge className="absolute -top-2 -right-2 h-5 px-1.5 text-[10px] bg-green-500">
                  {t('esim.installDialog.badges.best')}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="manual-ios">
              <Smartphone className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">{t('esim.installDialog.tabs.manualIos')}</span>
              <span className="sm:hidden">{t('esim.installDialog.tabs.ios')}</span>
            </TabsTrigger>
            <TabsTrigger value="android">
              <Smartphone className="h-4 w-4 mr-1" />
              {t('esim.installDialog.tabs.android')}
            </TabsTrigger>
            <TabsTrigger value="troubleshooting">
              <span className="hidden sm:inline">{t('esim.installDialog.tabs.help')}</span>
              <span className="sm:hidden">?</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto pr-2">
            <TabsContent value="quick-install" className="mt-0">
              <QuickInstallTab downloadLink={downloadLink} />
            </TabsContent>

            <TabsContent value="manual-ios" className="mt-0">
              <ManualInstallTab
                qrCode={qrCode}
                downloadLink={downloadLink}
                orderId={orderId}
                smdpAddress={smdpAddress}
                activationCode={activationCode}
                onCopy={onCopy}
              />
            </TabsContent>

            <TabsContent value="android" className="mt-0">
              <AndroidInstallTab
                qrCode={qrCode}
                downloadLink={downloadLink}
                orderId={orderId}
                onCopy={onCopy}
              />
            </TabsContent>

            <TabsContent value="troubleshooting" className="mt-0">
              <TroubleshootingTab
                smdpAddress={smdpAddress}
                activationCode={activationCode}
                onCopy={onCopy}
              />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
