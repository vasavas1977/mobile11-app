import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { HelpCircle, ExternalLink } from 'lucide-react';

export function ConfiguratorFAQ() {
  const { t } = useLanguage();
  
  const faqItems = [
    {
      id: 'q1',
      question: t('configuratorFaq.q1.question'),
      answer: (
        <>
          {t('configuratorFaq.q1.answer')}
        </>
      )
    },
    {
      id: 'q2',
      question: t('configuratorFaq.q2.question'),
      answer: (
        <div className="space-y-3">
          <p className="font-medium">{t('configuratorFaq.q2.intro')}</p>
          <ol className="list-decimal list-inside space-y-2 ml-2">
            <li>
              <span className="font-medium">{t('configuratorFaq.q2.step1.title')}</span><br />
              <span className="text-muted-foreground ml-5">{t('configuratorFaq.q2.step1.desc')}</span>
            </li>
            <li>
              <span className="font-medium">{t('configuratorFaq.q2.step2.title')}</span><br />
              <span className="text-muted-foreground ml-5">{t('configuratorFaq.q2.step2.desc')}</span>
            </li>
            <li>
              <span className="font-medium">{t('configuratorFaq.q2.step3.title')}</span><br />
              <span className="text-muted-foreground ml-5">
                {t('configuratorFaq.q2.step3.desc')}{' '}
                <Link to="/installation-guide" className="text-primary hover:underline inline-flex items-center gap-1">
                  {t('configuratorFaq.q2.step3.link')}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </span>
            </li>
            <li>
              <span className="font-medium">{t('configuratorFaq.q2.step4.title')}</span><br />
              <span className="text-muted-foreground ml-5">{t('configuratorFaq.q2.step4.desc')}</span>
            </li>
            <li>
              <span className="font-medium">{t('configuratorFaq.q2.step5.title')}</span><br />
              <span className="text-muted-foreground ml-5">
                {t('configuratorFaq.q2.step5.desc')}{' '}
                <Link to="/support" className="text-primary hover:underline inline-flex items-center gap-1">
                  {t('configuratorFaq.contactSupport')}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </span>
            </li>
          </ol>
        </div>
      )
    },
    {
      id: 'q3',
      question: t('configuratorFaq.q3.question'),
      answer: (
        <>
          {t('configuratorFaq.q3.answer')}{' '}
          <Link to="/what-is-esim" className="text-primary hover:underline inline-flex items-center gap-1">
            {t('configuratorFaq.learnMore')}
            <ExternalLink className="h-3 w-3" />
          </Link>
        </>
      )
    },
    {
      id: 'q4',
      question: t('configuratorFaq.q4.question'),
      answer: t('configuratorFaq.q4.answer')
    },
    {
      id: 'q5',
      question: t('configuratorFaq.q5.question'),
      answer: t('configuratorFaq.q5.answer')
    },
    {
      id: 'q6',
      question: t('configuratorFaq.q6.question'),
      answer: t('configuratorFaq.q6.answer')
    },
    {
      id: 'q7',
      question: t('configuratorFaq.q7.question'),
      answer: t('configuratorFaq.q7.answer')
    },
    {
      id: 'q8',
      question: t('configuratorFaq.q8.question'),
      answer: (
        <>
          {t('configuratorFaq.q8.answer')}{' '}
          <Link to="/orders" className="text-primary hover:underline inline-flex items-center gap-1">
            {t('configuratorFaq.q8.link')}
            <ExternalLink className="h-3 w-3" />
          </Link>
        </>
      )
    },
    {
      id: 'q9',
      question: t('configuratorFaq.q9.question'),
      answer: (
        <>
          {t('configuratorFaq.q9.answer')}{' '}
          <Link to="/support" className="text-primary hover:underline inline-flex items-center gap-1">
            {t('configuratorFaq.contactSupport')}
            <ExternalLink className="h-3 w-3" />
          </Link>
        </>
      )
    },
    {
      id: 'q10',
      question: t('configuratorFaq.q10.question'),
      answer: t('configuratorFaq.q10.answer')
    }
  ];

  return (
    <div className="mt-12 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <HelpCircle className="h-5 w-5 text-orange-500" />
        <h2 className="text-xl font-semibold">{t('configuratorFaq.title')}</h2>
      </div>
      
      <Accordion type="single" collapsible className="space-y-4">
        {faqItems.map((item) => (
          <AccordionItem 
            key={item.id} 
            value={item.id} 
            className="bg-white rounded-2xl border-none shadow-sm overflow-hidden"
          >
            <AccordionTrigger className="px-6 py-5 text-left text-gray-900 font-semibold hover:no-underline hover:bg-gray-50 transition-colors">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-5 text-gray-600 leading-relaxed">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      
      {/* More FAQs Link */}
      <div className="mt-6 text-center">
        <p className="text-gray-600 text-sm">
          {t('configuratorFaq.moreQuestions')}{' '}
          <Link to="/support#faq-section" className="text-orange-500 hover:underline inline-flex items-center gap-1">
            {t('configuratorFaq.visitSupport')}
            <ExternalLink className="h-3 w-3" />
          </Link>
        </p>
      </div>
    </div>
  );
}
