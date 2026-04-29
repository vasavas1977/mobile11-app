import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { LottieAnimation } from '@/components/landing-v2/LottieAnimation';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export const LimitlessFAQ: React.FC = () => {
  const { t } = useLanguage();

  const faqs = [
    {
      question: t('limitless.faq.q1.question') || 'Do unlimited data packages have any limits?',
      answer: t('limitless.faq.q1.answer') || 'Our Limitless plans offer truly unlimited data at maximum speeds. If unusual data usage is detected, speed may be temporarily reduced (5 Mbps for most carriers, 2 Mbps for DOCOMO). Speed resets to maximum within 24 hours, ensuring you always have reliable connectivity.',
    },
    {
      question: t('limitless.faq.q2.question') || 'What is the fair use policy?',
      answer: t('limitless.faq.q2.answer') || 'Our Fair Usage Policy ensures network quality for all users. If we detect unusual data consumption, speed may be temporarily reduced (5 Mbps for most carriers, 2 Mbps for DOCOMO in Japan). Your maximum speed resets within 24 hours. Normal usage is unaffected — only unusual/excessive consumption triggers FUP.',
    },
    {
      question: t('limitless.faq.q3.question') || 'Can I use hotspot/tethering with unlimited data?',
      answer: t('limitless.faq.q3.answer') || 'Yes! Hotspot and tethering are fully supported on all our Limitless plans. Share your connection with laptops, tablets, and other devices without any additional charges.',
    },
    {
      question: t('limitless.faq.q4.question') || 'When does my unlimited data plan start?',
      answer: t('limitless.faq.q4.answer') || 'Your plan starts when you first connect to mobile data at your destination, not when you scan the QR code. You can install your eSIM in advance and it will only activate when you use data for the first time.',
    },
    {
      question: t('limitless.faq.q5.question') || 'What speeds can I expect?',
      answer: t('limitless.faq.q5.answer') || 'You\'ll experience the best available speeds from local carriers (typically 4G/LTE or 5G where available). The Fair Usage Policy only applies if unusual usage is detected, reducing speed temporarily before resetting within 24 hours.',
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-[#FAF7F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Lottie Animation */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex justify-center md:sticky md:top-32"
          >
            <div className="w-full max-w-md">
              <LottieAnimation
                src="/assets/lottie/people-working-5g.lottie"
                className="w-full h-auto scale-150"
                devicePixelRatio={2}
                speed={0.85}
                lazy
                lazyRootMargin="200px"
              />
            </div>
          </motion.div>

          {/* FAQ Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-8">
              {t('limitless.faq.title') || 'Frequently asked questions'}
            </h2>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <Accordion type="single" collapsible className="space-y-2">
                {faqs.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="border-b border-gray-100 last:border-0"
                  >
                    <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-orange-600 hover:no-underline py-4">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 pb-4">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default LimitlessFAQ;
