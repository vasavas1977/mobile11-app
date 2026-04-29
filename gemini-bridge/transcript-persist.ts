/**
 * Voice transcript persistence — fire-and-forget writes to
 * public.conversation_messages so per-turn customer + bot transcripts surface
 * automatically in the existing agent conversation view.
 *
 * Mirrors the row shape used by supabase/functions/save-voice-transcript so
 * web-widget rows and bridge rows are indistinguishable downstream
 * (metadata.source = "voice", voice_session: true).
 *
 * Errors are swallowed and surfaced via bridge-logger as
 * `transcript_persist_failed`. The audio path never depends on the result.
 */

import { config } from "./config.ts";
import { logStage, type LogContext } from "./supabase-logger.ts";

export type PersistArgs = {
  conversationId: string | null;
  callSid: string;
  cid: string;
  turnId: number;
  senderType: "customer" | "bot";
  content: string;
  flags: {
    was_interrupted: boolean;
    was_force_closed: boolean;
    was_call_ended: boolean;
  };
};

export async function persistVoiceTranscript(args: PersistArgs): Promise<void> {
  const ctx: LogContext = {
    call_sid: args.callSid,
    cid: args.cid,
    conversation_id: args.conversationId ?? undefined,
  };

  if (!config.voiceTranscriptPersistEnabled) {
    logStage(ctx, "transcript_persist_skipped", null, {
      reason: "disabled_by_flag",
      sender_type: args.senderType,
    });
    return;
  }
  if (!args.conversationId) {
    logStage(ctx, "transcript_persist_skipped", null, {
      reason: "no_conversation_id",
      sender_type: args.senderType,
    });
    return;
  }
  const trimmed = (args.content ?? "").trim();
  if (!trimmed) {
    logStage(ctx, "transcript_persist_skipped", null, {
      reason: "empty_content",
      sender_type: args.senderType,
    });
    return;
  }

  const row = {
    conversation_id: args.conversationId,
    sender_type: args.senderType,
    content: trimmed,
    is_internal_note: false,
    metadata: {
      source: "voice",
      voice_session: true,
      bridge_call_sid: args.callSid,
      turn_id: args.turnId,
      was_interrupted: args.flags.was_interrupted,
      was_force_closed: args.flags.was_force_closed,
      was_call_ended: args.flags.was_call_ended,
    },
  };

  try {
    const url = `${config.supabaseUrl}/rest/v1/conversation_messages`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": config.supabaseServiceKey,
        "Authorization": `Bearer ${config.supabaseServiceKey}`,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify(row),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "<no-body>");
      logStage(ctx, "transcript_persist_failed", null, {
        sender_type: args.senderType,
        turn_id: args.turnId,
        error_summary: errText.slice(0, 200),
        status: res.status,
      });
      return;
    }

    logStage(ctx, "transcript_persisted", null, {
      sender_type: args.senderType,
      length_chars: trimmed.length,
      turn_id: args.turnId,
      was_interrupted: args.flags.was_interrupted,
      was_force_closed: args.flags.was_force_closed,
      was_call_ended: args.flags.was_call_ended,
    });
  } catch (err) {
    logStage(ctx, "transcript_persist_failed", null, {
      sender_type: args.senderType,
      turn_id: args.turnId,
      error_summary: (err as Error).message?.slice(0, 200) ?? "unknown",
    });
  }
}
