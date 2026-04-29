import { Header } from '@/components/layout/Header';
import { FooterAiralo } from '@/components/landing/FooterAiralo';
import { useLanguage } from '@/contexts/LanguageContext';
import { LottieAnimation } from '@/components/landing-v2/LottieAnimation';
import { MessageCircle, Gift, ArrowRight, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO, getBreadcrumbStructuredData, getFAQStructuredData } from '@/components/SEO';

const BASE_URL = 'https://mobile11.com';

export function ContactPage() {
  const { t } = useLanguage();

  const openChatWidget = () => {
    window.dispatchEvent(new CustomEvent('openChatWidget'));
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <SEO
        title={t('contactPage.title')}
        description={t('contactPage.metaDescription')}
        canonical={`${BASE_URL}/contact`}
        keywords={['contact mobile11', 'esim support', 'customer service', 'esim help']}
        structuredData={[
          getBreadcrumbStructuredData([
            { name: 'Home', url: BASE_URL },
            { name: 'Contact', url: `${BASE_URL}/contact` },
          ]),
          getFAQStructuredData([
            { question: String(t('contactFaq.q1')), answer: String(t('contactFaq.a1')) },
            { question: String(t('contactFaq.q2')), answer: String(t('contactFaq.a2')) },
            { question: String(t('contactFaq.q3')), answer: String(t('contactFaq.a3')) },
            { question: String(t('contactFaq.q4')), answer: String(t('contactFaq.a4')) },
          ]),
        ]}
      />
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-16 md:pt-12 md:pb-24">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-32 right-1/4 w-16 h-16 bg-amber-200/60 rotate-45 rounded-sm" />
          <div className="absolute top-48 left-1/3 w-12 h-12 bg-orange-200/50 rotate-12 rounded-sm" />
          <div className="absolute bottom-24 right-1/3 w-8 h-8 bg-cyan-200/40 rotate-45 rounded-sm" />
          <div className="absolute top-1/3 right-16 w-6 h-6 bg-orange-300/30 rotate-45" />
        </div>

        <div className="container relative z-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="text-center md:text-left space-y-6 max-w-lg">
              <h1 className="text-5xl md:text-6xl font-black text-gray-900 leading-tight">
                {t('contactPage.heading')}
              </h1>
              <p className="text-lg text-gray-600">
                {t('contactPage.subheading')}
              </p>
              
              <button
                onClick={openChatWidget}
                className="inline-flex items-center gap-3 bg-gray-900 text-white px-8 py-4 rounded-full font-semibold hover:bg-gray-800 transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
                {t('contactPage.startChat')}
              </button>
            </div>

            <div className="flex justify-center md:justify-end">
              <div className="w-full max-w-md lg:max-w-lg">
                <LottieAnimation
                  src="/lottie/contact-us.lottie"
                  className="w-full h-auto"
                  devicePixelRatio={2}
                  speed={0.85}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Refer and Earn Section */}
      <section className="py-16 px-4">
        <div className="container">
          <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-sm border border-gray-100">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="text-center md:text-left space-y-6">
                <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 px-4 py-2 rounded-full text-sm font-medium">
                  <Gift className="h-4 w-4" />
                  {t('contactPage.rewards')}
                </div>
                
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 whitespace-pre-line">
                  {t('contactPage.referTitle')}
                </h2>
                
                <p className="text-gray-600 text-lg">
                  {t('contactPage.referDescription')}
                </p>

                <Link
                  to="/refer-and-earn"
                  className="inline-flex items-center gap-2 text-orange-500 font-semibold hover:text-orange-600 transition-colors group"
                >
                  {t('contactPage.findOutHow')}
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="flex justify-center">
                <div className="w-64 md:w-80">
                  <LottieAnimation
                    src="/assets/lottie/banner-marketing.lottie"
                    className="w-full h-auto"
                    devicePixelRatio={2}
                    speed={0.8}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="py-12 px-4">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-6">
            <Link
              to="/support"
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
            >
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <path d="M12 17h.01" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2 group-hover:text-orange-500 transition-colors">
                {t('contactPage.helpCenter')}
              </h3>
              <p className="text-gray-600 text-sm">
                {t('contactPage.helpCenterDescription')}
              </p>
            </Link>

            <a
              href="mailto:support@mobile11.com"
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <path d="M22 6l-10 7L2 6" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2 group-hover:text-orange-500 transition-colors">
                {t('contactPage.emailSupport')}
              </h3>
              <p className="text-gray-600 text-sm">
                support@mobile11.com
              </p>
            </a>

            <button
              onClick={openChatWidget}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group text-left w-full"
            >
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                <MessageCircle className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 group-hover:text-orange-500 transition-colors">
                {t('contactPage.chatSupport')}
              </h3>
              <p className="text-gray-600 text-sm">
                {t('contactPage.chatSupportDescription')}
              </p>
            </button>
          </div>
        </div>
      </section>

      <FooterAiralo />
    </div>
  );
}