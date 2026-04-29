import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-guest-session-token",
};

type SendBody = {
  action: "send";
  email: string;
  sessionToken: string;
  language?: "en" | "th" | "ja" | "ko" | "fr" | "de";
};

type VerifyBody = {
  action: "verify";
  email: string;
  sessionToken: string;
  code: string;
};

type Body = SendBody | VerifyBody;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function normalizeEmail(email: string) {
  return email.toLowerCase().trim();
}

function isValidEmail(email: string) {
  return email.length <= 255 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidSessionToken(token: string) {
  return typeof token === "string" && token.length >= 8 && token.length <= 200;
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

type SupportedLanguage = "en" | "th" | "ja" | "ko" | "fr" | "de" | "zh" | "es" | "pt" | "ar";

function emailTemplate(code: string, email: string, language: SupportedLanguage) {
  const i18n: Record<SupportedLanguage, { title: string; subtitle: string; footer: string }> = {
    en: {
      title: "Your chat verification code",
      subtitle: "Enter this 6-digit code to start your support chat.",
      footer: "This code expires in 10 minutes.",
    },
    th: {
      title: "รหัสยืนยันสำหรับแชท",
      subtitle: "กรอกรหัส 6 หลักนี้เพื่อเริ่มแชทกับทีมซัพพอร์ต",
      footer: "โค้ดนี้หมดอายุใน 10 นาที",
    },
    ja: {
      title: "チャット認証コード",
      subtitle: "サポートチャットを開始するには、この6桁のコードをご入力ください。",
      footer: "このコードは10分で有効期限が切れます。",
    },
    ko: {
      title: "채팅 인증 코드",
      subtitle: "지원 채팅을 시작하려면 6자리 코드를 입력하세요.",
      footer: "이 코드는 10분 후에 만료됩니다.",
    },
    fr: {
      title: "Code de vérification du chat",
      subtitle: "Entrez ce code à 6 chiffres pour démarrer votre chat d'assistance.",
      footer: "Ce code expire dans 10 minutes.",
    },
    de: {
      title: "Chat-Verifizierungscode",
      subtitle: "Geben Sie diesen 6-stelligen Code ein, um Ihren Support-Chat zu starten.",
      footer: "Dieser Code läuft in 10 Minuten ab.",
    },
    zh: {
      title: "聊天验证码",
      subtitle: "输入此6位验证码以开始您的客服聊天。",
      footer: "此验证码将在10分钟后过期。",
    },
    es: {
      title: "Código de verificación del chat",
      subtitle: "Ingrese este código de 6 dígitos para iniciar su chat de soporte.",
      footer: "Este código expira en 10 minutos.",
    },
    pt: {
      title: "Código de verificação do chat",
      subtitle: "Digite este código de 6 dígitos para iniciar seu chat de suporte.",
      footer: "Este código expira em 10 minutos.",
    },
    ar: {
      title: "رمز التحقق من المحادثة",
      subtitle: "أدخل هذا الرمز المكون من 6 أرقام لبدء محادثة الدعم.",
      footer: "ينتهي هذا الرمز خلال 10 دقائق.",
    },
  };

  const { title, subtitle, footer } = i18n[language] || i18n.en;

  return {
    subject: title,
    html: `<!doctype html>
<html lang="${language}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#FAF7F2;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <div style="background:#ffffff;border:1px solid #E5E7EB;border-radius:16px;overflow:hidden;">
      <div style="padding:24px;text-align:center;border-bottom:1px solid #E5E7EB;">
        <img src="https://jaqyvbjllsanrnpzlyjw.supabase.co/storage/v1/object/public/assets/logo.png" alt="mobile11" style="height:36px;width:auto;" />
      </div>
      <div style="padding:24px;">
        <h2 style="margin:0 0 8px 0;font-size:20px;color:#1A1A1A;">${title}</h2>
        <p style="margin:0 0 16px 0;font-size:14px;color:#4B5563;">${subtitle}</p>
        <p style="margin:0 0 8px 0;font-size:13px;color:#9CA3AF;">${email}</p>
        <div style="margin:16px 0;padding:18px;border-radius:14px;background:#FAF7F2;border:2px solid #E5E7EB;text-align:center;">
          <div style="font-size:32px;letter-spacing:12px;font-weight:700;color:#f97316;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">${code}</div>
        </div>
        <p style="margin:0;font-size:12px;color:#9CA3AF;">${footer}</p>
      </div>
    </div>
  </div>
</body>
</html>`,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = (await req.json()) as Partial<Body>;

    const action = body.action;
    const email = normalizeEmail(String(body.email || ""));
    const sessionToken = String((body as any).sessionToken || "");

    if (action !== "send" && action !== "verify") {
      return json({ error: "Invalid action" }, 400);
    }

    if (!isValidEmail(email)) return json({ error: "Invalid email" }, 400);
    if (!isValidSessionToken(sessionToken)) return json({ error: "Invalid session token" }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return json({ error: "Server misconfigured" }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (action === "send") {
      const validLangs: SupportedLanguage[] = ["en", "th", "ja", "ko", "fr", "de", "zh", "es", "pt", "ar"];
      const language: SupportedLanguage = validLangs.includes((body as SendBody).language as SupportedLanguage) ? ((body as SendBody).language as SupportedLanguage) : "en";
      const code = generateCode();
      const codeHash = await sha256(`${email}:${sessionToken}:${code}`);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      const { error: insertError } = await supabase.from("chat_email_verifications").insert({
        email,
        session_token: sessionToken,
        code_hash: codeHash,
        expires_at: expiresAt,
      });

      if (insertError) {
        console.error("Failed to insert verification row", insertError);
        return json({ error: "Failed to create verification" }, 500);
      }

      const resendKey = Deno.env.get("RESEND_API_KEY") as string;
      if (!resendKey) {
        console.error("Missing RESEND_API_KEY");
        return json({ error: "Email service not configured" }, 500);
      }

      const resend = new Resend(resendKey);
      const tpl = emailTemplate(code, email, language);

      const { error: sendError } = await resend.emails.send({
        from: "mobile11 <noreply@mobile11.com>",
        to: [email],
        subject: tpl.subject,
        html: tpl.html,
      });

      if (sendError) {
        console.error("Resend error", sendError);
        return json({ error: "Failed to send email" }, 500);
      }

      return json({ ok: true });
    }

    // verify
    const code = String((body as VerifyBody).code || "").trim();
    if (!/^\d{6}$/.test(code)) return json({ error: "Invalid code" }, 400);

    const { data: verification, error: fetchError } = await supabase
      .from("chat_email_verifications")
      .select("id, code_hash, expires_at, attempts, verified_at")
      .eq("email", email)
      .eq("session_token", sessionToken)
      .is("verified_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error("Failed to fetch verification", fetchError);
      return json({ error: "Failed to verify" }, 500);
    }

    if (!verification) return json({ error: "No active verification" }, 400);

    const attempts = Number(verification.attempts || 0);
    if (attempts >= 5) return json({ error: "Too many attempts" }, 429);

    const expired = new Date(String(verification.expires_at)).getTime() < Date.now();
    if (expired) return json({ error: "Code expired" }, 400);

    const expectedHash = await sha256(`${email}:${sessionToken}:${code}`);
    if (expectedHash !== verification.code_hash) {
      await supabase
        .from("chat_email_verifications")
        .update({ attempts: attempts + 1 })
        .eq("id", verification.id);

      return json({ error: "Invalid code" }, 400);
    }

    await supabase
      .from("chat_email_verifications")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", verification.id);

    // Find contact by email and attach the current guest session token
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (contactError) {
      console.error("Failed to fetch contact", contactError);
      return json({ error: "Contact lookup failed" }, 500);
    }

    if (!contact?.id) return json({ error: "Contact not found" }, 404);

    const { error: updateContactError } = await supabase
      .from("contacts")
      .update({ session_token: sessionToken })
      .eq("id", contact.id);

    if (updateContactError) {
      console.error("Failed to update contact session_token", updateContactError);
      return json({ error: "Failed to attach session" }, 500);
    }

    // Create conversation
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .insert({
        contact_id: contact.id,
        channel: "web",
        status: "open",
        subject: "Web Chat",
      })
      .select("id")
      .single();

    if (convError) {
      console.error("Failed to create conversation", convError);
      return json({ error: "Failed to create conversation" }, 500);
    }

    return json({ contactId: contact.id, conversationId: conversation.id });
  } catch (e: any) {
    console.error("chat-email-otp error", e);
    return json({ error: "Unexpected error" }, 500);
  }
});
