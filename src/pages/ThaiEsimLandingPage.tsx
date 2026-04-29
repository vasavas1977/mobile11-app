import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { FooterAiralo } from '@/components/landing/FooterAiralo';
import { SEO, SEO_CONFIG_TH, getFAQStructuredData, getBreadcrumbStructuredData } from '@/components/SEO';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RelatedPages, RelatedPageItem } from '@/components/seo/RelatedPages';
import { supabase } from '@/integrations/supabase/client';
import { Wifi, Zap, Globe, Clock, Shield, Smartphone, CheckCircle2, ArrowRight, Star, MapPin, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

// Import hero images
import japanHero from '@/assets/thai-landing/japan-hero.jpg';
import koreaHero from '@/assets/thai-landing/korea-hero.jpg';
import taiwanHero from '@/assets/thai-landing/taiwan-hero.jpg';
import hongkongHero from '@/assets/thai-landing/hongkong-hero.jpg';
import europeHero from '@/assets/thai-landing/europe-hero.jpg';
import singaporeHero from '@/assets/thai-landing/singapore-hero.jpg';
import malaysiaHero from '@/assets/thai-landing/malaysia-hero.jpg';
import vietnamHero from '@/assets/thai-landing/vietnam-hero.jpg';
import chinaHero from '@/assets/thai-landing/china-hero.jpg';
import usaHero from '@/assets/thai-landing/usa-hero.jpg';

// Country configurations
const COUNTRY_CONFIG: Record<string, {
  countryCode: string;
  countryNameEN: string;
  countryNameTH: string;
  flagEmoji: string;
  heroImage: string;
  highlights: string[];
  carriers: string[];
  popularCities: string[];
  seoKey: keyof typeof SEO_CONFIG_TH;
}> = {
  japan: {
    countryCode: 'JP',
    countryNameEN: 'Japan',
    countryNameTH: 'ญี่ปุ่น',
    flagEmoji: '🇯🇵',
    heroImage: japanHero,
    highlights: ['โตเกียว', 'โอซาก้า', 'เกียวโต', 'ฮอกไกโด', 'โอกินาว่า'],
    carriers: ['NTT Docomo', 'Softbank', 'au (KDDI)'],
    popularCities: ['Tokyo', 'Osaka', 'Kyoto', 'Hokkaido', 'Okinawa'],
    seoKey: 'japan'
  },
  korea: {
    countryCode: 'KR',
    countryNameEN: 'South Korea',
    countryNameTH: 'เกาหลีใต้',
    flagEmoji: '🇰🇷',
    heroImage: koreaHero,
    highlights: ['โซล', 'ปูซาน', 'เชจู', 'อินชอน', 'แดกู'],
    carriers: ['SK Telecom', 'KT', 'LG U+'],
    popularCities: ['Seoul', 'Busan', 'Jeju', 'Incheon', 'Daegu'],
    seoKey: 'korea'
  },
  taiwan: {
    countryCode: 'TW',
    countryNameEN: 'Taiwan',
    countryNameTH: 'ไต้หวัน',
    flagEmoji: '🇹🇼',
    heroImage: taiwanHero,
    highlights: ['ไทเป', 'เกาสง', 'ไถจง', 'ไถหนาน', 'ฮัวเหลียน'],
    carriers: ['Chunghwa Telecom', 'Taiwan Mobile', 'FarEasTone'],
    popularCities: ['Taipei', 'Kaohsiung', 'Taichung', 'Tainan', 'Hualien'],
    seoKey: 'taiwan'
  },
  hongkong: {
    countryCode: 'HK',
    countryNameEN: 'Hong Kong',
    countryNameTH: 'ฮ่องกง',
    flagEmoji: '🇭🇰',
    heroImage: hongkongHero,
    highlights: ['เกาลูน', 'เกาะฮ่องกง', 'นิวเทอริทอรีส์', 'ลันเตา'],
    carriers: ['CSL', 'CMHK', 'SmarTone', '3 HK'],
    popularCities: ['Kowloon', 'Hong Kong Island', 'New Territories', 'Lantau'],
    seoKey: 'hongkong'
  },
  europe: {
    countryCode: 'EU',
    countryNameEN: 'Europe',
    countryNameTH: 'ยุโรป',
    flagEmoji: '🇪🇺',
    heroImage: europeHero,
    highlights: ['42 ประเทศ', 'อังกฤษ', 'ฝรั่งเศส', 'เยอรมัน', 'อิตาลี'],
    carriers: ['Multiple carriers across 42 countries'],
    popularCities: ['London', 'Paris', 'Berlin', 'Rome', 'Barcelona'],
    seoKey: 'europe'
  },
  singapore: {
    countryCode: 'SG',
    countryNameEN: 'Singapore',
    countryNameTH: 'สิงคโปร์',
    flagEmoji: '🇸🇬',
    heroImage: singaporeHero,
    highlights: ['มารีน่าเบย์', 'ออร์ชาร์ด', 'เซนโตซ่า', 'ไชน่าทาวน์', 'การ์เด้นส์บายเดอะเบย์'],
    carriers: ['Singtel', 'StarHub', 'M1'],
    popularCities: ['Marina Bay', 'Orchard', 'Sentosa', 'Chinatown', 'Clarke Quay'],
    seoKey: 'singapore'
  },
  malaysia: {
    countryCode: 'MY',
    countryNameEN: 'Malaysia',
    countryNameTH: 'มาเลเซีย',
    flagEmoji: '🇲🇾',
    heroImage: malaysiaHero,
    highlights: ['กัวลาลัมเปอร์', 'ปีนัง', 'ลังกาวี', 'มะละกา', 'เกนติ้ง'],
    carriers: ['Maxis', 'Celcom', 'Digi'],
    popularCities: ['Kuala Lumpur', 'Penang', 'Langkawi', 'Melaka', 'Genting'],
    seoKey: 'malaysia'
  },
  vietnam: {
    countryCode: 'VN',
    countryNameEN: 'Vietnam',
    countryNameTH: 'เวียดนาม',
    flagEmoji: '🇻🇳',
    heroImage: vietnamHero,
    highlights: ['ฮานอย', 'โฮจิมินห์', 'ดานัง', 'ฮาลอง', 'ฮอยอัน'],
    carriers: ['Viettel', 'Vinaphone', 'Mobifone'],
    popularCities: ['Hanoi', 'Ho Chi Minh', 'Da Nang', 'Ha Long', 'Hoi An'],
    seoKey: 'vietnam'
  },
  china: {
    countryCode: 'CN',
    countryNameEN: 'China',
    countryNameTH: 'จีน',
    flagEmoji: '🇨🇳',
    heroImage: chinaHero,
    highlights: ['ปักกิ่ง', 'เซี่ยงไฮ้', 'กวางโจว', 'เซินเจิ้น', 'หางโจว'],
    carriers: ['China Mobile', 'China Unicom', 'China Telecom'],
    popularCities: ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Hangzhou'],
    seoKey: 'china'
  },
  usa: {
    countryCode: 'US',
    countryNameEN: 'USA',
    countryNameTH: 'อเมริกา',
    flagEmoji: '🇺🇸',
    heroImage: usaHero,
    highlights: ['นิวยอร์ก', 'ลอสแองเจลิส', 'ซานฟรานซิสโก', 'ลาสเวกัส', 'ไมอามี่'],
    carriers: ['AT&T', 'T-Mobile', 'Verizon'],
    popularCities: ['New York', 'Los Angeles', 'San Francisco', 'Las Vegas', 'Miami'],
    seoKey: 'usa'
  }
};

const THAI_LANDING_RELATED_PAGES: RelatedPageItem[] = [
  {
    to: '/th/sim-roaming',
    titleEn: 'SIM Roaming Guide',
    titleTh: 'เปรียบเทียบ eSIM vs SIM Roaming',
    titleZh: 'SIM漫游指南',
    descriptionEn: 'Compare eSIM with SIM roaming',
    descriptionTh: 'ดูเปรียบเทียบราคาและคุณสมบัติ eSIM กับ SIM Roaming',
    descriptionZh: '比较eSIM与SIM漫游',
    icon: Globe
  },
  {
    to: '/what-is-esim?lang=th',
    titleEn: 'What is eSIM?',
    titleTh: 'eSIM คืออะไร?',
    titleZh: '什么是eSIM？',
    descriptionEn: 'Learn about eSIM',
    descriptionTh: 'เรียนรู้เกี่ยวกับเทคโนโลยี eSIM และวิธีใช้งาน',
    descriptionZh: '了解eSIM技术及使用方法',
    icon: Smartphone
  },
  {
    to: '/installation-guide',
    titleEn: 'Installation Guide',
    titleTh: 'คู่มือติดตั้ง eSIM',
    titleZh: '安装指南',
    descriptionEn: 'Step-by-step installation',
    descriptionTh: 'วิธีติดตั้ง eSIM ทีละขั้นตอน ง่ายมาก',
    descriptionZh: '分步安装eSIM教程',
    icon: BookOpen
  }
];

interface Package {
  id: string;
  name: string;
  data_amount: string;
  validity_days: number;
  price: number;
  package_type: string;
  qos_speed: string | null;
}

export function ThaiEsimLandingPage() {
  const { country } = useParams<{ country: string }>();
  const navigate = useNavigate();
  const { t, formatPrice, language } = useLanguage();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  const config = country ? COUNTRY_CONFIG[country] : null;

  useEffect(() => {
    if (!config) return;

    const fetchPackages = async () => {
      setLoading(true);
      let query = supabase
        .from('esim_packages')
        .select('id, name, data_amount, validity_days, price, package_type, qos_speed')
        .eq('is_active', true)
        .order('price', { ascending: true })
        .limit(6);

      if (config.countryCode === 'EU') {
        // For Europe, get regional packages
        query = query.ilike('country_name', '%Europe%');
      } else {
        query = query.eq('country_code', config.countryCode);
      }

      const { data, error } = await query;
      if (!error && data) {
        setPackages(data);
      }
      setLoading(false);
    };

    fetchPackages();
  }, [config]);

  if (!config || !country) {
    return null;
  }

  const seoConfig = SEO_CONFIG_TH[config.seoKey];
  const canonicalUrl = `https://mobile11.com/th/esim-${country}`;

  const faqData = [
    {
      question: `ซิม${config.countryNameTH} eSIM คืออะไร?`,
      answer: `eSIM คือซิมดิจิทัลที่ไม่ต้องใช้ซิมการ์ดจริง สามารถดาวน์โหลดและเปิดใช้งานได้ทันทีผ่าน QR Code ใช้งานได้ใน${config.countryNameTH}ทันทีที่ลงจากเครื่องบิน`
    },
    {
      question: `ซิม${config.countryNameTH}ราคาเท่าไหร่?`,
      answer: `ซิม${config.countryNameTH} eSIM ราคาเริ่มต้นเพียง ฿99 เน็ตไม่อั้น ไม่มีค่าโรมมิ่ง ราคาถูกกว่าซิมปกติและโรมมิ่งจากค่ายมือถือไทย`
    },
    {
      question: `วิธีซื้อซิม${config.countryNameTH}ทำอย่างไร?`,
      answer: `ซื้อง่ายมาก! 1) เลือกแพ็คเกจที่ต้องการ 2) ชำระเงินออนไลน์ 3) รับ QR Code ทางอีเมล 4) สแกน QR เพื่อติดตั้ง eSIM บนมือถือของคุณ`
    },
    {
      question: `มือถือรุ่นไหนรองรับ eSIM?`,
      answer: `iPhone XS ขึ้นไป, Samsung Galaxy S20 ขึ้นไป, Google Pixel 3 ขึ้นไป และมือถือ Android รุ่นใหม่ส่วนใหญ่รองรับ eSIM`
    },
    {
      question: `eSIM ${config.countryNameTH} ดีกว่า sim roaming อย่างไร?`,
      answer: `eSIM ราคาถูกกว่า sim roaming จากค่ายมือถือไทย 5-10 เท่า ไม่ต้องเปิดโรมมิ่ง ไม่มีค่าบริการรายวัน และใช้เน็ตได้เต็มสปีดใน${config.countryNameTH}`
    }
  ];

  const breadcrumbData = [
    { name: 'หน้าแรก', url: 'https://mobile11.com' },
    { name: 'แพ็คเกจ eSIM', url: 'https://mobile11.com/packages' },
    { name: `ซิม${config.countryNameTH}`, url: canonicalUrl }
  ];

  const structuredData = {
    ...getFAQStructuredData(faqData),
    ...getBreadcrumbStructuredData(breadcrumbData)
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={seoConfig.title}
        description={seoConfig.description}
        keywords={seoConfig.keywords}
        canonical={canonicalUrl}
        structuredData={structuredData}
        alternateLanguages={[
          { lang: 'th', url: canonicalUrl },
          { lang: 'en', url: `https://mobile11.com/packages?country=${config.countryNameEN}` }
        ]}
      />

      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-4xl mx-auto"
            >
              <Badge variant="outline" className="mb-4 text-lg px-4 py-1">
                {config.flagEmoji} ซิม{config.countryNameTH} 2025
              </Badge>
              <h1 className="text-3xl md:text-5xl font-bold mb-6">
                ซิม{config.countryNameTH} eSIM{' '}
                <span className="text-primary">เน็ตไม่อั้น</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                {seoConfig.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="text-lg px-8"
                  onClick={() => navigate(`/packages?country=${config.countryNameEN}`)}
                >
                  ดูแพ็คเกจทั้งหมด
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8"
                  onClick={() => navigate('/what-is-esim')}
                >
                  eSIM คืออะไร?
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[
                { icon: Zap, label: 'เปิดใช้งานทันที', desc: 'รับ QR ภายใน 1 นาที' },
                { icon: Wifi, label: 'เน็ตไม่อั้น', desc: 'ไม่มีกั๊ก ไม่มีลด' },
                { icon: Shield, label: 'ปลอดภัย 100%', desc: 'ชำระเงินปลอดภัย' },
                { icon: Globe, label: config.countryCode === 'EU' ? '42 ประเทศ' : 'ครอบคลุมทั่วประเทศ', desc: config.carriers[0] }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="p-4 text-center h-full">
                    <feature.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <h3 className="font-semibold text-sm md:text-base">{feature.label}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground">{feature.desc}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Destinations */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
              <MapPin className="inline-block mr-2 h-6 w-6 text-primary" />
              เที่ยว{config.countryNameTH}ที่ไหนก็ออนไลน์ได้
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              {config.highlights.map((city, index) => (
                <Badge key={index} variant="secondary" className="text-base px-4 py-2">
                  {city}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        {/* Packages Section */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">
              แพ็คเกจซิม{config.countryNameTH}ยอดนิยม
            </h2>
            <p className="text-center text-muted-foreground mb-8">
              เลือกแพ็คเกจที่เหมาะกับการเดินทางของคุณ
            </p>
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-6 animate-pulse">
                    <div className="h-6 bg-muted rounded w-3/4 mb-4" />
                    <div className="h-10 bg-muted rounded w-1/2 mb-4" />
                    <div className="h-4 bg-muted rounded w-full mb-2" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </Card>
                ))}
              </div>
            ) : packages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {packages.slice(0, 6).map((pkg, index) => (
                  <motion.div
                    key={pkg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card className="p-6 h-full flex flex-col hover:shadow-lg transition-shadow">
                      {index === 0 && (
                        <Badge className="w-fit mb-2 bg-primary">
                          <Star className="h-3 w-3 mr-1" /> ขายดี
                        </Badge>
                      )}
                      <h3 className="font-semibold text-lg mb-2">{pkg.name}</h3>
                      <div className="text-3xl font-bold text-primary mb-4">
                        {formatPrice(pkg.price)}
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground flex-grow">
                        <div className="flex items-center gap-2">
                          <Wifi className="h-4 w-4" />
                          <span>{pkg.data_amount}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{pkg.validity_days} วัน</span>
                        </div>
                        {pkg.qos_speed && (
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            <span>ความเร็ว {pkg.qos_speed}</span>
                          </div>
                        )}
                      </div>
                      <Button
                        className="w-full mt-4"
                        onClick={() => navigate(`/create-order/${pkg.id}`)}
                      >
                        ซื้อเลย
                      </Button>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">ไม่พบแพ็คเกจ</p>
                <Button onClick={() => navigate('/packages')}>
                  ดูแพ็คเกจทั้งหมด
                </Button>
              </div>
            )}

            <div className="text-center mt-8">
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate(`/packages?country=${config.countryNameEN}`)}
              >
                ดูแพ็คเกจซิม{config.countryNameTH}ทั้งหมด
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
              วิธีซื้อซิม{config.countryNameTH} ง่ายใน 3 ขั้นตอน
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { step: 1, title: 'เลือกแพ็คเกจ', desc: `เลือกแพ็คเกจซิม${config.countryNameTH}ที่เหมาะกับคุณ` },
                { step: 2, title: 'ชำระเงิน', desc: 'ชำระเงินออนไลน์ ปลอดภัย รับ QR ทันที' },
                { step: 3, title: 'สแกน QR ติดตั้ง', desc: 'สแกน QR Code ติดตั้ง eSIM บนมือถือ พร้อมใช้งาน!' }
              ].map((item) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: item.step * 0.1 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary">{item.step}</span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
              คำถามที่พบบ่อยเกี่ยวกับซิม{config.countryNameTH}
            </h2>
            <div className="max-w-3xl mx-auto space-y-4">
              {faqData.map((faq, index) => (
                <Card key={index} className="p-6">
                  <h3 className="font-semibold text-lg mb-2 flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    {faq.question}
                  </h3>
                  <p className="text-muted-foreground ml-7">{faq.answer}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary/10">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              พร้อมเที่ยว{config.countryNameTH}แบบไม่ขาดเน็ต?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              ซื้อซิม{config.countryNameTH} eSIM วันนี้ รับ QR Code ทันที พร้อมใช้งานทันทีที่ลงจากเครื่องบิน
            </p>
            <Button
              size="lg"
              className="text-lg px-8"
              onClick={() => navigate(`/packages?country=${config.countryNameEN}`)}
            >
              ซื้อซิม{config.countryNameTH}เลย
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>

        {/* Related Pages */}
        <RelatedPages items={THAI_LANDING_RELATED_PAGES} titleTh="แหล่งข้อมูลที่เป็นประโยชน์" titleEn="Helpful Resources" />
      </main>

      <FooterAiralo />
    </div>
  );
}