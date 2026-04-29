import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Users, TrendingDown, ShoppingCart, CreditCard, Shield, DollarSign } from "lucide-react";

export function ControlTowerImpact() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  const { data } = useQuery({
    queryKey: ["control-tower-impact"],
    queryFn: async () => {
      const [
        totalConvosRes,
        aiResolvedRes,
        humanResolvedRes,
        actionsCompletedRes,
        salesLeadsRes,
        refundRequestsRes,
        refundRejectedRes,
      ] = await Promise.all([
        supabase.from("conversations").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
        supabase.from("conversations").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo).eq("status", "resolved").is("assigned_to", null),
        supabase.from("conversations").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo).eq("status", "resolved").not("assigned_to", "is", null),
        (supabase as any).from("autonomous_actions_log").select("id", { count: "exact", head: true }).eq("action_status", "completed").gte("created_at", thirtyDaysAgo),
        (supabase as any).from("autonomous_actions_log").select("id", { count: "exact", head: true }).eq("action_type", "create_sales_lead").eq("action_status", "completed").gte("created_at", thirtyDaysAgo),
        (supabase as any).from("autonomous_actions_log").select("id", { count: "exact", head: true }).eq("action_type", "create_refund_request").gte("created_at", thirtyDaysAgo),
        (supabase as any).from("autonomous_actions_log").select("id", { count: "exact", head: true }).eq("action_type", "create_refund_request").eq("approval_status", "rejected").gte("created_at", thirtyDaysAgo),
      ]);

      const total = totalConvosRes.count || 0;
      const aiResolved = aiResolvedRes.count || 0;
      const humanResolved = humanResolvedRes.count || 0;
      const containmentPct = total > 0 ? ((aiResolved / total) * 100).toFixed(1) : "0";
      const avgAgentCostPerConvo = 2.5; // USD estimate
      const laborSaved = (aiResolved * avgAgentCostPerConvo).toFixed(0);

      return {
        aiResolved,
        containmentPct,
        supportReduction: total > 0 ? ((1 - (humanResolved / total)) * 100).toFixed(1) : "0",
        actionsCompleted: actionsCompletedRes.count || 0,
        salesLeads: salesLeadsRes.count || 0,
        refundsPrevented: refundRejectedRes.count || 0,
        laborSaved,
      };
    },
    staleTime: 60000,
  });

  const impacts = [
    { label: "AI-Resolved Conversations", value: data?.aiResolved ?? 0, icon: Users, desc: `${data?.containmentPct ?? 0}% containment rate`, accent: "border-l-green-500" },
    { label: "Support Load Reduction", value: `${data?.supportReduction ?? 0}%`, icon: TrendingDown, desc: "vs human-only baseline", accent: "border-l-blue-500" },
    { label: "Actions Executed", value: data?.actionsCompleted ?? 0, icon: ShoppingCart, desc: "Automated backend actions", accent: "border-l-purple-500" },
    { label: "Sales Leads Created", value: data?.salesLeads ?? 0, icon: CreditCard, desc: "AI-generated opportunities", accent: "border-l-orange-500" },
    { label: "Refunds Prevented", value: data?.refundsPrevented ?? 0, icon: Shield, desc: "Rejected after AI assessment", accent: "border-l-red-500" },
    { label: "Estimated Labor Saved", value: `$${data?.laborSaved ?? 0}`, icon: DollarSign, desc: "30-day savings at $2.50/convo", accent: "border-l-emerald-500" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {impacts.map((imp) => (
        <Card key={imp.label} className={`bg-white border-[#E5E0D8] shadow-sm border-l-4 ${imp.accent}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-[#6B7280] mb-1">{imp.label}</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">{imp.value}</p>
                <p className="text-[10px] text-[#9CA3AF] mt-1">{imp.desc}</p>
              </div>
              <imp.icon className="h-5 w-5 text-[#9CA3AF]" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
