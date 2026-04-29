import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SimStatus, SimType } from "@/types/telecom";
import type { Json } from "@/integrations/supabase/types";

interface SIMFilters {
  status?: SimStatus;
  sim_type?: SimType;
  search?: string;
  batch_id?: string;
}

export function useTelecomSIMs(filters?: SIMFilters) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["telecom-sim-cards", filters],
    queryFn: async () => {
      let q = supabase
        .from("telecom_sim_cards")
        .select("*, esim_providers(name)")
        .order("created_at", { ascending: false })
        .limit(200);

      if (filters?.status) q = q.eq("status", filters.status);
      if (filters?.sim_type) q = q.eq("sim_type", filters.sim_type);
      if (filters?.batch_id) q = q.eq("batch_id", filters.batch_id);
      if (filters?.search) {
        q = q.or(`iccid.ilike.%${filters.search}%,msisdn.ilike.%${filters.search}%,imsi.ilike.%${filters.search}%`);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const createSIM = useMutation({
    mutationFn: async (sim: {
      sim_type: SimType;
      iccid?: string;
      msisdn?: string;
      imsi?: string;
      status?: SimStatus;
      provider_id?: string;
      batch_id?: string;
      metadata?: Json;
    }) => {
      const { data, error } = await supabase.from("telecom_sim_cards").insert([sim]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["telecom-sim-cards"] }),
  });

  const updateSIM = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { data, error } = await supabase.from("telecom_sim_cards").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["telecom-sim-cards"] }),
  });

  const bulkImport = useMutation({
    mutationFn: async (sims: Array<{ sim_type: SimType; iccid?: string; msisdn?: string; imsi?: string; batch_id?: string }>) => {
      const { data, error } = await supabase.from("telecom_sim_cards").insert(sims).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["telecom-sim-cards"] }),
  });

  return { ...query, createSIM, updateSIM, bulkImport };
}

export function useTelecomSIMDetail(id: string | null) {
  return useQuery({
    queryKey: ["telecom-sim-card", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("telecom_sim_cards")
        .select("*, esim_providers(name)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}
