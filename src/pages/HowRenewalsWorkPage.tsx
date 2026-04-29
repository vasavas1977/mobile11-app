import { ArrowLeft, Activity, AlertCircle, CreditCard, Zap, Smartphone, Globe, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LottieAnimation } from '@/components/landing-v2/LottieAnimation';
import { SEO, getFAQStructuredData, getBreadcrumbStructuredData } from '@/components/SEO';
import { RelatedPages } from '@/components/seo/RelatedPages';

const BASE_URL = 'https://mobile11.com';

export default function HowRenewalsWorkPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const steps = [
    {
      number: 1,
      icon: Activity,
      title: t('myEsims.howRenewalsWorkPage.step1Title'),
      description: t('myEsims.howRenewalsWorkPage.step1Desc'),
    },
    {
      number: 2,
      icon: AlertCircle,
      title: t('myEsims.howRenewalsWorkPage.step2Title'),
      description: t('myEsims.howRenewalsWorkPage.step2Desc'),
    },
    {
      number: 3,
      icon: CreditCard,
      title: t('myEsims.howRenewalsWorkPage.step3Title'),
      description: t('myEsims.howRenewalsWorkPage.step3Desc'),
    },
    {
      number: 4,
      icon: Zap,
      title: t('myEsims.howRenewalsWorkPage.step4Title'),
      description: t('myEsims.howRenewalsWorkPage.step4Desc'),
    },
  ];

  const faqData = steps.map(s => ({ question: s.title, answer: s.description }))
    .filter(f => typeof f.question === 'string' && typeof f.answer === 'string');

  return (
    <>
    <SEO
      title={t('myEsims.howRenewalsWorkPage.title') || 'How Renewals Work'}
      description="Learn how eSIM auto-renewal works on Mobile11. Stay connected without interruption."
      canonical={`${BASE_URL}/how-renewals-work`}
      keywords={['esim renewal', 'auto renewal', 'esim top up', 'data renewal']}
      structuredData={[
        ...(faqData.length > 0 ? [getFAQStructuredData(faqData)] : []),
        getBreadcrumbStructuredData([
          { name: 'Home', url: BASE_URL },
          { name: 'How Renewals Work', url: `${BASE_URL}/how-renewals-work` },
        ]),
      ]}
    />
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#FAF7F2] border-b border-gray-200">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-800">
            {t('myEsims.howRenewalsWorkPage.title')}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 max-w-lg mx-auto">
        {/* Lottie Animation */}
        <div className="flex justify-center mb-6">
          <LottieAnimation
            src="/assets/lottie/unlimited-data.lottie"
            className="w-40 h-40"
            loop={true}
            autoplay={true}
          />
        </div>

        {/* Description */}
        <p className="text-gray-600 text-center mb-8">
          {t('myEsims.howRenewalsWorkPage.description')}
        </p>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step) => (
            <div
              key={step.number}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
            >
              <div className="flex items-start gap-4">
                {/* Number + Icon */}
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center">
                    <step.icon className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="absolute -top-1 -left-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{step.number}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 pt-1">
                  <h3 className="font-semibold text-gray-800 mb-1">{step.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <RelatedPages
        items={[
          { to: '/my-esims', titleEn: 'My eSIMs', titleTh: 'eSIM ของฉัน', descriptionEn: 'Manage your active eSIM plans', descriptionTh: 'จัดการแพ็คเกจ eSIM ที่ใช้งานอยู่', icon: Smartphone },
          { to: '/packages', titleEn: 'Browse Packages', titleTh: 'ดูแพ็คเกจทั้งหมด', descriptionEn: 'Find the perfect eSIM plan for your trip', descriptionTh: 'ค้นหาแพ็คเกจ eSIM ที่เหมาะกับทริปของคุณ', icon: Globe },
          { to: '/how-it-works', titleEn: 'How It Works', titleTh: 'วิธีการทำงาน', descriptionEn: 'Learn how Mobile11 works in 3 easy steps', descriptionTh: 'เรียนรู้วิธีการทำงานของ Mobile11 ใน 3 ขั้นตอน', icon: HelpCircle },
        ]}
      />
    </div>
    </>
  );
}
