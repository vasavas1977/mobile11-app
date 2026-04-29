import { useNavigate, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { FooterAiralo } from '@/components/landing/FooterAiralo';
import { SEO, SEO_CONFIG_TH, getFAQStructuredData, getBreadcrumbStructuredData } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RelatedPages, RelatedPageItem } from '@/components/seo/RelatedPages';
import { Wifi, Zap, Globe, Shield, ArrowRight, CheckCircle2, X, Smartphone, BookOpen, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const POPULAR_DESTINATIONS = [
  { country: 'japan', flag: '🇯🇵', nameTH: 'ญี่ปุ่น', price: '฿99' },
  { country: 'korea', flag: '🇰🇷', nameTH: 'เกาหลี', price: '฿99' },
  { country: 'china', flag: '🇨🇳', nameTH: 'จีน', price: '฿129' },
  { country: 'taiwan', flag: '🇹🇼', nameTH: 'ไต้หวัน', price: '฿99' },
  { country: 'hongkong', flag: '🇭🇰', nameTH: 'ฮ่องกง', price: '฿99' },
  { country: 'singapore', flag: '🇸🇬', nameTH: 'สิงคโปร์', price: '฿99' },
  { country: 'malaysia', flag: '🇲🇾', nameTH: 'มาเลเซีย', price: '฿99' },
  { country: 'vietnam', flag: '🇻🇳', nameTH: 'เวียดนาม', price: '฿99' },
  { country: 'europe', flag: '🇪🇺', nameTH: 'ยุโรป 42 ประเทศ', price: '฿199' },
  { country: 'usa', flag: '🇺🇸', nameTH: 'อเมริกา', price: '฿149' },
];

const FAQ_DATA = [
  {
    question: 'SIM Roaming คืออะไร? ต่างจาก eSIM อย่างไร?',
    answer: 'SIM Roaming คือบริการเปิดใช้งานอินเทอร์เน็ตในต่างประเทศผ่านค่ายมือถือไทย เช่น AIS, TRUE, DTAC ซึ่งมักมีค่าบริการแพงมาก (วันละ 200-500 บาท) ส่วน eSIM คือซิมดิจิทัลที่ซื้อแยก ราคาถูกกว่า 5-10 เท่า ใช้ได้ทันทีโดยไม่ต้องเปลี่ยนซิมการ์ด'
  },
  {
    question: 'ซิมต่างประเทศ ราคาถูก ซื้อที่ไหนดี?',
    answer: 'Mobile11.com มีซิมต่างประเทศ eSIM ราคาเริ่มต้นเพียง ฿99 ครอบคลุม 151 ประเทศ ซื้อออนไลน์ได้ทันที รับ QR Code ภายใน 1 นาที ไม่ต้องไปซื้อที่สนามบิน ไม่ต้องรอส่ง'
  },
  {
    question: 'eSIM ใช้กับมือถือรุ่นไหนได้บ้าง?',
    answer: 'iPhone XS ขึ้นไป, Samsung Galaxy S20 ขึ้นไป, Google Pixel 3 ขึ้นไป, Huawei P40 ขึ้นไป และมือถือ Android รุ่นใหม่ส่วนใหญ่รองรับ eSIM สามารถตรวจสอบได้ที่หน้า eSIM คืออะไร'
  },
  {
    question: 'eSIM ดีกว่า Pocket WiFi อย่างไร?',
    answer: 'eSIM สะดวกกว่า ไม่ต้องพกอุปกรณ์เพิ่ม ไม่ต้องชาร์จแบตเตอรี่ ไม่ต้องคืนเครื่อง ราคาถูกกว่า และใช้ได้ทันทีหลังลงจากเครื่องบิน ไม่ต้องรอรับ-คืนที่สนามบิน'
  },
  {
    question: 'ซิมต่างประเทศ eSIM ราคาเท่าไหร่?',
    answer: 'ราคาเริ่มต้นเพียง ฿99 สำหรับแพ็คเกจเน็ตในเอเชีย (ญี่ปุ่น เกาหลี จีน ไต้หวัน) และ ฿199 สำหรับยุโรป 42 ประเทศ ถูกกว่า sim roaming จากค่ายมือถือไทย 5-10 เท่า'
  },
  {
    question: 'eSIM ใช้ได้กี่ประเทศ?',
    answer: 'Mobile11 มี eSIM ครอบคลุม 151 ประเทศทั่วโลก รวมถึงประเทศยอดนิยมอย่าง ญี่ปุ่น เกาหลี จีน ไต้หวัน ฮ่องกง สิงคโปร์ มาเลเซีย เวียดนาม ยุโรป อเมริกา ออสเตรเลีย และอีกมากมาย'
  },
  {
    question: 'eSIM ติดตั้งยากไหม?',
    answer: 'ไม่ยากเลย! แค่สแกน QR Code ที่ได้รับทางอีเมล eSIM จะติดตั้งบนมือถือของคุณภายใน 2 นาที พร้อมใช้งานทันที มีคู่มือภาษาไทยให้ทุกขั้นตอน'
  },
  {
    question: 'sim roaming AIS TRUE DTAC ราคาเท่าไหร่?',
    answer: 'แพ็คเกจ roaming จากค่ายมือถือไทยมักมีราคา 299-599 บาท/วัน ขึ้นอยู่กับประเทศปลายทาง ในขณะที่ eSIM จาก Mobile11 ราคาเริ่มต้นเพียง ฿99 สำหรับหลายวัน ประหยัดกว่ามาก'
  }
];

const RELATED_PAGES: RelatedPageItem[] = [
  {
    to: '/what-is-esim?lang=th',
    titleEn: 'What is eSIM?',
    titleTh: 'eSIM คืออะไร?',
    descriptionEn: 'Learn about eSIM technology',
    descriptionTh: 'เรียนรู้เกี่ยวกับเทคโนโลยี eSIM และวิธีใช้งาน',
    icon: Smartphone
  },
  {
    to: '/packages',
    titleEn: 'All Packages',
    titleTh: 'ดูแพ็คเกจทั้งหมด',
    titleZh: '所有套餐',
    descriptionEn: 'Browse all eSIM packages',
    descriptionTh: 'เลือกซื้อแพ็คเกจ eSIM 151 ประเทศ ราคาถูก',
    descriptionZh: '浏览151个国家的所有eSIM套餐',
    icon: Globe
  },
  {
    to: '/installation-guide',
    titleEn: 'Installation Guide',
    titleTh: 'คู่มือติดตั้ง eSIM',
    titleZh: '安装指南',
    descriptionEn: 'Step-by-step eSIM installation',
    descriptionTh: 'วิธีติดตั้ง eSIM ทีละขั้นตอน ง่ายมาก',
    descriptionZh: '分步安装eSIM教程',
    icon: BookOpen
  }
];

export default function ThaiSimRoamingPage() {
  const navigate = useNavigate();

  const seoConfig = SEO_CONFIG_TH.simRoaming;
  const canonicalUrl = 'https://mobile11.com/th/sim-roaming';

  const breadcrumbData = [
    { name: 'หน้าแรก', url: 'https://mobile11.com' },
    { name: 'ซิมต่างประเทศ ราคาถูก', url: canonicalUrl }
  ];

  const structuredData = {
    ...getFAQStructuredData(FAQ_DATA),
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
          { lang: 'en', url: 'https://mobile11.com/packages' }
        ]}
      />

      <Header />

      <main>
        {/* Hero */}
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
                🌍 151 ประเทศทั่วโลก
              </Badge>
              <h1 className="text-3xl md:text-5xl font-bold mb-6">
                ซิมต่างประเทศ <span className="text-primary">ราคาถูก</span>
                <br />
                <span className="text-2xl md:text-4xl">eSIM ดีกว่า SIM Roaming</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                ซื้อ eSIM ซิมต่างประเทศออนไลน์ ราคาเริ่มต้น ฿99 ไม่ต้องเปลี่ยนซิม ไม่มีค่าโรมมิ่ง ใช้ได้ทันที ครอบคลุม 151 ประเทศ ดีกว่า sim roaming จากค่ายมือถือ
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-8" onClick={() => navigate('/packages')}>
                  ซื้อซิมต่างประเทศเลย
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8" onClick={() => navigate('/what-is-esim?lang=th')}>
                  eSIM คืออะไร?
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[
                { icon: Zap, label: 'ใช้ได้ทันที', desc: 'รับ QR ภายใน 1 นาที' },
                { icon: Wifi, label: 'เน็ตไม่อั้น', desc: 'ราคาเริ่มต้น ฿99' },
                { icon: Shield, label: 'ไม่มีค่าโรมมิ่ง', desc: 'ถูกกว่า sim roaming' },
                { icon: Globe, label: '151 ประเทศ', desc: 'ครอบคลุมทั่วโลก' }
              ].map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.1 }}>
                  <Card className="p-4 text-center h-full">
                    <f.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <h3 className="font-semibold text-sm md:text-base">{f.label}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground">{f.desc}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table: eSIM vs SIM Roaming vs Pocket WiFi */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
              เปรียบเทียบ: eSIM vs SIM Roaming vs Pocket WiFi
            </h2>
            <div className="max-w-4xl mx-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">คุณสมบัติ</TableHead>
                    <TableHead className="text-center font-bold text-primary">eSIM (Mobile11)</TableHead>
                    <TableHead className="text-center font-bold">SIM Roaming</TableHead>
                    <TableHead className="text-center font-bold">Pocket WiFi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { feature: 'ราคา/วัน', esim: '฿30-60', roaming: '฿200-500', wifi: '฿100-200' },
                    { feature: 'เปิดใช้งาน', esim: 'ทันที (1 นาที)', roaming: 'ทันที', wifi: 'ต้องรับเครื่องที่สนามบิน' },
                    { feature: 'ต้องพกอุปกรณ์', esim: false, roaming: false, wifi: true },
                    { feature: 'ต้องเปลี่ยนซิม', esim: false, roaming: false, wifi: false },
                    { feature: 'เน็ตไม่อั้น', esim: true, roaming: 'จำกัด', wifi: 'จำกัด' },
                    { feature: 'ใช้ได้หลายประเทศ', esim: true, roaming: true, wifi: false },
                    { feature: 'ต้องคืนเครื่อง', esim: false, roaming: false, wifi: true },
                    { feature: 'ต้องชาร์จแบต', esim: false, roaming: false, wifi: true },
                  ].map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{row.feature}</TableCell>
                      <TableCell className="text-center">
                        {typeof row.esim === 'boolean' ? (
                          row.esim ? <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-red-500 mx-auto" />
                        ) : <span className="font-semibold text-primary">{row.esim}</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        {typeof row.roaming === 'boolean' ? (
                          row.roaming ? <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-red-500 mx-auto" />
                        ) : <span>{row.roaming}</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        {typeof row.wifi === 'boolean' ? (
                          row.wifi ? <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-red-500 mx-auto" />
                        ) : <span>{row.wifi}</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </section>

        {/* Popular Destinations */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">
              ซิมต่างประเทศ จุดหมายยอดนิยม
            </h2>
            <p className="text-center text-muted-foreground mb-8">
              เลือกประเทศปลายทาง ซื้อ eSIM ราคาถูก ใช้ได้ทันที
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {POPULAR_DESTINATIONS.map((dest) => (
                <Link
                  key={dest.country}
                  to={`/th/esim-${dest.country}`}
                  className="group"
                >
                  <Card className="p-4 text-center h-full hover:shadow-lg hover:border-primary/50 transition-all">
                    <div className="text-3xl mb-2">{dest.flag}</div>
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      ซิม{dest.nameTH}
                    </h3>
                    <p className="text-sm text-primary font-bold mt-1">เริ่มต้น {dest.price}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
              วิธีซื้อซิมต่างประเทศ eSIM ง่ายใน 3 ขั้นตอน
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                { step: 1, title: 'เลือกประเทศ & แพ็คเกจ', desc: 'เลือกประเทศปลายทางและแพ็คเกจเน็ตที่ต้องการ' },
                { step: 2, title: 'ชำระเงินออนไลน์', desc: 'จ่ายผ่านบัตรเครดิต/เดบิต หรือ PromptPay รับ QR ทันที' },
                { step: 3, title: 'สแกน QR ใช้งานเลย', desc: 'สแกน QR Code ติดตั้ง eSIM บนมือถือ พร้อมใช้ทันที!' }
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

        {/* FAQ */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
              <HelpCircle className="inline-block mr-2 h-6 w-6 text-primary" />
              คำถามที่พบบ่อยเกี่ยวกับ SIM Roaming & ซิมต่างประเทศ
            </h2>
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="w-full">
                {FAQ_DATA.map((faq, i) => (
                  <AccordionItem key={i} value={`faq-${i}`}>
                    <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-primary/10">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              เลิกจ่ายค่า SIM Roaming แพงๆ เปลี่ยนมาใช้ eSIM วันนี้!
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              eSIM ราคาถูกกว่า sim roaming 5-10 เท่า ใช้ได้ทันที ไม่ต้องเปลี่ยนซิม ครอบคลุม 151 ประเทศ
            </p>
            <Button size="lg" className="text-lg px-8" onClick={() => navigate('/packages')}>
              ซื้อซิมต่างประเทศ ราคาถูก
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>

        {/* Related Pages */}
        <RelatedPages items={RELATED_PAGES} titleTh="แหล่งข้อมูลที่เป็นประโยชน์" titleEn="Helpful Resources" />
      </main>

      <FooterAiralo />
    </div>
  );
}
