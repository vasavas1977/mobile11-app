import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  ArrowLeft, 
  Smartphone, 
  Apple,
  CheckCircle,
  Clock,
  XCircle,
  Zap,
  QrCode,
  Copy,
  Download,
  ExternalLink,
  MapPin,
  Database,
  Calendar,
  CreditCard,
  Settings,
  Link2,
  Phone,
  Activity,
  Mail,
  Loader2,
  HelpCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  Share2,
  BookOpen
} from 'lucide-react';
import { detectDevice, DeviceInfo } from '@/lib/deviceDetection';
import { createAppleEsimUrl } from '@/lib/installationHelpers';
import { InstallationStep } from './InstallationStep';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { getLocalizedDescription } from '@/lib/packageDescriptionUtils';

interface MobileOrderLayoutProps {
  order: any;
  profile?: any;
  onDownloadInvoice: () => void;
  onResendEmail: () => void;
  onCheckUsage: () => void;
  onCancelOrder: () => void;
  onExtendOrder: () => void;
  onRetryPayment: () => void;
  onOpenInstallGuide: () => void;
  resendingEmail: boolean;
  usageLoading: boolean;
  retryingPayment: boolean;
}

export function MobileOrderLayout({
  order,
  profile,
  onDownloadInvoice,
  onResendEmail,
  onCheckUsage,
  onCancelOrder,
  onExtendOrder,
  onRetryPayment,
  onOpenInstallGuide,
  resendingEmail,
  usageLoading,
  retryingPayment
}: MobileOrderLayoutProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [openAccordions, setOpenAccordions] = useState<string[]>([]);
  const [showDescription, setShowDescription] = useState(false);

  useEffect(() => {
    const info = detectDevice();
    setDeviceInfo(info);
    
    // Auto-expand relevant accordion based on device
    const defaultOpen: string[] = [];
    if (order.status === 'completed' && order.qr_code) {
      if (info.isIOS) {
        defaultOpen.push('iphone-install');
      } else if (info.isAndroid) {
        defaultOpen.push('android-install');
      } else {
        defaultOpen.push('iphone-install');
      }
    }
    setOpenAccordions(defaultOpen);
  }, [order]);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: t('orderDetail.copied'),
        description: t('orderDetail.copiedDescription').replace('{label}', label)
      });
    } catch (error) {
      toast({
        title: t('orderDetail.copyFailed'),
        description: t('orderDetail.copyFailedDescription'),
        variant: "destructive"
      });
    }
  };

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(order.qr_code!);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `esim-qr-code-${order.order_id}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: t('orderDetail.qrDownloaded'), description: t('orderDetail.qrDownloadedDescription') });
    } catch (error) {
      window.open(order.qr_code!, '_blank', 'noopener,noreferrer');
      toast({ title: t('orderDetail.openedInNewTab'), description: t('orderDetail.openedInNewTabDescription') });
    }
  };

  const getStatusConfig = (status: string) => {
    const config = {
      pending: { color: 'bg-yellow-500', icon: Clock, text: t('orderDetail.status.pending'), textColor: 'text-yellow-700' },
      processing: { color: 'bg-blue-500', icon: Clock, text: t('orderDetail.status.processing'), textColor: 'text-blue-700' },
      completed: { color: 'bg-green-500', icon: CheckCircle, text: t('orderDetail.status.completed'), textColor: 'text-green-700' },
      failed: { color: 'bg-red-500', icon: XCircle, text: t('orderDetail.status.failed'), textColor: 'text-red-700' },
      cancelled: { color: 'bg-red-500', icon: XCircle, text: t('orderDetail.status.cancelled'), textColor: 'text-red-700' },
      expired: { color: 'bg-muted', icon: Clock, text: t('orderDetail.status.expired'), textColor: 'text-muted-foreground' }
    };
    return config[status as keyof typeof config] || config.pending;
  };

  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;
  const appleEsimUrl = order.download_link ? createAppleEsimUrl(order.download_link) : '';
  const showInstallation = order.status === 'completed' && order.qr_code;

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-[#FAF7F2]/95 backdrop-blur border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/orders')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500 truncate">
                {t('orderDetail.orderId')} #{order.order_id}
              </p>
              <h1 className="font-semibold text-gray-900 truncate">{order.esim_packages?.name}</h1>
            </div>
            <Badge className={`${statusConfig.color} text-white shrink-0`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.text}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 space-y-4">
        {/* Hero Status Card */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-full ${statusConfig.color} flex items-center justify-center`}>
              <StatusIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-gray-900">{order.esim_packages?.name}</h2>
              <p className="text-sm text-gray-500">{order.esim_packages?.country_name}</p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-[#FAF7F2] rounded-lg">
              <Database className="h-4 w-4 mx-auto mb-1 text-orange-500" />
              <p className="text-xs font-medium text-gray-900">{order.esim_packages?.data_amount}</p>
            </div>
            <div className="text-center p-2 bg-[#FAF7F2] rounded-lg">
              <Calendar className="h-4 w-4 mx-auto mb-1 text-orange-500" />
              <p className="text-xs font-medium text-gray-900">{order.esim_packages?.validity_days} {t('orderDetail.days')}</p>
            </div>
            <div className="text-center p-2 bg-[#FAF7F2] rounded-lg">
              <CreditCard className="h-4 w-4 mx-auto mb-1 text-orange-500" />
              <p className="text-xs font-medium text-gray-900">{order.currency} {Number(order.total_amount).toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Device Detection Banner */}
        {showInstallation && deviceInfo && (
          <Alert className={`rounded-xl ${deviceInfo.isIOS ? 'border-blue-200 bg-blue-50' : deviceInfo.isAndroid ? 'border-green-200 bg-green-50' : 'bg-white border-gray-200'}`}>
            <Smartphone className={`h-4 w-4 ${deviceInfo.isIOS ? 'text-blue-600' : deviceInfo.isAndroid ? 'text-green-600' : ''}`} />
            <AlertDescription className={deviceInfo.isIOS ? 'text-blue-900' : deviceInfo.isAndroid ? 'text-green-900' : 'text-gray-900'}>
              {deviceInfo.isIOS ? (
                deviceInfo.supportsOneClick ? t('orderDetail.accordion.iosDetected17') : t('orderDetail.accordion.iosDetected')
              ) : deviceInfo.isAndroid ? (
                t('orderDetail.accordion.androidDetected')
              ) : (
                t('orderDetail.accordion.selectDevice')
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Status-based alerts */}
        {order.status === 'pending' && (
          <Alert className="border-yellow-200 bg-yellow-50 rounded-xl">
            <Clock className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-900">
              <strong>{t('orderDetail.paymentPending')}</strong>
              <p className="text-sm mt-1">{t('orderDetail.paymentPendingDescription')}</p>
            </AlertDescription>
          </Alert>
        )}

        {order.status === 'processing' && (
          <Alert className="border-blue-200 bg-blue-50 rounded-xl">
            <Clock className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <strong>{t('orderDetail.esimProvisioning')}</strong>
              <p className="text-sm mt-1">{t('orderDetail.esimProvisioningDescription')}</p>
            </AlertDescription>
          </Alert>
        )}

        {(order.status === 'failed' || order.status === 'cancelled') && (
          <Alert className="border-red-200 bg-red-50 rounded-xl">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-900">
              <strong>{order.status === 'cancelled' ? t('orderDetail.orderCancelled') : t('orderDetail.orderFailed')}</strong>
              <p className="text-sm mt-1">
                {order.status === 'cancelled' ? t('orderDetail.orderCancelledDescription') : t('orderDetail.orderFailedDescription')}
              </p>
            </AlertDescription>
          </Alert>
        )}



        {/* Primary CTA for pending orders */}
        {order.status === 'pending' && (
          <Button 
            className="w-full h-14 text-lg"
            onClick={onRetryPayment}
            disabled={retryingPayment}
          >
            {retryingPayment ? (
              <><Loader2 className="h-5 w-5 mr-2 animate-spin" />{t('orderDetail.redirecting')}</>
            ) : (
              <><CreditCard className="h-5 w-5 mr-2" />{t('orderDetail.completePayment')}</>
            )}
          </Button>
        )}

        {/* Main Accordion Sections */}
        <Accordion 
          type="multiple" 
          value={openAccordions}
          onValueChange={setOpenAccordions}
          className="space-y-2"
        >
          {/* iPhone Installation */}
          {showInstallation && (
            <AccordionItem value="iphone-install" className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <Apple className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">{t('orderDetail.accordion.iphoneTitle')}</h3>
                    <p className="text-xs text-gray-500">{t('orderDetail.accordion.iphoneSubtitle')}</p>
                  </div>
                  {deviceInfo?.isIOS && (
                    <Badge className="ml-auto mr-2 bg-blue-500 text-white text-xs">{t('orderDetail.accordion.recommended')}</Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  {/* 1-Click Install for iOS 17.4+ */}
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-900">{t('orderDetail.quickInstall')}</span>
                      <Badge variant="outline" className="text-xs">{t('orderDetail.accordion.fastest')}</Badge>
                    </div>
                    <p className="text-sm text-blue-700 mb-3">{t('orderDetail.quickInstallDescription')}</p>
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => window.open(appleEsimUrl, '_blank')}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      {t('orderDetail.installNow')}
                    </Button>
                    
                    {/* Share bar - for sharing to another device */}
                    {appleEsimUrl && (
                      <div className="flex items-center gap-3 p-2.5 mt-3 bg-white/50 rounded-lg border border-blue-200">
                        <Share2 className="h-4 w-4 text-blue-600 shrink-0" />
                        <span className="text-sm text-blue-700 flex-1 truncate">
                          {t('orderDetail.shareToDevice')}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 px-2 text-blue-700 hover:bg-blue-100 shrink-0"
                          onClick={() => copyToClipboard(appleEsimUrl, 'Install URL')}
                        >
                          <Copy className="h-3.5 w-3.5 mr-1" />
                          <span className="text-xs">{t('orderDetail.copy')}</span>
                        </Button>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* QR Code */}
                  <div className="text-center">
                    <h4 className="font-medium mb-3 flex items-center justify-center gap-2">
                      <QrCode className="h-4 w-4" />
                      {t('orderDetail.qrCodeInstallation')}
                    </h4>
                    <div className="bg-white p-4 rounded-lg inline-block shadow-sm border">
                      <img src={order.qr_code} alt="eSIM QR Code" className="w-32 h-32" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{t('orderDetail.scanWithCamera')}</p>
                    <div className="flex gap-2 mt-3 justify-center">
                      <Button variant="outline" size="sm" onClick={handleDownloadQR}>
                        <Download className="h-4 w-4 mr-1" />
                        {t('orderDetail.downloadQR')}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(order.download_link!, 'LPA Code')}>
                        <Copy className="h-4 w-4 mr-1" />
                        {t('orderDetail.copyCode')}
                      </Button>
                    </div>
                  </div>

                  {/* Manual Installation */}
                  {order.smdp_address && order.activation_code && (
                    <>
                      <Separator />
                      <div className="p-3 bg-[#FAF7F2] rounded-lg">
                        <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          {t('orderDetail.manualInstallationDetails')}
                        </h4>
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between bg-background p-2 rounded border">
                            <span className="text-muted-foreground">{t('orderDetail.smdpAddress')}</span>
                            <div className="flex items-center gap-1">
                              <span className="font-mono truncate max-w-32">{order.smdp_address}</span>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(order.smdp_address!, 'SM-DP+')}>
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between bg-background p-2 rounded border">
                            <span className="text-muted-foreground">{t('orderDetail.activationCode')}</span>
                            <div className="flex items-center gap-1">
                              <span className="font-mono truncate max-w-32">{order.activation_code}</span>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(order.activation_code!, 'Activation Code')}>
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Android Installation */}
          {showInstallation && (
            <AccordionItem value="android-install" className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                    <Smartphone className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">{t('orderDetail.accordion.androidTitle')}</h3>
                    <p className="text-xs text-gray-500">{t('orderDetail.accordion.androidSubtitle')}</p>
                  </div>
                  {deviceInfo?.isAndroid && (
                    <Badge className="ml-auto mr-2 bg-green-500 text-white text-xs">{t('orderDetail.accordion.recommended')}</Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  {/* QR Code */}
                   <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium mb-3 flex items-center justify-center gap-2 text-green-900">
                      <QrCode className="h-4 w-4" />
                      {t('orderDetail.accordion.scanQrAndroid')}
                    </h4>
                    <div className="bg-white p-4 rounded-lg inline-block shadow-sm border">
                      <img src={order.qr_code} alt="eSIM QR Code" className="w-32 h-32" />
                    </div>
                    <div className="flex gap-2 mt-3 justify-center">
                      <Button variant="outline" size="sm" onClick={handleDownloadQR}>
                        <Download className="h-4 w-4 mr-1" />
                        {t('orderDetail.downloadQR')}
                      </Button>
                    </div>
                  </div>

                  {/* Installation Steps */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">{t('orderDetail.accordion.androidSteps')}</h4>
                    <InstallationStep
                      stepNumber={1}
                      title={t('orderDetail.accordion.androidStep1Title')}
                      description={t('orderDetail.accordion.androidStep1Desc')}
                      icon={<Settings className="h-4 w-4" />}
                    />
                    <InstallationStep
                      stepNumber={2}
                      title={t('orderDetail.accordion.androidStep2Title')}
                      description={t('orderDetail.accordion.androidStep2Desc')}
                      icon={<QrCode className="h-4 w-4" />}
                    />
                    <InstallationStep
                      stepNumber={3}
                      title={t('orderDetail.accordion.androidStep3Title')}
                      description={t('orderDetail.accordion.androidStep3Desc')}
                      icon={<CheckCircle className="h-4 w-4" />}
                    />
                  </div>

                  {/* Device Tips */}
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{t('orderDetail.accordion.deviceTips')}</strong>
                      <ul className="text-xs mt-1 space-y-1 list-disc list-inside">
                        <li>Samsung: Settings → Connections → SIM Manager</li>
                        <li>Pixel: Settings → Network → SIMs → Add eSIM</li>
                        <li>OnePlus: Settings → Mobile Network → SIM</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          <AccordionItem value="package-details" className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-orange-500" />
                </div>
                <div className="text-left flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{t('orderDetail.accordion.packageDetails')}</h3>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                            <Info className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs text-xs">
                          {getLocalizedDescription({
                            packageType: order.esim_packages?.package_type || '',
                            dataAmount: order.esim_packages?.data_amount || '',
                            speedAfterLimit: order.esim_packages?.speed_after_limit,
                            qosSpeed: order.esim_packages?.qos_speed
                          }, t) || order.esim_packages?.description || t('orderDetail.noDescription')}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-xs text-gray-500">{order.esim_packages?.country_name} • {order.esim_packages?.data_amount}</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-3">
                {/* Package Description - Click to Expand */}
                <div className="p-3 bg-orange-50/50 rounded-lg border border-orange-100">
                  <button 
                    onClick={() => setShowDescription(!showDescription)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <span className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5" />
                      {t('orderDetail.planDescription')}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${showDescription ? 'rotate-180' : ''}`} />
                  </button>
                  {showDescription && (
                    <p className="text-sm mt-2 text-gray-900 leading-relaxed">
                      {getLocalizedDescription({
                        packageType: order.esim_packages?.package_type || '',
                        dataAmount: order.esim_packages?.data_amount || '',
                        speedAfterLimit: order.esim_packages?.speed_after_limit,
                        qosSpeed: order.esim_packages?.qos_speed
                      }, t) || order.esim_packages?.description || t('orderDetail.noDescription')}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#FAF7F2] rounded-lg">
                    <p className="text-xs text-gray-500">{t('orderDetail.destination')}</p>
                    <p className="font-medium text-gray-900">{order.esim_packages?.country_name}</p>
                  </div>
                  <div className="p-3 bg-[#FAF7F2] rounded-lg">
                    <p className="text-xs text-gray-500">{t('orderDetail.data')}</p>
                    <p className="font-medium text-gray-900">{order.esim_packages?.data_amount}</p>
                  </div>
                  <div className="p-3 bg-[#FAF7F2] rounded-lg">
                    <p className="text-xs text-gray-500">{t('orderDetail.validity')}</p>
                    <p className="font-medium text-gray-900">{order.esim_packages?.validity_days} {t('orderDetail.days')}</p>
                  </div>
                  <div className="p-3 bg-[#FAF7F2] rounded-lg">
                    <p className="text-xs text-gray-500">{t('orderDetail.total')}</p>
                    <p className="font-medium text-gray-900">{order.currency} {Number(order.total_amount).toFixed(2)}</p>
                  </div>
                </div>

                {order.iccid && (
                  <div className="p-3 bg-[#FAF7F2] rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">ICCID</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(order.iccid!, 'ICCID')}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="font-mono text-sm">{order.iccid}</p>
                  </div>
                )}

                {order.msisdn && (
                  <div className="p-3 bg-[#FAF7F2] rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {t('orderDetail.phoneNumber')}
                      </span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(order.msisdn!, 'Phone')}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="font-mono text-sm">{order.msisdn}</p>
                  </div>
                )}

                {order.expiry_date && (
                  <div className="p-3 bg-[#FAF7F2] rounded-lg">
                    <p className="text-xs text-gray-500">{t('orderDetail.expiryDate')}</p>
                    <p className="font-medium text-gray-900">{new Date(order.expiry_date).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Payment Information */}
          {order.payments && order.payments.length > 0 && (
            <AccordionItem value="payment-info" className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">{t('orderDetail.paymentDetails')}</h3>
                    <p className="text-xs text-gray-500">{order.currency} {Number(order.total_amount).toFixed(2)}</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3">
                  {order.payments.map((payment: any) => (
                    <div key={payment.id} className="p-3 bg-[#FAF7F2] rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">{t('orderDetail.paymentStatus')}</span>
                        <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                          {payment.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{t('orderDetail.amount')}</span>
                        <span className="font-medium">{payment.currency} {Number(payment.amount).toFixed(2)}</span>
                      </div>
                      {payment.payment_method && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">{t('orderDetail.method')}</span>
                          <span className="capitalize">{payment.payment_method}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{t('orderDetail.paymentDate')}</span>
                        <span>{new Date(payment.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Quick Actions */}
          <AccordionItem value="quick-actions" className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                  <Settings className="h-5 w-5 text-orange-500" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">{t('orderDetail.accordion.quickActionsTitle') || 'Quick Actions'}</h3>
                  <p className="text-xs text-gray-500">{t('orderDetail.accordion.quickActionsSubtitle') || 'Download, email, usage & support'}</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={onDownloadInvoice}>
                  <Download className="h-4 w-4 mr-2" />
                  {t('orderDetail.accordion.invoice') || 'Invoice'}
                </Button>
                
                {order.status === 'completed' && (
                  <Button variant="outline" onClick={onResendEmail} disabled={resendingEmail}>
                    {resendingEmail ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                    {t('orderDetail.accordion.email') || 'Email'}
                  </Button>
                )}
                
                {order.status === 'completed' && order.webhook_data && typeof order.webhook_data === 'object' && 'topupId' in order.webhook_data && (
                  <Button variant="outline" onClick={onCheckUsage} disabled={usageLoading}>
                    {usageLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Activity className="h-4 w-4 mr-2" />}
                    {t('orderDetail.checkUsage') || 'Usage'}
                  </Button>
                )}
                
                <Button variant="outline" onClick={() => navigate('/support')}>
                  <HelpCircle className="h-4 w-4 mr-2" />
                  {t('orderDetail.getSupport') || 'Support'}
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Troubleshooting */}
          {showInstallation && (
            <AccordionItem value="troubleshooting" className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                    <HelpCircle className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">{t('orderDetail.accordion.troubleshootingTitle')}</h3>
                    <p className="text-xs text-gray-500">{t('orderDetail.accordion.troubleshootingSubtitle')}</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3">
                  <Alert>
                    <AlertDescription>
                      <strong>{t('orderDetail.accordion.noInternet')}</strong>
                      <p className="text-sm mt-1">{t('orderDetail.accordion.noInternetDesc')}</p>
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <AlertDescription>
                      <strong>{t('orderDetail.accordion.qrNotWorking')}</strong>
                      <p className="text-sm mt-1">{t('orderDetail.accordion.qrNotWorkingDesc')}</p>
                    </AlertDescription>
                  </Alert>
                  <Button variant="outline" className="w-full" onClick={onOpenInstallGuide}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {t('orderDetail.accordion.fullGuide')}
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => navigate('/support')}>
                    <Phone className="h-4 w-4 mr-2" />
                    {t('orderDetail.contactSupport')}
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>

        {/* Extend Subscription Card */}
        {order.status === 'completed' && (
          <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <Link2 className="h-5 w-5 text-orange-500" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{t('orderDetail.extendSubscription')}</h3>
                <p className="text-xs text-gray-500">{t('orderDetail.extendSubscriptionDescription')}</p>
              </div>
              <Button size="sm" onClick={onExtendOrder}>
                {t('orderDetail.browsePackages')}
              </Button>
            </div>
          </div>
        )}

        {/* Cancel Order Option */}
        {(order.status === 'pending' || order.status === 'processing') && (
          <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{t('orderDetail.cancelOrder')}</h3>
                <p className="text-xs text-gray-500">
                  {order.esim_packages?.is_cancelable ? t('orderDetail.cancelOrderDescription') : t('orderDetail.nonRefundable')}
                </p>
              </div>
              {order.esim_packages?.is_cancelable ? (
                <Button variant="destructive" size="sm" onClick={onCancelOrder}>
                  {t('orderDetail.cancelOrderButton')}
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => navigate('/support')}>
                  {t('orderDetail.contactSupport')}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
