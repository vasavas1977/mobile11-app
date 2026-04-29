import { useState } from "react";
import { Globe, MapPin, Plus, Search, Filter, MoreHorizontal, Shield, ShieldOff, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrencySymbol, type Currency } from "@/lib/currencyUtils";

interface Territory {
  id: string;
  territory_name: string;
  country_code: string;
  country_name: string;
  region: string | null;
  exclusivity_model: string;
  contract_status: string;
  local_currency: string;
  default_language: string;
  monthly_revenue: number;
  monthly_orders: number;
  monthly_support_tickets: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  distributor_id: string | null;
  enabled_channels: string[];
}

interface TerritoryListProps {
  territories: Territory[];
  isLoading: boolean;
  onSelect: (id: string) => void;
  onAdd: () => void;
}

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  active:     { bg: "bg-emerald-50", text: "text-emerald-700", label: "Active" },
  draft:      { bg: "bg-[#FAF7F2]", text: "text-[#6B7280]", label: "Draft" },
  pending:    { bg: "bg-amber-50",   text: "text-amber-700",  label: "Pending" },
  suspended:  { bg: "bg-red-50",     text: "text-red-700",    label: "Suspended" },
  terminated: { bg: "bg-red-50",     text: "text-red-700",    label: "Terminated" },
  expired:    { bg: "bg-[#FAF7F2]", text: "text-[#9CA3AF]",  label: "Expired" },
};

const exclusivityIcon: Record<string, { icon: typeof Shield; label: string; color: string }> = {
  exclusive:      { icon: Shield, label: "Exclusive", color: "text-orange-600" },
  semi_exclusive:  { icon: ShieldAlert, label: "Semi-Exclusive", color: "text-amber-600" },
  non_exclusive:   { icon: ShieldOff, label: "Non-Exclusive", color: "text-[#9CA3AF]" },
};

export function TerritoryList({ territories, isLoading, onSelect, onAdd }: TerritoryListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = territories.filter((t) => {
    const matchesSearch = !search || 
      t.territory_name.toLowerCase().includes(search.toLowerCase()) ||
      t.country_name.toLowerCase().includes(search.toLowerCase()) ||
      t.country_code.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.contract_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = territories.filter(t => t.contract_status === "active").length;
  const totalRevenue = territories.reduce((sum, t) => sum + (t.monthly_revenue || 0), 0);
  const totalOrders = territories.reduce((sum, t) => sum + (t.monthly_orders || 0), 0);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1A1A1A] tracking-tight">Territory Management</h1>
          <p className="text-[#9CA3AF] mt-1 text-sm">Manage international expansion and country-level operations</p>
        </div>
        <Button onClick={onAdd} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl gap-2">
          <Plus className="h-4 w-4" />
          Add Territory
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Territories", value: territories.length, icon: Globe },
          { label: "Active Markets", value: activeCount, icon: MapPin },
          { label: "Monthly Revenue", value: `$${totalRevenue.toLocaleString()}`, icon: Globe },
          { label: "Monthly Orders", value: totalOrders.toLocaleString(), icon: Globe },
        ].map((kpi) => (
          <Card key={kpi.label} className="border-[#F3F0EB] bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <CardContent className="p-4">
              <p className="text-[10px] uppercase tracking-wider text-[#9CA3AF] font-semibold">{kpi.label}</p>
              <p className="text-xl font-bold text-[#1A1A1A] mt-1">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
          <Input
            placeholder="Search territories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl border-[#F3F0EB] bg-white text-sm"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="bg-[#FAF7F2] rounded-xl h-9">
            <TabsTrigger value="all" className="text-xs rounded-lg">All</TabsTrigger>
            <TabsTrigger value="active" className="text-xs rounded-lg">Active</TabsTrigger>
            <TabsTrigger value="draft" className="text-xs rounded-lg">Draft</TabsTrigger>
            <TabsTrigger value="pending" className="text-xs rounded-lg">Pending</TabsTrigger>
            <TabsTrigger value="suspended" className="text-xs rounded-lg">Suspended</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Table */}
      <Card className="border-[#F3F0EB] bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-[#F3F0EB] hover:bg-transparent">
              <TableHead className="text-[10px] uppercase tracking-wider text-[#9CA3AF] font-semibold">Territory</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-[#9CA3AF] font-semibold">Region</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-[#9CA3AF] font-semibold">Model</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-[#9CA3AF] font-semibold">Contract</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-[#9CA3AF] font-semibold">Currency</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-[#9CA3AF] font-semibold text-right">Revenue</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-[#9CA3AF] font-semibold text-right">Orders</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-[#9CA3AF] font-semibold">Channels</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-[#9CA3AF]">Loading territories...</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-[#9CA3AF]">
                  {territories.length === 0 ? "No territories configured yet" : "No territories match your filters"}
                </TableCell>
              </TableRow>
            ) : filtered.map((t) => {
              const status = statusStyles[t.contract_status] || statusStyles.draft;
              const excl = exclusivityIcon[t.exclusivity_model] || exclusivityIcon.non_exclusive;
              const ExclIcon = excl.icon;
              return (
                <TableRow
                  key={t.id}
                  className="border-[#F3F0EB] cursor-pointer hover:bg-[#FAF7F2]/50 transition-colors"
                  onClick={() => onSelect(t.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] flex items-center justify-center text-sm font-bold text-[#1A1A1A]">
                        {t.country_code.toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-[#1A1A1A] text-sm">{t.territory_name}</p>
                        <p className="text-[11px] text-[#9CA3AF]">{t.country_name}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-[#6B7280]">{t.region || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <ExclIcon className={`h-3.5 w-3.5 ${excl.color}`} />
                      <span className="text-xs text-[#6B7280]">{excl.label}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${status.bg} ${status.text} border-0 text-[10px] font-semibold`}>
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-[#6B7280]">
                    {getCurrencySymbol(t.local_currency as Currency)} {t.local_currency}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium text-[#1A1A1A]">
                    ${(t.monthly_revenue || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-sm text-[#6B7280]">
                    {(t.monthly_orders || 0).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {(t.enabled_channels || []).slice(0, 3).map((ch) => (
                        <Badge key={ch} variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-[#F3F0EB] text-[#9CA3AF]">
                          {ch}
                        </Badge>
                      ))}
                      {(t.enabled_channels || []).length > 3 && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-[#F3F0EB] text-[#9CA3AF]">
                          +{t.enabled_channels.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg hover:bg-[#FAF7F2]">
                          <MoreHorizontal className="h-4 w-4 text-[#9CA3AF]" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl border-[#F3F0EB]">
                        <DropdownMenuItem onClick={() => onSelect(t.id)}>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit Territory</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Suspend</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
