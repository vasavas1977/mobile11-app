import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { BookOpen, Beaker, Zap, ShieldCheck, ArrowRight } from "lucide-react";

export function ControlTowerQueue() {
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ["control-tower-queue"],
    queryFn: async () => {
      const [kbRes, expRes, actionsRes, approvalRes] = await Promise.all([
        (supabase as any).from("kb_improvement_candidates").select("id, issue_summary, impact_level, created_at").eq("status", "pending").order("created_at", { ascending: false }).limit(6),
        supabase.from("prompt_experiments").select("id, experiment_name, rollout_percentage, status").eq("status", "running" as any).order("updated_at", { ascending: false }).limit(6),
        (supabase as any).from("missing_action_candidates").select("id, action_name, impact_score, occurrence_count").eq("status", "detected").order("impact_score", { ascending: false }).limit(6),
        (supabase as any).from("approval_audit_log").select("id, domain, action_type, risk_level, created_at").eq("execution_status", "pending").order("created_at", { ascending: false }).limit(6),
      ]);
      return {
        kb: kbRes.data || [],
        experiments: expRes.data || [],
        actions: actionsRes.data || [],
        approvals: approvalRes.data || [],
      };
    },
    staleTime: 60000,
  });

  const queues = [
    {
      title: "KB Candidates", icon: BookOpen, color: "text-blue-500", badge: data?.kb?.length || 0,
      nav: "/admin/contact-center/kb-candidates",
      items: (data?.kb || []).map((k: any) => ({ label: k.issue_summary?.slice(0, 50), meta: k.impact_level })),
    },
    {
      title: "Running Experiments", icon: Beaker, color: "text-green-600", badge: data?.experiments?.length || 0,
      nav: "/admin/contact-center/experiments",
      items: (data?.experiments || []).map((e: any) => ({ label: e.experiment_name, meta: `${e.rollout_percentage}%` })),
    },
    {
      title: "Recommended Actions", icon: Zap, color: "text-purple-500", badge: data?.actions?.length || 0,
      nav: "/admin/contact-center/missing-actions",
      items: (data?.actions || []).map((a: any) => ({ label: a.action_name?.replace(/_/g, " "), meta: `Impact: ${Number(a.impact_score).toFixed(0)}` })),
    },
    {
      title: "Pending Approvals", icon: ShieldCheck, color: "text-orange-500", badge: data?.approvals?.length || 0,
      nav: "/admin/contact-center/approval-policies",
      items: (data?.approvals || []).map((p: any) => ({ label: p.action_type?.replace(/_/g, " ") || p.domain?.replace(/_/g, " "), meta: p.risk_level })),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {queues.map((q) => (
        <Card key={q.title} className="bg-white border-[#E5E0D8] shadow-sm flex flex-col">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-[#1A1A1A]">
                <q.icon className={`h-4 w-4 ${q.color}`} />
                {q.title}
              </CardTitle>
              {q.badge > 0 && (
                <Badge className="bg-orange-500 text-white text-[10px] h-5 min-w-5 justify-center">{q.badge}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3 flex-1">
            {!q.items.length ? (
              <p className="text-xs text-[#9CA3AF] py-4">All clear ✓</p>
            ) : (
              <div className="space-y-1.5">
                {q.items.slice(0, 4).map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-1 border-b border-[#F3F0EB] last:border-0">
                    <p className="text-xs text-[#1A1A1A] truncate flex-1 mr-2">{item.label}</p>
                    <span className="text-[10px] text-[#9CA3AF] shrink-0">{item.meta}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <div className="px-4 pb-3">
            <Button variant="ghost" size="sm" className="w-full text-xs text-[#6B7280] hover:text-[#1A1A1A] gap-1" onClick={() => navigate(q.nav)}>
              View all <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
