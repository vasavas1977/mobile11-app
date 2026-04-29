import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ArticleData {
  slug: string;
  category: string;
  title: string;
  titleTh: string;
  description: string;
  descriptionTh: string;
  content: string;
  contentTh: string;
  tableOfContents: { id: string; title: string; titleTh: string }[];
}

function parseTableOfContents(toc: { id: string; title: string; titleTh: string }[], lang: 'en' | 'th') {
  return toc.map(item => ({
    id: item.id,
    title: lang === 'th' ? item.titleTh : item.title
  }));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // ========== ALL COMPREHENSIVE ARTICLES ==========
    const articles: ArticleData[] = [
      // ==================== TROUBLESHOOT ====================
      {
        slug: 'esim-not-activating',
        category: 'troubleshoot',
        title: 'My eSIM is not activating',
        titleTh: 'eSIM ของฉันไม่ทำงาน',
        description: 'Comprehensive troubleshooting when your eSIM won\'t activate',
        descriptionTh: 'วิธีแก้ปัญหาครบวงจรเมื่อ eSIM ไม่ทำงาน',
        tableOfContents: [
          { id: 'check-already-installed', title: 'Check if already installed', titleTh: 'ตรวจสอบว่าติดตั้งแล้วหรือไม่' },
          { id: 'check-connection', title: 'Check internet connection', titleTh: 'ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต' },
          { id: 'manual-installation', title: 'Try manual installation', titleTh: 'ลองติดตั้งด้วยตนเอง' },
          { id: 'restart-device', title: 'Restart your device', titleTh: 'รีสตาร์ทอุปกรณ์' },
          { id: 'update-device', title: 'Update device software', titleTh: 'อัปเดตซอฟต์แวร์อุปกรณ์' },
          { id: 'check-carrier-lock', title: 'Check for carrier lock', titleTh: 'ตรวจสอบการล็อคค่าย' },
          { id: 'disable-vpn', title: 'Disable VPN', titleTh: 'ปิด VPN' },
          { id: 'reset-network', title: 'Reset network settings', titleTh: 'รีเซ็ตการตั้งค่าเครือข่าย' },
          { id: 'contact-support', title: 'Contact support', titleTh: 'ติดต่อฝ่ายสนับสนุน' }
        ],
        content: `## Check if already installed {#check-already-installed}

Before troubleshooting, verify that the eSIM isn't already installed on your device:

**On iPhone:**
1. Go to Settings > Cellular
2. Look for your Mobile11 eSIM in the list of cellular plans
3. If it's there but disabled, simply toggle it on

**On Android:**
1. Go to Settings > Connections > SIM Manager (or SIM Card Manager)
2. Check if the eSIM appears in the list
3. If found, enable it

**Important:** Each QR code can only be used once. If the eSIM shows as installed, you don't need to scan again.

## Check internet connection {#check-connection}

eSIM activation requires a stable internet connection during the scanning process.

**Requirements:**
- Connect to a reliable Wi-Fi network, OR
- Use mobile data from your existing SIM card
- Avoid public Wi-Fi with captive portals (login screens)

**Tips:**
- Move closer to your router for stronger Wi-Fi signal
- If Wi-Fi isn't working, try mobile data or vice versa
- Disable any VPN connections temporarily

## Try manual installation {#manual-installation}

If scanning the QR code fails, you can enter the activation details manually using the SM-DP+ method:

**Find your activation details:**
1. Check your order confirmation email for the SM-DP+ address and activation code
2. Or log into your Mobile11 account and view order details

**On iPhone:**
1. Go to Settings > Cellular > Add eSIM (or Add Cellular Plan)
2. Tap "Use QR Code"
3. Tap "Enter Details Manually" at the bottom
4. Enter the SM-DP+ address (e.g., prod.smdp-plus.rsp.goog)
5. Enter the Activation Code
6. Tap "Next" to install

**On Android:**
1. Go to Settings > Connections > SIM Manager
2. Tap "Add eSIM" or "Add Mobile Plan"
3. Select "Enter activation code manually"
4. Enter the SM-DP+ address and Activation Code
5. Follow the prompts to complete installation

## Restart your device {#restart-device}

A simple restart can resolve many activation issues:

1. Turn off your device completely
2. Wait for 30-60 seconds
3. Turn your device back on
4. Try activating the eSIM again

This refreshes the device's network components and clears temporary glitches.

## Update device software {#update-device}

Outdated software can cause eSIM compatibility issues:

**On iPhone:**
1. Go to Settings > General > Software Update
2. Download and install any available updates
3. Restart your device after updating

**On Android:**
1. Go to Settings > Software Update
2. Check for updates and install if available
3. Restart your device after updating

**Important:** Always back up your device before updating.

## Check for carrier lock {#check-carrier-lock}

Your device must be carrier unlocked to use a Mobile11 eSIM.

**On iPhone:**
1. Go to Settings > General > About
2. Scroll down to "Carrier Lock"
3. It should say "No SIM restrictions" if unlocked

**On Android:**
1. Insert a SIM card from a different carrier
2. If it works, your device is unlocked
3. Or contact your carrier to verify unlock status

**If your device is locked:**
1. Contact your original carrier
2. Request an unlock
3. Once unlocked, try installing the eSIM again

## Disable VPN {#disable-vpn}

VPN connections can interfere with eSIM activation:

1. Turn off any VPN apps before scanning the QR code
2. Disable VPN in device settings if system-wide
3. Complete the eSIM installation
4. You can re-enable VPN after the eSIM is activated

## Reset network settings {#reset-network}

As a last resort, resetting network settings can clear configuration issues:

⚠️ **Warning:** This will erase saved Wi-Fi networks, VPN configurations, and Bluetooth pairings.

**On iPhone:**
1. Go to Settings > General > Transfer or Reset iPhone
2. Tap "Reset"
3. Select "Reset Network Settings"
4. Enter your passcode and confirm

**On Android:**
1. Go to Settings > General Management > Reset
2. Tap "Reset network settings"
3. Confirm the reset

After resetting, reconnect to Wi-Fi and try installing the eSIM again.

## Contact support {#contact-support}

If you've tried all the above steps and your eSIM still won't activate, please contact our support team:

**Include this information:**
- Your order number
- Device model and iOS/Android version
- Screenshots of any error messages
- Steps you've already tried

We typically respond within 24 hours and can issue a replacement eSIM if needed.`,
        contentTh: `## ตรวจสอบว่าติดตั้งแล้วหรือไม่ {#check-already-installed}

ก่อนแก้ปัญหา ตรวจสอบว่า eSIM ไม่ได้ติดตั้งในอุปกรณ์ของคุณแล้ว:

**บน iPhone:**
1. ไปที่ ตั้งค่า > เซลลูลาร์
2. มองหา Mobile11 eSIM ในรายการแผนเซลลูลาร์
3. หากมีอยู่แต่ปิดใช้งาน เพียงเปิดใช้งาน

**บน Android:**
1. ไปที่ ตั้งค่า > การเชื่อมต่อ > ตัวจัดการ SIM
2. ตรวจสอบว่า eSIM ปรากฏในรายการหรือไม่
3. หากพบ เปิดใช้งาน

**สำคัญ:** QR code แต่ละอันใช้ได้เพียงครั้งเดียว หาก eSIM แสดงว่าติดตั้งแล้ว คุณไม่จำเป็นต้องสแกนอีก

## ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต {#check-connection}

การเปิดใช้งาน eSIM ต้องการการเชื่อมต่ออินเทอร์เน็ตที่เสถียรระหว่างกระบวนการสแกน

**ข้อกำหนด:**
- เชื่อมต่อกับเครือข่าย Wi-Fi ที่เสถียร หรือ
- ใช้ข้อมูลมือถือจาก SIM ที่มีอยู่
- หลีกเลี่ยง Wi-Fi สาธารณะที่มีหน้าล็อกอิน

**เคล็ดลับ:**
- ย้ายเข้าใกล้เราเตอร์เพื่อสัญญาณ Wi-Fi ที่แรงขึ้น
- หาก Wi-Fi ไม่ทำงาน ลองใช้ข้อมูลมือถือ
- ปิดการเชื่อมต่อ VPN ชั่วคราว

## ลองติดตั้งด้วยตนเอง {#manual-installation}

หากการสแกน QR code ล้มเหลว คุณสามารถป้อนรายละเอียดการเปิดใช้งานด้วยตนเองโดยใช้วิธี SM-DP+:

**ค้นหารายละเอียดการเปิดใช้งาน:**
1. ตรวจสอบอีเมลยืนยันคำสั่งซื้อสำหรับที่อยู่ SM-DP+ และรหัสเปิดใช้งาน
2. หรือเข้าสู่บัญชี Mobile11 และดูรายละเอียดคำสั่งซื้อ

**บน iPhone:**
1. ไปที่ ตั้งค่า > เซลลูลาร์ > เพิ่ม eSIM
2. แตะ "ใช้ QR Code"
3. แตะ "ป้อนรายละเอียดด้วยตนเอง" ที่ด้านล่าง
4. ป้อนที่อยู่ SM-DP+
5. ป้อนรหัสเปิดใช้งาน
6. แตะ "ถัดไป" เพื่อติดตั้ง

**บน Android:**
1. ไปที่ ตั้งค่า > การเชื่อมต่อ > ตัวจัดการ SIM
2. แตะ "เพิ่ม eSIM" หรือ "เพิ่มแผนมือถือ"
3. เลือก "ป้อนรหัสเปิดใช้งานด้วยตนเอง"
4. ป้อนที่อยู่ SM-DP+ และรหัสเปิดใช้งาน
5. ทำตามคำแนะนำเพื่อเสร็จสิ้นการติดตั้ง

## รีสตาร์ทอุปกรณ์ {#restart-device}

การรีสตาร์ทง่ายๆ สามารถแก้ไขปัญหาการเปิดใช้งานหลายอย่าง:

1. ปิดอุปกรณ์ของคุณโดยสมบูรณ์
2. รอ 30-60 วินาที
3. เปิดอุปกรณ์ของคุณอีกครั้ง
4. ลองเปิดใช้งาน eSIM อีกครั้ง

## อัปเดตซอฟต์แวร์อุปกรณ์ {#update-device}

ซอฟต์แวร์ที่ล้าสมัยอาจทำให้เกิดปัญหาความเข้ากันได้ของ eSIM:

**บน iPhone:**
1. ไปที่ ตั้งค่า > ทั่วไป > อัปเดตซอฟต์แวร์
2. ดาวน์โหลดและติดตั้งการอัปเดตที่มี
3. รีสตาร์ทอุปกรณ์หลังอัปเดต

**บน Android:**
1. ไปที่ ตั้งค่า > อัปเดตซอฟต์แวร์
2. ตรวจสอบการอัปเดตและติดตั้งหากมี
3. รีสตาร์ทอุปกรณ์หลังอัปเดต

## ตรวจสอบการล็อคค่าย {#check-carrier-lock}

อุปกรณ์ของคุณต้องปลดล็อคจากค่ายเพื่อใช้ Mobile11 eSIM

**บน iPhone:**
1. ไปที่ ตั้งค่า > ทั่วไป > เกี่ยวกับ
2. เลื่อนลงไปที่ "Carrier Lock"
3. ควรระบุว่า "No SIM restrictions" หากปลดล็อคแล้ว

**บน Android:**
1. ใส่ SIM card จากค่ายอื่น
2. หากใช้งานได้ อุปกรณ์ของคุณปลดล็อคแล้ว
3. หรือติดต่อค่ายของคุณเพื่อยืนยันสถานะการปลดล็อค

## ปิด VPN {#disable-vpn}

การเชื่อมต่อ VPN อาจรบกวนการเปิดใช้งาน eSIM:

1. ปิดแอป VPN ก่อนสแกน QR code
2. ปิด VPN ในการตั้งค่าอุปกรณ์
3. ดำเนินการติดตั้ง eSIM ให้เสร็จสิ้น
4. คุณสามารถเปิด VPN อีกครั้งหลังจาก eSIM เปิดใช้งานแล้ว

## รีเซ็ตการตั้งค่าเครือข่าย {#reset-network}

เป็นทางเลือกสุดท้าย การรีเซ็ตการตั้งค่าเครือข่ายสามารถล้างปัญหาการกำหนดค่า:

⚠️ **คำเตือน:** การดำเนินการนี้จะลบเครือข่าย Wi-Fi การกำหนดค่า VPN และการจับคู่ Bluetooth

**บน iPhone:**
1. ไปที่ ตั้งค่า > ทั่วไป > โอนหรือรีเซ็ต iPhone
2. แตะ "รีเซ็ต"
3. เลือก "รีเซ็ตการตั้งค่าเครือข่าย"
4. ป้อนรหัสผ่านและยืนยัน

**บน Android:**
1. ไปที่ ตั้งค่า > การจัดการทั่วไป > รีเซ็ต
2. แตะ "รีเซ็ตการตั้งค่าเครือข่าย"
3. ยืนยันการรีเซ็ต

หลังรีเซ็ต เชื่อมต่อ Wi-Fi อีกครั้งและลองติดตั้ง eSIM อีกครั้ง

## ติดต่อฝ่ายสนับสนุน {#contact-support}

หากคุณลองทุกขั้นตอนข้างต้นแล้วและ eSIM ยังไม่ทำงาน กรุณาติดต่อทีมสนับสนุนของเรา:

**รวมข้อมูลเหล่านี้:**
- หมายเลขคำสั่งซื้อของคุณ
- รุ่นอุปกรณ์และเวอร์ชัน iOS/Android
- ภาพหน้าจอของข้อความแสดงข้อผิดพลาด
- ขั้นตอนที่คุณลองแล้ว

เราตอบกลับภายใน 24 ชั่วโมงและสามารถออก eSIM ทดแทนได้หากจำเป็น`
      },
      {
        slug: 'slow-internet-speed',
        category: 'troubleshoot',
        title: 'Why is my eSIM internet so slow?',
        titleTh: 'ทำไมอินเทอร์เน็ต eSIM ของฉันช้า?',
        description: 'Troubleshooting steps to improve your eSIM data speed',
        descriptionTh: 'ขั้นตอนการแก้ปัญหาเพื่อปรับปรุงความเร็วข้อมูล eSIM',
        tableOfContents: [
          { id: 'fix-slow-internet', title: 'How can I fix slow internet speed?', titleTh: 'ฉันจะแก้ไขอินเทอร์เน็ตช้าได้อย่างไร?' },
          { id: 'check-coverage', title: 'Check the coverage area', titleTh: 'ตรวจสอบพื้นที่ครอบคลุม' },
          { id: 'reset-connection', title: 'Reset your mobile connection', titleTh: 'รีเซ็ตการเชื่อมต่อมือถือ' },
          { id: 'restart-device', title: 'Restart your device', titleTh: 'รีสตาร์ทอุปกรณ์' },
          { id: 'manual-network', title: 'Manually select a network', titleTh: 'เลือกเครือข่ายด้วยตนเอง' },
          { id: 'switch-3g', title: 'Switch to 3G (if supported)', titleTh: 'เปลี่ยนเป็น 3G (ถ้ารองรับ)' },
          { id: 'reset-network', title: 'Reset your network', titleTh: 'รีเซ็ตเครือข่าย' },
          { id: 'update-device', title: 'Update your device', titleTh: 'อัพเดทอุปกรณ์' },
          { id: 'device-settings', title: 'What other device settings should I check?', titleTh: 'ฉันควรตรวจสอบการตั้งค่าอื่นใดบ้าง?' },
          { id: 'data-roaming', title: 'Data roaming', titleTh: 'โรมมิ่งข้อมูล' },
          { id: 'apn-settings', title: 'APN (Access Point Name)', titleTh: 'APN (ชื่อจุดเชื่อมต่อ)' }
        ],
        content: `If your eSIM is working but your internet speed feels unusually slow, several factors may be affecting your connection speed:

- **Network congestion** — Many people using the same network at once can slow down speeds
- **Carrier prioritization** — Local carriers may give priority to their own users over roaming users
- **Local signal strength** — Coverage and signal quality vary by location
- **Device configuration** — Outdated software or incorrect settings can impact performance

To improve your connection, try the troubleshooting steps below. Check if the speed improves after each step.

## How can I fix slow internet speed? {#fix-slow-internet}

You can take the following steps to fix slow internet speed. We recommend trying each step and checking if the speed improves before moving to the next.

### Check the coverage area {#check-coverage}

Slow speeds are often related to network coverage in your area.

**What to check:**
- Are you in a rural, remote, or underground area?
- Are you inside a building with thick walls or a basement?
- How many signal bars do you have?

**Solutions:**
- Move to an open area or near a window
- Try a different location within the same building
- Signal strength varies significantly by location — even moving a few meters can help

### Reset your mobile connection {#reset-connection}

A quick network refresh can help establish a better connection:

1. Turn **ON** Airplane Mode
2. Wait **30 seconds**
3. Turn **OFF** Airplane Mode
4. Wait for your connection to re-establish (this may take 1-2 minutes)

This forces your device to disconnect and reconnect to the network, potentially finding a stronger signal.

### Restart your device {#restart-device}

Sometimes a simple restart can resolve connectivity issues:

**On iPhone:**
1. Press and hold the side button and either volume button
2. Slide to power off
3. Wait 30 seconds, then press the side button to turn on

**On Android:**
1. Press and hold the power button
2. Tap "Restart" or "Reboot"
3. Wait for your device to fully restart

After restarting, give your device 1-2 minutes to reconnect to the network.

### Manually select a network {#manual-network}

Automatic network selection may connect you to a congested or slower network. Manually selecting a different network can improve speeds.

**On iPhone:**
1. Go to **Settings > Cellular**
2. Tap your eSIM line
3. Tap **Network Selection**
4. Turn **OFF** "Automatic"
5. Wait for available networks to appear
6. Select a different network from the list

**On Android:**
1. Go to **Settings > Connections > Mobile Networks**
2. Tap **Network Operators**
3. Disable **Select Automatically**
4. Choose a network manually from the list

**Tip:** Try different networks to find the fastest one. Networks with stronger signals (more bars) typically offer better speeds.

### Switch to 3G (if supported) {#switch-3g}

In some areas, 4G/LTE networks may be congested while 3G networks have more available bandwidth.

**On iPhone:**
1. Go to **Settings > Cellular**
2. Tap your eSIM line
3. Tap **Voice & Data**
4. Select **3G** instead of LTE

**On Android:**
1. Go to **Settings > Connections > Mobile Networks**
2. Tap **Network Mode**
3. Select **3G** or **WCDMA only**

**Note:** While 3G is slower in theory, it may actually be faster in congested areas. Switch back to LTE/4G when you move to a different location.

### Reset your network {#reset-network}

If other steps haven't helped, resetting your network settings can resolve deeper configuration issues.

⚠️ **Warning:** This will delete saved Wi-Fi networks, VPN configurations, and Bluetooth pairings.

**On iPhone:**
1. Go to **Settings > General > Transfer or Reset iPhone**
2. Tap **Reset**
3. Select **Reset Network Settings**
4. Enter your passcode and confirm

**On Android:**
1. Go to **Settings > General Management > Reset**
2. Tap **Reset Network Settings**
3. Confirm the reset

After the reset, your device will restart. Give it a few minutes to reconnect to the network.

### Update your device {#update-device}

Outdated software can cause connectivity issues. Make sure your device is running the latest version.

**On iPhone:**
1. Go to **Settings > General > Software Update**
2. If an update is available, tap **Download and Install**

**On Android:**
1. Go to **Settings > Software Update** (or System > System Update)
2. Tap **Check for updates**
3. Install any available updates

## What other device settings should I check? {#device-settings}

If the troubleshooting steps above didn't help, check these additional settings:

### Data roaming {#data-roaming}

**Critical:** Data Roaming must be **ON** for your eSIM to work when traveling internationally.

**On iPhone:**
1. Go to **Settings > Cellular**
2. Tap your eSIM line
3. Toggle **Data Roaming** to **ON**

**On Android:**
1. Go to **Settings > Connections > Mobile Networks**
2. Toggle **Data Roaming** to **ON**

**Note:** Mobile11 eSIMs include roaming in the price — you won't be charged extra fees.

### APN (Access Point Name) {#apn-settings}

Most eSIMs configure APN settings automatically. However, if you're experiencing issues, you may need to verify or manually enter the APN.

**Mobile11 APN Settings:**
- **APN:** mobile11
- **Username:** (leave blank)
- **Password:** (leave blank)

**On iPhone:**
1. Go to **Settings > Cellular**
2. Tap your eSIM line
3. Tap **Cellular Data Network**
4. Enter the APN settings above

**On Android:**
1. Go to **Settings > Connections > Mobile Networks**
2. Tap **Access Point Names**
3. Tap **+** to add a new APN
4. Enter the APN settings and save

## Still having issues? {#contact-support}

If you've tried all the steps above and your internet is still slow, please contact our support team.

**Include this information:**
- Your order number
- Device model and iOS/Android version
- Your current location (country/city)
- Screenshots showing signal strength
- Speed test results (if possible)

We typically respond within a few hours and can help troubleshoot further or issue a replacement eSIM if needed.`,
        contentTh: `หาก eSIM ของคุณใช้งานได้แต่ความเร็วอินเทอร์เน็ตรู้สึกช้าผิดปกติ อาจมีหลายปัจจัยที่ส่งผลต่อความเร็วการเชื่อมต่อ:

- **ความหนาแน่นของเครือข่าย** — ผู้ใช้จำนวนมากใช้เครือข่ายเดียวกันพร้อมกันอาจทำให้ความเร็วช้าลง
- **การให้ความสำคัญของผู้ให้บริการ** — ผู้ให้บริการท้องถิ่นอาจให้ความสำคัญกับผู้ใช้ของตนมากกว่าผู้ใช้โรมมิ่ง
- **ความแรงสัญญาณในพื้นที่** — พื้นที่ครอบคลุมและคุณภาพสัญญาณแตกต่างกันตามสถานที่
- **การตั้งค่าอุปกรณ์** — ซอฟต์แวร์ที่ล้าสมัยหรือการตั้งค่าที่ไม่ถูกต้องอาจส่งผลต่อประสิทธิภาพ

เพื่อปรับปรุงการเชื่อมต่อ ลองทำตามขั้นตอนการแก้ปัญหาด้านล่าง ตรวจสอบว่าความเร็วดีขึ้นหลังจากแต่ละขั้นตอน

## ฉันจะแก้ไขอินเทอร์เน็ตช้าได้อย่างไร? {#fix-slow-internet}

คุณสามารถทำตามขั้นตอนต่อไปนี้เพื่อแก้ไขอินเทอร์เน็ตช้า เราแนะนำให้ลองแต่ละขั้นตอนและตรวจสอบว่าความเร็วดีขึ้นก่อนที่จะไปขั้นตอนถัดไป

### ตรวจสอบพื้นที่ครอบคลุม {#check-coverage}

ความเร็วที่ช้ามักเกี่ยวข้องกับพื้นที่ครอบคลุมเครือข่ายในพื้นที่ของคุณ

**สิ่งที่ต้องตรวจสอบ:**
- คุณอยู่ในพื้นที่ชนบท ห่างไกล หรือใต้ดินหรือไม่?
- คุณอยู่ในอาคารที่มีผนังหนาหรือชั้นใต้ดินหรือไม่?
- คุณมีสัญญาณกี่ขีด?

**วิธีแก้ไข:**
- ย้ายไปที่โล่งหรือใกล้หน้าต่าง
- ลองสถานที่อื่นภายในอาคารเดียวกัน
- ความแรงของสัญญาณแตกต่างกันมากตามสถานที่ — แม้แต่เคลื่อนที่ไม่กี่เมตรก็ช่วยได้

### รีเซ็ตการเชื่อมต่อมือถือ {#reset-connection}

การรีเฟรชเครือข่ายอย่างรวดเร็วช่วยสร้างการเชื่อมต่อที่ดีขึ้น:

1. เปิด **โหมดเครื่องบิน**
2. รอ **30 วินาที**
3. ปิด **โหมดเครื่องบิน**
4. รอให้การเชื่อมต่อกลับมา (อาจใช้เวลา 1-2 นาที)

วิธีนี้บังคับให้อุปกรณ์ของคุณตัดการเชื่อมต่อและเชื่อมต่อกับเครือข่ายใหม่ อาจพบสัญญาณที่แรงกว่า

### รีสตาร์ทอุปกรณ์ {#restart-device}

บางครั้งการรีสตาร์ทง่ายๆ สามารถแก้ไขปัญหาการเชื่อมต่อได้:

**บน iPhone:**
1. กดปุ่มด้านข้างและปุ่มเพิ่มหรือลดเสียงค้างไว้
2. เลื่อนเพื่อปิดเครื่อง
3. รอ 30 วินาที แล้วกดปุ่มด้านข้างเพื่อเปิดเครื่อง

**บน Android:**
1. กดปุ่มเปิดปิดค้างไว้
2. แตะ "รีสตาร์ท" หรือ "รีบูต"
3. รอให้อุปกรณ์รีสตาร์ทเสร็จสมบูรณ์

หลังรีสตาร์ท ให้อุปกรณ์ 1-2 นาทีเพื่อเชื่อมต่อกับเครือข่ายใหม่

### เลือกเครือข่ายด้วยตนเอง {#manual-network}

การเลือกเครือข่ายอัตโนมัติอาจเชื่อมต่อคุณกับเครือข่ายที่หนาแน่นหรือช้ากว่า การเลือกเครือข่ายอื่นด้วยตนเองอาจช่วยปรับปรุงความเร็ว

**บน iPhone:**
1. ไปที่ **ตั้งค่า > เซลลูลาร์**
2. แตะสาย eSIM ของคุณ
3. แตะ **การเลือกเครือข่าย**
4. ปิด "อัตโนมัติ"
5. รอให้เครือข่ายที่พร้อมใช้งานปรากฏ
6. เลือกเครือข่ายอื่นจากรายการ

**บน Android:**
1. ไปที่ **ตั้งค่า > การเชื่อมต่อ > เครือข่ายมือถือ**
2. แตะ **ผู้ให้บริการเครือข่าย**
3. ปิด **เลือกอัตโนมัติ**
4. เลือกเครือข่ายด้วยตนเองจากรายการ

**เคล็ดลับ:** ลองเครือข่ายต่างๆ เพื่อหาเครือข่ายที่เร็วที่สุด เครือข่ายที่มีสัญญาณแรงกว่า (ขีดมากกว่า) มักมีความเร็วดีกว่า

### เปลี่ยนเป็น 3G (ถ้ารองรับ) {#switch-3g}

ในบางพื้นที่ เครือข่าย 4G/LTE อาจหนาแน่นในขณะที่เครือข่าย 3G มีแบนด์วิดท์ว่างมากกว่า

**บน iPhone:**
1. ไปที่ **ตั้งค่า > เซลลูลาร์**
2. แตะสาย eSIM ของคุณ
3. แตะ **เสียงและข้อมูล**
4. เลือก **3G** แทน LTE

**บน Android:**
1. ไปที่ **ตั้งค่า > การเชื่อมต่อ > เครือข่ายมือถือ**
2. แตะ **โหมดเครือข่าย**
3. เลือก **3G** หรือ **WCDMA only**

**หมายเหตุ:** แม้ 3G จะช้ากว่าในทางทฤษฎี แต่อาจเร็วกว่าในพื้นที่ที่หนาแน่น เปลี่ยนกลับเป็น LTE/4G เมื่อย้ายไปสถานที่อื่น

### รีเซ็ตเครือข่าย {#reset-network}

หากขั้นตอนอื่นไม่ช่วย การรีเซ็ตการตั้งค่าเครือข่ายสามารถแก้ไขปัญหาการกำหนดค่าที่ลึกกว่าได้

⚠️ **คำเตือน:** การดำเนินการนี้จะลบเครือข่าย Wi-Fi ที่บันทึกไว้ การกำหนดค่า VPN และการจับคู่ Bluetooth

**บน iPhone:**
1. ไปที่ **ตั้งค่า > ทั่วไป > โอนหรือรีเซ็ต iPhone**
2. แตะ **รีเซ็ต**
3. เลือก **รีเซ็ตการตั้งค่าเครือข่าย**
4. ป้อนรหัสผ่านและยืนยัน

**บน Android:**
1. ไปที่ **ตั้งค่า > การจัดการทั่วไป > รีเซ็ต**
2. แตะ **รีเซ็ตการตั้งค่าเครือข่าย**
3. ยืนยันการรีเซ็ต

หลังรีเซ็ต อุปกรณ์จะรีสตาร์ท ให้เวลาไม่กี่นาทีเพื่อเชื่อมต่อกับเครือข่ายใหม่

### อัพเดทอุปกรณ์ {#update-device}

ซอฟต์แวร์ที่ล้าสมัยอาจทำให้เกิดปัญหาการเชื่อมต่อ ตรวจสอบให้แน่ใจว่าอุปกรณ์ของคุณใช้เวอร์ชันล่าสุด

**บน iPhone:**
1. ไปที่ **ตั้งค่า > ทั่วไป > อัพเดทซอฟต์แวร์**
2. หากมีอัพเดท แตะ **ดาวน์โหลดและติดตั้ง**

**บน Android:**
1. ไปที่ **ตั้งค่า > อัพเดทซอฟต์แวร์** (หรือ ระบบ > อัพเดทระบบ)
2. แตะ **ตรวจสอบอัพเดท**
3. ติดตั้งอัพเดทที่มี

## ฉันควรตรวจสอบการตั้งค่าอื่นใดบ้าง? {#device-settings}

หากขั้นตอนการแก้ปัญหาข้างต้นไม่ช่วย ให้ตรวจสอบการตั้งค่าเพิ่มเติมเหล่านี้:

### โรมมิ่งข้อมูล {#data-roaming}

**สำคัญ:** ต้องเปิด **โรมมิ่งข้อมูล** เพื่อให้ eSIM ใช้งานได้เมื่อเดินทางต่างประเทศ

**บน iPhone:**
1. ไปที่ **ตั้งค่า > เซลลูลาร์**
2. แตะสาย eSIM ของคุณ
3. เปิด **โรมมิ่งข้อมูล**

**บน Android:**
1. ไปที่ **ตั้งค่า > การเชื่อมต่อ > เครือข่ายมือถือ**
2. เปิด **โรมมิ่งข้อมูล**

**หมายเหตุ:** eSIM Mobile11 รวมโรมมิ่งในราคาแล้ว — คุณไม่ต้องจ่ายค่าธรรมเนียมเพิ่ม

### APN (ชื่อจุดเชื่อมต่อ) {#apn-settings}

eSIM ส่วนใหญ่กำหนดค่า APN โดยอัตโนมัติ อย่างไรก็ตาม หากคุณประสบปัญหา คุณอาจต้องตรวจสอบหรือป้อน APN ด้วยตนเอง

**การตั้งค่า APN ของ Mobile11:**
- **APN:** mobile11
- **ชื่อผู้ใช้:** (เว้นว่าง)
- **รหัสผ่าน:** (เว้นว่าง)

**บน iPhone:**
1. ไปที่ **ตั้งค่า > เซลลูลาร์**
2. แตะสาย eSIM ของคุณ
3. แตะ **เครือข่ายข้อมูลเซลลูลาร์**
4. ป้อนการตั้งค่า APN ด้านบน

**บน Android:**
1. ไปที่ **ตั้งค่า > การเชื่อมต่อ > เครือข่ายมือถือ**
2. แตะ **ชื่อจุดเชื่อมต่อ**
3. แตะ **+** เพื่อเพิ่ม APN ใหม่
4. ป้อนการตั้งค่า APN และบันทึก

## ยังมีปัญหาอยู่? {#contact-support}

หากคุณลองทุกขั้นตอนข้างต้นแล้วและอินเทอร์เน็ตยังช้า กรุณาติดต่อทีมสนับสนุนของเรา

**รวมข้อมูลเหล่านี้:**
- หมายเลขคำสั่งซื้อของคุณ
- รุ่นอุปกรณ์และเวอร์ชัน iOS/Android
- ตำแหน่งปัจจุบัน (ประเทศ/เมือง)
- ภาพหน้าจอแสดงความแรงสัญญาณ
- ผลทดสอบความเร็ว (ถ้าเป็นไปได้)

เราตอบกลับภายในไม่กี่ชั่วโมงและสามารถช่วยแก้ปัญหาเพิ่มเติมหรือออก eSIM ทดแทนได้หากจำเป็น`
      },
      {
        slug: 'no-signal-esim',
        category: 'troubleshoot',
        title: 'My eSIM has no signal',
        titleTh: 'eSIM ของฉันไม่มีสัญญาณ',
        description: 'Troubleshooting when your eSIM shows no service',
        descriptionTh: 'การแก้ปัญหาเมื่อ eSIM แสดงว่าไม่มีบริการ',
        tableOfContents: [
          { id: 'verify-esim-enabled', title: 'Verify eSIM is enabled', titleTh: 'ตรวจสอบว่า eSIM เปิดอยู่' },
          { id: 'check-data-roaming', title: 'Check data roaming', titleTh: 'ตรวจสอบโรมมิ่งข้อมูล' },
          { id: 'network-selection', title: 'Try manual network selection', titleTh: 'ลองเลือกเครือข่ายด้วยตนเอง' },
          { id: 'restart-device', title: 'Restart device', titleTh: 'รีสตาร์ทอุปกรณ์' }
        ],
        content: `## Verify eSIM is enabled {#verify-esim-enabled}

First, make sure your eSIM line is turned on:

**On iPhone:**
1. Go to Settings > Cellular
2. Find your Mobile11 eSIM
3. Ensure "Turn On This Line" is enabled
4. Make sure eSIM is selected for "Cellular Data"

**On Android:**
1. Go to Settings > Connections > SIM Manager
2. Find your eSIM
3. Ensure it's toggled ON
4. Set eSIM as "Mobile Data"

## Check data roaming {#check-data-roaming}

Data roaming MUST be enabled for international eSIMs:

**On iPhone:**
1. Settings > Cellular > [Your eSIM]
2. Toggle "Data Roaming" ON

**On Android:**
1. Settings > Connections > Mobile Networks
2. Toggle "Data Roaming" ON

**Important:** You won't be charged extra - roaming is included in your Mobile11 plan.

## Try manual network selection {#network-selection}

Automatic network selection may fail to find a compatible network:

1. Go to network settings
2. Disable "Automatic" network selection
3. Wait for the network list to appear
4. Select a network from the supported operators list
5. If one doesn't work, try another

Check your order confirmation email for supported networks.

## Restart device {#restart-device}

A simple restart often fixes signal issues:

1. Turn off your device completely
2. Wait 30-60 seconds
3. Turn it back on
4. Check for signal

If still no signal after trying all steps, contact our support team.`,
        contentTh: `## ตรวจสอบว่า eSIM เปิดอยู่ {#verify-esim-enabled}

ก่อนอื่น ตรวจสอบให้แน่ใจว่าสาย eSIM ของคุณเปิดอยู่:

**บน iPhone:**
1. ไปที่ ตั้งค่า > เซลลูลาร์
2. ค้นหา Mobile11 eSIM
3. ตรวจสอบว่า "เปิดใช้งานสายนี้" เปิดอยู่
4. ตรวจสอบว่าเลือก eSIM สำหรับ "ข้อมูลเซลลูลาร์"

**บน Android:**
1. ไปที่ ตั้งค่า > การเชื่อมต่อ > ตัวจัดการ SIM
2. ค้นหา eSIM ของคุณ
3. ตรวจสอบว่าเปิดอยู่
4. ตั้ง eSIM เป็น "ข้อมูลมือถือ"

## ตรวจสอบโรมมิ่งข้อมูล {#check-data-roaming}

ต้องเปิดโรมมิ่งข้อมูลสำหรับ eSIM ต่างประเทศ:

**บน iPhone:**
1. ตั้งค่า > เซลลูลาร์ > [eSIM ของคุณ]
2. เปิด "โรมมิ่งข้อมูล"

**บน Android:**
1. ตั้งค่า > การเชื่อมต่อ > เครือข่ายมือถือ
2. เปิด "โรมมิ่งข้อมูล"

**สำคัญ:** คุณไม่ต้องจ่ายเพิ่ม - โรมมิ่งรวมอยู่ในแพ็คเกจ Mobile11 ของคุณ

## ลองเลือกเครือข่ายด้วยตนเอง {#network-selection}

การเลือกเครือข่ายอัตโนมัติอาจไม่พบเครือข่ายที่รองรับ:

1. ไปที่การตั้งค่าเครือข่าย
2. ปิด "อัตโนมัติ"
3. รอให้รายการเครือข่ายปรากฏ
4. เลือกเครือข่ายจากรายการผู้ให้บริการที่รองรับ
5. หากอันหนึ่งไม่ทำงาน ลองอันอื่น

ตรวจสอบอีเมลยืนยันคำสั่งซื้อสำหรับเครือข่ายที่รองรับ

## รีสตาร์ทอุปกรณ์ {#restart-device}

การรีสตาร์ทง่ายๆ มักแก้ปัญหาสัญญาณได้:

1. ปิดอุปกรณ์ของคุณโดยสมบูรณ์
2. รอ 30-60 วินาที
3. เปิดอีกครั้ง
4. ตรวจสอบสัญญาณ

หากยังไม่มีสัญญาณหลังลองทุกขั้นตอน ติดต่อทีมสนับสนุนของเรา`
      },
      {
        slug: 'access-internet-google-pixel',
        category: 'troubleshoot',
        title: 'How do I access the internet on a Google Pixel device?',
        titleTh: 'วิธีเข้าถึงอินเทอร์เน็ตบน Google Pixel',
        description: 'Step-by-step guide to enable internet on Google Pixel after eSIM installation',
        descriptionTh: 'คู่มือขั้นตอนการเปิดใช้อินเทอร์เน็ตบน Google Pixel หลังติดตั้ง eSIM',
        tableOfContents: [
          { id: 'enable-esim', title: 'Enable your eSIM line', titleTh: 'เปิดใช้งานสาย eSIM' },
          { id: 'connect-network', title: 'Connect to the network', titleTh: 'เชื่อมต่อเครือข่าย' },
          { id: 'apn-settings', title: 'Update APN settings', titleTh: 'อัปเดตการตั้งค่า APN' },
          { id: 'data-roaming', title: 'Enable Data Roaming', titleTh: 'เปิดโรมมิ่งข้อมูล' }
        ],
        content: `## Enable your eSIM line {#enable-esim}

1. Go to **Settings**
2. Go to **Network & internet**
3. Tap **SIMs**
4. Ensure that the eSIM is enabled. If not, toggle it **ON**
5. Toggle ON **Mobile data**

## Connect to the supported network {#connect-network}

1. Go to **Settings**
2. Go to **Network & internet**
3. Tap **SIMs**
4. Tap your **eSIM**
5. Disable **Automatically select network**
6. Select the network specified in your eSIM's installation instructions

## Update APN settings (if necessary) {#apn-settings}

Most eSIMs configure APN automatically. If you need to set it manually:

1. Go to **Settings**
2. Go to **Network & internet**
3. Tap **SIMs**
4. Tap your **eSIM**
5. Tap **Access Point Names**
6. Tap the **+** icon
7. Enter the new **APN** in the APN field (check your installation email)
8. Enter **Mobile11** as the APN's label in the Name field
9. Leave other fields blank
10. Tap the **three-dot menu** > **Save**
11. Ensure the added APN is selected

## Enable Data Roaming (if necessary) {#data-roaming}

**Important:** Data Roaming MUST be enabled for your eSIM to work abroad.

1. Go to **Settings**
2. Go to **Network & internet**
3. Tap **SIMs**
4. Tap your **eSIM**
5. Toggle **Roaming** ON

After following these steps, your eSIM should successfully connect to the internet.`,
        contentTh: `## เปิดใช้งานสาย eSIM {#enable-esim}

1. ไปที่ **Settings**
2. ไปที่ **Network & internet**
3. แตะ **SIMs**
4. ตรวจสอบว่า eSIM เปิดอยู่ ถ้าไม่ให้เปิด
5. เปิด **Mobile data**

## เชื่อมต่อเครือข่ายที่รองรับ {#connect-network}

1. ไปที่ **Settings**
2. ไปที่ **Network & internet**
3. แตะ **SIMs**
4. แตะ **eSIM** ของคุณ
5. ปิด **Automatically select network**
6. เลือกเครือข่ายตามคำแนะนำการติดตั้ง eSIM

## อัปเดตการตั้งค่า APN (ถ้าจำเป็น) {#apn-settings}

eSIM ส่วนใหญ่ตั้งค่า APN อัตโนมัติ หากต้องตั้งค่าเอง:

1. ไปที่ **Settings**
2. ไปที่ **Network & internet**
3. แตะ **SIMs**
4. แตะ **eSIM** ของคุณ
5. แตะ **Access Point Names**
6. แตะไอคอน **+**
7. ใส่ **APN** ใหม่ในช่อง APN (ดูจากอีเมลการติดตั้ง)
8. ใส่ **Mobile11** เป็นชื่อ APN
9. เว้นช่องอื่นว่างไว้
10. แตะ **เมนู 3 จุด** > **Save**
11. ตรวจสอบว่าเลือก APN ที่เพิ่มแล้ว

## เปิดโรมมิ่งข้อมูล (ถ้าจำเป็น) {#data-roaming}

**สำคัญ:** ต้องเปิดโรมมิ่งข้อมูลเพื่อให้ eSIM ใช้งานได้ในต่างประเทศ

1. ไปที่ **Settings**
2. ไปที่ **Network & internet**
3. แตะ **SIMs**
4. แตะ **eSIM** ของคุณ
5. เปิด **Roaming**

หลังทำตามขั้นตอนเหล่านี้ eSIM ของคุณควรเชื่อมต่ออินเทอร์เน็ตสำเร็จ`
      },
      {
        slug: 'access-internet-samsung-galaxy',
        category: 'troubleshoot',
        title: 'How do I access the internet on a Samsung Galaxy device?',
        titleTh: 'วิธีเข้าถึงอินเทอร์เน็ตบน Samsung Galaxy',
        description: 'Step-by-step guide to enable internet on Samsung Galaxy after eSIM installation',
        descriptionTh: 'คู่มือขั้นตอนการเปิดใช้อินเทอร์เน็ตบน Samsung Galaxy หลังติดตั้ง eSIM',
        tableOfContents: [
          { id: 'enable-esim', title: 'Enable your eSIM line', titleTh: 'เปิดใช้งานสาย eSIM' },
          { id: 'connect-network', title: 'Connect to the network', titleTh: 'เชื่อมต่อเครือข่าย' },
          { id: 'apn-settings', title: 'Update APN settings', titleTh: 'อัปเดตการตั้งค่า APN' },
          { id: 'data-roaming', title: 'Enable Data Roaming', titleTh: 'เปิดโรมมิ่งข้อมูล' }
        ],
        content: `## Enable your eSIM line {#enable-esim}

1. Go to **Settings**
2. Go to **Connections**
3. Tap **SIM manager** (or SIM card manager)
4. Ensure that your eSIM is enabled. If not, toggle it **ON**
5. Tap **Mobile data** and select your **eSIM**

## Connect to the supported network {#connect-network}

1. Go to **Settings**
2. Go to **Connections**
3. Tap **Mobile networks**
4. Tap **Network operators**
5. Disable **Select automatically**
6. Select the network specified in your eSIM's installation instructions

## Update APN settings (if necessary) {#apn-settings}

1. Go to **Settings**
2. Go to **Connections**
3. Tap **Mobile networks**
4. Tap **Access Point Names**
5. Tap **Add** or the **+** icon
6. Enter the new **APN** in the APN field
7. Enter **Mobile11** as the Name
8. Leave other fields blank
9. Tap **Save** (three-dot menu)
10. Select the new APN

## Enable Data Roaming (if necessary) {#data-roaming}

**Important:** Data Roaming is required for international eSIM use.

1. Go to **Settings**
2. Go to **Connections**
3. Tap **Mobile networks**
4. Toggle **Data roaming** ON

Your Samsung Galaxy should now connect to the internet using your eSIM.`,
        contentTh: `## เปิดใช้งานสาย eSIM {#enable-esim}

1. ไปที่ **Settings**
2. ไปที่ **Connections**
3. แตะ **SIM manager** (หรือ SIM card manager)
4. ตรวจสอบว่า eSIM เปิดอยู่ ถ้าไม่ให้เปิด
5. แตะ **Mobile data** และเลือก **eSIM** ของคุณ

## เชื่อมต่อเครือข่ายที่รองรับ {#connect-network}

1. ไปที่ **Settings**
2. ไปที่ **Connections**
3. แตะ **Mobile networks**
4. แตะ **Network operators**
5. ปิด **Select automatically**
6. เลือกเครือข่ายตามคำแนะนำการติดตั้ง eSIM

## อัปเดตการตั้งค่า APN (ถ้าจำเป็น) {#apn-settings}

1. ไปที่ **Settings**
2. ไปที่ **Connections**
3. แตะ **Mobile networks**
4. แตะ **Access Point Names**
5. แตะ **Add** หรือไอคอน **+**
6. ใส่ **APN** ใหม่ในช่อง APN
7. ใส่ **Mobile11** เป็นชื่อ
8. เว้นช่องอื่นว่างไว้
9. แตะ **Save** (เมนู 3 จุด)
10. เลือก APN ใหม่

## เปิดโรมมิ่งข้อมูล (ถ้าจำเป็น) {#data-roaming}

**สำคัญ:** ต้องเปิดโรมมิ่งข้อมูลสำหรับการใช้ eSIM ในต่างประเทศ

1. ไปที่ **Settings**
2. ไปที่ **Connections**
3. แตะ **Mobile networks**
4. เปิด **Data roaming**

Samsung Galaxy ของคุณควรเชื่อมต่ออินเทอร์เน็ตผ่าน eSIM ได้แล้ว`
      },
      {
        slug: 'access-internet-ios',
        category: 'troubleshoot',
        title: 'How do I access the internet on an iPhone (iOS)?',
        titleTh: 'วิธีเข้าถึงอินเทอร์เน็ตบน iPhone (iOS)',
        description: 'Step-by-step guide to enable internet on iPhone after eSIM installation',
        descriptionTh: 'คู่มือขั้นตอนการเปิดใช้อินเทอร์เน็ตบน iPhone หลังติดตั้ง eSIM',
        tableOfContents: [
          { id: 'enable-esim', title: 'Enable your eSIM for data', titleTh: 'เปิดใช้งาน eSIM สำหรับข้อมูล' },
          { id: 'connect-network', title: 'Connect to the network', titleTh: 'เชื่อมต่อเครือข่าย' },
          { id: 'apn-settings', title: 'Update APN settings', titleTh: 'อัปเดตการตั้งค่า APN' },
          { id: 'data-roaming', title: 'Enable Data Roaming', titleTh: 'เปิดโรมมิ่งข้อมูล' }
        ],
        content: `## Enable your eSIM for data {#enable-esim}

1. Go to **Settings**
2. Tap **Cellular** (or Mobile Data)
3. Tap **Cellular Data** (or Mobile Data)
4. Select your **Mobile11 eSIM** as the data line
5. Return to Cellular settings and ensure your eSIM line is **ON**

## Connect to the supported network {#connect-network}

1. Go to **Settings**
2. Tap **Cellular** (or Mobile Data)
3. Tap your **eSIM** line
4. Tap **Network Selection**
5. Turn OFF **Automatic**
6. Select the network specified in your eSIM's installation instructions

## Update APN settings (if necessary) {#apn-settings}

1. Go to **Settings**
2. Tap **Cellular** (or Mobile Data)
3. Tap your **eSIM** line
4. Tap **Cellular Data Network** (or Mobile Data Network)
5. In the **Cellular Data** section, enter the APN from your installation email
6. Leave other fields blank unless specified

## Enable Data Roaming (if necessary) {#data-roaming}

**Critical:** Data Roaming MUST be ON for your eSIM to work in another country.

1. Go to **Settings**
2. Tap **Cellular** (or Mobile Data)
3. Tap your **eSIM** line
4. Toggle **Data Roaming** ON

**Note:** You will not be charged extra roaming fees by Mobile11. The roaming is included in your plan.

Your iPhone should now connect to the internet using your eSIM.`,
        contentTh: `## เปิดใช้งาน eSIM สำหรับข้อมูล {#enable-esim}

1. ไปที่ **Settings**
2. แตะ **Cellular** (หรือ Mobile Data)
3. แตะ **Cellular Data** (หรือ Mobile Data)
4. เลือก **Mobile11 eSIM** เป็นสายข้อมูล
5. กลับไปที่ Cellular และตรวจสอบว่าสาย eSIM **เปิด** อยู่

## เชื่อมต่อเครือข่ายที่รองรับ {#connect-network}

1. ไปที่ **Settings**
2. แตะ **Cellular** (หรือ Mobile Data)
3. แตะสาย **eSIM** ของคุณ
4. แตะ **Network Selection**
5. ปิด **Automatic**
6. เลือกเครือข่ายตามคำแนะนำการติดตั้ง eSIM

## อัปเดตการตั้งค่า APN (ถ้าจำเป็น) {#apn-settings}

1. ไปที่ **Settings**
2. แตะ **Cellular** (หรือ Mobile Data)
3. แตะสาย **eSIM** ของคุณ
4. แตะ **Cellular Data Network** (หรือ Mobile Data Network)
5. ในส่วน **Cellular Data** ใส่ APN จากอีเมลการติดตั้ง
6. เว้นช่องอื่นว่างไว้ ยกเว้นมีระบุ

## เปิดโรมมิ่งข้อมูล (ถ้าจำเป็น) {#data-roaming}

**สำคัญมาก:** ต้องเปิดโรมมิ่งข้อมูลเพื่อให้ eSIM ใช้งานได้ในต่างประเทศ

1. ไปที่ **Settings**
2. แตะ **Cellular** (หรือ Mobile Data)
3. แตะสาย **eSIM** ของคุณ
4. เปิด **Data Roaming**

**หมายเหตุ:** คุณจะไม่ถูกเรียกเก็บค่าโรมมิ่งเพิ่มจาก Mobile11 โรมมิ่งรวมอยู่ในแพ็กเกจแล้ว

iPhone ของคุณควรเชื่อมต่ออินเทอร์เน็ตผ่าน eSIM ได้แล้ว`
      },
      {
        slug: 'esim-stuck-activating',
        category: 'troubleshoot',
        title: 'eSIM Stuck at Activating',
        titleTh: 'eSIM ค้างอยู่ที่กำลังเปิดใช้งาน',
        description: 'What to do when your eSIM is stuck in activating status',
        descriptionTh: 'จะทำอย่างไรเมื่อ eSIM ค้างอยู่ในสถานะกำลังเปิดใช้งาน',
        tableOfContents: [
          { id: 'understand-status', title: 'Understanding activating status', titleTh: 'ทำความเข้าใจสถานะ' },
          { id: 'troubleshoot-steps', title: 'Troubleshooting steps', titleTh: 'ขั้นตอนการแก้ไขปัญหา' },
          { id: 'contact-support', title: 'When to contact support', titleTh: 'เมื่อใดควรติดต่อฝ่ายสนับสนุน' }
        ],
        content: `## Understanding activating status {#understand-status}

When your eSIM shows "Activating" status, it means the eSIM profile is being downloaded and configured on your device. This process typically takes 1-5 minutes.

**Normal activation process:**
1. QR code scanned → Profile downloading
2. Profile downloaded → Configuring
3. Configuration complete → Ready to use

If stuck for more than 10 minutes, there may be an issue.

## Troubleshooting steps {#troubleshoot-steps}

**Step 1: Check your internet connection**
- Ensure stable Wi-Fi or mobile data
- Try switching between Wi-Fi and mobile data

**Step 2: Restart your device**
1. Turn off your device completely
2. Wait 30 seconds
3. Turn it back on
4. Check eSIM status in Settings > Cellular

**Step 3: Check cellular settings**
- On iPhone: Settings > Cellular > [Your eSIM]
- On Android: Settings > Connections > SIM Manager

**Step 4: Remove and reinstall (if possible)**
- Some carriers allow re-download
- Check if QR code can be used again

## When to contact support {#contact-support}

Contact our support team if:
- eSIM stuck for more than 30 minutes
- You've tried all troubleshooting steps
- Error messages appear during activation

Include in your message:
- Order number
- Device model
- Screenshot of the error
- Steps you've already tried`,
        contentTh: `## ทำความเข้าใจสถานะกำลังเปิดใช้งาน {#understand-status}

เมื่อ eSIM ของคุณแสดงสถานะ "กำลังเปิดใช้งาน" หมายความว่าโปรไฟล์ eSIM กำลังดาวน์โหลดและกำหนดค่าบนอุปกรณ์ของคุณ กระบวนการนี้โดยปกติใช้เวลา 1-5 นาที

**กระบวนการเปิดใช้งานปกติ:**
1. สแกน QR code → กำลังดาวน์โหลดโปรไฟล์
2. ดาวน์โหลดโปรไฟล์แล้ว → กำลังกำหนดค่า
3. กำหนดค่าเสร็จสิ้น → พร้อมใช้งาน

หากค้างนานกว่า 10 นาที อาจมีปัญหา

## ขั้นตอนการแก้ไขปัญหา {#troubleshoot-steps}

**ขั้นตอนที่ 1: ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต**
- ตรวจสอบให้มี Wi-Fi หรือข้อมูลมือถือที่เสถียร
- ลองสลับระหว่าง Wi-Fi และข้อมูลมือถือ

**ขั้นตอนที่ 2: รีสตาร์ทอุปกรณ์**
1. ปิดอุปกรณ์โดยสมบูรณ์
2. รอ 30 วินาที
3. เปิดอีกครั้ง
4. ตรวจสอบสถานะ eSIM ใน ตั้งค่า > เซลลูลาร์

**ขั้นตอนที่ 3: ตรวจสอบการตั้งค่าเซลลูลาร์**
- บน iPhone: ตั้งค่า > เซลลูลาร์ > [eSIM ของคุณ]
- บน Android: ตั้งค่า > การเชื่อมต่อ > ตัวจัดการ SIM

**ขั้นตอนที่ 4: ลบและติดตั้งใหม่ (หากเป็นไปได้)**
- ผู้ให้บริการบางรายอนุญาตให้ดาวน์โหลดซ้ำ
- ตรวจสอบว่า QR code สามารถใช้ได้อีกหรือไม่

## เมื่อใดควรติดต่อฝ่ายสนับสนุน {#contact-support}

ติดต่อทีมสนับสนุนของเราหาก:
- eSIM ค้างนานกว่า 30 นาที
- คุณได้ลองขั้นตอนการแก้ไขปัญหาทั้งหมดแล้ว
- ข้อความแสดงข้อผิดพลาดปรากฏระหว่างการเปิดใช้งาน

ระบุในข้อความของคุณ:
- หมายเลขคำสั่งซื้อ
- รุ่นอุปกรณ์
- ภาพหน้าจอของข้อผิดพลาด
- ขั้นตอนที่คุณได้ลองแล้ว`
      },
      {
        slug: 'cellular-plans-cannot-be-added',
        category: 'troubleshoot',
        title: '"Cellular Plans Cannot Be Added" Error',
        titleTh: 'ข้อผิดพลาด "ไม่สามารถเพิ่มแผนเซลลูลาร์"',
        description: 'How to fix the carrier lock error when installing eSIM',
        descriptionTh: 'วิธีแก้ไขข้อผิดพลาดเครื่องถูกล็อคเมื่อติดตั้ง eSIM',
        tableOfContents: [
          { id: 'what-means', title: 'What this error means', titleTh: 'ข้อผิดพลาดนี้หมายถึงอะไร' },
          { id: 'check-lock', title: 'Check carrier lock status', titleTh: 'ตรวจสอบสถานะการล็อคค่าย' },
          { id: 'unlock', title: 'How to unlock your device', titleTh: 'วิธีปลดล็อคอุปกรณ์' }
        ],
        content: `## What does this error mean? {#what-means}

If you see **"Cellular Plans From This Carrier Cannot Be Added to Your iPhone"**, it means your device is **carrier-locked**.

A carrier-locked device can only use SIM cards (including eSIM) from the original carrier it was purchased from.

## How to check carrier lock status {#check-lock}

**On iPhone:**
1. Go to **Settings**
2. Tap **General**
3. Tap **About**
4. Scroll down to **Carrier Lock**
5. If it says **"No SIM restrictions"** → Your phone is unlocked ✓
6. If it shows a carrier name → Your phone is locked ✗

**On Android:**
1. Go to **Settings**
2. Go to **About phone**
3. Look for **SIM lock** or **Network lock** status

## How to unlock your device {#unlock}

If your device is carrier-locked:

1. **Contact your carrier** (the one that sold you the phone)
2. Request a **device unlock**
3. They may require:
   - The device to be fully paid off
   - Your account in good standing
   - A waiting period (often 60-90 days after purchase)
4. Once unlocked, restart your device
5. Try installing the eSIM again

**Note:** Mobile11 cannot unlock your device. Only your original carrier can do this.`,
        contentTh: `## ข้อผิดพลาดนี้หมายความว่าอะไร? {#what-means}

หากคุณเห็นข้อความ **"Cellular Plans From This Carrier Cannot Be Added to Your iPhone"** หมายความว่าอุปกรณ์ของคุณ **ถูกล็อคกับค่าย**

อุปกรณ์ที่ถูกล็อคกับค่ายสามารถใช้ซิมการ์ด (รวมถึง eSIM) ได้เฉพาะจากค่ายเดิมที่ซื้อมาเท่านั้น

## วิธีตรวจสอบสถานะการล็อคกับค่าย {#check-lock}

**บน iPhone:**
1. ไปที่ **Settings**
2. แตะ **General**
3. แตะ **About**
4. เลื่อนลงไปที่ **Carrier Lock**
5. ถ้าแสดง **"No SIM restrictions"** → โทรศัพท์ปลดล็อคแล้ว ✓
6. ถ้าแสดงชื่อค่าย → โทรศัพท์ยังล็อคอยู่ ✗

**บน Android:**
1. ไปที่ **Settings**
2. ไปที่ **About phone**
3. มองหา **SIM lock** หรือ **Network lock** status

## วิธีปลดล็อคอุปกรณ์ {#unlock}

หากอุปกรณ์ถูกล็อคกับค่าย:

1. **ติดต่อค่ายของคุณ** (ค่ายที่คุณซื้อโทรศัพท์มา)
2. ขอ **ปลดล็อคอุปกรณ์**
3. อาจต้องการ:
   - อุปกรณ์ต้องชำระเงินครบแล้ว
   - บัญชีอยู่ในสถานะดี
   - ระยะเวลารอ (มักเป็น 60-90 วันหลังซื้อ)
4. เมื่อปลดล็อคแล้ว รีสตาร์ทอุปกรณ์
5. ลองติดตั้ง eSIM อีกครั้ง

**หมายเหตุ:** Mobile11 ไม่สามารถปลดล็อคอุปกรณ์ของคุณได้ มีเพียงค่ายเดิมเท่านั้นที่ทำได้`
      },
      {
        slug: 'apn-settings',
        category: 'troubleshoot',
        title: 'What are the APN Settings for my eSIM?',
        titleTh: 'การตั้งค่า APN สำหรับ eSIM คืออะไร?',
        description: 'Understanding and configuring APN settings for your eSIM',
        descriptionTh: 'ทำความเข้าใจและกำหนดค่า APN สำหรับ eSIM ของคุณ',
        tableOfContents: [
          { id: 'what-is-apn', title: 'What is APN?', titleTh: 'APN คืออะไร?' },
          { id: 'auto-config', title: 'Automatic configuration', titleTh: 'การกำหนดค่าอัตโนมัติ' },
          { id: 'manual-apn', title: 'Manual APN settings', titleTh: 'การตั้งค่า APN ด้วยตนเอง' }
        ],
        content: `## What is APN? {#what-is-apn}

APN (Access Point Name) is a gateway between your mobile network and the internet. It tells your device how to connect to the carrier's network.

**Good news:** Most Mobile11 eSIMs configure APN automatically. You typically don't need to set it manually.

## Automatic configuration {#auto-config}

When you install your eSIM, the APN settings are usually configured automatically:

1. eSIM downloads carrier profile
2. APN settings are included in the profile
3. Device applies settings automatically
4. You're connected!

**If connection doesn't work after automatic setup:**
- Turn Data Roaming on
- Restart your device
- Try manual network selection

## Manual APN settings {#manual-apn}

If automatic configuration fails, you may need to enter APN manually:

**On iPhone:**
1. Go to Settings > Cellular
2. Tap your eSIM
3. Tap "Cellular Data Network"
4. Enter APN settings provided in your order email

**On Android:**
1. Go to Settings > Connections > Mobile Networks
2. Tap "Access Point Names"
3. Tap "+" to add new APN
4. Enter the settings from your order email

**Common APN settings:**
- APN: Provided in your order confirmation
- Username: Usually blank
- Password: Usually blank
- MCC/MNC: Auto-detected

**Note:** If you don't see APN settings in your order email, the eSIM uses automatic configuration and no manual setup is needed.`,
        contentTh: `## APN คืออะไร? {#what-is-apn}

APN (Access Point Name) คือเกตเวย์ระหว่างเครือข่ายมือถือและอินเทอร์เน็ต มันบอกอุปกรณ์ของคุณว่าจะเชื่อมต่อกับเครือข่ายของผู้ให้บริการอย่างไร

**ข่าวดี:** eSIM Mobile11 ส่วนใหญ่กำหนดค่า APN โดยอัตโนมัติ คุณมักไม่จำเป็นต้องตั้งค่าด้วยตนเอง

## การกำหนดค่าอัตโนมัติ {#auto-config}

เมื่อคุณติดตั้ง eSIM การตั้งค่า APN มักจะกำหนดค่าโดยอัตโนมัติ:

1. eSIM ดาวน์โหลดโปรไฟล์ผู้ให้บริการ
2. การตั้งค่า APN รวมอยู่ในโปรไฟล์
3. อุปกรณ์ใช้การตั้งค่าโดยอัตโนมัติ
4. คุณเชื่อมต่อแล้ว!

**หากการเชื่อมต่อไม่ทำงานหลังการตั้งค่าอัตโนมัติ:**
- เปิดโรมมิ่งข้อมูล
- รีสตาร์ทอุปกรณ์
- ลองเลือกเครือข่ายด้วยตนเอง

## การตั้งค่า APN ด้วยตนเอง {#manual-apn}

หากการกำหนดค่าอัตโนมัติล้มเหลว คุณอาจต้องป้อน APN ด้วยตนเอง:

**บน iPhone:**
1. ไปที่ ตั้งค่า > เซลลูลาร์
2. แตะ eSIM ของคุณ
3. แตะ "เครือข่ายข้อมูลเซลลูลาร์"
4. ป้อนการตั้งค่า APN ที่ให้ในอีเมลคำสั่งซื้อ

**บน Android:**
1. ไปที่ ตั้งค่า > การเชื่อมต่อ > เครือข่ายมือถือ
2. แตะ "ชื่อจุดเข้าถึง"
3. แตะ "+" เพื่อเพิ่ม APN ใหม่
4. ป้อนการตั้งค่าจากอีเมลคำสั่งซื้อ

**การตั้งค่า APN ทั่วไป:**
- APN: ให้ในการยืนยันคำสั่งซื้อ
- ชื่อผู้ใช้: มักเว้นว่าง
- รหัสผ่าน: มักเว้นว่าง
- MCC/MNC: ตรวจจับอัตโนมัติ

**หมายเหตุ:** หากคุณไม่เห็นการตั้งค่า APN ในอีเมลคำสั่งซื้อ eSIM ใช้การกำหนดค่าอัตโนมัติและไม่จำเป็นต้องตั้งค่าด้วยตนเอง`
      },
      {
        slug: 'hotspot-not-working',
        category: 'troubleshoot',
        title: 'Personal Hotspot Not Working with eSIM',
        titleTh: 'ฮอตสปอตส่วนตัวไม่ทำงานกับ eSIM',
        description: 'Troubleshooting hotspot issues with your eSIM',
        descriptionTh: 'การแก้ปัญหาฮอตสปอตกับ eSIM ของคุณ',
        tableOfContents: [
          { id: 'check-support', title: 'Check if hotspot is supported', titleTh: 'ตรวจสอบว่าฮอตสปอตรองรับหรือไม่' },
          { id: 'enable-hotspot', title: 'How to enable hotspot', titleTh: 'วิธีเปิดฮอตสปอต' },
          { id: 'troubleshoot', title: 'Troubleshooting steps', titleTh: 'ขั้นตอนการแก้ปัญหา' }
        ],
        content: `## Check if hotspot is supported {#check-support}

**Important:** Not all Mobile11 eSIM plans support personal hotspot.

Check your eSIM package details:
- Look for "Hotspot: Yes" in the package description
- Limitless plans typically support hotspot
- Some Day Pass and Max Speed plans may have restrictions

## How to enable hotspot {#enable-hotspot}

**On iPhone:**
1. Go to Settings > Cellular
2. Tap "Personal Hotspot"
3. Toggle "Allow Others to Join" ON
4. Set a Wi-Fi password

**On Android:**
1. Go to Settings > Connections
2. Tap "Mobile Hotspot and Tethering"
3. Tap "Mobile Hotspot"
4. Toggle ON and configure settings

## Troubleshooting steps {#troubleshoot}

If hotspot isn't working:

**1. Verify eSIM is set for data**
- Your eSIM must be the active data line

**2. Check APN settings**
- Some eSIMs need specific APN for hotspot
- Contact support if you need hotspot APN

**3. Restart devices**
- Restart both your phone and the connecting device

**4. Check data remaining**
- If data is exhausted, hotspot may not work

**5. Try USB or Bluetooth tethering**
- Alternative to Wi-Fi hotspot

If hotspot is supported but still not working, contact our support team.`,
        contentTh: `## ตรวจสอบว่าฮอตสปอตรองรับหรือไม่ {#check-support}

**สำคัญ:** ไม่ใช่ทุกแพ็คเกจ eSIM ของ Mobile11 ที่รองรับฮอตสปอตส่วนตัว

ตรวจสอบรายละเอียดแพ็คเกจ eSIM:
- มองหา "Hotspot: Yes" ในคำอธิบายแพ็คเกจ
- แพ็คเกจ Limitless มักรองรับฮอตสปอต
- แพ็คเกจ Day Pass และ Max Speed บางแพ็คเกจอาจมีข้อจำกัด

## วิธีเปิดฮอตสปอต {#enable-hotspot}

**บน iPhone:**
1. ไปที่ ตั้งค่า > เซลลูลาร์
2. แตะ "ฮอตสปอตส่วนตัว"
3. เปิด "อนุญาตให้ผู้อื่นเข้าร่วม"
4. ตั้งรหัสผ่าน Wi-Fi

**บน Android:**
1. ไปที่ ตั้งค่า > การเชื่อมต่อ
2. แตะ "ฮอตสปอตมือถือและการเชื่อมต่อแบบทีเธอริ่ง"
3. แตะ "ฮอตสปอตมือถือ"
4. เปิดและกำหนดค่าการตั้งค่า

## ขั้นตอนการแก้ปัญหา {#troubleshoot}

หากฮอตสปอตไม่ทำงาน:

**1. ยืนยันว่า eSIM ตั้งเป็นข้อมูล**
- eSIM ของคุณต้องเป็นสายข้อมูลที่ใช้งานอยู่

**2. ตรวจสอบการตั้งค่า APN**
- eSIM บางตัวต้องการ APN เฉพาะสำหรับฮอตสปอต
- ติดต่อฝ่ายสนับสนุนหากต้องการ APN ฮอตสปอต

**3. รีสตาร์ทอุปกรณ์**
- รีสตาร์ททั้งโทรศัพท์และอุปกรณ์ที่เชื่อมต่อ

**4. ตรวจสอบข้อมูลที่เหลือ**
- หากข้อมูลหมด ฮอตสปอตอาจไม่ทำงาน

**5. ลองใช้ USB หรือ Bluetooth tethering**
- ทางเลือกแทนฮอตสปอต Wi-Fi

หากฮอตสปอตรองรับแต่ยังไม่ทำงาน ติดต่อทีมสนับสนุนของเรา`
      },
      {
        slug: 'fix-no-internet-after-activation',
        category: 'troubleshoot',
        title: 'How to Fix No Internet Connection After Activating eSIM',
        titleTh: 'วิธีแก้ไขเมื่อไม่มีอินเทอร์เน็ตหลังเปิดใช้งาน eSIM',
        description: 'Complete troubleshooting guide when data does not work after eSIM installation',
        descriptionTh: 'คู่มือแก้ปัญหาฉบับสมบูรณ์เมื่อข้อมูลไม่ทำงานหลังติดตั้ง eSIM',
        tableOfContents: [
          { id: 'verify-installation', title: 'Verify eSIM is installed correctly', titleTh: 'ยืนยันว่า eSIM ติดตั้งถูกต้อง' },
          { id: 'enable-data-roaming', title: 'Enable Data Roaming (Critical)', titleTh: 'เปิดโรมมิ่งข้อมูล (สำคัญมาก)' },
          { id: 'set-esim-for-data', title: 'Set eSIM as data line', titleTh: 'ตั้ง eSIM เป็นสายข้อมูล' },
          { id: 'contact-support', title: 'Contact support', titleTh: 'ติดต่อฝ่ายสนับสนุน' }
        ],
        content: `If you have activated your eSIM but still have no internet connection, follow these troubleshooting steps.

## Verify eSIM is installed correctly {#verify-installation}

First, confirm the eSIM is properly installed and enabled:

**On iPhone:**
1. Go to Settings > Cellular
2. You should see your Mobile11 eSIM listed
3. Ensure the toggle is ON (green)

**On Android:**
1. Go to Settings > Connections > SIM Manager
2. Find your eSIM in the list
3. Make sure it is enabled

If you do not see the eSIM, you may need to reinstall it using the QR code or manual activation code.

## Enable Data Roaming (Critical) {#enable-data-roaming}

**This is the #1 reason for no internet connection.** Data Roaming MUST be enabled for your eSIM to work.

**On iPhone:**
1. Go to Settings > Cellular
2. Tap on your eSIM line
3. Toggle Data Roaming ON

**On Android:**
1. Go to Settings > Connections > Mobile Networks
2. Toggle Data Roaming ON

**Note:** Do not worry about extra charges - roaming is included with your Mobile11 eSIM plan.

## Set eSIM as data line {#set-esim-for-data}

If you have multiple SIMs, make sure your eSIM is set as the data line:

**On iPhone:**
1. Go to Settings > Cellular > Cellular Data
2. Select your Mobile11 eSIM as the data line

**On Android:**
1. Go to Settings > Connections > SIM Manager
2. Tap Mobile Data
3. Select your eSIM

## Contact support {#contact-support}

If you have tried all the above steps and still have no internet:

**Reach out to us with:**
- Your order number
- Device model and software version
- Screenshots showing your eSIM settings
- Which troubleshooting steps you have tried

We typically respond within 24 hours and can issue a replacement eSIM if needed.`,
        contentTh: `หากคุณเปิดใช้งาน eSIM แล้วแต่ยังไม่มีการเชื่อมต่ออินเทอร์เน็ต ทำตามขั้นตอนแก้ปัญหาเหล่านี้

## ยืนยันว่า eSIM ติดตั้งถูกต้อง {#verify-installation}

ก่อนอื่น ยืนยันว่า eSIM ติดตั้งและเปิดใช้งานอย่างถูกต้อง:

**บน iPhone:**
1. ไปที่ ตั้งค่า > เซลลูลาร์
2. คุณควรเห็น Mobile11 eSIM ในรายการ
3. ตรวจสอบว่าเปิดใช้งานอยู่ (สีเขียว)

**บน Android:**
1. ไปที่ ตั้งค่า > การเชื่อมต่อ > ตัวจัดการ SIM
2. หา eSIM ในรายการ
3. ตรวจสอบว่าเปิดใช้งานอยู่

## เปิดโรมมิ่งข้อมูล (สำคัญมาก) {#enable-data-roaming}

**นี่คือสาเหตุ #1 ที่ทำให้ไม่มีอินเทอร์เน็ต** ต้องเปิดโรมมิ่งข้อมูลเพื่อให้ eSIM ทำงาน

**บน iPhone:**
1. ไปที่ ตั้งค่า > เซลลูลาร์
2. แตะสาย eSIM ของคุณ
3. เปิด โรมมิ่งข้อมูล

**บน Android:**
1. ไปที่ ตั้งค่า > การเชื่อมต่อ > เครือข่ายมือถือ
2. เปิด โรมมิ่งข้อมูล

## ตั้ง eSIM เป็นสายข้อมูล {#set-esim-for-data}

หากคุณมี SIM หลายตัว ตรวจสอบว่า eSIM ตั้งเป็นสายข้อมูล:

**บน iPhone:**
1. ไปที่ ตั้งค่า > เซลลูลาร์ > ข้อมูลเซลลูลาร์
2. เลือก Mobile11 eSIM เป็นสายข้อมูล

**บน Android:**
1. ไปที่ ตั้งค่า > การเชื่อมต่อ > ตัวจัดการ SIM
2. แตะ ข้อมูลมือถือ
3. เลือก eSIM ของคุณ

## ติดต่อฝ่ายสนับสนุน {#contact-support}

หากคุณลองทุกขั้นตอนแล้วยังไม่มีอินเทอร์เน็ต:

**ติดต่อเราพร้อม:**
- หมายเลขคำสั่งซื้อ
- รุ่นอุปกรณ์และเวอร์ชันซอฟต์แวร์
- ภาพหน้าจอการตั้งค่า eSIM
- ขั้นตอนที่คุณลองแล้ว

เราตอบกลับภายใน 24 ชั่วโมงและสามารถออก eSIM ทดแทนได้หากจำเป็น`
      },
      {
        slug: 'esim-showing-4g-5g-no-internet',
        category: 'troubleshoot',
        title: 'My eSIM shows 4G/5G but no internet',
        titleTh: 'eSIM แสดง 4G/5G แต่ไม่มีอินเทอร์เน็ต',
        description: 'Troubleshoot when you have signal bars but no data connection',
        descriptionTh: 'แก้ปัญหาเมื่อมีสัญญาณแต่ไม่มีการเชื่อมต่อข้อมูล',
        tableOfContents: [
          { id: 'understand-issue', title: 'Understanding this issue', titleTh: 'ทำความเข้าใจปัญหา' },
          { id: 'data-roaming', title: 'Enable Data Roaming', titleTh: 'เปิดโรมมิ่งข้อมูล' },
          { id: 'apn-settings', title: 'Configure APN', titleTh: 'กำหนดค่า APN' },
          { id: 'contact-support', title: 'Contact support', titleTh: 'ติดต่อฝ่ายสนับสนุน' }
        ],
        content: `## Understanding this issue {#understand-issue}

Seeing 4G/5G signal bars means your device is connected to the mobile network for signaling purposes, but data may not be flowing due to configuration issues.

**Common causes:**
- Data Roaming is disabled (most common)
- eSIM is not set as the data line
- Incorrect APN settings

## Enable Data Roaming {#data-roaming}

**This is the most common fix.** Even if you see signal bars, data will not work without roaming enabled.

**On iPhone:**
1. Go to Settings > Cellular
2. Tap your eSIM line
3. Toggle Data Roaming ON

**On Android:**
1. Go to Settings > Connections > Mobile Networks
2. Toggle Data Roaming ON

## Configure APN {#apn-settings}

Incorrect APN settings can prevent data from working:

**On iPhone:**
1. Go to Settings > Cellular > Your eSIM
2. Tap Cellular Data Network
3. Enter APN: typically internet or check your order email

**On Android:**
1. Go to Settings > Connections > Mobile Networks
2. Tap Access Point Names
3. Add new APN with name Mobile11 and APN from your order email

## Contact support {#contact-support}

If the issue persists after trying all steps, contact us with your order number and device model.`,
        contentTh: `## ทำความเข้าใจปัญหา {#understand-issue}

การเห็นสัญญาณ 4G/5G หมายความว่าอุปกรณ์เชื่อมต่อกับเครือข่ายมือถือ แต่ข้อมูลอาจไม่ไหลเนื่องจากปัญหาการกำหนดค่า

**สาเหตุทั่วไป:**
- ปิดโรมมิ่งข้อมูล (พบบ่อยที่สุด)
- eSIM ไม่ได้ตั้งเป็นสายข้อมูล
- การตั้งค่า APN ไม่ถูกต้อง

## เปิดโรมมิ่งข้อมูล {#data-roaming}

**นี่คือการแก้ไขที่พบบ่อยที่สุด** แม้จะเห็นสัญญาณ ข้อมูลจะไม่ทำงานหากไม่ได้เปิดโรมมิ่ง

**บน iPhone:**
1. ไปที่ ตั้งค่า > เซลลูลาร์
2. แตะสาย eSIM ของคุณ
3. เปิด โรมมิ่งข้อมูล

**บน Android:**
1. ไปที่ ตั้งค่า > การเชื่อมต่อ > เครือข่ายมือถือ
2. เปิด โรมมิ่งข้อมูล

## กำหนดค่า APN {#apn-settings}

การตั้งค่า APN ไม่ถูกต้องสามารถป้องกันไม่ให้ข้อมูลทำงาน

**บน iPhone:**
1. ไปที่ ตั้งค่า > เซลลูลาร์ > eSIM ของคุณ
2. แตะ Cellular Data Network
3. ใส่ APN: ปกติ internet หรือดูอีเมลคำสั่งซื้อ

**บน Android:**
1. ไปที่ ตั้งค่า > การเชื่อมต่อ > เครือข่ายมือถือ
2. แตะ Access Point Names
3. เพิ่ม APN ใหม่ด้วยชื่อ Mobile11 และ APN จากอีเมลคำสั่งซื้อ

## ติดต่อฝ่ายสนับสนุน {#contact-support}

หากปัญหายังคงอยู่หลังลองทุกขั้นตอน ติดต่อเราพร้อมหมายเลขคำสั่งซื้อและรุ่นอุปกรณ์`
      },
      {
        slug: 'cannot-make-calls-esim',
        category: 'troubleshoot',
        title: 'Why I Cannot Make Calls with My eSIM',
        titleTh: 'ทำไมโทรออกด้วย eSIM ไม่ได้',
        description: 'Understanding eSIM data-only plans and voice call limitations',
        descriptionTh: 'ทำความเข้าใจแพ็คเกจ eSIM แบบข้อมูลเท่านั้นและข้อจำกัดการโทร',
        tableOfContents: [
          { id: 'data-only-plans', title: 'Mobile11 eSIMs are data-only', titleTh: 'eSIM Mobile11 เป็นข้อมูลเท่านั้น' },
          { id: 'voip-alternatives', title: 'Use VoIP apps instead', titleTh: 'ใช้แอปโทรผ่านอินเทอร์เน็ตแทน' },
          { id: 'keep-physical-sim', title: 'Keep your physical SIM', titleTh: 'เก็บ SIM จริงไว้' }
        ],
        content: `## Mobile11 eSIMs are data-only {#data-only-plans}

**Important:** All Mobile11 travel eSIMs are data-only plans. This means:

- You cannot make or receive traditional phone calls
- You cannot send or receive SMS text messages
- You have full internet access for all apps
- You can make calls using internet-based apps

This is standard for travel eSIMs worldwide.

## Use VoIP apps instead {#voip-alternatives}

With your eSIM data, you can make free or low-cost calls using internet-based apps:

**Free calling apps:**
- WhatsApp (calls and video calls)
- FaceTime (iPhone to iPhone/Mac)
- LINE (popular in Asia)
- Telegram (voice and video calls)
- Facebook Messenger
- Zoom / Google Meet

**Tip:** Download these apps before your trip and test them.

## Keep your physical SIM {#keep-physical-sim}

We recommend keeping your home country physical SIM active:

1. **Dual SIM setup:** Most modern phones support both physical SIM + eSIM
2. **Use physical SIM for:** Calls, SMS, two-factor authentication
3. **Use eSIM for:** Data while traveling (much cheaper than roaming)`,
        contentTh: `## eSIM Mobile11 เป็นข้อมูลเท่านั้น {#data-only-plans}

**สำคัญ:** eSIM สำหรับเดินทางของ Mobile11 ทั้งหมดเป็นแพ็คเกจข้อมูลเท่านั้น ซึ่งหมายความว่า:

- คุณไม่สามารถโทรออกหรือรับสายโทรศัพท์แบบดั้งเดิมได้
- คุณไม่สามารถส่งหรือรับ SMS ได้
- คุณมีอินเทอร์เน็ตเต็มรูปแบบสำหรับทุกแอป
- คุณสามารถโทรโดยใช้แอปอินเทอร์เน็ต

นี่เป็นมาตรฐานสำหรับ eSIM ท่องเที่ยวทั่วโลก

## ใช้แอปโทรผ่านอินเทอร์เน็ตแทน {#voip-alternatives}

ด้วยข้อมูล eSIM คุณสามารถโทรฟรีหรือราคาถูกโดยใช้แอปอินเทอร์เน็ต:

**แอปโทรฟรี:**
- WhatsApp (โทรและวิดีโอคอล)
- FaceTime (iPhone ถึง iPhone/Mac)
- LINE (นิยมในเอเชีย)
- Telegram (โทรเสียงและวิดีโอ)
- Facebook Messenger
- Zoom / Google Meet

**เคล็ดลับ:** ดาวน์โหลดแอปเหล่านี้ก่อนการเดินทางและทดสอบ

## เก็บ SIM จริงไว้ {#keep-physical-sim}

เราแนะนำให้เก็บ SIM จริงของประเทศบ้านเกิดไว้:

1. **การตั้งค่า Dual SIM:** โทรศัพท์สมัยใหม่ส่วนใหญ่รองรับทั้ง SIM จริง + eSIM
2. **ใช้ SIM จริงสำหรับ:** โทร, SMS, การยืนยันตัวตนสองขั้นตอน
3. **ใช้ eSIM สำหรับ:** ข้อมูลขณะเดินทาง (ถูกกว่าโรมมิ่งมาก)`
      },
      {
        slug: 'esim-data-running-out-fast',
        category: 'troubleshoot',
        title: 'My eSIM Data is Running Out Faster Than Expected',
        titleTh: 'ข้อมูล eSIM หมดเร็วกว่าที่คาดไว้',
        description: 'Tips to reduce data usage and extend your eSIM plan',
        descriptionTh: 'เคล็ดลับลดการใช้ข้อมูลและยืดอายุแพ็คเกจ eSIM',
        tableOfContents: [
          { id: 'common-causes', title: 'Common causes of high data usage', titleTh: 'สาเหตุทั่วไปของการใช้ข้อมูลสูง' },
          { id: 'reduce-usage', title: 'How to reduce data usage', titleTh: 'วิธีลดการใช้ข้อมูล' },
          { id: 'top-up-options', title: 'Top-up options', titleTh: 'ตัวเลือกเติมเงิน' }
        ],
        content: `## Common causes of high data usage {#common-causes}

Data can be consumed quickly without you realizing. Common culprits:

**Background app refresh:**
- Apps updating content in the background
- Cloud backups (iCloud, Google Photos)
- Email sync

**Streaming:**
- Video streaming (YouTube, Netflix) uses 1-3 GB per hour
- Music streaming uses about 150 MB per hour

**Automatic updates:**
- App updates downloading
- OS updates

## How to reduce data usage {#reduce-usage}

**On iPhone:**
1. Settings > Cellular > scroll down to see per-app usage
2. Turn off data access for apps you do not need abroad
3. Settings > App Store > disable Automatic Downloads over cellular

**On Android:**
1. Settings > Network and Internet > Data Usage
2. Set data warning and limit
3. Disable background data for specific apps

**General tips:**
- Download maps offline before your trip (Google Maps, Maps.me)
- Download shows/music for offline use
- Use Wi-Fi when available
- Lower video quality in streaming apps

## Top-up options {#top-up-options}

Running low on data? You have options:

1. **Buy a top-up package:** Log in to Mobile11, go to your eSIM, select Top Up
2. **Buy a new eSIM:** If top-up is not available, purchase a new package
3. **Upgrade to Limitless:** For heavy data users, consider our unlimited plans`,
        contentTh: `## สาเหตุทั่วไปของการใช้ข้อมูลสูง {#common-causes}

ข้อมูลสามารถถูกใช้อย่างรวดเร็วโดยที่คุณไม่รู้ตัว สาเหตุทั่วไป:

**การรีเฟรชแอปในพื้นหลัง:**
- แอปอัปเดตเนื้อหาในพื้นหลัง
- การสำรองข้อมูลคลาวด์ (iCloud, Google Photos)
- การซิงค์อีเมล

**สตรีมมิ่ง:**
- สตรีมวิดีโอ (YouTube, Netflix) ใช้ 1-3 GB ต่อชั่วโมง
- สตรีมเพลงใช้ประมาณ 150 MB ต่อชั่วโมง

**อัปเดตอัตโนมัติ:**
- ดาวน์โหลดอัปเดตแอป
- อัปเดต OS

## วิธีลดการใช้ข้อมูล {#reduce-usage}

**บน iPhone:**
1. ตั้งค่า > เซลลูลาร์ > เลื่อนลงเพื่อดูการใช้ต่อแอป
2. ปิดการเข้าถึงข้อมูลสำหรับแอปที่ไม่ต้องการในต่างประเทศ
3. ตั้งค่า > App Store > ปิด ดาวน์โหลดอัตโนมัติ ผ่านเซลลูลาร์

**บน Android:**
1. ตั้งค่า > เครือข่ายและอินเทอร์เน็ต > การใช้ข้อมูล
2. ตั้งการเตือนและขีดจำกัดข้อมูล
3. ปิดข้อมูลพื้นหลังสำหรับแอปเฉพาะ

**เคล็ดลับทั่วไป:**
- ดาวน์โหลดแผนที่ออฟไลน์ก่อนเดินทาง (Google Maps, Maps.me)
- ดาวน์โหลดรายการ/เพลงสำหรับใช้ออฟไลน์
- ใช้ Wi-Fi เมื่อมี
- ลดคุณภาพวิดีโอในแอปสตรีมมิ่ง

## ตัวเลือกเติมเงิน {#top-up-options}

ข้อมูลใกล้หมด? คุณมีตัวเลือก:

1. **ซื้อแพ็คเกจเติมเงิน:** เข้าสู่ระบบ Mobile11 ไปที่ eSIM เลือก เติมเงิน
2. **ซื้อ eSIM ใหม่:** หากเติมเงินไม่พร้อม ซื้อแพ็คเกจใหม่
3. **อัพเกรดเป็น Limitless:** สำหรับผู้ใช้ข้อมูลหนัก พิจารณาแพ็คเกจไม่จำกัด`
      },
      {
        slug: 'how-to-delete-esim',
        category: 'troubleshoot',
        title: 'How to Delete an eSIM from Your Device',
        titleTh: 'วิธีลบ eSIM ออกจากอุปกรณ์',
        description: 'Step-by-step instructions to remove an eSIM from iPhone and Android',
        descriptionTh: 'คำแนะนำขั้นตอนการลบ eSIM จาก iPhone และ Android',
        tableOfContents: [
          { id: 'before-deleting', title: 'Before you delete', titleTh: 'ก่อนลบ' },
          { id: 'delete-iphone', title: 'Delete eSIM on iPhone', titleTh: 'ลบ eSIM บน iPhone' },
          { id: 'delete-android', title: 'Delete eSIM on Android', titleTh: 'ลบ eSIM บน Android' }
        ],
        content: `## Before you delete {#before-deleting}

**Important warnings:**

- Deleting is permanent - once removed, you cannot reinstall the same eSIM
- Data is lost - any remaining data on the eSIM will be forfeited
- No refunds - we cannot refund unused data after deletion

**Only delete your eSIM if:**
- Your trip is complete and you no longer need the eSIM
- You want to free up eSIM slots on your device
- Technical support has advised you to delete and reinstall

## Delete eSIM on iPhone {#delete-iphone}

1. Go to Settings
2. Tap Cellular (or Mobile Data)
3. Find your Mobile11 eSIM in the list
4. Tap on the eSIM line
5. Scroll down and tap Delete eSIM (or Remove Cellular Plan)
6. Confirm deletion

## Delete eSIM on Android {#delete-android}

Steps vary slightly by manufacturer:

**Samsung Galaxy:**
1. Go to Settings
2. Tap Connections
3. Tap SIM Manager (or SIM Card Manager)
4. Tap your eSIM
5. Tap Remove or Delete
6. Confirm deletion

**Google Pixel:**
1. Go to Settings
2. Tap Network and Internet
3. Tap SIMs
4. Tap your eSIM
5. Tap Delete SIM
6. Confirm`,
        contentTh: `## ก่อนลบ {#before-deleting}

**คำเตือนสำคัญ:**

- การลบเป็นการถาวร - เมื่อลบแล้วไม่สามารถติดตั้ง eSIM เดิมได้อีก
- ข้อมูลหายไป - ข้อมูลที่เหลือใน eSIM จะถูกริบ
- ไม่คืนเงิน - เราไม่สามารถคืนเงินข้อมูลที่ไม่ได้ใช้หลังการลบ

**ลบ eSIM เฉพาะเมื่อ:**
- การเดินทางเสร็จสิ้นและคุณไม่ต้องการ eSIM อีก
- คุณต้องการเพิ่มช่อง eSIM บนอุปกรณ์
- ฝ่ายสนับสนุนแนะนำให้ลบและติดตั้งใหม่

## ลบ eSIM บน iPhone {#delete-iphone}

1. ไปที่ ตั้งค่า
2. แตะ เซลลูลาร์ (หรือ Mobile Data)
3. หา Mobile11 eSIM ในรายการ
4. แตะสาย eSIM
5. เลื่อนลงและแตะ ลบ eSIM (หรือ Remove Cellular Plan)
6. ยืนยันการลบ

## ลบ eSIM บน Android {#delete-android}

ขั้นตอนแตกต่างเล็กน้อยตามผู้ผลิต:

**Samsung Galaxy:**
1. ไปที่ ตั้งค่า
2. แตะ การเชื่อมต่อ
3. แตะ ตัวจัดการ SIM
4. แตะ eSIM ของคุณ
5. แตะ ลบ
6. ยืนยันการลบ

**Google Pixel:**
1. ไปที่ ตั้งค่า
2. แตะ Network and Internet
3. แตะ SIMs
4. แตะ eSIM ของคุณ
5. แตะ Delete SIM
6. ยืนยัน`
      },
      {
        slug: 'qr-code-this-code-no-longer-valid',
        category: 'troubleshoot',
        title: 'This Code is No Longer Valid Error',
        titleTh: 'ข้อผิดพลาด รหัสนี้ไม่สามารถใช้ได้อีก',
        description: 'What to do when your eSIM QR code shows as invalid or already used',
        descriptionTh: 'จะทำอย่างไรเมื่อ QR code eSIM แสดงว่าไม่ถูกต้องหรือใช้แล้ว',
        tableOfContents: [
          { id: 'why-error', title: 'Why this error occurs', titleTh: 'ทำไมข้อผิดพลาดนี้เกิดขึ้น' },
          { id: 'check-installed', title: 'Check if eSIM is already installed', titleTh: 'ตรวจสอบว่า eSIM ติดตั้งแล้วหรือไม่' },
          { id: 'contact-support', title: 'Request replacement', titleTh: 'ขอ eSIM ทดแทน' }
        ],
        content: `## Why this error occurs {#why-error}

The This code is no longer valid error typically appears because:

1. **QR code already scanned:** Each eSIM QR code can only be used once. If you have already scanned and installed the eSIM, the QR becomes invalid.

2. **Installation interrupted:** If installation was started but interrupted (app crash, connection loss), the code may be marked as used.

3. **Wrong QR code:** You may be scanning an old or different QR code.

## Check if eSIM is already installed {#check-installed}

Before requesting a replacement, verify the eSIM is not already on your device:

**On iPhone:**
1. Go to Settings > Cellular
2. Look for Mobile11 or the carrier name in your cellular plans
3. If found, toggle it ON - no need to reinstall!

**On Android:**
1. Go to Settings > Connections > SIM Manager
2. Check if an eSIM is listed
3. If found, enable it

**Tip:** The eSIM might be labeled with a carrier name (e.g., Truemove, AIS) rather than Mobile11.

## Request replacement {#contact-support}

If the eSIM is not installed and you cannot scan the QR code:

**Contact our support with:**
- Your order number
- Screenshot of the error message
- Confirmation that you have checked Settings and the eSIM is not installed
- Device model

We typically respond within 24 hours and can issue a replacement QR code if needed.`,
        contentTh: `## ทำไมข้อผิดพลาดนี้เกิดขึ้น {#why-error}

ข้อผิดพลาด รหัสนี้ไม่สามารถใช้ได้อีก มักปรากฏเพราะ:

1. **QR code สแกนแล้ว:** QR code eSIM แต่ละอันใช้ได้เพียงครั้งเดียว หากคุณสแกนและติดตั้ง eSIM แล้ว QR จะไม่สามารถใช้ได้อีก

2. **การติดตั้งถูกขัดจังหวะ:** หากการติดตั้งเริ่มแต่ถูกขัดจังหวะ รหัสอาจถูกทำเครื่องหมายว่าใช้แล้ว

3. **QR code ผิด:** คุณอาจสแกน QR code เก่าหรือต่าง

## ตรวจสอบว่า eSIM ติดตั้งแล้วหรือไม่ {#check-installed}

ก่อนขอ eSIM ทดแทน ยืนยันว่า eSIM ไม่ได้อยู่ในอุปกรณ์แล้ว:

**บน iPhone:**
1. ไปที่ ตั้งค่า > เซลลูลาร์
2. มองหา Mobile11 หรือชื่อค่ายในแผนเซลลูลาร์
3. หากพบ เปิดใช้งาน - ไม่ต้องติดตั้งใหม่!

**บน Android:**
1. ไปที่ ตั้งค่า > การเชื่อมต่อ > ตัวจัดการ SIM
2. ตรวจสอบว่ามี eSIM ในรายการหรือไม่
3. หากพบ เปิดใช้งาน

**เคล็ดลับ:** eSIM อาจติดป้ายด้วยชื่อค่าย (เช่น Truemove, AIS) แทน Mobile11

## ขอ eSIM ทดแทน {#contact-support}

หาก eSIM ไม่ได้ติดตั้งและคุณสแกน QR code ไม่ได้:

**ติดต่อฝ่ายสนับสนุนพร้อม:**
- หมายเลขคำสั่งซื้อ
- ภาพหน้าจอของข้อความแสดงข้อผิดพลาด
- การยืนยันว่าคุณตรวจสอบการตั้งค่าแล้วและ eSIM ไม่ได้ติดตั้ง
- รุ่นอุปกรณ์

เราตอบกลับภายใน 24 ชั่วโมงและสามารถออก QR code ทดแทนได้หากจำเป็น`
      },

      // ==================== ESIM DATA PLAN ====================
      {
        slug: 'how-to-top-up-esim',
        category: 'esim-data-plan',
        title: 'How to Top Up Your eSIM',
        titleTh: 'วิธีเติมเงิน eSIM ของคุณ',
        description: 'Learn how to add more data to your existing eSIM',
        descriptionTh: 'เรียนรู้วิธีเพิ่มข้อมูลให้กับ eSIM ที่มีอยู่',
        tableOfContents: [
          { id: 'what-is-topup', title: 'What is a top-up?', titleTh: 'การเติมเงินคืออะไร?' },
          { id: 'how-to-topup', title: 'How to top up', titleTh: 'วิธีเติมเงิน' },
          { id: 'topup-tips', title: 'Top-up tips', titleTh: 'เคล็ดลับการเติมเงิน' }
        ],
        content: `## What is a top-up? {#what-is-topup}

A top-up allows you to add more data to your existing eSIM without installing a new one.

**Benefits of top-up:**
- Keep the same eSIM (no reinstallation)
- Seamless continuation of service
- Often more cost-effective than new eSIM

## How to top up {#how-to-topup}

**Step 1: Check eligibility**
- Not all eSIMs support top-up
- Check your eSIM details in your account dashboard

**Step 2: Purchase top-up**
1. Log into your Mobile11 account
2. Go to "My eSIMs" section
3. Select the eSIM you want to top up
4. Click "Top Up" or "Add Data"
5. Choose your data package
6. Complete payment

**Step 3: Activation**
- Top-up data is usually added automatically
- May take 5-15 minutes to reflect
- No reinstallation needed

## Top-up tips {#topup-tips}

**Timing your top-up:**
- Top up before data runs out for seamless service
- Set data usage alerts to avoid disruption

**Choosing the right package:**
- Consider remaining trip duration
- Check if unused data carries over

**Important notes:**
- Top-up extends data, not validity in most cases
- Check specific package terms before purchasing`,
        contentTh: `## การเติมเงินคืออะไร? {#what-is-topup}

การเติมเงินช่วยให้คุณเพิ่มข้อมูลให้กับ eSIM ที่มีอยู่โดยไม่ต้องติดตั้งใหม่

**ประโยชน์ของการเติมเงิน:**
- ใช้ eSIM เดิม (ไม่ต้องติดตั้งใหม่)
- บริการต่อเนื่องราบรื่น
- มักคุ้มค่ากว่าซื้อ eSIM ใหม่

## วิธีเติมเงิน {#how-to-topup}

**ขั้นตอนที่ 1: ตรวจสอบคุณสมบัติ**
- ไม่ใช่ eSIM ทุกตัวรองรับการเติมเงิน
- ตรวจสอบรายละเอียด eSIM ในแดชบอร์ดบัญชี

**ขั้นตอนที่ 2: ซื้อเติมเงิน**
1. เข้าสู่ระบบบัญชี Mobile11
2. ไปที่ส่วน "eSIM ของฉัน"
3. เลือก eSIM ที่ต้องการเติมเงิน
4. คลิก "เติมเงิน" หรือ "เพิ่มข้อมูล"
5. เลือกแพ็คเกจข้อมูล
6. ชำระเงินให้เสร็จสิ้น

**ขั้นตอนที่ 3: เปิดใช้งาน**
- ข้อมูลเติมเงินมักเพิ่มอัตโนมัติ
- อาจใช้เวลา 5-15 นาทีในการแสดง
- ไม่ต้องติดตั้งใหม่

## เคล็ดลับการเติมเงิน {#topup-tips}

**จังหวะการเติมเงิน:**
- เติมเงินก่อนข้อมูลหมดเพื่อบริการต่อเนื่อง
- ตั้งการแจ้งเตือนการใช้ข้อมูล

**เลือกแพ็คเกจที่เหมาะสม:**
- พิจารณาระยะเวลาเดินทางที่เหลือ
- ตรวจสอบว่าข้อมูลที่ไม่ได้ใช้ยกยอดไปได้หรือไม่

**หมายเหตุสำคัญ:**
- การเติมเงินขยายข้อมูล ไม่ใช่อายุในกรณีส่วนใหญ่
- ตรวจสอบเงื่อนไขแพ็คเกจก่อนซื้อ`
      },
      {
        slug: 'unlimited-data-plans-explained',
        category: 'esim-data-plan',
        title: 'Understanding Mobile11 Plan Types',
        titleTh: 'ทำความเข้าใจประเภทแพ็คเกจ Mobile11',
        description: 'Learn about Day Pass, Max Speed, and Limitless plans',
        descriptionTh: 'เรียนรู้เกี่ยวกับแพ็คเกจ Day Pass, Max Speed และ Limitless',
        tableOfContents: [
          { id: 'truly-unlimited', title: 'All plans are truly unlimited', titleTh: 'ทุกแพ็คเกจไม่จำกัดจริงๆ' },
          { id: 'day-pass', title: 'Day Pass plans', titleTh: 'แพ็คเกจ Day Pass' },
          { id: 'max-speed', title: 'Max Speed plans', titleTh: 'แพ็คเกจ Max Speed' },
          { id: 'limitless', title: 'Limitless plans', titleTh: 'แพ็คเกจ Limitless' }
        ],
        content: `## All plans are truly unlimited {#truly-unlimited}

**Every Mobile11 eSIM plan is truly unlimited** — you are never cut off from data connectivity. The three plan types differ in how speeds are managed, not in whether data is unlimited.

**Key benefits across all plans:**
- ✓ Never run out of data
- ✓ Stay connected throughout your trip
- ✓ No surprise charges or data cutoffs
- ✓ Works in 150+ countries

## Day Pass plans {#day-pass}

Day Pass is our most popular plan type, perfect for balanced everyday use.

**How it works:**
- Get a daily high-speed data allowance (e.g., 500MB, 1GB, or 2GB per day)
- Allowance resets every 24 hours
- After daily allowance: speed reduces to 384 Kbps (some premium plans offer 1 Mbps)
- Never cut off — keep browsing, messaging, and navigating

**At 384 Kbps fallback speed, you can:**
- ✓ WhatsApp, LINE, Messenger
- ✓ Email (text-based)
- ✓ Google Maps navigation
- △ Web browsing (slower)
- ✗ Video streaming not recommended

## Max Speed plans {#max-speed}

Max Speed plans give you high-speed data upfront, then keep you connected at reduced speeds.

**How it works:**
- Get total high-speed data (e.g., 3GB, 5GB, 10GB for entire validity)
- Use at maximum network speeds (LTE/5G)
- After high-speed data used: speed reduces to 384 Kbps
- Never cut off — basic connectivity continues

## Limitless plans {#limitless}

Limitless is our premium plan — **maximum speeds with zero throttling**.

**How it works:**
- Unlimited data at maximum network speeds
- No speed reduction ever
- Full LTE/5G speeds throughout validity
- Perfect for heavy data users

**With Limitless, you can:**
- ✓ Stream HD/4K video without buffering
- ✓ Video calls (Zoom, Meet, FaceTime)
- ✓ Work remotely with large files
- ✓ Use as hotspot for other devices
- ✓ Download apps and updates
- ✓ Everything, without limits`,
        contentTh: `## ทุกแพ็คเกจไม่จำกัดจริงๆ {#truly-unlimited}

**ทุกแพ็คเกจ eSIM ของ Mobile11 ไม่จำกัดจริงๆ** — คุณจะไม่ถูกตัดการเชื่อมต่อข้อมูลเลย แพ็คเกจทั้งสามประเภทแตกต่างกันที่วิธีจัดการความเร็ว ไม่ใช่ว่าข้อมูลจำกัดหรือไม่

**ข้อดีหลักของทุกแพ็คเกจ:**
- ✓ ไม่มีวันหมดข้อมูล
- ✓ เชื่อมต่อตลอดการเดินทาง
- ✓ ไม่มีค่าใช้จ่ายแอบแฝง
- ✓ ใช้ได้ใน 150+ ประเทศ

## แพ็คเกจ Day Pass {#day-pass}

Day Pass เป็นแพ็คเกจยอดนิยมที่สุด เหมาะสำหรับการใช้งานทั่วไปอย่างสมดุล

**วิธีการทำงาน:**
- ได้รับโควต้าข้อมูลความเร็วสูงรายวัน (เช่น 500MB, 1GB หรือ 2GB ต่อวัน)
- โควต้ารีเซ็ตทุก 24 ชั่วโมง
- หลังใช้โควต้าหมด: ความเร็วลดลงเหลือ 384 Kbps
- ไม่ถูกตัด — ท่องเว็บ แชท และนำทางได้ต่อ

**ที่ความเร็วสำรอง 384 Kbps คุณสามารถ:**
- ✓ WhatsApp, LINE, Messenger
- ✓ อีเมล (แบบข้อความ)
- ✓ นำทาง Google Maps
- △ ท่องเว็บ (ช้าลง)
- ✗ ไม่แนะนำสตรีมวิดีโอ

## แพ็คเกจ Max Speed {#max-speed}

Max Speed ให้ข้อมูลความเร็วสูงล่วงหน้า จากนั้นเชื่อมต่อต่อที่ความเร็วลดลง

**วิธีการทำงาน:**
- ได้รับข้อมูลความเร็วสูงรวม (เช่น 3GB, 5GB, 10GB สำหรับอายุทั้งหมด)
- ใช้ที่ความเร็วเครือข่ายสูงสุด (LTE/5G)
- หลังข้อมูลความเร็วสูงหมด: ความเร็วลดลงเหลือ 384 Kbps
- ไม่ถูกตัด — การเชื่อมต่อพื้นฐานยังคงอยู่

## แพ็คเกจ Limitless {#limitless}

Limitless เป็นแพ็คเกจพรีเมียม — **ความเร็วสูงสุดไม่มีการลดความเร็ว**

**วิธีการทำงาน:**
- ข้อมูลไม่จำกัดที่ความเร็วเครือข่ายสูงสุด
- ไม่มีการลดความเร็วเลย
- ความเร็ว LTE/5G เต็มตลอดอายุ
- เหมาะสำหรับผู้ใช้ข้อมูลหนัก

**ด้วย Limitless คุณสามารถ:**
- ✓ สตรีมวิดีโอ HD/4K ไม่มีบัฟเฟอร์
- ✓ วิดีโอคอล (Zoom, Meet, FaceTime)
- ✓ ทำงานระยะไกลกับไฟล์ใหญ่
- ✓ ใช้เป็นฮอตสปอตสำหรับอุปกรณ์อื่น
- ✓ ดาวน์โหลดแอปและอัปเดต
- ✓ ทุกอย่าง ไม่มีข้อจำกัด`
      },
      {
        slug: 'check-data-usage',
        category: 'esim-data-plan',
        title: 'How to Check Your Data Usage',
        titleTh: 'วิธีตรวจสอบการใช้ข้อมูลของคุณ',
        description: 'Monitor your eSIM data consumption',
        descriptionTh: 'ติดตามการใช้ข้อมูล eSIM ของคุณ',
        tableOfContents: [
          { id: 'account-dashboard', title: 'Check via account dashboard', titleTh: 'ตรวจสอบผ่านแดชบอร์ดบัญชี' },
          { id: 'device-settings', title: 'Check via device settings', titleTh: 'ตรวจสอบผ่านการตั้งค่าอุปกรณ์' }
        ],
        content: `## Check via account dashboard {#account-dashboard}

The most accurate way to check your data usage:

1. Log into your Mobile11 account at mobile11.com
2. Go to "My eSIMs" section
3. Select your active eSIM
4. View your current data usage and remaining balance

**Dashboard shows:**
- Total data allocated
- Data used
- Data remaining
- Validity period
- Usage history

## Check via device settings {#device-settings}

**On iPhone:**
1. Go to Settings > Cellular
2. Scroll down to see "Cellular Data" usage
3. This shows usage since last reset

**On Android:**
1. Go to Settings > Connections > Data usage
2. Select your eSIM
3. View data consumption

**Note:** Device statistics may differ from actual usage. Always refer to your Mobile11 dashboard for accurate information.`,
        contentTh: `## ตรวจสอบผ่านแดชบอร์ดบัญชี {#account-dashboard}

วิธีที่แม่นยำที่สุดในการตรวจสอบการใช้ข้อมูล:

1. เข้าสู่ระบบบัญชี Mobile11 ที่ mobile11.com
2. ไปที่ส่วน "eSIM ของฉัน"
3. เลือก eSIM ที่ใช้งานอยู่
4. ดูการใช้ข้อมูลปัจจุบันและยอดคงเหลือ

**แดชบอร์ดแสดง:**
- ข้อมูลทั้งหมดที่ได้รับ
- ข้อมูลที่ใช้แล้ว
- ข้อมูลที่เหลือ
- ระยะเวลาใช้งาน
- ประวัติการใช้งาน

## ตรวจสอบผ่านการตั้งค่าอุปกรณ์ {#device-settings}

**บน iPhone:**
1. ไปที่ ตั้งค่า > เซลลูลาร์
2. เลื่อนลงเพื่อดูการใช้ "ข้อมูลเซลลูลาร์"
3. แสดงการใช้งานตั้งแต่รีเซ็ตล่าสุด

**บน Android:**
1. ไปที่ ตั้งค่า > การเชื่อมต่อ > การใช้ข้อมูล
2. เลือก eSIM ของคุณ
3. ดูการใช้ข้อมูล

**หมายเหตุ:** สถิติอุปกรณ์อาจแตกต่างจากการใช้งานจริง อ้างอิงแดชบอร์ด Mobile11 สำหรับข้อมูลที่ถูกต้อง`
      },

      // ==================== PAYMENTS & BILLING ====================
      {
        slug: 'accepted-payment-methods',
        category: 'payments-billing',
        title: 'What Payment Methods Are Accepted?',
        titleTh: 'วิธีการชำระเงินที่ยอมรับมีอะไรบ้าง?',
        description: 'All the ways you can pay for your Mobile11 eSIM',
        descriptionTh: 'ทุกวิธีที่คุณสามารถชำระเงินสำหรับ Mobile11 eSIM',
        tableOfContents: [
          { id: 'credit-cards', title: 'Credit & Debit Cards', titleTh: 'บัตรเครดิตและบัตรเดบิต' },
          { id: 'digital-wallets', title: 'Digital Wallets', titleTh: 'กระเป๋าเงินดิจิทัล' },
          { id: 'local-methods', title: 'Local Payment Methods', titleTh: 'วิธีชำระเงินท้องถิ่น' }
        ],
        content: `## Credit & Debit Cards {#credit-cards}

We accept all major credit and debit cards:

- ✓ Visa
- ✓ Mastercard
- ✓ American Express
- ✓ JCB
- ✓ UnionPay

**Security:**
- All transactions are encrypted
- 3D Secure verification supported
- No card details stored on our servers

## Digital Wallets {#digital-wallets}

Quick and secure payment options:

- ✓ Apple Pay
- ✓ Google Pay
- ✓ PayPal

**Mobile11 Money:**
- Use your earned cashback rewards
- Can be combined with other payment methods

## Local Payment Methods {#local-methods}

**Thailand:**
- PromptPay QR Payment
- Thai bank transfers

**Other regions:**
- Additional local payment methods may be available at checkout

Payment methods shown depend on your location and browser settings.`,
        contentTh: `## บัตรเครดิตและบัตรเดบิต {#credit-cards}

เรารับบัตรเครดิตและบัตรเดบิตหลักทุกประเภท:

- ✓ Visa
- ✓ Mastercard
- ✓ American Express
- ✓ JCB
- ✓ UnionPay

**ความปลอดภัย:**
- ธุรกรรมทั้งหมดถูกเข้ารหัส
- รองรับการยืนยัน 3D Secure
- ไม่เก็บข้อมูลบัตรบนเซิร์ฟเวอร์

## กระเป๋าเงินดิจิทัล {#digital-wallets}

ตัวเลือกการชำระเงินที่รวดเร็วและปลอดภัย:

- ✓ Apple Pay
- ✓ Google Pay
- ✓ PayPal

**Mobile11 Money:**
- ใช้รางวัลเงินคืนที่สะสม
- สามารถรวมกับวิธีชำระเงินอื่นได้

## วิธีชำระเงินท้องถิ่น {#local-methods}

**ประเทศไทย:**
- PromptPay QR Payment
- โอนเงินธนาคารไทย

**ภูมิภาคอื่น:**
- อาจมีวิธีชำระเงินท้องถิ่นเพิ่มเติมที่ checkout

วิธีชำระเงินที่แสดงขึ้นอยู่กับตำแหน่งและการตั้งค่าเบราว์เซอร์ของคุณ`
      },
      {
        slug: 'refund-policy',
        category: 'payments-billing',
        title: 'Refund Policy',
        titleTh: 'นโยบายการคืนเงิน',
        description: 'Understanding our refund and cancellation policy',
        descriptionTh: 'ทำความเข้าใจนโยบายการคืนเงินและยกเลิก',
        tableOfContents: [
          { id: 'eligible', title: 'When refunds are possible', titleTh: 'เมื่อใดที่คืนเงินได้' },
          { id: 'not-eligible', title: 'When refunds are not possible', titleTh: 'เมื่อใดที่คืนเงินไม่ได้' },
          { id: 'how-to-request', title: 'How to request a refund', titleTh: 'วิธีขอคืนเงิน' }
        ],
        content: `## When refunds are possible {#eligible}

**Full refunds available when:**
- eSIM has NOT been installed yet
- Technical issues prevent installation (verified by our team)
- Order was placed in error (within 24 hours)

**Partial refunds may be available:**
- eSIM didn't work as expected after troubleshooting
- Service issues in specific coverage areas

## When refunds are not possible {#not-eligible}

**Refunds are NOT available when:**
- eSIM has been installed and activated
- eSIM has been used (any data consumed)
- QR code has been revealed/downloaded
- More than 30 days since purchase

**Why?**
Once an eSIM is installed, it cannot be transferred to another device or user. The QR code becomes invalid after first use.

## How to request a refund {#how-to-request}

1. Contact our support team via live chat or email
2. Provide your order number
3. Explain the reason for refund request
4. Our team will review within 1-2 business days
5. Approved refunds are processed within 5-10 business days

**Refund method:**
Refunds are issued to the original payment method used for purchase.`,
        contentTh: `## เมื่อใดที่คืนเงินได้ {#eligible}

**คืนเงินเต็มจำนวนเมื่อ:**
- eSIM ยังไม่ได้ติดตั้ง
- ปัญหาทางเทคนิคทำให้ติดตั้งไม่ได้ (ยืนยันโดยทีมของเรา)
- สั่งซื้อผิดพลาด (ภายใน 24 ชั่วโมง)

**คืนเงินบางส่วนอาจเป็นไปได้:**
- eSIM ไม่ทำงานตามที่คาดหวังหลังแก้ปัญหา
- ปัญหาบริการในพื้นที่ครอบคลุมเฉพาะ

## เมื่อใดที่คืนเงินไม่ได้ {#not-eligible}

**ไม่สามารถคืนเงินได้เมื่อ:**
- eSIM ได้ติดตั้งและเปิดใช้งานแล้ว
- eSIM ถูกใช้แล้ว (ใช้ข้อมูลแล้ว)
- QR code ถูกเปิดเผย/ดาวน์โหลดแล้ว
- มากกว่า 30 วันหลังซื้อ

**ทำไม?**
เมื่อ eSIM ถูกติดตั้งแล้ว ไม่สามารถโอนไปยังอุปกรณ์หรือผู้ใช้อื่นได้ QR code จะใช้ไม่ได้หลังใช้ครั้งแรก

## วิธีขอคืนเงิน {#how-to-request}

1. ติดต่อทีมสนับสนุนผ่านแชทสดหรืออีเมล
2. ให้หมายเลขคำสั่งซื้อ
3. อธิบายเหตุผลในการขอคืนเงิน
4. ทีมของเราจะตรวจสอบภายใน 1-2 วันทำการ
5. การคืนเงินที่อนุมัติจะดำเนินการภายใน 5-10 วันทำการ

**วิธีการคืนเงิน:**
คืนเงินไปยังวิธีชำระเงินเดิมที่ใช้ซื้อ`
      },
      {
        slug: 'use-promo-code',
        category: 'payments-billing',
        title: 'How to Use a Promo Code',
        titleTh: 'วิธีใช้โปรโมโค้ด',
        description: 'Apply discount codes to your Mobile11 purchase',
        descriptionTh: 'ใช้รหัสส่วนลดกับการซื้อ Mobile11 ของคุณ',
        tableOfContents: [
          { id: 'apply-code', title: 'How to apply a promo code', titleTh: 'วิธีใช้โปรโมโค้ด' },
          { id: 'code-not-working', title: 'Code not working?', titleTh: 'โค้ดไม่ทำงาน?' }
        ],
        content: `## How to apply a promo code {#apply-code}

**During checkout:**
1. Add your eSIM to cart
2. Proceed to checkout
3. Look for "Promo Code" or "Discount Code" field
4. Enter your code exactly as received
5. Click "Apply"
6. Discount will be reflected in the total

**Important notes:**
- Promo codes are case-sensitive
- Only one promo code per order
- Cannot combine with some offers

## Code not working? {#code-not-working}

**Check these common issues:**

1. **Expiration:** Code may have expired
2. **Minimum purchase:** Some codes require minimum order value
3. **Product restrictions:** Code may only apply to specific eSIMs
4. **Already used:** Most codes are single-use
5. **Typos:** Ensure correct spelling with no spaces

**Still having issues?**
Contact our support team with:
- The promo code you're trying to use
- Screenshot of the error message
- Products in your cart`,
        contentTh: `## วิธีใช้โปรโมโค้ด {#apply-code}

**ระหว่าง checkout:**
1. เพิ่ม eSIM ลงตะกร้า
2. ดำเนินการ checkout
3. มองหาช่อง "โปรโมโค้ด" หรือ "รหัสส่วนลด"
4. ป้อนโค้ดตามที่ได้รับ
5. คลิก "ใช้"
6. ส่วนลดจะแสดงในยอดรวม

**หมายเหตุสำคัญ:**
- โปรโมโค้ดตรงตัวพิมพ์ใหญ่เล็ก
- ใช้ได้เพียงหนึ่งโปรโมโค้ดต่อคำสั่งซื้อ
- ไม่สามารถรวมกับข้อเสนอบางอย่าง

## โค้ดไม่ทำงาน? {#code-not-working}

**ตรวจสอบปัญหาเหล่านี้:**

1. **หมดอายุ:** โค้ดอาจหมดอายุแล้ว
2. **ยอดซื้อขั้นต่ำ:** โค้ดบางอันต้องการมูลค่าคำสั่งซื้อขั้นต่ำ
3. **ข้อจำกัดสินค้า:** โค้ดอาจใช้ได้กับ eSIM เฉพาะ
4. **ใช้แล้ว:** โค้ดส่วนใหญ่ใช้ได้ครั้งเดียว
5. **พิมพ์ผิด:** ตรวจสอบการสะกดที่ถูกต้องโดยไม่มีช่องว่าง

**ยังมีปัญหาอยู่?**
ติดต่อทีมสนับสนุนพร้อม:
- โปรโมโค้ดที่คุณพยายามใช้
- ภาพหน้าจอข้อความแสดงข้อผิดพลาด
- สินค้าในตะกร้า`
      },

      // ==================== ACCOUNT ====================
      {
        slug: 'create-account',
        category: 'account',
        title: 'How to Create a Mobile11 Account',
        titleTh: 'วิธีสร้างบัญชี Mobile11',
        description: 'Set up your Mobile11 account to manage your eSIMs',
        descriptionTh: 'ตั้งค่าบัญชี Mobile11 เพื่อจัดการ eSIM ของคุณ',
        tableOfContents: [
          { id: 'why-account', title: 'Why create an account?', titleTh: 'ทำไมต้องสร้างบัญชี?' },
          { id: 'how-to-create', title: 'How to sign up', titleTh: 'วิธีสมัคร' }
        ],
        content: `## Why create an account? {#why-account}

**Benefits of having an account:**
- View and manage all your eSIMs in one place
- Access your eSIM QR codes anytime
- Check data usage and validity
- Earn Mobile11 Money cashback on purchases
- Faster checkout for future purchases
- Order history and receipts

## How to sign up {#how-to-create}

**Option 1: During checkout**
1. When purchasing an eSIM, choose "Create Account"
2. Enter your email address
3. Set a password
4. Complete your purchase
5. Check email for verification link

**Option 2: Before purchasing**
1. Go to mobile11.com
2. Click "Sign Up" or "Create Account"
3. Enter your email address
4. Set a password
5. Verify your email address

**Password requirements:**
- At least 8 characters
- Mix of letters and numbers recommended

Your account is created instantly and you can start earning loyalty rewards!`,
        contentTh: `## ทำไมต้องสร้างบัญชี? {#why-account}

**ประโยชน์ของการมีบัญชี:**
- ดูและจัดการ eSIM ทั้งหมดในที่เดียว
- เข้าถึง QR code eSIM ได้ทุกเมื่อ
- ตรวจสอบการใช้ข้อมูลและอายุการใช้งาน
- รับเงินคืน Mobile11 Money จากการซื้อ
- checkout เร็วขึ้นสำหรับการซื้อในอนาคต
- ประวัติคำสั่งซื้อและใบเสร็จ

## วิธีสมัคร {#how-to-create}

**ตัวเลือกที่ 1: ระหว่าง checkout**
1. เมื่อซื้อ eSIM เลือก "สร้างบัญชี"
2. ป้อนที่อยู่อีเมล
3. ตั้งรหัสผ่าน
4. ดำเนินการซื้อให้เสร็จสิ้น
5. ตรวจสอบอีเมลสำหรับลิงก์ยืนยัน

**ตัวเลือกที่ 2: ก่อนซื้อ**
1. ไปที่ mobile11.com
2. คลิก "สมัคร" หรือ "สร้างบัญชี"
3. ป้อนที่อยู่อีเมล
4. ตั้งรหัสผ่าน
5. ยืนยันที่อยู่อีเมล

**ข้อกำหนดรหัสผ่าน:**
- อย่างน้อย 8 ตัวอักษร
- แนะนำให้ผสมตัวอักษรและตัวเลข

บัญชีของคุณถูกสร้างทันทีและคุณสามารถเริ่มสะสมรางวัลสมาชิกได้!`
      },
      {
        slug: 'reset-password',
        category: 'account',
        title: 'How to Reset Your Password',
        titleTh: 'วิธีรีเซ็ตรหัสผ่าน',
        description: 'Steps to recover access to your Mobile11 account',
        descriptionTh: 'ขั้นตอนการกู้คืนการเข้าถึงบัญชี Mobile11',
        tableOfContents: [
          { id: 'reset-steps', title: 'Password reset steps', titleTh: 'ขั้นตอนรีเซ็ตรหัสผ่าน' },
          { id: 'no-email', title: 'No reset email?', titleTh: 'ไม่ได้รับอีเมลรีเซ็ต?' }
        ],
        content: `## Password reset steps {#reset-steps}

1. Go to mobile11.com
2. Click "Sign In"
3. Click "Forgot Password?"
4. Enter your registered email address
5. Click "Send Reset Link"
6. Check your email inbox
7. Click the reset link (valid for 24 hours)
8. Enter your new password
9. Confirm new password
10. Click "Reset Password"

You can now sign in with your new password.

## No reset email? {#no-email}

**Check these first:**
- Look in your spam/junk folder
- Ensure you used the correct email address
- Wait a few minutes and try again

**Still no email?**
Contact our support team with:
- Your registered email address
- Proof of account ownership (order number, etc.)`,
        contentTh: `## ขั้นตอนรีเซ็ตรหัสผ่าน {#reset-steps}

1. ไปที่ mobile11.com
2. คลิก "เข้าสู่ระบบ"
3. คลิก "ลืมรหัสผ่าน?"
4. ป้อนอีเมลที่ลงทะเบียน
5. คลิก "ส่งลิงก์รีเซ็ต"
6. ตรวจสอบกล่องอีเมล
7. คลิกลิงก์รีเซ็ต (ใช้ได้ 24 ชั่วโมง)
8. ป้อนรหัสผ่านใหม่
9. ยืนยันรหัสผ่านใหม่
10. คลิก "รีเซ็ตรหัสผ่าน"

ตอนนี้คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่

## ไม่ได้รับอีเมลรีเซ็ต? {#no-email}

**ตรวจสอบก่อน:**
- ดูในโฟลเดอร์สแปม/ขยะ
- ตรวจสอบว่าใช้อีเมลที่ถูกต้อง
- รอสักครู่แล้วลองใหม่

**ยังไม่มีอีเมล?**
ติดต่อทีมสนับสนุนพร้อม:
- ที่อยู่อีเมลที่ลงทะเบียน
- หลักฐานความเป็นเจ้าของบัญชี (หมายเลขคำสั่งซื้อ ฯลฯ)`
      },
      {
        slug: 'what-is-loyalty-program',
        category: 'account',
        title: 'What is the Mobile11 Loyalty Program?',
        titleTh: 'โปรแกรมสะสมคะแนน Mobile11 คืออะไร?',
        description: 'Learn about our 3-tier loyalty program and how to earn rewards',
        descriptionTh: 'เรียนรู้เกี่ยวกับโปรแกรมสะสมคะแนน 3 ระดับและวิธีรับรางวัล',
        tableOfContents: [
          { id: 'overview', title: 'Program Overview', titleTh: 'ภาพรวมโปรแกรม' },
          { id: 'tiers', title: 'Loyalty Tiers', titleTh: 'ระดับสมาชิก' },
          { id: 'how-to-join', title: 'How to Join', titleTh: 'วิธีเข้าร่วม' },
          { id: 'using-rewards', title: 'Using Your Rewards', titleTh: 'การใช้รางวัล' }
        ],
        content: `## Program Overview {#overview}

The Mobile11 Loyalty Program rewards users for every eSIM purchase. Cashback rewards are credited as **Mobile11 Money** in your account.

**Key Benefits:**
- Automatic enrollment with your first purchase
- Earn cashback on every eSIM purchase
- Use Mobile11 Money to reduce future order costs
- 1-year validity on rewards (resets with every purchase)
- Higher tiers unlock better cashback rates

## Loyalty Tiers {#tiers}

| Tier | Cashback | Spending Required |
|------|----------|-------------------|
| 🌍 Explorer | 5% | $0 (Default) |
| ✈️ Silver Explorer | 10% | $100 USD |
| 🏆 Gold Explorer | 15% | $500 USD |

**Important:** Only real money spent counts towards tier progression. Mobile11 Money used at checkout does NOT count.

## How to Join {#how-to-join}

1. **Create an account** on Mobile11
2. **Make your first purchase** – automatically enrolled as Explorer
3. **Check your balance** in "Mobile11 Money" section

No separate signup required – just start shopping!

## Using Your Rewards {#using-rewards}

At checkout:
1. Your Mobile11 Money balance is shown
2. Choose how much to apply to your order
3. Pay the remaining balance with other methods

**Tips:**
- Mobile11 Money can partially or fully cover an order
- Combine with promo codes for maximum savings
- Balance resets validity with every purchase`,
        contentTh: `## ภาพรวมโปรแกรม {#overview}

โปรแกรมสะสมคะแนน Mobile11 ให้รางวัลผู้ใช้สำหรับทุกการซื้อ eSIM รางวัลเงินคืนจะถูกเครดิตเป็น **Mobile11 Money** ในบัญชีของคุณ

**สิทธิประโยชน์หลัก:**
- ลงทะเบียนอัตโนมัติเมื่อซื้อครั้งแรก
- รับเงินคืนทุกการซื้อ eSIM
- ใช้ Mobile11 Money ลดค่าใช้จ่ายในอนาคต
- รางวัลมีอายุ 1 ปี (รีเซ็ตทุกการซื้อ)
- ระดับสูงขึ้นได้เงินคืนมากขึ้น

## ระดับสมาชิก {#tiers}

| ระดับ | เงินคืน | ยอดใช้จ่าย |
|------|----------|-------------------|
| 🌍 Explorer | 5% | $0 (เริ่มต้น) |
| ✈️ Silver Explorer | 10% | $100 USD |
| 🏆 Gold Explorer | 15% | $500 USD |

**สำคัญ:** เฉพาะเงินจริงที่จ่ายเท่านั้นที่นับรวมในการเลื่อนระดับ Mobile11 Money ที่ใช้ที่ checkout ไม่นับ

## วิธีเข้าร่วม {#how-to-join}

1. **สร้างบัญชี** บน Mobile11
2. **ซื้อครั้งแรก** – ลงทะเบียนเป็น Explorer อัตโนมัติ
3. **ตรวจสอบยอดเงิน** ในส่วน "Mobile11 Money"

ไม่ต้องสมัครแยก – แค่เริ่มช้อปปิ้ง!

## การใช้รางวัล {#using-rewards}

ที่ checkout:
1. ยอด Mobile11 Money ของคุณจะแสดง
2. เลือกจำนวนที่ต้องการใช้กับคำสั่งซื้อ
3. ชำระยอดที่เหลือด้วยวิธีอื่น

**เคล็ดลับ:**
- Mobile11 Money สามารถครอบคลุมคำสั่งซื้อบางส่วนหรือทั้งหมด
- รวมกับโปรโมโค้ดเพื่อประหยัดสูงสุด
- ยอดเงินรีเซ็ตอายุทุกการซื้อ`
      },

      // ==================== ABOUT ESIM ====================
      {
        slug: 'what-is-esim',
        category: 'about-esim',
        title: 'What is an eSIM?',
        titleTh: 'eSIM คืออะไร?',
        description: 'Understanding eSIM technology',
        descriptionTh: 'ทำความเข้าใจเทคโนโลยี eSIM',
        tableOfContents: [
          { id: 'definition', title: 'eSIM definition', titleTh: 'ความหมายของ eSIM' },
          { id: 'benefits', title: 'Key benefits', titleTh: 'ประโยชน์หลัก' },
          { id: 'how-it-works', title: 'How eSIM works', titleTh: 'eSIM ทำงานอย่างไร' }
        ],
        content: `## eSIM definition {#definition}

An eSIM (embedded SIM) is a digital SIM that allows you to activate a cellular plan without using a physical SIM card. It's built into your device and can be programmed with carrier information remotely.

**Key characteristics:**
- Built directly into compatible devices
- Activated through QR code or app
- Can store multiple profiles
- No physical SIM card needed

## Key benefits {#benefits}

**For travelers:**
- Instant activation – no waiting for delivery
- No need to find local SIM vendors
- Keep your main number active
- Switch plans easily between countries

**Convenience:**
- No tiny SIM cards to lose
- No SIM ejector tool needed
- Quick setup process
- Environmentally friendly (no plastic)

## How eSIM works {#how-it-works}

1. **Purchase:** Buy an eSIM plan online
2. **Receive:** Get QR code via email instantly
3. **Install:** Scan QR code with your phone
4. **Activate:** eSIM downloads and configures automatically
5. **Connect:** Start using data in your destination

The whole process takes just a few minutes!`,
        contentTh: `## ความหมายของ eSIM {#definition}

eSIM (embedded SIM) คือ SIM ดิจิทัลที่ช่วยให้คุณเปิดใช้งานแผนเซลลูลาร์โดยไม่ต้องใช้ SIM การ์ดจริง มันถูกสร้างในอุปกรณ์ของคุณและสามารถโปรแกรมด้วยข้อมูลผู้ให้บริการทางไกล

**คุณสมบัติหลัก:**
- สร้างโดยตรงในอุปกรณ์ที่รองรับ
- เปิดใช้งานผ่าน QR code หรือแอป
- สามารถเก็บหลายโปรไฟล์
- ไม่ต้องใช้ SIM การ์ดจริง

## ประโยชน์หลัก {#benefits}

**สำหรับนักเดินทาง:**
- เปิดใช้งานทันที – ไม่ต้องรอจัดส่ง
- ไม่ต้องหาร้านขาย SIM ท้องถิ่น
- เก็บหมายเลขหลักให้ใช้งานได้
- สลับแผนระหว่างประเทศได้ง่าย

**ความสะดวก:**
- ไม่มี SIM การ์ดเล็กๆ ให้หาย
- ไม่ต้องใช้เครื่องมือดีด SIM
- กระบวนการตั้งค่าเร็ว
- เป็นมิตรกับสิ่งแวดล้อม (ไม่มีพลาสติก)

## eSIM ทำงานอย่างไร {#how-it-works}

1. **ซื้อ:** ซื้อแพ็คเกจ eSIM ออนไลน์
2. **รับ:** ได้รับ QR code ทางอีเมลทันที
3. **ติดตั้ง:** สแกน QR code ด้วยโทรศัพท์
4. **เปิดใช้งาน:** eSIM ดาวน์โหลดและกำหนดค่าอัตโนมัติ
5. **เชื่อมต่อ:** เริ่มใช้ข้อมูลในปลายทาง

กระบวนการทั้งหมดใช้เวลาเพียงไม่กี่นาที!`
      },
      {
        slug: 'is-my-phone-compatible',
        category: 'about-esim',
        title: 'Is my phone eSIM compatible?',
        titleTh: 'โทรศัพท์ของฉันรองรับ eSIM ไหม?',
        description: 'Check if your device supports eSIM',
        descriptionTh: 'ตรวจสอบว่าอุปกรณ์ของคุณรองรับ eSIM หรือไม่',
        tableOfContents: [
          { id: 'compatible-iphones', title: 'Compatible iPhones', titleTh: 'iPhone ที่รองรับ' },
          { id: 'compatible-android', title: 'Compatible Android', titleTh: 'Android ที่รองรับ' },
          { id: 'how-to-check', title: 'How to verify', titleTh: 'วิธีตรวจสอบ' }
        ],
        content: `## Compatible iPhones {#compatible-iphones}

**eSIM supported on:**
- iPhone XS, XS Max, XR and later
- iPhone SE (2nd generation and later)
- All iPhone 11, 12, 13, 14, 15, 16 models

**Note:** Device must be carrier-unlocked.

## Compatible Android phones {#compatible-android}

**Samsung:**
- Galaxy S20 and later
- Galaxy Note 20 and later
- Galaxy Z Fold/Flip series
- Galaxy A54 and later

**Google:**
- Pixel 3 and later
- Pixel Fold

**Other brands:**
- Xiaomi 12T Pro and select models
- Oppo Find X3 Pro and later
- Motorola Razr series

## How to verify {#how-to-check}

**On iPhone:**
1. Go to Settings > General > About
2. Look for "EID" number
3. If present, your phone supports eSIM

**On Android:**
1. Go to Settings > About Phone
2. Look for "EID" or "eSIM" option
3. Or dial *#06# to see EID

**Important:** Even if compatible, ensure your device is carrier-unlocked.`,
        contentTh: `## iPhone ที่รองรับ {#compatible-iphones}

**รองรับ eSIM บน:**
- iPhone XS, XS Max, XR และใหม่กว่า
- iPhone SE (รุ่นที่ 2 และใหม่กว่า)
- iPhone 11, 12, 13, 14, 15, 16 ทุกรุ่น

**หมายเหตุ:** อุปกรณ์ต้องปลดล็อคจากผู้ให้บริการ

## โทรศัพท์ Android ที่รองรับ {#compatible-android}

**Samsung:**
- Galaxy S20 และใหม่กว่า
- Galaxy Note 20 และใหม่กว่า
- Galaxy Z Fold/Flip ซีรีส์
- Galaxy A54 และใหม่กว่า

**Google:**
- Pixel 3 และใหม่กว่า
- Pixel Fold

**แบรนด์อื่น:**
- Xiaomi 12T Pro และบางรุ่น
- Oppo Find X3 Pro และใหม่กว่า
- Motorola Razr ซีรีส์

## วิธีตรวจสอบ {#how-to-check}

**บน iPhone:**
1. ไปที่ ตั้งค่า > ทั่วไป > เกี่ยวกับ
2. มองหาหมายเลข "EID"
3. ถ้ามี โทรศัพท์รองรับ eSIM

**บน Android:**
1. ไปที่ ตั้งค่า > เกี่ยวกับโทรศัพท์
2. มองหา "EID" หรือตัวเลือก "eSIM"
3. หรือกด *#06# เพื่อดู EID

**สำคัญ:** แม้จะรองรับ ต้องแน่ใจว่าอุปกรณ์ปลดล็อคจากผู้ให้บริการ`
      },

      // ==================== FAQ ====================
      {
        slug: 'how-long-activation',
        category: 'faq',
        title: 'How long does eSIM activation take?',
        titleTh: 'การเปิดใช้งาน eSIM ใช้เวลานานแค่ไหน?',
        description: 'Timeline for eSIM activation process',
        descriptionTh: 'ระยะเวลาสำหรับกระบวนการเปิดใช้งาน eSIM',
        tableOfContents: [
          { id: 'purchase', title: 'After purchase', titleTh: 'หลังซื้อ' },
          { id: 'installation', title: 'Installation time', titleTh: 'เวลาติดตั้ง' }
        ],
        content: `## After purchase {#purchase}

**Delivery time:**
- QR code delivered instantly via email
- Also available in your account dashboard
- No shipping delays

**Typical timeline:**
- Order confirmation: Immediate
- QR code delivery: Within 5 minutes
- Most deliveries: Under 1 minute

## Installation time {#installation}

**Installation process:**
- Scanning QR code: 10 seconds
- Profile download: 30-60 seconds
- Confirmation: Immediate

**Total installation:** 1-2 minutes

**Tip:** Install before you travel, activate when you arrive.`,
        contentTh: `## หลังซื้อ {#purchase}

**เวลาจัดส่ง:**
- QR code ส่งทันทีทางอีเมล
- มีในแดชบอร์ดบัญชีด้วย
- ไม่มีความล่าช้าในการจัดส่ง

**ไทม์ไลน์โดยทั่วไป:**
- ยืนยันคำสั่งซื้อ: ทันที
- ส่ง QR code: ภายใน 5 นาที
- ส่วนใหญ่: ต่ำกว่า 1 นาที

## เวลาติดตั้ง {#installation}

**กระบวนการติดตั้ง:**
- สแกน QR code: 10 วินาที
- ดาวน์โหลดโปรไฟล์: 30-60 วินาที
- ยืนยัน: ทันที

**ติดตั้งทั้งหมด:** 1-2 นาที

**เคล็ดลับ:** ติดตั้งก่อนเดินทาง เปิดใช้งานเมื่อถึง`
      },
      {
        slug: 'keep-phone-number',
        category: 'faq',
        title: 'Can I keep my phone number?',
        titleTh: 'ฉันสามารถใช้หมายเลขโทรศัพท์เดิมได้ไหม?',
        description: 'Using eSIM while keeping your original number',
        descriptionTh: 'การใช้ eSIM โดยเก็บหมายเลขเดิมไว้',
        tableOfContents: [
          { id: 'dual-sim', title: 'Dual SIM setup', titleTh: 'การตั้งค่า Dual SIM' },
          { id: 'configuration', title: 'Configuration', titleTh: 'การกำหนดค่า' }
        ],
        content: `## Dual SIM setup {#dual-sim}

Yes! You can keep your original phone number while using Mobile11 eSIM.

**How it works:**
- Your physical SIM: Keeps your home number
- Mobile11 eSIM: Provides data abroad
- Both work simultaneously

**Benefits:**
- Receive calls and SMS on your number
- Use affordable data from eSIM
- No need to share new number

## Configuration {#configuration}

**On iPhone:**
1. Settings > Cellular
2. Set "Default Voice Line" to your SIM
3. Set "Cellular Data" to eSIM

**On Android:**
1. Settings > SIM Manager
2. Set calls to your SIM
3. Set data to eSIM

**Note:** Your home SIM may incur roaming charges for calls/SMS. Consider using WhatsApp or LINE for calls.`,
        contentTh: `## การตั้งค่า Dual SIM {#dual-sim}

ได้! คุณสามารถเก็บหมายเลขโทรศัพท์เดิมไว้ขณะใช้ Mobile11 eSIM

**วิธีการทำงาน:**
- SIM จริงของคุณ: เก็บหมายเลขบ้าน
- Mobile11 eSIM: ให้ข้อมูลในต่างประเทศ
- ทั้งสองทำงานพร้อมกัน

**ประโยชน์:**
- รับสายและ SMS บนหมายเลขของคุณ
- ใช้ข้อมูลราคาถูกจาก eSIM
- ไม่ต้องแชร์หมายเลขใหม่

## การกำหนดค่า {#configuration}

**บน iPhone:**
1. ตั้งค่า > เซลลูลาร์
2. ตั้ง "สายเริ่มต้น" เป็น SIM ของคุณ
3. ตั้ง "ข้อมูลเซลลูลาร์" เป็น eSIM

**บน Android:**
1. ตั้งค่า > ตัวจัดการ SIM
2. ตั้งโทรเป็น SIM ของคุณ
3. ตั้งข้อมูลเป็น eSIM

**หมายเหตุ:** SIM บ้านของคุณอาจมีค่าโรมมิ่งสำหรับโทร/SMS พิจารณาใช้ WhatsApp หรือ LINE สำหรับโทร`
      },
      {
        slug: 'how-to-contact-support',
        category: 'faq',
        title: 'How do I contact Mobile11 support?',
        titleTh: 'ฉันจะติดต่อฝ่ายสนับสนุน Mobile11 ได้อย่างไร?',
        description: 'All the ways to reach our support team',
        descriptionTh: 'ทุกช่องทางในการติดต่อทีมสนับสนุนของเรา',
        tableOfContents: [
          { id: 'contact-methods', title: 'Contact methods', titleTh: 'วิธีการติดต่อ' },
          { id: 'response-times', title: 'Response times', titleTh: 'เวลาตอบกลับ' }
        ],
        content: `## Contact methods {#contact-methods}

**Live Chat (Recommended):**
- Available on our website
- Fastest response time
- Click the chat icon in the bottom right

**Email:**
- support@mobile11.com
- Include your order number
- Attach screenshots if relevant

**LINE:**
- @mobile11
- Popular in Thailand

## Response times {#response-times}

| Method | Typical Response |
|--------|------------------|
| Live Chat | 1-5 minutes |
| Email | 2-24 hours |
| LINE | 5-30 minutes |

**Before contacting:**
- Have your order number ready
- Note your device model
- Describe steps you've already tried`,
        contentTh: `## วิธีการติดต่อ {#contact-methods}

**แชทสด (แนะนำ):**
- มีบนเว็บไซต์ของเรา
- เวลาตอบกลับเร็วที่สุด
- คลิกไอคอนแชทที่มุมขวาล่าง

**อีเมล:**
- support@mobile11.com
- รวมหมายเลขคำสั่งซื้อ
- แนบภาพหน้าจอหากเกี่ยวข้อง

**LINE:**
- @mobile11
- ยอดนิยมในประเทศไทย

## เวลาตอบกลับ {#response-times}

| วิธี | เวลาตอบกลับโดยทั่วไป |
|--------|------------------|
| แชทสด | 1-5 นาที |
| อีเมล | 2-24 ชั่วโมง |
| LINE | 5-30 นาที |

**ก่อนติดต่อ:**
- เตรียมหมายเลขคำสั่งซื้อ
- จดรุ่นอุปกรณ์
- อธิบายขั้นตอนที่คุณลองแล้ว`
      },
      // ==================== ADDITIONAL TROUBLESHOOT ARTICLES ====================
      {
        slug: 'access-internet-google-pixel',
        category: 'troubleshoot',
        title: 'How do I access the internet on a Google Pixel device?',
        titleTh: 'วิธีเข้าถึงอินเทอร์เน็ตบน Google Pixel',
        description: 'Step-by-step guide to enable internet on Google Pixel after eSIM installation',
        descriptionTh: 'คู่มือขั้นตอนการเปิดใช้อินเทอร์เน็ตบน Google Pixel หลังติดตั้ง eSIM',
        tableOfContents: [
          { id: 'enable-esim', title: 'Enable your eSIM line', titleTh: 'เปิดใช้งานสาย eSIM' },
          { id: 'connect-network', title: 'Connect to network', titleTh: 'เชื่อมต่อเครือข่าย' },
          { id: 'apn-settings', title: 'Update APN settings', titleTh: 'อัปเดตการตั้งค่า APN' },
          { id: 'data-roaming', title: 'Enable Data Roaming', titleTh: 'เปิดโรมมิ่งข้อมูล' }
        ],
        content: `## Enable your eSIM line {#enable-esim}

1. Go to **Settings**
2. Go to **Network & internet**
3. Tap **SIMs**
4. Ensure that the eSIM is enabled. If not, toggle it **ON**
5. Toggle ON **Mobile data**

## Connect to the supported network {#connect-network}

1. Go to **Settings**
2. Go to **Network & internet**
3. Tap **SIMs**
4. Tap your **eSIM**
5. Disable **Automatically select network**
6. Select the network specified in your eSIM's installation instructions

## Update APN settings (if necessary) {#apn-settings}

Most eSIMs configure APN automatically. If you need to set it manually:

1. Go to **Settings > Network & internet > SIMs**
2. Tap your **eSIM**
3. Tap **Access Point Names**
4. Tap the **+** icon
5. Enter the new **APN** in the APN field (check your installation email)
6. Enter **Mobile11** as the APN's label
7. Leave other fields blank
8. Tap the **three-dot menu** > **Save**
9. Ensure the added APN is selected

## Enable Data Roaming {#data-roaming}

**Important:** Data Roaming MUST be enabled for your eSIM to work abroad.

1. Go to **Settings > Network & internet > SIMs**
2. Tap your **eSIM**
3. Toggle **Roaming** ON`,
        contentTh: `## เปิดใช้งานสาย eSIM {#enable-esim}

1. ไปที่ **Settings**
2. ไปที่ **Network & internet**
3. แตะ **SIMs**
4. ตรวจสอบว่า eSIM เปิดอยู่ ถ้าไม่ให้เปิด
5. เปิด **Mobile data**

## เชื่อมต่อเครือข่ายที่รองรับ {#connect-network}

1. ไปที่ **Settings**
2. ไปที่ **Network & internet**
3. แตะ **SIMs**
4. แตะ **eSIM** ของคุณ
5. ปิด **Automatically select network**
6. เลือกเครือข่ายตามคำแนะนำการติดตั้ง eSIM

## อัปเดตการตั้งค่า APN (ถ้าจำเป็น) {#apn-settings}

eSIM ส่วนใหญ่ตั้งค่า APN อัตโนมัติ หากต้องตั้งค่าเอง:

1. ไปที่ **Settings > Network & internet > SIMs**
2. แตะ **eSIM** ของคุณ
3. แตะ **Access Point Names**
4. แตะไอคอน **+**
5. ใส่ **APN** ใหม่ในช่อง APN (ดูจากอีเมลการติดตั้ง)
6. ใส่ **Mobile11** เป็นชื่อ APN
7. เว้นช่องอื่นว่างไว้
8. แตะ **เมนู 3 จุด** > **Save**
9. ตรวจสอบว่าเลือก APN ที่เพิ่มแล้ว

## เปิดโรมมิ่งข้อมูล {#data-roaming}

**สำคัญ:** ต้องเปิดโรมมิ่งข้อมูลเพื่อให้ eSIM ใช้งานได้ในต่างประเทศ

1. ไปที่ **Settings > Network & internet > SIMs**
2. แตะ **eSIM** ของคุณ
3. เปิด **Roaming**`
      },
      {
        slug: 'access-internet-samsung-galaxy',
        category: 'troubleshoot',
        title: 'How do I access the internet on a Samsung Galaxy device?',
        titleTh: 'วิธีเข้าถึงอินเทอร์เน็ตบน Samsung Galaxy',
        description: 'Step-by-step guide to enable internet on Samsung Galaxy after eSIM installation',
        descriptionTh: 'คู่มือขั้นตอนการเปิดใช้อินเทอร์เน็ตบน Samsung Galaxy หลังติดตั้ง eSIM',
        tableOfContents: [
          { id: 'enable-esim', title: 'Enable your eSIM line', titleTh: 'เปิดใช้งานสาย eSIM' },
          { id: 'connect-network', title: 'Connect to network', titleTh: 'เชื่อมต่อเครือข่าย' },
          { id: 'apn-settings', title: 'Update APN settings', titleTh: 'อัปเดตการตั้งค่า APN' },
          { id: 'data-roaming', title: 'Enable Data Roaming', titleTh: 'เปิดโรมมิ่งข้อมูล' }
        ],
        content: `## Enable your eSIM line {#enable-esim}

1. Go to **Settings**
2. Go to **Connections**
3. Tap **SIM manager** (or SIM card manager)
4. Ensure that your eSIM is enabled. If not, toggle it **ON**
5. Tap **Mobile data** and select your **eSIM**

## Connect to the supported network {#connect-network}

1. Go to **Settings > Connections**
2. Tap **Mobile networks**
3. Tap **Network operators**
4. Disable **Select automatically**
5. Select the network specified in your eSIM's installation instructions

## Update APN settings (if necessary) {#apn-settings}

1. Go to **Settings > Connections > Mobile networks**
2. Tap **Access Point Names**
3. Tap **Add** or the **+** icon
4. Enter the new **APN** in the APN field
5. Enter **Mobile11** as the Name
6. Leave other fields blank
7. Tap **Save** (three-dot menu)
8. Select the new APN

## Enable Data Roaming {#data-roaming}

**Important:** Data Roaming is required for international eSIM use.

1. Go to **Settings > Connections > Mobile networks**
2. Toggle **Data roaming** ON`,
        contentTh: `## เปิดใช้งานสาย eSIM {#enable-esim}

1. ไปที่ **Settings**
2. ไปที่ **Connections**
3. แตะ **SIM manager**
4. ตรวจสอบว่า eSIM เปิดอยู่ ถ้าไม่ให้เปิด
5. แตะ **Mobile data** และเลือก **eSIM**

## เชื่อมต่อเครือข่ายที่รองรับ {#connect-network}

1. ไปที่ **Settings > Connections**
2. แตะ **Mobile networks**
3. แตะ **Network operators**
4. ปิด **Select automatically**
5. เลือกเครือข่ายตามคำแนะนำการติดตั้ง eSIM

## อัปเดตการตั้งค่า APN (ถ้าจำเป็น) {#apn-settings}

1. ไปที่ **Settings > Connections > Mobile networks**
2. แตะ **Access Point Names**
3. แตะ **Add** หรือไอคอน **+**
4. ใส่ **APN** ใหม่ในช่อง APN
5. ใส่ **Mobile11** เป็นชื่อ
6. เว้นช่องอื่นว่างไว้
7. แตะ **Save**
8. เลือก APN ใหม่

## เปิดโรมมิ่งข้อมูล {#data-roaming}

**สำคัญ:** ต้องเปิดโรมมิ่งข้อมูลสำหรับการใช้ eSIM ในต่างประเทศ

1. ไปที่ **Settings > Connections > Mobile networks**
2. เปิด **Data roaming**`
      },
      {
        slug: 'access-internet-ios',
        category: 'troubleshoot',
        title: 'How do I access the internet on an iPhone (iOS)?',
        titleTh: 'วิธีเข้าถึงอินเทอร์เน็ตบน iPhone (iOS)',
        description: 'Step-by-step guide to enable internet on iPhone after eSIM installation',
        descriptionTh: 'คู่มือขั้นตอนการเปิดใช้อินเทอร์เน็ตบน iPhone หลังติดตั้ง eSIM',
        tableOfContents: [
          { id: 'enable-esim', title: 'Enable eSIM for data', titleTh: 'เปิด eSIM สำหรับข้อมูล' },
          { id: 'connect-network', title: 'Connect to network', titleTh: 'เชื่อมต่อเครือข่าย' },
          { id: 'apn-settings', title: 'Update APN settings', titleTh: 'อัปเดตการตั้งค่า APN' },
          { id: 'data-roaming', title: 'Enable Data Roaming', titleTh: 'เปิดโรมมิ่งข้อมูล' }
        ],
        content: `## Enable your eSIM for data {#enable-esim}

1. Go to **Settings**
2. Tap **Cellular** (or Mobile Data)
3. Tap **Cellular Data** (or Mobile Data)
4. Select your **Mobile11 eSIM** as the data line
5. Return to Cellular settings and ensure your eSIM line is **ON**

## Connect to the supported network {#connect-network}

1. Go to **Settings > Cellular**
2. Tap your **eSIM** line
3. Tap **Network Selection**
4. Turn OFF **Automatic**
5. Select the network specified in your installation instructions

## Update APN settings (if necessary) {#apn-settings}

1. Go to **Settings > Cellular**
2. Tap your **eSIM** line
3. Tap **Cellular Data Network**
4. In the **Cellular Data** section, enter the APN from your installation email
5. Leave other fields blank unless specified

## Enable Data Roaming {#data-roaming}

**Critical:** Data Roaming MUST be ON for your eSIM to work in another country.

1. Go to **Settings > Cellular**
2. Tap your **eSIM** line
3. Toggle **Data Roaming** ON

**Note:** You will not be charged extra roaming fees by Mobile11. The roaming is included in your plan.`,
        contentTh: `## เปิดใช้งาน eSIM สำหรับข้อมูล {#enable-esim}

1. ไปที่ **Settings**
2. แตะ **Cellular** (หรือ Mobile Data)
3. แตะ **Cellular Data** (หรือ Mobile Data)
4. เลือก **Mobile11 eSIM** เป็นสายข้อมูล
5. กลับไปที่ Cellular และตรวจสอบว่าสาย eSIM **เปิด** อยู่

## เชื่อมต่อเครือข่ายที่รองรับ {#connect-network}

1. ไปที่ **Settings > Cellular**
2. แตะสาย **eSIM** ของคุณ
3. แตะ **Network Selection**
4. ปิด **Automatic**
5. เลือกเครือข่ายตามคำแนะนำการติดตั้ง

## อัปเดตการตั้งค่า APN (ถ้าจำเป็น) {#apn-settings}

1. ไปที่ **Settings > Cellular**
2. แตะสาย **eSIM** ของคุณ
3. แตะ **Cellular Data Network**
4. ในส่วน **Cellular Data** ใส่ APN จากอีเมลการติดตั้ง
5. เว้นช่องอื่นว่างไว้ ยกเว้นมีระบุ

## เปิดโรมมิ่งข้อมูล {#data-roaming}

**สำคัญมาก:** ต้องเปิดโรมมิ่งข้อมูลเพื่อให้ eSIM ใช้งานได้ในต่างประเทศ

1. ไปที่ **Settings > Cellular**
2. แตะสาย **eSIM** ของคุณ
3. เปิด **Data Roaming**

**หมายเหตุ:** คุณจะไม่ถูกเรียกเก็บค่าโรมมิ่งเพิ่มจาก Mobile11 โรมมิ่งรวมอยู่ในแพ็กเกจแล้ว`
      },
      {
        slug: 'unable-to-complete-cellular-plan-change',
        category: 'troubleshoot',
        title: '"Unable to Complete Cellular Plan Change" Error',
        titleTh: 'ข้อผิดพลาด "Unable to Complete Cellular Plan Change"',
        description: 'How to fix the cellular plan change error on iOS',
        descriptionTh: 'วิธีแก้ไขข้อผิดพลาดการเปลี่ยนแผนเซลลูลาร์บน iOS',
        tableOfContents: [
          { id: 'causes', title: 'Common causes', titleTh: 'สาเหตุที่พบบ่อย' },
          { id: 'solutions', title: 'Solutions', titleTh: 'วิธีแก้ไข' }
        ],
        content: `## Common causes {#causes}

The **"Unable to Complete Cellular Plan Change"** error can occur for several reasons:

1. **Too many eSIMs installed** - iPhones can store 8-10 eSIM profiles max
2. **Cellular data is disabled** - eSIM installation requires internet
3. **eSIM already installed** - You may have already scanned this QR code
4. **Poor internet connection** - Installation requires stable WiFi

## Solutions {#solutions}

### 1. Delete unused eSIMs
1. Go to **Settings > Cellular**
2. Tap on any unused eSIM
3. Tap **Delete eSIM**
4. Try installing again

### 2. Enable cellular/WiFi
Make sure you have a stable internet connection:
- Connect to reliable WiFi
- Or enable Mobile Data on another SIM

### 3. Check if already installed
1. Go to **Settings > Cellular**
2. Look for your Mobile11 eSIM in the list
3. If it's there, you just need to enable it

### 4. Use manual installation
If QR scanning fails:
1. Go to **Settings > Cellular > Add eSIM**
2. Tap **Enter Details Manually**
3. Enter the SM-DP+ address and activation code from your email`,
        contentTh: `## สาเหตุที่พบบ่อย {#causes}

ข้อผิดพลาด **"Unable to Complete Cellular Plan Change"** อาจเกิดจาก:

1. **ติดตั้ง eSIM มากเกินไป** - iPhone เก็บโปรไฟล์ eSIM ได้สูงสุด 8-10 โปรไฟล์
2. **ข้อมูลเซลลูลาร์ปิดอยู่** - การติดตั้ง eSIM ต้องใช้อินเทอร์เน็ต
3. **eSIM ติดตั้งแล้ว** - คุณอาจสแกน QR code นี้ไปแล้ว
4. **การเชื่อมต่ออินเทอร์เน็ตไม่ดี** - การติดตั้งต้องใช้ WiFi ที่เสถียร

## วิธีแก้ไข {#solutions}

### 1. ลบ eSIM ที่ไม่ใช้
1. ไปที่ **Settings > Cellular**
2. แตะ eSIM ที่ไม่ใช้
3. แตะ **Delete eSIM**
4. ลองติดตั้งอีกครั้ง

### 2. เปิดใช้งาน cellular/WiFi
ตรวจสอบว่าคุณมีการเชื่อมต่ออินเทอร์เน็ตที่เสถียร

### 3. ตรวจสอบว่าติดตั้งแล้วหรือไม่
1. ไปที่ **Settings > Cellular**
2. มองหา Mobile11 eSIM ในรายการ
3. ถ้ามีอยู่แล้ว คุณแค่ต้องเปิดใช้งาน

### 4. ใช้การติดตั้งแบบ manual
ถ้าสแกน QR ไม่ได้:
1. ไปที่ **Settings > Cellular > Add eSIM**
2. แตะ **Enter Details Manually**
3. ใส่ SM-DP+ address และ activation code จากอีเมล`
      },
      {
        slug: 'pdp-authentication-failure',
        category: 'troubleshoot',
        title: '"PDP Authentication Failure" Error',
        titleTh: 'ข้อผิดพลาด "PDP Authentication Failure"',
        description: 'How to fix PDP Authentication Failure error on your eSIM',
        descriptionTh: 'วิธีแก้ไขข้อผิดพลาด PDP Authentication Failure บน eSIM',
        tableOfContents: [
          { id: 'what-is', title: 'What is this error?', titleTh: 'ข้อผิดพลาดนี้คืออะไร?' },
          { id: 'fixes', title: 'How to fix', titleTh: 'วิธีแก้ไข' }
        ],
        content: `## What is PDP Authentication Failure? {#what-is}

PDP (Packet Data Protocol) Authentication Failure means your device cannot establish a data connection with the network. This is usually related to APN or network configuration issues.

**Common causes:**
1. Incorrect APN settings
2. No remaining data
3. Wrong network selected
4. Network congestion

## How to fix {#fixes}

### Step 1: Check APN settings
- APN should be **lowercase**, **one word**, no spaces
- Check your installation email for the correct APN

### Step 2: Verify remaining data
- Check your data balance in your Mobile11 account
- If data is exhausted, purchase a top-up

### Step 3: Toggle Airplane Mode
1. Turn Airplane Mode **ON**
2. Wait 10 seconds
3. Turn Airplane Mode **OFF**

### Step 4: Reset Network Settings (last resort)
**Warning:** This will delete saved WiFi passwords.

**On iPhone:**
Settings > General > Transfer or Reset > Reset > Reset Network Settings

**On Android:**
Settings > General Management > Reset > Reset Network Settings`,
        contentTh: `## PDP Authentication Failure คืออะไร? {#what-is}

PDP (Packet Data Protocol) Authentication Failure หมายความว่าอุปกรณ์ของคุณไม่สามารถสร้างการเชื่อมต่อข้อมูลกับเครือข่ายได้ มักเกี่ยวข้องกับปัญหาการตั้งค่า APN หรือเครือข่าย

**สาเหตุที่พบบ่อย:**
1. การตั้งค่า APN ไม่ถูกต้อง
2. data หมด
3. เลือกเครือข่ายผิด
4. เครือข่ายหนาแน่น

## วิธีแก้ไข {#fixes}

### ขั้นตอนที่ 1: ตรวจสอบการตั้งค่า APN
- APN ควรเป็น **ตัวพิมพ์เล็ก**, **คำเดียว**, ไม่มีช่องว่าง
- ดู APN ที่ถูกต้องจากอีเมลการติดตั้ง

### ขั้นตอนที่ 2: ตรวจสอบ data ที่เหลือ
- ตรวจสอบยอด data ในบัญชี Mobile11
- ถ้า data หมด ให้ซื้อ top-up

### ขั้นตอนที่ 3: เปิด-ปิดโหมดเครื่องบิน
1. เปิดโหมดเครื่องบิน
2. รอ 10 วินาที
3. ปิดโหมดเครื่องบิน

### ขั้นตอนที่ 4: รีเซ็ตการตั้งค่าเครือข่าย (วิธีสุดท้าย)
**คำเตือน:** จะลบรหัสผ่าน WiFi ที่บันทึกไว้

**บน iPhone:**
Settings > General > Transfer or Reset > Reset > Reset Network Settings

**บน Android:**
Settings > General Management > Reset > Reset Network Settings`
      },
      {
        slug: 'esim-not-working',
        category: 'troubleshoot',
        title: 'Why Is My eSIM Not Working?',
        titleTh: 'ทำไม eSIM ของฉันไม่ทำงาน?',
        description: 'Master troubleshooting guide for when your eSIM is not connecting',
        descriptionTh: 'คู่มือแก้ปัญหาครบวงจรเมื่อ eSIM ไม่เชื่อมต่อ',
        tableOfContents: [
          { id: 'verify-install', title: 'Verify installation', titleTh: 'ยืนยันการติดตั้ง' },
          { id: 'basic-steps', title: 'Basic troubleshooting', titleTh: 'การแก้ปัญหาเบื้องต้น' },
          { id: 'advanced', title: 'Advanced steps', titleTh: 'ขั้นตอนขั้นสูง' }
        ],
        content: `## Verify installation {#verify-install}

First, confirm your eSIM is properly installed:

**On iPhone:** Settings > Cellular > Check for your eSIM line
**On Android:** Settings > Network & internet > SIMs

## Basic troubleshooting {#basic-steps}

Try these steps in order:

### 1. Enable Data Roaming ⚠️
**This is the #1 most common fix!**
- iPhone: Settings > Cellular > [eSIM] > Data Roaming ON
- Android: Settings > Connections > Mobile networks > Data roaming ON

### 2. Select eSIM for Mobile Data
Make sure your Mobile11 eSIM is selected as the data line.

### 3. Toggle Airplane Mode
Turn ON for 10 seconds, then turn OFF.

### 4. Restart Device
A full restart often resolves connection issues.

## Advanced steps {#advanced}

### 5. Manual Network Selection
Disable automatic network and choose a supported network manually.

### 6. Check APN Settings
Most eSIMs auto-configure, but check your email if issues persist.

### 7. Reset Network Settings (Last Resort)
This will delete saved WiFi passwords but often fixes stubborn issues.

**Still not working?** Contact our support team with your order number and device model.`,
        contentTh: `## ยืนยันการติดตั้ง {#verify-install}

ก่อนอื่น ยืนยันว่า eSIM ติดตั้งถูกต้อง:

**บน iPhone:** Settings > Cellular > ตรวจสอบสาย eSIM
**บน Android:** Settings > Network & internet > SIMs

## การแก้ปัญหาเบื้องต้น {#basic-steps}

ลองทำตามขั้นตอนเหล่านี้ตามลำดับ:

### 1. เปิดโรมมิ่งข้อมูล ⚠️
**นี่คือวิธีแก้ที่พบบ่อยที่สุด!**
- iPhone: Settings > Cellular > [eSIM] > Data Roaming ON
- Android: Settings > Connections > Mobile networks > Data roaming ON

### 2. เลือก eSIM สำหรับข้อมูลมือถือ
ตรวจสอบว่าเลือก Mobile11 eSIM เป็นสายข้อมูล

### 3. เปิด-ปิดโหมดเครื่องบิน
เปิด 10 วินาที แล้วปิด

### 4. รีสตาร์ทอุปกรณ์
การรีสตาร์ทมักแก้ปัญหาการเชื่อมต่อได้

## ขั้นตอนขั้นสูง {#advanced}

### 5. เลือกเครือข่ายด้วยตนเอง
ปิดการเลือกอัตโนมัติและเลือกเครือข่ายที่รองรับ

### 6. ตรวจสอบการตั้งค่า APN
eSIM ส่วนใหญ่ตั้งค่าอัตโนมัติ แต่ตรวจสอบอีเมลถ้ายังมีปัญหา

### 7. รีเซ็ตการตั้งค่าเครือข่าย (วิธีสุดท้าย)
จะลบรหัสผ่าน WiFi แต่มักแก้ปัญหาที่ยากได้

**ยังไม่ทำงาน?** ติดต่อทีมสนับสนุนพร้อมหมายเลขออเดอร์และรุ่นอุปกรณ์`
      },
      {
        slug: 'esim-internet-slow',
        category: 'troubleshoot',
        title: 'Why Is My eSIM Internet So Slow?',
        titleTh: 'ทำไมอินเทอร์เน็ต eSIM ถึงช้า?',
        description: 'Troubleshooting slow data speeds on your eSIM',
        descriptionTh: 'การแก้ปัญหาความเร็วข้อมูลช้าบน eSIM',
        tableOfContents: [
          { id: 'causes', title: 'Common causes', titleTh: 'สาเหตุที่พบบ่อย' },
          { id: 'fixes', title: 'How to improve speed', titleTh: 'วิธีปรับปรุงความเร็ว' }
        ],
        content: `## Common causes {#causes}

Slow internet on your eSIM can be caused by:

1. **Network coverage** - Weak signal in your area
2. **Network congestion** - Too many users on the network
3. **Data throttling** - Some plans reduce speed after high-speed quota
4. **Wrong network** - Connected to a suboptimal carrier
5. **Device settings** - Incorrect network mode

## How to improve speed {#fixes}

### 1. Check your data balance
- Log into your Mobile11 account
- For Day Pass plans: High-speed resets every 24 hours

### 2. Reset your connection
Toggle Airplane Mode ON then OFF.

### 3. Try manual network selection
Switch to a different supported carrier for potentially better speeds.

### 4. Switch to 4G/LTE
Sometimes forcing 4G instead of 5G provides more stable speeds:
- iPhone: Settings > Cellular > [eSIM] > Voice & Data > LTE

### 5. Reset network settings (last resort)
**Warning:** This deletes saved WiFi passwords.

### 6. Update your device
Install the latest OS update for optimal network compatibility.`,
        contentTh: `## สาเหตุที่พบบ่อย {#causes}

อินเทอร์เน็ตช้าบน eSIM อาจเกิดจาก:

1. **พื้นที่ครอบคลุมเครือข่าย** - สัญญาณอ่อนในพื้นที่
2. **เครือข่ายหนาแน่น** - ผู้ใช้บนเครือข่ายมากเกินไป
3. **การจำกัดความเร็ว** - บางแพ็กเกจลดความเร็วหลังโควต้าความเร็วสูง
4. **เครือข่ายผิด** - เชื่อมต่อกับค่ายที่ไม่เหมาะสม
5. **การตั้งค่าอุปกรณ์** - โหมดเครือข่ายไม่ถูกต้อง

## วิธีปรับปรุงความเร็ว {#fixes}

### 1. ตรวจสอบยอด data
- ล็อกอินเข้าบัญชี Mobile11
- สำหรับแพ็กเกจ Day Pass: ความเร็วสูงรีเซ็ตทุก 24 ชม.

### 2. รีเซ็ตการเชื่อมต่อ
เปิด-ปิดโหมดเครื่องบิน

### 3. ลองเลือกเครือข่ายด้วยตนเอง
เปลี่ยนไปใช้ค่ายอื่นที่รองรับเพื่อความเร็วที่ดีกว่า

### 4. เปลี่ยนเป็น 4G/LTE
บางครั้งการใช้ 4G แทน 5G ให้ความเร็วเสถียรกว่า

### 5. รีเซ็ตการตั้งค่าเครือข่าย (วิธีสุดท้าย)
**คำเตือน:** จะลบรหัสผ่าน WiFi

### 6. อัปเดตอุปกรณ์
ติดตั้ง OS อัปเดตล่าสุด`
      },
      {
        slug: 'cant-scan-qr-code',
        category: 'troubleshoot',
        title: "I Can't Scan My QR Code",
        titleTh: 'สแกน QR Code ไม่ได้',
        description: 'Solutions when QR code scanning fails and how to install manually',
        descriptionTh: 'วิธีแก้เมื่อสแกน QR code ไม่ได้และวิธีติดตั้งด้วยตัวเอง',
        tableOfContents: [
          { id: 'tips', title: 'QR scanning tips', titleTh: 'เคล็ดลับการสแกน QR' },
          { id: 'manual-ios', title: 'Manual installation (iOS)', titleTh: 'การติดตั้ง manual (iOS)' },
          { id: 'manual-android', title: 'Manual installation (Android)', titleTh: 'การติดตั้ง manual (Android)' }
        ],
        content: `## QR scanning tips {#tips}

Before trying manual installation, ensure:

1. **Display QR on another device** - Don't try to scan from the same phone
2. **Good lighting** - Not too bright, not too dark
3. **Stable WiFi connection** - Required for installation
4. **Clean camera lens** - Wipe with soft cloth
5. **Correct distance** - Not too close, not too far

## Manual installation (iOS) {#manual-ios}

1. Go to **Settings**
2. Tap **Cellular**
3. Tap **Add eSIM**
4. Tap **Enter Details Manually**
5. Enter the **SM-DP+ Address** and **Activation Code** from your email
6. Tap **Next** and follow prompts

## Manual installation (Android) {#manual-android}

### On Samsung:
1. Go to **Settings > Connections > SIM manager**
2. Tap **Add eSIM**
3. Tap **Enter activation code**
4. Enter the SM-DP+ Address and Activation Code

### On Google Pixel:
1. Go to **Settings > Network & internet > SIMs**
2. Tap **Add** or **+**
3. Select **Don't have a QR code?**
4. Enter the SM-DP+ Address and Activation Code`,
        contentTh: `## เคล็ดลับการสแกน QR {#tips}

ก่อนลองติดตั้งแบบ manual ตรวจสอบ:

1. **แสดง QR บนอุปกรณ์อื่น** - อย่าสแกนจากโทรศัพท์เครื่องเดียวกัน
2. **แสงดี** - ไม่สว่างเกินไป ไม่มืดเกินไป
3. **การเชื่อมต่อ WiFi เสถียร** - จำเป็นสำหรับการติดตั้ง
4. **เลนส์กล้องสะอาด** - เช็ดด้วยผ้านุ่ม
5. **ระยะทางที่เหมาะสม** - ไม่ใกล้เกินไป ไม่ไกลเกินไป

## การติดตั้ง manual (iOS) {#manual-ios}

1. ไปที่ **Settings**
2. แตะ **Cellular**
3. แตะ **Add eSIM**
4. แตะ **Enter Details Manually**
5. ใส่ **SM-DP+ Address** และ **Activation Code** จากอีเมล
6. แตะ **Next** และทำตามขั้นตอน

## การติดตั้ง manual (Android) {#manual-android}

### บน Samsung:
1. ไปที่ **Settings > Connections > SIM manager**
2. แตะ **Add eSIM**
3. แตะ **Enter activation code**
4. ใส่ SM-DP+ Address และ Activation Code

### บน Google Pixel:
1. ไปที่ **Settings > Network & internet > SIMs**
2. แตะ **Add** หรือ **+**
3. เลือก **Don't have a QR code?**
4. ใส่ SM-DP+ Address และ Activation Code`
      },
      {
        slug: 'device-carrier-locked',
        category: 'troubleshoot',
        title: 'What Can I Do If My Device Is Carrier-Locked?',
        titleTh: 'จะทำอย่างไรถ้าอุปกรณ์ถูกล็อคกับค่าย?',
        description: 'Understanding carrier lock and how to unlock your device',
        descriptionTh: 'ทำความเข้าใจการล็อคกับค่ายและวิธีปลดล็อคอุปกรณ์',
        tableOfContents: [
          { id: 'what-is', title: 'What is carrier lock?', titleTh: 'การล็อคกับค่ายคืออะไร?' },
          { id: 'how-unlock', title: 'How to unlock', titleTh: 'วิธีปลดล็อค' }
        ],
        content: `## What is carrier lock? {#what-is}

A carrier-locked device can only use SIM cards (including eSIM) from the original carrier. This is common with:
- Phones purchased on contract/payment plan
- Devices from certain carriers
- Some refurbished devices

**You cannot use Mobile11 eSIM on a carrier-locked device.**

## How to unlock {#how-unlock}

### Step 1: Check if locked
**iPhone:** Settings > General > About > Carrier Lock
**Android:** Settings > About phone > SIM lock status

### Step 2: Contact your carrier
- Call your carrier's customer service
- Request a device unlock
- Provide device IMEI

### Common requirements:
- Device fully paid off
- Account in good standing
- Minimum time with carrier (often 60-90 days)

### Step 3: Complete unlock
After approval, restart your device and try installing the eSIM.

**Note:** Mobile11 cannot unlock your device. Only your original carrier can do this.`,
        contentTh: `## การล็อคกับค่ายคืออะไร? {#what-is}

อุปกรณ์ที่ถูกล็อคกับค่ายสามารถใช้ซิมการ์ดได้เฉพาะจากค่ายเดิมเท่านั้น พบได้บ่อยกับ:
- โทรศัพท์ที่ซื้อแบบผ่อนชำระ
- อุปกรณ์จากค่ายบางค่าย
- อุปกรณ์ refurbished บางเครื่อง

**คุณไม่สามารถใช้ Mobile11 eSIM บนอุปกรณ์ที่ถูกล็อคกับค่าย**

## วิธีปลดล็อค {#how-unlock}

### ขั้นตอนที่ 1: ตรวจสอบว่าล็อคหรือไม่
**iPhone:** Settings > General > About > Carrier Lock
**Android:** Settings > About phone > SIM lock status

### ขั้นตอนที่ 2: ติดต่อค่ายของคุณ
- โทรหาศูนย์บริการลูกค้าของค่าย
- ขอปลดล็อคอุปกรณ์
- ให้ IMEI ของอุปกรณ์

### ข้อกำหนดทั่วไป:
- ชำระค่าเครื่องครบแล้ว
- บัญชีไม่มีปัญหา
- ระยะเวลาขั้นต่ำกับค่าย (มักจะ 60-90 วัน)

### ขั้นตอนที่ 3: ดำเนินการปลดล็อค
หลังอนุมัติ รีสตาร์ทอุปกรณ์และลองติดตั้ง eSIM

**หมายเหตุ:** Mobile11 ไม่สามารถปลดล็อคอุปกรณ์ของคุณได้ มีเพียงค่ายเดิมเท่านั้นที่ทำได้`
      },
      // ==================== ADDITIONAL ESIM-DATA-PLAN ARTICLES ====================
      {
        slug: 'can-i-reinstall-reuse-my-esim',
        category: 'esim-data-plan',
        title: 'Can I reinstall or reuse my eSIM?',
        titleTh: 'ติดตั้งหรือใช้ซ้ำ eSIM ได้ไหม?',
        description: 'Understanding eSIM reinstallation and reuse policies',
        descriptionTh: 'ทำความเข้าใจนโยบายการติดตั้งและใช้ซ้ำ eSIM',
        tableOfContents: [
          { id: 'key-rule', title: 'Key rule', titleTh: 'กฎสำคัญ' },
          { id: 'what-happens', title: 'What happens if deleted', titleTh: 'เกิดอะไรขึ้นถ้าลบ' },
          { id: 'best-practices', title: 'Best practices', titleTh: 'แนวปฏิบัติที่ดี' }
        ],
        content: `## Key rule {#key-rule}

**Once you delete an eSIM from your device, it cannot be reinstalled.**

Each QR code/activation code can only be used ONCE. After installation:
- The code becomes invalid
- You cannot reinstall using the same code
- A new eSIM must be purchased if deleted

## What happens if deleted {#what-happens}

If you accidentally delete your eSIM:
- Any remaining data is lost
- The eSIM cannot be recovered
- You need to purchase a new one

**Exceptions:**
Some plans support reinstallation if:
- You delete before first use
- Contact support immediately
- Technical issue prevented installation

## Best practices {#best-practices}

### Do NOT delete your eSIM if:
- You still have remaining data
- Your trip isn't over
- You plan to return to the country

### When you CAN delete:
- All data is used
- Validity period has expired
- You're cleaning up unused eSIMs

**Tip:** Just disable the eSIM instead of deleting. You can re-enable it later if needed.`,
        contentTh: `## กฎสำคัญ {#key-rule}

**เมื่อคุณลบ eSIM จากอุปกรณ์แล้ว ไม่สามารถติดตั้งใหม่ได้**

QR code/รหัสเปิดใช้งานแต่ละอันใช้ได้ครั้งเดียวเท่านั้น หลังติดตั้ง:
- โค้ดจะใช้ไม่ได้อีก
- ติดตั้งซ้ำด้วยโค้ดเดิมไม่ได้
- ต้องซื้อ eSIM ใหม่ถ้าลบไปแล้ว

## เกิดอะไรขึ้นถ้าลบ {#what-happens}

ถ้าคุณลบ eSIM โดยไม่ตั้งใจ:
- data ที่เหลือจะหายไป
- ไม่สามารถกู้คืน eSIM ได้
- ต้องซื้อใหม่

**ข้อยกเว้น:**
บางแพ็กเกจรองรับการติดตั้งใหม่ถ้า:
- คุณลบก่อนใช้งานครั้งแรก
- ติดต่อ support ทันที
- มีปัญหาทางเทคนิคป้องกันการติดตั้ง

## แนวปฏิบัติที่ดี {#best-practices}

### อย่าลบ eSIM ถ้า:
- ยังมี data เหลืออยู่
- การเดินทางยังไม่จบ
- คุณวางแผนจะกลับมาประเทศนั้นอีก

### เมื่อไหร่ที่ลบได้:
- data ใช้หมดแล้ว
- หมดอายุแล้ว
- กำลังทำความสะอาด eSIM ที่ไม่ใช้

**เคล็ดลับ:** แค่ปิด eSIM แทนที่จะลบ คุณสามารถเปิดใหม่ได้ถ้าต้องการ`
      },
      {
        slug: 'can-i-use-esim-as-hotspot',
        category: 'esim-data-plan',
        title: 'Can I use eSIM as a hotspot?',
        titleTh: 'ใช้ eSIM เป็นฮอตสปอตได้ไหม?',
        description: 'Using your Mobile11 eSIM for tethering and hotspot',
        descriptionTh: 'การใช้ Mobile11 eSIM สำหรับ tethering และฮอตสปอต',
        tableOfContents: [
          { id: 'support', title: 'Hotspot support', titleTh: 'การรองรับฮอตสปอต' },
          { id: 'how-to-enable', title: 'How to enable', titleTh: 'วิธีเปิดใช้งาน' },
          { id: 'tips', title: 'Tips for hotspot', titleTh: 'เคล็ดลับสำหรับฮอตสปอต' }
        ],
        content: `## Hotspot support {#support}

**Yes! Most Mobile11 eSIMs support hotspot/tethering.**

You can share your eSIM data with:
- Laptops
- Tablets
- Other phones
- Gaming devices

**Note:** Using hotspot consumes data faster. Monitor your usage!

## How to enable {#how-to-enable}

### On iPhone:
1. Go to **Settings > Personal Hotspot**
2. Toggle **Allow Others to Join** ON
3. Note the WiFi password shown
4. Connect devices to your iPhone's hotspot

### On Android:
1. Go to **Settings > Connections > Mobile Hotspot**
2. Toggle it **ON**
3. Configure hotspot name and password
4. Connect devices

## Tips for hotspot {#tips}

**Conserve data:**
- Disable automatic updates on connected devices
- Avoid video streaming (uses lots of data)
- Disconnect devices when not in use

**Best performance:**
- Keep phone charged (hotspot drains battery)
- Stay close to connected devices
- Use 5GHz WiFi if available

**Limitless plans** are ideal for heavy hotspot usage - unlimited data at maximum speeds!`,
        contentTh: `## การรองรับฮอตสปอต {#support}

**ได้! Mobile11 eSIM ส่วนใหญ่รองรับฮอตสปอต/tethering**

คุณสามารถแชร์ data eSIM กับ:
- แล็ปท็อป
- แท็บเล็ต
- โทรศัพท์เครื่องอื่น
- อุปกรณ์เกม

**หมายเหตุ:** การใช้ฮอตสปอตใช้ data เร็วขึ้น ตรวจสอบการใช้งาน!

## วิธีเปิดใช้งาน {#how-to-enable}

### บน iPhone:
1. ไปที่ **Settings > Personal Hotspot**
2. เปิด **Allow Others to Join**
3. จดรหัสผ่าน WiFi
4. เชื่อมต่ออุปกรณ์กับฮอตสปอต iPhone

### บน Android:
1. ไปที่ **Settings > Connections > Mobile Hotspot**
2. เปิด
3. ตั้งค่าชื่อและรหัสผ่านฮอตสปอต
4. เชื่อมต่ออุปกรณ์

## เคล็ดลับสำหรับฮอตสปอต {#tips}

**ประหยัด data:**
- ปิดอัปเดตอัตโนมัติบนอุปกรณ์ที่เชื่อมต่อ
- หลีกเลี่ยงการสตรีมวิดีโอ
- ตัดการเชื่อมต่อเมื่อไม่ใช้

**ประสิทธิภาพดีที่สุด:**
- ชาร์จโทรศัพท์ (ฮอตสปอตใช้แบตเร็ว)
- อยู่ใกล้อุปกรณ์ที่เชื่อมต่อ
- ใช้ WiFi 5GHz ถ้ามี

**แพ็กเกจ Limitless** เหมาะสำหรับการใช้ฮอตสปอตหนัก - data ไม่จำกัดที่ความเร็วสูงสุด!`
      },
      {
        slug: 'when-does-my-esim-validity-start',
        category: 'esim-data-plan',
        title: 'When does my eSIM validity start?',
        titleTh: 'อายุ eSIM เริ่มเมื่อไหร่?',
        description: 'Understanding when your eSIM data plan begins',
        descriptionTh: 'ทำความเข้าใจว่าแพ็กเกจ data eSIM เริ่มเมื่อไหร่',
        tableOfContents: [
          { id: 'activation-types', title: 'Activation types', titleTh: 'ประเภทการเปิดใช้งาน' },
          { id: 'when-to-install', title: 'When to install', titleTh: 'เมื่อไหร่ควรติดตั้ง' }
        ],
        content: `## Activation types {#activation-types}

Mobile11 eSIMs typically activate in one of two ways:

### 1. First Use Activation (Most Common)
- Validity starts when you **first connect to a network**
- Install before your trip, no rush
- Activate when you arrive at your destination

### 2. Installation Activation
- Validity starts when you **install** the eSIM
- Install close to your travel date
- Check your specific package details

**Check your order email** for the activation policy of your specific eSIM.

## When to install {#when-to-install}

**For First Use Activation:**
- Install anytime before your trip
- Even weeks in advance is fine
- Just don't enable mobile data until you arrive

**For Installation Activation:**
- Install on the day of travel or day before
- Don't install too early

**Pro tip:** If you install before traveling and your plan activates on first use, keep mobile data OFF for that eSIM until you arrive. Then enable data roaming and connect!`,
        contentTh: `## ประเภทการเปิดใช้งาน {#activation-types}

Mobile11 eSIM มักเปิดใช้งานด้วยวิธีใดวิธีหนึ่ง:

### 1. เปิดใช้งานเมื่อใช้ครั้งแรก (พบบ่อยที่สุด)
- อายุเริ่มเมื่อคุณ **เชื่อมต่อเครือข่ายครั้งแรก**
- ติดตั้งก่อนเดินทางได้ ไม่ต้องรีบ
- เปิดใช้งานเมื่อถึงปลายทาง

### 2. เปิดใช้งานเมื่อติดตั้ง
- อายุเริ่มเมื่อคุณ **ติดตั้ง** eSIM
- ติดตั้งใกล้วันเดินทาง
- ตรวจสอบรายละเอียดแพ็กเกจ

**ตรวจสอบอีเมลออเดอร์** สำหรับนโยบายการเปิดใช้งานของ eSIM เฉพาะ

## เมื่อไหร่ควรติดตั้ง {#when-to-install}

**สำหรับการเปิดใช้งานเมื่อใช้ครั้งแรก:**
- ติดตั้งก่อนเดินทางได้ทุกเมื่อ
- แม้แต่หลายสัปดาห์ล่วงหน้าก็ได้
- แค่อย่าเปิด mobile data จนกว่าจะถึงที่หมาย

**สำหรับการเปิดใช้งานเมื่อติดตั้ง:**
- ติดตั้งในวันเดินทางหรือวันก่อน
- อย่าติดตั้งเร็วเกินไป

**เคล็ดลับ:** ถ้าติดตั้งก่อนเดินทางและแพ็กเกจเปิดใช้งานเมื่อใช้ครั้งแรก ให้ปิด mobile data สำหรับ eSIM นั้นจนกว่าจะถึงที่หมาย แล้วเปิด data roaming และเชื่อมต่อ!`
      },
      {
        slug: 'what-happens-if-my-esim-expires',
        category: 'esim-data-plan',
        title: 'What happens if my eSIM expires?',
        titleTh: 'เกิดอะไรขึ้นถ้า eSIM หมดอายุ?',
        description: 'Understanding eSIM expiration and what to do',
        descriptionTh: 'ทำความเข้าใจการหมดอายุของ eSIM และจะทำอย่างไร',
        tableOfContents: [
          { id: 'what-happens', title: 'What happens', titleTh: 'เกิดอะไรขึ้น' },
          { id: 'options', title: 'Your options', titleTh: 'ตัวเลือกของคุณ' }
        ],
        content: `## What happens {#what-happens}

When your eSIM expires:
- Data connection stops working
- Any unused data is lost
- The eSIM profile remains on your device

**You will NOT be charged** anything extra when your eSIM expires.

## Your options {#options}

### 1. Before expiration (if you need more data)
- **Top-up** (if your plan supports it) - adds data to existing eSIM
- **Extend** your plan - adds more validity days
- **Purchase new** eSIM for continued coverage

### 2. After expiration
- Purchase a new eSIM
- Delete the expired eSIM to free up space (optional)

### To extend or top-up:
1. Log into your Mobile11 account
2. Go to "My eSIMs"
3. Select the eSIM
4. Choose "Top Up" or "Extend"

**Tip:** Set reminders before your eSIM expires so you can take action in time!`,
        contentTh: `## เกิดอะไรขึ้น {#what-happens}

เมื่อ eSIM หมดอายุ:
- การเชื่อมต่อ data หยุดทำงาน
- data ที่ไม่ได้ใช้จะหายไป
- โปรไฟล์ eSIM ยังคงอยู่บนอุปกรณ์

**คุณจะไม่ถูกเรียกเก็บเงิน** เพิ่มเติมเมื่อ eSIM หมดอายุ

## ตัวเลือกของคุณ {#options}

### 1. ก่อนหมดอายุ (ถ้าต้องการ data เพิ่ม)
- **เติมเงิน** (ถ้าแพ็กเกจรองรับ) - เพิ่ม data ให้ eSIM ที่มีอยู่
- **ขยาย** แพ็กเกจ - เพิ่มวันใช้งาน
- **ซื้อ** eSIM ใหม่

### 2. หลังหมดอายุ
- ซื้อ eSIM ใหม่
- ลบ eSIM ที่หมดอายุเพื่อเพิ่มพื้นที่ (ไม่บังคับ)

### เพื่อขยายหรือเติมเงิน:
1. ล็อกอินเข้าบัญชี Mobile11
2. ไปที่ "eSIM ของฉัน"
3. เลือก eSIM
4. เลือก "เติมเงิน" หรือ "ขยาย"

**เคล็ดลับ:** ตั้งการแจ้งเตือนก่อน eSIM หมดอายุเพื่อดำเนินการทันเวลา!`
      },
      // ==================== FAQ CATEGORY ====================
      {
        slug: 'what-is-esim',
        category: 'faq',
        title: 'What is an eSIM?',
        titleTh: 'eSIM คืออะไร?',
        description: 'Learn what eSIM technology is and how it works',
        descriptionTh: 'เรียนรู้ว่าเทคโนโลยี eSIM คืออะไรและทำงานอย่างไร',
        tableOfContents: [
          { id: 'definition', title: 'eSIM definition', titleTh: 'ความหมายของ eSIM' },
          { id: 'benefits', title: 'Key benefits', titleTh: 'ประโยชน์หลัก' }
        ],
        content: `## eSIM definition {#definition}

An eSIM (embedded SIM) is a digital SIM that allows you to activate a cellular plan without using a physical SIM card. It's built into your device and can be programmed with carrier information remotely.

**Key characteristics:**
- Built directly into compatible devices
- Activated through QR code or app
- Can store multiple profiles
- No physical SIM card needed

## Key benefits {#benefits}

**For travelers:**
- Instant activation - no waiting for delivery
- No need to find local SIM vendors
- Keep your main number active
- Switch plans easily between trips

**Convenience:**
- No tiny SIM cards to lose
- No SIM ejector tool needed
- Quick setup process (under 5 minutes)
- Environmentally friendly - no plastic waste`,
        contentTh: `## ความหมายของ eSIM {#definition}

eSIM (embedded SIM) คือ SIM ดิจิทัลที่ช่วยให้คุณเปิดใช้งานแผนเซลลูลาร์โดยไม่ต้องใช้ SIM การ์ดจริง มันถูกสร้างในอุปกรณ์ของคุณและสามารถโปรแกรมด้วยข้อมูลผู้ให้บริการทางไกล

**คุณสมบัติหลัก:**
- สร้างโดยตรงในอุปกรณ์ที่รองรับ
- เปิดใช้งานผ่าน QR code หรือแอป
- สามารถเก็บหลายโปรไฟล์
- ไม่ต้องใช้ SIM การ์ดจริง

## ประโยชน์หลัก {#benefits}

**สำหรับนักเดินทาง:**
- เปิดใช้งานทันที - ไม่ต้องรอจัดส่ง
- ไม่ต้องหาร้านขาย SIM ท้องถิ่น
- เก็บหมายเลขหลักให้ใช้งานได้
- สลับแผนได้ง่ายระหว่างเดินทาง

**ความสะดวก:**
- ไม่มี SIM การ์ดเล็กๆ ให้หาย
- ไม่ต้องใช้เครื่องมือดีด SIM
- กระบวนการตั้งค่าเร็ว (ต่ำกว่า 5 นาที)
- เป็นมิตรกับสิ่งแวดล้อม - ไม่มีขยะพลาสติก`
      },
      {
        slug: 'is-my-phone-compatible',
        category: 'faq',
        title: 'Is my phone eSIM compatible?',
        titleTh: 'โทรศัพท์ของฉันรองรับ eSIM ไหม?',
        description: 'Check if your device supports eSIM technology',
        descriptionTh: 'ตรวจสอบว่าอุปกรณ์ของคุณรองรับเทคโนโลยี eSIM หรือไม่',
        tableOfContents: [
          { id: 'compatible-iphones', title: 'Compatible iPhones', titleTh: 'iPhone ที่รองรับ' },
          { id: 'compatible-android', title: 'Compatible Android phones', titleTh: 'โทรศัพท์ Android ที่รองรับ' },
          { id: 'how-to-check', title: 'How to verify', titleTh: 'วิธีตรวจสอบ' }
        ],
        content: `## Compatible iPhones {#compatible-iphones}

**eSIM supported on:**
- iPhone XS, XS Max, XR and later
- iPhone SE (2nd generation and later)
- All iPhone 11, 12, 13, 14, 15, 16 models

**Note:** Device must be carrier-unlocked to use Mobile11 eSIM.

## Compatible Android phones {#compatible-android}

**Samsung:**
- Galaxy S20 and later (S21, S22, S23, S24)
- Galaxy Note 20 and later
- Galaxy Z Fold/Flip series (all generations)
- Galaxy A54 and later

**Google:**
- Pixel 3 and later (Pixel 4, 5, 6, 7, 8, 9)
- Pixel Fold

**Other brands:**
- Xiaomi 12T Pro and select newer models
- Oppo Find X3 Pro and later
- Motorola Razr series
- OnePlus (select models)

## How to verify {#how-to-check}

**On iPhone:**
1. Go to Settings > General > About
2. Look for "EID" number (a long string of numbers)
3. If EID is present, your phone supports eSIM

**On Android:**
1. Go to Settings > About Phone
2. Look for "EID" or "eSIM" option
3. Or dial *#06# to see if EID appears

**Important:** Even if your device is compatible, it must be carrier-unlocked. Check Settings > General > About > Carrier Lock on iPhone.`,
        contentTh: `## iPhone ที่รองรับ {#compatible-iphones}

**รองรับ eSIM บน:**
- iPhone XS, XS Max, XR และใหม่กว่า
- iPhone SE (รุ่นที่ 2 และใหม่กว่า)
- iPhone 11, 12, 13, 14, 15, 16 ทุกรุ่น

**หมายเหตุ:** อุปกรณ์ต้องปลดล็อคจากผู้ให้บริการเพื่อใช้ Mobile11 eSIM

## โทรศัพท์ Android ที่รองรับ {#compatible-android}

**Samsung:**
- Galaxy S20 และใหม่กว่า (S21, S22, S23, S24)
- Galaxy Note 20 และใหม่กว่า
- Galaxy Z Fold/Flip ซีรีส์ (ทุกรุ่น)
- Galaxy A54 และใหม่กว่า

**Google:**
- Pixel 3 และใหม่กว่า (Pixel 4, 5, 6, 7, 8, 9)
- Pixel Fold

**แบรนด์อื่น:**
- Xiaomi 12T Pro และบางรุ่นใหม่กว่า
- Oppo Find X3 Pro และใหม่กว่า
- Motorola Razr ซีรีส์
- OnePlus (บางรุ่น)

## วิธีตรวจสอบ {#how-to-check}

**บน iPhone:**
1. ไปที่ ตั้งค่า > ทั่วไป > เกี่ยวกับ
2. มองหาหมายเลข "EID" (ตัวเลขยาวหลายหลัก)
3. ถ้ามี EID โทรศัพท์รองรับ eSIM

**บน Android:**
1. ไปที่ ตั้งค่า > เกี่ยวกับโทรศัพท์
2. มองหา "EID" หรือตัวเลือก "eSIM"
3. หรือกด *#06# เพื่อดูว่ามี EID หรือไม่

**สำคัญ:** แม้อุปกรณ์รองรับ ต้องปลดล็อคจากผู้ให้บริการด้วย ตรวจสอบที่ ตั้งค่า > ทั่วไป > เกี่ยวกับ > Carrier Lock บน iPhone`
      },
      {
        slug: 'how-long-activation',
        category: 'faq',
        title: 'How long does eSIM activation take?',
        titleTh: 'การเปิดใช้งาน eSIM ใช้เวลานานแค่ไหน?',
        description: 'Timeline for eSIM purchase, installation, and activation',
        descriptionTh: 'ระยะเวลาสำหรับการซื้อ ติดตั้ง และเปิดใช้งาน eSIM',
        tableOfContents: [
          { id: 'purchase', title: 'After purchase', titleTh: 'หลังซื้อ' },
          { id: 'installation', title: 'Installation time', titleTh: 'เวลาติดตั้ง' }
        ],
        content: `## After purchase {#purchase}

**Delivery time:**
- QR code delivered instantly via email
- Also available in your account dashboard
- No shipping delays - it's digital!

**Typical timeline:**
- Order confirmation: Immediate
- QR code delivery: Within 1-5 minutes
- Most deliveries: Under 1 minute

## Installation time {#installation}

**Installation process:**
- Scanning QR code: 10 seconds
- Profile download: 30-60 seconds
- Confirmation: Immediate

**Total installation time:** 1-2 minutes

**Getting connected at destination:**
- Enable eSIM data: Instant
- Network connection: 1-5 minutes
- Some plans activate upon first use in destination country

**Pro tip:** Install your eSIM before you travel (while on Wi-Fi at home), then just enable it when you arrive at your destination.`,
        contentTh: `## หลังซื้อ {#purchase}

**เวลาจัดส่ง:**
- QR code ส่งทันทีทางอีเมล
- มีในแดชบอร์ดบัญชีด้วย
- ไม่มีความล่าช้า - เป็นดิจิทัล!

**ไทม์ไลน์โดยทั่วไป:**
- ยืนยันคำสั่งซื้อ: ทันที
- ส่ง QR code: ภายใน 1-5 นาที
- ส่วนใหญ่: ต่ำกว่า 1 นาที

## เวลาติดตั้ง {#installation}

**กระบวนการติดตั้ง:**
- สแกน QR code: 10 วินาที
- ดาวน์โหลดโปรไฟล์: 30-60 วินาที
- ยืนยัน: ทันที

**เวลาติดตั้งรวม:** 1-2 นาที

**การเชื่อมต่อที่ปลายทาง:**
- เปิดใช้ข้อมูล eSIM: ทันที
- เชื่อมต่อเครือข่าย: 1-5 นาที
- บางแผนเปิดใช้เมื่อใช้ครั้งแรกในประเทศปลายทาง

**เคล็ดลับ:** ติดตั้ง eSIM ก่อนเดินทาง (ขณะต่อ Wi-Fi ที่บ้าน) จากนั้นเปิดใช้งานเมื่อถึงปลายทาง`
      },
      {
        slug: 'keep-phone-number',
        category: 'faq',
        title: 'Can I keep my phone number with eSIM?',
        titleTh: 'ฉันสามารถใช้หมายเลขโทรศัพท์เดิมกับ eSIM ได้ไหม?',
        description: 'How to use eSIM while keeping your original phone number',
        descriptionTh: 'วิธีใช้ eSIM โดยเก็บหมายเลขโทรศัพท์เดิมไว้',
        tableOfContents: [
          { id: 'dual-sim', title: 'Dual SIM setup', titleTh: 'การตั้งค่า Dual SIM' },
          { id: 'how-it-works', title: 'How it works', titleTh: 'วิธีการทำงาน' }
        ],
        content: `## Dual SIM setup {#dual-sim}

Yes! You can absolutely keep your original phone number while using Mobile11 eSIM for data.

**How it works:**
- Your physical SIM: Keeps your home number for calls/SMS
- Mobile11 eSIM: Provides affordable data abroad
- Both work simultaneously on your device

**Benefits:**
- Receive calls and SMS on your familiar number
- Use affordable international data from eSIM
- No need to share a temporary number with contacts
- Best of both worlds!

## How it works {#how-it-works}

**Configuration on iPhone:**
1. Settings > Cellular
2. Set "Default Voice Line" to your physical SIM
3. Set "Cellular Data" to your Mobile11 eSIM

**Configuration on Android:**
1. Settings > SIM Manager
2. Set calls/SMS to your physical SIM
3. Set mobile data to your eSIM

**Important notes:**
- Your home SIM may incur roaming charges for calls/SMS
- Consider using internet-based calling apps (WhatsApp, LINE, Telegram) for free calls over your eSIM data
- You can switch data between SIMs anytime in settings`,
        contentTh: `## การตั้งค่า Dual SIM {#dual-sim}

ได้แน่นอน! คุณสามารถเก็บหมายเลขโทรศัพท์เดิมไว้ขณะใช้ Mobile11 eSIM สำหรับข้อมูล

**วิธีการทำงาน:**
- SIM จริงของคุณ: เก็บหมายเลขบ้านสำหรับโทร/SMS
- Mobile11 eSIM: ให้ข้อมูลราคาถูกในต่างประเทศ
- ทั้งสองทำงานพร้อมกันบนอุปกรณ์

**ประโยชน์:**
- รับสายและ SMS บนหมายเลขที่คุ้นเคย
- ใช้ข้อมูลระหว่างประเทศราคาถูกจาก eSIM
- ไม่ต้องแชร์หมายเลขชั่วคราวกับผู้ติดต่อ
- ดีที่สุดของทั้งสอง!

## วิธีการทำงาน {#how-it-works}

**การกำหนดค่าบน iPhone:**
1. ตั้งค่า > เซลลูลาร์
2. ตั้ง "สายเริ่มต้น" เป็น SIM จริงของคุณ
3. ตั้ง "ข้อมูลเซลลูลาร์" เป็น Mobile11 eSIM

**การกำหนดค่าบน Android:**
1. ตั้งค่า > ตัวจัดการ SIM
2. ตั้งโทร/SMS เป็น SIM จริงของคุณ
3. ตั้งข้อมูลมือถือเป็น eSIM

**หมายเหตุสำคัญ:**
- SIM บ้านอาจมีค่าโรมมิ่งสำหรับโทร/SMS
- พิจารณาใช้แอปโทรผ่านอินเทอร์เน็ต (WhatsApp, LINE, Telegram) สำหรับโทรฟรีผ่านข้อมูล eSIM
- คุณสามารถสลับข้อมูลระหว่าง SIM ได้ทุกเมื่อในการตั้งค่า`
      },
      {
        slug: 'esim-vs-physical-sim',
        category: 'faq',
        title: 'eSIM vs physical SIM: What\'s the difference?',
        titleTh: 'eSIM vs SIM จริง: ต่างกันอย่างไร?',
        description: 'Compare eSIM and traditional physical SIM cards',
        descriptionTh: 'เปรียบเทียบ eSIM กับ SIM การ์ดแบบดั้งเดิม',
        tableOfContents: [
          { id: 'comparison', title: 'Side by side comparison', titleTh: 'เปรียบเทียบแบบเคียงข้าง' },
          { id: 'which-choose', title: 'Which to choose', titleTh: 'เลือกอันไหนดี' }
        ],
        content: `## Side by side comparison {#comparison}

| Feature | eSIM | Physical SIM |
|---------|------|--------------|
| Format | Digital | Plastic card |
| Activation | Instant (QR code) | Insert into phone |
| Delivery | Email (seconds) | Shipping (days) |
| Storage | Multiple profiles | One per slot |
| Lost risk | Cannot lose | Easy to misplace |
| Environment | No plastic waste | Plastic + packaging |
| Swapping | Software switch | Physical swap |
| Compatibility | Newer phones | Most phones |

## Which to choose {#which-choose}

**Choose eSIM if:**
- Your phone supports it (iPhone XS+, modern Android)
- You want instant activation
- You travel frequently
- You don't want to handle tiny SIM cards
- Environmental impact matters to you

**Choose physical SIM if:**
- Your phone doesn't support eSIM
- You prefer traditional methods
- You need to share SIM between multiple devices
- Your phone is carrier-locked

**Best of both worlds:**
Many travelers use their physical home SIM for calls and an eSIM for affordable data abroad - this is the most popular setup!`,
        contentTh: `## เปรียบเทียบแบบเคียงข้าง {#comparison}

| คุณสมบัติ | eSIM | SIM จริง |
|---------|------|--------------|
| รูปแบบ | ดิจิทัล | การ์ดพลาสติก |
| เปิดใช้งาน | ทันที (QR code) | ใส่ในโทรศัพท์ |
| จัดส่ง | อีเมล (วินาที) | ส่งพัสดุ (วัน) |
| จัดเก็บ | หลายโปรไฟล์ | หนึ่งต่อช่อง |
| ความเสี่ยงหาย | หายไม่ได้ | หายง่าย |
| สิ่งแวดล้อม | ไม่มีขยะพลาสติก | พลาสติก + บรรจุภัณฑ์ |
| สลับ | สลับซอฟต์แวร์ | สลับทางกายภาพ |
| ความเข้ากันได้ | โทรศัพท์ใหม่ | โทรศัพท์ส่วนใหญ่ |

## เลือกอันไหนดี {#which-choose}

**เลือก eSIM ถ้า:**
- โทรศัพท์รองรับ (iPhone XS+, Android ใหม่)
- คุณต้องการเปิดใช้งานทันที
- คุณเดินทางบ่อย
- คุณไม่อยากจัดการ SIM การ์ดเล็กๆ
- ผลกระทบต่อสิ่งแวดล้อมสำคัญสำหรับคุณ

**เลือก SIM จริงถ้า:**
- โทรศัพท์ไม่รองรับ eSIM
- คุณชอบวิธีการแบบดั้งเดิม
- คุณต้องการแชร์ SIM ระหว่างหลายอุปกรณ์
- โทรศัพท์ถูกล็อคกับผู้ให้บริการ

**ดีที่สุดของทั้งสอง:**
นักเดินทางหลายคนใช้ SIM บ้านจริงสำหรับโทรและ eSIM สำหรับข้อมูลราคาถูกในต่างประเทศ - นี่คือการตั้งค่ายอดนิยมที่สุด!`
      },
      {
        slug: 'how-to-contact-support',
        category: 'faq',
        title: 'How do I contact Mobile11 support?',
        titleTh: 'ฉันจะติดต่อฝ่ายสนับสนุน Mobile11 ได้อย่างไร?',
        description: 'All the ways to reach our customer support team',
        descriptionTh: 'ทุกช่องทางในการติดต่อทีมสนับสนุนลูกค้าของเรา',
        tableOfContents: [
          { id: 'contact-methods', title: 'Contact methods', titleTh: 'วิธีการติดต่อ' },
          { id: 'response-times', title: 'Response times', titleTh: 'เวลาตอบกลับ' }
        ],
        content: `## Contact methods {#contact-methods}

**Live Chat (Recommended - Fastest):**
- Available 24/7 on our website
- Click the chat icon in the bottom right corner
- Real-time assistance from our team
- Average response: Under 5 minutes

**Email:**
- support@mobile11.com
- Include your order number for faster help
- Attach screenshots if relevant
- Response within 24 hours

**LINE Official Account:**
- Search for @mobile11 on LINE
- Great for Thai language support
- Quick responses during business hours

## Response times {#response-times}

| Method | Typical Response |
|--------|------------------|
| Live Chat | Under 5 minutes |
| Email | Within 24 hours |
| LINE | Within 1-2 hours |

**Before contacting support, please have ready:**
- Your order number or email address
- Device model (iPhone 15, Samsung S24, etc.)
- Description of the issue
- Screenshots of any error messages

**Pro tip:** Our Help Center has answers to 90% of common questions - check there first for instant solutions!`,
        contentTh: `## วิธีการติดต่อ {#contact-methods}

**Live Chat (แนะนำ - เร็วที่สุด):**
- พร้อมให้บริการ 24/7 บนเว็บไซต์
- คลิกไอคอนแชทที่มุมขวาล่าง
- ความช่วยเหลือแบบเรียลไทม์จากทีมงาน
- ตอบกลับเฉลี่ย: ต่ำกว่า 5 นาที

**อีเมล:**
- support@mobile11.com
- ระบุหมายเลขคำสั่งซื้อเพื่อช่วยเหลือเร็วขึ้น
- แนบภาพหน้าจอหากเกี่ยวข้อง
- ตอบกลับภายใน 24 ชั่วโมง

**LINE Official Account:**
- ค้นหา @mobile11 บน LINE
- เหมาะสำหรับการสนับสนุนภาษาไทย
- ตอบกลับเร็วในเวลาทำการ

## เวลาตอบกลับ {#response-times}

| วิธี | ตอบกลับโดยทั่วไป |
|------|-----------------|
| Live Chat | ต่ำกว่า 5 นาที |
| อีเมล | ภายใน 24 ชั่วโมง |
| LINE | ภายใน 1-2 ชั่วโมง |

**ก่อนติดต่อฝ่ายสนับสนุน กรุณาเตรียม:**
- หมายเลขคำสั่งซื้อหรืออีเมล
- รุ่นอุปกรณ์ (iPhone 15, Samsung S24 ฯลฯ)
- คำอธิบายปัญหา
- ภาพหน้าจอของข้อความแสดงข้อผิดพลาด

**เคล็ดลับ:** Help Center มีคำตอบ 90% ของคำถามทั่วไป - ตรวจสอบที่นั่นก่อนเพื่อวิธีแก้ไขทันที!`
      },
      // ==================== ADDITIONAL ESIM-DATA-PLAN ====================
      {
        slug: 'can-i-use-hotspot-tethering',
        category: 'esim-data-plan',
        title: 'Can I use my eSIM as a hotspot?',
        titleTh: 'ฉันสามารถใช้ eSIM เป็นฮอตสปอตได้ไหม?',
        description: 'Information about using your eSIM for personal hotspot/tethering',
        descriptionTh: 'ข้อมูลเกี่ยวกับการใช้ eSIM สำหรับฮอตสปอตส่วนตัว',
        tableOfContents: [
          { id: 'hotspot-support', title: 'Hotspot support', titleTh: 'การรองรับฮอตสปอต' },
          { id: 'how-to-enable', title: 'How to enable', titleTh: 'วิธีเปิดใช้งาน' }
        ],
        content: `## Hotspot support {#hotspot-support}

**Yes!** Most Mobile11 eSIM plans support personal hotspot/tethering, allowing you to share your data connection with other devices like laptops, tablets, or other phones.

**How it works:**
- Enable hotspot on your phone
- Connect other devices via Wi-Fi
- Share your eSIM's data connection

**Important notes:**
- Hotspot usage consumes your data allowance faster
- Multiple devices = faster data usage
- Video streaming on connected devices uses significant data

## How to enable {#how-to-enable}

**On iPhone:**
1. Go to Settings > Personal Hotspot
2. Toggle "Allow Others to Join" ON
3. Note the Wi-Fi password shown
4. Connect other devices using this password

**On Android:**
1. Go to Settings > Connections > Mobile Hotspot
2. Toggle Mobile Hotspot ON
3. Set a password if prompted
4. Connect other devices

**Tips for hotspot use:**
- Limit video streaming on connected devices
- Use Limitless plans for heavy hotspot usage
- Monitor your data usage regularly
- Turn off hotspot when not in use to save data`,
        contentTh: `## การรองรับฮอตสปอต {#hotspot-support}

**ได้!** แพ็กเกจ eSIM Mobile11 ส่วนใหญ่รองรับฮอตสปอตส่วนตัว/การแชร์อินเทอร์เน็ต ช่วยให้คุณแชร์การเชื่อมต่อข้อมูลกับอุปกรณ์อื่นเช่น แล็ปท็อป แท็บเล็ต หรือโทรศัพท์อื่น

**วิธีการทำงาน:**
- เปิดฮอตสปอตบนโทรศัพท์
- เชื่อมต่ออุปกรณ์อื่นผ่าน Wi-Fi
- แชร์การเชื่อมต่อข้อมูล eSIM

**หมายเหตุสำคัญ:**
- การใช้ฮอตสปอตใช้โควต้าข้อมูลเร็วขึ้น
- หลายอุปกรณ์ = ใช้ข้อมูลเร็วขึ้น
- สตรีมวิดีโอบนอุปกรณ์ที่เชื่อมต่อใช้ข้อมูลมาก

## วิธีเปิดใช้งาน {#how-to-enable}

**บน iPhone:**
1. ไปที่ ตั้งค่า > ฮอตสปอตส่วนตัว
2. เปิด "อนุญาตให้คนอื่นเข้าร่วม"
3. จดรหัสผ่าน Wi-Fi ที่แสดง
4. เชื่อมต่ออุปกรณ์อื่นด้วยรหัสผ่านนี้

**บน Android:**
1. ไปที่ ตั้งค่า > การเชื่อมต่อ > ฮอตสปอตมือถือ
2. เปิดฮอตสปอตมือถือ
3. ตั้งรหัสผ่านหากถูกถาม
4. เชื่อมต่ออุปกรณ์อื่น

**เคล็ดลับการใช้ฮอตสปอต:**
- จำกัดการสตรีมวิดีโอบนอุปกรณ์ที่เชื่อมต่อ
- ใช้แพ็กเกจ Limitless สำหรับการใช้ฮอตสปอตหนัก
- ตรวจสอบการใช้ข้อมูลเป็นประจำ
- ปิดฮอตสปอตเมื่อไม่ใช้เพื่อประหยัดข้อมูล`
      },
      {
        slug: 'can-i-use-the-esim-on-multiple-devices',
        category: 'esim-data-plan',
        title: 'Can I use the eSIM on multiple devices?',
        titleTh: 'ฉันสามารถใช้ eSIM บนหลายอุปกรณ์ได้ไหม?',
        description: 'Understanding eSIM usage limitations across devices',
        descriptionTh: 'ทำความเข้าใจข้อจำกัดการใช้ eSIM ข้ามอุปกรณ์',
        tableOfContents: [
          { id: 'one-device', title: 'One device at a time', titleTh: 'หนึ่งอุปกรณ์ต่อครั้ง' },
          { id: 'alternatives', title: 'Alternatives', titleTh: 'ทางเลือก' }
        ],
        content: `## One device at a time {#one-device}

**No, an eSIM can only be active on one device at a time.**

Each eSIM profile is designed to be installed and used on a single device. This is a fundamental limitation of eSIM technology, not specific to Mobile11.

**Why this limitation exists:**
- eSIM profiles are cryptographically bound to a device
- Network operators require one device per profile for security
- Prevents unauthorized sharing of data plans

**Can I transfer my eSIM to another device?**
- Once installed, most eSIMs cannot be transferred
- If you delete the eSIM, it typically cannot be reinstalled
- Contact support if you need to use the eSIM on a different device before installing

## Alternatives {#alternatives}

**If you need data on multiple devices:**

1. **Use hotspot/tethering**
   - Share your phone's eSIM connection with other devices
   - Works with laptops, tablets, other phones
   - Uses your data allowance

2. **Purchase multiple eSIMs**
   - Buy separate eSIMs for each device
   - Each device gets its own data plan
   - Independent usage tracking

3. **Family/Group plans**
   - Contact us for multi-device solutions
   - Corporate accounts available`,
        contentTh: `## หนึ่งอุปกรณ์ต่อครั้ง {#one-device}

**ไม่ได้ eSIM สามารถใช้งานได้บนหนึ่งอุปกรณ์ต่อครั้งเท่านั้น**

โปรไฟล์ eSIM แต่ละอันถูกออกแบบให้ติดตั้งและใช้บนอุปกรณ์เดียว นี่เป็นข้อจำกัดพื้นฐานของเทคโนโลยี eSIM ไม่ใช่เฉพาะ Mobile11

**ทำไมมีข้อจำกัดนี้:**
- โปรไฟล์ eSIM ถูกผูกกับอุปกรณ์แบบเข้ารหัส
- ผู้ให้บริการเครือข่ายต้องการหนึ่งอุปกรณ์ต่อโปรไฟล์เพื่อความปลอดภัย
- ป้องกันการแชร์แผนข้อมูลโดยไม่ได้รับอนุญาต

**ฉันสามารถโอน eSIM ไปอุปกรณ์อื่นได้ไหม?**
- เมื่อติดตั้งแล้ว eSIM ส่วนใหญ่ไม่สามารถโอนได้
- หากคุณลบ eSIM มักไม่สามารถติดตั้งใหม่ได้
- ติดต่อฝ่ายสนับสนุนหากต้องใช้ eSIM บนอุปกรณ์อื่นก่อนติดตั้ง

## ทางเลือก {#alternatives}

**หากคุณต้องการข้อมูลบนหลายอุปกรณ์:**

1. **ใช้ฮอตสปอต/การแชร์อินเทอร์เน็ต**
   - แชร์การเชื่อมต่อ eSIM ของโทรศัพท์กับอุปกรณ์อื่น
   - ใช้ได้กับแล็ปท็อป แท็บเล็ต โทรศัพท์อื่น
   - ใช้โควต้าข้อมูลของคุณ

2. **ซื้อ eSIM หลายตัว**
   - ซื้อ eSIM แยกสำหรับแต่ละอุปกรณ์
   - แต่ละอุปกรณ์ได้แผนข้อมูลของตัวเอง
   - ติดตามการใช้งานอิสระ

3. **แผนครอบครัว/กลุ่ม**
   - ติดต่อเราสำหรับโซลูชันหลายอุปกรณ์
   - มีบัญชีองค์กร`
      },
      {
        slug: 'when-does-my-data-plan-begin',
        category: 'esim-data-plan',
        title: 'When does my eSIM data plan begin?',
        titleTh: 'แพ็กเกจ eSIM ของฉันเริ่มเมื่อไหร่?',
        description: 'Understanding when your eSIM validity period starts',
        descriptionTh: 'ทำความเข้าใจว่าระยะเวลาใช้งาน eSIM เริ่มเมื่อไหร่',
        tableOfContents: [
          { id: 'activation-types', title: 'Activation types', titleTh: 'ประเภทการเปิดใช้งาน' },
          { id: 'best-practice', title: 'Best practice', titleTh: 'แนวทางที่ดีที่สุด' }
        ],
        content: `## Activation types {#activation-types}

**Most Mobile11 eSIMs activate upon first data use**, not upon installation. This is great for travelers!

**How it works:**
1. Purchase your eSIM (days or weeks before travel)
2. Install it on your phone (anytime)
3. Validity starts when you first connect to mobile data

**This means:**
- Install before you leave home (on Wi-Fi)
- Validity countdown begins only when you use data abroad
- No wasted days while traveling

**Check your specific plan:**
- Some plans activate upon installation
- Plan details specify activation policy
- When in doubt, install at destination

## Best practice {#best-practice}

**Recommended approach:**
1. Buy eSIM 1-2 days before travel
2. Install while on home Wi-Fi
3. Keep eSIM disabled until you arrive
4. Enable data at your destination
5. Validity countdown begins

**Pro tip:** If your eSIM activates on installation and you're not traveling immediately, wait to install until you arrive at your destination.

**Questions about a specific plan?**
Check your order confirmation email or contact our support team for clarification on your plan's activation policy.`,
        contentTh: `## ประเภทการเปิดใช้งาน {#activation-types}

**eSIM Mobile11 ส่วนใหญ่เปิดใช้งานเมื่อใช้ข้อมูลครั้งแรก** ไม่ใช่เมื่อติดตั้ง เหมาะสำหรับนักเดินทาง!

**วิธีการทำงาน:**
1. ซื้อ eSIM (หลายวันหรือสัปดาห์ก่อนเดินทาง)
2. ติดตั้งบนโทรศัพท์ (เมื่อไหร่ก็ได้)
3. อายุเริ่มนับเมื่อคุณเชื่อมต่อข้อมูลมือถือครั้งแรก

**หมายความว่า:**
- ติดตั้งก่อนออกจากบ้าน (บน Wi-Fi)
- การนับถอยหลังอายุเริ่มเฉพาะเมื่อใช้ข้อมูลในต่างประเทศ
- ไม่มีวันเสียไปขณะเดินทาง

**ตรวจสอบแผนเฉพาะของคุณ:**
- บางแผนเปิดใช้งานเมื่อติดตั้ง
- รายละเอียดแผนระบุนโยบายการเปิดใช้งาน
- หากไม่แน่ใจ ติดตั้งที่ปลายทาง

## แนวทางที่ดีที่สุด {#best-practice}

**วิธีแนะนำ:**
1. ซื้อ eSIM 1-2 วันก่อนเดินทาง
2. ติดตั้งขณะใช้ Wi-Fi ที่บ้าน
3. ปิด eSIM ไว้จนถึงปลายทาง
4. เปิดข้อมูลเมื่อถึงปลายทาง
5. การนับถอยหลังอายุเริ่ม

**เคล็ดลับ:** หาก eSIM เปิดใช้งานเมื่อติดตั้งและคุณไม่ได้เดินทางทันที รอติดตั้งจนถึงปลายทาง

**มีคำถามเกี่ยวกับแผนเฉพาะ?**
ตรวจสอบอีเมลยืนยันคำสั่งซื้อหรือติดต่อทีมสนับสนุนเพื่อชี้แจงนโยบายการเปิดใช้งานของแผน`
      },
      // ==================== ADDITIONAL PAYMENTS-BILLING ====================
      {
        slug: 'what-is-the-refund-policy',
        category: 'payments-billing',
        title: 'What is Mobile11\'s refund policy?',
        titleTh: 'นโยบายการคืนเงินของ Mobile11 คืออะไร?',
        description: 'Understanding our refund and cancellation policy',
        descriptionTh: 'ทำความเข้าใจนโยบายการคืนเงินและการยกเลิกของเรา',
        tableOfContents: [
          { id: 'refund-eligibility', title: 'Refund eligibility', titleTh: 'คุณสมบัติการขอคืนเงิน' },
          { id: 'how-to-request', title: 'How to request a refund', titleTh: 'วิธีขอคืนเงิน' }
        ],
        content: `## Refund eligibility {#refund-eligibility}

**Full refund available if:**
- eSIM has NOT been installed/activated
- QR code has NOT been scanned
- Request made within 30 days of purchase

**Partial refund may be available if:**
- eSIM doesn't work in your destination
- Technical issues prevent activation (not user error)
- Duplicate purchase by mistake

**Not eligible for refund:**
- eSIM has been installed and activated
- QR code has been scanned (even if deleted later)
- Data has been used
- Order placed more than 30 days ago

## How to request a refund {#how-to-request}

**Step 1:** Contact our support team via:
- Live chat (fastest)
- Email: support@mobile11.com

**Step 2:** Provide:
- Order number
- Reason for refund request
- Any relevant screenshots

**Step 3:** We'll review and respond within 24-48 hours

**Processing time:**
- Approval: 1-2 business days
- Refund to original payment method: 5-10 business days
- May vary by bank/card issuer

**Questions?** Our support team is happy to discuss your specific situation.`,
        contentTh: `## คุณสมบัติการขอคืนเงิน {#refund-eligibility}

**คืนเงินเต็มจำนวนได้หาก:**
- ยังไม่ได้ติดตั้ง/เปิดใช้งาน eSIM
- ยังไม่ได้สแกน QR code
- ขอภายใน 30 วันหลังซื้อ

**คืนเงินบางส่วนอาจได้หาก:**
- eSIM ไม่ทำงานในปลายทาง
- ปัญหาทางเทคนิคทำให้เปิดใช้งานไม่ได้ (ไม่ใช่ความผิดพลาดของผู้ใช้)
- ซื้อซ้ำโดยไม่ตั้งใจ

**ไม่มีสิทธิ์ขอคืนเงิน:**
- eSIM ถูกติดตั้งและเปิดใช้งานแล้ว
- QR code ถูกสแกนแล้ว (แม้ลบทีหลัง)
- ใช้ข้อมูลแล้ว
- สั่งซื้อเกิน 30 วันที่แล้ว

## วิธีขอคืนเงิน {#how-to-request}

**ขั้นตอนที่ 1:** ติดต่อทีมสนับสนุนผ่าน:
- Live chat (เร็วที่สุด)
- อีเมล: support@mobile11.com

**ขั้นตอนที่ 2:** ให้ข้อมูล:
- หมายเลขคำสั่งซื้อ
- เหตุผลการขอคืนเงิน
- ภาพหน้าจอที่เกี่ยวข้อง

**ขั้นตอนที่ 3:** เราจะตรวจสอบและตอบกลับภายใน 24-48 ชั่วโมง

**เวลาดำเนินการ:**
- อนุมัติ: 1-2 วันทำการ
- คืนเงินไปยังวิธีชำระเงินเดิม: 5-10 วันทำการ
- อาจแตกต่างตามธนาคาร/ผู้ออกบัตร

**มีคำถาม?** ทีมสนับสนุนของเรายินดีหารือเกี่ยวกับสถานการณ์เฉพาะของคุณ`
      },
      {
        slug: 'when-will-i-receive-my-esim',
        category: 'payments-billing',
        title: 'When will I receive my eSIM after payment?',
        titleTh: 'ฉันจะได้รับ eSIM เมื่อไหร่หลังชำระเงิน?',
        description: 'eSIM delivery timeline after successful payment',
        descriptionTh: 'ไทม์ไลน์การส่ง eSIM หลังชำระเงินสำเร็จ',
        tableOfContents: [
          { id: 'delivery-time', title: 'Delivery time', titleTh: 'เวลาจัดส่ง' },
          { id: 'not-received', title: 'Haven\'t received it?', titleTh: 'ยังไม่ได้รับ?' }
        ],
        content: `## Delivery time {#delivery-time}

**Instant delivery!** Your eSIM QR code is delivered immediately after successful payment.

**Where to find your eSIM:**
1. **Email** - Check your inbox (and spam folder) for order confirmation with QR code
2. **Account Dashboard** - Log in to mobile11.com and go to "My eSIMs"
3. **Order Confirmation Page** - Displayed immediately after purchase

**Typical timeline:**
- Payment confirmation: Instant
- QR code email: Within 1-5 minutes
- Most customers: Under 1 minute

## Haven't received it? {#not-received}

**Check these first:**
1. Spam/Junk folder in your email
2. Correct email address used at checkout
3. Your Mobile11 account dashboard

**Still nothing after 15 minutes?**
1. Contact our live chat support
2. Provide your order number or payment confirmation
3. We'll resend or investigate immediately

**Payment issues?**
- Some banks require additional verification
- Payment may be processing
- Check your bank statement for pending charges

**Pro tip:** Add support@mobile11.com to your contacts to prevent future emails going to spam.`,
        contentTh: `## เวลาจัดส่ง {#delivery-time}

**ส่งทันที!** QR code eSIM ส่งทันทีหลังชำระเงินสำเร็จ

**หา eSIM ได้ที่:**
1. **อีเมล** - ตรวจสอบกล่องขาเข้า (และโฟลเดอร์สแปม) สำหรับการยืนยันคำสั่งซื้อพร้อม QR code
2. **แดชบอร์ดบัญชี** - ล็อกอิน mobile11.com และไปที่ "eSIM ของฉัน"
3. **หน้ายืนยันคำสั่งซื้อ** - แสดงทันทีหลังซื้อ

**ไทม์ไลน์โดยทั่วไป:**
- ยืนยันการชำระเงิน: ทันที
- อีเมล QR code: ภายใน 1-5 นาที
- ลูกค้าส่วนใหญ่: ต่ำกว่า 1 นาที

## ยังไม่ได้รับ? {#not-received}

**ตรวจสอบเหล่านี้ก่อน:**
1. โฟลเดอร์สแปม/ขยะในอีเมล
2. ที่อยู่อีเมลถูกต้องที่ใช้ตอน checkout
3. แดชบอร์ดบัญชี Mobile11

**ยังไม่มีหลัง 15 นาที?**
1. ติดต่อ live chat สนับสนุน
2. ให้หมายเลขคำสั่งซื้อหรือการยืนยันการชำระเงิน
3. เราจะส่งใหม่หรือตรวจสอบทันที

**ปัญหาการชำระเงิน?**
- บางธนาคารต้องการการยืนยันเพิ่มเติม
- การชำระเงินอาจกำลังดำเนินการ
- ตรวจสอบใบแจ้งยอดธนาคารสำหรับรายการค้างชำระ

**เคล็ดลับ:** เพิ่ม support@mobile11.com ในรายชื่อผู้ติดต่อเพื่อป้องกันอีเมลอนาคตไปสแปม`
      },
      {
        slug: 'how-can-i-contact-customer-support',
        category: 'payments-billing',
        title: 'How can I contact customer support?',
        titleTh: 'ฉันจะติดต่อฝ่ายสนับสนุนลูกค้าได้อย่างไร?',
        description: 'All available channels to reach our support team',
        descriptionTh: 'ทุกช่องทางที่สามารถติดต่อทีมสนับสนุนของเรา',
        tableOfContents: [
          { id: 'support-channels', title: 'Support channels', titleTh: 'ช่องทางสนับสนุน' }
        ],
        content: `## Support channels {#support-channels}

**Live Chat (Recommended)**
- Available 24/7 on our website
- Click the chat bubble in the bottom right
- Fastest response time (under 5 minutes)
- Real-time assistance

**Email**
- support@mobile11.com
- Include your order number for faster service
- Response within 24 hours

**LINE Official**
- @mobile11
- Great for Thai language support
- Quick responses during business hours

**Help Center**
- Browse FAQs and guides at mobile11.com/support
- Instant answers to common questions
- Available 24/7

**Social Media**
- Facebook: @mobile11esim
- Response during business hours

**For fastest support**, always include:
- Order number
- Device model
- Description of your issue
- Any error messages or screenshots`,
        contentTh: `## ช่องทางสนับสนุน {#support-channels}

**Live Chat (แนะนำ)**
- พร้อมให้บริการ 24/7 บนเว็บไซต์
- คลิกฟองแชทที่มุมขวาล่าง
- ตอบกลับเร็วที่สุด (ต่ำกว่า 5 นาที)
- ช่วยเหลือแบบเรียลไทม์

**อีเมล**
- support@mobile11.com
- ระบุหมายเลขคำสั่งซื้อเพื่อบริการเร็วขึ้น
- ตอบกลับภายใน 24 ชั่วโมง

**LINE Official**
- @mobile11
- เหมาะสำหรับการสนับสนุนภาษาไทย
- ตอบกลับเร็วในเวลาทำการ

**Help Center**
- ค้นหา FAQ และคู่มือที่ mobile11.com/support
- คำตอบทันทีสำหรับคำถามทั่วไป
- พร้อมให้บริการ 24/7

**โซเชียลมีเดีย**
- Facebook: @mobile11esim
- ตอบกลับในเวลาทำการ

**สำหรับการสนับสนุนเร็วที่สุด** ระบุเสมอ:
- หมายเลขคำสั่งซื้อ
- รุ่นอุปกรณ์
- คำอธิบายปัญหา
- ข้อความแสดงข้อผิดพลาดหรือภาพหน้าจอ`
      }
    ];

    // Upsert all articles
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const article of articles) {
      for (const lang of ['en', 'th'] as const) {
        const record = {
          slug: article.slug,
          category: article.category,
          language: lang,
          title: lang === 'th' ? article.titleTh : article.title,
          description: lang === 'th' ? article.descriptionTh : article.description,
          content: lang === 'th' ? article.contentTh : article.content,
          table_of_contents: parseTableOfContents(article.tableOfContents, lang),
          source: 'both',
          is_published: true,
          is_internal: false,
          display_order: 0,
          updated_at: new Date().toISOString()
        };

        const { error } = await adminClient
          .from('kb_articles')
          .upsert(record, {
            onConflict: 'slug,category,language',
            ignoreDuplicates: false
          });

        if (error) {
          results.failed++;
          results.errors.push(`${article.slug} (${lang}): ${error.message}`);
        } else {
          results.success++;
        }
      }
    }

    return new Response(JSON.stringify({
      message: 'Migration complete',
      articlesProcessed: articles.length,
      recordsCreated: results.success,
      recordsFailed: results.failed,
      errors: results.errors.slice(0, 10) // First 10 errors only
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Migration error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
