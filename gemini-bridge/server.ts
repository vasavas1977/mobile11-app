/**
 * Gemini Bridge Server
 * Accepts Jambonz WebSocket audio connections and bridges them to Gemini Live API.
 */

import { config, validateConfig } from "./config.ts";
import { GeminiSession } from "./gemini-session.ts";
import {
  fetchVoiceBotConfig,
  fetchKbArticles,
  findOrCreateContact,
  createConversation,
  createCallLog,
  updateCallLog,
  logMessage,
  startBridgeLogger,
  logStage,
  logEvent,
  setActiveCallCount,
  BUILD_VERSION,
  BUNDLE_HASH,
} from "./supabase-logger.ts";
import { persistVoiceTranscript } from "./transcript-persist.ts";
// +emergency-recovery: remote-config dependency removed (Option B).
// Effective config = env / source-default only. Mirrors +logs-1 behavior.
function getEffectiveConfig() {
  return {
    voice_name: config.voiceName,
    sms_enabled: config.smsEnabled,
    rating_enabled: config.ratingEnabled,
    memory_enabled: config.memoryEnabled,
    silence_probe_guard_enabled: config.silenceProbeGuardEnabled,
    rating_window_ms: config.ratingWindowMs,
    silence_probe_guard_ms: config.silenceProbeGuardMs,
  };
}

const VOICE_BEHAVIOR_RULES = `
You are Mobile11's friendly voice assistant on a phone call. The caller cannot see any screen. They can only hear you.

## VOICE-ONLY RULES (THIS IS A PHONE CALL — NOT TEXT CHAT)
- Respond in 1-3 short sentences. Then pause to let the caller respond. Do not give long explanations unless explicitly asked.
- Never say "screen", "tap", "click", "see the page", or "use the prompt that will appear". The caller cannot see anything.
- Do not read full URLs aloud unless the caller explicitly asks. If they ask, offer to send a link by SMS or email instead.
- Ask ONE question at a time. Wait for the answer. Confirm if uncertain. Then ask the next question. Never stack multiple questions in one turn.
- If you need a moment to find information or think, say "one moment" before pausing. Never go silent for more than 2 seconds without speaking.
- Speak naturally. Use brief filler like "Sure", "Got it", "Let me check".
- If the caller speaks Thai, respond in Thai. If English, respond in English.
- In Thai: refer to yourself as "น้อง" and the caller as "พี่", use ค่ะ/คะ particles.
- CURRENCY: Thai speakers → ฿ (THB, multiply USD×35). English/other → $ (USD).

## PDPA CONSENT — REQUIRED BEFORE CAPTURING NAME OR PHONE
Before asking for the caller's name and callback number, say:
  "I'd like to take your name and a callback number to reach you if we get disconnected. We'll only use this to follow up on this conversation. Is that okay?"
- If the caller agrees → proceed. The bridge will log consent.
- If the caller declines or changes the subject → drop the request, continue helping. Do not re-ask in this call.

## IDENTITY CAPTURE — USE CALLER ID, DO NOT FORCE PHONE RECITATION
After consent, ask for the name first, then confirm the callback number:
  1. "May I have your name?" (wait, confirm spelling if unclear)
  2. "Thank you. Is this number — [read the caller-ID digits one by one] — the best one to reach you if we get disconnected?"
- If they confirm → done.
- If they want a different number → ask once, capture digit-by-digit, read it back to confirm.

## READ-BACK RULES
- Phone numbers: digit by digit ("zero-six-six-...").
- Email: letter by letter, use phonetic alphabet for ambiguous letters ("B as in Bravo, A as in Alpha").
- Always confirm before storing: "Is that correct?"

## ANTI-HALLUCINATION (CRITICAL)
NEVER INVENT: loyalty program details, refund policy specifics, payment methods, carrier names, technical specs, prices, discount percentages, or company policies.
If unsure: "I'm not sure about that specific detail, but our support team can help you with that."

## ABOUT MOBILE11
Mobile11 is a travel eSIM provider. We sell digital SIM cards (eSIMs) that travelers install on their phones before or during trips abroad. No physical SIM swapping needed.

## CONVERSATION FLOW
1. After greeting, ask whether the caller wants to buy an eSIM or needs support.
2. If buying → ask: "Have you used an eSIM before?"
3. If no/unsure → brief 1-sentence eSIM explanation, then ask the device model.
4. Device check → confirm compatibility briefly. If incompatible: sympathize and offer a human agent.
5. Ask destination AND trip duration in one short turn.
6. Quote price per day (Value ~$2/day, Unlimited ~$4/day for their duration). Offer to send a link by SMS or email.
7. Only recommend a specific plan if the caller asks "which one should I pick?"
   - Heavy usage → Unlimited. Regular → Value. Mention Lite only if asked for the cheapest.

## RATING — VERBAL CAPTURE AT WRAP-UP
When the caller says they're done, ask one quick question:
  "Before we end, may I ask one quick question — on a scale of 1 to 5, where 5 is excellent, how would you rate this call?"
- If they give a number (English or Thai) → confirm verbally: "Got it, you said 4. Thank you!"
- If they give a qualitative answer ("pretty good") → map to the closest number with confirmation: "Sounds like you'd say a 4, is that right?"
- If they decline or stay silent twice → thank them and end the call. Do not push.

## HUMAN AGENT HANDOFF
If the caller wants a real person, say you'll connect them with the support team and they'll get back to them soon.
`;

type ActiveCallState = {
  gemini: GeminiSession;
  callLogId: string | null;
  conversationId: string | null;
  contactId: string | null;
  callerNumber: string;
  startTime: number;
  aiTranscriptBuffer: string;
  // +voice-native-sms-rating: per-call (NOT global) — never use globalThis.
  smsLinkSent: boolean;
  ratingPromptedAt: number;        // 0 = not prompted
  ratingCaptured: boolean;
  memoryConsentGranted: boolean;
};

const activeCalls = new Map<string, ActiveCallState>();

// ── Voice-native helpers (all guarded by config flags at call sites) ──

const SMS_LINK_KEYWORDS = [
  "send you a link", "send a link", "send the link", "i'll send",
  "i will send", "text you the link", "sms you the link",
  "ส่งลิงก์", "ส่งลิ้ง", "ส่งให้ทาง sms", "ส่งทางเอสเอ็มเอส",
];
const RATING_PROMPT_KEYWORDS = [
  "scale of 1 to 5", "rate this call", "how would you rate",
  "ให้คะแนน", "ประเมินการโทร",
];
const MEMORY_CONSENT_GRANT = [
  "yes", "yeah", "sure", "okay", "ok", "that's fine", "go ahead",
  "ตกลง", "ได้", "ได้ค่ะ", "ได้ครับ", "ยินดี",
];
const MEMORY_CONSENT_PROMPT = [
  "is that okay", "is that ok", "okay with you",
  "ตกลงไหม", "ได้ไหม",
];

function detectsAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k.toLowerCase()));
}

// Extract a 1-5 rating from finalized user text (English numerals, words, Thai).
function parseRating(text: string): number | null {
  const lower = text.toLowerCase().trim();
  const numMatch = lower.match(/\b([1-5])\b/);
  if (numMatch) return parseInt(numMatch[1], 10);
  const wordMap: Record<string, number> = {
    one: 1, two: 2, three: 3, four: 4, five: 5,
    "หนึ่ง": 1, "สอง": 2, "สาม": 3, "สี่": 4, "ห้า": 5,
  };
  for (const [w, n] of Object.entries(wordMap)) {
    if (lower.includes(w)) return n;
  }
  return null;
}

async function sendVoiceSms(toNumber: string, message: string, cid: string): Promise<boolean> {
  try {
    const url = `${config.supabaseUrl}${config.voiceSmsFnPath}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.supabaseServiceKey}`,
        apikey: config.supabaseServiceKey,
      },
      body: JSON.stringify({ to: toNumber, message }),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) {
      console.warn(`[sms] cid=${cid} send_failed status=${res.status}`);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`[sms] cid=${cid} send_error ${(err as Error).message}`);
    return false;
  }
}


async function fetchCoreKnowledge(): Promise<string> {
  try {
    const res = await fetch(
      `${config.supabaseUrl}/rest/v1/kb_articles?select=title,content&is_published=eq.true&category=eq.bot-core-knowledge&order=display_order.asc`,
      {
        headers: {
          "Content-Type": "application/json",
          apikey: config.supabaseServiceKey,
          Authorization: `Bearer ${config.supabaseServiceKey}`,
        },
      },
    );

    const articles: Array<{ title: string; content: string }> = await res.json();
    if (!articles?.length) return "";

    return `\n\n## CORE PRODUCT KNOWLEDGE\n${articles.map((a) => a.content).join("\n\n")}`;
  } catch (err) {
    console.error("[Bridge] Failed to fetch core knowledge:", err);
    return "";
  }
}

// +logs-3 prompt-size cap: prevents per-turn think-time from ballooning when the
// admin grows the KB. Total system prompt target is ~12k chars. We never drop the
// behavior rules or core knowledge — only KB articles, longest first.
const MAX_PROMPT_CHARS = 12000;

function capKbContext(kbContext: string, baseChars: number, cid: string): string {
  if (!kbContext) return kbContext;
  const budget = MAX_PROMPT_CHARS - baseChars;
  if (kbContext.length <= budget) {
    console.log(`[stage] prompt_size cid=${cid} kb_kept=full kb_chars=${kbContext.length} base_chars=${baseChars}`);
    return kbContext;
  }
  // Articles are joined by "\n\n### " — split on that marker.
  const parts = kbContext.split(/\n\n### /);
  // parts[0] is the leading "## KNOWLEDGE BASE ARTICLES\nUse..." preamble (no leading "### ").
  const preamble = parts.shift() ?? "";
  // Each subsequent entry is an article body without the leading "### ".
  const articles = parts.map((p, i) => ({ idx: i, body: "### " + p }));
  // Drop longest first until under budget (leave preamble alone).
  articles.sort((a, b) => b.body.length - a.body.length);
  let dropped: number[] = [];
  let kept = articles.slice();
  while (kept.reduce((s, a) => s + a.body.length, preamble.length) > budget && kept.length > 1) {
    const removed = kept.shift();
    if (removed) dropped.push(removed.idx);
  }
  kept.sort((a, b) => a.idx - b.idx);
  const out = [preamble, ...kept.map((a) => a.body)].join("\n\n");
  console.log(`[stage] prompt_size cid=${cid} kb_kept=${kept.length} kb_dropped_idx=[${dropped.join(",")}] base_chars=${baseChars} final_kb_chars=${out.length}`);
  return out;
}

async function buildSystemInstruction(cid: string = "boot"): Promise<string> {
  const [voiceConfig, coreKnowledge] = await Promise.all([
    fetchVoiceBotConfig(),
    fetchCoreKnowledge(),
  ]);

  const language = voiceConfig?.greeting_language || "en";
  const rawKb = await fetchKbArticles(language);
  const customPrompt = voiceConfig?.greeting_message || "";
  const baseChars =
    VOICE_BEHAVIOR_RULES.length + coreKnowledge.length + customPrompt.length + 64;
  const kbContext = capKbContext(rawKb, baseChars, cid);

  return `${VOICE_BEHAVIOR_RULES}${coreKnowledge}\n\n## CUSTOM GREETING\n${customPrompt}${kbContext}`;
}

function checkEscalation(text: string): boolean {
  const lower = text.toLowerCase();
  return config.escalationKeywords.some((kw) => lower.includes(kw.toLowerCase()));
}

function handleJambonzAppConnection(ws: WebSocket): void {
  console.log("[Bridge] New Jambonz app protocol connection");

  ws.onmessage = (event: MessageEvent) => {
    if (typeof event.data !== "string") return;

    try {
      const msg = JSON.parse(event.data);
      console.log(`[Bridge] Received message type: ${msg.type}`);

      if (msg.type === "session:new") {
        const callSid = msg.call_sid || msg.callSid || "";
        const from = msg.from || "";
        const to = msg.to || "";
        const msgid = msg.msgid || "";

        // Phase 1 instrumentation: capture declared media format from Jambonz session:new.
        // Jambonz nests this under different keys depending on version; try the common ones.
        const sipObj = msg.sip || msg.session || {};
        const declaredCodec =
          msg.codec || msg.encoding || sipObj.codec || sipObj.encoding || "unknown";
        const declaredSampleRate =
          msg.sample_rate || msg.sampleRate || sipObj.sample_rate || sipObj.sampleRate || "unknown";

        console.log(
          `[Bridge] session:new for call ${callSid}: ${from} → ${to} declared_codec=${declaredCodec} declared_sample_rate=${declaredSampleRate}`,
        );
        console.log(
          `[audio] declared_codec=${declaredCodec} callSid=${callSid}`,
        );
        console.log(
          `[audio] declared_sample_rate=${declaredSampleRate} callSid=${callSid}`,
        );

        const audioUrl =
          `${config.bridgeExternalUrl}/audio?callSid=${encodeURIComponent(callSid)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&dc=${encodeURIComponent(String(declaredCodec))}&dr=${encodeURIComponent(String(declaredSampleRate))}`;

        const ack = {
          type: "ack",
          msgid,
          data: [
            {
              verb: "listen",
              url: audioUrl,
              bidirectionalAudio: {
                enabled: true,
                streaming: true,
                sampleRate: 16000,
              },
            },
          ],
        };

        console.log(`[Bridge] Sending ack with listen verb → ${audioUrl}`);
        ws.send(JSON.stringify(ack));
      }
    } catch (err) {
      console.error("[Bridge] Failed to parse app protocol message:", err);
    }
  };

  ws.onerror = (err) => {
    console.error("[Bridge] App protocol WS error:", err);
  };

  ws.onclose = () => {
    console.log("[Bridge] App protocol WS closed");
  };
}

async function handleAudioConnection(
  jambonzWs: WebSocket,
  urlParams: URLSearchParams,
): Promise<void> {
  const callSid = urlParams.get("callSid") || `call-${Date.now()}`;
  const callerNumber = urlParams.get("from") || "unknown";
  const didNumber = urlParams.get("to") || "unknown";
  const cid = (crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`).slice(0, 8);

  const declaredCodec = urlParams.get("dc") || "unknown";
  const declaredSampleRate = urlParams.get("dr") || "unknown";

  let gemini: GeminiSession | null = null;
  let geminiReady = false;
  let firstJambonzAudioLogged = false;
  let firstGeminiAudioLogged = false;
  let firstPstnForwardLogged = false;
  let firstInboundForwardedLogged = false;
  let inboundFrameCount = 0;
  let lastInboundFrameAt = 0;
  const audioBuffer: Uint8Array[] = [];
  const t0 = Date.now();
  const elapsed = () => Date.now() - t0;

  // ── +logs-3-redux-minimal: greeting + per-turn telemetry state ───────────
  // Suppression contract:
  //   suppressInboundAudio = true from boot.
  //   Released on FIRST of:
  //     - onFirstModelAudio  (PRIMARY — greeting actually playing)
  //     - GREETING_SUPPRESS_MS timeout (BACKUP — bounded dead-air)
  //   No watchdog/retry chain here — that lived in +logs-4 and broke calls.
  const GREETING_SUPPRESS_MS = parseInt(
    Deno.env.get("GREETING_AUDIO_SUPPRESS_MS") ?? "1000", 10,
  );
  let suppressInboundAudio = true;
  let suppressArmedAt = 0;
  let initialGreetingSent = false;          // per-call, NOT per ws-session
  let greetingWatchdog: number | null = null;
  let greetingSentAt = 0;
  let geminiReadyAt = 0;

  // PR 1: explicit per-call state machine. All transitions go through
  // setCallState() so we get a single audit trail.
  // (Named `bridgeState` — not `callState` — to avoid shadowing collisions
  //  with `const callState = activeCalls.get(callSid)` inside callbacks.)
  type CallState =
    | "idle"
    | "bot_speaking"
    | "user_speaking"
    | "waiting_for_model"
    | "model_speaking";
  let bridgeState: CallState = "idle";

  // Legacy turn-state names retained for the existing watchdogs/silence-probe
  // logic that branch on them. Kept in sync with callState below.
  type TurnState =
    | "waiting_for_user"
    | "user_speaking"
    | "waiting_for_model"
    | "model_speaking"
    | "interrupted";
  let turnState: TurnState = "waiting_for_user";
  let turnId = 0;
  let userTurnStartedAt = 0;
  let userTurnEndedAt = 0;
  let modelTurnStartedAt = 0;
  let modelBytesThisTurn = 0;
  let lastInboundAudioAt = 0;
  let lastModelAudioAt = 0;
  let lastProgressLogAt = 0;
  let telemetryRowsThisCall = 0;
  const TELEMETRY_ROW_CAP = 200;

  // PR 1: energy-based local VAD state.
  // Auto-VAD on Gemini is still authoritative for turn boundaries; this is
  // bridge-side observability + a deterministic local end-of-speech signal
  // that does NOT depend on inbound frames stopping (PSTN sends comfort noise
  // continuously).
  const VAD_START_RMS = config.vadEnergyStartRms;
  const VAD_END_RMS = config.vadEnergyEndRms;
  const SILENCE_MS = config.userTurnSilenceMs;
  const WAIT_MODEL_ALERT_MS = config.waitingForModelAlertMs;
  // PR 3: hysteresis + anti-bleed tunables.
  const VAD_MIN_BURST_MS = config.vadMinSpeechBurstMs;
  const VAD_BLEED_COOLDOWN_MS = config.vadBleedCooldownMs;
  const VAD_BLEED_START_BOOST = config.vadBleedStartRmsBoost;
  const VAD_BLEED_MIN_BURST_MS = config.vadBleedMinBurstMs;
  const VAD_BLEED_END_BOOST = config.vadBleedEndRmsBoost; // PR 4

  let vadInSpeech = false;
  let vadCandidateSince = 0; // when above-start started accumulating
  let lastSpeechFrameAt = 0;
  let lastVoicedFrameAt = 0; // any frame >= END_RMS (telemetry)
  let userTurnEndTimeoutFiredAt = 0;
  // PR 4: ensure exactly one user_turn_end per turn_id.
  let userTurnEndFiredForTurn = -1;
  // PR 4: count duplicate user_turn_end attempts that were suppressed.
  let duplicateTurnEndSuppressed = 0;
  const VAD_MODEL_STARTED_SAFETY_MS = config.vadModelStartedSafetyMs;
  // VAD state machine: idle -> candidate (sustained burst gate) -> speech.
  let waitingForModelAlertedAt = 0;
  let lastInboundForwardedAt = 0;
  let lastGeminiEventAt = 0;
  // PR 3: per-turn diagnostics counters (reset on user_turn_start).
  let silenceTimerResetCount = 0;
  let bleedSuppressedFrames = 0;
  let entryRejectedShortBursts = 0;

  // ── Barge-in state (mid-TTS user interrupt) ──
  // Active only while turnState === "model_speaking". A `barge_candidate`
  // sub-state is opened on the first qualifying RMS frame; if energy stays
  // above the (bleed-aware) threshold for `effBurstMs`, we send activityStart
  // + flush the preroll ring + forward live audio. Gemini then fires
  // `interrupted` → existing onInterrupted() kills TTS via Jambonz.
  let bargeCandidateSince = 0;
  let bargeTriggeredAt = 0; // ms; 0 = no live barge in flight
  // Fixed-size circular preroll buffer (no GC churn). Sized at
  // BARGE_PREROLL_MS / 20ms-per-frame. Always populated while the model is
  // speaking so the start of an interrupting word is preserved.
  const PREROLL_FRAMES = Math.max(1, Math.ceil(config.bargePrerollMs / 20));
  const prerollBuf: (Uint8Array | null)[] = new Array(PREROLL_FRAMES).fill(null);
  let prerollHead = 0;
  let prerollCount = 0;
  const prerollPush = (b: Uint8Array): void => {
    prerollBuf[prerollHead] = b;
    prerollHead = (prerollHead + 1) % PREROLL_FRAMES;
    if (prerollCount < PREROLL_FRAMES) prerollCount += 1;
  };
  const prerollClear = (): void => {
    for (let i = 0; i < PREROLL_FRAMES; i++) prerollBuf[i] = null;
    prerollHead = 0;
    prerollCount = 0;
  };
  // Returns { frames, bytes } actually flushed. Caller must have a live
  // gemini session; we read in chronological (oldest → newest) order.
  const prerollFlushTo = (
    sink: (b: Uint8Array) => void,
  ): { frames: number; bytes: number } => {
    let frames = 0;
    let bytes = 0;
    const start = (prerollHead - prerollCount + PREROLL_FRAMES) % PREROLL_FRAMES;
    for (let i = 0; i < prerollCount; i++) {
      const f = prerollBuf[(start + i) % PREROLL_FRAMES];
      if (f) {
        sink(f);
        frames += 1;
        bytes += f.byteLength;
      }
    }
    prerollClear();
    return { frames, bytes };
  };

  // PR 5.1: post-end audio-energy window. Opens at user_turn_end, closes on
  // whichever comes first: model_first_audio, 5s timeout, or next user_turn_start.
  // Used to detect whether local VAD declared end-of-speech while the caller
  // was actually still talking (premature cutoff) — language-agnostic, physics
  // based. The accumulated stats are merged into the vad_vs_transcription_parity
  // row when Gemini's transcription completes (or when the window closes
  // without a transcription).
  type PostEndWindow = {
    turnId: number;
    openedAt: number;
    voicedMs: number;
    currentRunMs: number;
    currentRunStartedAt: number;
    maxContiguousMs: number;
    maxRms: number;
    modelStartedWhileVoiced: boolean | null; // null = model didn't start in window
    closedReason: "model_first_audio" | "5s_timeout" | "next_turn_started" | null;
    closedAt: number;
  };
  const POST_END_WINDOW_MS = 5000;
  // Voice "frame" duration assumption for accumulation. Jambonz L16 frames are
  // typically 20ms at 16kHz (640 bytes); compute from byteLength to be safe.
  const POST_END_VOICED_MS_PER_BYTE = 1000 / (config.jambonzSampleRate * 2); // ms per byte
  let postEndWindow: PostEndWindow | null = null;
  // Snapshot of the last closed window, keyed by turn_id, so the parity row
  // emitted from onUserTurnComplete can pick up the evidence even if the
  // window closed before the transcription final arrived.
  const closedPostEndWindows = new Map<number, PostEndWindow>();

  const closePostEndWindow = (
    reason: "model_first_audio" | "5s_timeout" | "next_turn_started",
    nowMs: number,
  ): void => {
    if (!postEndWindow) return;
    // Flush any in-progress run.
    if (postEndWindow.currentRunMs > 0) {
      if (postEndWindow.currentRunMs > postEndWindow.maxContiguousMs) {
        postEndWindow.maxContiguousMs = postEndWindow.currentRunMs;
      }
    }
    if (reason === "model_first_audio") {
      postEndWindow.modelStartedWhileVoiced = postEndWindow.currentRunMs > 0;
    } else {
      postEndWindow.modelStartedWhileVoiced = false;
    }
    postEndWindow.closedReason = reason;
    postEndWindow.closedAt = nowMs;
    // Cap the snapshot map to avoid unbounded growth (long calls).
    closedPostEndWindows.set(postEndWindow.turnId, postEndWindow);
    if (closedPostEndWindows.size > 16) {
      const firstKey = closedPostEndWindows.keys().next().value;
      if (firstKey !== undefined) closedPostEndWindows.delete(firstKey);
    }
    postEndWindow = null;
  };


  // PR 2: per-call counters for model_reply_latency telemetry. sessionStartedAt
  // is anchored at gemini_session_ready (see onReady callback below) so
  // session_age_ms reflects time since the WS was usable, not since SIP answer.
  let sessionStartedAt = 0;
  let completedModelTurns = 0;
  let cumulativeModelAudioBytes = 0;
  let cumulativeUserAudioBytes = 0;
  // PR 2: latency thresholds for real-time spike detection. Buckets are
  // emitted alongside model_reply_latency AND as a separate warn-level
  // model_reply_threshold_breach row when ≥10s, so spikes are alertable
  // without scanning the latency stream.
  const latencyBucket = (ms: number): "ok" | "5s" | "10s" | "15s" => {
    if (ms >= 15000) return "15s";
    if (ms >= 10000) return "10s";
    if (ms >= 5000) return "5s";
    return "ok";
  };

  // +emergency-recovery: post-ready diagnostic state (telemetry-only)
  let greetingSendOkAt = 0;
  let firstAudioReceivedAt = 0;
  let audioRelayFirstAttemptLogged = false;
  let audioRelayFirstOkLogged = false;
  let noAudioAfterReadyTimer: number | null = null;

  // Wraps logStage with per-call cap. Critical stages always pass through;
  // low-priority stages (progress, gap alerts) are dropped after the cap.
  const CRITICAL_STAGES = new Set([
    "sip_answer", "audio_ws_connected", "first_inbound_audio", "first_outbound_audio",
    "gemini_session_start", "gemini_session_ready", "gemini_session_end", "call_hangup",
    "user_turn_start", "user_turn_end", "model_first_audio", "model_turn_complete",
    "model_interrupted", "greeting_sent", "greeting_suppress_canceled",
    "silence_timeout_hangup", "rating_captured", "consent_granted", "consent_declined",
    // PR 1
    "user_speech_energy_start", "local_user_turn_end_timeout_fired",
    "waiting_for_model_too_long", "call_state_transition",
    // plan v2: protect drive-mode + probe lifecycle from cap drops
    "activity_start_sent", "activity_start_failed",
    "activity_end_sent", "activity_end_failed",
    "silence_probe_sent", "silence_probe_suppressed", "silence_probe_guarded",
    // Barge-in: protect the rare-but-critical events from telemetry cap.
    // (barge_candidate_open intentionally NOT critical — high frequency.)
    "barge_in_triggered", "barge_in_suppressed_lockout",
    "barge_in_suppressed_short_burst", "barge_to_interrupted_latency_ms",
  ]);
  // ── plan v2: probe-origin tagging state ──
  // When a silence probe is in flight, downstream model_first_audio /
  // model_turn_complete / call_state_transition logs are tagged with
  // origin:"probe" so they don't pollute real-turn analytics. The current
  // turn_id is preserved (zeroing it would break joins).
  let probeReplyInFlight = false;
  let probeReplyWindowId = -1;
  const PROBE_TAGGED_STAGES = new Set([
    "model_first_audio", "model_turn_complete", "model_reply_latency",
    "model_reply_threshold_breach", "call_state_transition",
  ]);

  const tlog = (stage: string, extra?: Record<string, unknown>): void => {
    if (telemetryRowsThisCall >= TELEMETRY_ROW_CAP && !CRITICAL_STAGES.has(stage)) {
      return;
    }
    if (telemetryRowsThisCall === TELEMETRY_ROW_CAP) {
      logStage(_logCtx, "telemetry_cap_reached", elapsed(), { cap: TELEMETRY_ROW_CAP });
    }
    telemetryRowsThisCall += 1;
    let merged = extra;
    if (probeReplyInFlight && PROBE_TAGGED_STAGES.has(stage)) {
      merged = { ...(extra || {}), origin: "probe", waiting_window_id: probeReplyWindowId };
    }
    logStage(_logCtx, stage, elapsed(), merged);
  };

  // PR 1: single audited entry point for all call-state transitions.
  const setCallState = (next: CallState, reason: string): void => {
    if (next === bridgeState) return;
    const prev = bridgeState;
    bridgeState = next;
    tlog("call_state_transition", {
      from: prev, to: next, reason, turn_id: turnId,
    });
  };

  // RMS energy of an L16 PCM little-endian frame (Int16 samples).
  const rmsOfL16 = (buf: Uint8Array): number => {
    const samples = buf.byteLength >> 1;
    if (samples === 0) return 0;
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    let sumSq = 0;
    // Sub-sample for cost: every 4th sample is plenty for hysteresis.
    let counted = 0;
    for (let i = 0; i < samples; i += 4) {
      const s = view.getInt16(i << 1, true);
      sumSq += s * s;
      counted += 1;
    }
    return Math.sqrt(sumSq / Math.max(1, counted));
  };

  // +logs-4 cancelGreetingRetries removed (watchdog deleted).

  // State-aware silence watchdog. Runs every 1s, only alerts in waiting_for_model
  // (>3s) or model_speaking (>5s with no audio). Never alerts when the caller is
  // mid-thought or before the bot has spoken — those silences are normal.
  const watchdogHandle = setInterval(() => {
    const now = Date.now();
    if (turnState === "waiting_for_model" && userTurnEndedAt > 0) {
      const gap = now - userTurnEndedAt;
      if (gap > 3000 && (now - lastProgressLogAt) > 5000) {
        lastProgressLogAt = now;
        tlog("turn_gap_alert", {
          turn_id: turnId, gap_ms: gap, state: turnState, prior_event: "user_turn_end",
        });
      }
    } else if (turnState === "model_speaking" && lastModelAudioAt > 0) {
      const gap = now - lastModelAudioAt;
      if (gap > 5000 && (now - lastProgressLogAt) > 5000) {
        lastProgressLogAt = now;
        tlog("turn_gap_alert", {
          turn_id: turnId, gap_ms: gap, state: turnState, prior_event: "model_audio",
        });
      }
    }
  }, 1000);

  // ── plan v2: silence detection backed by waiting-window identity ──
  // Probe + hangup timers read `waitingWindowStartedAt`, which only resets
  // when a fresh waiting window opens (real user speech happened). A probe
  // and its model reply do NOT extend the hangup deadline.
  let waitingWindowId = 0;
  let probeSentForWaitingWindowId = -1;
  let waitingWindowStartedAt = Date.now();
  let realUserSpeechSinceLastWindow = false;
  // Legacy alias mirrors waitingWindowStartedAt for any external readers.
  let lastWaitForUserStart = waitingWindowStartedAt;

  // ── plan v3: per-call probe budget + min-gap, outbound-audio bleed close ──
  let probeBudgetUsed = 0;
  let lastProbeSentAt = 0;
  let lastOutboundAudioAt = 0;
  let lastUserSpeechEnergyAt = 0;
  let lastUserTurnStartAt = 0;
  let bleedForceClosedAt = 0;
  const PROBE_MAX_PER_CALL = config.voiceProbeMaxPerCall;
  const PROBE_MIN_GAP_MS = config.voiceProbeMinGapMs;
  const BLEED_TAIL_CLOSE_MS = config.voiceBleedTailCloseMs;
  const BLEED_USER_PREEMPT_STALE_MS = config.voiceBleedUserPreemptStaleMs;
  // plan v3: most-recent finishReason captured from Gemini's wire dump.
  let lastFinishReason: string | null = null;

  // Returns true if bleed accounting should be considered force-closed for
  // this frame (outbound audio is stale enough). Used to gate the elevated
  // start/end thresholds and the model_speaking inbound-drop guard.
  const isBleedForceClosed = (now: number): boolean => {
    if (lastOutboundAudioAt === 0) return false;
    return (now - lastOutboundAudioAt) >= BLEED_TAIL_CLOSE_MS;
  };

  const PROBE_MS = config.voiceSilenceProbeMs;
  const HANGUP_MS = config.voiceSilenceHangupMs;

  const silenceHandle = setInterval(() => {
    if (turnState !== "waiting_for_user") return;
    const now = Date.now();
    const sinceWait = now - waitingWindowStartedAt;

    if (sinceWait > HANGUP_MS) {
      tlog("silence_timeout_hangup", {
        ms_silent: sinceWait,
        waiting_window_id: waitingWindowId,
      });
      const cs = activeCalls.get(callSid);
      if (cs?.callLogId) {
        void updateCallLog(cs.callLogId, { call_end_reason: "silence_timeout" });
      }
      try { jambonzWs.close(); } catch { /* ignore */ }
      return;
    }

    if (sinceWait <= PROBE_MS) return;

    if (probeSentForWaitingWindowId === waitingWindowId) {
      tlog("silence_probe_suppressed", {
        reason: "already_sent_this_waiting_window",
        ms_silent: sinceWait,
        waiting_window_id: waitingWindowId,
      });
      return;
    }

    // ── plan v3: multi-signal probe guard ──
    // Block the probe if any active/recent user-activity signal is present,
    // OR if the per-call probe budget / min-gap is exhausted.
    const blockReason = ((): string | null => {
      if (turnState !== "waiting_for_user") return "not_idle";
      if (vadInSpeech) return "user_active";
      if (vadCandidateSince !== 0) return "vad_candidate_pending";
      if (lastUserSpeechEnergyAt > 0 && (now - lastUserSpeechEnergyAt) < 1500) {
        return "recent_speech_energy";
      }
      if (lastUserTurnStartAt > 0 && (now - lastUserTurnStartAt) < 1500) {
        return "recent_user_turn_start";
      }
      if (lastVoicedFrameAt > 0 && (now - lastVoicedFrameAt) < 1500) {
        return "recent_voiced_frame";
      }
      if (probeBudgetUsed >= PROBE_MAX_PER_CALL) return "budget_exhausted";
      if (lastProbeSentAt > 0 && (now - lastProbeSentAt) < PROBE_MIN_GAP_MS) {
        return "min_gap_blocked";
      }
      return null;
    })();
    if (blockReason !== null) {
      tlog("silence_probe_blocked", {
        reason: blockReason,
        ms_silent: sinceWait,
        waiting_window_id: waitingWindowId,
        ms_since_speech_energy: lastUserSpeechEnergyAt > 0 ? now - lastUserSpeechEnergyAt : null,
        ms_since_user_turn_start: lastUserTurnStartAt > 0 ? now - lastUserTurnStartAt : null,
        ms_since_voiced_frame: lastVoicedFrameAt > 0 ? now - lastVoicedFrameAt : null,
        probe_budget_used: probeBudgetUsed,
        probe_budget_max: PROBE_MAX_PER_CALL,
        ms_since_last_probe: lastProbeSentAt > 0 ? now - lastProbeSentAt : null,
      });
      return;
    }

    // Legacy bleed-cooldown guard (kept as an additional safety net).
    const eff = getEffectiveConfig();
    if (
      eff.silence_probe_guard_enabled &&
      lastModelAudioAt > 0 &&
      (now - lastModelAudioAt) < eff.silence_probe_guard_ms
    ) {
      tlog("silence_probe_suppressed", {
        reason: "model_recently_spoke_guard",
        ms_silent: sinceWait,
        ms_since_model_audio: now - lastModelAudioAt,
        waiting_window_id: waitingWindowId,
      });
      return;
    }

    // Cancel any pending local turn-end accounting that might race the probe.
    vadCandidateSince = 0;
    userTurnEndTimeoutFiredAt = 0;

    probeSentForWaitingWindowId = waitingWindowId;
    probeReplyInFlight = true;
    probeReplyWindowId = waitingWindowId;
    probeBudgetUsed += 1;
    lastProbeSentAt = now;
    tlog("silence_probe_sent", {
      ms_silent: sinceWait,
      waiting_window_id: waitingWindowId,
      probe_budget_used: probeBudgetUsed,
      probe_budget_max: PROBE_MAX_PER_CALL,
    });
    gemini?.sendInitialGreeting?.(
      "[BRIDGE_EVENT] The caller has been silent for several seconds. " +
      "In one short sentence, ask gently if they are still there. " +
      "Use the same language they used before.",
    );
  }, 1000);
  // Make sure the watchdogs die with the call.
  const cleanupWatchdogs = () => {
    try { clearInterval(watchdogHandle as unknown as number); } catch { /* ignore */ }
    try { clearInterval(silenceHandle as unknown as number); } catch { /* ignore */ }
    if (greetingWatchdog !== null) {
      try { clearTimeout(greetingWatchdog as unknown as number); } catch { /* ignore */ }
      greetingWatchdog = null;
    }
  };

  console.log(`[stage] audio_ws_connected cid=${cid} callSid=${callSid} elapsed_ms=0`);
  const _logCtx = { call_sid: callSid, cid, caller_number: callerNumber, did_number: didNumber };
  logStage(_logCtx, "sip_answer", 0);
  logStage(_logCtx, "audio_ws_connected", 0);
  console.log(`[stage] jambonz_ws_open cid=${cid} callSid=${callSid} from=${callerNumber} to=${didNumber} declared_codec=${declaredCodec} declared_sample_rate=${declaredSampleRate}`);

  void (async () => {
    try {
      console.log(`[stage] prompt_cache_miss cid=${cid} elapsed_ms=${elapsed()}`); // Phase 1: no cache yet, always miss
      const systemInstruction = await buildSystemInstruction(cid);
      console.log(`[stage] prompt_ready cid=${cid} elapsed_ms=${elapsed()} prompt_chars=${systemInstruction.length}`);

      const contactId = await findOrCreateContact(callerNumber);
      const conversationId = await createConversation(contactId);
      const callLogId = await createCallLog({
        callId: callSid,
        callerNumber,
        didNumber,
        conversationId,
      });

      console.log(`[stage] gemini_connect_start cid=${cid} elapsed_ms=${elapsed()}`);

      let flushCompleteAt = 0;

      // +gemini-3.1-setup-fix: attach the payload-shape marker so the monitor
      // can attribute call outcomes to the active setup contract. Shape value
      // is computed inside GeminiSession on ws.onopen, so we read it back via
      // a deferred tlog right after gemini is constructed below. The
      // gemini_session_start row stays as the chronological anchor.
      logStage(_logCtx, "gemini_session_start", elapsed(), {
        setup_payload_shape: "v3.1.greeting=realtimeInput.text+vad=explicit-thai",
      });
      gemini = new GeminiSession(systemInstruction, {
        cid,
        getElapsedMs: elapsed,
        getMsSinceFlush: () => (flushCompleteAt === 0 ? -1 : Date.now() - flushCompleteAt),
        onFirstModelAudio: () => {
          // PRIMARY suppression cancel — greeting is actually playing now.
          if (suppressInboundAudio) {
            const ms = Date.now() - suppressArmedAt;
            suppressInboundAudio = false;
            tlog("greeting_suppress_canceled", { reason: "audio", ms_elapsed: ms });
          }
          if (greetingWatchdog !== null) {
            try { clearTimeout(greetingWatchdog as unknown as number); } catch { /* ignore */ }
            greetingWatchdog = null;
          }
          // PR 1: turnId is now incremented in user_turn_start (energy VAD).
          // For the greeting itself there is no preceding user turn, so we
          // bump turnId here too if it has not already advanced.
          if (turnId === 0) turnId = 1;
          modelTurnStartedAt = Date.now();
          lastModelAudioAt = modelTurnStartedAt;
          lastGeminiEventAt = modelTurnStartedAt;
          modelBytesThisTurn = 0;
          // PR 3: Gemini-aware override. If local VAD still thinks the user
          // is speaking when the model starts, shorten the remaining silence
          // window to a small safety value so we don't sit in VAD limbo.
          if (vadInSpeech && lastSpeechFrameAt > 0) {
            const wouldFireAt = lastSpeechFrameAt + SILENCE_MS;
            const newFireAt = modelTurnStartedAt + VAD_MODEL_STARTED_SAFETY_MS;
            if (newFireAt < wouldFireAt) {
              // Pull lastSpeechFrameAt back so the timer condition fires sooner.
              lastSpeechFrameAt = newFireAt - SILENCE_MS;
              tlog("vad_model_started_safety_override", {
                turn_id: turnId,
                safety_ms: VAD_MODEL_STARTED_SAFETY_MS,
              });
            }
          }
          const vadToFirstAudio = userTurnEndedAt > 0 ? modelTurnStartedAt - userTurnEndedAt : null;
          turnState = "model_speaking";
          setCallState("model_speaking", "model_first_audio");
          waitingForModelAlertedAt = 0;
          // Reset barge state for the new model turn — fresh preroll, no
          // stale candidate, no in-flight barge from a previous turn.
          bargeCandidateSince = 0;
          bargeTriggeredAt = 0;
          prerollClear();
          tlog("model_first_audio", {
            turn_id: turnId,
            vad_to_first_audio_ms: vadToFirstAudio,
          });
          // PR 5.1: close any open post-end audio-energy window. Records
          // whether voiced caller audio was active at the moment the model
          // started speaking (= caller was cut off mid-utterance).
          closePostEndWindow("model_first_audio", modelTurnStartedAt);
          // PR 2: corrected latency telemetry. Two clocks because the prior
          // single metric (user_turn_start → model_first_audio) was contaminated
          // by the caller's own utterance length and bridge turn-end delay.
          // ms_since_user_turn_end is the apples-to-apples "model think time"
          // (null when energy VAD never fired user_turn_end — explicit, not inferred).
          const _msSinceStart =
            userTurnStartedAt > 0 ? modelTurnStartedAt - userTurnStartedAt : 0;
          const _msSinceEnd =
            userTurnEndedAt > 0 ? modelTurnStartedAt - userTurnEndedAt : null;
          const _bucket = latencyBucket(_msSinceStart);
          tlog("model_reply_latency", {
            turn_id: turnId,
            ms_since_user_turn_start: _msSinceStart,
            ms_since_user_turn_end: _msSinceEnd,
            session_age_ms:
              sessionStartedAt > 0 ? modelTurnStartedAt - sessionStartedAt : 0,
            completed_model_turns: completedModelTurns,
            cumulative_model_audio_bytes: cumulativeModelAudioBytes,
            cumulative_user_audio_bytes: cumulativeUserAudioBytes,
            total_token_count: gemini?.lastTotalTokenCount ?? null,
            threshold_breach: _bucket,
          });
          if (_bucket === "10s" || _bucket === "15s") {
            tlog("model_reply_threshold_breach", {
              turn_id: turnId,
              bucket: _bucket,
              ms_since_user_turn_start: _msSinceStart,
              ms_since_user_turn_end: _msSinceEnd,
              session_age_ms:
                sessionStartedAt > 0 ? modelTurnStartedAt - sessionStartedAt : 0,
              completed_model_turns: completedModelTurns,
              total_token_count: gemini?.lastTotalTokenCount ?? null,
            });
          }
        },
        onAudio: (pcmBinary: Uint8Array) => {
          modelBytesThisTurn += pcmBinary.length;
          cumulativeModelAudioBytes += pcmBinary.length;
          lastModelAudioAt = Date.now();
          lastGeminiEventAt = lastModelAudioAt;
          if (firstAudioReceivedAt === 0) firstAudioReceivedAt = Date.now();
          if (!firstGeminiAudioLogged) {
            logStage(_logCtx, "first_outbound_audio", elapsed());
            firstGeminiAudioLogged = true;
            console.log(`[stage] first_model_audio_received cid=${cid} bytes=${pcmBinary.length} elapsed_ms=${elapsed()}`);
            console.log(`[stage] first_gemini_audio cid=${cid} bytes=${pcmBinary.length} elapsed_ms=${elapsed()}`);
          }
          // +emergency-recovery: audio relay attempt (telemetry-only, fail-open)
          if (!audioRelayFirstAttemptLogged) {
            audioRelayFirstAttemptLogged = true;
            try { tlog("audio_relay_first_attempt", { chunk_size_bytes: pcmBinary.length }); } catch { /* fail-open */ }
          }
          if (jambonzWs.readyState === WebSocket.OPEN) {
            try {
              jambonzWs.send(pcmBinary);
              // plan v3: track outbound audio independently of Gemini-side
              // receipt. Bleed-tail force-close keys off this timestamp.
              lastOutboundAudioAt = Date.now();
              if (!audioRelayFirstOkLogged) {
                audioRelayFirstOkLogged = true;
                try {
                  tlog("audio_relay_first_ok", {
                    chunk_size_bytes: pcmBinary.length,
                    ms_since_audio_received: Date.now() - firstAudioReceivedAt,
                  });
                } catch { /* fail-open */ }
              }
            } catch (relayErr) {
              try {
                tlog("audio_relay_error", {
                  error_message: (relayErr as Error)?.message ?? "send_error",
                });
              } catch { /* fail-open */ }
            }
            if (!firstPstnForwardLogged) {
              firstPstnForwardLogged = true;
              console.log(`[stage] first_model_audio_sent_to_pstn cid=${cid} bytes=${pcmBinary.length} elapsed_ms=${elapsed()}`);
              console.log(`[stage] first_pstn_forward cid=${cid} bytes=${pcmBinary.length} elapsed_ms=${elapsed()}`);
            }
          }
          // Sampled progress every ~5s, and only after the turn is already > 3s.
          if (modelTurnStartedAt > 0) {
            const dur = Date.now() - modelTurnStartedAt;
            if (dur > 3000 && (Date.now() - lastProgressLogAt) > 5000) {
              lastProgressLogAt = Date.now();
              tlog("model_turn_progress", {
                turn_id: turnId, bytes_so_far: modelBytesThisTurn,
              });
            }
          }
        },
        onTranscript: (text: string) => {
          const callState = activeCalls.get(callSid);
          if (callState) {
            callState.aiTranscriptBuffer += `${text} `;
          }

          if (checkEscalation(text) && config.escalationTransferNumber) {
            console.log(`[Bridge] Escalation detected in call ${callSid} cid=${cid}`);

            if (jambonzWs.readyState === WebSocket.OPEN) {
              jambonzWs.send(JSON.stringify({ type: "killAudio" }));
              jambonzWs.send(
                JSON.stringify({
                  type: "refer",
                  referTo: `sip:${config.escalationTransferNumber}@localhost`,
                  referredBy: didNumber,
                }),
              );
            }

            const cs = activeCalls.get(callSid);
            if (cs?.callLogId) {
              void updateCallLog(cs.callLogId, {
                escalated_to: config.escalationTransferNumber,
                escalation_reason: "Customer requested human agent",
              });
            }
          }
        },
        onInterrupted: (partialModelText: string) => {
          const _interruptedAt = Date.now();
          // Persist partial bot text captured pre-clear, so we can later
          // distinguish "barge-in cut a stalled fragment" from "barge-in cut
          // active content". Fire-and-forget; never blocks audio path.
          if (partialModelText && partialModelText.trim()) {
            const cs = activeCalls.get(callSid);
            void persistVoiceTranscript({
              conversationId: cs?.conversationId ?? null,
              callSid,
              cid,
              turnId,
              senderType: "bot",
              content: partialModelText,
              flags: {
                was_interrupted: true,
                was_force_closed: false,
                was_call_ended: false,
              },
            });
          }
          if (jambonzWs.readyState === WebSocket.OPEN) {
            jambonzWs.send(JSON.stringify({ type: "killAudio" }));
          }
          // Barge-in is real user activity: open a fresh waiting window so
          // probe gating and hangup deadline both reset.
          tlog("model_interrupted", {
            turn_id: turnId, partial_audio_bytes: modelBytesThisTurn,
            // Was this `interrupted` triggered by our explicit barge path?
            triggered_by_barge_in: bargeTriggeredAt > 0,
          });
          // Latency from local barge confirmation → Gemini's `interrupted`
          // frame. Real-user perceived stop time is this + Jambonz killAudio
          // (typically <50ms). Lower is better; >800ms warrants tuning.
          if (bargeTriggeredAt > 0) {
            tlog("barge_to_interrupted_latency_ms", {
              turn_id: turnId,
              latency_ms: _interruptedAt - bargeTriggeredAt,
            });
            bargeTriggeredAt = 0;
          }
          bargeCandidateSince = 0;
          prerollClear();
          turnState = "waiting_for_user";
          setCallState("user_speaking", "model_interrupted");
          modelTurnStartedAt = 0;
          modelBytesThisTurn = 0;
          waitingWindowId += 1;
          waitingWindowStartedAt = Date.now();
          lastWaitForUserStart = waitingWindowStartedAt;
          realUserSpeechSinceLastWindow = false;
          probeReplyInFlight = false;
          tlog("vad_state_transition", {
            from: "model_speaking", to: "waiting_for_user",
            reason: "model_interrupted_by_user",
            turn_id: turnId, waiting_window_id: waitingWindowId,
          });
          waitingForModelAlertedAt = 0;
          lastGeminiEventAt = Date.now();
        },
        onTurnComplete: () => {
          // PR 2: count BEFORE the next turn's latency row reads it.
          completedModelTurns += 1;
          const wasProbeReply =
            probeReplyInFlight && probeReplyWindowId === waitingWindowId;
          const speechMs = userTurnEndedAt > userTurnStartedAt
            ? userTurnEndedAt - userTurnStartedAt
            : 0;
          const vadToFirst = (userTurnEndedAt > 0 && modelTurnStartedAt > 0)
            ? modelTurnStartedAt - userTurnEndedAt
            : null;
          const speakMs = modelTurnStartedAt > 0 ? Date.now() - modelTurnStartedAt : 0;
          const totalMs = userTurnStartedAt > 0 ? Date.now() - userTurnStartedAt : 0;
          tlog("model_turn_complete", {
            turn_id: turnId,
            speech_ms: speechMs,
            vad_to_first_audio_ms: vadToFirst,
            model_speak_ms: speakMs,
            turn_total_ms: totalMs,
            total_audio_bytes: modelBytesThisTurn,
            completion_reason: "natural",
            finish_reason: lastFinishReason,
          });
          lastFinishReason = null;
          turnState = "waiting_for_user";
          setCallState("idle", "model_turn_complete");
          userTurnStartedAt = 0;
          userTurnEndedAt = 0;
          modelTurnStartedAt = 0;
          modelBytesThisTurn = 0;
          waitingForModelAlertedAt = 0;
          // Barge state belongs to the model_speaking phase only.
          bargeCandidateSince = 0;
          bargeTriggeredAt = 0;
          prerollClear();

          // plan v2: bump waiting-window ONLY if the just-completed turn was
          // a real reply to user speech. A probe reply must NOT open a fresh
          // window (otherwise probes would re-fire forever).
          if (wasProbeReply) {
            // Probe lifecycle ending: clear in-flight tag, but keep the
            // window id and waitingWindowStartedAt so hangup keeps counting.
            probeReplyInFlight = false;
            probeReplyWindowId = -1;
            tlog("vad_state_transition", {
              from: "model_speaking", to: "waiting_for_user",
              reason: "probe_reply_complete",
              turn_id: turnId, waiting_window_id: waitingWindowId,
            });
          } else if (realUserSpeechSinceLastWindow) {
            waitingWindowId += 1;
            waitingWindowStartedAt = Date.now();
            lastWaitForUserStart = waitingWindowStartedAt;
            realUserSpeechSinceLastWindow = false;
            tlog("vad_state_transition", {
              from: "model_speaking", to: "waiting_for_user",
              reason: "real_turn_complete",
              turn_id: turnId, waiting_window_id: waitingWindowId,
            });
          } else {
            // Neither probe nor real-user-confirmed turn — defensive: still
            // open a fresh window so we don't deadlock on stale state, but
            // log it so the anomaly is visible.
            waitingWindowId += 1;
            waitingWindowStartedAt = Date.now();
            lastWaitForUserStart = waitingWindowStartedAt;
            tlog("vad_state_transition", {
              from: "model_speaking", to: "waiting_for_user",
              reason: "turn_complete_no_user_speech_recorded",
              turn_id: turnId, waiting_window_id: waitingWindowId,
            });
          }

          // Guarded VAD recovery: only force idle if not a live barge-in.
          // Barge-in detection: vadInSpeech currently true with a recent
          // above-end frame implies the caller is talking right now.
          const recentVoiced = lastSpeechFrameAt > 0 &&
            (Date.now() - lastSpeechFrameAt) < 200;
          if (!(vadInSpeech && recentVoiced)) {
            userTurnEndTimeoutFiredAt = 0;
          }
          lastGeminiEventAt = Date.now();

          const callState = activeCalls.get(callSid);
          if (callState?.conversationId && callState.aiTranscriptBuffer.trim()) {
            void logMessage(
              callState.conversationId,
              "ai",
              callState.aiTranscriptBuffer.trim(),
            );
            callState.aiTranscriptBuffer = "";
          }
        },
        onModelTurnComplete: (text: string) => {
          if (!text) return;
          const cs = activeCalls.get(callSid);
          if (!cs) return;

          // Persist finalized bot turn to conversation_messages (fire-and-forget).
          void persistVoiceTranscript({
            conversationId: cs.conversationId,
            callSid,
            cid,
            turnId,
            senderType: "bot",
            content: text,
            flags: {
              was_interrupted: false,
              was_force_closed: false,
              was_call_ended: false,
            },
          });

          const eff = getEffectiveConfig();

          // SMS link intent: bot offered to send a link → fire SMS once per call.
          if (
            eff.sms_enabled &&
            !cs.smsLinkSent &&
            detectsAny(text, SMS_LINK_KEYWORDS) &&
            cs.callerNumber && cs.callerNumber !== "unknown"
          ) {
            cs.smsLinkSent = true;
            const msg =
              "Mobile11 eSIM — explore plans here: https://mobile11.com/esim";
            void sendVoiceSms(cs.callerNumber, msg, cid).then((ok) => {
              tlog("sms_link_sent", { ok, to: cs.callerNumber });
            });
          }

          // Rating prompt detection — opens capture window.
          if (
            eff.rating_enabled &&
            !cs.ratingCaptured &&
            cs.ratingPromptedAt === 0 &&
            detectsAny(text, RATING_PROMPT_KEYWORDS)
          ) {
            cs.ratingPromptedAt = Date.now();
            tlog("rating_prompt_detected", {});
          }
        },
        onUserTurnComplete: (text: string) => {
          // Persist finalized customer turn to conversation_messages
          // (fire-and-forget). Done before parity telemetry so persistence
          // is not coupled to local-VAD bookkeeping.
          if (text && text.trim()) {
            const cs = activeCalls.get(callSid);
            void persistVoiceTranscript({
              conversationId: cs?.conversationId ?? null,
              callSid,
              cid,
              turnId,
              senderType: "customer",
              content: text,
              flags: {
                was_interrupted: false,
                was_force_closed: false,
                was_call_ended: false,
              },
            });
          }
          // PR 5.1 parity telemetry: Gemini finalized the user transcription.
          // Merge it with the post-end audio-energy window so we can judge
          // whether local VAD declared end-of-speech while the caller was
          // actually still talking (premature cutoff). Audio-energy evidence
          // is language- and ASR-agnostic; char counts intentionally left out
          // of the gating rule.
          const _txnNow = Date.now();
          const _localEnd = userTurnEndedAt;
          // Pull the post-end window for this turn. It may be:
          //  - already closed (model_first_audio / next_turn_started / 5s_timeout)
          //  - still open (transcription final arrived before any closer) → close it now
          let win = closedPostEndWindows.get(turnId);
          if (!win && postEndWindow && postEndWindow.turnId === turnId) {
            // Force-close so the snapshot is consistent with this row.
            closePostEndWindow("5s_timeout", _txnNow);
            win = closedPostEndWindows.get(turnId);
          }
          const voicedMsAfter = win ? Math.round(win.voicedMs) : 0;
          const maxContiguousAfter = win
            ? Math.round(Math.max(win.maxContiguousMs, win.currentRunMs))
            : 0;
          const maxRmsAfter = win ? win.maxRms : 0;
          const modelStartedWhileVoiced =
            win && win.closedReason === "model_first_audio"
              ? !!win.modelStartedWhileVoiced
              : false;
          const closedReason = win ? win.closedReason : null;
          const localVadPrematureSuspected =
            maxContiguousAfter >= 300 ||
            voicedMsAfter >= 500 ||
            modelStartedWhileVoiced === true;

          tlog("vad_vs_transcription_parity", {
            turn_id: turnId,
            mode: config.vadDriveTurnEnd ? "drive" : "observe",
            local_user_turn_end_at: _localEnd || null,
            gemini_transcription_final_at: _txnNow,
            // delta_ms positive = local fired AFTER gemini (late);
            //          negative = local fired BEFORE gemini (would cut user off).
            // Kept for forensics; NOT used by the premature-suspected rule.
            delta_ms: _localEnd > 0 ? _localEnd - _txnNow : null,
            speech_ms: _localEnd > userTurnStartedAt ? _localEnd - userTurnStartedAt : null,
            silence_timer_reset_count: silenceTimerResetCount,
            bleed_suppressed_frames: bleedSuppressedFrames,
            text_chars: text?.length ?? 0,
            // ── PR 5.1: physics-based post-end evidence ──
            voiced_ms_after_local_end: voicedMsAfter,
            max_contiguous_voiced_ms_after_local_end: maxContiguousAfter,
            max_rms_after_local_end: maxRmsAfter,
            model_started_while_post_end_voiced: modelStartedWhileVoiced,
            post_end_window_closed_reason: closedReason,
            local_vad_premature_suspected: localVadPrematureSuspected,
          });
          // One-shot consume; freeing memory.
          closedPostEndWindows.delete(turnId);


          if (!text) return;
          const cs = activeCalls.get(callSid);
          if (!cs) return;

          const eff = getEffectiveConfig();

          // Rating capture — only inside the configured window after prompt.
          if (
            eff.rating_enabled &&
            !cs.ratingCaptured &&
            cs.ratingPromptedAt > 0 &&
            (Date.now() - cs.ratingPromptedAt) <= eff.rating_window_ms
          ) {
            const r = parseRating(text);
            if (r !== null) {
              cs.ratingCaptured = true;
              tlog("rating_captured", { rating: r });
              if (cs.callLogId) {
                void updateCallLog(cs.callLogId, {
                  csat_rating: r,
                  csat_source: "voice_inline",
                } as Record<string, unknown>);
              }
            }
          }

          // Memory consent — explicit grant after a PDPA-prompt bot turn.
          if (
            eff.memory_enabled &&
            !cs.memoryConsentGranted &&
            detectsAny(text, MEMORY_CONSENT_GRANT) &&
            detectsAny(cs.aiTranscriptBuffer, MEMORY_CONSENT_PROMPT)
          ) {
            cs.memoryConsentGranted = true;
            tlog("consent_granted", {});
          }
        },
        onError: (error: string) => {
          console.error(`[Bridge] Gemini error for ${callSid} cid=${cid}:`, error);
          // +emergency-recovery: surface ws errors to logs
          try {
            tlog("gemini_ws_error", {
              error_message: error,
              last_event_type: gemini ? (gemini as unknown as { lastEventType?: string }).lastEventType ?? "none" : "none",
            });
          } catch { /* fail-open */ }
        },
        // +emergency-recovery: post-ready Gemini observability hooks
        onGeminiFirstServerEvent: (eventType: string) => {
          lastGeminiEventAt = Date.now();
          try {
            tlog("gemini_first_server_event", {
              event_type: eventType,
              ms_since_ready: geminiReadyAt > 0 ? Date.now() - geminiReadyAt : -1,
            });
          } catch { /* fail-open */ }
        },
        onModelTextOnly: (textLen: number) => {
          try {
            tlog("model_text_only", { turn_id: turnId, text_len: textLen });
          } catch { /* fail-open */ }
        },
        onGeminiMalformedEvent: (errMsg: string, rawSample: string) => {
          try {
            tlog("gemini_malformed_event", { error: errMsg, raw_sample_first_200_chars: rawSample });
          } catch { /* fail-open */ }
        },
        onFinishReasonWireDump: (payload: Record<string, unknown>) => {
          try {
            tlog("finish_reason_wire_dump", { ...payload, turn_id: turnId });
            const fr = payload.finish_reason;
            if (typeof fr === "string" && fr.length > 0) {
              lastFinishReason = fr;
            }
          } catch { /* fail-open */ }
        },
        onReady: () => {
          console.log(`[stage] gemini_setup_complete cid=${cid} callSid=${callSid} elapsed_ms=${elapsed()}`);
          logStage(_logCtx, "gemini_session_ready", elapsed());
          console.log(`[stage] gemini_ready cid=${cid} callSid=${callSid} elapsed_ms=${elapsed()}`);
          geminiReady = true;
          geminiReadyAt = Date.now();
          // PR 2: anchor session age at the moment Gemini is usable.
          sessionStartedAt = geminiReadyAt;

          if (audioBuffer.length > 0) {
            console.log(`[buffer] cold_start_drop cid=${cid} dropped_frames=${audioBuffer.length}`);
            audioBuffer.length = 0;
          }
          if (!initialGreetingSent && gemini) {
            initialGreetingSent = true;
            suppressInboundAudio = true;
            suppressArmedAt = Date.now();
            greetingWatchdog = setTimeout(() => {
              if (suppressInboundAudio) {
                suppressInboundAudio = false;
                tlog("greeting_suppress_canceled", { reason: "timeout", ms: GREETING_SUPPRESS_MS });
              }
            }, GREETING_SUPPRESS_MS) as unknown as number;

            // +emergency-recovery: instrument greeting send
            const greetingPrompt =
              `[BRIDGE_EVENT] Call connected. Greet the caller warmly, introduce yourself as ` +
              `Mobile11's voice assistant, and ask how you can help — one short sentence. ` +
              `Match the caller's expected language based on prior context.`;
            const greetingTurnId = turnId + 1;
            try { tlog("greeting_send_attempt", { turn_id: greetingTurnId, prompt_len: greetingPrompt.length }); } catch { /* fail-open */ }
            try {
              gemini.sendInitialGreeting(greetingPrompt);
              greetingSendOkAt = Date.now();
              try { tlog("greeting_send_ok", { turn_id: greetingTurnId }); } catch { /* fail-open */ }
            } catch (sendErr) {
              try {
                tlog("gemini_ws_error", {
                  error_message: `greeting_send_failed: ${(sendErr as Error)?.message ?? "unknown"}`,
                  last_event_type: "pre-greeting",
                });
              } catch { /* fail-open */ }
            }
            greetingSentAt = Date.now();
            tlog("greeting_sent", { suppress_ms: GREETING_SUPPRESS_MS });
          }

          // Console-only short watchdog (existing).
          setTimeout(() => {
            if (!firstGeminiAudioLogged) {
              console.warn(`[stage] no_gemini_audio_3s cid=${cid} callSid=${callSid} — setup ok but no audio frame received`);
            }
          }, 3000);

          // +emergency-recovery: one-shot 8s no-audio diagnostic.
          // TELEMETRY-ONLY — no recovery, no state mutation, no retry.
          noAudioAfterReadyTimer = setTimeout(() => {
            noAudioAfterReadyTimer = null;
            if (firstAudioReceivedAt > 0) return;
            try {
              const lastEv = gemini ? (gemini as unknown as { lastEventType?: string }).lastEventType ?? "none" : "none";
              tlog("no_audio_after_ready", {
                ms_since_ready: geminiReadyAt > 0 ? Date.now() - geminiReadyAt : -1,
                last_event_type: lastEv,
                text_received: false,
              });
            } catch { /* fail-open */ }
          }, 8000) as unknown as number;
        },
        onClose: (code?: number, reason?: string, lastEventType?: string, audioReceived?: boolean) => {
          console.log(`[stage] gemini_closed cid=${cid} callSid=${callSid} elapsed_ms=${elapsed()} firstAudio=${firstGeminiAudioLogged} code=${code ?? "n/a"}`);
          // +emergency-recovery: rich ws_close payload
          try {
            tlog("gemini_ws_close", {
              code: code ?? null,
              reason: reason ?? "",
              last_event_type: lastEventType ?? "none",
              ms_since_ready: geminiReadyAt > 0 ? Date.now() - geminiReadyAt : -1,
              audio_received: !!audioReceived,
            });
          } catch { /* fail-open */ }
          if (noAudioAfterReadyTimer !== null) {
            try { clearTimeout(noAudioAfterReadyTimer as unknown as number); } catch { /* ignore */ }
            noAudioAfterReadyTimer = null;
          }
          logStage(_logCtx, "gemini_session_end", elapsed());
          void cleanupCall(callSid);
        },
      });

      activeCalls.set(callSid, {
        gemini,
        callLogId,
        conversationId,
        contactId,
        callerNumber,
        startTime: Date.now(),
        aiTranscriptBuffer: "",
        smsLinkSent: false,
        ratingPromptedAt: 0,
        ratingCaptured: false,
        memoryConsentGranted: false,
      });

      setActiveCallCount(activeCalls.size);
      await gemini.connect();
    } catch (err) {
      console.error(`[Bridge] Init failed for ${callSid} cid=${cid}:`, err);
      logEvent("error", _logCtx, `Init failed: ${(err as Error).message}`);
      if (jambonzWs.readyState === WebSocket.OPEN) {
        jambonzWs.send(JSON.stringify({ type: "disconnect" }));
      }
    }
  })();

  jambonzWs.onmessage = (event: MessageEvent) => {
    if (event.data instanceof ArrayBuffer || event.data instanceof Uint8Array) {
      const buffer =
        event.data instanceof ArrayBuffer ? new Uint8Array(event.data) : event.data;

      const now = Date.now();

      if (!firstJambonzAudioLogged) {
        logStage(_logCtx, "first_inbound_audio", elapsed());
        firstJambonzAudioLogged = true;
        console.log(`[stage] first_inbound_frame_seen cid=${cid} bytes=${buffer.length} elapsed_ms=${elapsed()}`);
        console.log(`[stage] first_jambonz_audio cid=${cid} bytes=${buffer.length} elapsed_ms=${elapsed()}`);
      }

      // Phase 1 instrumentation: log first 5 frames with byte length + inter-frame cadence.
      if (inboundFrameCount < 5) {
        inboundFrameCount += 1;
        const cadence = lastInboundFrameAt === 0 ? 0 : now - lastInboundFrameAt;
        console.log(
          `[audio] frame_${inboundFrameCount} cid=${cid} bytes=${buffer.length} elapsed_from_prev_ms=${cadence} declared_codec=${declaredCodec} declared_sample_rate=${declaredSampleRate} elapsed_ms=${elapsed()}`,
        );
        lastInboundFrameAt = now;
      } else {
        lastInboundFrameAt = now;
      }

      // +logs-3: drop inbound frames while greeting suppression is armed.
      if (suppressInboundAudio) {
        return;
      }

      // ── PR 3: Robust local VAD with hysteresis, sustained-burst gate,
      // and TTS bleed suppression. Auto-VAD on Gemini stays authoritative
      // for prompting the model — we do NOT send activityStart/activityEnd.
      const _now = Date.now();
      const rms = rmsOfL16(buffer);

      // Bleed window: bot is currently producing audio OR finished within the
      // cooldown. Apply elevated entry thresholds so echo/bleed cannot cause
      // a phantom user_turn_start or reset the silence timer.
      // ── plan v3: bleed force-close, keyed off lastOutboundAudioAt ──
      // The Gemini-side cooldown (lastModelAudioAt) keeps the window armed
      // even when no PCM has actually been relayed to Jambonz for a while.
      // If outbound audio is stale we drop bleed suppression early.
      const outboundTailIdle =
        turnState !== "model_speaking" && isBleedForceClosed(_now);
      // User-speech preempt: caller is shouting through the tail. If raw
      // energy is voiced AND outbound has been quiet for >120ms, kill bleed.
      const rawAboveEnd = rms >= VAD_END_RMS;
      const outboundStale =
        lastOutboundAudioAt > 0 &&
        (_now - lastOutboundAudioAt) >= BLEED_USER_PREEMPT_STALE_MS;
      const userPreempt =
        turnState !== "model_speaking" && rawAboveEnd && outboundStale;
      const inBleedWindow =
        !outboundTailIdle && !userPreempt && (
          turnState === "model_speaking" ||
          (lastModelAudioAt > 0 && (_now - lastModelAudioAt) <= VAD_BLEED_COOLDOWN_MS)
        );
      // Edge-trigger the force-close log once per close.
      if ((outboundTailIdle || userPreempt) && bleedForceClosedAt < lastOutboundAudioAt) {
        bleedForceClosedAt = _now;
        tlog("bleed_window_force_closed", {
          reason: userPreempt ? "user_speech_preempt" : "outbound_tail_idle",
          ms_since_outbound_audio: lastOutboundAudioAt > 0 ? _now - lastOutboundAudioAt : null,
          ms_since_model_audio: lastModelAudioAt > 0 ? _now - lastModelAudioAt : null,
          turn_id: turnId,
          waiting_window_id: waitingWindowId,
          rms,
        });
        bleedSuppressedFrames = 0;
      }

      const startRms = inBleedWindow ? VAD_START_RMS + VAD_BLEED_START_BOOST : VAD_START_RMS;
      const endRms = inBleedWindow ? VAD_END_RMS + VAD_BLEED_END_BOOST : VAD_END_RMS;
      const minBurstMs = inBleedWindow ? VAD_BLEED_MIN_BURST_MS : VAD_MIN_BURST_MS;

      const aboveStart = rms >= startRms;
      const aboveEnd = rms >= endRms;

      if (aboveEnd) {
        lastVoicedFrameAt = _now;
        // plan v3: refresh user-energy timestamp for the probe guard.
        lastUserSpeechEnergyAt = _now;
      }

      // PR 5.1: feed the post-end audio-energy window. Uses the same
      // "voiced" definition as local VAD (rms >= VAD_END_RMS, no bleed
      // boost — we explicitly want to measure raw caller energy here, not
      // post-bleed-suppression). Skip while bot is actively producing audio
      // because that is unrelated TTS bleed, not the caller continuing.
      if (postEndWindow && turnState !== "model_speaking") {
        const elapsedInWin = _now - postEndWindow.openedAt;
        if (elapsedInWin >= POST_END_WINDOW_MS) {
          closePostEndWindow("5s_timeout", _now);
        } else {
          const frameMs = buffer.byteLength * POST_END_VOICED_MS_PER_BYTE;
          const rawVoiced = rms >= VAD_END_RMS;
          if (rawVoiced) {
            if (rms > postEndWindow.maxRms) postEndWindow.maxRms = rms;
            if (postEndWindow.currentRunMs === 0) {
              postEndWindow.currentRunStartedAt = _now;
            }
            postEndWindow.currentRunMs += frameMs;
            postEndWindow.voicedMs += frameMs;
          } else if (postEndWindow.currentRunMs > 0) {
            if (postEndWindow.currentRunMs > postEndWindow.maxContiguousMs) {
              postEndWindow.maxContiguousMs = postEndWindow.currentRunMs;
            }
            postEndWindow.currentRunMs = 0;
          }
        }
      }


      // PR 4 + Barge-in: while the bot is actively speaking, the normal
      // VAD state machine is paused (bleed/echo must not flip vadInSpeech
      // for a stale prior turn). However, we run a SEPARATE, stricter
      // barge-in evaluator here so the user can interrupt mid-TTS.
      //
      // The path is:
      //   1. Always capture the frame into the circular preroll ring.
      //   2. Apply lockout (first ~400ms of bot reply ignored).
      //   3. Compute effective RMS / burst thresholds, raised further
      //      while in bleed cooldown (NOT skipped — barge stays possible).
      //   4. Sustained-burst gate via bargeCandidateSince.
      //   5. On confirmation: sendActivityStart + flush preroll + forward
      //      live frame; Gemini fires `interrupted` → existing
      //      onInterrupted() kills TTS through Jambonz.
      if (turnState === "model_speaking") {
        if (aboveStart) {
          bleedSuppressedFrames += 1;
        }
        vadCandidateSince = 0;
        lastInboundAudioAt = _now;
        cumulativeUserAudioBytes += buffer.byteLength;

        // Always feed the preroll ring — cheap, fixed-size, no GC churn.
        prerollPush(buffer);

        if (!config.bargeInEnabled) return;
        // If a barge already triggered for this model turn, just keep
        // forwarding live audio so Gemini can build the interrupting
        // utterance until its own VAD/turn end fires.
        if (bargeTriggeredAt > 0) {
          if (gemini && geminiReady) gemini.sendAudio(buffer);
          return;
        }

        const sinceModelStart = modelTurnStartedAt > 0
          ? _now - modelTurnStartedAt
          : 0;
        if (sinceModelStart < config.bargeLockoutAfterModelStartMs) {
          // Only log when the user *was* loud enough — quiet frames are
          // uninteresting and would flood telemetry.
          if (aboveStart) {
            tlog("barge_in_suppressed_lockout", {
              turn_id: turnId,
              since_model_start_ms: sinceModelStart,
              rms,
            });
          }
          bargeCandidateSince = 0;
          return;
        }

        const bargeRmsBase = VAD_START_RMS + VAD_BLEED_START_BOOST
          + config.bargeRmsBoost;
        const effRms = bargeRmsBase
          + (inBleedWindow ? config.bargeBleedRmsBoost : 0);
        const effBurst = config.bargeMinBurstMs
          + (inBleedWindow ? config.bargeBleedBurstBoostMs : 0);

        if (rms < effRms) {
          if (bargeCandidateSince > 0) {
            tlog("barge_in_suppressed_short_burst", {
              turn_id: turnId,
              burst_ms: _now - bargeCandidateSince,
              rms,
              eff_rms: effRms,
              eff_burst_ms: effBurst,
              in_bleed: inBleedWindow,
            });
          }
          bargeCandidateSince = 0;
          return;
        }

        // Qualifying frame.
        if (bargeCandidateSince === 0) {
          bargeCandidateSince = _now;
          tlog("barge_candidate_open", {
            turn_id: turnId,
            rms,
            eff_rms: effRms,
            eff_burst_ms: effBurst,
            in_bleed: inBleedWindow,
            model_speaking_for_ms: sinceModelStart,
          });
          return;
        }
        if ((_now - bargeCandidateSince) < effBurst) {
          // Still accumulating burst; do NOT forward yet (avoid feeding
          // Gemini ambiguous fragments that won't trigger interrupted).
          return;
        }

        // ── Confirmed barge-in ──
        const burstMs = _now - bargeCandidateSince;
        bargeCandidateSince = 0;
        bargeTriggeredAt = _now;
        if (gemini && geminiReady) {
          const g = gemini;
          // In manual VAD drive mode, audio without activityStart is
          // discarded by Gemini. Always send it; it's a cheap no-op when
          // server VAD is on.
          g.sendActivityStart();
          const flushed = prerollFlushTo((b) => g.sendAudio(b));
          g.sendAudio(buffer);
          tlog("barge_in_triggered", {
            turn_id: turnId,
            burst_ms: burstMs,
            rms,
            eff_rms: effRms,
            eff_burst_ms: effBurst,
            in_bleed: inBleedWindow,
            model_speaking_for_ms: sinceModelStart,
            preroll_frames: flushed.frames,
            preroll_bytes: flushed.bytes,
          });
        }
        return;
      }

      if (!vadInSpeech) {
        // Sustained-burst gate. A single noisy frame is NOT enough.
        if (aboveStart) {
          if (vadCandidateSince === 0) {
            vadCandidateSince = _now;
          } else if ((_now - vadCandidateSince) >= minBurstMs) {
            // Confirmed speech onset.
            vadInSpeech = true;
            lastSpeechFrameAt = _now;
            userTurnEndTimeoutFiredAt = 0;
            const burstMs = _now - vadCandidateSince;
            vadCandidateSince = 0;
            if (turnState === "waiting_for_user" || turnState === "interrupted") {
              // PR 5.1: a new user turn beginning closes any open post-end
              // window from the prior turn (without reaching 5s timeout).
              if (postEndWindow) closePostEndWindow("next_turn_started", _now);
              turnId += 1;
              userTurnStartedAt = _now - burstMs;
              userTurnEndedAt = 0;
              turnState = "user_speaking";
              // Reset per-turn diagnostics.
              silenceTimerResetCount = 0;
              bleedSuppressedFrames = 0;
              entryRejectedShortBursts = 0;
              // plan v2: real user speech detected — mark for the next
              // model_turn_complete so a fresh waiting window is opened.
              realUserSpeechSinceLastWindow = true;
              lastUserTurnStartAt = _now;
              lastUserSpeechEnergyAt = _now;
              setCallState("user_speaking", "energy_above_start");
              tlog("vad_state_transition", {
                from: "idle", to: "user_speaking",
                reason: "sustained_burst_confirmed",
                turn_id: turnId, waiting_window_id: waitingWindowId,
                rms, burst_ms: burstMs,
              });
              tlog("user_turn_start", {
                turn_id: turnId,
                source: "energy_vad",
                rms,
                burst_ms: burstMs,
                in_bleed_window: inBleedWindow,
                waiting_window_id: waitingWindowId,
              });
              tlog("user_speech_energy_start", {
                turn_id: turnId,
                rms,
                threshold: startRms,
                burst_ms: burstMs,
              });
              // PR 5 drive mode: bridge owns turn boundaries. Signal the
              // start of a user activity to Gemini. In observe mode (default)
              // this branch is skipped — Gemini's auto-VAD does it.
              if (config.vadDriveTurnEnd) {
                if (gemini && geminiReady) {
                  const ok = gemini.sendActivityStart();
                  tlog(ok ? "activity_start_sent" : "activity_start_failed", {
                    turn_id: turnId,
                  });
                } else {
                  tlog("activity_start_skipped_not_ready", {
                    turn_id: turnId,
                    gemini_ready: geminiReady,
                  });
                }
              }
              waitingForModelAlertedAt = 0;
            }
          }
        } else {
          // Below start threshold — drop candidate. Count rejected sub-burst spikes.
          if (vadCandidateSince > 0) {
            const candidateMs = _now - vadCandidateSince;
            if (candidateMs > 0 && candidateMs < minBurstMs) {
              entryRejectedShortBursts += 1;
              if (inBleedWindow) bleedSuppressedFrames += 1;
            }
            vadCandidateSince = 0;
          }
        }
      } else {
        // Already in speech state.
        if (aboveEnd) {
          // Track potential noise-blip re-triggers: if we'd been silent for a
          // meaningful gap (>= 60% of SILENCE_MS) and a single isolated voiced
          // frame pushes the timer back, count it as a reset for diagnostics.
          const gap = _now - lastSpeechFrameAt;
          if (gap >= Math.floor(SILENCE_MS * 0.6)) {
            silenceTimerResetCount += 1;
            if (inBleedWindow) bleedSuppressedFrames += 1;
          }
          lastSpeechFrameAt = _now;
        } else if (aboveStart) {
          // Above start but below end — defensive; treat as voiced.
          lastSpeechFrameAt = _now;
        } else if ((_now - lastSpeechFrameAt) >= SILENCE_MS) {
          // Local end-of-speech: silence sustained for SILENCE_MS.
          vadInSpeech = false;
          vadCandidateSince = 0;
          tlog("vad_state_transition", {
            from: "user_speaking", to: "waiting_for_model",
            reason: "silence_timeout",
            turn_id: turnId, waiting_window_id: waitingWindowId,
            silence_ms: SILENCE_MS,
          });
          // PR 4: hard guard — exactly one user_turn_end per turn_id.
          if (userTurnEndFiredForTurn === turnId) {
            duplicateTurnEndSuppressed += 1;
            // Reset stale timestamps so they cannot affect a future turn.
            lastSpeechFrameAt = 0;
            lastVoicedFrameAt = 0;
            tlog("duplicate_user_turn_end_suppressed", {
              turn_id: turnId,
              total_suppressed: duplicateTurnEndSuppressed,
            });
          } else {
            userTurnEndFiredForTurn = turnId;
            userTurnEndTimeoutFiredAt = _now;
            userTurnEndedAt = lastSpeechFrameAt;
            // PR 4: clear stale timestamps so the next turn starts clean.
            const _lastSpeech = lastSpeechFrameAt;
            lastSpeechFrameAt = 0;
            lastVoicedFrameAt = 0;
            if (turnState === "user_speaking") {
              turnState = "waiting_for_model";
              setCallState("waiting_for_model", "local_silence_timeout");
            }
            tlog("user_turn_end", {
              turn_id: turnId,
              speech_ms: userTurnEndedAt - userTurnStartedAt,
              source: "energy_silence_timeout",
              silence_timer_reset_count: silenceTimerResetCount,
              bleed_suppressed_frames: bleedSuppressedFrames,
              entry_rejected_short_bursts: entryRejectedShortBursts,
              last_voiced_frame_at: _lastSpeech || null,
            });
            tlog("local_user_turn_end_timeout_fired", {
              turn_id: turnId,
              silence_ms: SILENCE_MS,
              end_threshold_rms: endRms,
              ms_since_last_speech: _now - _lastSpeech,
              silence_timer_reset_count: silenceTimerResetCount,
              bleed_suppressed_frames: bleedSuppressedFrames,
            });
            // PR 5 drive mode: signal end-of-activity to Gemini so it can
            // commit the user turn immediately. Observe mode (default) skips
            // this — Gemini's auto-VAD owns the commit.
            if (config.vadDriveTurnEnd) {
              if (gemini && geminiReady) {
                const ok = gemini.sendActivityEnd();
                tlog(ok ? "activity_end_sent" : "activity_end_failed", {
                  turn_id: turnId,
                  sent_at: _now,
                });
              } else {
                tlog("activity_end_skipped_not_ready", {
                  turn_id: turnId,
                  gemini_ready: geminiReady,
                });
              }
            }
            // PR 5.1: open the post-end audio-energy window. Any inbound
            // voiced frame in the next 5s (or until model_first_audio /
            // next user_turn_start) is recorded as evidence of premature
            // local-VAD cutoff.
            postEndWindow = {
              turnId,
              openedAt: _now,
              voicedMs: 0,
              currentRunMs: 0,
              currentRunStartedAt: 0,
              maxContiguousMs: 0,
              maxRms: 0,
              modelStartedWhileVoiced: null,
              closedReason: null,
              closedAt: 0,
            };
          }
        }
      }

      lastInboundAudioAt = _now;
      // PR 2: track cumulative user audio bytes for latency context.
      cumulativeUserAudioBytes += buffer.byteLength;

      // PR 1: stalled-call detector. user_turn_start fired but no
      // model_first_audio within WAIT_MODEL_ALERT_MS — log once per turn.
      if (
        turnState === "waiting_for_model" &&
        waitingForModelAlertedAt === 0 &&
        userTurnEndedAt > 0 &&
        (_now - userTurnEndedAt) >= WAIT_MODEL_ALERT_MS
      ) {
        waitingForModelAlertedAt = _now;
        tlog("waiting_for_model_too_long", {
          turn_id: turnId,
          ms_since_user_turn_end: _now - userTurnEndedAt,
          ms_since_last_gemini_event: lastGeminiEventAt > 0 ? _now - lastGeminiEventAt : -1,
          last_inbound_forwarded_at: lastInboundForwardedAt || null,
        });
      }

      if (gemini && geminiReady) {
        gemini.sendAudio(buffer);
        lastInboundForwardedAt = _now;
        if (!firstInboundForwardedLogged) {
          firstInboundForwardedLogged = true;
          console.log(`[stage] first_inbound_frame_forwarded cid=${cid} path=direct elapsed_ms=${elapsed()}`);
        }
      } else {
        audioBuffer.push(buffer);
      }
    }
  };

  jambonzWs.onerror = (err) => {
    console.error(`[Bridge] Audio WS error for ${callSid} cid=${cid}:`, err);
  };

  jambonzWs.onclose = () => {
    cleanupWatchdogs();
    logStage(_logCtx, "call_hangup", elapsed());
    setActiveCallCount(activeCalls.size);
    console.log(`[stage] jambonz_ws_close cid=${cid} callSid=${callSid} elapsed_ms=${elapsed()} firstJambonzAudio=${firstJambonzAudioLogged} firstGeminiAudio=${firstGeminiAudioLogged} firstPstnForward=${firstPstnForwardLogged} firstInboundForwarded=${firstInboundForwardedLogged} inboundFrames=${inboundFrameCount}`);
    if (gemini) gemini.close();
    void cleanupCall(callSid);
  };
}

async function cleanupCall(callSid: string): Promise<void> {
  const callState = activeCalls.get(callSid);
  if (!callState) return;

  const durationSeconds = Math.round((Date.now() - callState.startTime) / 1000);

  if (callState.callLogId) {
    await updateCallLog(callState.callLogId, {
      status: "completed",
      ended_at: new Date().toISOString(),
      duration_seconds: durationSeconds,
      transcript: callState.gemini.getTranscript() || null,
    });
  }

  // Flush any in-progress turn buffers before tearing the session down so
  // mid-turn hangups still surface partial transcripts with `was_call_ended`.
  try {
    const peek = callState.gemini.peekTurnBuffers();
    if (peek.user && peek.user.trim()) {
      void persistVoiceTranscript({
        conversationId: callState.conversationId,
        callSid,
        cid: "cleanup",
        turnId: -1,
        senderType: "customer",
        content: peek.user,
        flags: { was_interrupted: false, was_force_closed: false, was_call_ended: true },
      });
    }
    if (peek.model && peek.model.trim()) {
      void persistVoiceTranscript({
        conversationId: callState.conversationId,
        callSid,
        cid: "cleanup",
        turnId: -1,
        senderType: "bot",
        content: peek.model,
        flags: { was_interrupted: false, was_force_closed: false, was_call_ended: true },
      });
    }
  } catch { /* never block cleanup */ }

  callState.gemini.close();
  activeCalls.delete(callSid);

  console.log(`[Bridge] Call ${callSid} cleaned up (${durationSeconds}s)`);
}

validateConfig();

const useTls = Boolean(config.tlsCertPath && config.tlsKeyPath);

const serverOptions: Deno.ServeOptions<Deno.NetAddr> | Deno.ServeTlsOptions<Deno.NetAddr> =
  useTls
    ? {
        port: config.port,
        cert: await Deno.readTextFile(config.tlsCertPath),
        key: await Deno.readTextFile(config.tlsKeyPath),
      }
    : { port: config.port };

console.log(
  `[Bridge] Starting Gemini Bridge on ${useTls ? "wss" : "ws"}://0.0.0.0:${config.port}`,
);
console.log(`[Bridge] External URL: ${config.bridgeExternalUrl}`);
console.log(`[Bridge] Gemini endpoint: ${config.geminiWsBase}`);
console.log(`[Bridge] Gemini model: ${config.geminiModel}`);
const BUILD_ID = Deno.env.get("BRIDGE_COMMIT_SHA") || Deno.env.get("COMMIT_SHA") || `local-${Date.now()}`;
console.log(`[startup] Build: ${BUILD_VERSION} bundle_hash=${BUNDLE_HASH} mode=stable+logs ts=${new Date().toISOString()}`);
startBridgeLogger();

// +emergency-recovery: remote-config poller removed (Option B). Env-only config.
const _eff = getEffectiveConfig();
console.log(
  `[Bridge] Voice: ${_eff.voice_name} (remote_config=OFF mode=env-only)`,
);
console.log(
  `[Bridge] Effective flags: sms=${_eff.sms_enabled} rating=${_eff.rating_enabled} memory=${_eff.memory_enabled} silence_guard=${_eff.silence_probe_guard_enabled} rating_window_ms=${_eff.rating_window_ms} silence_guard_ms=${_eff.silence_probe_guard_ms}`,
);

logStage({}, "bridge_ready", 0, {
  port: config.port,
  remote_config_enabled: false,
});
console.log(
  `[Bridge] API key: ${
    config.googleApiKey ? `${config.googleApiKey.substring(0, 8)}...` : "NOT SET"
  }`,
);

Deno.serve(serverOptions, (req: Request): Response => {
  const url = new URL(req.url);

  if (url.pathname === "/health") {
    return new Response(
      JSON.stringify({
        status: "ok",
        version: BUNDLE_HASH,
        phase: BUILD_VERSION,
        bundle_hash: BUNDLE_HASH,
        build_version: BUILD_VERSION,
        build_id: BUILD_ID,
        activeCalls: activeCalls.size,
        uptime: Math.round(performance.now() / 1000),
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const upgrade = req.headers.get("upgrade") || "";
  if (upgrade.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket", { status: 426 });
  }

  const requestedProtocol =
    req.headers.get("sec-websocket-protocol") || "(none)";
  console.log(
    `[Bridge] WS upgrade: path=${url.pathname} sec-websocket-protocol=${requestedProtocol}`,
  );

  if (url.pathname === "/audio") {
    const { socket, response } = Deno.upgradeWebSocket(req);
    void handleAudioConnection(socket, url.searchParams);
    return response;
  }

  const upgradeOpts: { protocol?: string } = {};
  if (requestedProtocol.includes("ws.jambonz.org")) {
    upgradeOpts.protocol = "ws.jambonz.org";
  }

  const { socket, response } = Deno.upgradeWebSocket(req, upgradeOpts);
  handleJambonzAppConnection(socket);
  return response;
});
