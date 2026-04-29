/**
 * Gemini Bridge Configuration
 * Environment variables and constants for the Jambonz ↔ Gemini Live bridge.
 */

export const config = {
  // Server
  port: parseInt(Deno.env.get("PORT") || "3100", 10),
  tlsCertPath: Deno.env.get("TLS_CERT_PATH") || "",
  tlsKeyPath: Deno.env.get("TLS_KEY_PATH") || "",

  // Google Gemini
  googleApiKey: Deno.env.get("GOOGLE_CLOUD_API_KEY") || "",
  geminiModel: "models/gemini-3.1-flash-live-preview",
  geminiWsBase:
    "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent",

  // Supabase
  supabaseUrl: Deno.env.get("SUPABASE_URL") || "",
  supabaseServiceKey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",

  // Voice config
  voiceName: Deno.env.get("GEMINI_VOICE") || "Aoede",
  maxKbArticles: 20,

  // Escalation
  escalationKeywords: [
    "transfer to agent",
    "speak to a person",
    "talk to human",
    "connect me to",
    "real person",
    "human agent",
    "ขอคุยกับเจ้าหน้าที่",
    "ขอคุยกับคน",
    "ต่อสายให้หน่อย",
  ],
  escalationTransferNumber: Deno.env.get("ESCALATION_TRANSFER_NUMBER") || "",

  // Bridge external URL
  bridgeExternalUrl: Deno.env.get("BRIDGE_EXTERNAL_URL") || "ws://localhost:3100",

  // Jambonz audio format
  jambonzSampleRate: 16000,
  jambonzEncoding: "L16",

  // ── Voice-native add-ons (all OFF by default; enable per-feature) ──
  smsEnabled: Deno.env.get("VOICE_SMS_ENABLED") === "1",
  ratingEnabled: Deno.env.get("VOICE_RATING_ENABLED") === "1",
  memoryEnabled: Deno.env.get("VOICE_MEMORY_ENABLED") === "1",
  silenceProbeGuardEnabled:
    Deno.env.get("VOICE_SILENCE_PROBE_GUARD_ENABLED") === "1",
  ratingWindowMs: parseInt(Deno.env.get("VOICE_RATING_WINDOW_MS") || "60000", 10),
  silenceProbeGuardMs: parseInt(
    Deno.env.get("VOICE_SILENCE_PROBE_GUARD_MS") || "5000",
    10,
  ),
  // ── Silence probe / hangup tunables (env-overridable) ──
  // Probe threshold raised from 6s → 15s and hangup from 12s → 45s to
  // accommodate natural Thai conversational pauses. See plan v2.
  voiceSilenceProbeMs: parseInt(
    Deno.env.get("VOICE_SILENCE_PROBE_MS") || "25000",
    10,
  ),
  voiceSilenceHangupMs: parseInt(
    Deno.env.get("VOICE_SILENCE_HANGUP_MS") || "45000",
    10,
  ),
  // ── plan v3: per-call probe budget + min-gap, bleed-tail close ──
  // Hard cap on probes per call (prevents probe loops even if the guard
  // logic above somehow lets multiple through).
  voiceProbeMaxPerCall: parseInt(
    Deno.env.get("VOICE_PROBE_MAX_PER_CALL") || "2",
    10,
  ),
  // Minimum wall-clock gap between two probe sends, regardless of wwid.
  voiceProbeMinGapMs: parseInt(
    Deno.env.get("VOICE_PROBE_MIN_GAP_MS") || "30000",
    10,
  ),
  // How long after the LAST outbound (Jambonz-relayed) audio frame we keep
  // the bleed window armed. Independent of vadBleedCooldownMs (which is
  // measured from Gemini-side audio receipt). Whichever closes first wins.
  voiceBleedTailCloseMs: parseInt(
    Deno.env.get("VAD_BLEED_TAIL_CLOSE_MS") || "250",
    10,
  ),
  // If raw user energy persists this long while bleed is still armed AND
  // outbound audio is stale, the bleed window is force-closed and the
  // caller's speech is accepted immediately.
  voiceBleedUserPreemptStaleMs: parseInt(
    Deno.env.get("VAD_BLEED_USER_PREEMPT_STALE_MS") || "120",
    10,
  ),

  // SMS via Supabase edge function (uses ALARIS_* secrets server-side)
  voiceSmsFnPath: "/functions/v1/voice-send-sms",

  // ── PR 1: Energy-based local VAD for PSTN turn-end detection ──
  // Auto-VAD on Gemini stays ENABLED. These are bridge-side observability
  // signals only — they fire `local_user_turn_end_timeout_fired` so we can
  // correlate "caller stopped speaking" against "Gemini answered".
  // Tunables (env-overridable, no restart of Gemini session required):
  userTurnSilenceMs: parseInt(
    Deno.env.get("USER_TURN_SILENCE_MS") || "1200",
    10,
  ),
  // Hysteresis thresholds on int16 PCM RMS. Defaults chosen for L16 16kHz
  // PSTN audio where comfort noise typically sits below ~250 RMS and real
  // speech is consistently >600 RMS. Override per environment if needed.
  vadEnergyStartRms: parseInt(
    Deno.env.get("VAD_ENERGY_START_RMS") || "650",
    10,
  ),
  vadEnergyEndRms: parseInt(
    Deno.env.get("VAD_ENERGY_END_RMS") || "350",
    10,
  ),
  // Stalled-call alert threshold. When user_turn_start fires but no
  // model_first_audio arrives within this window, log
  // `waiting_for_model_too_long` once.
  waitingForModelAlertMs: parseInt(
    Deno.env.get("WAITING_FOR_MODEL_ALERT_MS") || "10000",
    10,
  ),

  // ── PR 3: Robust local VAD (hysteresis + anti-bleed + Gemini-aware override) ──
  // A short noise/breath blip below this duration is NOT enough to enter the
  // "speaking" state — prevents the silence timer from being reset by sub-300ms
  // spikes (the documented 5.76s VAD-limbo cause).
  vadMinSpeechBurstMs: parseInt(
    Deno.env.get("VAD_MIN_SPEECH_BURST_MS") || "240",
    10,
  ),
  // While the bot is speaking AND for this cooldown window after its last
  // audio frame, apply elevated entry thresholds to suppress TTS bleed/echo.
  vadBleedCooldownMs: parseInt(
    Deno.env.get("VAD_BLEED_COOLDOWN_MS") || "600",
    10,
  ),
  // RMS boost added to VAD_START_RMS while in bleed window.
  vadBleedStartRmsBoost: parseInt(
    Deno.env.get("VAD_BLEED_START_RMS_BOOST") || "300",
    10,
  ),
  // Minimum sustained-burst requirement (ms) while in bleed window.
  vadBleedMinBurstMs: parseInt(
    Deno.env.get("VAD_BLEED_MIN_BURST_MS") || "360",
    10,
  ),
  // PR 4: end-side hysteresis boost during bleed window. Prevents TTS
  // bleed from continuously refreshing lastSpeechFrameAt and inflating
  // the silence countdown / vad_to_first_audio_ms.
  vadBleedEndRmsBoost: parseInt(
    Deno.env.get("VAD_BLEED_END_RMS_BOOST") || "150",
    10,
  ),
  // When model_first_audio arrives but local VAD still thinks the user is
  // speaking, shorten the remaining silence window to this safety value so
  // the model can cut in without being blocked by stale VAD state.
  vadModelStartedSafetyMs: parseInt(
    Deno.env.get("VAD_MODEL_STARTED_SAFETY_MS") || "500",
    10,
  ),

  // ── PR 5: Manual turn control via local VAD drive ──
  // OFF (default): Gemini server VAD is sole turn authority. Local VAD only
  //   logs telemetry; bridge never sends activityStart/activityEnd.
  // ON: Bridge disables Gemini auto-VAD in setup and becomes sole authority,
  //   sending activityStart on local speech onset and activityEnd on local
  //   silence timeout. There is no hybrid state — the setup payload is
  //   chosen at boot based on this flag.
  vadDriveTurnEnd: Deno.env.get("VAD_DRIVE_TURN_END") === "1",

  // ── Barge-in (mid-TTS user interrupt). Gated state machine that, while
  // turnState=model_speaking, looks for a sustained user-energy burst above
  // an elevated threshold. On confirmation the bridge sends activityStart
  // (required in manual-drive mode) + flushes a short preroll buffer so
  // Gemini hears the interrupt onset, then fires `interrupted` → killAudio.
  // Single env kill switch reverts to today's pre-barge behavior. ──
  bargeInEnabled: (Deno.env.get("BARGE_IN_ENABLED") ?? "1") === "1",
  bargeMinBurstMs: parseInt(
    Deno.env.get("BARGE_MIN_BURST_MS") || "360",
    10,
  ),
  bargeRmsBoost: parseInt(
    Deno.env.get("BARGE_RMS_BOOST") || "400",
    10,
  ),
  bargePrerollMs: parseInt(
    Deno.env.get("BARGE_PREROLL_MS") || "300",
    10,
  ),
  // First-word lockout: ignore barge attempts in the first N ms of the
  // bot's reply so the very first TTS frame's echo cannot pre-empt the
  // bot before it's said anything.
  bargeLockoutAfterModelStartMs: parseInt(
    Deno.env.get("BARGE_LOCKOUT_AFTER_MODEL_START_MS") || "400",
    10,
  ),
  // During bleed cooldown we DON'T disable barge-in; we only raise the
  // bar (extra RMS + extra burst time) to avoid echo-driven false trips.
  bargeBleedRmsBoost: parseInt(
    Deno.env.get("BARGE_BLEED_RMS_BOOST") || "200",
    10,
  ),
  bargeBleedBurstBoostMs: parseInt(
    Deno.env.get("BARGE_BLEED_BURST_BOOST_MS") || "120",
    10,
  ),

  // ── Phase 4: remote config (control plane). OFF by default. ──
  useRemoteConfig: Deno.env.get("USE_REMOTE_CONFIG") === "1",
  remoteConfigPollMs: parseInt(
    Deno.env.get("REMOTE_CONFIG_POLL_MS") || "60000",
    10,
  ),

  // ── Voice transcript persistence ──
  // When ON (default), every finalized customer + bot turn is written to
  // public.conversation_messages so transcripts surface in the existing agent
  // conversation view and in post-hoc analysis. PDPA gate: flip to "0" per
  // VPS until consent text is verified to cover verbatim transcript retention.
  voiceTranscriptPersistEnabled:
    (Deno.env.get("VOICE_TRANSCRIPT_PERSIST_ENABLED") ?? "1") === "1",
};

export function validateConfig(): void {
  const missing: string[] = [];

  if (!config.googleApiKey) missing.push("GOOGLE_CLOUD_API_KEY");
  if (!config.supabaseUrl) missing.push("SUPABASE_URL");
  if (!config.supabaseServiceKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");

  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
}
