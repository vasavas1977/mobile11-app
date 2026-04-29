import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Package, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { OperatorSimCard } from '@/components/my-esims/OperatorSimCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatStoredPrice } from '@/lib/currencyUtils';
import { getDateLocale } from '@/lib/dateLocale';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const ORDERS_PER_PAGE = 10;

type PackageTypeValue = 'day_pass' | 'max_speed' | 'limitless';

const normalizePackageType = (type?: string | null): PackageTypeValue => {
  if (!type) return 'day_pass';
  const normalized = type.toLowerCase().replace(/[\s-]/g, '_');
  if (normalized.includes('limitless')) return 'limitless';
  if (normalized.includes('max') || normalized.includes('speed')) return 'max_speed';
  return 'day_pass';
};

interface OrdersSectionProps {
  onSelectOrder?: (orderId: string) => void;
}

export const OrdersSection: React.FC<OrdersSectionProps> = ({ onSelectOrder }) => {
  const { user } = useAuth();
  const { t, language, currency } = useLanguage();
  const [currentPage, setCurrentPage] = useState(1);

  const locale = getDateLocale(language);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['user-orders', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          esim_packages:package_id (
            name,
            country_name,
            data_amount,
            validity_days,
            carrier,
            package_type,
            support_voice,
            support_data
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .neq('hidden_by_user', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Pagination logic
  const totalPages = Math.ceil(orders.length / ORDERS_PER_PAGE);
  const startIndex = (currentPage - 1) * ORDERS_PER_PAGE;
  const paginatedOrders = orders.slice(startIndex, startIndex + ORDERS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">{t('profile.orders.title')}</h2>
        </div>
        
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              {t('profile.orders.noOrders')}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {t('profile.orders.noOrdersDesc')}
            </p>
            <Link to="/packages">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-6">
                {t('profile.orders.browsePackages')}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedOrders.map((order) => {
              const pkg = order.esim_packages as any;
              const webhook = order.webhook_data && typeof order.webhook_data === 'object' 
                ? (order.webhook_data as any) 
                : null;
              const isExtension =
                (typeof order.order_id === 'string' && order.order_id.startsWith('EXT-')) ||
                (webhook?.isExtension === true) ||
                (webhook?.originalOrderId && webhook.originalOrderId !== order.order_id);
              
              return (
                <div 
                  key={order.id}
                  onClick={() => onSelectOrder?.(order.id)}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-20 flex-shrink-0 transform scale-50 origin-left">
                      <OperatorSimCard
                        carrier={pkg?.carrier || 'Mobile11'}
                        countryName={pkg?.country_name || 'eSIM'}
                        packageType={normalizePackageType(pkg?.package_type)}
                        networkType="4G"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 flex items-center gap-2">
                        {pkg?.country_name || 'eSIM Package'} / {isExtension ? t('profile.orders.topUp') : t('profile.orders.esim')}
                        {isExtension && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                            {t('myEsims.topUpBadge')}
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">
                        {pkg?.validity_days} {t('profile.orders.days')} - {t('profile.orders.validity')} / {pkg?.data_amount} - {pkg?.support_voice ? t('profile.orders.voiceAndData') : t('profile.orders.dataOnly')}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(order.created_at).toLocaleDateString(locale, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-gray-900">
                      {formatStoredPrice(order.total_amount, (order.currency || 'USD') as 'USD' | 'THB', currency)}
                    </p>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                  </div>
                </div>
              );
            })}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex flex-col items-center gap-3 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  {t('profile.orders.showingOrders')
                    .replace('{start}', String(startIndex + 1))
                    .replace('{end}', String(Math.min(startIndex + ORDERS_PER_PAGE, orders.length)))
                    .replace('{total}', String(orders.length))}
                </p>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {/* Page numbers - show max 5 pages */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => setCurrentPage(pageNum)}
                            isActive={currentPage === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};