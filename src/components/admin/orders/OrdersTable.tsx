import { Eye, Link2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AdminStatusBadge } from '../ui/AdminStatusBadge';
import { AdminEmptyState } from '../ui/AdminEmptyState';
import { Order, isExtensionOrder, getChannelSource, getMargin, getPaymentStatus, getProvisioningStatus } from './types';
import { cn } from '@/lib/utils';

interface OrdersTableProps {
  orders: Order[];
  onViewOrder: (order: Order) => void;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function OrdersTable({ orders, onViewOrder, page, pageSize, onPageChange }: OrdersTableProps) {
  const totalPages = Math.ceil(orders.length / pageSize);
  const paginatedOrders = orders.slice((page - 1) * pageSize, page * pageSize);

  const channelBadge = (source: string) => {
    const typeMap: Record<string, 'info' | 'warning' | 'success' | 'neutral'> = {
      Direct: 'info',
      Affiliate: 'neutral',
      Reseller: 'warning',
      Distributor: 'success',
      API: 'info',
      B2B: 'neutral',
    };
    return <AdminStatusBadge status={source} type={typeMap[source] || 'neutral'} showIcon={false} />;
  };

  const formatAmount = (amount: number, currency: string) => {
    if (currency === 'THB') return `฿${Math.round(amount).toLocaleString()}`;
    return `$${amount.toFixed(2)}`;
  };

  return (
    <div className="rounded-xl border border-[#F3F0EB] bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#FAFAF8] hover:bg-[#FAFAF8] border-b border-[#F3F0EB]">
              <TableHead className="w-[120px] text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF] h-10">Order ID</TableHead>
              <TableHead className="hidden lg:table-cell text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF] h-10">Customer</TableHead>
              <TableHead className="hidden md:table-cell text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF] h-10">Package</TableHead>
              <TableHead className="hidden xl:table-cell text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF] h-10">Supplier</TableHead>
              <TableHead className="hidden xl:table-cell text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF] h-10">Channel</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF] h-10">Amount</TableHead>
              <TableHead className="hidden lg:table-cell text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF] h-10">Margin</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF] h-10">Status</TableHead>
              <TableHead className="hidden md:table-cell text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF] h-10">Payment</TableHead>
              <TableHead className="hidden lg:table-cell text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF] h-10">Prov.</TableHead>
              <TableHead className="hidden sm:table-cell text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF] h-10">Date</TableHead>
              <TableHead className="w-[44px] h-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrders.map((order) => {
              const source = getChannelSource(order);
              const margin = getMargin(order);
              const payStatus = getPaymentStatus(order);
              const provStatus = getProvisioningStatus(order);
              const ext = isExtensionOrder(order);

              return (
                <TableRow
                  key={order.id}
                  className="cursor-pointer group hover:bg-[#FAFAF8] transition-colors border-b border-[#F3F0EB] last:border-0"
                  onClick={() => onViewOrder(order)}
                >
                  <TableCell className="py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs text-[#1A1A1A] truncate max-w-[100px]">{order.order_id}</span>
                      {ext && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link2 className="h-3 w-3 text-blue-500 flex-shrink-0" />
                          </TooltipTrigger>
                          <TooltipContent>Extension order</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell py-3">
                    <div className="max-w-[160px]">
                      <p className="text-[13px] font-medium text-[#1A1A1A] truncate">
                        {order.profiles?.first_name} {order.profiles?.last_name}
                      </p>
                      <p className="text-[11px] text-[#9CA3AF] truncate">
                        {order.profiles?.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-3">
                    <div className="max-w-[160px]">
                      <p className="text-[13px] font-medium text-[#1A1A1A] truncate">{order.esim_packages?.country_name || '—'}</p>
                      <p className="text-[11px] text-[#9CA3AF] truncate">
                        {order.esim_packages?.data_amount} • {order.esim_packages?.name}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell py-3">
                    <span className="text-xs font-medium text-[#4B5563]">
                      {order.esim_providers?.provider_name || order.esim_providers?.provider_code || '—'}
                    </span>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell py-3">
                    {channelBadge(source)}
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="text-[13px] font-semibold text-[#1A1A1A] tabular-nums">
                      {formatAmount(order.total_amount, order.currency)}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell py-3">
                    {margin != null ? (
                      <span className={cn('text-xs font-mono tabular-nums', margin >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                        ${margin.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-xs text-[#D1D5DB]">—</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3">
                    <AdminStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-3">
                    <AdminStatusBadge status={payStatus} showIcon={false} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell py-3">
                    <AdminStatusBadge status={provStatus} label={provStatus === 'provisioned' ? 'OK' : undefined} showIcon={false} />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-3">
                    <div>
                      <p className="text-xs text-[#4B5563] tabular-nums">{new Date(order.created_at).toLocaleDateString()}</p>
                      <p className="text-[10px] text-[#9CA3AF] tabular-nums">
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-orange-50 text-[#9CA3AF] hover:text-orange-600"
                      onClick={(e) => { e.stopPropagation(); onViewOrder(order); }}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {paginatedOrders.length === 0 && (
        <AdminEmptyState
          title="No orders found"
          description="No orders match your current filters. Try adjusting your search criteria."
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#F3F0EB] bg-[#FAFAF8]">
          <span className="text-[11px] text-[#9CA3AF] tabular-nums">
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, orders.length)} of {orders.length}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs rounded-lg border-[#F3F0EB] text-[#4B5563] hover:bg-[#FAF7F2]"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    "h-7 w-7 p-0 text-xs rounded-lg",
                    pageNum === page
                      ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
                      : "border-[#F3F0EB] text-[#4B5563] hover:bg-[#FAF7F2]"
                  )}
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs rounded-lg border-[#F3F0EB] text-[#4B5563] hover:bg-[#FAF7F2]"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
