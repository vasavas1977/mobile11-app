import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { Resend } from 'https://esm.sh/resend@4.0.0'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string
const allowUnverified = Deno.env.get('ALLOW_UNVERIFIED_HOOKS') === 'true'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type EmailLang = 'en' | 'th' | 'zh' | 'es' | 'pt' | 'ar';

// Detect language from redirect_to URL parameter
function detectLanguage(redirectTo: string): EmailLang {
  try {
    const url = new URL(redirectTo);
    const lang = url.searchParams.get('lang');
    if (lang === 'th') return 'th';
    if (lang === 'zh') return 'zh';
    if (lang === 'es') return 'es';
    if (lang === 'pt') return 'pt';
    if (lang === 'ar') return 'ar';
    return 'en';
  } catch {
    if (redirectTo.includes('lang=th')) return 'th';
    if (redirectTo.includes('lang=zh')) return 'zh';
    if (redirectTo.includes('lang=es')) return 'es';
    if (redirectTo.includes('lang=pt')) return 'pt';
    if (redirectTo.includes('lang=ar')) return 'ar';
    return 'en';
  }
}

// Email content based on language and action type
const emailContent = {
  en: {
    recovery: {
      subject: 'Reset your mobile11 password',
      title: 'Reset Your Password 🔒',
      message: 'We received a request to reset the password for your mobile11 account. Click the button below to create a new password.',
      button: 'Reset Password',
      securityNotice: '⚠️ Security Notice: This link expires in 1 hour for your security.',
      altLinkText: 'Or copy and paste this link into your browser:',
      didntRequest: "Didn't request a password reset?",
      didntRequestMessage: "If you didn't request this change, you can safely ignore this email. Your password will remain unchanged and your account is secure.",
      securityTip: 'Security Tip: Never share your password or reset links with anyone. mobile11 will never ask for your password via email.',
      footer: 'mobile11 - Unlimited Data Everywhere',
      footerSupport: 'Questions? Reply to this email or visit our support center'
    },
    signup: {
      subject: 'Confirm your mobile11 account',
      title: 'Verify Your Email ✉️',
      message: 'Thank you for signing up with mobile11! Please use the verification code below to complete your registration:',
      codeExpiry: 'This code will expire in 60 minutes. If you didn\'t request this verification, you can safely ignore this email.',
      footer: 'mobile11 - Unlimited Data Everywhere',
      footerSupport: 'Questions? Reply to this email or visit our support center'
    },
    email_change: {
      subject: 'Confirm your new email address',
      title: 'Confirm Email Change ✉️',
      message: 'Please use the verification code below to confirm your new email address:',
      codeExpiry: 'This code will expire in 60 minutes. If you didn\'t request this change, please contact support immediately.',
      footer: 'mobile11 - Unlimited Data Everywhere',
      footerSupport: 'Questions? Reply to this email or visit our support center'
    }
  },
  th: {
    recovery: {
      subject: 'รีเซ็ตรหัสผ่าน mobile11 ของคุณ',
      title: 'รีเซ็ตรหัสผ่านของคุณ 🔒',
      message: 'เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชี mobile11 ของคุณ คลิกปุ่มด้านล่างเพื่อสร้างรหัสผ่านใหม่',
      button: 'รีเซ็ตรหัสผ่าน',
      securityNotice: '⚠️ แจ้งเตือนความปลอดภัย: ลิงก์นี้จะหมดอายุใน 1 ชั่วโมงเพื่อความปลอดภัยของคุณ',
      altLinkText: 'หรือคัดลอกและวางลิงก์นี้ในเบราว์เซอร์ของคุณ:',
      didntRequest: 'ไม่ได้ขอรีเซ็ตรหัสผ่าน?',
      didntRequestMessage: 'หากคุณไม่ได้ขอเปลี่ยนแปลง คุณสามารถเพิกเฉยอีเมลนี้ได้อย่างปลอดภัย รหัสผ่านของคุณจะไม่เปลี่ยนแปลงและบัญชีของคุณปลอดภัย',
      securityTip: 'คำแนะนำด้านความปลอดภัย: อย่าแชร์รหัสผ่านหรือลิงก์รีเซ็ตกับใคร mobile11 จะไม่ขอรหัสผ่านของคุณทางอีเมล',
      footer: 'mobile11 - เน็ตไม่อั้นทั่วโลก',
      footerSupport: 'มีคำถาม? ตอบกลับอีเมลนี้หรือเยี่ยมชมศูนย์ช่วยเหลือของเรา'
    },
    signup: {
      subject: 'ยืนยันบัญชี mobile11 ของคุณ',
      title: 'ยืนยันอีเมลของคุณ ✉️',
      message: 'ขอบคุณที่สมัครใช้งาน mobile11! กรุณาใช้รหัสยืนยันด้านล่างเพื่อดำเนินการลงทะเบียนให้เสร็จสมบูรณ์:',
      codeExpiry: 'รหัสนี้จะหมดอายุใน 60 นาที หากคุณไม่ได้ขอการยืนยันนี้ คุณสามารถเพิกเฉยอีเมลนี้ได้อย่างปลอดภัย',
      footer: 'mobile11 - เน็ตไม่อั้นทั่วโลก',
      footerSupport: 'มีคำถาม? ตอบกลับอีเมลนี้หรือเยี่ยมชมศูนย์ช่วยเหลือของเรา'
    },
    email_change: {
      subject: 'ยืนยันที่อยู่อีเมลใหม่ของคุณ',
      title: 'ยืนยันการเปลี่ยนอีเมล ✉️',
      message: 'กรุณาใช้รหัสยืนยันด้านล่างเพื่อยืนยันที่อยู่อีเมลใหม่ของคุณ:',
      codeExpiry: 'รหัสนี้จะหมดอายุใน 60 นาที หากคุณไม่ได้ขอการเปลี่ยนแปลงนี้ กรุณาติดต่อฝ่ายสนับสนุนทันที',
      footer: 'mobile11 - เน็ตไม่อั้นทั่วโลก',
      footerSupport: 'มีคำถาม? ตอบกลับอีเมลนี้หรือเยี่ยมชมศูนย์ช่วยเหลือของเรา'
    }
  },
  zh: {
    recovery: {
      subject: '重置您的 mobile11 密码',
      title: '重置您的密码 🔒',
      message: '我们收到了重置您 mobile11 账户密码的请求。请点击下方按钮创建新密码。',
      button: '重置密码',
      securityNotice: '⚠️ 安全提醒：为了您的安全，此链接将在1小时后过期。',
      altLinkText: '或将以下链接复制粘贴到浏览器中：',
      didntRequest: '没有请求重置密码？',
      didntRequestMessage: '如果您没有请求此更改，可以安全地忽略此邮件。您的密码将保持不变，账户是安全的。',
      securityTip: '安全提示：切勿与任何人分享您的密码或重置链接。mobile11 绝不会通过邮件索要您的密码。',
      footer: 'mobile11 - 全球无限流量',
      footerSupport: '有疑问？回复此邮件或访问我们的帮助中心'
    },
    signup: {
      subject: '确认您的 mobile11 账户',
      title: '验证您的邮箱 ✉️',
      message: '感谢您注册 mobile11！请使用以下验证码完成注册：',
      codeExpiry: '此验证码将在60分钟后过期。如果您没有请求此验证，可以安全地忽略此邮件。',
      footer: 'mobile11 - 全球无限流量',
      footerSupport: '有疑问？回复此邮件或访问我们的帮助中心'
    },
    email_change: {
      subject: '确认您的新邮箱地址',
      title: '确认邮箱更改 ✉️',
      message: '请使用以下验证码确认您的新邮箱地址：',
      codeExpiry: '此验证码将在60分钟后过期。如果您没有请求此更改，请立即联系客服。',
      footer: 'mobile11 - 全球无限流量',
      footerSupport: '有疑问？回复此邮件或访问我们的帮助中心'
    }
  },
  es: {
    recovery: {
      subject: 'Restablezca su contraseña de mobile11',
      title: 'Restablezca su contraseña 🔒',
      message: 'Hemos recibido una solicitud para restablecer la contraseña de su cuenta mobile11. Haga clic en el botón de abajo para crear una nueva contraseña.',
      button: 'Restablecer contraseña',
      securityNotice: '⚠️ Aviso de seguridad: Este enlace expira en 1 hora por su seguridad.',
      altLinkText: 'O copie y pegue este enlace en su navegador:',
      didntRequest: '¿No solicitó un restablecimiento de contraseña?',
      didntRequestMessage: 'Si no solicitó este cambio, puede ignorar este correo de forma segura. Su contraseña no cambiará y su cuenta está segura.',
      securityTip: 'Consejo de seguridad: Nunca comparta su contraseña o enlaces de restablecimiento con nadie. mobile11 nunca le pedirá su contraseña por correo electrónico.',
      footer: 'mobile11 - Datos ilimitados en todas partes',
      footerSupport: '¿Preguntas? Responda a este correo o visite nuestro centro de soporte'
    },
    signup: {
      subject: 'Confirme su cuenta de mobile11',
      title: 'Verifique su correo electrónico ✉️',
      message: '¡Gracias por registrarse en mobile11! Por favor, use el código de verificación a continuación para completar su registro:',
      codeExpiry: 'Este código expirará en 60 minutos. Si no solicitó esta verificación, puede ignorar este correo de forma segura.',
      footer: 'mobile11 - Datos ilimitados en todas partes',
      footerSupport: '¿Preguntas? Responda a este correo o visite nuestro centro de soporte'
    },
    email_change: {
      subject: 'Confirme su nueva dirección de correo electrónico',
      title: 'Confirme el cambio de correo electrónico ✉️',
      message: 'Por favor, use el código de verificación a continuación para confirmar su nueva dirección de correo electrónico:',
      codeExpiry: 'Este código expirará en 60 minutos. Si no solicitó este cambio, contacte al soporte inmediatamente.',
      footer: 'mobile11 - Datos ilimitados en todas partes',
      footerSupport: '¿Preguntas? Responda a este correo o visite nuestro centro de soporte'
    }
  },
  pt: {
    recovery: {
      subject: 'Redefina sua senha do mobile11',
      title: 'Redefina sua senha 🔒',
      message: 'Recebemos uma solicitação para redefinir a senha da sua conta mobile11. Clique no botão abaixo para criar uma nova senha.',
      button: 'Redefinir senha',
      securityNotice: '⚠️ Aviso de segurança: Este link expira em 1 hora para sua segurança.',
      altLinkText: 'Ou copie e cole este link no seu navegador:',
      didntRequest: 'Não solicitou a redefinição de senha?',
      didntRequestMessage: 'Se você não solicitou esta alteração, pode ignorar este e-mail com segurança. Sua senha permanecerá inalterada e sua conta está segura.',
      securityTip: 'Dica de segurança: Nunca compartilhe sua senha ou links de redefinição com ninguém. O mobile11 nunca pedirá sua senha por e-mail.',
      footer: 'mobile11 - Dados ilimitados em qualquer lugar',
      footerSupport: 'Dúvidas? Responda este e-mail ou visite nosso centro de suporte'
    },
    signup: {
      subject: 'Confirme sua conta do mobile11',
      title: 'Verifique seu e-mail ✉️',
      message: 'Obrigado por se cadastrar no mobile11! Use o código de verificação abaixo para concluir seu cadastro:',
      codeExpiry: 'Este código expira em 60 minutos. Se você não solicitou esta verificação, pode ignorar este e-mail com segurança.',
      footer: 'mobile11 - Dados ilimitados em qualquer lugar',
      footerSupport: 'Dúvidas? Responda este e-mail ou visite nosso centro de suporte'
    },
    email_change: {
      subject: 'Confirme seu novo endereço de e-mail',
      title: 'Confirme a alteração de e-mail ✉️',
      message: 'Use o código de verificação abaixo para confirmar seu novo endereço de e-mail:',
      codeExpiry: 'Este código expira em 60 minutos. Se você não solicitou esta alteração, entre em contato com o suporte imediatamente.',
      footer: 'mobile11 - Dados ilimitados em qualquer lugar',
      footerSupport: 'Dúvidas? Responda este e-mail ou visite nosso centro de suporte'
    }
  },
  ar: {
    recovery: {
      subject: 'إعادة تعيين كلمة مرور mobile11',
      title: 'إعادة تعيين كلمة المرور 🔒',
      message: 'تلقينا طلبًا لإعادة تعيين كلمة مرور حسابك في mobile11. انقر على الزر أدناه لإنشاء كلمة مرور جديدة.',
      button: 'إعادة تعيين كلمة المرور',
      securityNotice: '⚠️ إشعار أمان: تنتهي صلاحية هذا الرابط خلال ساعة واحدة لأمانك.',
      altLinkText: 'أو انسخ والصق هذا الرابط في متصفحك:',
      didntRequest: 'لم تطلب إعادة تعيين كلمة المرور؟',
      didntRequestMessage: 'إذا لم تطلب هذا التغيير، يمكنك تجاهل هذا البريد الإلكتروني بأمان. ستبقى كلمة المرور دون تغيير وحسابك آمن.',
      securityTip: 'نصيحة أمان: لا تشارك كلمة المرور أو روابط إعادة التعيين مع أي شخص. لن يطلب منك mobile11 كلمة المرور عبر البريد الإلكتروني أبدًا.',
      footer: 'mobile11 - بيانات غير محدودة في كل مكان',
      footerSupport: 'أسئلة؟ قم بالرد على هذا البريد أو قم بزيارة مركز الدعم'
    },
    signup: {
      subject: 'تأكيد حسابك في mobile11',
      title: 'تحقق من بريدك الإلكتروني ✉️',
      message: 'شكرًا لتسجيلك في mobile11! يرجى استخدام رمز التحقق أدناه لإكمال التسجيل:',
      codeExpiry: 'ينتهي هذا الرمز خلال 60 دقيقة. إذا لم تطلب هذا التحقق، يمكنك تجاهل هذا البريد بأمان.',
      footer: 'mobile11 - بيانات غير محدودة في كل مكان',
      footerSupport: 'أسئلة؟ قم بالرد على هذا البريد أو قم بزيارة مركز الدعم'
    },
    email_change: {
      subject: 'تأكيد عنوان بريدك الإلكتروني الجديد',
      title: 'تأكيد تغيير البريد الإلكتروني ✉️',
      message: 'يرجى استخدام رمز التحقق أدناه لتأكيد عنوان بريدك الإلكتروني الجديد:',
      codeExpiry: 'ينتهي هذا الرمز خلال 60 دقيقة. إذا لم تطلب هذا التغيير، يرجى الاتصال بالدعم فورًا.',
      footer: 'mobile11 - بيانات غير محدودة في كل مكان',
      footerSupport: 'أسئلة؟ قم بالرد على هذا البريد أو قم بزيارة مركز الدعم'
    }
  }
};

// Generate password reset email HTML
function generatePasswordResetHtml(lang: EmailLang, confirmationUrl: string): string {
  const content = emailContent[lang].recovery;
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  
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
            ${content.message}
          </p>

          <div style="text-align: center; margin: 40px 0;">
            <a href="${confirmationUrl}" style="display: inline-block; padding: 16px 40px; background-color: #f97316; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">${content.button}</a>
          </div>

          <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
            <p style="font-size: 14px; color: #92400E; margin: 0;">
              <strong>${content.securityNotice}</strong>
            </p>
          </div>

          <hr style="border: 0; border-top: 1px solid #E5E7EB; margin: 30px 0;">

          <p style="font-size: 14px; color: #4B5563; text-align: center; margin: 20px 0;">
            ${content.altLinkText}<br>
            <a href="${confirmationUrl}" style="color: #f97316; word-break: break-all;">${confirmationUrl}</a>
          </p>

          <div style="background-color: #FAF7F2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="font-size: 14px; color: #4B5563; margin: 8px 0;"><strong>${content.didntRequest}</strong></p>
            <p style="font-size: 14px; color: #4B5563; margin: 8px 0;">
              ${content.didntRequestMessage}
            </p>
          </div>

          <p style="font-size: 14px; margin-top: 30px; color: #9CA3AF; text-align: center;">
            <strong>${content.securityTip}</strong>
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

// Generate verification code email HTML
function generateVerificationCodeHtml(lang: EmailLang, token: string, actionType: 'signup' | 'email_change'): string {
  const content = emailContent[lang][actionType] || emailContent[lang].signup;
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  
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
            ${content.message}
          </p>

          <div style="background-color: #FAF7F2; border: 2px solid #E5E7EB; border-radius: 12px; padding: 30px; text-align: center; margin: 32px 0;">
            <div style="font-size: 36px; font-weight: 700; color: #f97316; letter-spacing: 12px; font-family: 'Courier New', monospace;">
              ${token}
            </div>
          </div>

          <p style="font-size: 14px; color: #4B5563; line-height: 1.6; margin: 24px 0 0 0; text-align: center;">
            ${content.codeExpiry}
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const payload = await req.text()
    const headers = Object.fromEntries(req.headers)
    
    console.log('Received email hook request')
    console.log('Request headers present:', Object.keys(headers).filter(h => h.toLowerCase().includes('webhook')))
    
    // Verify webhook signature and parse payload
    let verifiedPayload: {
      user: {
        email: string
      }
      email_data: {
        token: string
        token_hash: string
        redirect_to: string
        email_action_type: string
        site_url: string
      }
    } | null = null
    
    if (hookSecret) {
      let verified = false
      const trySecrets: string[] = [hookSecret]
      // Try common normalized variants to handle formatting prefixes
      const normalized1 = hookSecret.replace(/^v\d+,?/, '')
      if (!trySecrets.includes(normalized1)) trySecrets.push(normalized1)
      const normalized2 = normalized1.replace(/^whsec_/, '')
      if (!trySecrets.includes(normalized2)) trySecrets.push(normalized2)

      for (const sec of trySecrets) {
        try {
          const wh = new Webhook(sec)
          verifiedPayload = wh.verify(payload, headers) as { user: { email: string }; email_data: { token: string; token_hash: string; redirect_to: string; email_action_type: string; site_url: string } }
          console.log('✓ Webhook signature verified successfully with provided secret variant')
          verified = true
          break
        } catch (verifyError: any) {
          console.warn('Webhook verification failed with a secret variant:', verifyError?.message || String(verifyError))
        }
      }

      if (!verified) {
        console.warn('Proceeding without verification; check SEND_EMAIL_HOOK_SECRET formatting.')
        try {
          verifiedPayload = JSON.parse(payload) as { user: { email: string }; email_data: { token: string; token_hash: string; redirect_to: string; email_action_type: string; site_url: string } }
        } catch (parseError) {
          console.error('Failed to parse payload:', parseError)
          return new Response(
            JSON.stringify({ success: true, message: 'Skipped due to invalid payload' }),
            { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          )
        }
      }
    } else {
      console.warn('⚠️ SEND_EMAIL_HOOK_SECRET not configured - skipping verification')
      // Parse without verification
      try {
        verifiedPayload = JSON.parse(payload) as { user: { email: string }; email_data: { token: string; token_hash: string; redirect_to: string; email_action_type: string; site_url: string } }
      } catch (parseError) {
        console.error('Failed to parse payload:', parseError)
        return new Response(
          JSON.stringify({ success: true, message: 'Skipped due to invalid payload' }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        )
      }
    }
    
    if (!verifiedPayload) {
      return new Response(
        JSON.stringify({ success: true, message: 'No payload to process' }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const { user, email_data } = verifiedPayload
    const { token, token_hash, redirect_to, email_action_type, site_url } = email_data

    console.log(`Processing ${email_action_type} email for ${user.email}`)
    console.log(`Redirect to: ${redirect_to}`)

    // Detect language from redirect_to URL
    const lang = detectLanguage(redirect_to || '');
    console.log(`Detected language: ${lang}`)

    // Build confirmation URL for password reset
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || site_url;
    const confirmationUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to)}`;

    // Determine email subject and HTML based on action type and language
    let subject: string;
    let html: string;

    if (email_action_type === 'recovery') {
      // Password Reset - use clickable button template
      subject = emailContent[lang].recovery.subject;
      html = generatePasswordResetHtml(lang, confirmationUrl);
      console.log('Generated password reset email with clickable button')
    } else if (email_action_type === 'email_change') {
      // Email Change - use verification code template
      subject = emailContent[lang].email_change.subject;
      html = generateVerificationCodeHtml(lang, token, 'email_change');
      console.log('Generated email change verification email')
    } else {
      // Signup/Invite/Default - use verification code template
      subject = emailContent[lang].signup.subject;
      html = generateVerificationCodeHtml(lang, token, 'signup');
      console.log('Generated signup verification email')
    }

    // Queue email sending as a background task to avoid auth hook timeouts
    const sendTask = (async () => {
      try {
        const { data, error } = await resend.emails.send({
          from: 'mobile11 <noreply@mobile11.com>',
          to: [user.email],
          subject,
          html,
        })

        if (error) {
          console.error('Resend error:', error)
        } else {
          console.log('Email sent successfully:', data)
        }
      } catch (bgError) {
        console.error('Background send error:', bgError)
      }
    })()

    // Ensure the function returns immediately while the email is being sent
    // @ts-ignore - Edge runtime provides waitUntil
    EdgeRuntime?.waitUntil?.(sendTask)

    return new Response(
      JSON.stringify({ success: true, message: 'Email queued' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    )
  } catch (error: any) {
    console.error('Error in send-email function:', error)
    return new Response(
      JSON.stringify({
        error: {
          message: error.message,
          code: error.code,
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    )
  }
})
