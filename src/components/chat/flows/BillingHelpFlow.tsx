import { useState } from 'react';
import { ChevronRight, ExternalLink, CreditCard, ReceiptText, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserFlowData } from './types';

interface BillingHelpFlowProps {
  step: string;
  userData: UserFlowData;
  onNavigateStep: (step: string, data?: Partial<UserFlowData>) => void;
  onNavigateToFlow: (flow: string, step?: string) => void;
  onEscalate: () => void;
}

export function BillingHelpFlow({ step, userData, onNavigateStep, onNavigateToFlow, onEscalate }: BillingHelpFlowProps) {
  switch (step) {
    case 'topic-selection':
      return <TopicSelectionStep onSelect={(topic) => onNavigateStep(topic)} />;
    case 'payment-methods':
      return <PaymentMethodsStep onBack={() => onNavigateStep('topic-selection')} />;
    case 'refund-policy':
      return <RefundPolicyStep onEscalate={onEscalate} onBack={() => onNavigateStep('topic-selection')} />;
    case 'receipt':
      return <ReceiptStep onNavigateToFlow={onNavigateToFlow} onBack={() => onNavigateStep('topic-selection')} />;
    default:
      return <TopicSelectionStep onSelect={(topic) => onNavigateStep(topic)} />;
  }
}

function TopicSelectionStep({ onSelect }: { onSelect: (topic: string) => void }) {
  const { t } = useLanguage();

  const topics = [
    { 
      id: 'payment-methods', 
      icon: <CreditCard className="h-5 w-5" />,
      labelKey: 'chatbot.flows.billingPaymentMethods',
      descKey: 'chatbot.flows.billingPaymentMethodsDesc',
    },
    { 
      id: 'refund-policy', 
      icon: <RefreshCw className="h-5 w-5" />,
      labelKey: 'chatbot.flows.billingRefund',
      descKey: 'chatbot.flows.billingRefundDesc',
    },
    { 
      id: 'receipt', 
      icon: <ReceiptText className="h-5 w-5" />,
      labelKey: 'chatbot.flows.billingReceipt',
      descKey: 'chatbot.flows.billingReceiptDesc',
    },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-800 mb-3">
          {t('chatbot.flows.billingWhatHelp')}
        </p>
        
        <div className="space-y-2">
          {topics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => onSelect(topic.id)}
              className="w-full flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 
                         rounded-lg hover:bg-orange-50 hover:border-orange-200 transition-all group text-left"
            >
              <div className="flex-shrink-0 text-gray-500 group-hover:text-orange-500">
                {topic.icon}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-gray-800 group-hover:text-orange-700 block">
                  {t(topic.labelKey)}
                </span>
                <span className="text-xs text-gray-500">
                  {t(topic.descKey)}
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-orange-500 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PaymentMethodsStep({ onBack }: { onBack: () => void }) {
  const { t } = useLanguage();

  const paymentMethods = [
    { icon: '💳', labelKey: 'chatbot.flows.payCard', descKey: 'chatbot.flows.payCardDesc' },
    { icon: '🏦', labelKey: 'chatbot.flows.payPromptPay', descKey: 'chatbot.flows.payPromptPayDesc' },
    { icon: '📱', labelKey: 'chatbot.flows.payTrueMoney', descKey: 'chatbot.flows.payTrueMoneyDesc' },
  ];

  return (
    <div className="p-4 space-y-4">
      <button
        onClick={onBack}
        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
      >
        ← {t('chatbot.nav.back')}
      </button>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm font-semibold text-gray-800 mb-3">
          {t('chatbot.flows.acceptedPayments')}
        </p>
        
        <div className="space-y-2">
          {paymentMethods.map((method, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-xl">{method.icon}</span>
              <div>
                <p className="font-medium text-gray-800">
                  {t(method.labelKey)}
                </p>
                <p className="text-xs text-gray-500">
                  {t(method.descKey)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
          <p className="font-semibold">
            {t('chatbot.flows.secure100')}
          </p>
          <p className="text-xs mt-1">
            {t('chatbot.flows.secureThroughStripe')}
          </p>
        </div>
      </div>
    </div>
  );
}

function RefundPolicyStep({ onEscalate, onBack }: { onEscalate: () => void; onBack: () => void }) {
  const { t } = useLanguage();

  return (
    <div className="p-4 space-y-4">
      <button
        onClick={onBack}
        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
      >
        ← {t('chatbot.nav.back')}
      </button>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm font-semibold text-gray-800 mb-3">
          {t('chatbot.flows.refundPolicyTitle')}
        </p>
        
        <div className="space-y-3">
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="font-semibold text-green-800">
              {t('chatbot.flows.refund30Day')}
            </p>
            <p className="text-xs text-green-600 mt-1">
              {t('chatbot.flows.forUnusedEsims')}
            </p>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="font-semibold text-amber-800">
              {t('chatbot.flows.nonRefundable')}
            </p>
            <ul className="text-xs text-amber-700 mt-1 space-y-1 ml-4 list-disc">
              <li>{t('chatbot.flows.usedEsims')}</li>
              <li>{t('chatbot.flows.expiredEsims')}</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-600 mb-3">
            {t('chatbot.flows.wantRefund')}
          </p>
          <button
            onClick={onEscalate}
            className="w-full p-3 bg-orange-500 text-white font-semibold rounded-lg
                       hover:bg-orange-600 transition-colors"
          >
            {t('chatbot.flows.contactSupport')}
          </button>
        </div>
      </div>

      <a 
        href="/refund-policy" 
        target="_blank"
        className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-orange-500"
      >
        <ExternalLink className="h-4 w-4" />
        {t('chatbot.flows.readFullRefundPolicy')}
      </a>
    </div>
  );
}

function ReceiptStep({ onNavigateToFlow, onBack }: { onNavigateToFlow: (flow: string, step?: string) => void; onBack: () => void }) {
  const { t } = useLanguage();

  return (
    <div className="p-4 space-y-4">
      <button
        onClick={onBack}
        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
      >
        ← {t('chatbot.nav.back')}
      </button>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm font-semibold text-gray-800 mb-3">
          {t('chatbot.flows.findReceipt')}
        </p>
        
        <div className="space-y-3">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <p className="font-semibold">
              {t('chatbot.flows.checkEmail')}
            </p>
            <p className="text-xs mt-1">
              {t('chatbot.flows.receiptAutoSent')}
            </p>
          </div>

          <p className="text-sm text-gray-600">
            {t('chatbot.flows.orFindWithOrder')}
          </p>

          <button
            onClick={() => onNavigateToFlow('find-order')}
            className="w-full p-3 bg-orange-500 text-white font-semibold rounded-lg
                       hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
          >
            {t('chatbot.flows.findOrderReceipt')}
          </button>
        </div>
      </div>
    </div>
  );
}
