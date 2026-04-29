import { useLanguage } from '@/contexts/LanguageContext';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

// Referral reward values
const REFERRAL_REWARD_USD = 5;
const REFERRAL_REWARD_THB = 175;
const REFERRAL_REWARD_JPY = 750;

export const ReferralFAQ = () => {
  const { t, formatPrice } = useLanguage();

  const rewardAmount = formatPrice(REFERRAL_REWARD_USD);

  const replaceReward = (text: string) => text.replace(/\{reward\}/g, rewardAmount);

  const faqs = [
    { question: t('referralPage.faq.q1'), answer: t('referralPage.faq.a1') },
    { question: t('referralPage.faq.q2'), answer: replaceReward(t('referralPage.faq.a2') as string) },
    { question: t('referralPage.faq.q3'), answer: t('referralPage.faq.a3') },
    { question: t('referralPage.faq.q4'), answer: replaceReward(t('referralPage.faq.a4') as string) },
    { question: t('referralPage.faq.q5'), answer: replaceReward(t('referralPage.faq.a5') as string) },
    { question: t('referralPage.faq.q6'), answer: replaceReward(t('referralPage.faq.a6') as string) },
  ];

  return (
    <section className="py-16 md:py-24 bg-[#FAF7F2]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('referralPage.faq.title')}
          </h2>
        </div>

        {/* FAQ Accordion */}
        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="bg-white rounded-2xl border-none shadow-sm overflow-hidden"
            >
              <AccordionTrigger className="px-6 py-5 text-left text-gray-900 font-semibold hover:no-underline hover:bg-gray-50 transition-colors">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-5 text-gray-600 leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
