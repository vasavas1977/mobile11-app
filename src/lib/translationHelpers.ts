// Helper functions for getting translated content arrays
import { useLanguage } from '@/contexts/LanguageContext';

export function useAboutPage() {
  const { t } = useLanguage();
  
  const values = [
    {
      icon: 'Zap',
      title: t('about.values.initiative.title'),
      description: t('about.values.initiative.description')
    },
    {
      icon: 'Lightbulb',
      title: t('about.values.creative.title'),
      description: t('about.values.creative.description')
    },
    {
      icon: 'Rocket',
      title: t('about.values.moveFast.title'),
      description: t('about.values.moveFast.description')
    },
    {
      icon: 'Target',
      title: t('about.values.outcome.title'),
      description: t('about.values.outcome.description')
    },
    {
      icon: 'Heart',
      title: t('about.values.sincere.title'),
      description: t('about.values.sincere.description')
    },
    {
      icon: 'Users',
      title: t('about.values.respect.title'),
      description: t('about.values.respect.description')
    },
    {
      icon: 'Shield',
      title: t('about.values.commit.title'),
      description: t('about.values.commit.description')
    },
    {
      icon: 'UsersRound',
      title: t('about.values.teamwork.title'),
      description: t('about.values.teamwork.description')
    }
  ];

  return { values };
}

export function useWhatIsEsimPage() {
  const { t } = useLanguage();
  
  const benefits = [
    {
      icon: 'Zap',
      title: t('whatIsEsim.benefits.instant.title'),
      description: t('whatIsEsim.benefits.instant.description')
    },
    {
      icon: 'Globe',
      title: t('whatIsEsim.benefits.global.title'),
      description: t('whatIsEsim.benefits.global.description')
    },
    {
      icon: 'Smartphone',
      title: t('whatIsEsim.benefits.multiple.title'),
      description: t('whatIsEsim.benefits.multiple.description')
    },
    {
      icon: 'Leaf',
      title: t('whatIsEsim.benefits.eco.title'),
      description: t('whatIsEsim.benefits.eco.description')
    },
    {
      icon: 'Shield',
      title: t('whatIsEsim.benefits.secure.title'),
      description: t('whatIsEsim.benefits.secure.description')
    },
    {
      icon: 'CreditCard',
      title: t('whatIsEsim.benefits.cost.title'),
      description: t('whatIsEsim.benefits.cost.description')
    }
  ];

  const faqs = [
    {
      question: t('whatIsEsim.faqs.q1.question'),
      answer: t('whatIsEsim.faqs.q1.answer')
    },
    {
      question: t('whatIsEsim.faqs.q2.question'),
      answer: t('whatIsEsim.faqs.q2.answer')
    },
    {
      question: t('whatIsEsim.faqs.q3.question'),
      answer: t('whatIsEsim.faqs.q3.answer')
    },
    {
      question: t('whatIsEsim.faqs.q4.question'),
      answer: t('whatIsEsim.faqs.q4.answer')
    },
    {
      question: t('whatIsEsim.faqs.q5.question'),
      answer: t('whatIsEsim.faqs.q5.answer')
    },
    {
      question: t('whatIsEsim.faqs.q6.question'),
      answer: t('whatIsEsim.faqs.q6.answer')
    },
    {
      question: t('whatIsEsim.faqs.q7.question'),
      answer: t('whatIsEsim.faqs.q7.answer')
    },
    {
      question: t('whatIsEsim.faqs.q8.question'),
      answer: t('whatIsEsim.faqs.q8.answer')
    }
  ];

  return { benefits, faqs };
}

export function useSupportPage() {
  const { t } = useLanguage();
  
  const quickHelpCards = [
    {
      icon: 'Smartphone',
      title: t('support.quickHelp.setup.title'),
      description: t('support.quickHelp.setup.description')
    },
    {
      icon: 'Globe',
      title: t('support.quickHelp.coverage.title'),
      description: t('support.quickHelp.coverage.description')
    },
    {
      icon: 'CreditCard',
      title: t('support.quickHelp.billing.title'),
      description: t('support.quickHelp.billing.description')
    },
    {
      icon: 'Settings',
      title: t('support.quickHelp.troubleshooting.title'),
      description: t('support.quickHelp.troubleshooting.description')
    }
  ];

  return { quickHelpCards };
}

export function useBusinessPage() {
  const { t } = useLanguage();
  
  const features = [
    {
      icon: 'Zap',
      title: t('business.features.instant.title'),
      description: t('business.features.instant.description')
    },
    {
      icon: 'Globe',
      title: t('business.features.global.title'),
      description: t('business.features.global.description')
    },
    {
      icon: 'Users',
      title: t('business.features.management.title'),
      description: t('business.features.management.description')
    },
    {
      icon: 'Shield',
      title: t('business.features.security.title'),
      description: t('business.features.security.description')
    },
    {
      icon: 'TrendingUp',
      title: t('business.features.analytics.title'),
      description: t('business.features.analytics.description')
    },
    {
      icon: 'HeadphonesIcon',
      title: t('business.features.support.title'),
      description: t('business.features.support.description')
    }
  ];

  return { features };
}
