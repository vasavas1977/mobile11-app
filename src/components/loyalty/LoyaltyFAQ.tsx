import { useLanguage } from '@/contexts/LanguageContext';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export const LoyaltyFAQ = () => {
  const { t } = useLanguage();

  const faqs = [
    { question: t('loyaltyFaq.q1'), answer: t('loyaltyFaq.a1') },
    { question: t('loyaltyFaq.q2'), answer: t('loyaltyFaq.a2') },
    { question: t('loyaltyFaq.q3'), answer: t('loyaltyFaq.a3') },
    { question: t('loyaltyFaq.q4'), answer: t('loyaltyFaq.a4') },
    { question: t('loyaltyFaq.q5'), answer: t('loyaltyFaq.a5') },
  ];

  return (
    <section className="py-16 md:py-24 bg-[#FAF7F2]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('loyaltyFaq.title')}
          </h2>
        </div>

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
