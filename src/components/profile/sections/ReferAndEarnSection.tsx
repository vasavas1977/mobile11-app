import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Gift, 
  Copy, 
  Check,
  Mail
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { MegaphoneIllustration } from '@/components/illustrations/MegaphoneIllustration';
import { GiftBoxIllustration } from '@/components/illustrations/GiftBoxIllustration';
import { PhoneCoinsIllustration } from '@/components/illustrations/PhoneCoinsIllustration';

// Helper to replace {reward} and {code} placeholders
const formatMessage = (template: string, values: Record<string, string>) => {
  return Object.entries(values).reduce(
    (str, [key, value]) => str.replace(new RegExp(`\\{${key}\\}`, 'g'), value),
    template
  );
};

// Social platform icons as simple components
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

interface ReferAndEarnSectionProps {
  loyalty: {
    referral_code: string | null;
  } | null | undefined;
}

export const ReferAndEarnSection: React.FC<ReferAndEarnSectionProps> = ({ loyalty }) => {
  const [copied, setCopied] = useState(false);
  const { language, t, formatPrice } = useLanguage();
  
  // Standardized referral rewards: $5 USD / ฿175 THB
  const REFERRAL_REWARD_USD = 5;
  const rewardDisplay = formatPrice(REFERRAL_REWARD_USD);
  
  const referralCode = loyalty?.referral_code || 'MOBILE11';
  const referralLink = `${window.location.origin}?ref=${referralCode}`;
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      toast.success(t('referAndEarn.codeCopied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('referAndEarn.copyFailed'));
    }
  };

  const emailSubject = formatMessage(t('referAndEarn.emailSubject'), { reward: rewardDisplay });
  const emailBody = formatMessage(t('referAndEarn.emailBody'), { reward: rewardDisplay, code: referralCode });
  const shareMessage = formatMessage(t('referAndEarn.shareMessage'), { reward: rewardDisplay, code: referralCode });

  const shareLinks = [
    { 
      icon: Mail, 
      label: 'Email',
      href: `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody + ' ' + referralLink)}`,
      color: 'text-gray-600 hover:text-gray-800'
    },
    { 
      icon: FacebookIcon, 
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
      color: 'text-blue-600 hover:text-blue-700'
    },
    { 
      icon: LinkedInIcon, 
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`,
      color: 'text-blue-700 hover:text-blue-800'
    },
    { 
      icon: TelegramIcon, 
      label: 'Telegram',
      href: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareMessage)}`,
      color: 'text-sky-500 hover:text-sky-600'
    },
    { 
      icon: WhatsAppIcon, 
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodeURIComponent(shareMessage + ' ' + referralLink)}`,
      color: 'text-green-500 hover:text-green-600'
    },
    { 
      icon: XIcon, 
      label: 'X',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(referralLink)}`,
      color: 'text-gray-500 hover:text-gray-700'
    },
  ];

  // Minimum order requirement note
  const minOrderNote = t('referAndEarn.minOrderNote');

  const howItWorksSteps = [
    {
      illustration: MegaphoneIllustration,
      title: t('referAndEarn.step1Title'),
      description: t('referAndEarn.step1Description'),
    },
    {
      illustration: GiftBoxIllustration,
      title: t('referAndEarn.step2Title'),
      description: formatMessage(t('referAndEarn.step2Description'), { reward: rewardDisplay }),
    },
    {
      illustration: PhoneCoinsIllustration,
      title: t('referAndEarn.step3Title'),
      description: formatMessage(t('referAndEarn.step3Description'), { reward: rewardDisplay }),
      note: minOrderNote,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Reward History Card */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {t('referAndEarn.rewardHistory')}
        </h3>
        <p className="text-sm text-gray-500">
          {t('referAndEarn.noRewardsYet')}
        </p>
      </div>

      {/* Share Amazing eSIM Technology Card */}
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center flex-shrink-0">
            <Gift className="w-6 h-6 text-orange-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {t('referAndEarn.shareTitle')}
            </h2>
            <p className="text-2xl font-bold text-orange-600 mb-4">
              {formatMessage(t('referAndEarn.giveGet'), { reward: rewardDisplay })}
            </p>
            <Button 
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-full"
              onClick={() => window.location.href = '/refer-and-earn'}
            >
              {t('referAndEarn.learnAbout')}
            </Button>
          </div>
        </div>
      </div>

      {/* Share Your Referral Code Card */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {t('referAndEarn.shareCodeTitle')}
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          {formatMessage(t('referAndEarn.shareCodeDescription'), { reward: rewardDisplay })}
        </p>
        <a href="/refer-and-earn" className="text-sm text-orange-500 hover:underline mb-6 inline-block">
          {t('referAndEarn.termsAndConditions')}
        </a>

        {/* Referral Code Input */}
        <div className="mb-6">
          <label className="text-sm text-gray-500 mb-2 block">
            {t('referAndEarn.yourReferralCode')}
          </label>
          <div className="flex gap-2">
            <Input
              value={referralCode}
              readOnly
              className="bg-gray-50 border-gray-200 rounded-xl h-12 font-mono text-lg font-semibold tracking-wider text-gray-900"
            />
            <Button
              onClick={handleCopy}
              variant="outline"
              className="h-12 px-4 rounded-xl border-gray-200"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <Copy className="w-5 h-5 text-gray-500" />
              )}
            </Button>
          </div>
        </div>

        {/* Social Share Buttons */}
        <div>
          <p className="text-sm text-gray-500 mb-3">{t('referAndEarn.shareVia')}</p>
          <div className="flex flex-wrap gap-3">
            {shareLinks.map((link) => {
              const IconComponent = link.icon;
              return (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center transition-colors hover:bg-gray-50 ${link.color}`}
                  title={link.label}
                >
                  <IconComponent />
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-4">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          {t('referAndEarn.howItWorksTitle')}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {howItWorksSteps.map((step, index) => {
            const IllustrationComponent = step.illustration;
            return (
              <div key={index} className="text-center">
                <IllustrationComponent className="w-32 h-32 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {step.description}
                </p>
                {step.note && (
                  <p className="text-xs text-orange-600 mt-1 font-medium">
                    {step.note}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
