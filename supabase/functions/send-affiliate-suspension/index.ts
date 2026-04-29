import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SuspensionEmailRequest {
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
    const { email, displayName, affiliateCode, language = 'en', reason }: SuspensionEmailRequest = await req.json();

    console.log(`Sending suspension email to ${email} for affiliate ${affiliateCode}`);

    const isThaiLanguage = language === 'th';
    const isChineseLanguage = language === 'zh';

    const subject = isChineseLanguage
      ? "Mobile11 - 您的合作伙伴账户已被暂停"
      : isThaiLanguage 
        ? "Mobile11 - บัญชีพาร์ทเนอร์ของคุณถูกระงับชั่วคราว"
        : "Mobile11 - Your Partner Account Has Been Suspended";

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

          <!-- Alert Banner -->
          <div style="background-color: #FEF3C7; border-bottom: 1px solid #F59E0B; padding: 15px 30px; text-align: center;">
            <p style="color: #92400E; font-size: 14px; margin: 0; font-weight: 600;">
              ⚠️ ${isChineseLanguage ? '重要通知' : isThaiLanguage ? 'แจ้งเตือนสำคัญ' : 'Important Notice'}
            </p>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #1A1A1A; margin: 0 0 20px 0; font-size: 22px;">
              ${isChineseLanguage ? `您好 ${displayName}` : isThaiLanguage ? `สวัสดี ${displayName}` : `Hello ${displayName}`}
            </h2>
            
            <p style="color: #4B5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              ${isChineseLanguage
                ? '我们在此通知您，您的合作伙伴账户已被临时暂停。在此期间，您的追踪链接将不会生效，您也不会获得销售佣金。'
                : isThaiLanguage 
                  ? 'เราขอแจ้งให้ทราบว่าบัญชีพาร์ทเนอร์ของคุณถูกระงับชั่วคราว ในระหว่างนี้ ลิงก์ติดตามของคุณจะไม่ทำงาน และคุณจะไม่ได้รับค่าคอมมิชชั่นจากการขาย'
                  : 'We are writing to inform you that your partner account has been temporarily suspended. During this time, your tracking links will not be active, and you will not earn commissions on sales.'}
            </p>

            ${reason ? `
            <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <p style="color: #991B1B; font-size: 14px; margin: 0; font-weight: 600;">
                ${isChineseLanguage ? '暂停原因：' : isThaiLanguage ? 'เหตุผลในการระงับ:' : 'Reason for Suspension:'}
              </p>
              <p style="color: #991B1B; font-size: 14px; margin: 10px 0 0 0;">
                ${reason}
              </p>
            </div>
            ` : ''}

            <div style="background-color: #FAF7F2; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <h3 style="color: #1A1A1A; margin: 0 0 15px 0; font-size: 16px;">
                ${isChineseLanguage ? '您应该做什么' : isThaiLanguage ? 'สิ่งที่ควรทำ' : 'What You Should Do'}
              </h3>
              <ul style="color: #4B5563; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>${isChineseLanguage ? '联系我们的客服团队了解详情' : isThaiLanguage ? 'ติดต่อทีมสนับสนุนของเราเพื่อสอบถามรายละเอียด' : 'Contact our support team for more details'}</li>
                <li>${isChineseLanguage ? '查看我们的计划条款和条件' : isThaiLanguage ? 'ตรวจสอบว่าคุณปฏิบัติตามข้อกำหนดและเงื่อนไขของโปรแกรม' : 'Review our program terms and conditions'}</li>
                <li>${isChineseLanguage ? '更新所需的信息或文件（如适用）' : isThaiLanguage ? 'อัปเดตข้อมูลหรือเอกสารที่จำเป็น (ถ้ามี)' : 'Update any required information or documentation'}</li>
              </ul>
            </div>

            <p style="color: #4B5563; font-size: 16px; line-height: 1.6; margin: 20px 0;">
              ${isChineseLanguage
                ? '我们愿意帮助您解决此问题。请联系我们的客服团队获取进一步指导。'
                : isThaiLanguage 
                  ? 'เรายินดีที่จะช่วยเหลือคุณในการแก้ไขปัญหานี้ กรุณาติดต่อทีมสนับสนุนของเราเพื่อขอคำแนะนำเพิ่มเติม'
                  : 'We are here to help you resolve this matter. Please reach out to our support team for further guidance.'}
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://mobile11.co/support" 
                 style="display: inline-block; background-color: #f97316; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                ${isChineseLanguage ? '联系客服' : isThaiLanguage ? 'ติดต่อฝ่ายสนับสนุน' : 'Contact Support'}
              </a>
            </div>

            <div style="border-top: 1px solid #E5E7EB; padding-top: 20px; margin-top: 30px;">
              <p style="color: #4B5563; font-size: 13px; line-height: 1.6; margin: 0;">
                <strong>${isChineseLanguage ? '合作伙伴编号：' : isThaiLanguage ? 'รหัสพาร์ทเนอร์:' : 'Partner Code:'}</strong> ${affiliateCode}
              </p>
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

    console.log("Suspension email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending suspension email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
