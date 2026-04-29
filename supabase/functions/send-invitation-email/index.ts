import { Resend } from 'https://esm.sh/resend@4.0.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InvitationEmailRequest {
  email: string;
  organizationName: string;
  inviterName: string;
  role: string;
  token: string;
  language?: 'en' | 'th';
}

const emailContent = {
  en: {
    subject: (orgName: string) => `You've been invited to join ${orgName}`,
    title: 'Team Invitation 🎉',
    message: (inviterName: string, orgName: string, role: string) => 
      `${inviterName} has invited you to join <strong>${orgName}</strong> as a <strong>${role}</strong>.`,
    button: 'Accept Invitation',
    expiry: 'This invitation will expire in 7 days.',
    footer: 'mobile11 - Business eSIM Management',
    footerSupport: 'Questions? Contact your organization administrator',
    ignore: "If you weren't expecting this invitation, you can safely ignore this email.",
  },
  th: {
    subject: (orgName: string) => `คุณได้รับเชิญให้เข้าร่วม ${orgName}`,
    title: 'คำเชิญเข้าร่วมทีม 🎉',
    message: (inviterName: string, orgName: string, role: string) => 
      `${inviterName} เชิญคุณเข้าร่วม <strong>${orgName}</strong> ในฐานะ <strong>${role}</strong>`,
    button: 'ยอมรับคำเชิญ',
    expiry: 'คำเชิญนี้จะหมดอายุใน 7 วัน',
    footer: 'mobile11 - ระบบจัดการ eSIM สำหรับธุรกิจ',
    footerSupport: 'มีคำถาม? ติดต่อผู้ดูแลองค์กรของคุณ',
    ignore: 'หากคุณไม่ได้คาดหวังคำเชิญนี้ คุณสามารถเพิกเฉยอีเมลนี้ได้อย่างปลอดภัย',
  }
}

const roleLabels = {
  en: {
    owner: 'Owner',
    admin: 'Admin',
    manager: 'Manager',
    member: 'Member',
  },
  th: {
    owner: 'เจ้าของ',
    admin: 'แอดมิน',
    manager: 'ผู้จัดการ',
    member: 'สมาชิก',
  }
}

function generateInvitationHtml(
  lang: SupportedLang,
  inviterName: string,
  organizationName: string,
  role: string,
  acceptUrl: string
): string {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const content = emailContent[lang];
  const roleLabel = roleLabels[lang]?.[role] || roleLabels.en[role] || role;

  return `
    <!DOCTYPE html>
    <html lang="${lang}" dir="${dir}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${content.title}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #FAF7F2; direction: ${dir};">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background-color: #ffffff; padding: 30px; text-align: center; border-bottom: 1px solid #E5E7EB;">
          <img src="https://jaqyvbjllsanrnpzlyjw.supabase.co/storage/v1/object/public/assets/logo.png" alt="mobile11" style="height: 40px; width: auto;" />
        </div>

        <!-- Content -->
        <div style="padding: 50px 30px;">
          <h2 style="font-size: 28px; font-weight: bold; color: #1A1A1A; margin: 0 0 20px 0; text-align: center;">${content.title}</h2>
          
          <p style="font-size: 16px; color: #4B5563; line-height: 1.6; margin: 0 0 30px 0; text-align: center;">
            ${content.message(inviterName, organizationName, roleLabel)}
          </p>

          <div style="text-align: center; margin: 40px 0;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
              <tr>
                <td style="border-radius: 8px; background-color: #f97316;" bgcolor="#f97316">
                  <a href="${acceptUrl}" target="_blank" style="display: inline-block; padding: 16px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">${content.button}</a>
                </td>
              </tr>
            </table>
          </div>

          <p style="text-align: center; margin-top: 20px; font-size: 12px; color: #9CA3AF;">
            ${content.cantClick}<br/>
            <a href="${acceptUrl}" style="color: #f97316; word-break: break-all; font-size: 11px;">${acceptUrl}</a>
          </p>

          <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
            <p style="font-size: 14px; color: #92400E; margin: 0;">
              <strong>⏰ ${content.expiry}</strong>
            </p>
          </div>

          <hr style="border: 0; border-top: 1px solid #E5E7EB; margin: 30px 0;">

          <p style="font-size: 14px; color: #4B5563; text-align: center; margin: 20px 0;">
            ${content.ignore}
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #FAF7F2; padding: 30px; text-align: center; font-size: 14px; color: #9CA3AF;">
          <p style="margin: 0 0 10px 0;">
            <strong>${content.footer}</strong>
          </p>
          <p style="margin: 0;">
            ${content.footerSupport}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const { email, organizationName, inviterName, role, token, language = 'en' }: InvitationEmailRequest = await req.json()

    if (!email || !organizationName || !inviterName || !role || !token) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // Use edge function redirect to handle Outlook Safe Links and other email security scanners
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://jaqyvbjllsanrnpzlyjw.supabase.co'
    const acceptUrl = `${supabaseUrl}/functions/v1/invite-redirect?token=${token}`

    const validLangs: SupportedLang[] = ['en', 'th', 'ja', 'ko', 'fr', 'de', 'zh', 'es', 'pt', 'ar'];
    const lang: SupportedLang = validLangs.includes(language as SupportedLang) ? (language as SupportedLang) : 'en'
    const subject = emailContent[lang].subject(organizationName)
    const html = generateInvitationHtml(lang, inviterName, organizationName, role, acceptUrl)

    console.log(`Sending invitation email to ${email} for org ${organizationName}`)

    const { data, error } = await resend.emails.send({
      from: 'mobile11 <noreply@mobile11.com>',
      to: [email],
      subject,
      html,
    })

    if (error) {
      console.error('Resend error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: error }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    console.log('Invitation email sent successfully:', data)

    return new Response(
      JSON.stringify({ success: true, messageId: data?.id }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  } catch (error: any) {
    console.error('Error sending invitation email:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }
})
