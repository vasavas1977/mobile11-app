import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useTelecomUsage(simCardId?: string) {
  return useQuery({
    queryKey: ["telecom-usage", simCardId],
    enabled: !!simCardId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("telecom_usage_records")
        .select("*")
        .eq("sim_card_id", simCardId!)
        .order("record_date", { ascending: false })
        .limit(90);
      if (error) throw error;
      return data;
    },
  });
}

export function useTelecomTransactions(simCardId?: string) {
  return useQuery({
    queryKey: ["telecom-transactions", simCardId],
    enabled: !!simCardId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("telecom_transactions")
        .select("*")
        .eq("sim_card_id", simCardId!)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });
}

export function useTelecomAllTransactions() {
  return useQuery({
    queryKey: ["telecom-all-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("telecom_transactions")
        .select("*, telecom_sim_cards(iccid, msisdn)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });
}

export function useTelecomEventLog() {
  return useQuery({
    queryKey: ["telecom-event-log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("telecom_event_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });
}

export function useTelecomPlans() {
  return useQuery({
    queryKey: ["telecom-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("telecom_plans")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
