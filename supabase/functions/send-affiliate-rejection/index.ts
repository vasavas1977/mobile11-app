import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RejectionEmailRequest {
  email: string;
  displayName: string;
  affiliateCode: string;
  language?: string;
  reason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, displayName, affiliateCode, language = 'en', reason }: RejectionEmailRequest = await req.json();

    console.log(`Sending rejection email to ${email} for affiliate ${affiliateCode}`);

    const isThaiLanguage = language === 'th';
    const isChineseLanguage = language === 'zh';

    const subject = isChineseLanguage
      ? "Mobile11 - 您的合作伙伴申请状态"
      : isThaiLanguage 
        ? "Mobile11 - การสมัครพาร์ทเนอร์ของคุณ"
        : "Mobile11 - Your Partner Application Status";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #FAF7F2;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          
          <!-- Header -->
          <div style="background-color: #ffffff; padding: 30px; text-align: center; border-bottom: 1px solid #E5E7EB;">
            <img src="https://jaqyvbjllsanrnpzlyjw.supabase.co/storage/v1/object/public/assets/logo.png" alt="mobile11" style="height: 40px; width: auto;" />
            <p style="color: #9CA3AF; margin: 10px 0 0 0; font-size: 14px;">
              ${isChineseLanguage ? '合作伙伴计划' : isThaiLanguage ? 'โปรแกรมพาร์ทเนอร์' : 'Partner Program'}
            </p>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #1A1A1A; margin: 0 0 20px 0; font-size: 22px;">
              ${isChineseLanguage ? `您好 ${displayName}` : isThaiLanguage ? `สวัสดี ${displayName}` : `Hello ${displayName}`}
            </h2>
            
            <p style="color: #4B5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              ${isChineseLanguage
                ? '感谢您对加入 Mobile11 合作伙伴计划的兴趣。经过仔细审核，很遗憾地通知您，我们目前无法批准您的申请。'
                : isThaiLanguage 
                  ? 'ขอบคุณที่สนใจเข้าร่วมโปรแกรมพาร์ทเนอร์ของ Mobile11 หลังจากการพิจารณาอย่างรอบคอบ เราขอแจ้งให้ทราบว่าเราไม่สามารถอนุมัติใบสมัครของคุณได้ในขณะนี้'
                  : 'Thank you for your interest in joining the Mobile11 Partner Program. After careful review, we regret to inform you that we are unable to approve your application at this time.'}
            </p>

            ${reason ? `
            <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <p style="color: #991B1B; font-size: 14px; margin: 0; font-weight: 600;">
                ${isChineseLanguage ? '原因：' : isThaiLanguage ? 'เหตุผล:' : 'Reason:'}
              </p>
              <p style="color: #991B1B; font-size: 14px; margin: 10px 0 0 0;">
                ${reason}
              </p>
            </div>
            ` : ''}

            <div style="background-color: #FAF7F2; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <h3 style="color: #1A1A1A; margin: 0 0 15px 0; font-size: 16px;">
                ${isChineseLanguage ? '后续步骤' : isThaiLanguage ? 'ขั้นตอนต่อไป' : 'Next Steps'}
              </h3>
              <ul style="color: #4B5563; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>${isChineseLanguage ? '检查您的申请详情' : isThaiLanguage ? 'ตรวจสอบข้อมูลในใบสมัครของคุณ' : 'Review your application details'}</li>
                <li>${isChineseLanguage ? '更新您的社交媒体渠道' : isThaiLanguage ? 'อัปเดตช่องทางโซเชียลมีเดียของคุณ' : 'Update your social media channels'}</li>
                <li>${isChineseLanguage ? '您可以在30天后重新申请' : isThaiLanguage ? 'คุณสามารถสมัครใหม่ได้หลังจาก 30 วัน' : 'You may reapply after 30 days'}</li>
              </ul>
            </div>

            <p style="color: #4B5563; font-size: 16px; line-height: 1.6; margin: 20px 0;">
              ${isChineseLanguage
                ? '如果您有任何疑问或需要帮助，请联系我们的客服团队。'
                : isThaiLanguage 
                  ? 'หากคุณมีคำถามหรือต้องการความช่วยเหลือ กรุณาติดต่อทีมสนับสนุนของเรา'
                  : 'If you have any questions or need assistance, please contact our support team.'}
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://mobile11.co/support" 
                 style="display: inline-block; background-color: #f97316; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                ${isChineseLanguage ? '联系客服' : isThaiLanguage ? 'ติดต่อฝ่ายสนับสนุน' : 'Contact Support'}
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #FAF7F2; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB;">
            <p style="color: #9CA3AF; font-size: 12px; margin: 0 0 10px 0;">
              ${isChineseLanguage ? '此邮件由 Mobile11 发送' : isThaiLanguage ? 'อีเมลนี้ส่งโดย Mobile11' : 'This email was sent by Mobile11'}
            </p>
            <p style="color: #9CA3AF; font-size: 11px; margin: 0;">
              © ${new Date().getFullYear()} Mobile11. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Mobile11 Partners <partners@mobile11.co>",
      to: [email],
      subject: subject,
      html: htmlContent,
    });

    console.log("Rejection email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending rejection email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
