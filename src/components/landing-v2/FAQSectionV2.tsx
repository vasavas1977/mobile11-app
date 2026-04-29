import React, { useState } from 'react';
import { ChevronDown, MessageCircle, HelpCircle, Headphones } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

export const FAQSectionV2: React.FC = () => {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    { question: t('faqV2.q1'), answer: t('faqV2.a1') },
    { question: t('faqV2.q2'), answer: t('faqV2.a2') },
    { question: t('faqV2.q3'), answer: t('faqV2.a3') },
    { question: t('faqV2.q4'), answer: t('faqV2.a4') },
    { question: t('faqV2.q5'), answer: t('faqV2.a5') },
  ];

  return (
    <section className="py-16 md:py-24 bg-[hsl(35,33%,96%)]">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="lg:col-span-2">
            <div className="mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-[hsl(20,14%,10%)] mb-4">
                {t('faqV2.title')}
              </h2>
              <p className="text-lg text-[hsl(20,6%,45%)]">
                {t('faqV2.subtitle')}
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white rounded-xl overflow-hidden shadow-sm">
                  <button
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <span className="font-semibold text-[hsl(20,14%,10%)] pr-4">{faq.question}</span>
                    <ChevronDown className={`w-5 h-5 text-[hsl(25,95%,53%)] transition-transform flex-shrink-0 ${openIndex === index ? 'rotate-180' : ''}`} />
                  </button>
                  {openIndex === index && (
                    <div className="px-5 pb-5 animate-v2-fade-up">
                      <p className="text-[hsl(20,6%,45%)] leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6">
              <Link to="/support" className="text-[hsl(25,95%,53%)] font-semibold hover:underline inline-flex items-center gap-1">
                {t('faqV2.viewAll')}
                <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
              <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-[hsl(199,95%,88%)] to-[hsl(199,89%,75%)] flex items-center justify-center">
                <Headphones className="w-16 h-16 text-[hsl(199,89%,50%)]" />
              </div>

              <h3 className="text-xl font-bold text-[hsl(20,14%,10%)] text-center mb-2">
                {t('faqV2.needHelp')}
              </h3>
              <p className="text-[hsl(20,6%,45%)] text-center mb-6">
                {t('faqV2.supportAvailable')}
              </p>

              <div className="space-y-3">
                <Link to="/support" className="flex items-center gap-3 p-4 rounded-xl bg-[hsl(35,33%,96%)] hover:bg-[hsl(35,27%,93%)] transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-[hsl(25,95%,53%)] flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-[hsl(20,14%,10%)]">{t('faqV2.helpCenter')}</p>
                    <p className="text-sm text-[hsl(20,6%,45%)]">{t('faqV2.browseArticles')}</p>
                  </div>
                </Link>

                <a href="https://line.me/R/ti/p/@mobile11" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl bg-[hsl(142,76%,95%)] hover:bg-[hsl(142,76%,90%)] transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-[hsl(142,76%,45%)] flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-[hsl(20,14%,10%)]">{t('faqV2.chatOnLine')}</p>
                    <p className="text-sm text-[hsl(20,6%,45%)]">{t('faqV2.quickResponses')}</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSectionV2;
