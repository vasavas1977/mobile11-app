import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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

type Lang = "en" | "th" | "ja" | "ko" | "fr" | "de" | "zh" | "es" | "pt" | "ar";

const templates: Record<Lang, { subject: string; greeting: string; ready: string; features: string[]; signInCta: string; signInUrl: string; thanks: string }> = {
  en: {
    subject: "Welcome to Mobile11! \u{1F389}",
    greeting: "Welcome to Mobile11!",
    ready: "Your account is all set up and ready to go. You can now sign in anytime to manage your eSIMs.",
    features: [
      "View and manage your eSIM details",
      "Track your order history",
      "Get instant access to new eSIM packages",
      "Manage your account settings",
    ],
    signInCta: "Sign In to Your Account",
    signInUrl: "Sign in now",
    thanks: "Thank you for choosing Mobile11 \u2014 stay connected wherever you travel!",
  },
  th: {
    subject: "\u0E22\u0E34\u0E19\u0E14\u0E35\u0E15\u0E49\u0E2D\u0E19\u0E23\u0E31\u0E1A\u0E2A\u0E39\u0E48 Mobile11! \u{1F389}",
    greeting: "\u0E22\u0E34\u0E19\u0E14\u0E35\u0E15\u0E49\u0E2D\u0E19\u0E23\u0E31\u0E1A\u0E2A\u0E39\u0E48 Mobile11!",
    ready: "\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E41\u0E25\u0E49\u0E27\u0E04\u0E48\u0E30 \u0E04\u0E38\u0E13\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E39\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23 eSIM \u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E44\u0E14\u0E49\u0E17\u0E38\u0E01\u0E40\u0E27\u0E25\u0E32",
    features: [
      "\u0E14\u0E39\u0E41\u0E25\u0E30\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14 eSIM",
      "\u0E15\u0E34\u0E14\u0E15\u0E32\u0E21\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E2A\u0E31\u0E48\u0E07\u0E0B\u0E37\u0E49\u0E2D",
      "\u0E40\u0E02\u0E49\u0E32\u0E16\u0E36\u0E07\u0E41\u0E1E\u0E47\u0E01\u0E40\u0E01\u0E08 eSIM \u0E43\u0E2B\u0E21\u0E48\u0E44\u0E14\u0E49\u0E17\u0E31\u0E19\u0E17\u0E35",
      "\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E1A\u0E31\u0E0D\u0E0A\u0E35",
    ],
    signInCta: "\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E39\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13",
    signInUrl: "\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E39\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E40\u0E25\u0E22",
    thanks: "\u0E02\u0E2D\u0E1A\u0E04\u0E38\u0E13\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01 Mobile11 \u2014 \u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E15\u0E48\u0E2D\u0E17\u0E38\u0E01\u0E17\u0E35\u0E48\u0E17\u0E35\u0E48\u0E04\u0E38\u0E13\u0E40\u0E14\u0E34\u0E19\u0E17\u0E32\u0E07\u0E04\u0E48\u0E30!",
  },
  ja: {
    subject: "Mobile11\u3078\u3088\u3046\u3053\u305D\uFF01\u{1F389}",
    greeting: "Mobile11\u3078\u3088\u3046\u3053\u305D\uFF01",
    ready: "\u30A2\u30AB\u30A6\u30F3\u30C8\u306E\u8A2D\u5B9A\u304C\u5B8C\u4E86\u3044\u305F\u3057\u307E\u3057\u305F\u3002\u3044\u3064\u3067\u3082\u30B5\u30A4\u30F3\u30A4\u30F3\u3057\u3066eSIM\u3092\u7BA1\u7406\u3067\u304D\u307E\u3059\u3002",
    features: [
      "eSIM\u306E\u8A73\u7D30\u3092\u78BA\u8A8D\u30FB\u7BA1\u7406",
      "\u6CE8\u6587\u5C65\u6B74\u306E\u78BA\u8A8D",
      "\u65B0\u3057\u3044eSIM\u30D1\u30C3\u30B1\u30FC\u30B8\u306B\u3059\u3050\u30A2\u30AF\u30BB\u30B9",
      "\u30A2\u30AB\u30A6\u30F3\u30C8\u8A2D\u5B9A\u306E\u7BA1\u7406",
    ],
    signInCta: "\u30A2\u30AB\u30A6\u30F3\u30C8\u306B\u30B5\u30A4\u30F3\u30A4\u30F3",
    signInUrl: "\u30B5\u30A4\u30F3\u30A4\u30F3\u3059\u308B",
    thanks: "Mobile11\u3092\u3054\u5229\u7528\u3044\u305F\u3060\u304D\u8AA0\u306B\u3042\u308A\u304C\u3068\u3046\u3054\u3056\u3044\u307E\u3059\u3002\u65C5\u5148\u3067\u3082\u5FEB\u9069\u306A\u63A5\u7D9A\u3092\u304A\u697D\u3057\u307F\u304F\u3060\u3055\u3044\uFF01",
  },
  ko: {
    subject: "Mobile11\uC5D0 \uC624\uC2E0 \uAC83\uC744 \uD658\uC601\uD569\uB2C8\uB2E4! \u{1F389}",
    greeting: "Mobile11\uC5D0 \uC624\uC2E0 \uAC83\uC744 \uD658\uC601\uD569\uB2C8\uB2E4!",
    ready: "\uACC4\uC815 \uC124\uC815\uC774 \uC644\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uC5B8\uC81C\uB4E0\uC9C0 \uB85C\uADF8\uC778\uD558\uC5EC eSIM\uC744 \uAD00\uB9AC\uD558\uC2E4 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
    features: [
      "eSIM \uC138\uBD80 \uC815\uBCF4 \uD655\uC778 \uBC0F \uAD00\uB9AC",
      "\uC8FC\uBB38 \uB0B4\uC5ED \uD655\uC778",
      "\uC0C8\uB85C\uC6B4 eSIM \uD328\uD0A4\uC9C0 \uC989\uC2DC \uC774\uC6A9",
      "\uACC4\uC815 \uC124\uC815 \uAD00\uB9AC",
    ],
    signInCta: "\uACC4\uC815\uC5D0 \uB85C\uADF8\uC778",
    signInUrl: "\uB85C\uADF8\uC778\uD558\uAE30",
    thanks: "Mobile11\uC744 \uC120\uD0DD\uD574 \uC8FC\uC154\uC11C \uAC10\uC0AC\uD569\uB2C8\uB2E4 \u2014 \uC5B4\uB514\uC11C\uB4E0 \uC5F0\uACB0\uB41C \uC5EC\uD589\uC744 \uC990\uAE30\uC138\uC694!",
  },
  fr: {
    subject: "Bienvenue sur Mobile11 ! \u{1F389}",
    greeting: "Bienvenue sur Mobile11 !",
    ready: "Votre compte est pr\u00EAt \u00E0 l\u2019emploi. Vous pouvez d\u00E9sormais vous connecter \u00E0 tout moment pour g\u00E9rer vos eSIM.",
    features: [
      "Consultez et g\u00E9rez vos eSIM",
      "Suivez l\u2019historique de vos commandes",
      "Acc\u00E9dez instantan\u00E9ment aux nouveaux forfaits eSIM",
      "G\u00E9rez les param\u00E8tres de votre compte",
    ],
    signInCta: "Se connecter \u00E0 votre compte",
    signInUrl: "Se connecter",
    thanks: "Merci d\u2019avoir choisi Mobile11 \u2014 restez connect\u00E9(e) o\u00F9 que vous voyagiez !",
  },
  de: {
    subject: "Willkommen bei Mobile11! \u{1F389}",
    greeting: "Willkommen bei Mobile11!",
    ready: "Ihr Konto ist eingerichtet und einsatzbereit. Sie k\u00F6nnen sich jederzeit anmelden, um Ihre eSIMs zu verwalten.",
    features: [
      "eSIM-Details einsehen und verwalten",
      "Bestellverlauf nachverfolgen",
      "Sofortiger Zugriff auf neue eSIM-Pakete",
      "Kontoeinstellungen verwalten",
    ],
    signInCta: "In Ihr Konto einloggen",
    signInUrl: "Jetzt anmelden",
    thanks: "Vielen Dank, dass Sie sich f\u00FCr Mobile11 entschieden haben \u2014 bleiben Sie verbunden, wohin auch immer Ihre Reise geht!",
  },
  zh: {
    subject: "欢迎来到Mobile11！🎉",
    greeting: "欢迎来到Mobile11！",
    ready: "您的账户已设置完成。您可以随时登录管理您的eSIM。",
    features: [
      "查看和管理您的eSIM详情",
      "追踪您的订单记录",
      "即时获取最新eSIM套餐",
      "管理您的账户设置",
    ],
    signInCta: "登录您的账户",
    signInUrl: "立即登录",
    thanks: "感谢您选择Mobile11——无论您去哪里，都能保持连接！",
  },
  es: {
    subject: "¡Bienvenido a Mobile11! 🎉",
    greeting: "¡Bienvenido a Mobile11!",
    ready: "Su cuenta está configurada y lista. Puede iniciar sesión en cualquier momento para gestionar sus eSIMs.",
    features: [
      "Ver y gestionar los detalles de su eSIM",
      "Seguir el historial de sus pedidos",
      "Acceso inmediato a nuevos paquetes eSIM",
      "Gestionar la configuración de su cuenta",
    ],
    signInCta: "Iniciar sesión en su cuenta",
    signInUrl: "Iniciar sesión",
    thanks: "Gracias por elegir Mobile11 — ¡manténgase conectado donde quiera que viaje!",
  },
  pt: {
    subject: "Bem-vindo ao Mobile11! 🎉",
    greeting: "Bem-vindo ao Mobile11!",
    ready: "Sua conta está configurada e pronta. Você pode fazer login a qualquer momento para gerenciar seus eSIMs.",
    features: [
      "Visualizar e gerenciar detalhes do eSIM",
      "Acompanhar o histórico de pedidos",
      "Acesso instantâneo a novos pacotes eSIM",
      "Gerenciar configurações da conta",
    ],
    signInCta: "Entrar na sua conta",
    signInUrl: "Entrar agora",
    thanks: "Obrigado por escolher o Mobile11 — fique conectado onde quer que viaje!",
  },
  ar: {
    subject: "مرحبًا بك في Mobile11! 🎉",
    greeting: "مرحبًا بك في Mobile11!",
    ready: "تم إعداد حسابك وهو جاهز للاستخدام. يمكنك تسجيل الدخول في أي وقت لإدارة شرائح eSIM الخاصة بك.",
    features: [
      "عرض وإدارة تفاصيل eSIM",
      "تتبع سجل الطلبات",
      "الوصول الفوري إلى حزم eSIM الجديدة",
      "إدارة إعدادات الحساب",
    ],
    signInCta: "تسجيل الدخول إلى حسابك",
    signInUrl: "تسجيل الدخول الآن",
    thanks: "شكرًا لاختيارك Mobile11 — ابقَ متصلاً أينما سافرت!",
  },
};

function buildHtml(lang: Lang, siteUrl: string): string {
  const t = templates[lang];
  const featureItems = t.features.map((f) => `<li style="margin-bottom:8px;color:#4B5563;">${f}</li>`).join("");

  return `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#FAF7F2;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF7F2;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
  <tr><td style="background-color:#ffffff;padding:30px;text-align:center;border-bottom:1px solid #E5E7EB;">
    <img src="https://jaqyvbjllsanrnpzlyjw.supabase.co/storage/v1/object/public/assets/logo.png" alt="mobile11" style="height:40px;width:auto;" />
  </td></tr>
  <tr><td style="padding:40px;">
    <h1 style="margin:0 0 20px;color:#1A1A1A;font-size:28px;font-weight:bold;text-align:center;">${t.greeting}</h1>
    <p style="font-size:16px;line-height:1.6;color:#4B5563;margin:0 0 24px;">${t.ready}</p>
    <ul style="font-size:15px;line-height:1.6;padding-left:20px;margin:0 0 32px;color:#4B5563;">
      ${featureItems}
    </ul>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <a href="${siteUrl}/auth" style="display:inline-block;background-color:#f97316;color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;padding:14px 32px;border-radius:8px;">${t.signInCta}</a>
      </td></tr>
    </table>
    <p style="font-size:14px;line-height:1.6;color:#4B5563;margin:32px 0 0;text-align:center;">${t.thanks}</p>
  </td></tr>
  <tr><td style="background-color:#FAF7F2;padding:24px 40px;text-align:center;border-top:1px solid #E5E7EB;">
    <p style="margin:0;font-size:12px;color:#9CA3AF;">\u00A9 ${new Date().getFullYear()} Mobile11. All rights reserved.</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, language } = await req.json();

    if (!email) return json({ error: "email is required" }, 400);

    const validLangs: Lang[] = ["en", "th", "ja", "ko", "fr", "de", "zh", "es", "pt", "ar"];
    const lang: Lang = validLangs.includes(language) ? language : "en";

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) return json({ error: "RESEND_API_KEY not configured" }, 500);

    const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://mobile11.com";
    const resend = new Resend(resendKey);
    const t = templates[lang];

    const { error: sendError } = await resend.emails.send({
      from: "Mobile11 <no-reply@notify.mobile11.com>",
      to: [email],
      subject: t.subject,
      html: buildHtml(lang, frontendUrl),
    });

    if (sendError) {
      console.error("Resend error:", sendError);
      return json({ error: "Failed to send welcome email" }, 500);
    }

    return json({ success: true });
  } catch (err: any) {
    console.error("send-welcome-email error:", err);
    return json({ error: err.message }, 500);
  }
});
