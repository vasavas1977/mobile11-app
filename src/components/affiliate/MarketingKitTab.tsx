import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Copy, Check, Download, FileText, Image, Palette, Mail, 
  ExternalLink, Sparkles, Star, Hash
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

// Banner images - served from Supabase Storage (not bundled)
const STORAGE_BASE = 'https://jaqyvbjllsanrnpzlyjw.supabase.co/storage/v1/object/public/assets';

const bannerStoryEn = `${STORAGE_BASE}/banners/en/banner-story.png`;
const bannerSquareEn = `${STORAGE_BASE}/banners/en/banner-square.png`;
const bannerSquareAltEn = `${STORAGE_BASE}/banners/en/banner-square-alt.png`;
const bannerSocialEn = `${STORAGE_BASE}/banners/en/banner-social.png`;
const bannerStoryTh = `${STORAGE_BASE}/banners/th/banner-story.png`;
const bannerSquareTh = `${STORAGE_BASE}/banners/th/banner-square.png`;
const bannerSquareAltTh = `${STORAGE_BASE}/banners/th/banner-square-alt.png`;
const bannerStoryAltTh = `${STORAGE_BASE}/banners/th/banner-story-alt.png`;

import logo from '@/assets/logo.png';

interface MarketingKitTabProps {
  isPartnerManager: boolean;
  affiliateCode: string;
}

const promotionalCopy = {
  ultraShort: [
    { label: 'Twitter/X', text: 'Unlimited data in 151 countries 🌍 No roaming fees. Get eSIM now →', textTh: 'เน็ตไม่อั้น 151 ประเทศ 🌍 ไม่มีค่าโรมมิ่ง →' },
    { label: 'SMS', text: 'Travel connected! Mobile11 eSIM - unlimited data worldwide. Use my link!', textTh: 'เที่ยวติดเน็ต! Mobile11 eSIM เน็ตไม่อั้นทั่วโลก' },
  ],
  short: [
    { label: 'Instagram Caption', text: '✈️ Never hunt for WiFi again! With Mobile11 eSIM, I stay connected in 151 countries with unlimited data. No SIM swapping, instant activation. Link in bio!', textTh: '✈️ ไม่ต้องหา WiFi อีกแล้ว! Mobile11 eSIM เน็ตไม่อั้น 151 ประเทศ ไม่ต้องเปลี่ยนซิม เปิดใช้ทันที' },
    { label: 'Facebook Post', text: 'Just discovered the best travel hack! 🌏 Mobile11 eSIM gives you unlimited data in 151 countries. Download, scan, connect - that simple! Perfect for digital nomads and frequent travelers.', textTh: 'เคล็ดลับท่องเที่ยว! 🌏 Mobile11 eSIM เน็ตไม่อั้น 151 ประเทศ โหลด สแกน เชื่อมต่อ ง่ายมาก!' },
  ],
  medium: [
    { label: 'Blog Intro', text: 'Tired of expensive roaming charges or hunting for local SIMs at every airport? I switched to Mobile11 eSIM and it changed how I travel. Unlimited data in 151 countries, instant activation via QR code, and plans starting from just $2.99. No more dealing with physical SIM cards or hidden fees.', textTh: 'เบื่อค่าโรมมิ่งแพง หรือต้องหาซิมท้องถิ่นทุกครั้งที่บิน? ผมเปลี่ยนมาใช้ Mobile11 eSIM แล้วเปลี่ยนการเดินทางไปเลย เน็ตไม่อั้น 151 ประเทศ เปิดใช้ทันทีผ่าน QR code เริ่มต้นแค่ 99 บาท' },
    { label: 'Newsletter', text: 'Quick tip for my fellow travelers: Stop overpaying for mobile data abroad! Mobile11 eSIM offers unlimited data in 151 countries with transparent pricing. I\'ve used it across Asia, Europe, and the Americas - works flawlessly every time. Use my referral link for the best rates!', textTh: 'เคล็ดลับสำหรับนักเดินทาง: หยุดจ่ายแพงสำหรับเน็ตต่างประเทศ! Mobile11 eSIM เน็ตไม่อั้น 151 ประเทศ ราคาโปร่งใส ใช้ได้ทั้งเอเชีย ยุโรป อเมริกา' },
  ],
  urgency: [
    { label: 'Flash Sale', text: '⚡ LIMITED TIME: Get unlimited eSIM data before your trip! Mobile11 covers 151 countries. Activate in seconds, travel worry-free. Don\'t miss out →', textTh: '⚡ โปรด่วน: รับ eSIM เน็ตไม่อั้นก่อนเดินทาง! ครอบคลุม 151 ประเทศ เปิดใช้ทันที →' },
    { label: 'FOMO', text: '🚨 Still using expensive roaming? Smart travelers switched to Mobile11 eSIM. Unlimited data, 151 countries, from $2.99. Why pay more?', textTh: '🚨 ยังใช้โรมมิ่งแพงอยู่? คนเก่งเปลี่ยนมาใช้ Mobile11 eSIM เน็ตไม่อั้น 151 ประเทศ ทำไมต้องจ่ายแพง?' },
  ],
  story: [
    { label: 'Video Hook', text: '"I used to spend $50/day on roaming... until I found this" (Show eSIM QR scan) Now I have unlimited data anywhere for a fraction of the cost. Mobile11 eSIM - the travel hack you need.', textTh: '"เคยจ่ายวันละ 1,500 บาทสำหรับโรมมิ่ง... จนกว่าจะเจอ" (โชว์สแกน QR) ตอนนี้เน็ตไม่อั้นทุกที่ในราคาถูกกว่ามาก' },
    { label: 'Testimonial', text: 'My flight landed at midnight in Tokyo. No kiosk open, no WiFi. But I had Mobile11 eSIM ready - activated before takeoff. Instantly connected. That peace of mind? Priceless.', textTh: 'เครื่องลงโตเกียวตอนเที่ยงคืน ไม่มีร้านเปิด ไม่มี WiFi แต่ผมมี Mobile11 eSIM พร้อมใช้ - เปิดก่อนขึ้นเครื่อง เชื่อมต่อทันที ความอุ่นใจแบบนี้ ประเมินค่าไม่ได้' },
  ],
};

const hashtags = {
  travel: ['#travel', '#digitalnomad', '#travelhack', '#wanderlust', '#traveltech', '#esim', '#noroaming'],
  tech: ['#esim', '#traveltech', '#mobile', '#connectivity', '#smarttravel', '#techlife'],
  lifestyle: ['#traveler', '#explorer', '#adventure', '#globetrotter', '#jetset', '#worldtraveler'],
};

const hashtagsTh = {
  travelTh: ['#เที่ยว', '#ท่องเที่ยว', '#ไปเที่ยว', '#เดินทาง', '#บินเลย', '#เที่ยวต่างประเทศ', '#แบกเป้'],
  techTh: ['#เน็ตไม่อั้น', '#อีซิม', '#เน็ตต่างประเทศ', '#โรมมิ่ง', '#ไม่มีโรมมิ่ง', '#เทคโนโลยี'],
  lifestyleTh: ['#นักเดินทาง', '#ชีวิตดิจิทัล', '#ทำงานที่ไหนก็ได้', '#ดิจิทัลโนแมด', '#ไลฟ์สไตล์'],
};

const emailTemplatesEn = [
  {
    name: 'Welcome Email',
    subject: 'Your Secret to Staying Connected While Traveling',
    body: `Hi [Name],

Planning your next trip? Here's a travel hack that changed how I explore the world.

Mobile11 eSIM gives you unlimited mobile data in 151 countries - no SIM swapping, no roaming fees, no stress.

✅ Instant activation via QR code
✅ Works in 151+ countries
✅ Unlimited data plans from $2.99
✅ No physical SIM needed

I've been using it for months and it's been a game-changer. Use my link to get started:

[YOUR AFFILIATE LINK]

Safe travels!
[Your Name]`,
  },
  {
    name: 'Follow-up',
    subject: 'Still thinking about eSIM? Here\'s why travelers love it',
    body: `Hey [Name],

Remember when I mentioned Mobile11 eSIM?

Here's what users are saying:
- "Best travel investment I've made"
- "Activated in 30 seconds"
- "Never going back to physical SIMs"

Works in 151 countries including: Japan, Thailand, USA, UK, Australia, and more.

Ready to travel connected? [YOUR AFFILIATE LINK]

[Your Name]`,
  },
  {
    name: 'Trip Planning',
    subject: 'Before you book: Don\'t forget mobile data!',
    body: `Hi [Name],

Booking your trip to [Destination]? Don't forget the most important thing: staying connected!

Mobile11 eSIM covers [Destination] with unlimited data. Set it up before you leave:

1. Buy your plan (takes 2 minutes)
2. Scan the QR code
3. Activate when you land
4. Enjoy unlimited data!

No hunting for SIM cards at the airport. No surprise roaming bills.

Get yours here: [YOUR AFFILIATE LINK]

Happy travels!
[Your Name]`,
  },
  {
    name: 'Special Offer',
    subject: '🎉 Special deal on travel data - limited time!',
    body: `[Name]!

Quick heads up - Mobile11 is running a special right now.

Unlimited eSIM data in 151 countries. I know you've been planning that trip, and this is perfect timing.

Why I recommend it:
→ No roaming charges
→ Instant activation
→ Works on iPhone & Android
→ Plans from $2.99

Don't miss out: [YOUR AFFILIATE LINK]

[Your Name]`,
  },
];

const emailTemplatesTh = [
  {
    name: 'ยินดีต้อนรับ',
    subject: 'เคล็ดลับเชื่อมต่อเน็ตตอนเดินทาง',
    body: `สวัสดีครับ/ค่ะ [ชื่อ],

วางแผนเที่ยวเร็วๆ นี้? นี่คือเคล็ดลับที่เปลี่ยนการเดินทางของผม/ฉัน

Mobile11 eSIM ให้เน็ตไม่อั้นใน 151 ประเทศ - ไม่ต้องเปลี่ยนซิม ไม่มีค่าโรมมิ่ง ไม่มีความเครียด

✅ เปิดใช้ทันทีผ่าน QR code
✅ ใช้ได้ 151+ ประเทศ
✅ แพ็คเกจเน็ตไม่อั้นเริ่มต้น 99 บาท
✅ ไม่ต้องใช้ซิมการ์ด

ใช้มาหลายเดือนแล้ว เปลี่ยนชีวิตเลย ใช้ลิงก์นี้เริ่มต้นเลย:

[YOUR AFFILIATE LINK]

เดินทางปลอดภัย!
[ชื่อของคุณ]`,
  },
  {
    name: 'ติดตามผล',
    subject: 'ยังคิดเรื่อง eSIM อยู่? นี่คือเหตุผลที่นักเดินทางชอบ',
    body: `เฮ้ [ชื่อ],

จำที่ผม/ฉันเล่าเรื่อง Mobile11 eSIM ได้มั้ย?

นี่คือสิ่งที่ผู้ใช้พูด:
- "การลงทุนเดินทางที่ดีที่สุด"
- "เปิดใช้ใน 30 วินาที"
- "ไม่กลับไปใช้ซิมกายภาพอีกแล้ว"

ใช้ได้ใน 151 ประเทศ รวมถึง: ญี่ปุ่น ไทย สหรัฐอเมริกา อังกฤษ ออสเตรเลีย และอีกมากมาย

พร้อมเดินทางแบบติดเน็ต? [YOUR AFFILIATE LINK]

[ชื่อของคุณ]`,
  },
  {
    name: 'วางแผนเที่ยว',
    subject: 'ก่อนจอง: อย่าลืมเน็ตมือถือ!',
    body: `สวัสดี [ชื่อ],

กำลังจองทริปไป [ปลายทาง]? อย่าลืมสิ่งสำคัญที่สุด: การเชื่อมต่อ!

Mobile11 eSIM ครอบคลุม [ปลายทาง] ด้วยเน็ตไม่อั้น ตั้งค่าก่อนออกเดินทาง:

1. ซื้อแพ็คเกจ (ใช้เวลา 2 นาที)
2. สแกน QR code
3. เปิดใช้ตอนลงเครื่อง
4. ใช้เน็ตไม่อั้น!

ไม่ต้องหาซิมที่สนามบิน ไม่มีบิลโรมมิ่งเซอร์ไพรส์

รับเลยที่นี่: [YOUR AFFILIATE LINK]

เดินทางสนุก!
[ชื่อของคุณ]`,
  },
  {
    name: 'โปรพิเศษ',
    subject: '🎉 ดีลพิเศษเน็ตเที่ยว - เวลาจำกัด!',
    body: `[ชื่อ]!

แจ้งด่วน - Mobile11 มีโปรพิเศษตอนนี้

eSIM เน็ตไม่อั้นใน 151 ประเทศ รู้ว่าวางแผนเที่ยวอยู่ จังหวะเพอร์เฟกต์เลย

ทำไมถึงแนะนำ:
→ ไม่มีค่าโรมมิ่ง
→ เปิดใช้ทันที
→ ใช้ได้ทั้ง iPhone และ Android
→ แพ็คเกจเริ่มต้น 99 บาท

อย่าพลาด: [YOUR AFFILIATE LINK]

[ชื่อของคุณ]`,
  },
];

const bannersEn = [
  { name: 'Story Format', size: '1080×1920', desc: 'Instagram/TikTok Stories, Reels', image: bannerStoryEn, platform: 'Stories' },
  { name: 'Square', size: '1024×1024', desc: 'Instagram posts, widgets', image: bannerSquareEn, platform: 'Social' },
  { name: 'Square Alt', size: '1024×1024', desc: 'Alternative square design', image: bannerSquareAltEn, platform: 'Social' },
  { name: 'Social Share', size: '1200×630', desc: 'Facebook, LinkedIn, Twitter', image: bannerSocialEn, platform: 'Social' },
];

const bannersTh = [
  { name: 'Story Format', size: '1080×1920', desc: 'Instagram/TikTok Stories, Reels', image: bannerStoryTh, platform: 'Stories' },
  { name: 'Square', size: '1024×1024', desc: 'โพสต์ Instagram วิดเจ็ต', image: bannerSquareTh, platform: 'Social' },
  { name: 'Square Alt', size: '1024×1024', desc: 'ดีไซน์สี่เหลี่ยมแบบอื่น', image: bannerSquareAltTh, platform: 'Social' },
  { name: 'Story Alt', size: '1080×1920', desc: 'Instagram/TikTok Stories แบบอื่น', image: bannerStoryAltTh, platform: 'Stories' },
];

const brandGuidelinesEn = [
  'Always use official logos - do not modify colors or proportions',
  'Maintain clear space around the logo equal to the height of "11"',
  'Use brand colors consistently across all marketing materials',
  'Do not make false claims about pricing, coverage, or features',
  'Always include proper disclosure that you\'re an affiliate',
];

const brandGuidelinesTh = [
  'ใช้โลโก้อย่างเป็นทางการเท่านั้น - ห้ามแก้ไขสีหรือสัดส่วน',
  'รักษาพื้นที่ว่างรอบโลโก้ให้เท่ากับความสูงของ "11"',
  'ใช้สีแบรนด์อย่างสม่ำเสมอในสื่อการตลาดทั้งหมด',
  'ห้ามอ้างข้อมูลเท็จเกี่ยวกับราคา พื้นที่ครอบคลุม หรือฟีเจอร์',
  'เปิดเผยเสมอว่าคุณเป็น Affiliate',
];

export function MarketingKitTab({ isPartnerManager, affiliateCode }: MarketingKitTabProps) {
  const { toast } = useToast();
  const { language, t } = useLanguage();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<string>('copy');

  const langKey = (language === 'th' || language === 'ja') ? language : 'en';
  const emailTemplates = langKey === 'th' ? emailTemplatesTh : emailTemplatesEn;
  const brandGuidelines = langKey === 'th' ? brandGuidelinesTh : brandGuidelinesEn;
  const banners = langKey === 'th' ? bannersTh : bannersEn;

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({ title: t('affiliateMarketing.toast.copied'), description: t('affiliateMarketing.toast.copiedDesc') });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadImage = async (imageSrc: string, filename: string) => {
    try {
      // Fetch the image as blob to enable proper download
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      
      toast({ title: t('affiliateMarketing.toast.downloadStarted'), description: `${filename} ${t('affiliateMarketing.toast.downloading')}` });
    } catch (error) {
      console.error('Download failed:', error);
      toast({ title: 'Download failed', description: 'Please try again', variant: 'destructive' });
    }
  };

  const CopyButton = ({ text, id }: { text: string; id: string }) => (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => copyToClipboard(text, id)}
      className="shrink-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
    >
      {copiedId === id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
    </Button>
  );

  return (
    <div className="space-y-6">
      {/* Quick Stats Banner */}
      <div className="bg-gradient-to-r from-orange-50 via-orange-50/50 to-transparent rounded-lg p-4 border border-orange-200">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-orange-500" />
          <div>
            <p className="font-medium text-gray-900">{t('affiliateMarketing.yourLink')}</p>
            <code className="text-sm text-orange-600">https://mobile11.com?ref={affiliateCode}</code>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className="ml-auto bg-white border-gray-200 hover:bg-gray-50 text-gray-700"
            onClick={() => copyToClipboard(`https://mobile11.com?ref=${affiliateCode}`, 'main-link')}
          >
            {copiedId === 'main-link' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-gray-600" />}
          </Button>
        </div>
      </div>

      {/* Promotional Copy Section */}
      <Collapsible open={openSection === 'copy'} onOpenChange={() => setOpenSection(openSection === 'copy' ? '' : 'copy')}>
        <Card className="bg-white border-gray-200 shadow-sm">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-orange-500" />
                  <div>
                    <CardTitle className="text-lg text-gray-900">{t('affiliateMarketing.sections.copy.title')}</CardTitle>
                    <CardDescription className="text-gray-600">{t('affiliateMarketing.sections.copy.description')}</CardDescription>
                  </div>
                </div>
                <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${openSection === 'copy' ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <Tabs defaultValue="ultraShort" className="w-full">
                <TabsList className="grid grid-cols-5 w-full bg-gray-100 border border-gray-200">
                  <TabsTrigger value="ultraShort" className="text-xs text-gray-700 data-[state=active]:bg-orange-500 data-[state=active]:text-white">{t('affiliateMarketing.tabs.ultraShort')}</TabsTrigger>
                  <TabsTrigger value="short" className="text-xs text-gray-700 data-[state=active]:bg-orange-500 data-[state=active]:text-white">{t('affiliateMarketing.tabs.short')}</TabsTrigger>
                  <TabsTrigger value="medium" className="text-xs text-gray-700 data-[state=active]:bg-orange-500 data-[state=active]:text-white">{t('affiliateMarketing.tabs.medium')}</TabsTrigger>
                  <TabsTrigger value="urgency" className="text-xs text-gray-700 data-[state=active]:bg-orange-500 data-[state=active]:text-white">{t('affiliateMarketing.tabs.urgency')}</TabsTrigger>
                  <TabsTrigger value="story" className="text-xs text-gray-700 data-[state=active]:bg-orange-500 data-[state=active]:text-white">{t('affiliateMarketing.tabs.story')}</TabsTrigger>
                </TabsList>

                {Object.entries(promotionalCopy).map(([key, copies]) => (
                  <TabsContent key={key} value={key} className="space-y-4 mt-4">
                    {copies.map((item, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="secondary" className="bg-gray-200 text-gray-700">{item.label}</Badge>
                          <CopyButton text={langKey === 'th' ? item.textTh : item.text} id={`${key}-${index}`} />
                        </div>
                        <p className="text-sm text-gray-700">{langKey === 'th' ? item.textTh : item.text}</p>
                      </div>
                    ))}
                  </TabsContent>
                ))}
              </Tabs>

              {/* Hashtags */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <Hash className="h-4 w-4 text-orange-500" />
                  <span className="font-medium text-sm text-gray-900">{t('affiliateMarketing.hashtagSets')}</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {Object.entries(langKey === 'th' ? hashtagsTh : hashtags).map(([category, tags]) => (
                    <div key={category} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="capitalize border-gray-300 text-gray-700">
                          {langKey === 'th' 
                            ? t(`affiliateMarketing.hashtagCategories.${category}`)
                            : category
                          }
                        </Badge>
                        <CopyButton text={tags.join(' ')} id={`hashtags-${category}`} />
                      </div>
                      <p className="text-xs text-gray-500 break-all">{tags.join(' ')}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Banner Assets Section */}
      <Collapsible open={openSection === 'banners'} onOpenChange={() => setOpenSection(openSection === 'banners' ? '' : 'banners')}>
        <Card className="bg-white border-gray-200 shadow-sm">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image className="h-5 w-5 text-orange-500" />
                  <div>
                    <CardTitle className="text-lg text-gray-900">{t('affiliateMarketing.sections.banners.title')}</CardTitle>
                    <CardDescription className="text-gray-600">{t('affiliateMarketing.sections.banners.description')}</CardDescription>
                  </div>
                </div>
                <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${openSection === 'banners' ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {banners.map((banner, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg overflow-hidden hover:border-orange-300 transition-colors bg-white">
                    <div className="aspect-video bg-gray-100 relative overflow-hidden">
                      <img 
                        src={banner.image} 
                        alt={banner.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{banner.name}</span>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs border-gray-300 text-gray-600">{banner.size}</Badge>
                          <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">{banner.platform}</Badge>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">{banner.desc}</p>
                      <Button 
                        size="sm" 
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                        onClick={() => downloadImage(banner.image, `mobile11-${banner.name.toLowerCase().replace(' ', '-')}.png`)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {t('affiliateMarketing.buttons.download')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {isPartnerManager && (
                <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-4 w-4 text-orange-500" />
                    <span className="font-medium text-sm text-gray-900">{t('affiliateMarketing.partnerExclusive.title')}</span>
                  </div>
                  <p className="text-xs text-gray-600">{t('affiliateMarketing.partnerExclusive.description')}</p>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Email Templates Section */}
      <Collapsible open={openSection === 'email'} onOpenChange={() => setOpenSection(openSection === 'email' ? '' : 'email')}>
        <Card className="bg-white border-gray-200 shadow-sm">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-orange-500" />
                  <div>
                    <CardTitle className="text-lg text-gray-900">{t('affiliateMarketing.sections.email.title')}</CardTitle>
                    <CardDescription className="text-gray-600">{t('affiliateMarketing.sections.email.description')}</CardDescription>
                  </div>
                </div>
                <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${openSection === 'email' ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {emailTemplates.map((template, index) => (
                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                  <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-900">{template.name}</span>
                      <p className="text-xs text-gray-500 mt-1">{t('affiliateMarketing.subject')}: {template.subject}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-200 text-gray-700 hover:bg-gray-100"
                      onClick={() => copyToClipboard(
                        `${t('affiliateMarketing.subject')}: ${template.subject}\n\n${template.body.replace('[YOUR AFFILIATE LINK]', `https://mobile11.com?ref=${affiliateCode}`)}`,
                        `email-${index}`
                      )}
                    >
                      {copiedId === `email-${index}` ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 mr-1" />}
                      {t('affiliateMarketing.buttons.copyAll')}
                    </Button>
                  </div>
                  <div className="p-4">
                    <pre className="text-xs whitespace-pre-wrap font-sans text-gray-600 leading-relaxed">
                      {template.body.replace('[YOUR AFFILIATE LINK]', `https://mobile11.com?ref=${affiliateCode}`)}
                    </pre>
                  </div>
                </div>
              ))}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Brand Assets Section */}
      <Collapsible open={openSection === 'brand'} onOpenChange={() => setOpenSection(openSection === 'brand' ? '' : 'brand')}>
        <Card className="bg-white border-gray-200 shadow-sm">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-orange-500" />
                  <div>
                    <CardTitle className="text-lg text-gray-900">{t('affiliateMarketing.sections.brand.title')}</CardTitle>
                    <CardDescription className="text-gray-600">{t('affiliateMarketing.sections.brand.description')}</CardDescription>
                  </div>
                </div>
                <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${openSection === 'brand' ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border border-gray-200 rounded-lg p-4 text-center bg-white">
                  <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mx-auto mb-3 border border-gray-200">
                    <img src={logo} alt="Mobile11 Logo" className="w-12 h-12 object-contain" />
                  </div>
                  <p className="font-medium text-sm text-gray-900">{t('affiliateMarketing.brand.logoLight')}</p>
                  <p className="text-xs text-gray-500 mb-3">PNG</p>
                  <Button size="sm" variant="outline" className="w-full border-gray-200 text-gray-700 hover:bg-gray-50" onClick={() => downloadImage(logo, 'mobile11-logo.png')}>
                    <Download className="h-3 w-3 mr-1" />
                    {t('affiliateMarketing.buttons.download')}
                  </Button>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 text-center bg-white">
                  <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <img src={logo} alt="Mobile11 Logo" className="w-12 h-12 object-contain" />
                  </div>
                  <p className="font-medium text-sm text-gray-900">{t('affiliateMarketing.brand.logoDark')}</p>
                  <p className="text-xs text-gray-500 mb-3">PNG</p>
                  <Button size="sm" variant="outline" className="w-full border-gray-200 text-gray-700 hover:bg-gray-50" onClick={() => downloadImage(logo, 'mobile11-logo-dark.png')}>
                    <Download className="h-3 w-3 mr-1" />
                    {t('affiliateMarketing.buttons.download')}
                  </Button>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 text-center bg-white">
                  <div className="w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-3 bg-gradient-to-br from-orange-500 to-cyan-500">
                    <span className="text-white font-bold text-lg">11</span>
                  </div>
                  <p className="font-medium text-sm text-gray-900">{t('affiliateMarketing.brand.colors')}</p>
                  <p className="text-xs text-gray-500 mb-3">#0ea5e9, #06b6d4</p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full border-gray-200 text-gray-700 hover:bg-gray-50"
                    onClick={() => copyToClipboard('Primary: #0ea5e9\nSecondary: #06b6d4\nBackground: #0f172a', 'colors')}
                  >
                    {copiedId === 'colors' ? <Check className="h-3 w-3 mr-1 text-green-500" /> : <Copy className="h-3 w-3 mr-1" />}
                    {t('affiliateMarketing.buttons.copyColors')}
                  </Button>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 text-center bg-white">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <ExternalLink className="h-6 w-6 text-gray-500" />
                  </div>
                  <p className="font-medium text-sm text-gray-900">{t('affiliateMarketing.brand.coverageMap')}</p>
                  <p className="text-xs text-gray-500 mb-3">{t('affiliateMarketing.brand.countries')}</p>
                  <Button size="sm" variant="outline" className="w-full border-gray-200 text-gray-700 hover:bg-gray-50" asChild>
                    <a href="/packages" target="_blank">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      {t('affiliateMarketing.buttons.view')}
                    </a>
                  </Button>
                </div>
              </div>

              {/* Brand Guidelines */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-medium mb-3 text-gray-900">{t('affiliateMarketing.brandGuidelines')}</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  {brandGuidelines.map((guideline, index) => (
                    <li key={index}>• {guideline}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
