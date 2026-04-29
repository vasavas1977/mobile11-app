import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { FooterAiralo } from '@/components/landing/FooterAiralo';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';
import { ArrowLeft, Loader2, Globe } from 'lucide-react';
import { InstallationGuide } from '@/components/esim/InstallationGuide';
import { MobileOrderLayout } from '@/components/esim/MobileOrderLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

// Helper to format date in destination timezone
const formatInDestinationTimezone = (dateString: string, timezone: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const zonedDate = toZonedTime(date, timezone);
    return format(zonedDate, 'MMM d, yyyy h:mm a');
  } catch {
    return new Date(dateString).toLocaleString();
  }
};

// Get short timezone label from timezone string
const getTimezoneLabel = (timezone: string, country?: string | null): string => {
  const timezoneLabels: Record<string, string> = {
    'Asia/Bangkok': 'Thailand',
    'Asia/Tokyo': 'Japan',
    'Asia/Seoul': 'Korea',
    'Asia/Singapore': 'Singapore',
    'Asia/Kuala_Lumpur': 'Malaysia',
    'Asia/Jakarta': 'Indonesia',
    'Asia/Taipei': 'Taiwan',
    'Asia/Hong_Kong': 'Hong Kong',
    'Asia/Shanghai': 'China',
    'Asia/Ho_Chi_Minh': 'Vietnam',
    'Asia/Manila': 'Philippines',
    'Asia/Kolkata': 'India',
    'Australia/Sydney': 'Sydney',
    'Australia/Brisbane': 'Brisbane',
    'Australia/Adelaide': 'Adelaide',
    'Australia/Perth': 'Perth',
    'Pacific/Auckland': 'New Zealand',
    'America/New_York': 'US Eastern',
    'America/Chicago': 'US Central',
    'America/Denver': 'US Mountain',
    'America/Los_Angeles': 'US Pacific',
    'America/Anchorage': 'US Alaska',
    'Pacific/Honolulu': 'US Hawaii',
    'America/Toronto': 'Canada Eastern',
    'America/Winnipeg': 'Canada Central',
    'America/Edmonton': 'Canada Mountain',
    'America/Vancouver': 'Canada Pacific',
    'Europe/London': 'UK',
    'Europe/Paris': 'France',
    'Europe/Berlin': 'Germany',
    'Europe/Rome': 'Italy',
    'Europe/Madrid': 'Spain',
    'UTC': 'UTC',
  };
  
  if (country && country.toLowerCase().includes('global')) return 'UTC';
  return timezoneLabels[timezone] || timezone.split('/').pop()?.replace('_', ' ') || 'Local';
};

// Get stored timezone preference from localStorage
const getStoredTimezone = (country: string): string | null => {
  try {
    const stored = localStorage.getItem('esim_timezone_preferences');
    if (stored) {
      const prefs = JSON.parse(stored);
      return prefs[country] || null;
    }
  } catch {
    // Ignore errors
  }
  return null;
};

// Store timezone preference in localStorage
const storeTimezonePreference = (country: string, timezone: string): void => {
  try {
    const stored = localStorage.getItem('esim_timezone_preferences');
    const prefs = stored ? JSON.parse(stored) : {};
    prefs[country] = timezone;
    localStorage.setItem('esim_timezone_preferences', JSON.stringify(prefs));
  } catch {
    // Ignore errors
  }
};

export function OrderDetailPage() {
  const { orderId } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [usageDialogOpen, setUsageDialogOpen] = useState(false);
  const [usageData, setUsageData] = useState<any>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState<string | null>(null);
  const [installGuideOpen, setInstallGuideOpen] = useState(false);
  const [retryingPayment, setRetryingPayment] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      console.log('Fetching order details with param:', orderId);
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId || '');

      let baseOrderQuery = supabase.from('orders').select('*');
      const orderFilterColumn = isUuid ? 'id' : 'order_id';
      // @ts-expect-error chained builder typing
      baseOrderQuery = baseOrderQuery.eq(orderFilterColumn as any, orderId as string);
      const { data: orderData, error: orderError } = await baseOrderQuery.maybeSingle();

      if (orderError) throw orderError;
      if (!orderData) return null;

      const { data: packageData, error: packageError } = await supabase
        .from('esim_packages')
        .select('name, country_name, country_code, data_amount, validity_days, description, is_cancelable, package_type')
        .eq('id', orderData.package_id)
        .maybeSingle();

      if (packageError) throw packageError;

      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('order_id', orderData.id);

      if (paymentsError) throw paymentsError;

      let parentOrderData = null;
      const webhook = orderData.webhook_data && typeof orderData.webhook_data === 'object' ? (orderData.webhook_data as any) : null;
      const parentId = orderData.parent_order_id || webhook?.originalOrderId || null;
      
      if (parentId) {
        const { data: parent } = await supabase
          .from('orders')
          .select('id, order_id, esim_packages:package_id(name, country_name), created_at')
          .eq('order_id', parentId)
          .maybeSingle();
        parentOrderData = parent;
      }

      const { data: childOrders } = await supabase
        .from('orders')
        .select('id, order_id, esim_packages:package_id(name), created_at, status')
        .eq('parent_order_id', orderData.order_id)
        .order('created_at', { ascending: false });

      return {
        ...orderData,
        esim_packages: packageData || null,
        payments: paymentsData || [],
        parent_order: parentOrderData,
        child_orders: childOrders || []
      };
    },
    enabled: !!user && !!orderId,
    retry: false
  });

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Move useCallback before any early returns to follow React hooks rules
  const fetchUsageData = useCallback(async (preferredTz?: string | null) => {
    if (!order) return;
    
    setUsageLoading(true);
    
    try {
      const topupId = order.webhook_data && typeof order.webhook_data === 'object' && 'topupId' in order.webhook_data 
        ? String((order.webhook_data as any).topupId) 
        : undefined;

      const { data, error } = await supabase.functions.invoke('check-esim-usage', {
        body: { 
          orderId: order.id,
          ...(topupId && { topupId }),
          ...(preferredTz && { preferredTimezone: preferredTz })
        }
      });

      if (error) throw error;

      if (data && !data.success) {
        throw new Error(data.message || 'Failed to check usage');
      }

      setUsageData(data.usage);
      
      // Set selected timezone from response or stored preference
      if (data.usage?.availableTimezones) {
        const storedTz = getStoredTimezone(data.usage.destinationCountry);
        if (storedTz && data.usage.availableTimezones[storedTz]) {
          setSelectedTimezone(storedTz);
        } else {
          setSelectedTimezone(data.usage.destinationTimezone);
        }
      }
    } catch (error) {
      console.error('Check usage error:', error);
      toast({
        title: t('orderDetail.usageCheckFailed'),
        description: error instanceof Error ? error.message : t('orderDetail.usageCheckFailedDescription'),
        variant: "destructive"
      });
      setUsageDialogOpen(false);
    } finally {
      setUsageLoading(false);
    }
  }, [order, toast, t]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2]">
        <Header />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAF7F2]">
        <Header />
        <main className="container mx-auto px-4 pt-24">
          <div className="max-w-md mx-auto text-center py-12">
            <h1 className="text-2xl font-bold mb-4 text-gray-900">{t('orderDetail.signInRequired')}</h1>
            <p className="text-gray-500 mb-6">{t('orderDetail.signInDescription')}</p>
            <Button 
              onClick={() => {
                sessionStorage.setItem('post_auth_next', window.location.pathname + window.location.search);
                window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { tab: 'signin' } }));
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('orderDetail.goToSignIn')}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2]">
        <Header />
        <main className="container mx-auto px-4 pt-24">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        </main>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#FAF7F2]">
        <Header />
        <main className="container mx-auto px-4 pt-24">
          <div className="max-w-md mx-auto text-center py-12">
            <h1 className="text-2xl font-bold mb-4 text-gray-900">{t('orderDetail.notFound')}</h1>
            <p className="text-gray-500 mb-6">{t('orderDetail.notFoundDescription')}</p>
            <Button onClick={() => navigate('/orders')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('orderDetail.backToOrders')}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const handleCancelOrder = async () => {
    if (!window.confirm(t('orderDetail.cancelConfirm'))) return;

    try {
      const { data, error } = await supabase.functions.invoke('cancel-order', {
        body: { orderId: order.id }
      });

      if (error) throw error;

      toast({
        title: t('orderDetail.cancelSuccess'),
        description: t('orderDetail.cancelSuccessDescription')
      });

      window.location.reload();
    } catch (error) {
      console.error('Cancel order error:', error);
      toast({
        title: t('orderDetail.cancelFailed'),
        description: error instanceof Error ? error.message : t('orderDetail.cancelFailedDescription'),
        variant: "destructive"
      });
    }
  };

  const handleExtendOrder = () => {
    navigate(`/packages?extend=${order.id}`);
  };

  const handleRetryPayment = async () => {
    setRetryingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke('retry-payment', {
        body: { orderId: order.id, language }
      });

      if (error) throw error;

      if (data?.checkoutUrl) {
        const { safeRedirectToPayment } = await import('@/lib/paymentRedirect');
        safeRedirectToPayment(data.checkoutUrl);
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Retry payment error:', error);
      toast({
        title: t('orders.paymentRetryFailed') || 'Payment retry failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setRetryingPayment(false);
    }
  };

  const handleCheckUsage = async () => {
    setUsageDialogOpen(true);
    
    // Check for stored preference for this country
    const countryName = order.esim_packages?.country_name;
    const storedTz = countryName ? getStoredTimezone(countryName) : null;
    
    await fetchUsageData(storedTz);
  };

  const handleTimezoneChange = async (newTimezone: string) => {
    setSelectedTimezone(newTimezone);
    
    // Store the preference
    if (usageData?.destinationCountry) {
      storeTimezonePreference(usageData.destinationCountry, newTimezone);
    }
    
    // Re-fetch with new timezone
    await fetchUsageData(newTimezone);
  };

  const handleResendConfirmationEmail = async () => {
    setResendingEmail(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-order-confirmation', {
        body: { 
          orderId: order.id,
          language: order.language || 'en'
        }
      });

      if (error) throw error;

      if (data && !data.success) {
        throw new Error(data.message || 'Failed to send email');
      }

      toast({
        title: t('orderDetail.emailSent'),
        description: t('orderDetail.emailSentDescription')
      });
    } catch (error) {
      console.error('Resend email error:', error);
      toast({
        title: t('orderDetail.emailFailed'),
        description: error instanceof Error ? error.message : t('orderDetail.emailFailedDescription'),
        variant: "destructive"
      });
    } finally {
      setResendingEmail(false);
    }
  };

  const handleDownloadInvoice = () => {
    if (!order) return;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const packageDetails = order.esim_packages;
    const payments = order.payments;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    const brandColor: [number, number, number] = [59, 130, 246];
    const lightGray: [number, number, number] = [243, 244, 246];
    const darkGray: [number, number, number] = [55, 65, 81];
    
    doc.setFillColor(...brandColor);
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('1-TO-ALL Co., Ltd.', margin, 22);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Professional eSIM Services Provider', margin, 30);
    doc.text('Global Connectivity Solutions', margin, 36);
    
    doc.setTextColor(...darkGray);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth - margin, 30, { align: 'right' });
    
    let yPos = 60;
    doc.setFillColor(...lightGray);
    doc.roundedRect(pageWidth - 80, yPos, 60, 35, 2, 2, 'F');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkGray);
    doc.text('INVOICE #', pageWidth - 75, yPos + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(order.order_id, pageWidth - 75, yPos + 14);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('DATE', pageWidth - 75, yPos + 22);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const invoiceDate = new Date(order.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    doc.text(invoiceDate, pageWidth - 75, yPos + 28);
    
    yPos = 105;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...brandColor);
    doc.text('BILL TO', margin, yPos);
    
    yPos += 8;
    doc.setTextColor(...darkGray);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    if (profile) {
      const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Customer';
      doc.text(fullName, margin, yPos);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      if (profile.email) {
        yPos += 6;
        doc.text(profile.email, margin, yPos);
      }
      if (profile.phone) {
        yPos += 6;
        doc.text(profile.phone, margin, yPos);
      }
    }
    
    const statusY = 105;
    const statusText = order.status.toUpperCase();
    const statusWidth = doc.getTextWidth(statusText) + 12;
    const statusX = pageWidth - margin - statusWidth;
    
    if (order.status === 'completed') {
      doc.setFillColor(34, 197, 94);
    } else if (order.status === 'pending') {
      doc.setFillColor(251, 191, 36);
    } else {
      doc.setFillColor(239, 68, 68);
    }
    doc.roundedRect(statusX, statusY - 5, statusWidth, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(statusText, statusX + 6, statusY + 1);
    
    yPos = 140;
    doc.setTextColor(...darkGray);
    
    doc.setFillColor(...brandColor);
    doc.rect(margin, yPos, contentWidth, 10, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('DESCRIPTION', margin + 3, yPos + 7);
    doc.text('DETAILS', margin + 90, yPos + 7);
    doc.text('AMOUNT', pageWidth - margin - 3, yPos + 7, { align: 'right' });
    
    yPos += 10;
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, yPos, contentWidth, 35, 'F');
    doc.setDrawColor(220, 220, 220);
    doc.rect(margin, yPos, contentWidth, 35, 'S');
    
    yPos += 8;
    doc.setTextColor(...darkGray);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    
    if (packageDetails) {
      doc.text(packageDetails.name, margin + 3, yPos);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      yPos += 5;
      doc.text(`Destination: ${packageDetails.country_name}`, margin + 3, yPos);
      
      doc.setFont('helvetica', 'normal');
      doc.text(`${packageDetails.data_amount}`, margin + 90, yPos - 5);
      doc.text(`${packageDetails.validity_days} days validity`, margin + 90, yPos);
    }
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    const originalPrice = order.original_amount || order.total_amount;
    doc.text(`${order.currency} ${originalPrice.toFixed(2)}`, pageWidth - margin - 3, yPos - 5, { align: 'right' });
    
    yPos = 185;
    const summaryX = pageWidth - 80;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkGray);
    
    if (order.original_amount && order.original_amount > order.total_amount) {
      doc.text('Subtotal:', summaryX, yPos);
      doc.text(`${order.currency} ${order.original_amount.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
      
      yPos += 7;
      doc.setTextColor(220, 38, 38);
      doc.text('Discount:', summaryX, yPos);
      doc.text(`-${order.currency} ${(order.discount_amount || 0).toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 7;
    }
    
    doc.setFillColor(...lightGray);
    doc.roundedRect(summaryX - 5, yPos - 5, 75, 12, 2, 2, 'F');
    
    doc.setTextColor(...darkGray);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', summaryX, yPos + 3);
    doc.setTextColor(...brandColor);
    doc.setFontSize(14);
    doc.text(`${order.currency} ${order.total_amount.toFixed(2)}`, pageWidth - margin, yPos + 3, { align: 'right' });
    
    if (payments && payments.length > 0) {
      yPos += 25;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...brandColor);
      doc.text('PAYMENT INFORMATION', margin, yPos);
      
      yPos += 8;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...darkGray);
      
      payments.forEach((payment: any) => {
        doc.text(`Payment Method: ${payment.payment_method?.toUpperCase() || 'N/A'}`, margin, yPos);
        yPos += 6;
        doc.text(`Payment Status: ${payment.status?.toUpperCase() || 'N/A'}`, margin, yPos);
        yPos += 6;
        doc.text(`Payment Date: ${new Date(payment.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`, margin, yPos);
        yPos += 6;
      });
    }
    
    const footerY = pageHeight - 30;
    doc.setDrawColor(...brandColor);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY, pageWidth - margin, footerY);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text('Thank you for your business!', pageWidth / 2, footerY + 8, { align: 'center' });
    doc.text('1-TO-ALL Co., Ltd. | Professional eSIM Services', pageWidth / 2, footerY + 13, { align: 'center' });
    doc.text('For support inquiries, please visit our website or contact customer service.', pageWidth / 2, footerY + 18, { align: 'center' });
    
    doc.save(`Invoice-${order.order_id}.pdf`);
    
    toast({
      title: t('orderDetail.invoiceDownloaded'),
      description: t('orderDetail.invoiceDownloadedDescription')
    });
  };

  return (
    <>
      <Header />
      <main className="pt-16">
        <MobileOrderLayout
          order={order}
          profile={profile}
          onDownloadInvoice={handleDownloadInvoice}
          onResendEmail={handleResendConfirmationEmail}
          onCheckUsage={handleCheckUsage}
          onCancelOrder={handleCancelOrder}
          onExtendOrder={handleExtendOrder}
          onRetryPayment={handleRetryPayment}
          onOpenInstallGuide={() => setInstallGuideOpen(true)}
          resendingEmail={resendingEmail}
          usageLoading={usageLoading}
          retryingPayment={retryingPayment}
        />
      </main>
      <FooterAiralo />

      {/* Installation Guide Dialog */}
      <InstallationGuide
        open={installGuideOpen}
        onOpenChange={setInstallGuideOpen}
        qrCode={order.qr_code || ''}
        downloadLink={order.download_link || ''}
        orderId={order.order_id}
        smdpAddress={order.smdp_address}
        activationCode={order.activation_code}
        onCopy={(text, label) => {
          navigator.clipboard.writeText(text);
          toast({
            title: t('orderDetail.copied'),
            description: t('orderDetail.copiedDescription').replace('{label}', label)
          });
        }}
      />

      {/* Usage Dialog */}
      <Dialog open={usageDialogOpen} onOpenChange={setUsageDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('orderDetail.usageDialog.title')}</DialogTitle>
            <DialogDescription>{t('orderDetail.usageDialog.description')}</DialogDescription>
          </DialogHeader>
          {usageLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2">{t('orderDetail.usageDialog.loading')}</span>
            </div>
          ) : usageData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">{t('orderDetail.usageDialog.dataUsed')}</p>
                  <p className="font-semibold">{usageData.dataUsed || '0 MB'}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">{t('orderDetail.usageDialog.remainingData')}</p>
                  <p className="font-semibold">{usageData.remainingData || t('orderDetail.usageDialog.unlimited')}</p>
                </div>
              </div>
              
              {/* Timezone selector for multi-timezone countries */}
              {usageData.availableTimezones && Object.keys(usageData.availableTimezones).length > 1 && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Display timezone</p>
                  </div>
                  <Select 
                    value={selectedTimezone || usageData.destinationTimezone} 
                    onValueChange={handleTimezoneChange}
                    disabled={usageLoading}
                  >
                    <SelectTrigger className="w-full h-9">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(usageData.availableTimezones as Record<string, string>).map(([tz, label]) => (
                        <SelectItem key={tz} value={tz}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {usageData.validFrom && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">{t('orderDetail.usageDialog.validFrom')}</p>
                  <p className="font-semibold">
                    {formatInDestinationTimezone(usageData.validFrom, selectedTimezone || usageData.destinationTimezone || 'UTC')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ({getTimezoneLabel(selectedTimezone || usageData.destinationTimezone || 'UTC', usageData.destinationCountry)} Time)
                  </p>
                </div>
              )}
              {usageData.validUntil && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">{t('orderDetail.usageDialog.validUntil')}</p>
                  <p className="font-semibold">
                    {formatInDestinationTimezone(usageData.validUntil, selectedTimezone || usageData.destinationTimezone || 'UTC')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ({getTimezoneLabel(selectedTimezone || usageData.destinationTimezone || 'UTC', usageData.destinationCountry)} Time)
                  </p>
                </div>
              )}
              {usageData.status && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">{t('orderDetail.usageDialog.status')}</p>
                  <p className="font-semibold capitalize">{usageData.status}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center py-4 text-muted-foreground">{t('orderDetail.usageDialog.noData')}</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
