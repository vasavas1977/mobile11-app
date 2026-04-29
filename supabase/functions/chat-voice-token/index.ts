// Customer-facing voice token endpoint - no auth required
// Production-hardened: rate limiting, session logging, KB caching, reconnect dedup
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Rate limit: max sessions per IP within window
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MINUTES = 10;
// Dedup window: same IP+conversation_id within this window counts as reconnect
const DEDUP_WINDOW_MS = 90_000; // 90 seconds

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GOOGLE_CLOUD_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Voice service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // --- PARSE OPTIONAL BODY (before rate-limit so we have conversation_id) ---
    let conversationId: string | null = null;
    let clientLanguage: string | null = null;
    let isFirstConnect = false;
    let resumeReason: string = "first_connect";
    let lastKnownTurnId: string | null = null;
    try {
      const body = await req.json();
      conversationId = body.conversation_id || null;
      clientLanguage = body.language || null;
      isFirstConnect = body.is_first_connect === true;
      resumeReason = typeof body.resume_reason === "string" ? body.resume_reason : (isFirstConnect ? "first_connect" : "scheduled_refresh");
      lastKnownTurnId = body.last_known_turn_id || null;
    } catch { /* no body is fine */ }
    // Memory injection eligibility: must have conversation_id AND not be the
    // explicit first connect. Default-on so any non-fresh attach (refresh,
    // network reconnect, page resume, token renewal) restores context.
    const shouldInjectMemory = !!conversationId && !isFirstConnect;

    // --- PARALLEL DB QUERIES: rate limit + voice config + KB cache ---
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("cf-connecting-ip")
      || "unknown";

    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();
    const dedupStart = new Date(Date.now() - DEDUP_WINDOW_MS).toISOString();

    // Build dedup query (only if we have a conversation_id)
    const dedupQuery = conversationId
      ? adminClient
          .from("voice_sessions_log")
          .select("session_id", { count: "exact", head: false })
          .eq("ip_address", clientIp)
          .eq("conversation_id", conversationId)
          .gte("started_at", dedupStart)
          .limit(1)
      : Promise.resolve({ data: null, count: 0 });

    // Fire all queries in parallel
    const [rateLimitResult, configResult, cacheResult, dedupResult, coreKnowledgeResult] = await Promise.all([
      adminClient
        .from("voice_sessions_log")
        .select("*", { count: "exact", head: true })
        .eq("ip_address", clientIp)
        .gte("started_at", windowStart),
      adminClient
        .from("voice_bot_config")
        .select("greeting_message, mode, greeting_language")
        .limit(1)
        .single(),
      adminClient
        .from("voice_bot_instruction_cache")
        .select("cached_instruction, expires_at, language")
        .in("language", ["en", "th"]),
      dedupQuery,
      // Fetch core product knowledge from DB (shared with chatbot)
      adminClient
        .from("kb_articles")
        .select("title, content")
        .eq("is_published", true)
        .eq("category", "bot-core-knowledge")
        .order("display_order", { ascending: true }),
    ]);

    // Check dedup: if same IP+conversation recently requested, skip rate limit counting
    const isReconnect = conversationId && (dedupResult.data?.length ?? 0) > 0;

    if (!isReconnect) {
      const recentSessions = rateLimitResult.count;
      if ((recentSessions ?? 0) >= RATE_LIMIT_MAX) {
        console.warn(`[chat-voice-token] Rate limit hit for IP: ${clientIp}`);
        return new Response(
          JSON.stringify({
            error: "Too many voice sessions. Please try again later.",
            retry_after_seconds: 60,
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // --- VOICE BOT CONFIG ---
    const voiceConfig = configResult.data;
    // Priority: client language > config greeting_language > 'en'
    const lang = clientLanguage || (voiceConfig?.greeting_language?.toLowerCase().startsWith("th") ? "th" : "en");

    const LANG_NAMES: Record<string, string> = {
      en: 'English', th: 'Thai', ja: 'Japanese', ko: 'Korean', fr: 'French', de: 'German', zh: 'Chinese',
    };
    const langName = LANG_NAMES[lang] || 'English';

    // --- CORE PRODUCT KNOWLEDGE from DB ---
    const coreKnowledge = coreKnowledgeResult.data?.length
      ? `\n\n## CORE PRODUCT KNOWLEDGE\n${coreKnowledgeResult.data.map((a: any) => a.content).join("\n\n")}`
      : "";

    // --- KB CACHING: use parallel-fetched cache ---
    let kbContext = "";
    const cached = cacheResult.data?.find(c => c.language === lang);

    if (cached && new Date(cached.expires_at) > new Date()) {
      kbContext = cached.cached_instruction;
    } else {
      // Cache miss or expired — fetch and rebuild
      const { data: kbArticles } = await adminClient
        .from("kb_articles")
        .select("title, content, category")
        .eq("is_published", true)
        .eq("is_internal", false)
        .in("source", ["both", "chatbot"])
        .eq("language", lang)
        .neq("category", "bot-core-knowledge")
        .limit(5);

      if (kbArticles?.length) {
        kbContext = `\n\n## KB ARTICLES\n${kbArticles.map(a => `### ${a.title}\n${a.content.substring(0, 400)}`).join("\n\n")}`;
      }

      // Upsert cache (fire-and-forget, don't block response)
      adminClient
        .from("voice_bot_instruction_cache")
        .upsert({
          language: lang,
          cached_instruction: kbContext,
          article_count: kbArticles?.length || 0,
          cached_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        }, { onConflict: "language" })
        .then(() => {});
    }

    // --- BUILD SYSTEM INSTRUCTION ---
    const now = new Date();
    const songkranStart = new Date('2026-03-14T00:00:00Z');
    const songkranEnd = new Date('2026-04-10T23:59:59Z');
    const songkranActive = now >= songkranStart && now <= songkranEnd;
    const songkranSection = songkranActive
      ? `\n## SONGKRAN 2026 PROMO\nCode: SK2026, 40% off any eSIM. Valid March 14 – April 10, 2026. Buy now, activate within 180 days.\n`
      : '';

    const voiceBehaviorRules = `## OUTPUT FORMAT — HIGHEST PRIORITY (overrides everything else)
You are speaking, not writing. Output ONLY the words to be spoken aloud.
- Do NOT output reasoning, planning, or narration of your process (no "Crafting...", "I'm formulating...", "Let me think...", "First I'll...", etc.).
- Do NOT output JSON, code blocks, markdown headings, XML/HTML tags, or bracketed meta markers.
- Do NOT wrap your answer in an envelope, object, or preamble. Just say the answer directly.
- If you would normally show structure (a list, a table), speak it as natural sentences instead.
- Begin every turn with the actual spoken response — never with meta commentary about what you're about to say.

## RESPONSE LANGUAGE (HIGHEST PRIORITY)
The customer's UI is set to: ${langName}
You MUST respond in ${langName} at ALL times unless the customer explicitly speaks a different language.
- Japanese: Use polite です/ます form. Katakana for loanwords. Currency: $ (USD).
- Korean: Use formal 합니다체. Currency: $ (USD).
- French: Use formal "vous" form. Currency: $ (USD) or € (EUR).
- German: Use formal "Sie" form. Currency: $ (USD) or € (EUR).
- Thai: Call yourself "น้อง", customer "พี่", use ค่ะ/คะ. Currency: ฿ (USD×35).
- Chinese: Use polite Simplified Chinese (简体中文). Warm and professional tone. Currency: $ (USD) or ¥ (CNY).
- English: Friendly, conversational. Currency: $ (USD).

## STYLE
2-4 sentences per turn. Warm, friendly — like a travel-savvy friend. Mobile11's voice assistant.

## PRODUCT BOUNDARY
Mobile11 sells ONLY eSIMs. NEVER mention physical SIMs. Incompatible phone → sympathize + suggest mobile11.com or human agent.

## VOICE RULES
- Mention URLs naturally: mobile11.com/esim/{country-slug}. No markdown, no QR codes.
- NEVER INVENT facts. Unsure → "our support team can help."

## ESCALATION
When customer asks for human agent:
1. "Our rep will get back to you. May I have your name and phone number?"
2. Repeat back to confirm. If confirmed → thank + goodbye + STOP.
3. If wrong after 2 tries → "Type your info in the chat below."
4. No "hold on" or "let me transfer." Stop after confirmation.

## FLOW
1. Welcome → buy eSIM or support?
2. Buying → "Used eSIM before?"
3. No → brief pitch + ask device. Yes → step 4.
4. Device check: iPhone XS+ or Android *#06#. Incompatible → human agent.
5. Ask destination + trip duration together.
6. Price per day (Value ~$2, Unlimited ~$4). Ask if interested.
7. Yes → URL: mobile11.com/esim/{country-slug}
8. Recommend specific plan only if asked. Heavy → Unlimited, Regular → Value, Cheapest → Lite.
9. Wrap-up: When customer says thanks/bye → ALWAYS ask "Is there anything else I can help with?" first. If customer says no → "Thank you! Please rate this call using the prompt that will appear on your screen. Your feedback helps us improve our AI assistant! If you have any other comments, feel free to share."

## NAME & PHONE COLLECTION
Ask the customer's name early in the conversation: "May I know your name so I can help you better?"
Use their name naturally throughout the conversation.
After getting name, optionally ask: "Would you mind sharing your phone number? It's totally optional, but helps if our team needs to follow up."
If they decline, move on naturally. Never ask again.
`;

    const customPrompt = voiceConfig?.greeting_message || "";

    // --- SESSION MEMORY ASSEMBLY (Phase 1) ---
    // Build a fixed-schema slot block from recent voice turns. Strict rules:
    //   - Only structured slots, named, controlled values. No paraphrased
    //     user content (closes prompt-injection via summarization).
    //   - Omit unknown fields entirely (model treats "unknown" as a fact).
    //   - Bound to ~400 chars. Drop oldest non-essential slots if over.
    let memoryBlock = "";
    let historySource: "memory_summary" | "none" = "none";
    let memoryCompleteness: "complete" | "partial" | "none" = "none";
    const injectedSlots: string[] = [];
    let historyChars = 0;

    if (shouldInjectMemory) {
      try {
        // Race-condition handling: if client says the most recent turn is
        // last_known_turn_id but DB doesn't have it yet, retry once after 500ms.
        const fetchRecent = async () => {
          return await adminClient
            .from("conversation_messages")
            .select("content, sender_type, created_at, metadata")
            .eq("conversation_id", conversationId!)
            .order("created_at", { ascending: false })
            .limit(12);
        };
        let { data: recentMsgs } = await fetchRecent();
        if (lastKnownTurnId && recentMsgs) {
          const has = recentMsgs.some((m: any) => m?.metadata?.turn_id === lastKnownTurnId);
          if (!has) {
            await new Promise(r => setTimeout(r, 500));
            const retry = await fetchRecent();
            recentMsgs = retry.data ?? recentMsgs;
            const stillHas = recentMsgs?.some((m: any) => m?.metadata?.turn_id === lastKnownTurnId);
            memoryCompleteness = stillHas ? "complete" : "partial";
          } else {
            memoryCompleteness = "complete";
          }
        } else {
          memoryCompleteness = recentMsgs && recentMsgs.length > 0 ? "complete" : "partial";
        }

        const ordered = (recentMsgs || []).slice().reverse(); // chronological
        // Bound to last 6 turns (12 messages: 6 customer + 6 bot worst case)
        const windowed = ordered.slice(-12);

        // Slot extractors — DETERMINISTIC, no LLM. Each returns null if
        // the slot is not confidently captured. Order matters only for
        // last_open_question (must be the most recent assistant question).
        const customerText = windowed
          .filter((m: any) => m.sender_type === "customer")
          .map((m: any) => String(m.content || ""))
          .join("\n");
        const botText = windowed
          .filter((m: any) => m.sender_type === "bot")
          .map((m: any) => String(m.content || ""))
          .join("\n");

        // ---- customer_name (self-intro pattern, narrow regex) ----
        const NAME_RE = /(?:my name is|i['']?m|call me|this is|ผมชื่อ|ฉันชื่อ|หนูชื่อ|ดิฉันชื่อ|เรียกผมว่า|เรียกฉันว่า)\s+([A-Za-zก-๙][A-Za-zก-๙]{1,30})/i;
        let customerName: string | null = null;
        for (const m of windowed) {
          if (m.sender_type !== "customer") continue;
          const match = String(m.content || "").match(NAME_RE);
          if (match) {
            customerName = match[1].trim().split(/\s+/)[0];
            // Sanitize: strip anything non-alpha-Thai to neutralize injection
            customerName = customerName.replace(/[^A-Za-zก-๙]/g, "").slice(0, 30);
            if (customerName.length < 2) customerName = null;
          }
        }

        // ---- destination (country keyword whitelist) ----
        const COUNTRIES: Record<string, string> = {
          japan: "Japan", "ญี่ปุ่น": "Japan",
          korea: "Korea", "เกาหลี": "Korea",
          thailand: "Thailand", "ไทย": "Thailand",
          singapore: "Singapore", "สิงคโปร์": "Singapore",
          china: "China", "จีน": "China",
          taiwan: "Taiwan", "ไต้หวัน": "Taiwan",
          vietnam: "Vietnam", "เวียดนาม": "Vietnam",
          europe: "Europe", "ยุโรป": "Europe",
          usa: "USA", "us": "USA", "america": "USA", "อเมริกา": "USA",
          uk: "UK", "england": "UK", "อังกฤษ": "UK",
          australia: "Australia", "ออสเตรเลีย": "Australia",
          india: "India", "อินเดีย": "India",
          malaysia: "Malaysia", "มาเลเซีย": "Malaysia",
          indonesia: "Indonesia", "อินโดนีเซีย": "Indonesia",
          philippines: "Philippines", "ฟิลิปปินส์": "Philippines",
          hongkong: "Hong Kong", "hong kong": "Hong Kong", "ฮ่องกง": "Hong Kong",
        };
        let destination: string | null = null;
        const customerLower = customerText.toLowerCase();
        for (const [kw, label] of Object.entries(COUNTRIES)) {
          if (customerLower.includes(kw)) { destination = label; break; }
        }

        // ---- trip_duration_days (small integer 1-90 followed by day word) ----
        let tripDays: number | null = null;
        const dayMatch = customerText.match(/\b(\d{1,2})\s*(?:days?|วัน|日|일)\b/i);
        if (dayMatch) {
          const n = parseInt(dayMatch[1], 10);
          if (n >= 1 && n <= 90) tripDays = n;
        }

        // ---- device_model + compatibility ----
        let deviceModel: string | null = null;
        let deviceCompat: "compatible" | "incompatible" | null = null;
        const iphoneMatch = customerText.match(/\biphone\s*(\d{1,2}|xs|xr|x|se)\b/i);
        if (iphoneMatch) {
          deviceModel = `iPhone ${iphoneMatch[1].toUpperCase()}`;
          // iPhone XS+ is compatible (XS, XR, 11+)
          const m = iphoneMatch[1].toLowerCase();
          if (m === "xs" || m === "xr" || (/^\d+$/.test(m) && parseInt(m, 10) >= 11)) {
            deviceCompat = "compatible";
          } else if (m === "x" || m === "se") {
            deviceCompat = "incompatible";
          }
        } else if (/\bandroid\b|\bsamsung\b|\bgalaxy\b|\bpixel\b|\bhuawei\b|\bxiaomi\b/i.test(customerText)) {
          deviceModel = "Android";
        }

        // ---- esim_experience (yes/no based on direct answers) ----
        let esimExperience: "yes" | "no" | null = null;
        // Look for answers right after the bot asks
        const expQuestionAsked = /used eSIM|ใช้\s*eSIM|เคยใช้/i.test(botText);
        if (expQuestionAsked) {
          if (/\b(yes|yeah|yep|yup|ใช่|เคย|ครับ|ค่ะ)\b/i.test(customerText)) {
            esimExperience = "yes";
          } else if (/\b(no|nope|never|ไม่เคย|ไม่)\b/i.test(customerText)) {
            esimExperience = "no";
          }
        }

        // ---- plan_discussed (whitelist) ----
        let planDiscussed: string | null = null;
        if (/\bunlimited\b|ไม่จำกัด/i.test(botText)) planDiscussed = "Unlimited";
        else if (/\bvalue\b|คุ้มค่า/i.test(botText)) planDiscussed = "Value";
        else if (/\blite\b|ประหยัด/i.test(botText)) planDiscussed = "Lite";

        // ---- last_open_question + stage (from most recent BOT message only) ----
        // NOTE: Phase-1 short-term fallback. Stage extraction by regex is
        // brittle — Phase 2 should move this to structured event emission
        // at the point the bot asks each question. The catch-all below
        // guarantees `stage` is always populated when there's bot history,
        // which is what the model needs to avoid re-greeting after refresh.
        let lastOpenQuestion: string | null = null;
        let stage: string | null = null;
        const lastBot = windowed.slice().reverse().find((m: any) => m.sender_type === "bot");
        const lastBotText = lastBot ? String(lastBot.content || "") : "";

        const STAGE_PATTERNS: Array<{ stage: string; question: string; patterns: RegExp[] }> = [
          {
            stage: "awaiting_name",
            question: "Asked customer's name",
            patterns: [
              /may I (?:know|have) your name/i,
              /what'?s your name/i,
              /รบกวน(?:ขอ)?ชื่อ/,
              /ขอทราบชื่อ/,
              /ไม่ทราบ(?:ว่า)?ชื่อ/,
            ],
          },
          {
            stage: "awaiting_esim_experience",
            question: "Asked if customer has used eSIM before",
            patterns: [
              /used eSIM/i,
              /ใช้\s*eSIM/i,
              /เคยใช้/,
            ],
          },
          {
            stage: "awaiting_destination",
            question: "Asked destination and trip duration",
            patterns: [
              /(?:traveling|going|travel) to where/i,
              /which (?:country|destination)/i,
              /เดินทางไป(?:ที่)?ไหน/,
              /ไปประเทศไหน/,
              /จะไป(?:ที่)?ไหน/,
            ],
          },
          {
            stage: "awaiting_device_check",
            question: "Asked about device model / compatibility",
            patterns: [
              /what (?:phone|device|model)/i,
              /ใช้มือถือ(?:รุ่น|อะไร|ไหน)/,
              /มือถือรุ่นไหน/,
              /\*#06#/i,
            ],
          },
          {
            stage: "awaiting_plan_choice",
            question: "Asked which plan customer prefers",
            patterns: [
              /which (?:plan|package)/i,
              /(?:interested in|prefer) which/i,
              /สนใจแพ็กเกจไหน/,
              /สนใจ(?:แผน|แพ็ก)ไหน/,
              /เลือก(?:แผน|แพ็ก)ไหน/,
              /Value or Unlimited/i,
            ],
          },
          {
            stage: "awaiting_link_confirmation",
            question: "Asked whether to send checkout link",
            patterns: [
              /send (?:you )?the (?:link|checkout)/i,
              /ส่งลิงก์/,
              /มอบลิงก์/,
              /ต้องการ(?:ให้ส่ง)?ลิงก์/,
            ],
          },
          {
            stage: "recommending_plans",
            question: "Recommended plans, awaiting reaction",
            patterns: [
              /แนะนำ.*(?:Value|Unlimited|แพ็ก|แผน)/,
              /recommend.*(?:Value|Unlimited|plan)/i,
            ],
          },
          {
            stage: "awaiting_phone_optional",
            question: "Asked for phone number (optional)",
            patterns: [
              /phone number/i,
              /เบอร์/,
            ],
          },
          {
            stage: "wrap_up",
            question: "Asked if anything else needed",
            patterns: [
              /anything else/i,
              /something else/i,
              /อย่างอื่น/,
            ],
          },
        ];

        if (lastBotText) {
          for (const sp of STAGE_PATTERNS) {
            if (sp.patterns.some((re) => re.test(lastBotText))) {
              stage = sp.stage;
              lastOpenQuestion = sp.question;
              break;
            }
          }
          // Catch-all fallback: last bot message ends with a question marker
          // (?, ？, or Thai polite particle คะ/ครับ at end). Guarantees stage
          // is always populated so the refreshed session knows the conversation
          // is mid-flow and should NOT restart.
          if (!stage) {
            const trimmed = lastBotText.trim();
            const looksLikeQuestion =
              /[?？]\s*$/.test(trimmed) ||
              /(?:คะ|ครับ)[\s.?！!]*$/.test(trimmed);
            if (looksLikeQuestion) {
              stage = "awaiting_user_reply";
              lastOpenQuestion = trimmed.slice(0, 80);
            }
          }
        }


        // Assemble in priority order so the bound trimmer drops least-important first
        const slots: Array<[string, string]> = [];
        if (customerName)   { slots.push(["customer_name", customerName]); injectedSlots.push("customer_name"); }
        slots.push(["language", lang]); injectedSlots.push("language");
        if (stage)          { slots.push(["stage", stage]); injectedSlots.push("stage"); }
        if (lastOpenQuestion){ slots.push(["last_open_question", lastOpenQuestion]); injectedSlots.push("last_open_question"); }
        if (destination)    { slots.push(["destination", destination]); injectedSlots.push("destination"); }
        if (tripDays != null){ slots.push(["trip_duration_days", String(tripDays)]); injectedSlots.push("trip_duration_days"); }
        if (deviceModel)    { slots.push(["device_model", deviceModel]); injectedSlots.push("device_model"); }
        if (deviceCompat)   { slots.push(["device_compatibility", deviceCompat]); injectedSlots.push("device_compatibility"); }
        if (planDiscussed)  { slots.push(["plan_discussed", planDiscussed]); injectedSlots.push("plan_discussed"); }
        if (esimExperience) { slots.push(["esim_experience", esimExperience]); injectedSlots.push("esim_experience"); }

        // Only inject if we have something beyond just `language`.
        if (slots.length > 1) {
          const buildBlock = (entries: Array<[string, string]>) => {
            const lines = entries.map(([k, v]) => `${k}: ${v}`).join("\n");
            return `\n\n## SESSION MEMORY\n${lines}\n\nUse this as working memory.\nDo not re-greet. Do not re-ask fields shown above unless the customer corrects them.\nIf a field is not shown, it is not yet known — ask only the missing fields, do not restart the flow.\n`;
          };
          let block = buildBlock(slots);
          // Bound to ~400 chars total. Drop from the END of slots (least
          // essential) but always keep customer_name, stage, last_open_question.
          const ESSENTIAL = new Set(["customer_name", "stage", "last_open_question", "language"]);
          let trimmed = slots.slice();
          while (block.length > 400 && trimmed.length > 1) {
            // Find rightmost non-essential slot to drop
            let dropIdx = -1;
            for (let i = trimmed.length - 1; i >= 0; i--) {
              if (!ESSENTIAL.has(trimmed[i][0])) { dropIdx = i; break; }
            }
            if (dropIdx === -1) break;
            trimmed.splice(dropIdx, 1);
            block = buildBlock(trimmed);
          }
          memoryBlock = block;
          historySource = "memory_summary";
          historyChars = block.length;
        } else {
          memoryCompleteness = "partial";
        }
      } catch (memErr) {
        console.warn(`[chat-voice-token] Memory assembly failed (${resumeReason}):`, memErr instanceof Error ? memErr.message : memErr);
        // Fall through with no memory injection — no worse than legacy behavior
        memoryBlock = "";
        historySource = "none";
        memoryCompleteness = "none";
        injectedSlots.length = 0;
        historyChars = 0;
      }
    }

    // CONTINUATION MODE preamble: only when this is a same-conversation
    // resume (refresh / network reconnect / page resume / token renewal).
    // NOT gated on memoryBlock presence — Phase 2 cross-session memory
    // will populate SESSION MEMORY for returning customers on first connect,
    // and "NEVER greet" would be wrong there.
    const continuationPreamble = !isFirstConnect
      ? `## CONTINUATION MODE
This conversation is already in progress. This is a same-conversation resume, not a new contact.
NEVER greet again. NEVER re-introduce yourself. NEVER restart the FLOW from step 1.
Resume from the \`stage\` shown in SESSION MEMORY below.
If \`stage\` is missing, ask one short clarifying question about the customer's current need — do NOT re-welcome.
If \`customer_name\` is shown, address the customer by name naturally (พี่ {name}) at natural moments, not on every turn.

`
      : "";

    const systemInstruction = continuationPreamble + voiceBehaviorRules + songkranSection + coreKnowledge + (customPrompt ? "\n\n## GREETING\n" + customPrompt : "") + kbContext + memoryBlock;

    const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;

    const setupMessage = {
      setup: {
        model: "models/gemini-2.5-flash-native-audio-latest",
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Aoede",
              },
            },
          },
          // Disable thinking — we don't want reasoning traces emitted as text parts
          // (they leak into the bubble and add latency before spoken answer starts).
          thinkingConfig: { thinkingBudget: 0 },
        },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        realtimeInputConfig: {
          automaticActivityDetection: {
            disabled: false,
            startOfSpeechSensitivity: "START_SENSITIVITY_LOW",
            endOfSpeechSensitivity: "END_SENSITIVITY_HIGH",
            prefixPaddingMs: 60,
            silenceDurationMs: 500,
          },
        },
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
      },
    };

    // --- LOG SESSION (fire-and-forget, skip if reconnect dedup) ---
    const sessionId = crypto.randomUUID();
    const recentSessions = rateLimitResult.count ?? 0;

    if (!isReconnect) {
      adminClient
        .from("voice_sessions_log")
        .insert({
          session_id: sessionId,
          ip_address: clientIp,
          conversation_id: conversationId,
          status: "active",
          metadata: {
            language: lang,
            user_agent: req.headers.get("user-agent")?.substring(0, 200),
          },
        })
        .then(() => {});

      console.log(`[chat-voice-token] Session ${sessionId} created for IP ${clientIp} (${recentSessions}/${RATE_LIMIT_MAX} in window)`);
    } else {
      console.log(`[chat-voice-token] Reconnect dedup for IP ${clientIp}, conversation ${conversationId} — skipping session log`);
    }

    return new Response(
      JSON.stringify({
        wsUrl,
        setupMessage,
        sessionId,
        history_source: historySource,
        memory_version: 1,
        history_chars: historyChars,
        injected_slots: injectedSlots,
        memory_completeness: memoryCompleteness,
        resume_reason: resumeReason,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("chat-voice-token error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
