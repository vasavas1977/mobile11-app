import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { FooterAiralo } from '@/components/landing/FooterAiralo';
import { useAuth } from '@/hooks/useAuth';
import { useAffiliateCheck } from '@/hooks/useAffiliateCheck';
import { useLanguage } from '@/contexts/LanguageContext';
import { AffiliateRegistrationForm } from '@/components/affiliate/AffiliateRegistrationForm';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Users, DollarSign, Link, TrendingUp } from 'lucide-react';

export default function AffiliateRegisterPage() {
  const { user, loading: authLoading } = useAuth();
  const { isAffiliate, status, loading: affiliateLoading } = useAffiliateCheck();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { tab: 'signin' } }));
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!affiliateLoading && isAffiliate) {
      navigate('/affiliate/dashboard');
    }
  }, [isAffiliate, affiliateLoading, navigate]);

  if (authLoading || affiliateLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const benefits = [
    {
      icon: DollarSign,
      title: t('affiliateRegister.benefits.commission.title'),
      description: t('affiliateRegister.benefits.commission.description'),
    },
    {
      icon: Link,
      title: t('affiliateRegister.benefits.tracking.title'),
      description: t('affiliateRegister.benefits.tracking.description'),
    },
    {
      icon: TrendingUp,
      title: t('affiliateRegister.benefits.stats.title'),
      description: t('affiliateRegister.benefits.stats.description'),
    },
    {
      icon: Users,
      title: t('affiliateRegister.benefits.team.title'),
      description: t('affiliateRegister.benefits.team.description'),
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <Header />
      
      <main className="container py-8 md:py-12">
        {/* Hero Section */}
        <div className="text-center space-y-4 mb-12 pt-4">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900">
            {t('affiliateRegister.hero.title')}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('affiliateRegister.hero.description')}
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid gap-4 md:grid-cols-4 mb-12">
          {benefits.map((benefit, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
              <benefit.icon className="h-10 w-10 text-orange-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900">{benefit.title}</h3>
              <p className="text-sm text-gray-600">{benefit.description}</p>
            </div>
          ))}
        </div>

        {/* Registration Form - Only show if user is logged in */}
        {user ? (
          <div className="max-w-2xl mx-auto">
            <AffiliateRegistrationForm />
          </div>
        ) : (
          <div className="max-w-md mx-auto text-center bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <Users className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t('affiliateRegister.loginRequired.title') || 'Sign in to continue'}
            </h3>
            <p className="text-gray-600 mb-6">
              {t('affiliateRegister.loginRequired.description') || 'Please sign in or create an account to register as an affiliate partner.'}
            </p>
          </div>
        )}
      </main>

      <FooterAiralo />
    </div>
  );
}