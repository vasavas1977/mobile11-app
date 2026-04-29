import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useLanguage } from '@/contexts/LanguageContext';

export function InstallationFAQs() {
  const { t } = useLanguage();
  
  const faqs = [
    {
      question: t('myEsims.faq1Question'),
      answer: t('myEsims.faq1Answer'),
    },
    {
      question: t('myEsims.faq2Question'),
      answer: t('myEsims.faq2Answer'),
    },
    {
      question: t('myEsims.faq3Question'),
      answer: t('myEsims.faq3Answer'),
    },
  ];
  
  return (
    <div className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-6">
      <h3 className="font-bold text-gray-800 text-lg mb-4">
        {t('myEsims.installationFAQs')}
      </h3>
      
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`} className="border-gray-100">
            <AccordionTrigger className="text-gray-700 hover:text-gray-900 text-left">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-gray-600 text-sm">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
