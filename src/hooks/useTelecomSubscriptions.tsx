import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SubscriptionStatus } from "@/types/telecom";

interface SubFilters {
  status?: SubscriptionStatus;
  sim_card_id?: string;
}

export function useTelecomSubscriptions(filters?: SubFilters) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["telecom-subscriptions", filters],
    queryFn: async () => {
      let q = supabase
        .from("telecom_subscriptions")
        .select("*, telecom_plans(*), telecom_sim_cards(iccid, msisdn, status)")
        .order("created_at", { ascending: false })
        .limit(200);

      if (filters?.status) q = q.eq("status", filters.status);
      if (filters?.sim_card_id) q = q.eq("sim_card_id", filters.sim_card_id);

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const createSubscription = useMutation({
    mutationFn: async (sub: {
      sim_card_id: string;
      plan_id: string;
      assigned_user_id?: string;
      assigned_org_id?: string;
      auto_renew?: boolean;
      end_date?: string;
    }) => {
      const { data, error } = await supabase.from("telecom_subscriptions").insert(sub).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["telecom-subscriptions"] }),
  });

  const updateSubscription = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { data, error } = await supabase.from("telecom_subscriptions").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["telecom-subscriptions"] }),
  });

  return { ...query, createSubscription, updateSubscription };
}
