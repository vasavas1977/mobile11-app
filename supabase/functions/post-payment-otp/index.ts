import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function normalizeEmail(email: string) {
  return email.toLowerCase().trim();
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
      title: "Verify your email",
      subtitle: "Enter this 6-digit code to receive your eSIM details.",
      footer: "This code expires in 10 minutes.",
    },
    th: {
      title: "รหัสยืนยันอีเมล",
      subtitle: "กรอกรหัส 6 หลักนี้เพื่อรับรายละเอียด eSIM ของคุณ",
      footer: "โค้ดนี้หมดอายุใน 10 นาที",
    },
    ja: {
      title: "メール認証コード",
      subtitle: "eSIMの詳細を受け取るには、この6桁のコードをご入力ください。",
      footer: "このコードは10分で有効期限が切れます。",
    },
    ko: {
      title: "이메일 인증 코드",
      subtitle: "eSIM 세부 정보를 받으려면 6자리 코드를 입력하세요.",
      footer: "이 코드는 10분 후에 만료됩니다.",
    },
    fr: {
      title: "Vérifiez votre adresse e-mail",
      subtitle: "Entrez ce code à 6 chiffres pour recevoir les détails de votre eSIM.",
      footer: "Ce code expire dans 10 minutes.",
    },
    de: {
      title: "E-Mail-Adresse bestätigen",
      subtitle: "Geben Sie diesen 6-stelligen Code ein, um Ihre eSIM-Details zu erhalten.",
      footer: "Dieser Code läuft in 10 Minuten ab.",
    },
    zh: {
      title: "验证您的邮箱",
      subtitle: "输入此6位验证码以接收您的eSIM详情。",
      footer: "此验证码将在10分钟后过期。",
    },
    es: {
      title: "Verifique su correo electrónico",
      subtitle: "Ingrese este código de 6 dígitos para recibir los detalles de su eSIM.",
      footer: "Este código expira en 10 minutos.",
    },
    pt: {
      title: "Verifique seu e-mail",
      subtitle: "Digite este código de 6 dígitos para receber os detalhes do seu eSIM.",
      footer: "Este código expira em 10 minutos.",
    },
    ar: {
      title: "تحقق من بريدك الإلكتروني",
      subtitle: "أدخل هذا الرمز المكون من 6 أرقام لتلقي تفاصيل eSIM الخاصة بك.",
      footer: "ينتهي هذا الرمز خلال 10 دقائق.",
    },
  };

  const { title, subtitle, footer } = i18n[language] || i18n.en;

  return {
    subject: title,
    html: `<!doctype html>
<html lang="${language}">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f6f7fb;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <div style="background:#ffffff;border:1px solid #e6e8ef;border-radius:16px;padding:24px;">
      <h2 style="margin:0 0 8px 0;font-size:20px;color:#111827;">${title}</h2>
      <p style="margin:0 0 16px 0;font-size:14px;color:#4b5563;">${subtitle}</p>
      <p style="margin:0 0 8px 0;font-size:13px;color:#6b7280;">${email}</p>
      <div style="margin:16px 0;padding:18px;border-radius:14px;background:#f9fafb;border:1px dashed #d1d5db;text-align:center;">
        <div style="font-size:32px;letter-spacing:12px;font-weight:700;color:#111827;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">${code}</div>
      </div>
      <p style="margin:0;font-size:12px;color:#6b7280;">${footer}</p>
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
    const body = await req.json();
    const action = body.action;
    const userId = String(body.userId || "");
    const email = normalizeEmail(String(body.email || ""));
    const validLangs: SupportedLanguage[] = ["en", "th", "ja", "ko", "fr", "de", "zh", "es", "pt", "ar"];
    const language: SupportedLanguage = validLangs.includes(body.language as SupportedLanguage) ? (body.language as SupportedLanguage) : "en";

    if (action !== "send" && action !== "verify") {
      return json({ error: "Invalid action" }, 400);
    }
    if (!userId || !email) return json({ error: "Missing userId or email" }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (action === "send") {
      // Rate limit: max 1 active code per user per 60s
      const { data: recent } = await supabase
        .from("post_payment_verifications")
        .select("created_at")
        .eq("user_id", userId)
        .eq("email", email)
        .is("verified_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recent) {
        const ageMs = Date.now() - new Date(recent.created_at).getTime();
        if (ageMs < 60_000) {
          return json({ error: "Please wait before requesting a new code", cooldown: Math.ceil((60_000 - ageMs) / 1000) }, 429);
        }
      }

      const code = generateCode();
      const codeHash = await sha256(`${userId}:${email}:${code}`);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      const { error: insertError } = await supabase.from("post_payment_verifications").insert({
        user_id: userId,
        email,
        code_hash: codeHash,
        expires_at: expiresAt,
      });

      if (insertError) {
        console.error("Insert error:", insertError);
        return json({ error: "Failed to create verification" }, 500);
      }

      const resendKey = Deno.env.get("RESEND_API_KEY")!;
      const resend = new Resend(resendKey);
      const tpl = emailTemplate(code, email, language);

      const { error: sendError } = await resend.emails.send({
        from: "mobile11 <noreply@mobile11.com>",
        to: [email],
        subject: tpl.subject,
        html: tpl.html,
      });

      if (sendError) {
        console.error("Resend error:", sendError);
        return json({ error: "Failed to send email" }, 500);
      }

      return json({ ok: true });
    }

    // verify
    const code = String(body.code || "").trim();
    if (!/^\d{6}$/.test(code)) return json({ error: "Invalid code" }, 400);

    const { data: verification, error: fetchError } = await supabase
      .from("post_payment_verifications")
      .select("id, code_hash, expires_at, attempts, verified_at")
      .eq("user_id", userId)
      .eq("email", email)
      .is("verified_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error("Fetch error:", fetchError);
      return json({ error: "Failed to verify" }, 500);
    }
    if (!verification) return json({ error: "No active verification" }, 400);

    const attempts = Number(verification.attempts || 0);
    if (attempts >= 5) return json({ error: "Too many attempts" }, 429);

    if (new Date(verification.expires_at).getTime() < Date.now()) {
      return json({ error: "Code expired" }, 400);
    }

    const expectedHash = await sha256(`${userId}:${email}:${code}`);
    if (expectedHash !== verification.code_hash) {
      await supabase
        .from("post_payment_verifications")
        .update({ attempts: attempts + 1 })
        .eq("id", verification.id);
      return json({ error: "Invalid code" }, 400);
    }

    // Mark verified
    await supabase
      .from("post_payment_verifications")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", verification.id);

    return json({ ok: true, verified: true });
  } catch (e: any) {
    console.error("post-payment-otp error:", e);
    return json({ error: "Unexpected error" }, 500);
  }
});
