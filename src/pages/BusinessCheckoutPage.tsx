import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { useOrganizationCredit } from '@/hooks/useOrganizationCredit';
import { useBusinessCart, BusinessCartItem } from '@/contexts/BusinessCartContext';
import { BusinessPortalNav } from '@/components/business/BusinessPortalNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Loader2, 
  CreditCard,
  CheckCircle2,
  ArrowLeft,
  Building2,
  Globe,
  ChevronDown,
  Wifi,
  Smartphone,
  Signal,
  Calendar,
  Database
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { PackageTypeBadge } from '@/components/esim/PackageTypeBadge';
import { getLocalizedDescription } from '@/lib/packageDescriptionUtils';

export default function BusinessCheckoutPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { currentOrg, isLoading: orgLoading, isOrgAdmin, isOrgManager } = useOrganizationContext();
  const { data: creditData, isLoading: creditLoading } = useOrganizationCredit(currentOrg?.id || null);
  const { items, clearCart, totalPrice, totalItems } = useBusinessCart();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { formatPrice, t } = useLanguage();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdOrderCount, setCreatedOrderCount] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState<Record<string, boolean>>({});
  const createOrderInFlightRef = useRef(false);

  const creditBalance = creditData?.credit_balance || 0;
  const hasEnoughCredit = creditBalance >= totalPrice;
  const newBalance = creditBalance - totalPrice;

  // Redirect if no items
  useEffect(() => {
    if (!authLoading && !orgLoading && items.length === 0 && !isSuccess) {
      navigate('/business/cart');
    }
  }, [authLoading, orgLoading, items.length, isSuccess, navigate]);

  const generateOrderId = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `ORG-${timestamp}-${random}`.toUpperCase();
  };

  const processCheckout = useCallback(async () => {
    if (!user || !currentOrg || !hasEnoughCredit || createOrderInFlightRef.current || items.length === 0) return;
    
    createOrderInFlightRef.current = true;
    setIsProcessing(true);
    
    const orderIds: string[] = [];
    const orderDbIds: string[] = [];
    
    try {
      const parentOrderNumber = `ORG-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      let itemIndex = 1;
      
      // Create orders for each cart item quantity
      for (const item of items) {
        for (let i = 0; i < item.quantity; i++) {
          const childOrderNumber = `${parentOrderNumber}-${itemIndex}`;
          
          const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
              order_id: childOrderNumber,
              parent_order_id: parentOrderNumber,
              item_index: itemIndex,
              user_id: user.id,
              organization_id: currentOrg.id,
              package_id: item.packageId,
              total_amount: item.price,
              original_amount: item.price,
              currency: 'USD',
              status: 'pending',
              environment: 'production',
            })
            .select('id, order_id')
            .single();

          if (orderError) {
            console.error('Order creation error:', orderError);
            throw new Error(`Failed to create order: ${orderError.message}`);
          }
          
          orderIds.push(order.order_id);
          orderDbIds.push(order.id);
          itemIndex++;
        }
      }

      // Deduct credit from organization
      const { data: deductResult, error: deductError } = await supabase.functions.invoke('deduct-org-credit', {
        body: {
          organization_id: currentOrg.id,
          order_id: orderIds[0],
          amount: totalPrice,
        }
      });

      if (deductError || !deductResult?.success) {
        throw new Error(deductResult?.error || deductError?.message || 'Failed to deduct credit');
      }

      // Update all orders to processing and create payment records
      for (const orderId of orderDbIds) {
        await supabase
          .from('orders')
          .update({ status: 'processing' })
          .eq('id', orderId);
          
        await supabase.from('payments').insert({
          order_id: orderId,
          amount: 0, // Paid via org credit
          currency: 'USD',
          status: 'completed',
          payment_method: 'org_credit'
        });
      }

      // Process orders through fulfillment (same as retail free orders)
      const { error: fulfillError } = await supabase.functions.invoke('process-free-orders', {
        body: { 
          orderIds: orderDbIds, 
          environment: 'production' 
        }
      });

      if (fulfillError) {
        console.error('Fulfillment error:', fulfillError);
        // Don't throw - orders are created, fulfillment might catch up
      }

      // Create organization_esim_assignments for tracking
      for (const orderId of orderDbIds) {
        await supabase
          .from('organization_esim_assignments')
          .insert({
            organization_id: currentOrg.id,
            order_id: orderId,
            status: 'assigned',
            assigned_by: user.id,
          });
      }

      // Success!
      setCreatedOrderCount(orderDbIds.length);
      setIsSuccess(true);
      clearCart();
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['organization-credit', currentOrg.id] });
      queryClient.invalidateQueries({ queryKey: ['organization-credit-transactions', currentOrg.id] });
      queryClient.invalidateQueries({ queryKey: ['organization-assignments', currentOrg.id] });
      
      toast({
        title: 'Purchase Complete!',
        description: `${orderDbIds.length} eSIM(s) have been added to your organization inventory.`,
      });
      
    } catch (error: any) {
      console.error('Checkout error:', error);
      
      // Cleanup: delete any created orders on failure
      for (const orderId of orderDbIds) {
        await supabase.from('orders').delete().eq('id', orderId);
      }
      
      toast({
        title: 'Purchase Failed',
        description: error.message || 'An error occurred during purchase',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      createOrderInFlightRef.current = false;
    }
  }, [user, currentOrg, hasEnoughCredit, items, totalPrice, clearCart, queryClient, toast]);

  // Loading states
  if (authLoading || orgLoading || creditLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!user || !currentOrg) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <Card className="max-w-md bg-white rounded-2xl">
          <CardContent className="pt-6 text-center">
            <p className="mb-4 text-gray-600">Session expired. Please try again.</p>
            <Button onClick={() => navigate('/business/purchase')} className="bg-orange-500 hover:bg-orange-600">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isOrgAdmin && !isOrgManager) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <Card className="max-w-md bg-white rounded-2xl">
          <CardContent className="pt-6 text-center">
            <p className="mb-4 text-gray-600">Only admins and managers can purchase eSIMs.</p>
            <Button onClick={() => navigate('/business/esims')} className="bg-orange-500 hover:bg-orange-600">
              Back to eSIMs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#FAF7F2]">
        <BusinessPortalNav />
        <div className="container mx-auto px-4 py-12 max-w-lg">
          <Card className="bg-white rounded-2xl shadow-sm">
            <CardContent className="pt-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Purchase Complete!</h2>
              <p className="text-gray-600 mb-6">
                {createdOrderCount} eSIM(s) have been added to your organization's inventory.
              </p>
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-600">New Credit Balance</p>
                <p className="text-2xl font-bold text-gray-900">{formatPrice(newBalance)}</p>
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/business/purchase')}
                  className="flex-1 rounded-full"
                >
                  Buy More
                </Button>
                <Button 
                  onClick={() => navigate('/business/esims')}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 rounded-full"
                >
                  View Inventory
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <BusinessPortalNav />
      
      <div className="container py-8 max-w-2xl mx-auto px-4">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-black text-gray-800">
              {t('checkout.title') || 'Confirm Purchase'}
            </h1>
            <p className="text-gray-600">
              Review and confirm your order
            </p>
          </div>

          {/* Organization Info */}
          <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <CardHeader className="py-4 border-b border-gray-100">
              <CardTitle className="text-base flex items-center gap-2 text-gray-900">
                <Building2 className="h-5 w-5 text-gray-500" />
                Purchasing for
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="font-semibold text-gray-900">{currentOrg.name}</p>
              <p className="text-sm text-gray-500">{currentOrg.billing_email}</p>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">{t('cart.orderSummary') || 'Order Summary'}</h2>
              <p className="text-sm text-gray-600 mt-1">
                {totalItems} eSIM package(s)
              </p>
            </div>
            <div className="p-6 space-y-4">
              {items.map((item: BusinessCartItem) => (
                <Collapsible 
                  key={item.packageId}
                  open={detailsOpen[item.packageId]}
                  onOpenChange={(open) => setDetailsOpen(prev => ({ ...prev, [item.packageId]: open }))}
                >
                  <div className="border border-gray-100 rounded-xl p-4 space-y-3 bg-gray-50/50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700 border-0">
                            {item.country === 'GLOBAL' ? (
                              <><Globe className="mr-1 h-3 w-3" />Global</>
                            ) : (
                              item.country
                            )}
                          </Badge>
                          {item.package_type && (
                            <PackageTypeBadge 
                              packageType={item.package_type as any}
                              size="sm"
                              showIcon={true}
                            />
                          )}
                          {item.quantity > 1 && (
                            <Badge variant="outline" className="text-xs border-gray-200 text-gray-600">
                              Qty: {item.quantity}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-lg text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {getLocalizedDescription({
                            packageType: item.package_type || '',
                            dataAmount: item.data_amount || '',
                            speedAfterLimit: item.speed_after_limit,
                            qosSpeed: item.qos_speed
                          }, t)}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-xl font-bold text-orange-500">
                          {formatPrice(item.price * item.quantity)}
                        </div>
                        {item.quantity > 1 && (
                          <div className="text-xs text-gray-500">
                            {formatPrice(item.price)} × {item.quantity}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <CollapsibleTrigger asChild>
                      <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors">
                        <span>View details</span>
                        <ChevronDown className={`h-3 w-3 transition-transform ${detailsOpen[item.packageId] ? 'rotate-180' : ''}`} />
                      </button>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Database className="h-4 w-4" />
                          <span>{item.data_amount}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>{item.validity}</span>
                        </div>
                        {item.carrier && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Signal className="h-4 w-4" />
                            <span>{item.carrier}</span>
                          </div>
                        )}
                        {item.network_type && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Wifi className="h-4 w-4" />
                            <span>{item.network_type}</span>
                          </div>
                        )}
                        {item.sim_type && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Smartphone className="h-4 w-4" />
                            <span>{item.sim_type}</span>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          </div>

          {/* Payment Summary */}
          <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <CardHeader className="py-4 border-b border-gray-100">
              <CardTitle className="text-base flex items-center gap-2 text-gray-900">
                <CreditCard className="h-5 w-5 text-orange-500" />
                Payment with Organization Credit
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Total</span>
                  <span className="font-semibold text-gray-900">{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Available Credit</span>
                  <span className={`font-semibold ${hasEnoughCredit ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPrice(creditBalance)}
                  </span>
                </div>
                <div className="flex justify-between text-orange-600">
                  <span>Credit Applied</span>
                  <span>-{formatPrice(totalPrice)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-900 font-semibold">Amount Due</span>
                    <span className="font-bold text-2xl text-gray-900">{formatPrice(0)}</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-gray-500 text-sm">Balance After Purchase</span>
                    <span className="text-gray-700 font-medium">{formatPrice(newBalance)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={() => navigate('/business/cart')}
              className="flex-1 rounded-full"
              disabled={isProcessing}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cart
            </Button>
            <Button 
              onClick={processCheckout}
              className="flex-1 bg-orange-500 hover:bg-orange-600 rounded-full"
              disabled={!hasEnoughCredit || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm Purchase'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
