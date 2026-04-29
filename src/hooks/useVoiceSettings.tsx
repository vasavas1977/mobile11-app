import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type VoiceSettings = {
  id: number;
  gemini_voice: string;
  voice_sms_enabled: boolean;
  voice_rating_enabled: boolean;
  voice_memory_enabled: boolean;
  voice_silence_probe_guard_enabled: boolean;
  voice_rating_window_ms: number;
  voice_silence_probe_guard_ms: number;
  updated_at: string;
  updated_by: string | null;
  config_hash: string;
};

export type VoiceSettingsHistoryRow = {
  id: string;
  changed_at: string;
  changed_by: string | null;
  change_type: "create" | "update";
  snapshot: Record<string, unknown> | null;
  new_snapshot: Record<string, unknown>;
  config_hash: string;
  reason: string | null;
};

export type EditableVoiceSettings = Omit<
  VoiceSettings,
  "id" | "updated_at" | "updated_by" | "config_hash"
>;

export function useVoiceSettings() {
  const qc = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ["voice_settings"],
    queryFn: async (): Promise<VoiceSettings> => {
      const { data, error } = await supabase
        .from("voice_settings" as any)
        .select("*")
        .eq("id", 1)
        .single();
      if (error) throw error;
      return data as unknown as VoiceSettings;
    },
  });

  const historyQuery = useQuery({
    queryKey: ["voice_settings_history"],
    queryFn: async (): Promise<VoiceSettingsHistoryRow[]> => {
      const { data, error } = await supabase
        .from("voice_settings_history" as any)
        .select("*")
        .order("changed_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as unknown as VoiceSettingsHistoryRow[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (args: {
      values: EditableVoiceSettings;
      originalUpdatedAt: string;
      reason?: string | null;
    }) => {
      const { values, originalUpdatedAt, reason } = args;

      // Best-effort: surface reason to the trigger via a session GUC.
      // If the RPC is not exposed, swallow — reason will simply be null.
      try {
        await supabase.rpc("set_config" as any, {
          setting_name: "app.voice_settings_change_reason",
          new_value: reason ?? "",
          is_local: true,
        } as any);
      } catch {
        /* ignore */
      }

      const { data: userRes } = await supabase.auth.getUser();
      const updated_by = userRes?.user?.id ?? null;

      const { data, error } = await supabase
        .from("voice_settings" as any)
        .update({ ...values, updated_by } as any)
        .eq("id", 1)
        .eq("updated_at", originalUpdatedAt)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error(
          "Row was modified by another user. Please refresh and try again.",
        );
      }
      return data as unknown as VoiceSettings;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["voice_settings"] });
      qc.invalidateQueries({ queryKey: ["voice_settings_history"] });
    },
  });

  return useMemo(
    () => ({
      settings: settingsQuery.data,
      history: historyQuery.data ?? [],
      isLoading: settingsQuery.isLoading || historyQuery.isLoading,
      isError: settingsQuery.isError || historyQuery.isError,
      error: (settingsQuery.error || historyQuery.error) as Error | null,
      save: saveMutation.mutateAsync,
      isSaving: saveMutation.isPending,
      refetch: () => {
        settingsQuery.refetch();
        historyQuery.refetch();
      },
    }),
    [settingsQuery, historyQuery, saveMutation],
  );
}
