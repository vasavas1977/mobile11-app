import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApprovalEmailRequest {
  email: string;
  affiliateCode: string;
  commissionRate: number;
  companyName?: string;
  firstName?: string;
  language?: 'en' | 'th';
}

const content = {
  en: {
    subject: "🎉 Congratulations! Your Partner Application Has Been Approved!",
    programName: "Partner Program",
    title: "You're Approved!",
    subtitle: "Welcome to the Mobile11 Partner Program",
    greeting: (name: string) => `Hi ${name},`,
    message: "Great news! Your partner application has been <strong style=\"color: #10b981;\">approved</strong>. You can now start earning commissions by promoting Mobile11 eSIM products!",
    codeTitle: "Your Unique Partner Code",
    detailsTitle: "📊 Your Commission Details",
    commissionRate: "Commission Rate",
    attributionWindow: "Attribution Window",
    cookieDuration: "Cookie Duration",
    days: "Days",
    gettingStartedTitle: "🚀 Getting Started",
    step1Title: "Access Your Dashboard",
    step1Desc: "Visit your partner dashboard to create tracking links and monitor performance.",
    step2Title: "Create Tracking Links",
    step2Desc: "Generate unique links for different campaigns to track their performance.",
    step3Title: "Share & Earn",
    step3Desc: (rate: number) => `Share your links and earn ${rate}% commission on every sale!`,
    ctaButton: "Go to Partner Dashboard",
    proTip: "Pro Tip:",
    proTipText: "Customers who click your link have 30 days to make a purchase, and you'll still receive credit for the sale!",
    questions: "Questions? Contact our partner support team at",
    footer: "You're receiving this email because your partner application was approved.",
  },
  th: {
    subject: "🎉 ยินดีด้วย! ใบสมัครเป็น Partner ของคุณได้รับการอนุมัติแล้ว!",
    programName: "โปรแกรม Partner",
    title: "คุณได้รับการอนุมัติแล้ว!",
    subtitle: "ยินดีต้อนรับสู่โปรแกรม Partner ของ Mobile11",
    greeting: (name: string) => `สวัสดี ${name}`,
    message: "ข่าวดี! ใบสมัคร Partner ของคุณ<strong style=\"color: #10b981;\">ได้รับการอนุมัติ</strong>แล้ว คุณสามารถเริ่มสร้างรายได้ค่าคอมมิชชั่นจากการโปรโมทผลิตภัณฑ์ eSIM ของ Mobile11 ได้แล้ว!",
    codeTitle: "รหัส Partner ของคุณ",
    detailsTitle: "📊 รายละเอียดค่าคอมมิชชั่น",
    commissionRate: "อัตราค่าคอมมิชชั่น",
    attributionWindow: "ระยะเวลาติดตาม",
    cookieDuration: "ระยะเวลาคุกกี้",
    days: "วัน",
    gettingStartedTitle: "🚀 เริ่มต้นใช้งาน",
    step1Title: "เข้าสู่แดชบอร์ด",
    step1Desc: "เยี่ยมชมแดชบอร์ด Partner เพื่อสร้างลิงก์ติดตามและดูผลการดำเนินงาน",
    step2Title: "สร้างลิงก์ติดตาม",
    step2Desc: "สร้างลิงก์เฉพาะสำหรับแคมเปญต่างๆ เพื่อติดตามผลลัพธ์",
    step3Title: "แชร์และรับรายได้",
    step3Desc: (rate: number) => `แชร์ลิงก์ของคุณและรับค่าคอมมิชชั่น ${rate}% จากทุกยอดขาย!`,
    ctaButton: "ไปที่แดชบอร์ด Partner",
    proTip: "เคล็ดลับ:",
    proTipText: "ลูกค้าที่คลิกลิงก์ของคุณมีเวลา 30 วันในการซื้อ และคุณยังคงได้รับเครดิตจากยอดขายนั้น!",
    questions: "มีคำถาม? ติดต่อทีมซัพพอร์ต Partner ของเราที่",
    footer: "คุณได้รับอีเมลนี้เนื่องจากใบสมัคร Partner ของคุณได้รับการอนุมัติ",
  },
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Send affiliate approval email function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, affiliateCode, commissionRate, companyName, firstName, language = 'en' }: ApprovalEmailRequest = await req.json();

    console.log("Sending affiliate approval email to:", email, "language:", language);

    const t = content[language] || content.en;
    const displayName = firstName || companyName || "Partner";

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
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #4B5563; max-width: 600px; margin: 0 auto; padding: 0; background-color: #FAF7F2;">
          <div style="background-color: #ffffff; border-radius: 12px; overflow: hidden; margin: 20px;">
            <div style="background-color: #ffffff; padding: 30px; text-align: center; border-bottom: 1px solid #E5E7EB;">
              <img src="https://jaqyvbjllsanrnpzlyjw.supabase.co/storage/v1/object/public/assets/logo.png" alt="mobile11" style="height: 40px; width: auto;" />
              <p style="color: #9CA3AF; margin: 10px 0 0 0; font-size: 14px;">${t.programName}</p>
            </div>
            
            <div style="padding: 40px 30px;">
              <h2 style="margin: 0 0 10px; color: #1A1A1A; font-size: 28px; text-align: center;">${t.title}</h2>
              <p style="text-align: center; color: #4B5563; margin: 0 0 30px; font-size: 16px;">${t.subtitle}</p>
              
              <p style="font-size: 18px; margin-bottom: 20px; color: #1A1A1A;">${t.greeting(displayName)}</p>
              
              <p>${t.message}</p>
              
              <div style="background: #FAF7F2; border: 2px solid #f97316; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
                <p style="margin: 0 0 10px 0; color: #4B5563; font-size: 14px;">${t.codeTitle}</p>
                <p style="margin: 0; font-size: 28px; font-weight: bold; color: #f97316; letter-spacing: 2px;">${affiliateCode}</p>
              </div>
              
              <div style="background: #FAF7F2; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="margin: 0 0 15px 0; color: #1A1A1A;">${t.detailsTitle}</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB; color: #4B5563;">${t.commissionRate}</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB; text-align: right; font-weight: bold; color: #f97316;">${commissionRate}%</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB; color: #4B5563;">${t.attributionWindow}</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB; text-align: right; font-weight: bold; color: #1A1A1A;">30 ${t.days}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #4B5563;">${t.cookieDuration}</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #1A1A1A;">30 ${t.days}</td>
                  </tr>
                </table>
              </div>
              
              <h3 style="margin: 25px 0 15px 0; color: #1A1A1A;">${t.gettingStartedTitle}</h3>
              <ol style="padding-left: 20px; margin: 0; color: #4B5563;">
                <li style="margin-bottom: 10px;"><strong style="color: #1A1A1A;">${t.step1Title}</strong> - ${t.step1Desc}</li>
                <li style="margin-bottom: 10px;"><strong style="color: #1A1A1A;">${t.step2Title}</strong> - ${t.step2Desc}</li>
                <li style="margin-bottom: 10px;"><strong style="color: #1A1A1A;">${t.step3Title}</strong> - ${t.step3Desc(commissionRate)}</li>
              </ol>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://mobile11.com/affiliate/dashboard" style="display: inline-block; background-color: #f97316; color: white; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">${t.ctaButton}</a>
              </div>
              
              <div style="background: #FFF7ED; border-left: 4px solid #f97316; border-radius: 0 8px 8px 0; padding: 15px; margin: 25px 0;">
                <p style="margin: 0; font-size: 14px; color: #9a3412;">
                  <strong>💡 ${t.proTip}</strong> ${t.proTipText}
                </p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 25px 0;">
              
              <p style="color: #4B5563; font-size: 14px; margin: 0;">
                ${t.questions} <a href="mailto:affiliate@mobile11.com" style="color: #f97316;">affiliate@mobile11.com</a>
              </p>
            </div>
            
            <div style="background-color: #FAF7F2; text-align: center; padding: 24px; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0; font-size: 12px; color: #9CA3AF;">© ${new Date().getFullYear()} Mobile11. All rights reserved.</p>
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #9CA3AF;">${t.footer}</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Approval email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-affiliate-approval function:", error);
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
