import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { MobileMenuShell } from './MobileMenuShell';
import { HowReferralsWorkSheet } from './sheets/HowReferralsWorkSheet';

export const MobileReferralScreen: React.FC = () => {
  const { user } = useAuth();
  const { formatPrice } = useLanguage();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const { data: loyalty } = useQuery({
    queryKey: ['user-loyalty', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('user_loyalty')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!user?.id,
  });

  const referralCode = loyalty?.referral_code || 'MOBILE11';
  const reward = formatPrice(5);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      toast({ title: 'Code copied' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  const handleShare = async () => {
    const shareText = `Use my code ${referralCode} on Mobile11 and get ${reward} off your first eSIM. ${window.location.origin}?ref=${referralCode}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Mobile11 Referral',
          text: shareText,
          url: `${window.location.origin}?ref=${referralCode}`,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast({ title: 'Share link copied to clipboard' });
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        await navigator.clipboard.writeText(shareText);
        toast({ title: 'Share link copied to clipboard' });
      }
    }
  };

  return (
    <MobileMenuShell title="Refer and earn">
      <div className="p-4 space-y-4">
        {/* Hero card */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Illustration band */}
          <div className="h-44 bg-gradient-to-b from-sky-200 to-sky-100 relative overflow-hidden">
            {/* Clouds */}
            <div className="absolute top-6 left-8 w-16 h-8 bg-white rounded-full opacity-80" />
            <div className="absolute top-4 right-12 w-12 h-6 bg-white rounded-full opacity-60" />
            <div className="absolute top-10 left-24 w-10 h-5 bg-white rounded-full opacity-50" />
            {/* Coin */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-22 h-22">
              <div className="w-[88px] h-[88px] rounded-full bg-yellow-400 border-4 border-yellow-500 flex items-center justify-center shadow-lg">
                <div className="w-12 h-8 bg-yellow-600 opacity-50" style={{ clipPath: 'polygon(20% 100%, 50% 30%, 80% 100%)' }} />
              </div>
            </div>
            {/* Hand stub */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-10 bg-orange-400 rounded-t-full" />
          </div>

          {/* Content */}
          <div className="p-5">
            <h2 className="text-xl font-extrabold text-gray-900 mb-2">
              Get Mobile11 Money for each referral
            </h2>
            <p className="text-[15px] text-gray-700 mb-5">
              Friends get {reward} off their first purchase — you get {reward} when they use your code.
            </p>

            {/* Code box */}
            <button
              onClick={handleCopy}
              className="w-full border border-gray-300 rounded-2xl p-4 flex items-center justify-between mb-4"
            >
              <div className="text-left">
                <p className="text-xs text-gray-500 mb-0.5">Your referral code</p>
                <p className="text-lg font-bold tracking-widest text-gray-900">{referralCode}</p>
              </div>
              {copied ? (
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : (
                <Copy className="w-5 h-5 text-gray-400 flex-shrink-0" />
              )}
            </button>

            {/* Share CTA */}
            <button
              onClick={handleShare}
              className="w-full h-12 rounded-full bg-orange-500 hover:bg-orange-600 text-gray-900 font-bold text-[15px] transition-colors"
            >
              Share my code
            </button>
          </div>
        </div>

        {/* Progress card */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="text-[17px] font-bold text-gray-900 mb-3">Your progress</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
              <span className="text-[15px] text-gray-700">Total earned</span>
              <span className="text-[15px] font-bold text-gray-900">{formatPrice(0)}</span>
            </div>
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
              <span className="text-[15px] text-gray-700">Referrals made</span>
              <span className="text-[15px] font-bold text-gray-900">0</span>
            </div>
          </div>

          <button
            onClick={() => setShowHowItWorks(true)}
            className="w-full h-12 rounded-full bg-white border border-gray-300 text-gray-900 font-semibold text-[15px] mt-4"
          >
            How referrals work
          </button>
        </div>
      </div>

      <HowReferralsWorkSheet
        open={showHowItWorks}
        onClose={() => setShowHowItWorks(false)}
        onShare={handleShare}
      />
    </MobileMenuShell>
  );
};
