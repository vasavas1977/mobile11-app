import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { FooterAiralo } from '@/components/landing/FooterAiralo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Smartphone, Download, RefreshCw, Link2, CreditCard, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { getDateLocale } from '@/lib/dateLocale';
import { safeRedirectToPayment } from '@/lib/paymentRedirect';


export default function OrdersPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [retryingOrderId, setRetryingOrderId] = useState<string | null>(null);

  // Redirect to auth popup if not logged in
  useEffect(() => {
    if (!loading && !user) {
      sessionStorage.setItem('post_auth_next', '/orders');
      window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { tab: 'signin' } }));
      navigate('/', { replace: true });
    }
  }, [loading, user, navigate]);


  interface OrderWithPackage {
    id: string;
    order_id: string;
    package_id: string;
    total_amount: number;
    original_amount?: number;
    discount_amount?: number;
    promo_code_id?: string;
    currency: string;
    status: string;
    esim_packages?: {
      name: string;
      country_name: string;
      country_code: string;
      data_amount: string;
      validity_days: number;
      package_type?: string;
      speed_after_limit?: string;
      qos_speed?: string;
    };
  }

  const handleRetryPayment = async (e: React.MouseEvent, order: OrderWithPackage) => {
    e.stopPropagation();
    setRetryingOrderId(order.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('retry-payment', {
        body: { orderId: order.id, language }
      });

      if (error) throw error;

      if (data?.checkoutUrl) {
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
      setRetryingOrderId(null);
    }
  };

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['user-orders', user?.id],
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
            validity_days
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      // For each order, fetch parent details using parent_order_id or webhook_data.originalOrderId as fallback
      if (data) {
        const ordersWithParents = await Promise.all(
          data.map(async (order) => {
            const parentId = order.parent_order_id || (
              order.webhook_data && typeof order.webhook_data === 'object' && (order.webhook_data as any).originalOrderId
            ) || null;

            if (parentId) {
              const { data: parentOrder } = await supabase
                .from('orders')
                .select('order_id, esim_packages:package_id(name)')
                .eq('order_id', parentId)
                .maybeSingle();
              return { ...order, parent_order_details: parentOrder };
            }
            return order;
          })
        );
        return ordersWithParents;
      }
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Show loading spinner only while auth is loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5">
        <Header />
        <div className="flex items-center justify-center pt-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Return null while redirecting to auth
  if (!user) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      processing: 'outline',
      completed: 'default',
      failed: 'destructive',
      cancelled: 'destructive',
      expired: 'outline'
    } as const;
    
    const labels: Record<string, string> = {
      pending: t('orders.pending'),
      processing: t('orders.processing'),
      completed: t('orders.completed'),
      failed: t('orders.failed'),
      cancelled: t('orders.cancelled'),
      expired: t('orders.expired')
    };
    
    return <Badge variant={variants[status as keyof typeof variants] || 'secondary'} className={status === 'expired' ? 'text-muted-foreground' : ''}>{labels[status] || status}</Badge>;
  };

  const locale = getDateLocale(language);
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent pt-1">
                {t('orders.title')}
              </h1>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                {t('orders.subtitle')}
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={() => refetch()} className="flex-1 sm:flex-none" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('orders.refresh')}
              </Button>
              <Button onClick={() => navigate('/packages')} className="flex-1 sm:flex-none" size="sm">
                {t('orders.browsePackages')}
              </Button>
            </div>
          </div>

          {/* Orders List */}
          {isLoading ? (
            <Card className="border-0 shadow-elevation">
              <CardContent className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </CardContent>
            </Card>
          ) : orders.length === 0 ? (
            <Card className="border-0 shadow-elevation">
              <CardContent className="text-center py-12">
                <Smartphone className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('orders.noOrdersYet')}</h3>
                <p className="text-muted-foreground mb-6">
                  {t('orders.noOrdersDescription')}
                </p>
                <Button onClick={() => navigate('/packages')}>
                  {t('orders.browseEsimPackages')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className="border-0 shadow-elevation hover:shadow-glow transition-shadow cursor-pointer overflow-hidden" onClick={() => navigate(`/order/${order.id}`)}>
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      {/* Package info */}
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 flex items-center justify-center">
                          <Smartphone className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base sm:text-lg truncate">{order.esim_packages?.name}</CardTitle>
                          <CardDescription className="text-xs sm:text-sm break-words">
                            <span className="block truncate">{t('orders.order')} #{order.order_id}</span>
                            <span className="block">{formatDate(order.created_at)}</span>
                            {(() => {
                              const webhook = order.webhook_data && typeof order.webhook_data === 'object' ? (order.webhook_data as any) : null;
                              const isExtension =
                                (order.parent_order_id && order.parent_order_id !== order.order_id) ||
                                (webhook?.isExtension === true) ||
                                (webhook?.originalOrderId && webhook.originalOrderId !== order.order_id) ||
                                (typeof order.order_id === 'string' && order.order_id.startsWith('EXT-'));
                              const parentDisplayId = order.parent_order_id || webhook?.originalOrderId;
                              return isExtension && parentDisplayId ? (
                                <span className="block mt-1 text-blue-600 truncate">
                                  {t('orders.extendsOrder')} #{parentDisplayId}
                                </span>
                              ) : null;
                            })()}
                          </CardDescription>
                        </div>
                      </div>
                      
                      {/* Price and badges */}
                      <div className="flex items-center gap-2 flex-wrap pl-13 sm:pl-0">
                        {(order as any).service_tier === 'economy' ? (
                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 text-xs">
                            Economy
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300 text-xs">
                            Priority
                          </Badge>
                        )}
                        {(() => {
                          const webhook = order.webhook_data && typeof order.webhook_data === 'object' ? (order.webhook_data as any) : null;
                          const isExtension =
                            (order.parent_order_id && order.parent_order_id !== order.order_id) ||
                            (webhook?.isExtension === true) ||
                            (webhook?.originalOrderId && webhook.originalOrderId !== order.order_id) ||
                            (typeof order.order_id === 'string' && order.order_id.startsWith('EXT-'));
                          return isExtension ? (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-300 text-xs">
                              <Link2 className="h-3 w-3 mr-1" />
                              {t('orders.extension')}
                            </Badge>
                          ) : null;
                        })()}
                        {getStatusBadge(order.status)}
                        <span className="font-semibold text-sm sm:text-base whitespace-nowrap">
                          {order.currency} {Number(order.total_amount).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{t('orders.destination')}</p>
                        <p className="font-medium">{order.esim_packages?.country_name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{t('orders.dataAmount')}</p>
                        <p className="font-medium">{order.esim_packages?.data_amount}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{t('orders.validity')}</p>
                        <p className="font-medium">{order.esim_packages?.validity_days} {t('orders.days')}</p>
                      </div>
                    </div>
                    
                    {order.status === 'completed' && (
                      <div className="border-t pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          {order.iccid && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">{t('orders.iccid')}</p>
                              <p className="font-mono text-sm bg-muted p-2 rounded">{order.iccid}</p>
                            </div>
                          )}
                          {order.msisdn && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">{t('orders.phoneNumber')}</p>
                              <p className="font-mono text-sm bg-muted p-2 rounded">{order.msisdn}</p>
                            </div>
                          )}
                        </div>
                        
                        {order.qr_code && (
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              {t('orders.downloadQrCode')}
                            </Button>
                            <Button variant="outline" size="sm">
                              {t('orders.installationGuide')}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {order.status === 'pending' && (
                      <div className="border-t pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <p className="text-sm text-muted-foreground">
                          {t('orders.awaitingPayment')}
                        </p>
                        <Button 
                          size="sm" 
                          onClick={(e) => handleRetryPayment(e, order as OrderWithPackage)}
                          disabled={retryingOrderId === order.id}
                        >
                          {retryingOrderId === order.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <CreditCard className="h-4 w-4 mr-2" />
                          )}
                          {t('orders.completePayment')}
                        </Button>
                      </div>
                    )}
                    
                    {order.status === 'expired' && (
                      <div className="border-t pt-4">
                        <p className="text-sm text-muted-foreground">
                          {t('orders.expiredMessage')}
                        </p>
                        <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate('/packages')}>
                          {t('orders.browsePackages')}
                        </Button>
                      </div>
                    )}
                    
                    {order.status === 'processing' && (
                      <div className="border-t pt-4">
                        <p className="text-sm text-muted-foreground">
                          {t('orders.processingEsim')}
                        </p>
                      </div>
                    )}
                    
                    {(order.status === 'failed' || order.status === 'cancelled') && (
                      <div className="border-t pt-4">
                        <p className="text-sm text-destructive">
                          {order.status === 'cancelled' ? t('orders.orderCancelled') : t('orders.orderFailed')}
                        </p>
                        <Button variant="outline" size="sm" className="mt-2">
                          {t('orders.contactSupport')}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <FooterAiralo />
    </div>
  );
}
