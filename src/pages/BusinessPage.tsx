import { Header } from '@/components/layout/Header';
import { FooterAiralo } from '@/components/landing/FooterAiralo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Building2, Users, TrendingUp, Shield, Zap, Globe, CheckCircle, ArrowRight, Phone, HeadphonesIcon, Wifi, Clock, CreditCard, Laptop, Plane, Briefcase, Video, UserCheck, Award, Target, FileDown } from 'lucide-react';
import { useState, useRef } from 'react';
import { BrochureGeneratorModal } from '@/components/business/BrochureGeneratorModal';
import { z } from 'zod';
import { motion, useInView } from 'framer-motion';

const contactSchema = z.object({
  company: z.string().trim().min(1, "Company is required").max(120, "Company must be less than 120 characters"),
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().optional().refine(v => !v || /^[0-9+()\-\s]{6,20}$/.test(v), {
    message: "Invalid phone number format"
  }),
  message: z.string().trim().min(1, "Message is required").max(1000, "Message must be less than 1000 characters")
});

// Animated section wrapper
function AnimatedSection({
  children,
  className = "",
  delay = 0
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: true,
    margin: "-100px"
  });
  return (
    <motion.div 
      ref={ref} 
      initial={{ opacity: 0, y: 60 }} 
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }} 
      transition={{ duration: 0.6, delay, ease: "easeOut" }} 
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function BusinessPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const [formData, setFormData] = useState({
    company: '',
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [showBrochureModal, setShowBrochureModal] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const parsed = contactSchema.parse(formData);
      const ticketData = {
        name: parsed.name,
        email: parsed.email,
        subject: `Business Inquiry from ${parsed.company}`,
        message: `Company: ${parsed.company}\n${parsed.phone ? `Phone: ${parsed.phone}\n` : ''}\n${parsed.message}`,
        category: "business",
        priority: "high"
      };
      const { data, error } = await supabase.functions.invoke('create-ticket', {
        body: ticketData
      });
      if (error) throw error;
      toast({
        title: t('business.contact.successTitle'),
        description: `${t('business.contact.successDescription')}${data?.ticket_number ?? "pending"}`
      });
      setFormData({
        company: "",
        name: "",
        email: "",
        phone: "",
        message: ""
      });
    } catch (error: any) {
      const errorMessage = error?.issues?.[0]?.message || error?.message || "Failed to send message. Please try again.";
      console.error('Error submitting business inquiry:', error?.message || error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const features = [
    { icon: Wifi, titleKey: "trulyUnlimited" },
    { icon: Zap, titleKey: "instantDeployment" },
    { icon: Shield, titleKey: "missionCritical" },
    { icon: Globe, titleKey: "globalCoverage" },
    { icon: Laptop, titleKey: "centralizedManagement" },
    { icon: HeadphonesIcon, titleKey: "prioritySupport" }
  ];

  const useCases = [
    { icon: Plane, useCaseKey: "executiveTravel", lottie: "/assets/lottie/businessman-phone.lottie" },
    { icon: Target, useCaseKey: "fieldSales", lottie: "/assets/lottie/marketing-team-sales.lottie" },
    { icon: Laptop, useCaseKey: "remoteWorkforce", lottie: "/assets/lottie/video-meeting.lottie" },
    { icon: Video, useCaseKey: "eventsMedia", lottie: "/assets/lottie/online-learning.lottie" }
  ];

  const whyUnlimitedPoints = [
    { icon: CreditCard, pointKey: "noOverages" },
    { icon: Video, pointKey: "noThrottling" },
    { icon: CheckCircle, pointKey: "noAnxiety" },
    { icon: Wifi, pointKey: "officeAnywhere" }
  ];

  const trustStats = [
    { value: "4,500+", labelKey: "enterpriseCustomers" },
    { value: "20+", labelKey: "yearsExperience" },
    { value: "200+", labelKey: "carrierPartners" }
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <Header />
      
      {/* Hero Section - Beige with Lottie */}
      <section className="relative overflow-hidden pt-24 pb-20 md:pt-32 md:pb-28">
        {/* Decorative elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-32 right-[10%] w-64 h-64 bg-orange-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-[5%] w-48 h-48 bg-teal-400/15 rounded-full blur-3xl" />
          <div className="absolute top-40 left-[8%] w-20 h-24 bg-amber-200 rounded-xl rotate-12 opacity-30" />
          <div className="absolute bottom-40 right-[15%] w-16 h-16 bg-orange-300 rounded-full opacity-20" />
        </div>
        
        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div 
              className="space-y-8 order-2 lg:order-1"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <Badge className="bg-orange-100 text-orange-700 border-orange-200 rounded-full px-5 py-2.5 text-sm font-semibold">
                <Building2 className="mr-2 h-4 w-4 inline" />
                {t('business.badge')}
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-gray-900 leading-tight">
                {t('business.hero.title')}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
                  {t('business.hero.titleHighlight')}
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-xl">
                {t('business.hero.description')}
              </p>

              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg" 
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all"
                  onClick={() => navigate('/business/login')}
                >
                  {t('business.hero.getStarted')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap gap-8 pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <Globe className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">151</p>
                    <p className="text-sm text-gray-500">{t('business.hero.countries')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-teal-100 rounded-xl">
                    <Shield className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">24/7</p>
                    <p className="text-sm text-gray-500">{t('business.hero.support')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <Zap className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">99.9%</p>
                    <p className="text-sm text-gray-500">{t('business.hero.uptime')}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Lottie Animation */}
            <motion.div
              className="relative order-1 lg:order-2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            >
              <div className="relative w-full aspect-square max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mx-auto">
                <DotLottieReact
                  src="/assets/lottie/successful-target.lottie"
                  loop
                  autoplay
                  className="w-full h-full"
                  renderConfig={{ devicePixelRatio: 2 }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Stats Section - White Card Island */}
      <section className="py-16">
        <div className="container">
          <AnimatedSection>
            <div className="bg-white rounded-3xl shadow-sm p-8 md:p-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                {trustStats.map((stat, index) => (
                  <motion.div 
                    key={index} 
                    className="space-y-2"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <p className="text-4xl md:text-5xl font-display font-bold text-orange-500">{stat.value}</p>
                    <p className="text-gray-600">{t(`business.trust.${stat.labelKey}`)}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container">
          <AnimatedSection className="text-center mb-16 space-y-4">
            <h2 className="text-4xl lg:text-5xl font-display font-bold text-gray-900">
              {t('business.features.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('business.features.subtitle')}
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <Card className="p-8 bg-white border-0 shadow-sm hover:shadow-lg transition-all group h-full rounded-2xl">
                  <CardContent className="p-0 space-y-4">
                    <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <feature.icon className="h-7 w-7 text-orange-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">{t(`business.features.${feature.titleKey}.title`)}</h3>
                    <p className="text-gray-600 leading-relaxed">
                      {t(`business.features.${feature.titleKey}.description`)}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Unlimited Matters Section - Light Blue Island */}
      <section className="py-20">
        <div className="container">
          <div className="bg-[#A8DCF0] rounded-3xl p-8 md:p-12 lg:p-16 relative overflow-hidden">
            {/* Decorative shapes */}
            <div className="absolute top-10 right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl" />
            <div className="absolute bottom-10 left-10 w-24 h-24 bg-white/15 rounded-full blur-2xl" />
            
            <div className="relative z-10">
              <AnimatedSection className="text-center mb-12 space-y-4">
                <h2 className="text-4xl lg:text-5xl font-display font-bold text-gray-900">
                  {t('business.whyUnlimited.title')}
                </h2>
                <p className="text-xl text-gray-700 max-w-2xl mx-auto">
                  {t('business.whyUnlimited.subtitle')}
                </p>
              </AnimatedSection>

              {/* Centered Lottie Animation - Before cards */}
              <div className="flex justify-center mb-12">
                <div className="w-full max-w-md overflow-hidden">
                  <DotLottieReact
                    src="/assets/lottie/businessman-balancing.lottie"
                    loop
                    autoplay
                    className="w-full h-auto scale-[1.3] origin-center"
                    renderConfig={{ devicePixelRatio: 2 }}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {whyUnlimitedPoints.map((point, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    viewport={{ once: true }}
                  >
                    <Card className="p-6 text-center bg-white border-0 shadow-sm hover:shadow-md transition-all h-full rounded-2xl">
                      <CardContent className="p-0 space-y-4">
                        <div className="w-16 h-16 mx-auto bg-orange-100 rounded-full flex items-center justify-center">
                          <point.icon className="h-8 w-8 text-orange-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{t(`business.whyUnlimited.${point.pointKey}.title`)}</h3>
                        <p className="text-sm text-gray-600">
                          {t(`business.whyUnlimited.${point.pointKey}.description`)}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases - Alternating Layout with Lottie */}
      <section className="py-20">
        <div className="container">
          <AnimatedSection className="text-center mb-16 space-y-4">
            <h2 className="text-4xl lg:text-5xl font-display font-bold text-gray-900">
              {t('business.useCases.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('business.useCases.subtitle')}
            </p>
          </AnimatedSection>

          <div className="space-y-12">
            {useCases.map((useCase, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className={`grid lg:grid-cols-2 gap-8 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
              >
                {/* Content */}
                <div className={`order-2 lg:order-none ${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                  <Card className="p-8 bg-white border-0 shadow-sm h-full rounded-2xl">
                    <CardContent className="p-0 space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                          <useCase.icon className="h-6 w-6 text-orange-600" />
                        </div>
                        <h3 className="text-2xl font-display font-semibold text-gray-900">
                          {t(`business.useCases.${useCase.useCaseKey}.title`)}
                        </h3>
                      </div>
                      <p className="text-gray-600 leading-relaxed">
                        {t(`business.useCases.${useCase.useCaseKey}.description`)}
                      </p>
                      <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-orange-500 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{t(`business.useCases.${useCase.useCaseKey}.benefit${i}`)}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Lottie Animation */}
                <div className={`order-1 lg:order-none ${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                  <div className="w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto aspect-square">
                    <DotLottieReact
                      src={useCase.lottie}
                      loop
                      autoplay
                      className="w-full h-full"
                      renderConfig={{ devicePixelRatio: 2 }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Form Section - White Card on Beige */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <AnimatedSection>
              <Card className="bg-white border-0 shadow-lg rounded-3xl overflow-hidden">
                <CardContent className="p-8 md:p-12">
                  <div className="text-center mb-8 space-y-4">
                    <h2 className="text-3xl lg:text-4xl font-display font-bold text-gray-900">
                      {t('business.contact.title')}
                    </h2>
                    <p className="text-lg text-gray-600">
                      {t('business.contact.subtitle')}
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-900">{t('business.contact.companyLabel')}</label>
                        <Input 
                          placeholder={t('business.contact.companyPlaceholder')} 
                          value={formData.company} 
                          onChange={e => setFormData({ ...formData, company: e.target.value })} 
                          required 
                          className="h-12 bg-gray-50 border-gray-200 focus:border-orange-400 focus:ring-orange-400 text-gray-900" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-900">{t('business.contact.nameLabel')}</label>
                        <Input 
                          placeholder={t('business.contact.namePlaceholder')} 
                          value={formData.name} 
                          onChange={e => setFormData({ ...formData, name: e.target.value })} 
                          required 
                          className="h-12 bg-gray-50 border-gray-200 focus:border-orange-400 focus:ring-orange-400 text-gray-900" 
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-900">{t('business.contact.emailLabel')}</label>
                        <Input 
                          type="email" 
                          placeholder={t('business.contact.emailPlaceholder')} 
                          value={formData.email} 
                          onChange={e => setFormData({ ...formData, email: e.target.value })} 
                          required 
                          className="h-12 bg-gray-50 border-gray-200 focus:border-orange-400 focus:ring-orange-400 text-gray-900" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-900">{t('business.contact.phoneLabel')}</label>
                        <Input 
                          type="tel" 
                          placeholder={t('business.contact.phonePlaceholder')} 
                          value={formData.phone} 
                          onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                          className="h-12 bg-gray-50 border-gray-200 focus:border-orange-400 focus:ring-orange-400 text-gray-900" 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-900">{t('business.contact.messageLabel')}</label>
                      <Textarea 
                        placeholder={t('business.contact.messagePlaceholder')} 
                        rows={5} 
                        value={formData.message} 
                        onChange={e => setFormData({ ...formData, message: e.target.value })} 
                        className="bg-gray-50 border-gray-200 focus:border-orange-400 focus:ring-orange-400 text-gray-900"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full rounded-full text-lg bg-orange-500 hover:bg-orange-600 text-white" 
                      disabled={submitting}
                    >
                      {submitting ? t('business.contact.submitting') : t('business.contact.submit')}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </form>

                  <div className="mt-8 pt-8 border-t border-gray-100">
                    <div className="flex flex-wrap justify-center gap-8 text-center">
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-orange-500" />
                        <span className="text-sm text-gray-600">{t('business.contact.contactPhone')}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimatedSection>
          </div>
        </div>
      </section>
      
      <FooterAiralo />
      
      <BrochureGeneratorModal 
        open={showBrochureModal} 
        onClose={() => setShowBrochureModal(false)} 
      />
    </div>
  );
}
