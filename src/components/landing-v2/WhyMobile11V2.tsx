import React from 'react';
import { Globe, Wifi, MessageCircle, QrCode } from 'lucide-react';
import { SectionDecorations } from './FloatingDecorations';
import { useLanguage } from '@/contexts/LanguageContext';

export const WhyMobile11V2: React.FC = () => {
  const { t } = useLanguage();

  const features = [
    { icon: <Globe className="w-7 h-7" />, title: t('whyMobile11V2.feature1.title'), description: t('whyMobile11V2.feature1.description') },
    { icon: <Wifi className="w-7 h-7" />, title: t('whyMobile11V2.feature2.title'), description: t('whyMobile11V2.feature2.description') },
    { icon: <MessageCircle className="w-7 h-7" />, title: t('whyMobile11V2.feature3.title'), description: t('whyMobile11V2.feature3.description') },
    { icon: <QrCode className="w-7 h-7" />, title: t('whyMobile11V2.feature4.title'), description: t('whyMobile11V2.feature4.description') },
  ];

  return (
    <section className="py-16 md:py-24 bg-[hsl(35,33%,96%)]">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl bg-[hsl(199,95%,84%)] p-8 md:p-12 lg:p-16">
          <SectionDecorations />
          
          <div className="relative z-10">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[hsl(20,14%,10%)] mb-4">
                {t('whyMobile11V2.title')}{' '}
                <span className="text-[hsl(25,95%,53%)]">{t('whyMobile11V2.brand')}</span>?
              </h2>
              <p className="text-lg text-[hsl(20,6%,35%)] max-w-2xl mx-auto">
                {t('whyMobile11V2.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {features.map((feature, index) => (
                <div key={index} className="flex flex-col items-center text-center group">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white shadow-md flex items-center justify-center mb-4 transition-all group-hover:shadow-lg group-hover:scale-105">
                    <div className="text-[hsl(25,95%,53%)]">{feature.icon}</div>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-[hsl(20,14%,10%)] mb-1">{feature.title}</h3>
                  <p className="text-sm text-[hsl(20,6%,35%)]">{feature.description}</p>
                </div>
              ))}
            </div>

            <div className="hidden lg:block absolute -left-8 bottom-0 w-32 h-32">
              <div className="w-full h-full bg-gradient-to-br from-[hsl(30,100%,80%)] to-[hsl(25,95%,70%)] rounded-full opacity-50" />
            </div>
            <div className="hidden lg:block absolute -right-8 top-0 w-28 h-28">
              <div className="w-full h-full bg-gradient-to-br from-[hsl(156,72%,85%)] to-[hsl(156,72%,70%)] rounded-full opacity-50" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyMobile11V2;
