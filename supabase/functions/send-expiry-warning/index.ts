import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Translations for multilingual emails
const translations: Record<string, any> = {
  en: {
    subject: "⏰ Your Mobile11 order expires in 4 hours!",
    title: "Your Order Expires Soon!",
    greeting: (name: string) => `Hi ${name},`,
    message: "Your pending order will expire in approximately 4 hours.",
    dontLose: "Don't lose your eSIM! Complete payment before it expires.",
    orderDetails: "Order Details",
    orderId: "Order ID:",
    package: "Package:",
    country: "Country:",
    dataAmount: "Data Amount:",
    validity: "Validity:",
    days: "days",
    amount: "Amount:",
    completePayment: "Complete Payment Now",
    ignoreNote: "If you no longer need this order, you can ignore this email and it will automatically expire.",
    needHelp: "Need help? Contact our support team at",
    autoMessage: "This is an automated message. Please do not reply to this email.",
  },
  th: {
    subject: "⏰ คำสั่งซื้อ Mobile11 ของคุณจะหมดอายุใน 4 ชั่วโมง!",
    title: "คำสั่งซื้อของคุณใกล้หมดอายุแล้ว!",
    greeting: (name: string) => `สวัสดี ${name},`,
    message: "คำสั่งซื้อที่รอดำเนินการของคุณจะหมดอายุในประมาณ 4 ชั่วโมง",
    dontLose: "อย่าพลาด eSIM ของคุณ! ชำระเงินก่อนหมดอายุ",
    orderDetails: "รายละเอียดคำสั่งซื้อ",
    orderId: "หมายเลขคำสั่งซื้อ:",
    package: "แพ็คเกจ:",
    country: "ประเทศ:",
    dataAmount: "ปริมาณข้อมูล:",
    validity: "ระยะเวลา:",
    days: "วัน",
    amount: "จำนวนเงิน:",
    completePayment: "ชำระเงินตอนนี้",
    ignoreNote: "หากคุณไม่ต้องการคำสั่งซื้อนี้แล้ว คุณสามารถเพิกเฉยอีเมลนี้ได้และจะหมดอายุโดยอัตโนมัติ",
    needHelp: "ต้องการความช่วยเหลือ? ติดต่อทีมสนับสนุนของเราที่",
    autoMessage: "นี่เป็นข้อความอัตโนมัติ กรุณาอย่าตอบกลับอีเมลนี้",
  },
  ja: {
    subject: "⏰ Mobile11のご注文があと4時間で期限切れです！",
    title: "ご注文の期限が近づいています！",
    greeting: (name: string) => `${name} 様`,
    message: "保留中のご注文は約4時間で期限切れとなります。",
    dontLose: "eSIMをお見逃しなく！期限前にお支払いを完了してください。",
    orderDetails: "注文詳細",
    orderId: "注文ID:",
    package: "パッケージ:",
    country: "国:",
    dataAmount: "データ量:",
    validity: "有効期間:",
    days: "日間",
    amount: "金額:",
    completePayment: "今すぐ支払いを完了",
    ignoreNote: "この注文が不要な場合は、このメールを無視してください。自動的に期限切れとなります。",
    needHelp: "お困りですか？サポートチームまでご連絡ください:",
    autoMessage: "これは自動送信メールです。返信しないでください。",
  },
  ko: {
    subject: "⏰ Mobile11 주문이 4시간 후 만료됩니다!",
    title: "주문이 곧 만료됩니다!",
    greeting: (name: string) => `안녕하세요 ${name}님,`,
    message: "대기 중인 주문이 약 4시간 후에 만료됩니다.",
    dontLose: "eSIM을 놓치지 마세요! 만료 전에 결제를 완료하세요.",
    orderDetails: "주문 상세",
    orderId: "주문 ID:",
    package: "패키지:",
    country: "국가:",
    dataAmount: "데이터:",
    validity: "유효기간:",
    days: "일",
    amount: "금액:",
    completePayment: "지금 결제하기",
    ignoreNote: "이 주문이 더 이상 필요하지 않으시면 이 이메일을 무시하세요. 자동으로 만료됩니다.",
    needHelp: "도움이 필요하신가요? 지원팀에 문의하세요:",
    autoMessage: "이것은 자동 발송 메시지입니다. 이 이메일에 답장하지 마세요.",
  },
  fr: {
    subject: "⏰ Votre commande Mobile11 expire dans 4 heures !",
    title: "Votre commande expire bientôt !",
    greeting: (name: string) => `Bonjour ${name},`,
    message: "Votre commande en attente expirera dans environ 4 heures.",
    dontLose: "Ne perdez pas votre eSIM ! Complétez le paiement avant l'expiration.",
    orderDetails: "Détails de la commande",
    orderId: "N° de commande :",
    package: "Forfait :",
    country: "Pays :",
    dataAmount: "Volume de données :",
    validity: "Validité :",
    days: "jours",
    amount: "Montant :",
    completePayment: "Payer maintenant",
    ignoreNote: "Si vous n'avez plus besoin de cette commande, ignorez cet e-mail et elle expirera automatiquement.",
    needHelp: "Besoin d'aide ? Contactez notre équipe support à",
    autoMessage: "Ceci est un message automatique. Veuillez ne pas répondre à cet e-mail.",
  },
  de: {
    subject: "⏰ Ihre Mobile11-Bestellung läuft in 4 Stunden ab!",
    title: "Ihre Bestellung läuft bald ab!",
    greeting: (name: string) => `Hallo ${name},`,
    message: "Ihre ausstehende Bestellung wird in ca. 4 Stunden ablaufen.",
    dontLose: "Verlieren Sie Ihre eSIM nicht! Schließen Sie die Zahlung vor Ablauf ab.",
    orderDetails: "Bestelldetails",
    orderId: "Bestell-ID:",
    package: "Paket:",
    country: "Land:",
    dataAmount: "Datenvolumen:",
    validity: "Gültigkeit:",
    days: "Tage",
    amount: "Betrag:",
    completePayment: "Jetzt bezahlen",
    ignoreNote: "Wenn Sie diese Bestellung nicht mehr benötigen, ignorieren Sie diese E-Mail — sie läuft automatisch ab.",
    needHelp: "Brauchen Sie Hilfe? Kontaktieren Sie unser Support-Team unter",
    autoMessage: "Dies ist eine automatische Nachricht. Bitte antworten Sie nicht auf diese E-Mail.",
  },
  zh: {
    subject: "⏰ 您的 Mobile11 订单将在 4 小时后过期！",
    title: "您的订单即将过期！",
    greeting: (name: string) => `${name}，您好！`,
    message: "您的待处理订单将在约 4 小时后过期。",
    dontLose: "不要错过您的 eSIM！请在过期前完成付款。",
    orderDetails: "订单详情",
    orderId: "订单编号：",
    package: "套餐：",
    country: "国家：",
    dataAmount: "数据量：",
    validity: "有效期：",
    days: "天",
    amount: "金额：",
    completePayment: "立即完成付款",
    ignoreNote: "如果您不再需要此订单，可以忽略此邮件，订单将自动过期。",
    needHelp: "需要帮助？请联系我们的支持团队：",
    autoMessage: "这是一封自动发送的邮件，请勿回复。",
  },
  es: {
    subject: "⏰ ¡Tu pedido de Mobile11 expira en 4 horas!",
    title: "¡Tu pedido expira pronto!",
    greeting: (name: string) => `Hola ${name},`,
    message: "Tu pedido pendiente expirará en aproximadamente 4 horas.",
    dontLose: "¡No pierdas tu eSIM! Completa el pago antes de que expire.",
    orderDetails: "Detalles del pedido",
    orderId: "ID del pedido:",
    package: "Paquete:",
    country: "País:",
    dataAmount: "Datos:",
    validity: "Validez:",
    days: "días",
    amount: "Monto:",
    completePayment: "Completar pago ahora",
    ignoreNote: "Si ya no necesitas este pedido, puedes ignorar este correo y expirará automáticamente.",
    needHelp: "¿Necesitas ayuda? Contacta a nuestro equipo de soporte en",
    autoMessage: "Este es un mensaje automático. Por favor no respondas a este correo.",
  },
  pt: {
    subject: "⏰ Seu pedido Mobile11 expira em 4 horas!",
    title: "Seu pedido expira em breve!",
    greeting: (name: string) => `Olá ${name},`,
    message: "Seu pedido pendente expirará em aproximadamente 4 horas.",
    dontLose: "Não perca seu eSIM! Complete o pagamento antes que expire.",
    orderDetails: "Detalhes do pedido",
    orderId: "ID do pedido:",
    package: "Pacote:",
    country: "País:",
    dataAmount: "Dados:",
    validity: "Validade:",
    days: "dias",
    amount: "Valor:",
    completePayment: "Completar pagamento agora",
    ignoreNote: "Se você não precisa mais deste pedido, pode ignorar este e-mail e ele expirará automaticamente.",
    needHelp: "Precisa de ajuda? Entre em contato com nossa equipe de suporte em",
    autoMessage: "Esta é uma mensagem automática. Por favor, não responda a este e-mail.",
  },
  ar: {
    subject: "⏰ طلبك من Mobile11 ينتهي خلال 4 ساعات!",
    title: "طلبك ينتهي قريباً!",
    greeting: (name: string) => `مرحباً ${name}،`,
    message: "سينتهي طلبك المعلق خلال حوالي 4 ساعات.",
    dontLose: "لا تفقد شريحة eSIM الخاصة بك! أكمل الدفع قبل انتهاء الصلاحية.",
    orderDetails: "تفاصيل الطلب",
    orderId: "رقم الطلب:",
    package: "الباقة:",
    country: "البلد:",
    dataAmount: "حجم البيانات:",
    validity: "الصلاحية:",
    days: "أيام",
    amount: "المبلغ:",
    completePayment: "أكمل الدفع الآن",
    ignoreNote: "إذا لم تعد بحاجة لهذا الطلب، يمكنك تجاهل هذا البريد وسينتهي تلقائياً.",
    needHelp: "تحتاج مساعدة؟ تواصل مع فريق الدعم على",
    autoMessage: "هذه رسالة تلقائية. يرجى عدم الرد على هذا البريد الإلكتروني.",
  },
};

const generateEmailHtml = (order: any, packageData: any, customerName: string, lang: string = 'en') => {
  const t = translations[lang] || translations.en;
  const orderUrl = `https://mobile11.com/orders/${order.id}`;
  const currencySymbol = order.currency === 'THB' ? '฿' : '$';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAF7F2;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #ffffff; padding: 30px; text-align: center; border-bottom: 1px solid #E5E7EB;">
              <img src="https://jaqyvbjllsanrnpzlyjw.supabase.co/storage/v1/object/public/assets/logo.png" alt="mobile11" style="height: 40px; width: auto;" />
            </td>
          </tr>

          <tr>
            <td style="padding: 30px;">
              <h1 style="margin: 0 0 20px; color: #1A1A1A; font-size: 24px; text-align: center;">⏰ ${t.title}</h1>
          
              <p style="font-size: 16px; color: #4B5563; margin: 0 0 20px 0;">
                ${t.greeting(customerName)}
              </p>
              
              <p style="font-size: 16px; color: #4B5563; margin: 0 0 20px 0;">
                ${t.message}
              </p>
              
              <!-- Urgent Warning -->
              <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #92400E; font-weight: 600;">
                  ⚠️ ${t.dontLose}
                </p>
              </div>
              
              <!-- Order Details -->
              <div style="background: #FAF7F2; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; color: #1A1A1A; font-size: 18px;">${t.orderDetails}</h3>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="8">
                  <tr>
                    <td style="color: #4B5563; font-size: 14px;">${t.orderId}</td>
                    <td style="color: #1A1A1A; font-size: 14px; font-weight: 600; text-align: right;">${order.order_id}</td>
                  </tr>
                  <tr>
                    <td style="color: #4B5563; font-size: 14px;">${t.package}</td>
                    <td style="color: #1A1A1A; font-size: 14px; font-weight: 600; text-align: right;">${packageData?.name || 'eSIM Package'}</td>
                  </tr>
                  <tr>
                    <td style="color: #4B5563; font-size: 14px;">${t.country}</td>
                    <td style="color: #1A1A1A; font-size: 14px; text-align: right;">${packageData?.country_name || '-'}</td>
                  </tr>
                  <tr>
                    <td style="color: #4B5563; font-size: 14px;">${t.dataAmount}</td>
                    <td style="color: #1A1A1A; font-size: 14px; text-align: right;">${packageData?.data_amount || '-'}</td>
                  </tr>
                  <tr>
                    <td style="color: #4B5563; font-size: 14px;">${t.validity}</td>
                    <td style="color: #1A1A1A; font-size: 14px; text-align: right;">${packageData?.validity_days || '-'} ${t.days}</td>
                  </tr>
                  <tr style="border-top: 1px solid #E5E7EB;">
                    <td style="color: #4B5563; font-size: 16px; padding-top: 12px;">${t.amount}</td>
                    <td style="color: #f97316; font-size: 20px; font-weight: 700; text-align: right; padding-top: 12px;">${currencySymbol}${order.total_amount}</td>
                  </tr>
                </table>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${orderUrl}" style="display: inline-block; background-color: #f97316; color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 18px; font-weight: 600;">
                  ${t.completePayment}
                </a>
              </div>
              
              <!-- Ignore Note -->
              <p style="font-size: 14px; color: #9CA3AF; text-align: center; margin: 20px 0 0 0;">
                ${t.ignoreNote}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: #FAF7F2; padding: 25px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #4B5563;">
                ${t.needHelp} <a href="mailto:support@mobile11.com" style="color: #f97316;">support@mobile11.com</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #9CA3AF;">
                ${t.autoMessage}
              </p>
              <p style="margin: 15px 0 0 0;">
                <a href="https://mobile11.com" style="color: #f97316; text-decoration: none; font-weight: 600;">Mobile11.com</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  console.log('Send expiry warning function started');

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const now = new Date();
    const twentyHoursAgo = new Date(now.getTime() - 20 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    console.log('Looking for orders between:', twentyFourHoursAgo.toISOString(), 'and', twentyHoursAgo.toISOString());

    // Find pending orders between 20-24 hours old that haven't received a warning
    const { data: ordersToWarn, error: ordersError } = await supabaseClient
      .from('orders')
      .select(`
        id, order_id, user_id, total_amount, currency, created_at,
        esim_packages(name, country_name, data_amount, validity_days)
      `)
      .eq('status', 'pending')
      .is('expiry_warning_sent_at', null)
      .lt('created_at', twentyHoursAgo.toISOString())
      .gt('created_at', twentyFourHoursAgo.toISOString());

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      throw ordersError;
    }

    console.log(`Found ${ordersToWarn?.length || 0} orders to warn`);

    if (!ordersToWarn || ordersToWarn.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No orders need warning emails', warned: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let emailsSent = 0;
    const errors: string[] = [];

    for (const order of ordersToWarn) {
      try {
        // Get user email
        const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(order.user_id);
        
        if (userError || !userData?.user?.email) {
          console.error(`Could not find email for user ${order.user_id}:`, userError);
          errors.push(`Order ${order.order_id}: User email not found`);
          continue;
        }

        const userEmail = userData.user.email;
        console.log(`Sending warning email for order ${order.order_id} to ${userEmail}`);

        // Get user profile for name
        const { data: profileData } = await supabaseClient
          .from('profiles')
          .select('first_name, last_name')
          .eq('user_id', order.user_id)
          .maybeSingle();

        const customerName = profileData && (profileData.first_name || profileData.last_name)
          ? `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim()
          : userEmail.split('@')[0] || 'Customer';

        // Determine language based on currency (THB = Thai, otherwise English)
        // Determine language from order language field, fallback to currency-based detection
        const currencyLangMap: Record<string, string> = { THB: 'th', JPY: 'ja', KRW: 'ko', EUR: 'fr', CNY: 'zh', BRL: 'pt', SAR: 'ar' };
        const lang = (order as any).language || currencyLangMap[order.currency] || 'en';
        const t = translations[lang];
        const packageData = order.esim_packages;

        // Generate and send email
        const html = generateEmailHtml(order, packageData, customerName, lang);

        const { error: emailError } = await resend.emails.send({
          from: 'Mobile11 <noreply@mobile11.com>',
          to: [userEmail],
          subject: t.subject,
          html,
        });

        if (emailError) {
          console.error(`Failed to send email for order ${order.order_id}:`, emailError);
          errors.push(`Order ${order.order_id}: Email send failed - ${emailError.message}`);
          continue;
        }

        // Update order to mark warning as sent
        const { error: updateError } = await supabaseClient
          .from('orders')
          .update({ expiry_warning_sent_at: now.toISOString() })
          .eq('id', order.id);

        if (updateError) {
          console.error(`Failed to update expiry_warning_sent_at for order ${order.order_id}:`, updateError);
          errors.push(`Order ${order.order_id}: Failed to update warning timestamp`);
          continue;
        }

        emailsSent++;
        console.log(`Successfully sent warning email for order ${order.order_id}`);

      } catch (orderError: unknown) {
        const errorMessage = orderError instanceof Error ? orderError.message : 'Unknown error';
        console.error(`Error processing order ${order.order_id}:`, orderError);
        errors.push(`Order ${order.order_id}: ${errorMessage}`);
      }
    }

    console.log(`Expiry warning job completed. Emails sent: ${emailsSent}, Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${emailsSent} expiry warning emails`,
        warned: emailsSent,
        errors: errors.length > 0 ? errors : undefined
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in send-expiry-warning function:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
