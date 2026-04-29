import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Star, Users, Volume2, RotateCcw, Zap, TrendingUp, TrendingDown } from "lucide-react";

export function ControlTowerHealth() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000).toISOString();

  const { data } = useQuery({
    queryKey: ["control-tower-health"],
    queryFn: async () => {
      const [
        scoresRes, prevScoresRes,
        ratingsRes, prevRatingsRes,
        totalConvosRes, humanHandoffRes,
        deadAirRes, prevDeadAirRes,
        actionsSuccessRes, actionsFailRes,
        resolvedRes, repeatRes,
      ] = await Promise.all([
        supabase.from("ai_conversation_scores").select("composite_score").gte("created_at", thirtyDaysAgo).limit(1000),
        supabase.from("ai_conversation_scores").select("composite_score").gte("created_at", sixtyDaysAgo).lt("created_at", thirtyDaysAgo).limit(1000),
        supabase.from("conversation_ratings").select("rating").gte("created_at", thirtyDaysAgo).limit(1000),
        supabase.from("conversation_ratings").select("rating").gte("created_at", sixtyDaysAgo).lt("created_at", thirtyDaysAgo).limit(1000),
        supabase.from("conversations").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
        supabase.from("conversations").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo).not("assigned_to", "is", null),
        supabase.from("dead_air_events").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
        supabase.from("dead_air_events").select("id", { count: "exact", head: true }).gte("created_at", sixtyDaysAgo).lt("created_at", thirtyDaysAgo),
        (supabase as any).from("autonomous_actions_log").select("id", { count: "exact", head: true }).eq("action_status", "completed").gte("created_at", thirtyDaysAgo),
        (supabase as any).from("autonomous_actions_log").select("id", { count: "exact", head: true }).eq("action_status", "failed").gte("created_at", thirtyDaysAgo),
        supabase.from("conversations").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo).eq("status", "resolved").is("assigned_to", null),
        supabase.from("conversation_ratings").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo).lte("rating", 2),
      ]);

      const avg = (arr: any[], key: string) => {
        const nums = (arr || []).map(r => r[key]).filter(Boolean);
        return nums.length ? nums.reduce((a: number, b: number) => a + b, 0) / nums.length : 0;
      };

      const aiScore = avg(scoresRes.data || [], "composite_score");
      const prevAiScore = avg(prevScoresRes.data || [], "composite_score");
      const custRating = avg(ratingsRes.data || [], "rating");
      const prevCustRating = avg(prevRatingsRes.data || [], "rating");
      const total = totalConvosRes.count || 1;
      const handoff = humanHandoffRes.count || 0;
      const containment = ((total - handoff) / total) * 100;
      const handoffRate = (handoff / total) * 100;
      const deadAirRate = ((deadAirRes.count || 0) / total) * 100;
      const prevDeadAirRate = ((prevDeadAirRes.count || 0) / Math.max(1, total)) * 100;
      const actionSuccess = actionsSuccessRes.count || 0;
      const actionFail = actionsFailRes.count || 0;
      const actionRate = actionSuccess + actionFail > 0 ? (actionSuccess / (actionSuccess + actionFail)) * 100 : 0;
      const resolved = resolvedRes.count || 0;
      const repeatRate = ((repeatRes.count || 0) / total) * 100;

      return {
        aiScore: aiScore.toFixed(1),
        aiScoreDelta: (aiScore - prevAiScore).toFixed(1),
        custRating: custRating.toFixed(1),
        custRatingDelta: (custRating - prevCustRating).toFixed(2),
        containment: containment.toFixed(1),
        handoffRate: handoffRate.toFixed(1),
        deadAirRate: deadAirRate.toFixed(1),
        deadAirDelta: (deadAirRate - prevDeadAirRate).toFixed(1),
        repeatRate: repeatRate.toFixed(1),
        actionRate: actionRate.toFixed(1),
      };
    },
    staleTime: 60000,
  });

  const metrics = [
    { label: "AI Score", value: data?.aiScore ?? "—", delta: data?.aiScoreDelta, icon: Brain, suffix: "/100", good: "up" },
    { label: "Customer Rating", value: data?.custRating ?? "—", delta: data?.custRatingDelta, icon: Star, suffix: "/5", good: "up" },
    { label: "Containment", value: data?.containment ?? "—", delta: null, icon: Users, suffix: "%", good: "up" },
    { label: "Human Handoff", value: data?.handoffRate ?? "—", delta: null, icon: Users, suffix: "%", good: "down" },
    { label: "Dead Air", value: data?.deadAirRate ?? "—", delta: data?.deadAirDelta, icon: Volume2, suffix: "%", good: "down" },
    { label: "Repeat Contact", value: data?.repeatRate ?? "—", delta: null, icon: RotateCcw, suffix: "%", good: "down" },
    { label: "Action Success", value: data?.actionRate ?? "—", delta: null, icon: Zap, suffix: "%", good: "up" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      {metrics.map((m) => {
        const deltaNum = parseFloat(m.delta || "0");
        const isPositive = m.good === "up" ? deltaNum > 0 : deltaNum < 0;
        const showDelta = m.delta !== null && m.delta !== undefined && deltaNum !== 0;

        return (
          <Card key={m.label} className="bg-white border-[#E5E0D8] shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <m.icon className="h-4 w-4 text-[#9CA3AF]" />
                {showDelta && (
                  <div className={`flex items-center gap-0.5 text-xs font-medium ${isPositive ? "text-green-600" : "text-red-500"}`}>
                    {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(deltaNum).toFixed(1)}
                  </div>
                )}
              </div>
              <p className="text-2xl font-bold text-[#1A1A1A] leading-none">{m.value}<span className="text-xs font-normal text-[#9CA3AF] ml-0.5">{m.suffix}</span></p>
              <p className="text-xs text-[#6B7280] mt-1">{m.label}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
