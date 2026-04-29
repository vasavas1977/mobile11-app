import { Search, Filter, X, CalendarIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { OrderFilterState, DEFAULT_FILTERS } from './types';
import { useState } from 'react';

interface OrderFiltersProps {
  filters: OrderFilterState;
  onFiltersChange: (filters: OrderFilterState) => void;
  totalCount: number;
  filteredCount: number;
  needsAttentionCount: number;
  suppliers: string[];
  destinations: string[];
}

export function OrderFilters({
  filters,
  onFiltersChange,
  totalCount,
  filteredCount,
  needsAttentionCount,
  suppliers,
  destinations,
}: OrderFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const update = (patch: Partial<OrderFilterState>) => {
    onFiltersChange({ ...filters, ...patch });
  };

  const activeFilterCount = Object.entries(filters).filter(([key, val]) => {
    if (key === 'search') return false;
    return val !== (DEFAULT_FILTERS as any)[key];
  }).length;

  const clearAll = () => onFiltersChange({ ...DEFAULT_FILTERS });

  const selectTriggerClass = "h-9 rounded-lg border-[#F3F0EB] bg-white text-[13px] text-[#4B5563] hover:border-[#D1D5DB] focus:ring-orange-500/20 focus:border-orange-400";

  return (
    <div className="space-y-3">
      {/* Primary filter row */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
          <Input
            placeholder="Search order ID, email, ICCID, package..."
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            className="pl-9 h-9 rounded-lg border-[#F3F0EB] bg-white text-[13px] placeholder:text-[#D1D5DB] focus-visible:ring-orange-500/20 focus-visible:border-orange-400"
          />
        </div>

        <Select value={filters.status} onValueChange={(v) => update({ status: v })}>
          <SelectTrigger className={cn(selectTriggerClass, "w-[150px]")}>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="needs_attention">
              ⚠ Needs Attention {needsAttentionCount > 0 && `(${needsAttentionCount})`}
            </SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.supplier} onValueChange={(v) => update({ supplier: v })}>
          <SelectTrigger className={cn(selectTriggerClass, "w-[130px]")}>
            <SelectValue placeholder="Supplier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Suppliers</SelectItem>
            {suppliers.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.channelSource} onValueChange={(v) => update({ channelSource: v })}>
          <SelectTrigger className={cn(selectTriggerClass, "w-[130px]")}>
            <SelectValue placeholder="Channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Channels</SelectItem>
            <SelectItem value="Direct">Direct</SelectItem>
            <SelectItem value="Affiliate">Affiliate</SelectItem>
            <SelectItem value="Reseller">Reseller</SelectItem>
            <SelectItem value="Distributor">Distributor</SelectItem>
            <SelectItem value="API">API</SelectItem>
            <SelectItem value="B2B">B2B</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-9 gap-1.5 rounded-lg border-[#F3F0EB] text-[13px] text-[#4B5563] hover:bg-[#FAF7F2]",
            showAdvanced && "bg-[#FAF7F2] border-orange-200 text-orange-600"
          )}
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="h-4 min-w-4 px-1 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" className="h-9 text-xs text-[#9CA3AF] hover:text-red-500" onClick={clearAll}>
            <X className="h-3 w-3 mr-1" />
            Clear all
          </Button>
        )}

        <span className="text-[11px] text-[#9CA3AF] ml-auto tabular-nums">
          {filteredCount === totalCount ? `${totalCount} orders` : `${filteredCount} of ${totalCount}`}
        </span>
      </div>

      {/* Advanced filters row */}
      {showAdvanced && (
        <div className="flex flex-wrap items-center gap-2.5 px-4 py-3 bg-[#FAFAF8] rounded-xl border border-[#F3F0EB]">
          <Select value={filters.destination} onValueChange={(v) => update({ destination: v })}>
            <SelectTrigger className={cn(selectTriggerClass, "w-[160px]")}>
              <SelectValue placeholder="Destination" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="all">All Destinations</SelectItem>
              {destinations.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.extensionType} onValueChange={(v: any) => update({ extensionType: v })}>
            <SelectTrigger className={cn(selectTriggerClass, "w-[140px]")}>
              <SelectValue placeholder="Order Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="original">Original</SelectItem>
              <SelectItem value="extension">Extension</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.tier} onValueChange={(v: any) => update({ tier: v })}>
            <SelectTrigger className={cn(selectTriggerClass, "w-[120px]")}>
              <SelectValue placeholder="Tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="economy">Economy</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("h-9 gap-1.5 rounded-lg border-[#F3F0EB] text-[13px]", filters.dateFrom ? "text-[#1A1A1A]" : "text-[#9CA3AF]")}>
                <CalendarIcon className="h-3.5 w-3.5" />
                {filters.dateFrom ? format(new Date(filters.dateFrom), 'MMM d') : 'From'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
                onSelect={(d) => update({ dateFrom: d ? d.toISOString() : '' })}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("h-9 gap-1.5 rounded-lg border-[#F3F0EB] text-[13px]", filters.dateTo ? "text-[#1A1A1A]" : "text-[#9CA3AF]")}>
                <CalendarIcon className="h-3.5 w-3.5" />
                {filters.dateTo ? format(new Date(filters.dateTo), 'MMM d') : 'To'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dateTo ? new Date(filters.dateTo) : undefined}
                onSelect={(d) => update({ dateTo: d ? d.toISOString() : '' })}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}
