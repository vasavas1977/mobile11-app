import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { FooterAiralo } from '@/components/landing/FooterAiralo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguage } from '@/contexts/LanguageContext';
import { TierComparisonTable } from '@/components/affiliate/TierComparisonTable';
import { MilestoneBonusSection } from '@/components/affiliate/MilestoneBonusSection';
import { motion, useInView } from 'framer-motion';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Clock, 
  Share2, 
  BarChart3, 
  Wallet, 
  Shield,
  ChevronRight,
  CheckCircle,
  ArrowRight,
  Zap,
  Globe,
  Headphones
} from 'lucide-react';
import { FloatingDecorations } from '@/components/landing/FloatingDecorations';

// Animated Section Wrapper
const AnimatedSection = ({ 
  children, 
  className = "",
  delay = 0,
  direction = "up" 
}: { 
  children: React.ReactNode; 
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right";
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  const initial = { 
    opacity: 0, 
    y: direction === "up" ? 60 : 0,
    x: direction === "left" ? -60 : direction === "right" ? 60 : 0
  };
  
  const animate = isInView ? { 
    opacity: 1, 
    y: 0,
    x: 0,
    transition: { 
      duration: 0.6, 
      delay,
      ease: "easeOut" as const
    }
  } : initial;

  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={animate}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Card with flight animation
const FlightCard = ({ 
  children, 
  index, 
  fromLeft = true,
  className = ""
}: { 
  children: React.ReactNode; 
  index: number;
  fromLeft?: boolean;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  return (
    <motion.div
      ref={ref}
      initial={{ 
        opacity: 0, 
        x: fromLeft ? -100 : 100,
        y: 50,
        rotate: fromLeft ? -5 : 5
      }}
      animate={isInView ? { 
        opacity: 1, 
        x: 0,
        y: 0,
        rotate: 0,
        transition: { 
          duration: 0.6, 
          delay: index * 0.1,
          ease: "easeOut"
        }
      } : {}}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export function AffiliateInfoPage() {
  const { t } = useLanguage();

  const benefits = [
    {
      icon: DollarSign,
      title: t('affiliateInfo.benefits.commission.title'),
      description: t('affiliateInfo.benefits.commission.description'),
    },
    {
      icon: Clock,
      title: t('affiliateInfo.benefits.attribution.title'),
      description: t('affiliateInfo.benefits.attribution.description'),
    },
    {
      icon: BarChart3,
      title: t('affiliateInfo.benefits.dashboard.title'),
      description: t('affiliateInfo.benefits.dashboard.description'),
    },
    {
      icon: Wallet,
      title: t('affiliateInfo.benefits.payouts.title'),
      description: t('affiliateInfo.benefits.payouts.description'),
    },
  ];

  const steps = [
    {
      step: '01',
      title: t('affiliateInfo.howItWorks.step1.title'),
      description: t('affiliateInfo.howItWorks.step1.description'),
    },
    {
      step: '02',
      title: t('affiliateInfo.howItWorks.step2.title'),
      description: t('affiliateInfo.howItWorks.step2.description'),
    },
    {
      step: '03',
      title: t('affiliateInfo.howItWorks.step3.title'),
      description: t('affiliateInfo.howItWorks.step3.description'),
    },
  ];

  const faqItems = [
    { question: t('affiliateInfo.faq.q1.question'), answer: t('affiliateInfo.faq.q1.answer') },
    { question: t('affiliateInfo.faq.q2.question'), answer: t('affiliateInfo.faq.q2.answer') },
    { question: t('affiliateInfo.faq.q3.question'), answer: t('affiliateInfo.faq.q3.answer') },
    { question: t('affiliateInfo.faq.q4.question'), answer: t('affiliateInfo.faq.q4.answer') },
    { question: t('affiliateInfo.faq.q5.question'), answer: t('affiliateInfo.faq.q5.answer') },
    { question: t('affiliateInfo.faq.q6.question'), answer: t('affiliateInfo.faq.q6.answer') },
    { question: t('affiliateInfo.faq.q7.question'), answer: t('affiliateInfo.faq.q7.answer') },
    { question: t('affiliateInfo.faq.q8.question'), answer: t('affiliateInfo.faq.q8.answer') },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <Header />
      
      {/* Hero Section - Airalo Style with Beige */}
      <section className="relative overflow-hidden pt-24 pb-16 lg:pt-32 lg:pb-24">
        <FloatingDecorations className="opacity-60" />
        
        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Lottie Animation - First on mobile/tablet */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex justify-center lg:justify-end order-1 lg:order-2"
            >
              <div className="w-full max-w-none scale-[1.2] lg:scale-[1.6]">
                <DotLottieReact
                  src="/lotties/business-team.lottie"
                  loop
                  autoplay
                  className="w-full h-auto"
                />
              </div>
            </motion.div>

            {/* Text Content - Second on mobile/tablet */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6 order-2 lg:order-1"
            >
              <Badge className="bg-green-100 text-green-700 border-green-200 rounded-full px-4 py-2">
                {t('affiliateInfo.badge')}
              </Badge>
              
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-black text-gray-900 leading-tight">
                {t('affiliateInfo.hero.title')}{' '}
                <span className="text-orange-500">{t('affiliateInfo.hero.titleHighlight')}</span>
              </h1>
              
              <p className="text-lg text-gray-600 max-w-xl">
                {t('affiliateInfo.hero.description')}
              </p>

              <div className="flex flex-wrap gap-4">
                <Button 
                  asChild 
                  size="lg" 
                  className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-8"
                >
                  <Link to="/affiliate/register">
                    {t('affiliateInfo.hero.cta')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 rounded-full px-8"
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  {t('affiliateInfo.hero.learnMore')}
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-8 pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{t('affiliateInfo.hero.stats.commission')}</div>
                  <div className="text-sm text-gray-500">{t('affiliateInfo.hero.stats.commissionLabel')}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{t('affiliateInfo.hero.stats.window')}</div>
                  <div className="text-sm text-gray-500">{t('affiliateInfo.hero.stats.windowLabel')}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{t('affiliateInfo.hero.stats.countries')}</div>
                  <div className="text-sm text-gray-500">{t('affiliateInfo.hero.stats.countriesLabel')}</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section - White Island */}
      <section className="py-20">
        <div className="container">
          <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm">
            <AnimatedSection className="text-center mb-12">
              <Badge className="mb-4 bg-orange-100 text-orange-600 border-orange-200 rounded-full">{t('affiliateInfo.benefits.badge')}</Badge>
              <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-4">{t('affiliateInfo.benefits.title')}</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t('affiliateInfo.benefits.subtitle')}</p>
            </AnimatedSection>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <FlightCard key={index} index={index} fromLeft={true}>
                  <Card className="border-gray-100 bg-gray-50/50 hover:shadow-lg transition-all hover:-translate-y-1 h-full">
                    <CardHeader className="text-center pb-2">
                      <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <benefit.icon className="h-7 w-7 text-orange-500" />
                      </div>
                      <CardTitle className="text-lg text-gray-900">{benefit.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-center text-gray-600">{benefit.description}</CardDescription>
                    </CardContent>
                  </Card>
                </FlightCard>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tiered Commission Structure - Light Blue Island */}
      <section className="py-20">
        <div className="container">
          <div className="bg-[#A8DCF0] rounded-3xl p-8 lg:p-12">
            <div className="grid lg:grid-cols-5 gap-8 items-center">
              <div className="lg:col-span-2 flex justify-center items-center">
                <div className="w-full max-w-none scale-150 lg:scale-[2]">
                  <DotLottieReact
                    src="/assets/lottie/successful-target.lottie"
                    loop
                    autoplay
                    className="w-full h-auto"
                  />
                </div>
              </div>
              <div className="lg:col-span-3">
                <AnimatedSection>
                  <TierComparisonTable />
                </AnimatedSection>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Milestone Bonuses - White Card */}
      <section className="py-20">
        <div className="container">
          <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm">
            <div className="grid lg:grid-cols-5 gap-8 items-center">
              <div className="lg:col-span-3 order-2 lg:order-1">
                <AnimatedSection>
                  <MilestoneBonusSection />
                </AnimatedSection>
              </div>
              <div className="lg:col-span-2 flex justify-center order-1 lg:order-2">
                <div className="w-full max-w-none scale-150 lg:scale-[2]">
                  <DotLottieReact
                    src="/lotties/referral-program.lottie"
                    loop
                    autoplay
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Mint Green Island */}
      <section id="how-it-works" className="py-20">
        <div className="container">
          <div className="bg-[#9BD4B0] rounded-3xl p-8 lg:p-12">
            <AnimatedSection className="text-center mb-12">
              <Badge className="mb-4 bg-white/80 text-green-700 border-green-200 rounded-full">{t('affiliateInfo.howItWorks.badge')}</Badge>
              <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-4">{t('affiliateInfo.howItWorks.title')}</h2>
              <p className="text-lg text-gray-700 max-w-2xl mx-auto">{t('affiliateInfo.howItWorks.subtitle')}</p>
            </AnimatedSection>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {steps.map((step, index) => (
                <FlightCard key={index} index={index} fromLeft={true}>
                  <div className="relative">
                    <div className="text-center space-y-4">
                      <motion.div 
                        className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold text-orange-500 shadow-lg"
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {step.step}
                      </motion.div>
                      <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
                      <p className="text-gray-700">{step.description}</p>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="hidden md:block absolute top-10 left-[60%] w-[80%]">
                        <ChevronRight className="h-6 w-6 text-white/50" />
                      </div>
                    )}
                  </div>
                </FlightCard>
              ))}
            </div>

            <AnimatedSection delay={0.4} className="text-center mt-12">
              <Button asChild size="lg" className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-8">
                <Link to="/affiliate/register">
                  {t('affiliateInfo.howItWorks.cta')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Why Partner With Us - White Cards */}
      <section className="py-20">
        <div className="container">
          <AnimatedSection className="text-center mb-12">
            <Badge className="mb-4 bg-orange-100 text-orange-600 border-orange-200 rounded-full">{t('affiliateInfo.whyUs.badge')}</Badge>
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-4">{t('affiliateInfo.whyUs.title')}</h2>
          </AnimatedSection>

          <div className="grid lg:grid-cols-2 gap-8 items-center max-w-6xl mx-auto">
            <div className="flex justify-center">
              <div className="w-full max-w-none scale-[1.2] lg:scale-[1.6]">
                <DotLottieReact
                  src="/lotties/team-celebrating-cup.lottie"
                  loop
                  autoplay
                  className="w-full h-auto"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: Globe, key: 'globalProduct' },
                { icon: Zap, key: 'instantDelivery' },
                { icon: TrendingUp, key: 'highConversion' },
                { icon: Shield, key: 'reliableTracking' },
                { icon: Headphones, key: 'dedicatedSupport' },
                { icon: Share2, key: 'marketingAssets' },
              ].map((item, index) => (
                <FlightCard key={index} index={index % 3} fromLeft={index < 3}>
                  <div className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">{t(`affiliateInfo.whyUs.${item.key}.title`)}</h3>
                      <p className="text-sm text-gray-600">{t(`affiliateInfo.whyUs.${item.key}.description`)}</p>
                    </div>
                  </div>
                </FlightCard>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Marketing Materials Section - White Island */}
      <section className="py-20">
        <div className="container">
          <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm">
            <AnimatedSection className="text-center mb-12">
              <Badge className="mb-4 bg-orange-100 text-orange-600 border-orange-200 rounded-full">{t('affiliateInfo.marketing.badge')}</Badge>
              <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-4">{t('affiliateInfo.marketing.title')}</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t('affiliateInfo.marketing.subtitle')}</p>
            </AnimatedSection>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* Banners Card */}
              <FlightCard index={0} fromLeft={true}>
                <Card className="border-gray-100 bg-gray-50/50 hover:shadow-lg transition-all h-full">
                  <CardHeader className="text-center pb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="h-7 w-7 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <CardTitle className="text-lg text-gray-900">{t('affiliateInfo.marketing.banners.title')}</CardTitle>
                    <CardDescription className="text-gray-600">{t('affiliateInfo.marketing.banners.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-gray-100">
                        <span className="text-gray-700">{t('affiliateInfo.marketing.banners.leaderboard')}</span>
                        <Badge variant="outline" className="text-xs text-gray-500">728×90</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-gray-100">
                        <span className="text-gray-700">{t('affiliateInfo.marketing.banners.rectangle')}</span>
                        <Badge variant="outline" className="text-xs text-gray-500">300×250</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-gray-100">
                        <span className="text-gray-700">{t('affiliateInfo.marketing.banners.skyscraper')}</span>
                        <Badge variant="outline" className="text-xs text-gray-500">160×600</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-gray-100">
                        <span className="text-gray-700">{t('affiliateInfo.marketing.banners.square')}</span>
                        <Badge variant="outline" className="text-xs text-gray-500">250×250</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-gray-100">
                        <span className="text-gray-700">{t('affiliateInfo.marketing.banners.mobile')}</span>
                        <Badge variant="outline" className="text-xs text-gray-500">320×100</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-gray-100">
                        <span className="text-gray-700">{t('affiliateInfo.marketing.banners.social')}</span>
                        <Badge variant="outline" className="text-xs text-gray-500">1200×630</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FlightCard>

              {/* Promotional Copy Card */}
              <FlightCard index={1} fromLeft={true}>
                <Card className="border-gray-100 bg-gray-50/50 hover:shadow-lg transition-all h-full">
                  <CardHeader className="text-center pb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="h-7 w-7 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <CardTitle className="text-lg text-gray-900">{t('affiliateInfo.marketing.copy.title')}</CardTitle>
                    <CardDescription className="text-gray-600">{t('affiliateInfo.marketing.copy.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-3 text-sm">
                      <div className="p-3 bg-white rounded-lg border border-gray-100">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">{t('affiliateInfo.marketing.copy.short')}</Badge>
                        </div>
                        <p className="text-gray-500 text-xs italic">"{t('affiliateInfo.marketing.copy.shortExample')}"</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-gray-100">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">{t('affiliateInfo.marketing.copy.medium')}</Badge>
                        </div>
                        <p className="text-gray-500 text-xs italic">"{t('affiliateInfo.marketing.copy.mediumExample')}"</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-gray-100">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">{t('affiliateInfo.marketing.copy.cta')}</Badge>
                        </div>
                        <p className="text-gray-500 text-xs italic">"{t('affiliateInfo.marketing.copy.ctaExample')}"</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FlightCard>

              {/* Brand Assets Card */}
              <FlightCard index={2} fromLeft={true}>
                <Card className="border-gray-100 bg-gray-50/50 hover:shadow-lg transition-all relative overflow-hidden h-full">
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-orange-100 text-orange-600 border-orange-200 text-xs">{t('affiliateInfo.marketing.assets.partnerOnly')}</Badge>
                  </div>
                  <CardHeader className="text-center pb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="h-7 w-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                    </div>
                    <CardTitle className="text-lg text-gray-900">{t('affiliateInfo.marketing.assets.title')}</CardTitle>
                    <CardDescription className="text-gray-600">{t('affiliateInfo.marketing.assets.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-gray-700">{t('affiliateInfo.marketing.assets.logo')}</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-gray-700">{t('affiliateInfo.marketing.assets.productImages')}</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-gray-700">{t('affiliateInfo.marketing.assets.coverageMap')}</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-gray-700">{t('affiliateInfo.marketing.assets.brandColors')}</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-gray-700">{t('affiliateInfo.marketing.assets.guidelines')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FlightCard>
            </div>

            <AnimatedSection delay={0.4} className="text-center mt-10">
              <p className="text-gray-600 mb-4">{t('affiliateInfo.marketing.accessNote')}</p>
              <Button asChild variant="outline" size="lg" className="rounded-full border-gray-200">
                <Link to="/affiliate/register">
                  {t('affiliateInfo.marketing.accessCta')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container max-w-4xl">
          <div className="grid lg:grid-cols-5 gap-8 items-start">
            <div className="lg:col-span-2 flex justify-center lg:sticky lg:top-24">
              <div className="w-full max-w-none scale-[1.2] lg:scale-[1.6]">
                <DotLottieReact
                  src="/lotties/faq-web-page.lottie"
                  loop
                  autoplay
                  className="w-full h-auto"
                />
              </div>
            </div>
            
            <div className="lg:col-span-3">
              <AnimatedSection className="mb-8">
                <Badge className="mb-4 bg-orange-100 text-orange-600 border-orange-200 rounded-full">{t('affiliateInfo.faq.badge')}</Badge>
                <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-4">{t('affiliateInfo.faq.title')}</h2>
              </AnimatedSection>

              <Accordion type="single" collapsible className="space-y-4">
                {faqItems.map((item, index) => (
                  <AccordionItem 
                    key={index}
                    value={`faq-${index}`}
                    className="bg-white border border-gray-100 rounded-2xl px-6 shadow-sm"
                  >
                    <AccordionTrigger className="text-left hover:no-underline py-5">
                      <span className="font-bold text-gray-900">{item.question}</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 pb-5">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - Orange Section */}
      <section className="py-20 bg-orange-500 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        </div>
        
        <motion.div 
          className="container relative z-10 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl lg:text-4xl font-black text-white mb-4">{t('affiliateInfo.cta.title')}</h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">{t('affiliateInfo.cta.description')}</p>
          
          <div className="flex flex-wrap gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-orange-500 hover:bg-white/90 rounded-full px-8">
              <Link to="/affiliate/register">
                {t('affiliateInfo.cta.register')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 rounded-full px-8">
              <Link to="/support">
                {t('affiliateInfo.cta.contact')}
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>

      <FooterAiralo />
    </div>
  );
}
