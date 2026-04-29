import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SocialChannels {
  facebook?: string;
  tiktok?: string;
  youtube?: string;
  instagram?: string;
  twitter?: string;
  other?: string;
}

interface AffiliateConfirmationRequest {
  email: string;
  affiliateCode: string;
  displayName?: string;
  socialChannels?: SocialChannels;
  language?: 'en' | 'th';
}

const content = {
  en: {
    subject: "Your Partner Application Has Been Received! 🎉",
    programName: "Partner Program",
    title: "Application Received! 🎉",
    greeting: "Thank you for applying to join the Mobile11 Partner Program! We're excited about the possibility of partnering with you.",
    detailsTitle: "Your Application Details",
    affiliateCode: "Partner Code:",
    displayName: "Display Name:",
    socialChannels: "Social Channels:",
    whatsNextTitle: "What Happens Next?",
    step1Title: "Review Process",
    step1Desc: "Our team will review your application within 1-3 business days.",
    step2Title: "Approval Notification",
    step2Desc: "You'll receive an email once your application is approved.",
    step3Title: "Start Earning",
    step3Desc: "Once approved, access your dashboard to get your tracking links and start earning commissions!",
    commissionTitle: "💰 Commission Details",
    commission1: "Up to 16% commission based on tier",
    commission2: "30-day cookie attribution window",
    commission3: "Monthly payouts (minimum $50 USD)",
    questions: "Have questions? Reply to this email or contact our support team.",
    footer: "Unlimited eSIM for Global Travelers",
  },
  th: {
    subject: "เราได้รับใบสมัครเป็น Partner แล้ว! 🎉",
    programName: "โปรแกรม Partner",
    title: "เราได้รับใบสมัครแล้ว! 🎉",
    greeting: "ขอบคุณที่สมัครเข้าร่วมโปรแกรม Partner ของ Mobile11! เรารู้สึกตื่นเต้นที่จะได้ร่วมงานกับคุณ",
    detailsTitle: "รายละเอียดใบสมัครของคุณ",
    affiliateCode: "รหัส Partner:",
    displayName: "ชื่อที่แสดง:",
    socialChannels: "ช่องทางโซเชียล:",
    whatsNextTitle: "ขั้นตอนต่อไป",
    step1Title: "ขั้นตอนการตรวจสอบ",
    step1Desc: "ทีมงานจะตรวจสอบใบสมัครของคุณภายใน 1-3 วันทำการ",
    step2Title: "การแจ้งเตือนการอนุมัติ",
    step2Desc: "คุณจะได้รับอีเมลเมื่อใบสมัครได้รับการอนุมัติ",
    step3Title: "เริ่มสร้างรายได้",
    step3Desc: "เมื่อได้รับการอนุมัติ เข้าสู่แดชบอร์ดเพื่อรับลิงก์ติดตามและเริ่มสร้างรายได้ค่าคอมมิชชั่น!",
    commissionTitle: "💰 รายละเอียดค่าคอมมิชชั่น",
    commission1: "ค่าคอมมิชชั่นสูงสุด 16% ตามระดับ",
    commission2: "ระยะเวลาติดตามคุกกี้ 30 วัน",
    commission3: "จ่ายรายเดือน (ขั้นต่ำ $50 USD)",
    questions: "มีคำถาม? ตอบกลับอีเมลนี้หรือติดต่อทีมซัพพอร์ตของเรา",
    footer: "eSIM ไม่จำกัดสำหรับนักเดินทางทั่วโลก",
  },
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, affiliateCode, displayName, socialChannels, language = 'en' }: AffiliateConfirmationRequest = await req.json();

    console.log("Sending affiliate confirmation email to:", email, "language:", language);

    const t = content[language] || content.en;

    // Format social channels for display
    const socialChannelsList = socialChannels
      ? Object.entries(socialChannels)
          .filter(([_, value]) => value && value.trim())
          .map(([platform, url]) => `${platform.charAt(0).toUpperCase() + platform.slice(1)}: ${url}`)
          .join('<br>')
      : '';

    const emailResponse = await resend.emails.send({
      from: "Mobile11 Partner Program <noreply@mobile11.com>",
      to: [email],
      subject: t.subject,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #FAF7F2;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF7F2; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color: #ffffff; padding: 30px; text-align: center; border-bottom: 1px solid #E5E7EB;">
              <img src="https://jaqyvbjllsanrnpzlyjw.supabase.co/storage/v1/object/public/assets/logo.png" alt="mobile11" style="height: 40px; width: auto;" />
              <p style="margin: 10px 0 0; color: #9CA3AF; font-size: 14px;">${t.programName}</p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1A1A1A; font-size: 24px; font-weight: 600;">${t.title}</h2>
              
              <p style="margin: 0 0 20px; color: #4B5563; font-size: 16px; line-height: 1.6;">
                ${t.greeting}
              </p>

              <!-- Application Details -->
              <div style="background-color: #FAF7F2; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <h3 style="margin: 0 0 16px; color: #1A1A1A; font-size: 16px; font-weight: 600;">${t.detailsTitle}</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0; color: #4B5563; font-size: 14px;">${t.affiliateCode}</td>
                    <td style="padding: 8px 0; color: #f97316; font-size: 14px; font-weight: 600; text-align: right;">${affiliateCode}</td>
                  </tr>
                  ${displayName ? `
                  <tr>
                    <td style="padding: 8px 0; color: #4B5563; font-size: 14px;">${t.displayName}</td>
                    <td style="padding: 8px 0; color: #1A1A1A; font-size: 14px; text-align: right;">${displayName}</td>
                  </tr>
                  ` : ''}
                  ${socialChannelsList ? `
                  <tr>
                    <td style="padding: 8px 0; color: #4B5563; font-size: 14px; vertical-align: top;">${t.socialChannels}</td>
                    <td style="padding: 8px 0; color: #1A1A1A; font-size: 14px; text-align: right;">${socialChannelsList}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>

              <!-- What's Next -->
              <h3 style="margin: 24px 0 16px; color: #1A1A1A; font-size: 18px; font-weight: 600;">${t.whatsNextTitle}</h3>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 12px 0; vertical-align: top; width: 40px;">
                    <div style="display: inline-block; width: 28px; height: 28px; background-color: #f97316; border-radius: 50%; text-align: center; line-height: 28px; color: white; font-weight: 600; font-size: 14px;">1</div>
                  </td>
                  <td style="padding: 12px 0; color: #4B5563; font-size: 14px; line-height: 1.5;">
                    <strong style="color: #1A1A1A;">${t.step1Title}</strong><br>
                    ${t.step1Desc}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; vertical-align: top; width: 40px;">
                    <div style="display: inline-block; width: 28px; height: 28px; background-color: #f97316; border-radius: 50%; text-align: center; line-height: 28px; color: white; font-weight: 600; font-size: 14px;">2</div>
                  </td>
                  <td style="padding: 12px 0; color: #4B5563; font-size: 14px; line-height: 1.5;">
                    <strong style="color: #1A1A1A;">${t.step2Title}</strong><br>
                    ${t.step2Desc}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; vertical-align: top; width: 40px;">
                    <div style="display: inline-block; width: 28px; height: 28px; background-color: #f97316; border-radius: 50%; text-align: center; line-height: 28px; color: white; font-weight: 600; font-size: 14px;">3</div>
                  </td>
                  <td style="padding: 12px 0; color: #4B5563; font-size: 14px; line-height: 1.5;">
                    <strong style="color: #1A1A1A;">${t.step3Title}</strong><br>
                    ${t.step3Desc}
                  </td>
                </tr>
              </table>

              <!-- Commission Info -->
              <div style="background-color: #FFF7ED; border-left: 4px solid #f97316; border-radius: 0 8px 8px 0; padding: 20px; margin: 24px 0;">
                <h4 style="margin: 0 0 12px; color: #9a3412; font-size: 14px; font-weight: 600;">${t.commissionTitle}</h4>
                <ul style="margin: 0; padding: 0 0 0 20px; color: #9a3412; font-size: 14px; line-height: 1.8;">
                  <li>${t.commission1}</li>
                  <li>${t.commission2}</li>
                  <li>${t.commission3}</li>
                </ul>
              </div>

              <p style="margin: 24px 0 0; color: #4B5563; font-size: 14px; line-height: 1.6;">
                ${t.questions}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #FAF7F2; padding: 24px 40px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0 0 8px; color: #9CA3AF; font-size: 12px;">
                © ${new Date().getFullYear()} Mobile11. All rights reserved.
              </p>
              <p style="margin: 0; color: #9CA3AF; font-size: 12px;">
                ${t.footer}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending affiliate confirmation email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
