import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { X, Lightbulb, ChevronLeft, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface HowToConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type DialogView = 'steps' | 'faq';

export function HowToConnectDialog({ open, onOpenChange }: HowToConnectDialogProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [view, setView] = useState<DialogView>('steps');

  const handleClose = () => {
    onOpenChange(false);
    // Reset view when closing
    setTimeout(() => setView('steps'), 300);
  };

  const handleGoToHelpCenter = () => {
    handleClose();
    navigate('/support');
  };

  const handleContactSupport = () => {
    handleClose();
    navigate('/support');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-0 bg-[#FAF7F2] border-0 rounded-2xl">
        {view === 'steps' ? (
          <>
            {/* Header - Steps View */}
            <div className="flex items-center justify-between p-5 pb-0">
              <DialogTitle className="text-xl font-bold text-gray-800">
                {t('howToConnect.title')}
              </DialogTitle>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Intro Text */}
              <p className="text-gray-600 text-sm">
                {t('howToConnect.intro')}
              </p>

              {/* Steps Accordion */}
              <Accordion type="single" collapsible className="space-y-3">
                {/* Step 1 */}
                <AccordionItem value="step1" className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <AccordionTrigger className="px-4 py-4 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                    <span className="text-left font-semibold text-gray-800">
                      {t('howToConnect.step1Title')}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-0">
                    <p className="text-gray-600 text-sm mb-3">
                      {t('howToConnect.step1Content')}
                    </p>
                    <div className="bg-teal-50 rounded-lg p-3 flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                      <p className="text-teal-800 text-sm">
                        {t('howToConnect.step1Tip')}
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Step 2 */}
                <AccordionItem value="step2" className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <AccordionTrigger className="px-4 py-4 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                    <span className="text-left font-semibold text-gray-800">
                      {t('howToConnect.step2Title')}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-0">
                    <p className="text-gray-600 text-sm mb-3">
                      {t('howToConnect.step2Content')}
                    </p>
                    <div className="bg-teal-50 rounded-lg p-3 flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                      <p className="text-teal-800 text-sm">
                        {t('howToConnect.step2Tip')}
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Step 3 */}
                <AccordionItem value="step3" className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <AccordionTrigger className="px-4 py-4 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                    <span className="text-left font-semibold text-gray-800">
                      {t('howToConnect.step3Title')}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-0">
                    <p className="text-gray-600 text-sm">
                      {t('howToConnect.step3Content')}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* FAQ Section */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                <h3 className="font-semibold text-gray-800">
                  {t('howToConnect.faqTitle')}
                </h3>
                <p className="text-gray-600 text-sm">
                  {t('howToConnect.faqDescription')}
                </p>
                <Button
                  onClick={() => setView('faq')}
                  className="w-full bg-gray-900 text-white font-semibold py-3 rounded-xl hover:bg-gray-800"
                >
                  {t('howToConnect.needHelp')}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Header - FAQ View */}
            <div className="flex items-center justify-between p-5 pb-0 bg-[#F5F1EC]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setView('steps')}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <DialogTitle className="text-xl font-bold text-gray-800">
                  {t('howToConnect.faqTitle')}
                </DialogTitle>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* FAQ Accordion */}
              <Accordion type="multiple" className="space-y-3">
                {/* FAQ 1 */}
                <AccordionItem value="faq1" className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <AccordionTrigger className="px-4 py-4 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                    <span className="text-left font-semibold text-gray-800">
                      {t('howToConnect.faq1Title')}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-0">
                    <p className="text-gray-600 text-sm mb-3">
                      {t('howToConnect.faq1Content')}
                    </p>
                    <button 
                      onClick={handleGoToHelpCenter}
                      className="flex items-center gap-1 text-gray-800 font-semibold text-sm hover:underline"
                    >
                      {t('howToConnect.readMore')}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </AccordionContent>
                </AccordionItem>

                {/* FAQ 2 */}
                <AccordionItem value="faq2" className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <AccordionTrigger className="px-4 py-4 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                    <span className="text-left font-semibold text-gray-800">
                      {t('howToConnect.faq2Title')}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-0">
                    <p className="text-gray-600 text-sm mb-3">
                      {t('howToConnect.faq2Content')}
                    </p>
                    <button 
                      onClick={handleGoToHelpCenter}
                      className="flex items-center gap-1 text-gray-800 font-semibold text-sm hover:underline"
                    >
                      {t('howToConnect.readMore')}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </AccordionContent>
                </AccordionItem>

                {/* FAQ 3 */}
                <AccordionItem value="faq3" className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <AccordionTrigger className="px-4 py-4 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                    <span className="text-left font-semibold text-gray-800">
                      {t('howToConnect.faq3Title')}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-0">
                    <p className="text-gray-600 text-sm mb-3">
                      {t('howToConnect.faq3Content')}
                    </p>
                  </AccordionContent>
                </AccordionItem>

                {/* FAQ 4 */}
                <AccordionItem value="faq4" className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <AccordionTrigger className="px-4 py-4 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                    <span className="text-left font-semibold text-gray-800">
                      {t('howToConnect.faq4Title')}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-0">
                    <p className="text-gray-600 text-sm mb-3">
                      {t('howToConnect.faq4Content')}
                    </p>
                    <button 
                      onClick={handleGoToHelpCenter}
                      className="flex items-center gap-1 text-gray-800 font-semibold text-sm hover:underline"
                    >
                      {t('howToConnect.readMore')}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </AccordionContent>
                </AccordionItem>

                {/* FAQ 5 */}
                <AccordionItem value="faq5" className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <AccordionTrigger className="px-4 py-4 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                    <span className="text-left font-semibold text-gray-800">
                      {t('howToConnect.faq5Title')}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-0">
                    <p className="text-gray-600 text-sm mb-3">
                      {t('howToConnect.faq5Content')}
                    </p>
                    <button 
                      onClick={handleGoToHelpCenter}
                      className="flex items-center gap-1 text-gray-800 font-semibold text-sm hover:underline"
                    >
                      {t('howToConnect.readMore')}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Need More Help Section */}
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <h3 className="font-semibold text-gray-800">
                  {t('howToConnect.needMoreHelp')}
                </h3>
                <p className="text-gray-600 text-sm">
                  {t('howToConnect.needMoreHelpDescription')}
                </p>
                <div className="space-y-2">
                  <Button
                    onClick={handleGoToHelpCenter}
                    className="w-full bg-gray-900 text-white font-semibold py-3 rounded-xl hover:bg-gray-800"
                  >
                    {t('howToConnect.goToHelpCenter')}
                  </Button>
                  <Button
                    onClick={handleContactSupport}
                    className="w-full bg-gray-900 text-white font-semibold py-3 rounded-xl hover:bg-gray-800"
                  >
                    {t('howToConnect.contactSupport')}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
