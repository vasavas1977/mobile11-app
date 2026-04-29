import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers, BookOpen, Zap, ScrollText, Beaker, RotateCcw } from "lucide-react";

export function ControlTowerLearning() {
  const { data } = useQuery({
    queryKey: ["control-tower-learning"],
    queryFn: async () => {
      const [clustersRes, kbMissingRes, missingActionsRes, weakPromptsRes, experimentsRes, rollbacksRes] = await Promise.all([
        supabase.from("ai_intent_clusters").select("cluster_name, conversation_count, average_ai_score, impact_score").order("impact_score", { ascending: false }).limit(5),
        (supabase as any).from("kb_improvement_candidates").select("issue_summary, impact_level, status").eq("status", "pending").order("created_at", { ascending: false }).limit(5),
        (supabase as any).from("missing_action_candidates").select("action_name, detected_intent, impact_score, occurrence_count").eq("status", "detected").order("impact_score", { ascending: false }).limit(5),
        supabase.from("prompt_versions").select("version_name, prompt_type, is_active").eq("is_active", true).order("created_at", { ascending: false }).limit(5),
        supabase.from("prompt_experiments").select("experiment_name, status, rollout_percentage, updated_at").in("status", ["running", "completed"] as any).order("updated_at", { ascending: false }).limit(5),
        (supabase as any).from("guardrail_rollback_events").select("reason, trigger_type, trigger_metric, created_at, guardrail_change_requests(change_title)").order("created_at", { ascending: false }).limit(5),
      ]);
      return {
        clusters: clustersRes.data || [],
        kbMissing: kbMissingRes.data || [],
        missingActions: missingActionsRes.data || [],
        prompts: weakPromptsRes.data || [],
        experiments: experimentsRes.data || [],
        rollbacks: rollbacksRes.data || [],
      };
    },
    staleTime: 60000,
  });

  const sections = [
    { title: "Top Failure Clusters", icon: Layers, color: "text-orange-500", items: (data?.clusters || []).map((c: any) => ({ label: c.cluster_name, meta: `${c.conversation_count} convos`, score: c.impact_score })) },
    { title: "Missing KB Topics", icon: BookOpen, color: "text-blue-500", items: (data?.kbMissing || []).map((k: any) => ({ label: k.issue_summary?.slice(0, 60), meta: k.impact_level, score: null })) },
    { title: "Missing Actions", icon: Zap, color: "text-purple-500", items: (data?.missingActions || []).map((a: any) => ({ label: a.action_name?.replace(/_/g, " "), meta: `${a.occurrence_count} hits`, score: a.impact_score })) },
    { title: "Latest Experiments", icon: Beaker, color: "text-green-600", items: (data?.experiments || []).map((e: any) => ({ label: e.experiment_name, meta: `${e.rollout_percentage}% rollout`, score: null, badge: e.status })) },
    { title: "Recent Rollbacks", icon: RotateCcw, color: "text-red-500", items: (data?.rollbacks || []).map((r: any) => ({ label: r.guardrail_change_requests?.change_title || "Unknown", meta: r.trigger_type, score: null })) },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {sections.map((s) => (
        <Card key={s.title} className="bg-white border-[#E5E0D8] shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-[#1A1A1A]">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              {s.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {!s.items.length ? (
              <p className="text-xs text-[#9CA3AF] py-3">No data yet</p>
            ) : (
              <div className="space-y-2">
                {s.items.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#F3F0EB] last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#1A1A1A] truncate">{item.label}</p>
                      <p className="text-[10px] text-[#9CA3AF]">{item.meta}</p>
                    </div>
                    {item.score != null && (
                      <span className={`text-xs font-bold ml-2 ${item.score >= 70 ? "text-red-500" : item.score >= 40 ? "text-orange-500" : "text-[#6B7280]"}`}>
                        {Number(item.score).toFixed(0)}
                      </span>
                    )}
                    {item.badge && (
                      <Badge variant="outline" className="text-[10px] ml-2 border-[#D1D5DB] bg-white text-[#374151]">{item.badge}</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
