import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { JobStatus } from "@/types/telecom";
import type { Json } from "@/integrations/supabase/types";

interface JobFilters {
  status?: JobStatus;
  sim_card_id?: string;
}

export function useTelecomJobs(filters?: JobFilters) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["telecom-jobs", filters],
    queryFn: async () => {
      let q = supabase
        .from("telecom_provider_jobs")
        .select("*, telecom_sim_cards(iccid, msisdn)")
        .order("created_at", { ascending: false })
        .limit(200);

      if (filters?.status) q = q.eq("status", filters.status);
      if (filters?.sim_card_id) q = q.eq("sim_card_id", filters.sim_card_id);

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const retryJob = useMutation({
    mutationFn: async (jobId: string) => {
      const { data, error } = await supabase
        .from("telecom_provider_jobs")
        .update({ status: "pending", attempts: 0, error_message: null, next_retry_at: null })
        .eq("id", jobId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["telecom-jobs"] }),
  });

  const createJob = useMutation({
    mutationFn: async (job: {
      job_type: string;
      sim_card_id: string;
      provider_id?: string;
      request_payload?: Json;
      created_by?: string;
    }) => {
      const { data, error } = await supabase.from("telecom_provider_jobs").insert([job]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["telecom-jobs"] }),
  });

  return { ...query, retryJob, createJob };
}
