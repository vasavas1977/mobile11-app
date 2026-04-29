import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { getDateLocale } from '@/lib/dateLocale';
import VatReceiptRequestForm from '@/components/receipt/VatReceiptRequestForm';

export default function ReceiptPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { t, language } = useLanguage();
  const locale = getDateLocale(language);

  // Fetch order details
  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ['receipt-order', orderId],
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
            package_type
          )
        `)
        .eq('id', orderId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });

  // Fetch payment details
  const { data: payment } = useQuery({
    queryKey: ['receipt-payment', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('order_id', orderId!)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ['receipt-profile', order?.user_id],
    queryFn: async () => {
      if (!order?.user_id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('user_id', order.user_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!order?.user_id,
  });

  // Fetch existing VAT receipt request
  const { data: existingVatRequest } = useQuery({
    queryKey: ['vat-receipt-request', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vat_receipt_requests' as any)
        .select('*')
        .eq('order_id', orderId!)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getPaymentMethodDisplay = () => {
    if (!payment) return '-';
    
    if (payment.payment_method === 'card' || payment.payment_gateway === 'stripe') {
      return `Visa ****${payment.payment_reference?.slice(-4) || '****'}`;
    }
    if (payment.payment_gateway === '2c2p') {
      return '2C2P';
    }
    return payment.payment_method || 'Card';
  };

  if (orderLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">{t('receipt.notFound')}</p>
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link to="/profile">{t('receipt.backToOrder')}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const pkg = order.esim_packages as any;
  const customerName = profile 
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Customer'
    : order.guest_email?.split('@')[0] || 'Customer';
  const customerEmail = profile?.email || order.guest_email || order.notification_email || '';

  const originalAmount = order.original_amount || order.total_amount + (order.mobile11_money_applied || 0);

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-8 px-4 print:bg-white print:py-0">
      <div className="max-w-2xl mx-auto">
        {/* Back Button - Hidden on print */}
        <div className="mb-6 print:hidden">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-gray-600 hover:text-gray-900"
          >
            <Link to={`/profile`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('receipt.backToOrder')}
            </Link>
          </Button>
        </div>

        {/* Receipt Card */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden print:shadow-none print:rounded-none">
          {/* Company Header */}
          <div className="p-6 border-b border-gray-100">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('receipt.companyName')}</h1>
            <p className="text-sm text-gray-600 leading-relaxed">
              {t('receipt2.companyAddress')}
            </p>
            <p className="text-sm text-gray-600">Tel: +66 (2) 6903626</p>
          </div>

          {/* Customer Info */}
          <div className="p-6 border-b border-gray-100">
            <p className="font-medium text-gray-900">{customerName}</p>
            <p className="text-sm text-gray-600">{customerEmail}</p>
          </div>

          {/* Order Summary Table */}
          <div className="p-6 border-b border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 font-medium text-gray-600">{t('receipt.orderId')}</th>
                    <th className="text-left py-3 font-medium text-gray-600">{t('receipt.totalPaid')}</th>
                    <th className="text-left py-3 font-medium text-gray-600">{t('receipt.datePaid')}</th>
                    <th className="text-left py-3 font-medium text-gray-600">{t('receipt.paymentMethod')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-3 text-gray-900">{order.order_id}</td>
                    <td className="py-3 text-gray-900">฿{order.total_amount.toFixed(2)}</td>
                    <td className="py-3 text-gray-900">{formatDate(order.payment_completed_at || order.created_at)}</td>
                    <td className="py-3 text-gray-900">{getPaymentMethodDisplay()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Product Summary */}
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">{t('receipt.summary')}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 font-medium text-gray-600">{t('receipt.qty')}</th>
                    <th className="text-left py-3 font-medium text-gray-600">{t('receipt.product')}</th>
                    <th className="text-right py-3 font-medium text-gray-600">{t('receipt.unitPrice')}</th>
                    <th className="text-right py-3 font-medium text-gray-600">{t('receipt.amount')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-3 text-gray-900">1</td>
                    <td className="py-3 text-gray-900">
                      {pkg?.name || 'eSIM'} - {pkg?.country_name} - {pkg?.data_amount} - {pkg?.validity_days}d
                    </td>
                    <td className="py-3 text-gray-900 text-right">฿{originalAmount.toFixed(2)}</td>
                    <td className="py-3 text-gray-900 text-right">฿{originalAmount.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="p-6">
            <div className="space-y-2 max-w-xs ml-auto">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('receipt.totalPrice')}</span>
                <span className="text-gray-900">฿{originalAmount.toFixed(2)}</span>
              </div>
              
              {order.mobile11_money_applied && order.mobile11_money_applied > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('receipt.usedMoney')}</span>
                  <span className="text-green-600">-฿{order.mobile11_money_applied.toFixed(2)}</span>
                </div>
              )}
              
              {order.discount_amount && order.discount_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('receipt.discount')}</span>
                  <span className="text-green-600">-฿{order.discount_amount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-200">
                <span className="text-gray-900">{t('receipt.finalPrice')}</span>
                <span className="text-gray-900">฿{order.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons - Hidden on print */}
          <div className="p-6 bg-gray-50 flex gap-3 print:hidden">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
              asChild
            >
              <Link to={`/profile`}>
                {t('receipt.backToOrder')}
              </Link>
            </Button>
          </div>
        </div>
        {/* VAT Receipt Request Form */}
        <VatReceiptRequestForm
          orderId={orderId!}
          userId={order.user_id}
          customerName={customerName}
          customerEmail={customerEmail}
          existingRequest={existingVatRequest}
        />
      </div>
    </div>
  );
}
