import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Target, Lightbulb, Globe, Users, Shield, Zap, MapPin, Mail, Phone, Building2, ArrowRight, Smartphone, Briefcase, BookOpen } from 'lucide-react';
import { RelatedPages } from '@/components/seo/RelatedPages';
import { useLanguage } from '@/contexts/LanguageContext';
import { Header } from '@/components/layout/Header';
import { FooterAiralo } from '@/components/landing/FooterAiralo';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { SEO, getBreadcrumbStructuredData, getFAQStructuredData } from '@/components/SEO';

const BASE_URL = 'https://mobile11.com';

import teamPhoto from '@/assets/team-photo.webp';

// HQ building image - served from Supabase Storage (not bundled)
const hqBuilding = 'https://jaqyvbjllsanrnpzlyjw.supabase.co/storage/v1/object/public/assets/about/1toall-hq.png';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export const AboutPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const values = [
    { icon: Globe, title: t('about.values.global.title') || 'Global Reach', description: t('about.values.global.description') || 'Connecting travelers across 150+ countries with reliable connectivity' },
    { icon: Users, title: t('about.values.customer.title') || 'Customer First', description: t('about.values.customer.description') || 'Your satisfaction drives every decision we make' },
    { icon: Shield, title: t('about.values.trust.title') || 'Trust & Security', description: t('about.values.trust.description') || 'Enterprise-grade security protecting your data and privacy' },
    { icon: Zap, title: t('about.values.innovation.title') || 'Innovation', description: t('about.values.innovation.description') || 'Pioneering eSIM technology for seamless travel experiences' },
  ];

  const stats = [
    { value: '151+', label: t('about.stats.countries') || 'Countries' },
    { value: '1M+', label: t('about.stats.customers') || 'Happy Customers' },
    { value: '200+', label: t('about.stats.partners') || 'Carrier Partners' },
  ];

  const stories = [
    {
      title: t('about.story.beginning.title') || 'The Beginning',
      description: t('about.story.beginning.description') || 'Founded in Thailand as part of 1ToAll, we identified a gap in affordable global connectivity for travelers.',
      lottie: '/assets/lottie/20-years-anniversary.lottie',
    },
    {
      title: t('about.story.innovation.title') || 'The Innovation',
      description: t('about.story.innovation.description') || 'We pioneered instant eSIM delivery, eliminating physical SIM cards and enabling travelers to connect within minutes.',
      lottie: '/assets/lottie/businessman-rocket.lottie',
    },
    {
      title: t('about.story.today.title') || 'Today',
      description: t('about.story.today.description') || 'Mobile11 serves millions of travelers worldwide with coverage in 150+ countries and partnerships with 200+ carriers.',
      lottie: '/assets/lottie/worldwide-tour.lottie',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <SEO
        title={t('about.hero.title') || 'About Mobile11'}
        description={t('about.hero.description') || 'Connecting the world with affordable, instant eSIM solutions. A proud member of 1ToAll, Thailand\'s 4th licensed telecom operator.'}
        canonical={`${BASE_URL}/about`}
        keywords={['about mobile11', 'esim provider', '1toall', 'thailand telecom', 'esim company']}
        structuredData={[
          getBreadcrumbStructuredData([
            { name: 'Home', url: BASE_URL },
            { name: 'About', url: `${BASE_URL}/about` },
          ]),
          getFAQStructuredData([
            { question: String(t('aboutFaq.q1')), answer: String(t('aboutFaq.a1')) },
            { question: String(t('aboutFaq.q2')), answer: String(t('aboutFaq.a2')) },
            { question: String(t('aboutFaq.q3')), answer: String(t('aboutFaq.a3')) },
            { question: String(t('aboutFaq.q4')), answer: String(t('aboutFaq.a4')) },
            { question: String(t('aboutFaq.q5')), answer: String(t('aboutFaq.a5')) },
          ]),
        ]}
      />
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-32 left-10 w-32 h-32 bg-orange-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-teal-400/15 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4">
          <div className="flex flex-col-reverse lg:flex-row items-center gap-8 lg:gap-12">
            {/* Text Content */}
            <motion.div 
              className="flex-1 text-center lg:text-left"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >

              <motion.div variants={fadeInUp}>
                <Badge className="mb-4 bg-orange-100 text-orange-700 hover:bg-orange-100">
                  {t('about.badge') || 'About Us'}
                </Badge>
              </motion.div>
              <motion.h1 
                variants={fadeInUp}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6"
              >
                {t('about.hero.title') || 'About Mobile11'}
              </motion.h1>
              <motion.p 
                variants={fadeInUp}
                className="text-lg md:text-xl text-gray-600 max-w-2xl"
              >
                {t('about.hero.description') || 'Connecting the world with affordable, instant eSIM solutions. A proud member of 1ToAll, Thailand\'s 4th licensed telecom operator with over 20 years of experience.'}
              </motion.p>
            </motion.div>

            {/* Lottie Animation - First on mobile via flex-col-reverse */}
            <motion.div 
              className="flex-1 w-full max-w-lg lg:max-w-xl"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <DotLottieReact
                src="/assets/lottie/loading.lottie"
                loop
                autoplay
                className="w-full"
                renderConfig={{ devicePixelRatio: 2 }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col-reverse lg:flex-row items-center gap-12">
            {/* Content */}
            <motion.div 
              className="flex-1"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              <Card className="p-8 bg-white shadow-lg border-0">
                <motion.div variants={fadeInUp} className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200">
                      <Target className="w-6 h-6 text-orange-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {t('about.mission.title') || 'Our Mission'}
                    </h2>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    {t('about.mission.description') || 'To democratize global connectivity by providing affordable, instant, and reliable eSIM solutions that empower travelers to stay connected anywhere in the world.'}
                  </p>
                </motion.div>

                <motion.div variants={fadeInUp}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-teal-100 to-teal-200">
                      <Lightbulb className="w-6 h-6 text-teal-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {t('about.vision.title') || 'Our Vision'}
                    </h2>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    {t('about.vision.description') || 'To become the world\'s most trusted eSIM provider, making seamless global connectivity as natural as breathing for every traveler.'}
                  </p>
                </motion.div>
              </Card>
            </motion.div>

            {/* Lottie Animation - First on mobile via flex-col-reverse */}
            <motion.div 
              className="flex-1 w-full max-w-md lg:max-w-lg"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <DotLottieReact
                src="/assets/lottie/business-mission.lottie"
                loop
                autoplay
                className="w-full"
                renderConfig={{ devicePixelRatio: 2 }}
              />
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div 
            className="mt-12 grid grid-cols-3 gap-4 md:gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {stats.map((stat, index) => (
              <motion.div 
                key={index}
                variants={fadeInUp}
                className="text-center p-6 bg-white rounded-2xl shadow-sm"
              >
                <div className="text-3xl md:text-4xl font-bold text-orange-500 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm md:text-base text-gray-600">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('about.story.title') || 'Our Story'}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('about.story.subtitle') || 'From a vision to a global solution'}
            </p>
          </motion.div>

          <div className="space-y-16">
            {stories.map((story, index) => (
              <motion.div
                key={index}
                className={`flex flex-col-reverse ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-8 lg:gap-12`}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={fadeInUp}
              >
                {/* Text Content */}
                <div className="flex-1 text-center lg:text-left">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 text-orange-600 font-bold text-xl mb-4">
                    {index + 1}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {story.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {story.description}
                  </p>
                </div>

                {/* Lottie Animation - First on mobile via flex-col-reverse */}
                <div className={`${index === 0 ? 'w-[500px] lg:w-[650px]' : index === 2 ? 'w-[550px] lg:w-[700px] -mr-12 lg:-mr-20' : 'w-[400px] lg:w-[550px]'}`}>
                  <DotLottieReact
                    src={story.lottie}
                    loop
                    autoplay
                    className="w-full"
                    renderConfig={{ devicePixelRatio: 2 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section id="core-values" className="py-16 md:py-24 bg-[#A8DCF0]/30 scroll-mt-24">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('about.values.title') || 'Our Core Values'}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('about.values.subtitle') || 'The principles that guide everything we do'}
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {values.map((value, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="p-6 bg-white shadow-md border-0 h-full hover:shadow-lg transition-shadow duration-300">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 w-fit mb-4">
                    <value.icon className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {value.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="mt-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <Link 
              to="/our-values" 
              className="inline-flex items-center gap-2 text-gray-900 font-medium hover:text-orange-600 transition-colors group"
            >
              {t('about.values.learnMore') || 'Learn more about our values'}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Our Team Section - Keep team photo */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('about.team.title') || 'Our Team'}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('about.team.description') || 'A dedicated team of telecom experts, engineers, and customer support specialists working together to keep you connected.'}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="overflow-hidden border-0 shadow-lg">
              <AspectRatio ratio={16 / 9}>
                <img
                  src={teamPhoto}
                  alt={t('about.team.imageAlt') || 'Mobile11 Team'}
                  className="w-full h-full object-cover"
                />
              </AspectRatio>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Location & Contact Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('about.location.title') || 'Visit Us'}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('about.location.subtitle') || 'Our headquarters in Bangkok, Thailand'}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className="p-6 bg-white shadow-md border-0 h-full">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  {t('about.contact.title') || 'Contact Information'}
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-orange-100">
                      <Building2 className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">1ToAll Co., Ltd.</p>
                      <p className="text-sm text-gray-600">Mobile11 by 1ToAll</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-orange-100">
                      <MapPin className="w-5 h-5 text-orange-600" />
                    </div>
                    <p className="text-sm text-gray-600">
                      {t('about.contact.address') || '123 Wireless Road, Lumpini, Pathumwan, Bangkok 10330, Thailand'}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-orange-100">
                      <Mail className="w-5 h-5 text-orange-600" />
                    </div>
                    <a href="mailto:support@mobile11.com" className="text-sm text-orange-600 hover:underline">
                      support@mobile11.com
                    </a>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-orange-100">
                      <Phone className="w-5 h-5 text-orange-600" />
                    </div>
                    <a href="tel:+6621234567" className="text-sm text-orange-600 hover:underline">
                      +66 2 123 4567
                    </a>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Map */}
            <motion.div
              className="lg:col-span-1"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="overflow-hidden border-0 shadow-md h-full min-h-[250px]">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3875.5694!2d100.5431!3d13.7380!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTPCsDQ0JzE3LjAiTiAxMDDCsDMyJzM1LjIiRQ!5e0!3m2!1sen!2sth!4v1234567890"
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: '250px' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Mobile11 Headquarters Location"
                />
              </Card>
            </motion.div>

            {/* HQ Building */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="overflow-hidden border-0 shadow-md h-full">
                <AspectRatio ratio={4/3}>
                  <img
                    src={hqBuilding}
                    alt="1ToAll Headquarters Building"
                    className="w-full h-full object-cover"
                  />
                </AspectRatio>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <RelatedPages
        items={[
          { to: '/what-is-esim', titleEn: 'Learn about eSIM', titleTh: 'เรียนรู้เกี่ยวกับ eSIM', descriptionEn: 'Understand eSIM technology and its benefits', descriptionTh: 'ทำความเข้าใจเทคโนโลยี eSIM และข้อดี', icon: Smartphone },
          { to: '/business', titleEn: 'Mobile11 for Business', titleTh: 'Mobile11 สำหรับธุรกิจ', descriptionEn: 'Enterprise connectivity solutions', descriptionTh: 'โซลูชันการเชื่อมต่อสำหรับองค์กร', icon: Briefcase },
          { to: '/blog', titleEn: 'Read Our Blog', titleTh: 'อ่านบล็อกของเรา', descriptionEn: 'Travel tips and eSIM guides', descriptionTh: 'เคล็ดลับการเดินทางและคู่มือ eSIM', icon: BookOpen },
        ]}
      />

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-orange-500">
        <div className="container mx-auto px-4">
          <div className="flex flex-col-reverse lg:flex-row items-center gap-8 lg:gap-12">
            {/* Text Content */}
            <motion.div 
              className="flex-1 text-center lg:text-left"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {t('about.cta.title') || 'Ready to Stay Connected?'}
              </h2>
              <p className="text-white/90 text-lg mb-8 max-w-xl">
                {t('about.cta.description') || 'Join millions of travelers who trust Mobile11 for their global connectivity needs.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  size="lg"
                  onClick={() => navigate('/packages')}
                  className="bg-white text-orange-600 hover:bg-white/90 rounded-full px-8"
                >
                  {t('about.cta.browse') || 'Browse eSIMs'}
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/help-center')}
                  className="border-white text-white hover:bg-white/10 rounded-full px-8"
                >
                  {t('about.cta.contact') || 'Contact Us'}
                </Button>
              </div>
            </motion.div>

            {/* Lottie Animation - First on mobile via flex-col-reverse */}
            <motion.div 
              className="flex-1 w-full max-w-md"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <DotLottieReact
                src="/assets/lottie/business-partnership.lottie"
                loop
                autoplay
                className="w-full"
                renderConfig={{ devicePixelRatio: 2 }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      <FooterAiralo />
    </div>
  );
};

export default AboutPage;
