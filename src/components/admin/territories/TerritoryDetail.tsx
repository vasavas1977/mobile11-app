import { ArrowLeft, Globe, MapPin, Shield, ShieldOff, ShieldAlert, Calendar, DollarSign, Headphones, Package, Users, BarChart3, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { getCurrencySymbol, type Currency } from "@/lib/currencyUtils";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface TerritoryDetailProps {
  territory: any;
  onBack: () => void;
}

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  active:     { bg: "bg-emerald-50", text: "text-emerald-700", label: "Active" },
  draft:      { bg: "bg-[#FAF7F2]", text: "text-[#6B7280]", label: "Draft" },
  pending:    { bg: "bg-amber-50",   text: "text-amber-700",  label: "Pending" },
  suspended:  { bg: "bg-red-50",     text: "text-red-700",    label: "Suspended" },
  terminated: { bg: "bg-red-50",     text: "text-red-700",    label: "Terminated" },
  expired:    { bg: "bg-[#FAF7F2]", text: "text-[#9CA3AF]",  label: "Expired" },
};

// Mock data for charts
const revenueData = [
  { month: "Oct", revenue: 1200 }, { month: "Nov", revenue: 1800 },
  { month: "Dec", revenue: 2400 }, { month: "Jan", revenue: 2100 },
  { month: "Feb", revenue: 2800 }, { month: "Mar", revenue: 3200 },
];

const channelData = [
  { name: "Web", value: 45 }, { name: "LINE", value: 30 },
  { name: "WhatsApp", value: 15 }, { name: "API", value: 10 },
];

const CHART_COLORS = ["#f97316", "#fb923c", "#fdba74", "#fed7aa"];

const mockPartners = [
  { name: "Bangkok Mobile Co.", type: "Distributor", status: "active", orders: 145, revenue: 4200 },
  { name: "Siam Reseller Group", type: "Reseller", status: "active", orders: 89, revenue: 2100 },
  { name: "TravelConnect API", type: "API Partner", status: "active", orders: 234, revenue: 5600 },
];

const mockPackages = [
  { name: "Thailand 5GB / 7 Days", orders: 312, revenue: 4680, rating: 4.8 },
  { name: "Thailand 10GB / 15 Days", orders: 198, revenue: 5940, rating: 4.6 },
  { name: "Thailand Unlimited / 30 Days", orders: 87, revenue: 4350, rating: 4.9 },
  { name: "Thailand 3GB / 5 Days", orders: 156, revenue: 1560, rating: 4.5 },
];

export function TerritoryDetail({ territory, onBack }: TerritoryDetailProps) {
  const t = territory;
  const status = statusStyles[t.contract_status] || statusStyles.draft;
  const currSymbol = getCurrencySymbol((t.local_currency || "USD") as Currency);

  const exclusivityLabel = t.exclusivity_model === "exclusive" ? "Exclusive" 
    : t.exclusivity_model === "semi_exclusive" ? "Semi-Exclusive" : "Non-Exclusive";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-9 w-9 p-0 rounded-xl hover:bg-[#FAF7F2]">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-lg font-bold text-orange-600">
              {t.country_code?.toUpperCase().slice(0, 2)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1A1A1A]">{t.territory_name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm text-[#9CA3AF]">{t.country_name}</span>
                {t.region && <span className="text-sm text-[#9CA3AF]">• {t.region}</span>}
                <Badge className={`${status.bg} ${status.text} border-0 text-[10px] font-semibold`}>
                  {status.label}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <Button variant="outline" className="rounded-xl border-[#F3F0EB] text-sm gap-2">
          <Settings className="h-4 w-4" /> Edit Territory
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: "Monthly Revenue", value: `$${(t.monthly_revenue || 0).toLocaleString()}`, icon: DollarSign },
          { label: "Monthly Orders", value: (t.monthly_orders || 0).toLocaleString(), icon: Package },
          { label: "Support Tickets", value: (t.monthly_support_tickets || 0).toLocaleString(), icon: Headphones },
          { label: "Model", value: exclusivityLabel, icon: Shield },
          { label: "Currency", value: `${currSymbol} ${t.local_currency}`, icon: Globe },
        ].map((kpi) => (
          <Card key={kpi.label} className="border-[#F3F0EB] bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <kpi.icon className="h-3.5 w-3.5 text-[#9CA3AF]" />
                <p className="text-[10px] uppercase tracking-wider text-[#9CA3AF] font-semibold">{kpi.label}</p>
              </div>
              <p className="text-lg font-bold text-[#1A1A1A]">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-[#FAF7F2] rounded-xl h-10 p-1">
          <TabsTrigger value="overview" className="rounded-lg text-xs">Overview</TabsTrigger>
          <TabsTrigger value="partners" className="rounded-lg text-xs">Partners</TabsTrigger>
          <TabsTrigger value="packages" className="rounded-lg text-xs">Packages</TabsTrigger>
          <TabsTrigger value="revenue" className="rounded-lg text-xs">Revenue</TabsTrigger>
          <TabsTrigger value="support" className="rounded-lg text-xs">Support</TabsTrigger>
          <TabsTrigger value="config" className="rounded-lg text-xs">Configuration</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-[#F3F0EB] bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-[#1A1A1A]">Territory Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Country", value: t.country_name },
                  { label: "Region", value: t.region || "—" },
                  { label: "Default Language", value: t.default_language?.toUpperCase() },
                  { label: "Local Currency", value: `${currSymbol} ${t.local_currency}` },
                  { label: "Exclusivity", value: exclusivityLabel },
                  { label: "Contract Status", value: status.label },
                  { label: "Start Date", value: t.start_date || "—" },
                  { label: "End Date", value: t.end_date || "—" },
                  { label: "Contract Ref", value: t.contract_reference || "—" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-[#F3F0EB] last:border-0">
                    <span className="text-xs text-[#9CA3AF]">{row.label}</span>
                    <span className="text-xs font-medium text-[#1A1A1A]">{row.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-[#F3F0EB] bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-[#1A1A1A]">Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F0EB" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #F3F0EB", fontSize: 12 }} />
                    <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} dot={{ r: 3, fill: "#f97316" }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-[#F3F0EB] bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-[#1A1A1A]">Enabled Channels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(t.enabled_channels || []).map((ch: string) => (
                    <Badge key={ch} className="bg-orange-50 text-orange-600 border-orange-200 text-xs capitalize">
                      {ch}
                    </Badge>
                  ))}
                  {(!t.enabled_channels || t.enabled_channels.length === 0) && (
                    <p className="text-xs text-[#9CA3AF]">No channels configured</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#F3F0EB] bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-[#1A1A1A]">Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {t.tax_notes && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#9CA3AF] font-semibold mb-1">Tax Notes</p>
                    <p className="text-xs text-[#6B7280]">{t.tax_notes}</p>
                  </div>
                )}
                {t.legal_notes && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#9CA3AF] font-semibold mb-1">Legal Notes</p>
                    <p className="text-xs text-[#6B7280]">{t.legal_notes}</p>
                  </div>
                )}
                {!t.tax_notes && !t.legal_notes && (
                  <p className="text-xs text-[#9CA3AF]">No notes added</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Partners */}
        <TabsContent value="partners" className="space-y-4">
          <Card className="border-[#F3F0EB] bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-[#1A1A1A]">Assigned Partners</CardTitle>
                <Button variant="outline" size="sm" className="rounded-xl border-[#F3F0EB] text-xs h-8">
                  Assign Partner
                </Button>
              </div>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow className="border-[#F3F0EB] hover:bg-transparent">
                  <TableHead className="text-[10px] uppercase tracking-wider text-[#9CA3AF] font-semibold">Partner</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-[#9CA3AF] font-semibold">Type</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-[#9CA3AF] font-semibold">Status</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-[#9CA3AF] font-semibold text-right">Orders</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-[#9CA3AF] font-semibold text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockPartners.map((p) => (
                  <TableRow key={p.name} className="border-[#F3F0EB]">
                    <TableCell className="text-sm font-medium text-[#1A1A1A]">{p.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] border-[#F3F0EB] text-[#6B7280]">{p.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-emerald-50 text-emerald-700 border-0 text-[10px]">Active</Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm text-[#6B7280]">{p.orders}</TableCell>
                    <TableCell className="text-right text-sm font-medium text-[#1A1A1A]">${p.revenue.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Packages */}
        <TabsContent value="packages" className="space-y-4">
          <Card className="border-[#F3F0EB] bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-[#1A1A1A]">Package Performance</CardTitle>
                <Button variant="outline" size="sm" className="rounded-xl border-[#F3F0EB] text-xs h-8">
                  Manage Packages
                </Button>
              </div>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow className="border-[#F3F0EB] hover:bg-transparent">
                  <TableHead className="text-[10px] uppercase tracking-wider text-[#9CA3AF] font-semibold">Package</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-[#9CA3AF] font-semibold text-right">Orders</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-[#9CA3AF] font-semibold text-right">Revenue</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-[#9CA3AF] font-semibold text-right">Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockPackages.map((p) => (
                  <TableRow key={p.name} className="border-[#F3F0EB]">
                    <TableCell className="text-sm font-medium text-[#1A1A1A]">{p.name}</TableCell>
                    <TableCell className="text-right text-sm text-[#6B7280]">{p.orders}</TableCell>
                    <TableCell className="text-right text-sm font-medium text-[#1A1A1A]">${p.revenue.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-orange-50 text-orange-600 border-0 text-[10px]">⭐ {p.rating}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Revenue */}
        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-[#F3F0EB] bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-[#1A1A1A]">Revenue Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F0EB" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #F3F0EB", fontSize: 12 }} />
                    <Bar dataKey="revenue" fill="#f97316" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-[#F3F0EB] bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-[#1A1A1A]">Revenue by Channel</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={channelData} cx="50%" cy="50%" outerRadius={80} innerRadius={40} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {channelData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #F3F0EB", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Support */}
        <TabsContent value="support" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Open Tickets", value: t.monthly_support_tickets || 0 },
              { label: "Avg Resolution", value: "4.2h" },
              { label: "CSAT Score", value: "4.6 / 5" },
            ].map((m) => (
              <Card key={m.label} className="border-[#F3F0EB] bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <CardContent className="p-4">
                  <p className="text-[10px] uppercase tracking-wider text-[#9CA3AF] font-semibold">{m.label}</p>
                  <p className="text-xl font-bold text-[#1A1A1A] mt-1">{m.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="border-[#F3F0EB] bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <CardContent className="py-12 text-center">
              <Headphones className="h-8 w-8 text-[#9CA3AF] mx-auto mb-3" />
              <p className="text-sm text-[#9CA3AF]">Support routing and ticket analytics will be populated from live data.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration */}
        <TabsContent value="config" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-[#F3F0EB] bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-[#1A1A1A]">Support Routing</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs text-[#6B7280] bg-[#FAF7F2] rounded-xl p-4 overflow-auto max-h-48">
                  {JSON.stringify(t.support_routing || {}, null, 2)}
                </pre>
              </CardContent>
            </Card>

            <Card className="border-[#F3F0EB] bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-[#1A1A1A]">Local Price Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs text-[#6B7280] bg-[#FAF7F2] rounded-xl p-4 overflow-auto max-h-48">
                  {JSON.stringify(t.local_price_rules || {}, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
