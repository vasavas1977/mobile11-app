import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePartnerDataMode } from "@/contexts/PartnerDataModeContext";
import { SAMPLE_AI_BATCHES } from "./outboundSampleData";
import { AdminPageHeader } from "@/components/admin/ui/AdminPageHeader";
import { MetricCard } from "./shared/MetricCard";
import { AdminStatusBadge } from "@/components/admin/ui/AdminStatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Search, FileText, CheckCircle2, XCircle, Clock } from "lucide-react";

export function ContactCenterAIMessages() {
  const { isSampleMode } = usePartnerDataMode();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");

  const { data: liveBatches, isLoading: liveLoading } = useQuery({
    queryKey: ["ai-message-batches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_generated_message_batches")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !isSampleMode,
  });

  const batches = isSampleMode ? SAMPLE_AI_BATCHES : liveBatches;
  const isLoading = isSampleMode ? false : liveLoading;

  const filtered = (batches || []).filter((b: any) => {
    if (statusFilter !== "all" && b.status !== statusFilter) return false;
    if (channelFilter !== "all" && b.channel_type !== channelFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (
        !b.intent_type?.toLowerCase().includes(s) &&
        !b.campaign_type?.toLowerCase().includes(s)
      ) return false;
    }
    return true;
  });

  const total = batches?.length || 0;
  const pending = batches?.filter((b: any) => b.status === "pending_review").length || 0;
  const approved = batches?.filter((b: any) => b.status === "approved").length || 0;
  const rejected = batches?.filter((b: any) => b.status === "rejected").length || 0;

  const statusMap: Record<string, { type: "success" | "warning" | "error" | "neutral"; label: string }> = {
    pending_review: { type: "warning", label: "Pending Review" },
    approved: { type: "success", label: "Approved" },
    rejected: { type: "error", label: "Rejected" },
    draft: { type: "neutral", label: "Draft" },
  };

  return (
    <div>
      <AdminPageHeader title="AI Generated Messages" description="Review AI-generated message variants before deployment" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard label="Total Batches" value={total} icon={Brain} />
        <MetricCard label="Pending Review" value={pending} icon={Clock} variant="warning" />
        <MetricCard label="Approved" value={approved} icon={CheckCircle2} variant="success" />
        <MetricCard label="Rejected" value={rejected} icon={XCircle} variant="danger" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by intent or campaign..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] h-8 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending_review">Pending Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder="Channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All channels</SelectItem>
            <SelectItem value="line">LINE</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Loading AI messages...</CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Brain className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No AI-generated messages</p>
            <p className="text-xs text-muted-foreground/70 mt-1">AI message batches will appear here as the optimization engine generates them.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((batch: any) => {
            const st = statusMap[batch.status] || { type: "neutral" as const, label: batch.status };
            const variants = Array.isArray(batch.generated_variants) ? batch.generated_variants : [];
            const approvedTemplates = batch.approved_template_ids || [];
            return (
              <Card key={batch.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <p className="text-sm font-medium">{batch.intent_type?.replace(/_/g, " ")}</p>
                        <AdminStatusBadge status={batch.status} type={st.type} label={st.label} showIcon={false} />
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{batch.campaign_type}</span>
                        <span>·</span>
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5">{batch.channel_type}</Badge>
                        <span>·</span>
                        <span>Tone: {batch.tone_type}</span>
                        <span>·</span>
                        <span>{variants.length} variant{variants.length !== 1 ? "s" : ""}</span>
                        {approvedTemplates.length > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-emerald-600">{approvedTemplates.length} saved to templates</span>
                          </>
                        )}
                      </div>
                      {batch.generation_engine && (
                        <p className="text-[10px] text-muted-foreground mt-1">Engine: {batch.generation_engine} {batch.prompt_version ? `· v${batch.prompt_version}` : ""}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] text-muted-foreground tabular-nums">
                        {new Date(batch.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
