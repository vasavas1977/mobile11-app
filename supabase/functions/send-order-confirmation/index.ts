import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { qrcode } from "https://deno.land/x/qrcode@v2.0.0/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to check if qr_code is an LPA string (not a URL)
const isLpaString = (qrCode: string): boolean => {
  return qrCode.startsWith('LPA:');
};

// Generate QR code image, upload to Supabase Storage, and return public HTTPS URL
// Email clients block data URIs, so we must serve images via public URLs
const generateQrCodeImage = async (lpaString: string, orderId: string, supabaseClient: any): Promise<string> => {
  try {
    // Returns data:image/gif;base64,... format
    const base64Image = await qrcode(lpaString, { size: 250 }) as unknown as string;
    
    // Extract raw base64 data and convert to binary
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const binaryString = atob(base64Data);
    const imageBytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      imageBytes[i] = binaryString.charCodeAt(i);
    }
    
    // Upload to public storage bucket
    const filePath = `qr-codes/${orderId}.gif`;
    const { error: uploadError } = await supabaseClient.storage
      .from('assets')
      .upload(filePath, imageBytes, {
        contentType: 'image/gif',
        upsert: true,
      });
    
    if (uploadError) {
      console.error('Failed to upload QR code to storage:', uploadError);
      // Fallback to base64 data URI if upload fails
      return base64Image;
    }
    
    // Return public URL
    const { data: urlData } = supabaseClient.storage
      .from('assets')
      .getPublicUrl(filePath);
    
    console.log('QR code uploaded to storage:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error: any) {
    console.error('Failed to generate QR code image:', error);
    return '';
  }
};

interface OrderConfirmationRequest {
  orderId: string;
  language?: 'en' | 'th' | 'ja' | 'ko' | 'fr' | 'de' | 'zh' | 'es' | 'pt' | 'ar';
  overrideEmail?: string;
}

// Translations object
const translations = {
  en: {
    brandTagline: "Your eSIM Connection Service",
    orderConfirmed: "✅ Order Confirmed!",
    thankYou: (name: string) => `Thank you ${name}! Your order has been successfully processed.`,
    orderDetails: "Order Details",
    orderId: "Order ID:",
    package: "Package:",
    country: "Country:",
    dataAmount: "Data Amount:",
    validity: "Validity:",
    days: "days",
    amountPaid: "Amount Paid:",
    qrCodeTitle: "📱 Your eSIM QR Code",
    qrCodeSubtitle: "Scan this code with your device to install",
    iccid: "ICCID:",
    downloadQr: "Download QR Code",
    processing: "⏳ eSIM Processing",
    processingMsg: "Your eSIM is being activated. You'll receive your QR code and installation instructions in a follow-up email within the next 5-10 minutes.",
    iosTitle: "📱 For iPhone Users",
    iosRequirements: "Requirements:",
    iosReq1: "iPhone XS or newer",
    iosReq2: "iOS 12.0 or later",
    iosReq3: "Unlocked device (not carrier-locked)",
    iosReq4: "Wi-Fi connection",
    iosQuickInstall: "🚀 iOS 17.4+ Quick Install",
    iosQuickInstallBtn: "Install eSIM Now (1-Click)",
    iosQuickInstallNote: "Tap this button to install directly (iOS 17.4+)",
    iosInstallLink: "🔗 Installation Link",
    iosInstallLinkNote: "Copy this link to share with anyone who needs to install this eSIM:",
    iosSteps: "Installation Steps:",
    iosStep1: "Connect to Wi-Fi",
    iosStep1Note: " - Make sure you're connected to the internet",
    iosStep2: "Open ",
    iosStep2Bold: "Settings",
    iosStep2Arrow: " → ",
    iosStep2Bold2: "Cellular",
    iosStep2Note: " (or Mobile Data)",
    iosStep3: "Tap ",
    iosStep3Bold: '"Add Cellular Plan"',
    iosStep3Or: " or ",
    iosStep3Bold2: '"Add eSIM"',
    iosStep4: "Scan the QR code above",
    iosStep4Note: " with your camera",
    iosStep5: "Tap ",
    iosStep5Bold: '"Continue"',
    iosStep5Note: " and wait 30-60 seconds for activation",
    iosStep6: "⚠️ IMPORTANT:",
    iosStep6Bold: " Enable ",
    iosStep6Bold2: "Data Roaming",
    iosStep6Path: "Settings → Cellular → [Your eSIM] → Data Roaming → ON",
    androidTitle: "🤖 For Android Users",
    androidCompatible: "Compatible Devices:",
    androidDev1: "Samsung Galaxy S20 and newer",
    androidDev2: "Google Pixel 3 and newer",
    androidDev3: "OnePlus 7 and newer",
    androidDev4: "Most Android 9+ devices with eSIM support",
    androidSteps: "Installation Steps:",
    androidStep1: "Open ",
    androidStep1Bold: "Settings",
    androidStep1Note: " on your device",
    androidStep2: "Navigate to network settings (varies by device):",
    androidStep2Samsung: "Samsung: ",
    androidStep2SamsungPath: "Connections → SIM Manager",
    androidStep2Pixel: "Google Pixel: ",
    androidStep2PixelPath: "Network & Internet → SIMs",
    androidStep2Others: "Others: ",
    androidStep2OthersPath: "Mobile Network",
    androidStep2Or: " or ",
    androidStep2OthersPath2: "SIM cards",
    androidStep3: "Tap ",
    androidStep3Bold: '"Add mobile plan"',
    androidStep3Or: " or ",
    androidStep3Bold2: '"Download a SIM"',
    androidStep4: "Select ",
    androidStep4Bold: '"Scan QR code"',
    androidStep5: "Scan the QR code above",
    androidStep6: "Tap ",
    androidStep6Bold: '"Download"',
    androidStep6Note: " and wait 1-2 minutes",
    androidStep7: "⚠️ IMPORTANT:",
    androidStep7Bold: " Enable ",
    androidStep7Bold2: "Data Roaming",
    androidStep7Note: " for the new eSIM",
    manualTitle: "🔧 Manual Installation",
    manualSubtitle: "Can't scan the QR code? Use these codes to install manually:",
    smdpAddress: "SM-DP+ Address:",
    activationCode: "Activation Code:",
    manualHow: "How to use:",
    manualIos: "iOS:",
    manualIosPath: " Settings → Cellular → Add eSIM → Enter Details Manually",
    manualAndroid: "Android:",
    manualAndroidNote: " Check your device's eSIM settings for manual entry option (varies by manufacturer)",
    troubleTitle: "❓ Having Issues?",
    troubleQr: "📷 QR code not scanning?",
    troubleQr1: "Make sure camera permissions are enabled",
    troubleQr2: "Try increasing screen brightness",
    troubleQr3: "Use the manual installation codes above",
    troubleStuck: "⏸️ Installation stuck?",
    troubleStuck1: "Restart your device and try again",
    troubleStuck2: "Check your internet connection",
    troubleStuck3: "Ensure device is not carrier-locked",
    troubleNotWork: "📵 eSIM not working?",
    troubleNotWork1: "Data Roaming MUST be enabled",
    troubleNotWork2: "Check your validity dates",
    troubleNotWork3: "Wait 5-10 minutes after installation",
    troubleNotWork4: "Contact support if issues persist",
    viewOrder: "View My eSIM",
    orVisit: "Or visit:",
    needHelp: "Need help? Contact our support team at",
    autoMessage: "This is an automated message. Please do not reply to this email.",
    emailSubjectQr: (orderId: string) => `Your eSIM QR Code - ${orderId}`,
    emailSubjectConfirm: (orderId: string) => `Order Confirmation - ${orderId}`,
    // KYC translations
    kycTitle: "🛂 Identity Verification Required",
    kycDescription: "This eSIM package requires KYC (Know Your Customer) verification before activation.",
    kycInstructions: "Please complete the identity verification process:",
    kycStep1: "Prepare your passport or national ID",
    kycStep2: "Click the verification link below",
    kycStep3: "Follow the instructions to upload your documents",
    kycStep4: "Wait for verification (usually within 24 hours)",
    kycButtonText: "Complete KYC Verification",
    kycNote: "Your eSIM will be activated automatically after successful verification.",
    // APN translations
    apnTitle: "📶 APN Settings",
    apnAutoNote: "Most eSIMs configure APN automatically. Only use these settings if you experience connection issues.",
    apnPrimary: "Primary APN:",
    apnAlternatives: "Alternative APNs:",
    apnHotspot: "Hotspot APN:",
    apnCredentials: "Credentials:",
    apnUsername: "Username:",
    apnPassword: "Password:",
    apnLeaveBlank: "leave blank",
    apnIosPath: "iOS: Settings → Cellular → [eSIM] → Cellular Data Network",
    apnAndroidPath: "Android: Settings → Network & Internet → Access Point Names",
  },
  th: {
    brandTagline: "บริการเชื่อมต่อ eSIM ของคุณ",
    orderConfirmed: "✅ ยืนยันคำสั่งซื้อแล้ว!",
    thankYou: (name: string) => `ขอบคุณ ${name}! คำสั่งซื้อของคุณได้รับการดำเนินการเรียบร้อยแล้ว`,
    orderDetails: "รายละเอียดคำสั่งซื้อ",
    orderId: "หมายเลขคำสั่งซื้อ:",
    package: "แพ็คเกจ:",
    country: "ประเทศ:",
    dataAmount: "ปริมาณข้อมูล:",
    validity: "ระยะเวลา:",
    days: "วัน",
    amountPaid: "จำนวนเงินที่ชำระ:",
    qrCodeTitle: "📱 QR Code eSIM ของคุณ",
    qrCodeSubtitle: "สแกนโค้ดนี้ด้วยอุปกรณ์ของคุณเพื่อติดตั้ง",
    iccid: "ICCID:",
    downloadQr: "ดาวน์โหลด QR Code",
    processing: "⏳ กำลังดำเนินการ eSIM",
    processingMsg: "eSIM ของคุณกำลังเปิดใช้งาน คุณจะได้รับ QR Code และคำแนะนำการติดตั้งในอีเมลติดตามภายใน 5-10 นาที",
    iosTitle: "📱 สำหรับผู้ใช้ iPhone",
    iosRequirements: "ข้อกำหนด:",
    iosReq1: "iPhone XS หรือใหม่กว่า",
    iosReq2: "iOS 12.0 ขึ้นไป",
    iosReq3: "อุปกรณ์ปลดล็อค (ไม่ถูกล็อคโดยผู้ให้บริการ)",
    iosReq4: "การเชื่อมต่อ Wi-Fi",
    iosQuickInstall: "🚀 ติดตั้งด่วน iOS 17.4+",
    iosQuickInstallBtn: "ติดตั้ง eSIM ตอนนี้ (1 คลิก)",
    iosQuickInstallNote: "แตะปุ่มนี้เพื่อติดตั้งโดยตรง (iOS 17.4+)",
    iosInstallLink: "🔗 ลิงก์ติดตั้ง",
    iosInstallLinkNote: "คัดลอกลิงก์นี้เพื่อแชร์ให้ใครก็ได้ที่ต้องการติดตั้ง eSIM นี้:",
    iosSteps: "ขั้นตอนการติดตั้ง:",
    iosStep1: "เชื่อมต่อ Wi-Fi",
    iosStep1Note: " - ตรวจสอบให้แน่ใจว่าคุณเชื่อมต่ออินเทอร์เน็ต",
    iosStep2: "เปิด ",
    iosStep2Bold: "การตั้งค่า",
    iosStep2Arrow: " → ",
    iosStep2Bold2: "เซลลูลาร์",
    iosStep2Note: " (หรือข้อมูลมือถือ)",
    iosStep3: "แตะ ",
    iosStep3Bold: '"เพิ่มแผนเซลลูลาร์"',
    iosStep3Or: " หรือ ",
    iosStep3Bold2: '"เพิ่ม eSIM"',
    iosStep4: "สแกน QR Code ด้านบน",
    iosStep4Note: " ด้วยกล้องของคุณ",
    iosStep5: "แตะ ",
    iosStep5Bold: '"ดำเนินการต่อ"',
    iosStep5Note: " และรอ 30-60 วินาทีเพื่อเปิดใช้งาน",
    iosStep6: "⚠️ สำคัญ:",
    iosStep6Bold: " เปิดใช้งาน ",
    iosStep6Bold2: "การโรมมิ่งข้อมูล",
    iosStep6Path: "การตั้งค่า → เซลลูลาร์ → [eSIM ของคุณ] → การโรมมิ่งข้อมูล → เปิด",
    androidTitle: "🤖 สำหรับผู้ใช้ Android",
    androidCompatible: "อุปกรณ์ที่รองรับ:",
    androidDev1: "Samsung Galaxy S20 และใหม่กว่า",
    androidDev2: "Google Pixel 3 และใหม่กว่า",
    androidDev3: "OnePlus 7 และใหม่กว่า",
    androidDev4: "อุปกรณ์ Android 9+ ส่วนใหญ่ที่รองรับ eSIM",
    androidSteps: "ขั้นตอนการติดตั้ง:",
    androidStep1: "เปิด ",
    androidStep1Bold: "การตั้งค่า",
    androidStep1Note: " บนอุปกรณ์ของคุณ",
    androidStep2: "ไปที่การตั้งค่าเครือข่าย (แตกต่างกันตามอุปกรณ์):",
    androidStep2Samsung: "Samsung: ",
    androidStep2SamsungPath: "การเชื่อมต่อ → ตัวจัดการ SIM",
    androidStep2Pixel: "Google Pixel: ",
    androidStep2PixelPath: "เครือข่ายและอินเทอร์เน็ต → SIM",
    androidStep2Others: "อื่นๆ: ",
    androidStep2OthersPath: "เครือข่ายมือถือ",
    androidStep2Or: " หรือ ",
    androidStep2OthersPath2: "ซิมการ์ด",
    androidStep3: "แตะ ",
    androidStep3Bold: '"เพิ่มแผนมือถือ"',
    androidStep3Or: " หรือ ",
    androidStep3Bold2: '"ดาวน์โหลด SIM"',
    androidStep4: "เลือก ",
    androidStep4Bold: '"สแกน QR Code"',
    androidStep5: "สแกน QR Code ด้านบน",
    androidStep6: "แตะ ",
    androidStep6Bold: '"ดาวน์โหลด"',
    androidStep6Note: " และรอ 1-2 นาที",
    androidStep7: "⚠️ สำคัญ:",
    androidStep7Bold: " เปิดใช้งาน ",
    androidStep7Bold2: "การโรมมิ่งข้อมูล",
    androidStep7Note: " สำหรับ eSIM ใหม่",
    manualTitle: "🔧 การติดตั้งด้วยตนเอง",
    manualSubtitle: "สแกน QR Code ไม่ได้? ใช้รหัสเหล่านี้เพื่อติดตั้งด้วยตนเอง:",
    smdpAddress: "ที่อยู่ SM-DP+:",
    activationCode: "รหัสเปิดใช้งาน:",
    manualHow: "วิธีใช้:",
    manualIos: "iOS:",
    manualIosPath: " การตั้งค่า → เซลลูลาร์ → เพิ่ม eSIM → ป้อนรายละเอียดด้วยตนเอง",
    manualAndroid: "Android:",
    manualAndroidNote: " ตรวจสอบการตั้งค่า eSIM ของอุปกรณ์สำหรับตัวเลือกการป้อนด้วยตนเอง (แตกต่างกันตามผู้ผลิต)",
    troubleTitle: "❓ มีปัญหาหรือไม่?",
    troubleQr: "📷 สแกน QR Code ไม่ได้?",
    troubleQr1: "ตรวจสอบให้แน่ใจว่าเปิดใช้งานสิทธิ์กล้องแล้ว",
    troubleQr2: "ลองเพิ่มความสว่างหน้าจอ",
    troubleQr3: "ใช้รหัสการติดตั้งด้วยตนเองด้านบน",
    troubleStuck: "⏸️ การติดตั้งค้าง?",
    troubleStuck1: "รีสตาร์ทอุปกรณ์และลองอีกครั้ง",
    troubleStuck2: "ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต",
    troubleStuck3: "ตรวจสอบให้แน่ใจว่าอุปกรณ์ไม่ถูกล็อคโดยผู้ให้บริการ",
    troubleNotWork: "📵 eSIM ไม่ทำงาน?",
    troubleNotWork1: "ต้องเปิดใช้งานการโรมมิ่งข้อมูล",
    troubleNotWork2: "ตรวจสอบวันหมดอายุ",
    troubleNotWork3: "รอ 5-10 นาทีหลังการติดตั้ง",
    troubleNotWork4: "ติดต่อฝ่ายสนับสนุนหากปัญหายังคงอยู่",
    viewOrder: "ดู eSIM ของฉัน",
    orVisit: "หรือเยี่ยมชม:",
    needHelp: "ต้องการความช่วยเหลือ? ติดต่อทีมสนับสนุนของเราที่",
    autoMessage: "นี่เป็นข้อความอัตโนมัติ กรุณาอย่าตอบกลับอีเมลนี้",
    emailSubjectQr: (orderId: string) => `QR Code eSIM ของคุณ - ${orderId}`,
    emailSubjectConfirm: (orderId: string) => `ยืนยันคำสั่งซื้อ - ${orderId}`,
    // KYC translations
    kycTitle: "🛂 ต้องการยืนยันตัวตน",
    kycDescription: "แพ็คเกจ eSIM นี้ต้องการการยืนยันตัวตน (KYC) ก่อนเปิดใช้งาน",
    kycInstructions: "กรุณาทำการยืนยันตัวตนตามขั้นตอนต่อไปนี้:",
    kycStep1: "เตรียมหนังสือเดินทางหรือบัตรประชาชน",
    kycStep2: "คลิกลิงก์ยืนยันตัวตนด้านล่าง",
    kycStep3: "ทำตามคำแนะนำเพื่ออัปโหลดเอกสาร",
    kycStep4: "รอการยืนยัน (ปกติภายใน 24 ชั่วโมง)",
    kycButtonText: "ยืนยันตัวตน KYC",
    kycNote: "eSIM ของคุณจะเปิดใช้งานอัตโนมัติหลังจากการยืนยันสำเร็จ",
    apnTitle: "📶 การตั้งค่า APN",
    apnAutoNote: "eSIM ส่วนใหญ่จะตั้งค่า APN โดยอัตโนมัติ ใช้การตั้งค่าเหล่านี้เฉพาะเมื่อคุณประสบปัญหาการเชื่อมต่อ",
    apnPrimary: "APN หลัก:",
    apnAlternatives: "APN สำรอง:",
    apnHotspot: "APN ฮอตสปอต:",
    apnCredentials: "ข้อมูลรับรอง:",
    apnUsername: "ชื่อผู้ใช้:",
    apnPassword: "รหัสผ่าน:",
    apnLeaveBlank: "เว้นว่างไว้",
    apnIosPath: "iOS: การตั้งค่า → เซลลูลาร์ → [eSIM] → เครือข่ายข้อมูลเซลลูลาร์",
    apnAndroidPath: "Android: การตั้งค่า → เครือข่ายและอินเทอร์เน็ต → ชื่อจุดเข้าใช้งาน",
  },
  ja: {
    brandTagline: "eSIM接続サービス",
    orderConfirmed: "✅ ご注文が確認されました！",
    thankYou: (name: string) => `${name}様、ありがとうございます！ご注文は正常に処理されました。`,
    orderDetails: "ご注文の詳細",
    orderId: "注文番号：",
    package: "パッケージ：",
    country: "国：",
    dataAmount: "データ容量：",
    validity: "有効期間：",
    days: "日間",
    amountPaid: "お支払い金額：",
    qrCodeTitle: "📱 eSIM QRコード",
    qrCodeSubtitle: "このコードをデバイスでスキャンしてインストールしてください",
    iccid: "ICCID：",
    downloadQr: "QRコードをダウンロード",
    processing: "⏳ eSIM処理中",
    processingMsg: "eSIMを有効化しています。5〜10分以内にQRコードとインストール手順をメールでお送りします。",
    iosTitle: "📱 iPhoneをお使いの方",
    iosRequirements: "要件：",
    iosReq1: "iPhone XS以降",
    iosReq2: "iOS 12.0以降",
    iosReq3: "SIMロック解除済みの端末",
    iosReq4: "Wi-Fi接続",
    iosQuickInstall: "🚀 iOS 17.4+ クイックインストール",
    iosQuickInstallBtn: "eSIMをインストール（ワンクリック）",
    iosQuickInstallNote: "このボタンをタップして直接インストール（iOS 17.4以降）",
    iosInstallLink: "🔗 インストールリンク",
    iosInstallLinkNote: "このリンクをコピーして、eSIMのインストールが必要な方と共有できます：",
    iosSteps: "インストール手順：",
    iosStep1: "Wi-Fiに接続",
    iosStep1Note: " — インターネットに接続されていることを確認してください",
    iosStep2: "「",
    iosStep2Bold: "設定",
    iosStep2Arrow: "」→「",
    iosStep2Bold2: "モバイル通信",
    iosStep2Note: "」を開く",
    iosStep3: "「",
    iosStep3Bold: "モバイル通信プランを追加",
    iosStep3Or: "」または「",
    iosStep3Bold2: "eSIMを追加",
    iosStep4: "上のQRコードをスキャン",
    iosStep4Note: "（カメラを使用）",
    iosStep5: "「",
    iosStep5Bold: "続ける",
    iosStep5Note: "」をタップし、30〜60秒待つ",
    iosStep6: "⚠️ 重要：",
    iosStep6Bold: "「",
    iosStep6Bold2: "データローミング",
    iosStep6Path: "設定 → モバイル通信 → [eSIM] → データローミング → オン",
    androidTitle: "🤖 Androidをお使いの方",
    androidCompatible: "対応端末：",
    androidDev1: "Samsung Galaxy S20以降",
    androidDev2: "Google Pixel 3以降",
    androidDev3: "OnePlus 7以降",
    androidDev4: "eSIM対応のAndroid 9以降の端末",
    androidSteps: "インストール手順：",
    androidStep1: "端末の「",
    androidStep1Bold: "設定",
    androidStep1Note: "」を開く",
    androidStep2: "ネットワーク設定に移動（端末により異なります）：",
    androidStep2Samsung: "Samsung：",
    androidStep2SamsungPath: "接続 → SIMマネージャー",
    androidStep2Pixel: "Google Pixel：",
    androidStep2PixelPath: "ネットワークとインターネット → SIM",
    androidStep2Others: "その他：",
    androidStep2OthersPath: "モバイルネットワーク",
    androidStep2Or: " または ",
    androidStep2OthersPath2: "SIMカード",
    androidStep3: "「",
    androidStep3Bold: "モバイルプランを追加",
    androidStep3Or: "」または「",
    androidStep3Bold2: "SIMをダウンロード",
    androidStep4: "「",
    androidStep4Bold: "QRコードをスキャン",
    androidStep5: "上のQRコードをスキャン",
    androidStep6: "「",
    androidStep6Bold: "ダウンロード",
    androidStep6Note: "」をタップし、1〜2分待つ",
    androidStep7: "⚠️ 重要：",
    androidStep7Bold: "「",
    androidStep7Bold2: "データローミング",
    androidStep7Note: "」を新しいeSIMで有効にしてください",
    manualTitle: "🔧 手動インストール",
    manualSubtitle: "QRコードをスキャンできませんか？以下のコードを使用して手動でインストールしてください：",
    smdpAddress: "SM-DP+アドレス：",
    activationCode: "アクティベーションコード：",
    manualHow: "使用方法：",
    manualIos: "iOS：",
    manualIosPath: " 設定 → モバイル通信 → eSIMを追加 → 詳細を手動で入力",
    manualAndroid: "Android：",
    manualAndroidNote: " 端末のeSIM設定で手動入力オプションをご確認ください（メーカーにより異なります）",
    troubleTitle: "❓ お困りですか？",
    troubleQr: "📷 QRコードがスキャンできない場合",
    troubleQr1: "カメラの権限が有効になっていることをご確認ください",
    troubleQr2: "画面の明るさを上げてみてください",
    troubleQr3: "上記の手動インストールコードをお使いください",
    troubleStuck: "⏸️ インストールが止まった場合",
    troubleStuck1: "端末を再起動して再試行してください",
    troubleStuck2: "インターネット接続をご確認ください",
    troubleStuck3: "端末がSIMロックされていないことをご確認ください",
    troubleNotWork: "📵 eSIMが動作しない場合",
    troubleNotWork1: "データローミングを必ず有効にしてください",
    troubleNotWork2: "有効期間をご確認ください",
    troubleNotWork3: "インストール後5〜10分お待ちください",
    troubleNotWork4: "問題が続く場合はサポートまでお問い合わせください",
    viewOrder: "eSIMを確認する",
    orVisit: "または以下にアクセス：",
    needHelp: "サポートが必要ですか？サポートチームまでお問い合わせください：",
    autoMessage: "これは自動送信メールです。このメールには返信しないでください。",
    emailSubjectQr: (orderId: string) => `eSIM QRコード — ${orderId}`,
    emailSubjectConfirm: (orderId: string) => `ご注文確認 — ${orderId}`,
    kycTitle: "🛂 本人確認が必要です",
    kycDescription: "このeSIMパッケージは有効化の前にKYC（本人確認）が必要です。",
    kycInstructions: "以下の手順で本人確認を完了してください：",
    kycStep1: "パスポートまたは身分証明書をご用意ください",
    kycStep2: "以下の確認リンクをクリックしてください",
    kycStep3: "指示に従って書類をアップロードしてください",
    kycStep4: "確認をお待ちください（通常24時間以内）",
    kycButtonText: "KYC認証を完了する",
    kycNote: "認証完了後、eSIMは自動的に有効化されます。",
    apnTitle: "📶 APN設定",
    apnAutoNote: "ほとんどのeSIMはAPNを自動的に設定します。接続に問題がある場合のみ、これらの設定を使用してください。",
    apnPrimary: "プライマリAPN：",
    apnAlternatives: "代替APN：",
    apnHotspot: "テザリングAPN：",
    apnCredentials: "認証情報：",
    apnUsername: "ユーザー名：",
    apnPassword: "パスワード：",
    apnLeaveBlank: "空欄のまま",
    apnIosPath: "iOS：設定 → モバイル通信 → [eSIM] → モバイルデータ通信ネットワーク",
    apnAndroidPath: "Android：設定 → ネットワークとインターネット → アクセスポイント名",
  },
  ko: {
    brandTagline: "eSIM 연결 서비스",
    orderConfirmed: "✅ 주문이 확인되었습니다!",
    thankYou: (name: string) => `${name}님, 감사합니다! 주문이 성공적으로 처리되었습니다.`,
    orderDetails: "주문 상세",
    orderId: "주문 번호:",
    package: "패키지:",
    country: "국가:",
    dataAmount: "데이터 용량:",
    validity: "유효 기간:",
    days: "일",
    amountPaid: "결제 금액:",
    qrCodeTitle: "📱 eSIM QR 코드",
    qrCodeSubtitle: "기기로 이 코드를 스캔하여 설치하세요",
    iccid: "ICCID:",
    downloadQr: "QR 코드 다운로드",
    processing: "⏳ eSIM 처리 중",
    processingMsg: "eSIM을 활성화하고 있습니다. 5~10분 이내에 QR 코드와 설치 안내를 이메일로 보내드리겠습니다.",
    iosTitle: "📱 iPhone 사용자용",
    iosRequirements: "요구 사항:",
    iosReq1: "iPhone XS 이상",
    iosReq2: "iOS 12.0 이상",
    iosReq3: "잠금 해제된 기기 (통신사 잠금 아님)",
    iosReq4: "Wi-Fi 연결",
    iosQuickInstall: "🚀 iOS 17.4+ 빠른 설치",
    iosQuickInstallBtn: "eSIM 설치 (원클릭)",
    iosQuickInstallNote: "이 버튼을 탭하여 바로 설치 (iOS 17.4 이상)",
    iosInstallLink: "🔗 설치 링크",
    iosInstallLinkNote: "이 링크를 복사하여 eSIM 설치가 필요한 분과 공유할 수 있습니다:",
    iosSteps: "설치 단계:",
    iosStep1: "Wi-Fi 연결",
    iosStep1Note: " — 인터넷에 연결되어 있는지 확인하세요",
    iosStep2: "",
    iosStep2Bold: "설정",
    iosStep2Arrow: " → ",
    iosStep2Bold2: "셀룰러",
    iosStep2Note: " (또는 모바일 데이터)를 여세요",
    iosStep3: "",
    iosStep3Bold: '"셀룰러 플랜 추가"',
    iosStep3Or: " 또는 ",
    iosStep3Bold2: '"eSIM 추가"',
    iosStep4: "위의 QR 코드를 스캔",
    iosStep4Note: "하세요 (카메라 사용)",
    iosStep5: "",
    iosStep5Bold: '"계속"',
    iosStep5Note: "을 탭하고 30~60초 기다리세요",
    iosStep6: "⚠️ 중요:",
    iosStep6Bold: " ",
    iosStep6Bold2: "데이터 로밍",
    iosStep6Path: "설정 → 셀룰러 → [eSIM] → 데이터 로밍 → 켜기",
    androidTitle: "🤖 Android 사용자용",
    androidCompatible: "호환 기기:",
    androidDev1: "Samsung Galaxy S20 이상",
    androidDev2: "Google Pixel 3 이상",
    androidDev3: "OnePlus 7 이상",
    androidDev4: "eSIM을 지원하는 대부분의 Android 9+ 기기",
    androidSteps: "설치 단계:",
    androidStep1: "기기의 ",
    androidStep1Bold: "설정",
    androidStep1Note: "을 여세요",
    androidStep2: "네트워크 설정으로 이동 (기기마다 다름):",
    androidStep2Samsung: "Samsung: ",
    androidStep2SamsungPath: "연결 → SIM 관리자",
    androidStep2Pixel: "Google Pixel: ",
    androidStep2PixelPath: "네트워크 및 인터넷 → SIM",
    androidStep2Others: "기타: ",
    androidStep2OthersPath: "모바일 네트워크",
    androidStep2Or: " 또는 ",
    androidStep2OthersPath2: "SIM 카드",
    androidStep3: "",
    androidStep3Bold: '"모바일 플랜 추가"',
    androidStep3Or: " 또는 ",
    androidStep3Bold2: '"SIM 다운로드"',
    androidStep4: "",
    androidStep4Bold: '"QR 코드 스캔"',
    androidStep5: "위의 QR 코드를 스캔하세요",
    androidStep6: "",
    androidStep6Bold: '"다운로드"',
    androidStep6Note: "를 탭하고 1~2분 기다리세요",
    androidStep7: "⚠️ 중요:",
    androidStep7Bold: " ",
    androidStep7Bold2: "데이터 로밍",
    androidStep7Note: "을 새 eSIM에서 활성화하세요",
    manualTitle: "🔧 수동 설치",
    manualSubtitle: "QR 코드를 스캔할 수 없나요? 아래 코드를 사용하여 수동으로 설치하세요:",
    smdpAddress: "SM-DP+ 주소:",
    activationCode: "활성화 코드:",
    manualHow: "사용 방법:",
    manualIos: "iOS:",
    manualIosPath: " 설정 → 셀룰러 → eSIM 추가 → 수동 입력",
    manualAndroid: "Android:",
    manualAndroidNote: " 기기의 eSIM 설정에서 수동 입력 옵션을 확인하세요 (제조사별 상이)",
    troubleTitle: "❓ 문제가 있으신가요?",
    troubleQr: "📷 QR 코드가 스캔되지 않나요?",
    troubleQr1: "카메라 권한이 활성화되어 있는지 확인하세요",
    troubleQr2: "화면 밝기를 높여보세요",
    troubleQr3: "위의 수동 설치 코드를 사용하세요",
    troubleStuck: "⏸️ 설치가 멈췄나요?",
    troubleStuck1: "기기를 재시작하고 다시 시도하세요",
    troubleStuck2: "인터넷 연결을 확인하세요",
    troubleStuck3: "기기가 통신사에 잠겨 있지 않은지 확인하세요",
    troubleNotWork: "📵 eSIM이 작동하지 않나요?",
    troubleNotWork1: "데이터 로밍을 반드시 활성화하세요",
    troubleNotWork2: "유효 기간을 확인하세요",
    troubleNotWork3: "설치 후 5~10분 기다려주세요",
    troubleNotWork4: "문제가 지속되면 지원팀에 문의하세요",
    viewOrder: "내 eSIM 보기",
    orVisit: "또는 방문:",
    needHelp: "도움이 필요하신가요? 지원팀에 문의하세요:",
    autoMessage: "이 메일은 자동 발송되었습니다. 이 이메일에 회신하지 마세요.",
    emailSubjectQr: (orderId: string) => `eSIM QR 코드 — ${orderId}`,
    emailSubjectConfirm: (orderId: string) => `주문 확인 — ${orderId}`,
    kycTitle: "🛂 본인 인증 필요",
    kycDescription: "이 eSIM 패키지는 활성화 전에 KYC(본인 확인) 인증이 필요합니다.",
    kycInstructions: "다음 단계에 따라 본인 인증을 완료해주세요:",
    kycStep1: "여권 또는 신분증을 준비하세요",
    kycStep2: "아래 인증 링크를 클릭하세요",
    kycStep3: "안내에 따라 서류를 업로드하세요",
    kycStep4: "인증 완료를 기다려주세요 (보통 24시간 이내)",
    kycButtonText: "KYC 인증 완료하기",
    kycNote: "인증 완료 후 eSIM이 자동으로 활성화됩니다.",
    apnTitle: "📶 APN 설정",
    apnAutoNote: "대부분의 eSIM은 APN을 자동으로 구성합니다. 연결 문제가 발생하는 경우에만 이 설정을 사용하세요.",
    apnPrimary: "기본 APN:",
    apnAlternatives: "대체 APN:",
    apnHotspot: "핫스팟 APN:",
    apnCredentials: "자격 증명:",
    apnUsername: "사용자 이름:",
    apnPassword: "비밀번호:",
    apnLeaveBlank: "비워 두세요",
    apnIosPath: "iOS: 설정 → 셀룰러 → [eSIM] → 셀룰러 데이터 네트워크",
    apnAndroidPath: "Android: 설정 → 네트워크 및 인터넷 → 액세스 포인트 이름",
  },
  fr: {
    brandTagline: "Votre service de connexion eSIM",
    orderConfirmed: "✅ Commande confirmée !",
    thankYou: (name: string) => `Merci ${name} ! Votre commande a été traitée avec succès.`,
    orderDetails: "Détails de la commande",
    orderId: "N° de commande :",
    package: "Forfait :",
    country: "Pays :",
    dataAmount: "Volume de données :",
    validity: "Validité :",
    days: "jours",
    amountPaid: "Montant payé :",
    qrCodeTitle: "📱 Votre QR Code eSIM",
    qrCodeSubtitle: "Scannez ce code avec votre appareil pour installer",
    iccid: "ICCID :",
    downloadQr: "Télécharger le QR Code",
    processing: "⏳ Traitement de l'eSIM",
    processingMsg: "Votre eSIM est en cours d'activation. Vous recevrez votre QR Code et les instructions d'installation par e-mail dans les 5 à 10 prochaines minutes.",
    iosTitle: "📱 Pour les utilisateurs iPhone",
    iosRequirements: "Prérequis :",
    iosReq1: "iPhone XS ou plus récent",
    iosReq2: "iOS 12.0 ou ultérieur",
    iosReq3: "Appareil déverrouillé (non bloqué par l'opérateur)",
    iosReq4: "Connexion Wi-Fi",
    iosQuickInstall: "🚀 Installation rapide iOS 17.4+",
    iosQuickInstallBtn: "Installer l'eSIM maintenant (1 clic)",
    iosQuickInstallNote: "Appuyez sur ce bouton pour installer directement (iOS 17.4+)",
    iosInstallLink: "🔗 Lien d'installation",
    iosInstallLinkNote: "Copiez ce lien pour le partager avec toute personne devant installer cette eSIM :",
    iosSteps: "Étapes d'installation :",
    iosStep1: "Connectez-vous au Wi-Fi",
    iosStep1Note: " — Assurez-vous d'être connecté à Internet",
    iosStep2: "Ouvrez ",
    iosStep2Bold: "Réglages",
    iosStep2Arrow: " → ",
    iosStep2Bold2: "Données cellulaires",
    iosStep2Note: " (ou Données mobiles)",
    iosStep3: "Appuyez sur ",
    iosStep3Bold: "« Ajouter un forfait cellulaire »",
    iosStep3Or: " ou ",
    iosStep3Bold2: "« Ajouter un eSIM »",
    iosStep4: "Scannez le QR Code ci-dessus",
    iosStep4Note: " avec votre appareil photo",
    iosStep5: "Appuyez sur ",
    iosStep5Bold: "« Continuer »",
    iosStep5Note: " et attendez 30 à 60 secondes",
    iosStep6: "⚠️ IMPORTANT :",
    iosStep6Bold: " Activez l'",
    iosStep6Bold2: "itinérance des données",
    iosStep6Path: "Réglages → Données cellulaires → [Votre eSIM] → Itinérance des données → Activé",
    androidTitle: "🤖 Pour les utilisateurs Android",
    androidCompatible: "Appareils compatibles :",
    androidDev1: "Samsung Galaxy S20 et plus récent",
    androidDev2: "Google Pixel 3 et plus récent",
    androidDev3: "OnePlus 7 et plus récent",
    androidDev4: "La plupart des appareils Android 9+ avec support eSIM",
    androidSteps: "Étapes d'installation :",
    androidStep1: "Ouvrez les ",
    androidStep1Bold: "Paramètres",
    androidStep1Note: " de votre appareil",
    androidStep2: "Accédez aux paramètres réseau (varie selon l'appareil) :",
    androidStep2Samsung: "Samsung : ",
    androidStep2SamsungPath: "Connexions → Gestionnaire SIM",
    androidStep2Pixel: "Google Pixel : ",
    androidStep2PixelPath: "Réseau et Internet → SIM",
    androidStep2Others: "Autres : ",
    androidStep2OthersPath: "Réseau mobile",
    androidStep2Or: " ou ",
    androidStep2OthersPath2: "Cartes SIM",
    androidStep3: "Appuyez sur ",
    androidStep3Bold: "« Ajouter un forfait mobile »",
    androidStep3Or: " ou ",
    androidStep3Bold2: "« Télécharger une SIM »",
    androidStep4: "Sélectionnez ",
    androidStep4Bold: "« Scanner un QR Code »",
    androidStep5: "Scannez le QR Code ci-dessus",
    androidStep6: "Appuyez sur ",
    androidStep6Bold: "« Télécharger »",
    androidStep6Note: " et attendez 1 à 2 minutes",
    androidStep7: "⚠️ IMPORTANT :",
    androidStep7Bold: " Activez l'",
    androidStep7Bold2: "itinérance des données",
    androidStep7Note: " pour la nouvelle eSIM",
    manualTitle: "🔧 Installation manuelle",
    manualSubtitle: "Impossible de scanner le QR Code ? Utilisez ces codes pour installer manuellement :",
    smdpAddress: "Adresse SM-DP+ :",
    activationCode: "Code d'activation :",
    manualHow: "Comment utiliser :",
    manualIos: "iOS :",
    manualIosPath: " Réglages → Données cellulaires → Ajouter un eSIM → Saisie manuelle",
    manualAndroid: "Android :",
    manualAndroidNote: " Vérifiez les paramètres eSIM de votre appareil pour l'option de saisie manuelle (varie selon le fabricant)",
    troubleTitle: "❓ Des problèmes ?",
    troubleQr: "📷 Le QR Code ne se scanne pas ?",
    troubleQr1: "Vérifiez que les permissions de la caméra sont activées",
    troubleQr2: "Essayez d'augmenter la luminosité de l'écran",
    troubleQr3: "Utilisez les codes d'installation manuelle ci-dessus",
    troubleStuck: "⏸️ Installation bloquée ?",
    troubleStuck1: "Redémarrez votre appareil et réessayez",
    troubleStuck2: "Vérifiez votre connexion Internet",
    troubleStuck3: "Assurez-vous que l'appareil n'est pas bloqué par l'opérateur",
    troubleNotWork: "📵 L'eSIM ne fonctionne pas ?",
    troubleNotWork1: "L'itinérance des données DOIT être activée",
    troubleNotWork2: "Vérifiez vos dates de validité",
    troubleNotWork3: "Attendez 5 à 10 minutes après l'installation",
    troubleNotWork4: "Contactez le support si le problème persiste",
    viewOrder: "Voir mon eSIM",
    orVisit: "Ou visitez :",
    needHelp: "Besoin d'aide ? Contactez notre équipe d'assistance à",
    autoMessage: "Ceci est un message automatique. Veuillez ne pas répondre à cet e-mail.",
    emailSubjectQr: (orderId: string) => `Votre QR Code eSIM — ${orderId}`,
    emailSubjectConfirm: (orderId: string) => `Confirmation de commande — ${orderId}`,
    kycTitle: "🛂 Vérification d'identité requise",
    kycDescription: "Ce forfait eSIM nécessite une vérification KYC (Know Your Customer) avant l'activation.",
    kycInstructions: "Veuillez compléter le processus de vérification d'identité :",
    kycStep1: "Préparez votre passeport ou carte d'identité",
    kycStep2: "Cliquez sur le lien de vérification ci-dessous",
    kycStep3: "Suivez les instructions pour télécharger vos documents",
    kycStep4: "Attendez la vérification (généralement sous 24 heures)",
    kycButtonText: "Compléter la vérification KYC",
    kycNote: "Votre eSIM sera activée automatiquement après vérification.",
    apnTitle: "📶 Paramètres APN",
    apnAutoNote: "La plupart des eSIM configurent l'APN automatiquement. N'utilisez ces paramètres qu'en cas de problème de connexion.",
    apnPrimary: "APN principal :",
    apnAlternatives: "APN alternatifs :",
    apnHotspot: "APN point d'accès :",
    apnCredentials: "Identifiants :",
    apnUsername: "Nom d'utilisateur :",
    apnPassword: "Mot de passe :",
    apnLeaveBlank: "laisser vide",
    apnIosPath: "iOS : Réglages → Données cellulaires → [eSIM] → Réseau de données cellulaires",
    apnAndroidPath: "Android : Paramètres → Réseau et Internet → Noms des points d'accès",
  },
  de: {
    brandTagline: "Ihr eSIM-Verbindungsservice",
    orderConfirmed: "✅ Bestellung bestätigt!",
    thankYou: (name: string) => `Vielen Dank, ${name}! Ihre Bestellung wurde erfolgreich bearbeitet.`,
    orderDetails: "Bestelldetails",
    orderId: "Bestellnummer:",
    package: "Paket:",
    country: "Land:",
    dataAmount: "Datenvolumen:",
    validity: "Gültigkeit:",
    days: "Tage",
    amountPaid: "Bezahlter Betrag:",
    qrCodeTitle: "📱 Ihr eSIM-QR-Code",
    qrCodeSubtitle: "Scannen Sie diesen Code mit Ihrem Gerät zur Installation",
    iccid: "ICCID:",
    downloadQr: "QR-Code herunterladen",
    processing: "⏳ eSIM wird verarbeitet",
    processingMsg: "Ihre eSIM wird aktiviert. Sie erhalten Ihren QR-Code und die Installationsanleitung innerhalb der nächsten 5–10 Minuten per E-Mail.",
    iosTitle: "📱 Für iPhone-Nutzer",
    iosRequirements: "Voraussetzungen:",
    iosReq1: "iPhone XS oder neuer",
    iosReq2: "iOS 12.0 oder höher",
    iosReq3: "Entsperrtes Gerät (kein SIM-Lock)",
    iosReq4: "WLAN-Verbindung",
    iosQuickInstall: "🚀 iOS 17.4+ Schnellinstallation",
    iosQuickInstallBtn: "eSIM jetzt installieren (1 Klick)",
    iosQuickInstallNote: "Tippen Sie auf diese Schaltfläche zur direkten Installation (iOS 17.4+)",
    iosInstallLink: "🔗 Installationslink",
    iosInstallLinkNote: "Kopieren Sie diesen Link, um ihn mit anderen zu teilen, die diese eSIM installieren müssen:",
    iosSteps: "Installationsschritte:",
    iosStep1: "Mit WLAN verbinden",
    iosStep1Note: " — Stellen Sie sicher, dass Sie mit dem Internet verbunden sind",
    iosStep2: "Öffnen Sie ",
    iosStep2Bold: "Einstellungen",
    iosStep2Arrow: " → ",
    iosStep2Bold2: "Mobilfunk",
    iosStep2Note: " (oder Mobile Daten)",
    iosStep3: "Tippen Sie auf ",
    iosStep3Bold: "\u201EMobilfunktarif hinzufügen\u201C",
    iosStep3Or: " oder ",
    iosStep3Bold2: "\u201EeSIM hinzufügen\u201C",
    iosStep4: "Scannen Sie den QR-Code oben",
    iosStep4Note: " mit Ihrer Kamera",
    iosStep5: "Tippen Sie auf ",
    iosStep5Bold: "\u201EWeiter\u201C",
    iosStep5Note: " und warten Sie 30–60 Sekunden",
    iosStep6: "⚠️ WICHTIG:",
    iosStep6Bold: " Aktivieren Sie ",
    iosStep6Bold2: "Datenroaming",
    iosStep6Path: "Einstellungen → Mobilfunk → [Ihre eSIM] → Datenroaming → Ein",
    androidTitle: "🤖 Für Android-Nutzer",
    androidCompatible: "Kompatible Geräte:",
    androidDev1: "Samsung Galaxy S20 und neuer",
    androidDev2: "Google Pixel 3 und neuer",
    androidDev3: "OnePlus 7 und neuer",
    androidDev4: "Die meisten Android 9+-Geräte mit eSIM-Unterstützung",
    androidSteps: "Installationsschritte:",
    androidStep1: "Öffnen Sie die ",
    androidStep1Bold: "Einstellungen",
    androidStep1Note: " auf Ihrem Gerät",
    androidStep2: "Navigieren Sie zu den Netzwerkeinstellungen (variiert je nach Gerät):",
    androidStep2Samsung: "Samsung: ",
    androidStep2SamsungPath: "Verbindungen → SIM-Manager",
    androidStep2Pixel: "Google Pixel: ",
    androidStep2PixelPath: "Netzwerk & Internet → SIMs",
    androidStep2Others: "Andere: ",
    androidStep2OthersPath: "Mobilfunknetz",
    androidStep2Or: " oder ",
    androidStep2OthersPath2: "SIM-Karten",
    androidStep3: "Tippen Sie auf ",
    androidStep3Bold: "\u201EMobilfunktarif hinzufügen\u201C",
    androidStep3Or: " oder ",
    androidStep3Bold2: "\u201ESIM herunterladen\u201C",
    androidStep4: "Wählen Sie ",
    androidStep4Bold: "\u201EQR-Code scannen\u201C",
    androidStep5: "Scannen Sie den QR-Code oben",
    androidStep6: "Tippen Sie auf ",
    androidStep6Bold: "\u201EHerunterladen\u201C",
    androidStep6Note: " und warten Sie 1–2 Minuten",
    androidStep7: "⚠️ WICHTIG:",
    androidStep7Bold: " Aktivieren Sie ",
    androidStep7Bold2: "Datenroaming",
    androidStep7Note: " für die neue eSIM",
    manualTitle: "🔧 Manuelle Installation",
    manualSubtitle: "QR-Code lässt sich nicht scannen? Verwenden Sie diese Codes zur manuellen Installation:",
    smdpAddress: "SM-DP+-Adresse:",
    activationCode: "Aktivierungscode:",
    manualHow: "Anleitung:",
    manualIos: "iOS:",
    manualIosPath: " Einstellungen → Mobilfunk → eSIM hinzufügen → Details manuell eingeben",
    manualAndroid: "Android:",
    manualAndroidNote: " Prüfen Sie die eSIM-Einstellungen Ihres Geräts für die manuelle Eingabeoption (variiert je nach Hersteller)",
    troubleTitle: "❓ Probleme?",
    troubleQr: "📷 QR-Code lässt sich nicht scannen?",
    troubleQr1: "Stellen Sie sicher, dass die Kameraberechtigungen aktiviert sind",
    troubleQr2: "Versuchen Sie, die Bildschirmhelligkeit zu erhöhen",
    troubleQr3: "Verwenden Sie die manuellen Installationscodes oben",
    troubleStuck: "⏸️ Installation hängt?",
    troubleStuck1: "Starten Sie Ihr Gerät neu und versuchen Sie es erneut",
    troubleStuck2: "Überprüfen Sie Ihre Internetverbindung",
    troubleStuck3: "Stellen Sie sicher, dass das Gerät keinen SIM-Lock hat",
    troubleNotWork: "📵 eSIM funktioniert nicht?",
    troubleNotWork1: "Datenroaming MUSS aktiviert sein",
    troubleNotWork2: "Überprüfen Sie Ihre Gültigkeitsdaten",
    troubleNotWork3: "Warten Sie 5–10 Minuten nach der Installation",
    troubleNotWork4: "Kontaktieren Sie den Support, wenn das Problem weiterhin besteht",
    viewOrder: "Meine eSIM anzeigen",
    orVisit: "Oder besuchen Sie:",
    needHelp: "Brauchen Sie Hilfe? Kontaktieren Sie unser Support-Team unter",
    autoMessage: "Dies ist eine automatische Nachricht. Bitte antworten Sie nicht auf diese E-Mail.",
    emailSubjectQr: (orderId: string) => `Ihr eSIM-QR-Code — ${orderId}`,
    emailSubjectConfirm: (orderId: string) => `Bestellbestätigung — ${orderId}`,
    kycTitle: "🛂 Identitätsverifizierung erforderlich",
    kycDescription: "Dieses eSIM-Paket erfordert vor der Aktivierung eine KYC-Verifizierung (Know Your Customer).",
    kycInstructions: "Bitte führen Sie die Identitätsverifizierung durch:",
    kycStep1: "Halten Sie Ihren Reisepass oder Personalausweis bereit",
    kycStep2: "Klicken Sie auf den Verifizierungslink unten",
    kycStep3: "Folgen Sie den Anweisungen zum Hochladen Ihrer Dokumente",
    kycStep4: "Warten Sie auf die Verifizierung (in der Regel innerhalb von 24 Stunden)",
    kycButtonText: "KYC-Verifizierung abschließen",
    kycNote: "Ihre eSIM wird nach erfolgreicher Verifizierung automatisch aktiviert.",
    apnTitle: "📶 APN-Einstellungen",
    apnAutoNote: "Die meisten eSIMs konfigurieren den APN automatisch. Verwenden Sie diese Einstellungen nur bei Verbindungsproblemen.",
    apnPrimary: "Primärer APN:",
    apnAlternatives: "Alternative APNs:",
    apnHotspot: "Hotspot-APN:",
    apnCredentials: "Zugangsdaten:",
    apnUsername: "Benutzername:",
    apnPassword: "Passwort:",
    apnLeaveBlank: "leer lassen",
    apnIosPath: "iOS: Einstellungen → Mobilfunk → [eSIM] → Mobilfunkdatennetzwerk",
    apnAndroidPath: "Android: Einstellungen → Netzwerk & Internet → Zugangspunkte",
  },
};
const handler = async (req: Request): Promise<Response> => {
  console.log('Order confirmation email request received');

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Create Supabase client with service role key for admin access
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { orderId, language = 'en', overrideEmail }: OrderConfirmationRequest = await req.json();
    console.log('Processing order confirmation for:', orderId, 'language:', language, 'overrideEmail:', overrideEmail);

    // Fetch order details with package information, user info, and installation codes
    const { data: orderData, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        *,
        esim_packages(name, country_name, data_amount, validity_days, description, kyc, carrier, apn, provider_id, country_code)
      `)
      .eq('id', orderId)
      .maybeSingle();

    if (orderError) throw orderError;
    if (!orderData) throw new Error('Order not found');

    console.log('Order data fetched:', orderData.order_id);

    // Fetch APN configuration for this order's provider + country
    let apnData: any = null;
    const providerId = orderData.provider_id || orderData.esim_packages?.provider_id;
    const countryCode = orderData.esim_packages?.country_code;
    
    if (providerId && countryCode) {
      const { data: apnConfig } = await supabaseClient
        .from('provider_apn_config')
        .select('*')
        .eq('provider_id', providerId)
        .eq('country_code', countryCode)
        .order('priority', { ascending: true })
        .limit(1);
      
      if (apnConfig && apnConfig.length > 0) {
        apnData = apnConfig[0];
        console.log('APN config found from provider_apn_config:', apnData.primary_apn);
      }
    }
    
    // Fallback to esim_packages.apn field (e.g. TUGE packages)
    const fallbackApn = orderData.esim_packages?.apn;
    const displayPrimaryApn = apnData?.primary_apn || fallbackApn;
    console.log('APN for email:', displayPrimaryApn || 'none');

    // Determine language: order's stored language takes precedence, then request param, then default
    const orderLanguage = (orderData as any).language || language || 'en';
    const t = translations[orderLanguage as keyof typeof translations] || translations.en;

    // Get user info - gracefully handle missing user_id
    let userEmail: string | null = null;
    let isSyntheticEmail = false;
    let customerName = 'Customer';

    if (orderData.user_id) {
      const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(orderData.user_id);
      if (!userError && userData?.user?.email) {
        userEmail = userData.user.email;
        isSyntheticEmail = userEmail.startsWith('line_') && userEmail.endsWith('@mobile11.com');
      }

      // Try to get user profile for name
      const { data: profileData } = await supabaseClient
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', orderData.user_id)
        .maybeSingle();

      if (profileData && (profileData.first_name || profileData.last_name)) {
        customerName = `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim();
      } else if (userEmail) {
        customerName = userEmail.split('@')[0] || 'Customer';
      }
    }

    // Determine the target email address
    const targetEmail = overrideEmail || (orderData as any).notification_email || userEmail;

    if (!targetEmail) {
      console.log('No target email available for order:', orderData.order_id);
      return new Response(
        JSON.stringify({ success: false, error: 'No recipient email found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Skip sending if it's a synthetic email and no override provided
    if (isSyntheticEmail && !overrideEmail && !(orderData as any).notification_email) {
      console.log('Skipping email for LINE user with synthetic email:', userEmail);
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'LINE user without real email' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Target email:', targetEmail);

    // Create Apple eSIM URL if download_link is available
    const createAppleEsimUrl = (downloadLink: string): string => {
      return `https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=${encodeURIComponent(downloadLink)}`;
    };

    // Format amount based on order's stored currency
    const formatAmount = (amount: number, orderCurrency: string): string => {
      if (orderCurrency === 'THB') {
        // THB is stored as whole numbers
        return `฿${Math.round(amount).toLocaleString()} THB`;
      }
      // Default to USD formatting
      return `$${amount.toFixed(2)} USD`;
    };

    // Build comprehensive installation sections
    // Always generate base64 QR code for email (external URLs are blocked by email clients)
    let qrCodeImageUrl = '';
    const isLpaOrder = orderData.qr_code && isLpaString(orderData.qr_code);
    
    // Priority: 1) download_link (LPA string), 2) qr_code if LPA, 3) extract LPA from qr_code URL
    const lpaForQr = orderData.download_link 
      || (isLpaOrder ? orderData.qr_code : null);
    
    if (lpaForQr) {
      console.log('Generating QR code and uploading to storage for order:', orderData.order_id);
      qrCodeImageUrl = await generateQrCodeImage(lpaForQr, orderId, supabaseClient);
      console.log('QR code image generated:', qrCodeImageUrl ? 'success' : 'failed');
    } else if (orderData.qr_code) {
      // Fallback: use external URL (may be blocked by some email clients)
      console.log('Using external QR code URL for order:', orderData.order_id);
      qrCodeImageUrl = orderData.qr_code;
    }
    
    const qrCodeSection = qrCodeImageUrl ? `
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; padding: 25px; margin-bottom: 25px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h2 style="margin: 0 0 10px 0; color: white; font-size: 24px;">${t.qrCodeTitle}</h2>
        <p style="margin: 0 0 20px 0; color: rgba(255,255,255,0.9); font-size: 14px;">${t.qrCodeSubtitle}</p>
        <div style="background: white; padding: 20px; display: inline-block; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
          <img src="${qrCodeImageUrl}" alt="eSIM QR Code" style="max-width: 250px; width: 100%; height: auto; display: block;" />
        </div>
        ${orderData.iccid ? `<p style="margin: 15px 0 0 0; color: white; font-size: 13px; font-family: monospace; background: rgba(0,0,0,0.2); padding: 8px 12px; border-radius: 6px; display: inline-block;">${t.iccid} ${orderData.iccid}</p>` : ''}
        ${!isLpaOrder && orderData.qr_code ? `<p style="margin: 15px 0 0 0;"><a href="${orderData.qr_code}" download="esim-qr-${orderData.order_id}.png" style="color: white; text-decoration: underline; font-size: 14px;">${t.downloadQr}</a></p>` : ''}
      </div>
    ` : `
      <div style="background: #fff7ed; border: 2px solid #fed7aa; border-radius: 12px; padding: 25px; margin-bottom: 25px; text-align: center;">
        <h3 style="margin: 0 0 10px 0; color: #ea580c; font-size: 20px;">${t.processing}</h3>
        <p style="margin: 0; color: #9a3412; line-height: 1.6;">${t.processingMsg}</p>
      </div>
    `;

    const iosInstructions = orderData.qr_code ? `
      <div style="background: #f0f9ff; border: 2px solid #0ea5e9; border-radius: 12px; padding: 25px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 15px 0; color: #0369a1; font-size: 20px;">${t.iosTitle}</h3>
        
        <div style="background: white; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
          <p style="margin: 0 0 10px 0; color: #64748b; font-size: 14px;"><strong>${t.iosRequirements}</strong></p>
          <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.8;">
            <li>${t.iosReq1}</li>
            <li>${t.iosReq2}</li>
            <li>${t.iosReq3}</li>
            <li>${t.iosReq4}</li>
          </ul>
        </div>

        ${orderData.download_link ? `
        <div style="background: #dcfce7; border: 1px solid #86efac; border-radius: 8px; padding: 15px; margin-bottom: 15px; text-align: center;">
          <p style="margin: 0 0 10px 0; color: #15803d; font-weight: bold;">${t.iosQuickInstall}</p>
          <a href="${createAppleEsimUrl(orderData.download_link)}" 
             style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
            ${t.iosQuickInstallBtn}
          </a>
          <p style="margin: 10px 0 0 0; color: #166534; font-size: 13px;">${t.iosQuickInstallNote}</p>
          
          <!-- Installation Link Section -->
          <div style="background: white; border-radius: 8px; padding: 15px; margin-top: 15px; text-align: left;">
            <p style="margin: 0 0 8px 0; color: #166534; font-weight: bold; font-size: 14px;">${t.iosInstallLink}</p>
            <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px;">${t.iosInstallLinkNote}</p>
            <a href="${createAppleEsimUrl(orderData.download_link)}" 
               style="color: #2563eb; font-size: 12px; word-break: break-all; display: block; background: #f1f5f9; padding: 10px; border-radius: 6px; text-decoration: none; font-family: monospace;">
              ${createAppleEsimUrl(orderData.download_link)}
            </a>
          </div>
        </div>
        ` : ''}

        <div style="background: white; border-radius: 8px; padding: 15px;">
          <p style="margin: 0 0 12px 0; color: #0369a1; font-weight: bold;">${t.iosSteps}</p>
          <ol style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 2;">
            <li><strong>${t.iosStep1}</strong>${t.iosStep1Note}</li>
            <li>${t.iosStep2}<strong>${t.iosStep2Bold}</strong>${t.iosStep2Arrow}<strong>${t.iosStep2Bold2}</strong>${t.iosStep2Note}</li>
            <li>${t.iosStep3}<strong>${t.iosStep3Bold}</strong>${t.iosStep3Or}<strong>${t.iosStep3Bold2}</strong></li>
            <li><strong>${t.iosStep4}</strong>${t.iosStep4Note}</li>
            <li>${t.iosStep5}<strong>${t.iosStep5Bold}</strong>${t.iosStep5Note}</li>
            <li><strong>${t.iosStep6}</strong>${t.iosStep6Bold}<strong>${t.iosStep6Bold2}</strong><br>
                <span style="color: #64748b; font-size: 13px;">${t.iosStep6Path}</span></li>
          </ol>
        </div>
      </div>
    ` : '';

    const androidInstructions = orderData.qr_code ? `
      <div style="background: #f0fdf4; border: 2px solid #22c55e; border-radius: 12px; padding: 25px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 15px 0; color: #15803d; font-size: 20px;">${t.androidTitle}</h3>
        
        <div style="background: white; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
          <p style="margin: 0 0 10px 0; color: #64748b; font-size: 14px;"><strong>${t.androidCompatible}</strong></p>
          <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.8;">
            <li>${t.androidDev1}</li>
            <li>${t.androidDev2}</li>
            <li>${t.androidDev3}</li>
            <li>${t.androidDev4}</li>
          </ul>
        </div>

        <div style="background: white; border-radius: 8px; padding: 15px;">
          <p style="margin: 0 0 12px 0; color: #15803d; font-weight: bold;">${t.androidSteps}</p>
          <ol style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 2;">
            <li>${t.androidStep1}<strong>${t.androidStep1Bold}</strong>${t.androidStep1Note}</li>
            <li>${t.androidStep2}<br>
                <span style="font-size: 13px; color: #64748b;">
                • ${t.androidStep2Samsung}<strong>${t.androidStep2SamsungPath}</strong><br>
                • ${t.androidStep2Pixel}<strong>${t.androidStep2PixelPath}</strong><br>
                • ${t.androidStep2Others}<strong>${t.androidStep2OthersPath}</strong>${t.androidStep2Or}<strong>${t.androidStep2OthersPath2}</strong>
                </span>
            </li>
            <li>${t.androidStep3}<strong>${t.androidStep3Bold}</strong>${t.androidStep3Or}<strong>${t.androidStep3Bold2}</strong></li>
            <li>${t.androidStep4}<strong>${t.androidStep4Bold}</strong></li>
            <li><strong>${t.androidStep5}</strong></li>
            <li>${t.androidStep6}<strong>${t.androidStep6Bold}</strong>${t.androidStep6Note}</li>
            <li><strong>${t.androidStep7}</strong>${t.androidStep7Bold}<strong>${t.androidStep7Bold2}</strong>${t.androidStep7Note}</li>
          </ol>
        </div>
      </div>
    ` : '';

    const manualInstallSection = (orderData.smdp_address || orderData.activation_code) ? `
      <div style="background: #fef3c7; border: 2px solid #fbbf24; border-radius: 12px; padding: 25px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 15px 0; color: #92400e; font-size: 20px;">${t.manualTitle}</h3>
        <p style="margin: 0 0 15px 0; color: #78350f; font-size: 14px;">${t.manualSubtitle}</p>
        
        ${orderData.smdp_address ? `
        <div style="background: white; border-radius: 8px; padding: 15px; margin-bottom: 12px;">
          <p style="margin: 0 0 5px 0; color: #64748b; font-size: 13px; font-weight: bold;">${t.smdpAddress}</p>
          <p style="margin: 0; color: #1e293b; font-family: monospace; font-size: 14px; word-break: break-all; background: #f8fafc; padding: 10px; border-radius: 6px;">${orderData.smdp_address}</p>
        </div>
        ` : ''}
        
        ${orderData.activation_code ? `
        <div style="background: white; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
          <p style="margin: 0 0 5px 0; color: #64748b; font-size: 13px; font-weight: bold;">${t.activationCode}</p>
          <p style="margin: 0; color: #1e293b; font-family: monospace; font-size: 14px; word-break: break-all; background: #f8fafc; padding: 10px; border-radius: 6px;">${orderData.activation_code}</p>
        </div>
        ` : ''}

        <div style="background: white; border-radius: 8px; padding: 15px;">
          <p style="margin: 0 0 8px 0; color: #92400e; font-weight: bold; font-size: 14px;">${t.manualHow}</p>
          <p style="margin: 0; color: #78350f; font-size: 13px; line-height: 1.6;">
            <strong>${t.manualIos}</strong>${t.manualIosPath}<br>
            <strong>${t.manualAndroid}</strong>${t.manualAndroidNote}
          </p>
        </div>
      </div>
    ` : '';

    // KYC Section - Only show for packages that require KYC (like AIS Thailand)
    const kycSection = orderData.esim_packages?.kyc ? `
      <div style="background: #fff7ed; border: 2px solid #fb923c; border-radius: 12px; padding: 25px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 15px 0; color: #c2410c; font-size: 20px;">${t.kycTitle}</h3>
        <p style="margin: 0 0 15px 0; color: #9a3412; font-size: 14px; line-height: 1.6;">${t.kycDescription}</p>
        
        <div style="background: white; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
          <p style="margin: 0 0 10px 0; color: #c2410c; font-weight: bold; font-size: 14px;">${t.kycInstructions}</p>
          <ol style="margin: 0; padding-left: 20px; color: #9a3412; font-size: 14px; line-height: 1.8;">
            <li>${t.kycStep1}</li>
            <li>${t.kycStep2}</li>
            <li>${t.kycStep3}</li>
            <li>${t.kycStep4}</li>
          </ol>
        </div>
        
        <div style="text-align: center; margin: 20px 0;">
          <a href="https://kyc.cloud.ais.th" 
             target="_blank"
             style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            ${t.kycButtonText} →
          </a>
        </div>
        
        <p style="margin: 0; color: #78350f; font-size: 13px; text-align: center; font-style: italic;">${t.kycNote}</p>
      </div>
    ` : '';

    const troubleshootingSection = orderData.qr_code ? `
      <div style="background: #fef2f2; border: 2px solid #f87171; border-radius: 12px; padding: 25px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 15px 0; color: #991b1b; font-size: 20px;">${t.troubleTitle}</h3>
        
        <div style="background: white; border-radius: 8px; padding: 15px; margin-bottom: 12px;">
          <p style="margin: 0 0 8px 0; color: #991b1b; font-weight: bold; font-size: 14px;">${t.troubleQr}</p>
          <ul style="margin: 0; padding-left: 20px; color: #7f1d1d; font-size: 13px; line-height: 1.8;">
            <li>${t.troubleQr1}</li>
            <li>${t.troubleQr2}</li>
            <li>${t.troubleQr3}</li>
          </ul>
        </div>

        <div style="background: white; border-radius: 8px; padding: 15px; margin-bottom: 12px;">
          <p style="margin: 0 0 8px 0; color: #991b1b; font-weight: bold; font-size: 14px;">${t.troubleStuck}</p>
          <ul style="margin: 0; padding-left: 20px; color: #7f1d1d; font-size: 13px; line-height: 1.8;">
            <li>${t.troubleStuck1}</li>
            <li>${t.troubleStuck2}</li>
            <li>${t.troubleStuck3}</li>
          </ul>
        </div>

        <div style="background: white; border-radius: 8px; padding: 15px;">
          <p style="margin: 0 0 8px 0; color: #991b1b; font-weight: bold; font-size: 14px;">${t.troubleNotWork}</p>
          <ul style="margin: 0; padding-left: 20px; color: #7f1d1d; font-size: 13px; line-height: 1.8;">
            <li><strong>${t.troubleNotWork1}</strong></li>
            <li>${t.troubleNotWork2}</li>
            <li>${t.troubleNotWork3}</li>
            <li>${t.troubleNotWork4}</li>
          </ul>
        </div>
      </div>
    ` : '';

    // Send confirmation email
    const emailSubject = orderData.qr_code 
      ? t.emailSubjectQr(orderData.order_id) 
      : t.emailSubjectConfirm(orderData.order_id);

    const emailResponse = await resend.emails.send({
      from: "mobile11 <noreply@mobile11.com>",
      to: [targetEmail],
      subject: emailSubject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #FAF7F2;">
          <div style="background-color: #ffffff; border-radius: 12px; overflow: hidden; margin: 20px;">
            <div style="background-color: #ffffff; padding: 30px; text-align: center; border-bottom: 1px solid #E5E7EB;">
              <img src="https://jaqyvbjllsanrnpzlyjw.supabase.co/storage/v1/object/public/assets/logo.png" alt="mobile11" style="height: 40px; width: auto;" />
              <p style="color: #9CA3AF; margin: 5px 0 0 0;">${t.brandTagline}</p>
            </div>
            
            <div style="padding: 30px;">
              <div style="background: #F0FDF4; border-left: 4px solid #22c55e; padding: 20px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
                <h2 style="color: #15803d; margin: 0 0 10px 0;">${t.orderConfirmed}</h2>
                <p style="margin: 0; color: #166534;">${t.thankYou(customerName)}</p>
              </div>
              
              <div style="background: #FAF7F2; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 15px 0; color: #1A1A1A;">${t.orderDetails}</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #4B5563;">${t.orderId}</td>
                    <td style="padding: 8px 0; font-weight: bold; color: #1A1A1A;">${orderData.order_id}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #4B5563;">${t.package}</td>
                    <td style="padding: 8px 0; font-weight: bold; color: #1A1A1A;">${orderData.esim_packages?.name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #4B5563;">${t.country}</td>
                    <td style="padding: 8px 0; color: #1A1A1A;">${orderData.esim_packages?.country_name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #4B5563;">${t.dataAmount}</td>
                    <td style="padding: 8px 0; color: #1A1A1A;">${orderData.esim_packages?.data_amount}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #4B5563;">${t.validity}</td>
                    <td style="padding: 8px 0; color: #1A1A1A;">${orderData.esim_packages?.validity_days} ${t.days}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #4B5563;">${t.amountPaid}</td>
                    <td style="padding: 8px 0; font-weight: bold; color: #f97316;">${formatAmount(orderData.total_amount, orderData.currency || 'USD')}</td>
                  </tr>
                </table>
              </div>
              
              ${kycSection}
              
              ${qrCodeSection}
              
              ${iosInstructions}
              
              ${androidInstructions}
              
              ${manualInstallSection}
              
              ${troubleshootingSection}
              
              ${displayPrimaryApn ? `
              <div style="background: #fff7ed; border: 2px solid #fed7aa; border-radius: 12px; padding: 25px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 10px 0; color: #c2410c; font-size: 20px;">${(t as any).apnTitle || '📶 APN Settings'}</h3>
                <p style="margin: 0 0 15px 0; color: #9a3412; font-size: 13px; font-style: italic;">${(t as any).apnAutoNote || 'Most eSIMs configure APN automatically. Only use these settings if you experience connection issues.'}</p>
                
                <div style="background: white; border-radius: 8px; padding: 15px; margin-bottom: 12px;">
                  <p style="margin: 0 0 5px 0; color: #c2410c; font-weight: bold; font-size: 14px;">${(t as any).apnPrimary || 'Primary APN:'}</p>
                  <p style="margin: 0; color: #1e293b; font-family: monospace; font-size: 16px; background: #f8fafc; padding: 10px; border-radius: 6px; font-weight: bold;">${displayPrimaryApn}</p>
                </div>

                ${apnData?.alternative_apns && apnData.alternative_apns.length > 0 ? `
                <div style="background: white; border-radius: 8px; padding: 15px; margin-bottom: 12px;">
                  <p style="margin: 0 0 5px 0; color: #c2410c; font-weight: bold; font-size: 14px;">${(t as any).apnAlternatives || 'Alternative APNs:'}</p>
                  <p style="margin: 0; color: #1e293b; font-family: monospace; font-size: 14px; background: #f8fafc; padding: 10px; border-radius: 6px;">${apnData.alternative_apns.join(', ')}</p>
                </div>
                ` : ''}

                ${apnData?.hotspot_apn && apnData.hotspot_apn !== displayPrimaryApn ? `
                <div style="background: white; border-radius: 8px; padding: 15px; margin-bottom: 12px;">
                  <p style="margin: 0 0 5px 0; color: #c2410c; font-weight: bold; font-size: 14px;">${(t as any).apnHotspot || 'Hotspot APN:'}</p>
                  <p style="margin: 0; color: #1e293b; font-family: monospace; font-size: 14px; background: #f8fafc; padding: 10px; border-radius: 6px;">${apnData.hotspot_apn}</p>
                </div>
                ` : ''}

                ${apnData?.apn_username || apnData?.apn_password ? `
                <div style="background: white; border-radius: 8px; padding: 15px; margin-bottom: 12px;">
                  <p style="margin: 0 0 5px 0; color: #c2410c; font-weight: bold; font-size: 14px;">${(t as any).apnCredentials || 'Credentials:'}</p>
                  <p style="margin: 0 0 4px 0; color: #475569; font-size: 13px;">${(t as any).apnUsername || 'Username:'} <span style="font-family: monospace; color: #1e293b;">${apnData.apn_username || ((t as any).apnLeaveBlank || 'leave blank')}</span></p>
                  <p style="margin: 0; color: #475569; font-size: 13px;">${(t as any).apnPassword || 'Password:'} <span style="font-family: monospace; color: #1e293b;">${apnData.apn_password || ((t as any).apnLeaveBlank || 'leave blank')}</span></p>
                </div>
                ` : ''}

                <div style="background: white; border-radius: 8px; padding: 15px;">
                  <p style="margin: 0 0 4px 0; color: #78350f; font-size: 13px;">📱 ${(t as any).apnIosPath || 'iOS: Settings → Cellular → [eSIM] → Cellular Data Network'}</p>
                  <p style="margin: 0; color: #78350f; font-size: 13px;">🤖 ${(t as any).apnAndroidPath || 'Android: Settings → Network & Internet → Access Point Names'}</p>
                </div>
              </div>
              ` : ''}
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://mobile11.com/my-esims/${orderId}" 
                   style="background-color: #f97316; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
                  ${t.viewOrder}
                </a>
                <p style="margin: 12px 0 0 0; color: #9CA3AF; font-size: 13px;">
                  ${t.orVisit} <a href="https://mobile11.com/my-esims/${orderId}" style="color: #f97316; text-decoration: underline;">mobile11.com/my-esims/${orderId}</a>
                </p>
              </div>

              <div style="text-align: center; margin: 0 0 30px 0;">
                <a href="https://esimflow-connect.lovable.app/receipt/${orderId}" 
                   style="background: white; color: #f97316; padding: 12px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 14px; border: 2px solid #f97316;">
                  📄 View Receipt
                </a>
              </div>
              
              <div style="border-top: 1px solid #E5E7EB; padding-top: 20px; text-align: center;">
                <p style="color: #4B5563; font-size: 14px; margin: 0;">
                  ${t.needHelp} 
                  <a href="mailto:support@mobile11.com" style="color: #f97316;">support@mobile11.com</a>
                </p>
                <p style="color: #9CA3AF; font-size: 12px; margin: 10px 0 0 0;">
                  ${t.autoMessage}
                </p>
              </div>
            </div>
          </div>
        </div>
      `,
    });

    if ((emailResponse as any)?.error) {
      console.error('Resend error:', (emailResponse as any).error);
      return new Response(JSON.stringify({ 
        success: false,
        error: (emailResponse as any).error?.message || 'Resend send failed'
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Order confirmation email sent successfully:", emailResponse);

    // Best-effort: send LINE notification if user has line_user_id
    if (orderData.user_id) {
      try {
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('line_user_id, facebook_psid')
          .eq('user_id', orderData.user_id)
          .single();

        if (profile?.line_user_id) {
          console.log('[send-order-confirmation] Triggering LINE notification for order:', orderId);
          await supabaseClient.functions.invoke('send-order-line-notification', {
            body: { orderId, language },
          });
        }

        // Check for Facebook PSID (profile or contacts)
        let hasFacebookPsid = !!profile?.facebook_psid;
        if (!hasFacebookPsid) {
          const { data: contact } = await supabaseClient
            .from('contacts')
            .select('facebook_id')
            .eq('user_id', orderData.user_id)
            .not('facebook_id', 'is', null)
            .limit(1)
            .maybeSingle();
          hasFacebookPsid = !!contact?.facebook_id;
        }

        if (hasFacebookPsid) {
          console.log('[send-order-confirmation] Triggering Facebook notification for order:', orderId);
          await supabaseClient.functions.invoke('send-order-facebook-notification', {
            body: { orderId, language },
          });
        }
      } catch (msgError) {
        console.error('[send-order-confirmation] Messaging notification error (non-fatal):', msgError);
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      messageId: (emailResponse as any).data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-order-confirmation function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
