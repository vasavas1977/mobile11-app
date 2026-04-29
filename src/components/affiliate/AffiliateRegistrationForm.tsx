import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, User, Globe, FileText, Youtube, Instagram, Twitter, Share2, RefreshCcw } from 'lucide-react';

// Custom social media icons
const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
);

interface SocialChannels {
  facebook: string;
  tiktok: string;
  youtube: string;
  instagram: string;
  twitter: string;
  other: string;
}

interface FormData {
  affiliateCode: string;
  displayName: string;
  socialChannels: SocialChannels;
  acceptTerms: boolean;
}

export function AffiliateRegistrationForm() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    affiliateCode: '',
    displayName: '',
    socialChannels: {
      facebook: '',
      tiktok: '',
      youtube: '',
      instagram: '',
      twitter: '',
      other: '',
    },
    acceptTerms: false,
  });
  const [socialChannelError, setSocialChannelError] = useState(false);

  const handleInputChange = (field: keyof FormData, value: string | boolean | SocialChannels) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'socialChannels') {
      setSocialChannelError(false);
    }
  };

  const handleSocialChannelChange = (platform: keyof SocialChannels, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialChannels: { ...prev.socialChannels, [platform]: value }
    }));
    setSocialChannelError(false);
  };

  const hasAtLeastOneSocialChannel = () => {
    return Object.values(formData.socialChannels).some(value => value.trim() !== '');
  };

  const generateCode = async () => {
    try {
      const { data, error } = await supabase.rpc('generate_affiliate_code');
      if (error) throw error;
      setFormData(prev => ({ ...prev, affiliateCode: data }));
    } catch (error) {
      console.error('Error generating code:', error);
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      setFormData(prev => ({ ...prev, affiliateCode: code }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Error',
        description: t('affiliateRegister.toast.loginRequired'),
        variant: 'destructive',
      });
      return;
    }

    if (!formData.acceptTerms) {
      toast({
        title: 'Error',
        description: t('affiliateRegister.toast.acceptTerms'),
        variant: 'destructive',
      });
      return;
    }

    if (!formData.affiliateCode.trim()) {
      toast({
        title: 'Error',
        description: t('affiliateRegister.toast.enterCode'),
        variant: 'destructive',
      });
      return;
    }

    if (!formData.displayName.trim()) {
      toast({
        title: 'Error',
        description: t('affiliateRegister.form.displayName.validation'),
        variant: 'destructive',
      });
      return;
    }

    if (!hasAtLeastOneSocialChannel()) {
      setSocialChannelError(true);
      toast({
        title: 'Error',
        description: t('affiliateRegister.form.socialChannels.validation'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Store social channels in payment_details for now
      const paymentDetails: Record<string, any> = {
        socialChannels: formData.socialChannels,
        preferredLanguage: language,
      };

      // Find the primary social channel URL for website_url field
      const primaryChannel = Object.entries(formData.socialChannels).find(([_, value]) => value.trim() !== '');
      const primaryUrl = primaryChannel ? primaryChannel[1] : null;

      const { error } = await supabase
        .from('affiliates')
        .insert({
          user_id: user.id,
          affiliate_code: formData.affiliateCode.toUpperCase().trim(),
          company_name: formData.displayName.trim() || null,
          website_url: primaryUrl,
          payment_method: 'other',
          payment_details: paymentDetails,
          affiliate_type: 'affiliate',
          status: 'pending',
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Error',
            description: t('affiliateRegister.toast.codeTaken'),
            variant: 'destructive',
          });
        } else {
          throw error;
        }
        return;
      }

      // Send confirmation email
      try {
        await supabase.functions.invoke('send-affiliate-confirmation', {
          body: {
            email: user.email,
            affiliateCode: formData.affiliateCode.toUpperCase().trim(),
            displayName: formData.displayName.trim() || undefined,
            socialChannels: formData.socialChannels,
            language: language,
          },
        });
        console.log('Affiliate confirmation email sent');
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
      }

      toast({
        title: t('affiliateRegister.toast.successTitle'),
        description: t('affiliateRegister.toast.success'),
      });

      navigate('/affiliate/dashboard');
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({
        title: 'Error',
        description: error.message || t('affiliateRegister.toast.error'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Info Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-1">
          <User className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            {t('affiliateRegister.form.affiliateInfo.title')}
          </h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          {t('affiliateRegister.form.affiliateInfo.description')}
        </p>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="affiliateCode" className="text-gray-700">{t('affiliateRegister.form.affiliateCode.label')} *</Label>
            <div className="flex gap-2">
              <Input
                id="affiliateCode"
                placeholder={t('affiliateRegister.form.affiliateCode.placeholder')}
                value={formData.affiliateCode}
                onChange={(e) => handleInputChange('affiliateCode', e.target.value.toUpperCase())}
                maxLength={20}
                className="uppercase bg-white border-gray-200 text-gray-900"
              />
              <Button type="button" variant="outline" onClick={generateCode} className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50">
                <RefreshCcw className="h-4 w-4 mr-1" />
                {t('affiliateRegister.form.affiliateCode.generate')}
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              {t('affiliateRegister.form.affiliateCode.hint')}
            </p>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName" className="flex items-center gap-2 text-gray-700">
              <User className="h-4 w-4" />
              {t('affiliateRegister.form.displayName.label')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="displayName"
              placeholder={t('affiliateRegister.form.displayName.placeholder')}
              value={formData.displayName}
              onChange={(e) => handleInputChange('displayName', e.target.value)}
              className="bg-white border-gray-200 text-gray-900"
            />
            <p className="text-sm text-gray-500">
              {t('affiliateRegister.form.displayName.hint')}
            </p>
          </div>
        </div>
      </div>

      {/* Social Channels Card */}
      <div className={`bg-white rounded-2xl shadow-sm border p-6 ${socialChannelError ? 'border-red-300' : 'border-gray-100'}`}>
        <div className="flex items-center gap-2 mb-1">
          <Share2 className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            {t('affiliateRegister.form.socialChannels.title')}
          </h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          {t('affiliateRegister.form.socialChannels.description')}
        </p>
        <div className="space-y-4">
          {socialChannelError && (
            <p className="text-sm text-red-500 font-medium">
              {t('affiliateRegister.form.socialChannels.validation')}
            </p>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {/* Facebook */}
            <div className="space-y-2">
              <Label htmlFor="facebook" className="flex items-center gap-2 text-gray-700">
                <FacebookIcon className="h-4 w-4 text-[#1877F2]" />
                {t('affiliateRegister.form.socialChannels.facebook.label')}
              </Label>
              <Input
                id="facebook"
                placeholder={t('affiliateRegister.form.socialChannels.facebook.placeholder')}
                value={formData.socialChannels.facebook}
                onChange={(e) => handleSocialChannelChange('facebook', e.target.value)}
                className="bg-white border-gray-200 text-gray-900"
              />
            </div>

            {/* TikTok */}
            <div className="space-y-2">
              <Label htmlFor="tiktok" className="flex items-center gap-2 text-gray-700">
                <TikTokIcon className="h-4 w-4" />
                {t('affiliateRegister.form.socialChannels.tiktok.label')}
              </Label>
              <Input
                id="tiktok"
                placeholder={t('affiliateRegister.form.socialChannels.tiktok.placeholder')}
                value={formData.socialChannels.tiktok}
                onChange={(e) => handleSocialChannelChange('tiktok', e.target.value)}
                className="bg-white border-gray-200 text-gray-900"
              />
            </div>

            {/* YouTube */}
            <div className="space-y-2">
              <Label htmlFor="youtube" className="flex items-center gap-2 text-gray-700">
                <Youtube className="h-4 w-4 text-[#FF0000]" />
                {t('affiliateRegister.form.socialChannels.youtube.label')}
              </Label>
              <Input
                id="youtube"
                placeholder={t('affiliateRegister.form.socialChannels.youtube.placeholder')}
                value={formData.socialChannels.youtube}
                onChange={(e) => handleSocialChannelChange('youtube', e.target.value)}
                className="bg-white border-gray-200 text-gray-900"
              />
            </div>

            {/* Instagram */}
            <div className="space-y-2">
              <Label htmlFor="instagram" className="flex items-center gap-2 text-gray-700">
                <Instagram className="h-4 w-4 text-[#E4405F]" />
                {t('affiliateRegister.form.socialChannels.instagram.label')}
              </Label>
              <Input
                id="instagram"
                placeholder={t('affiliateRegister.form.socialChannels.instagram.placeholder')}
                value={formData.socialChannels.instagram}
                onChange={(e) => handleSocialChannelChange('instagram', e.target.value)}
                className="bg-white border-gray-200 text-gray-900"
              />
            </div>

            {/* Twitter/X */}
            <div className="space-y-2">
              <Label htmlFor="twitter" className="flex items-center gap-2 text-gray-700">
                <Twitter className="h-4 w-4" />
                {t('affiliateRegister.form.socialChannels.twitter.label')}
              </Label>
              <Input
                id="twitter"
                placeholder={t('affiliateRegister.form.socialChannels.twitter.placeholder')}
                value={formData.socialChannels.twitter}
                onChange={(e) => handleSocialChannelChange('twitter', e.target.value)}
                className="bg-white border-gray-200 text-gray-900"
              />
            </div>

            {/* Other */}
            <div className="space-y-2">
              <Label htmlFor="other" className="flex items-center gap-2 text-gray-700">
                <Globe className="h-4 w-4 text-gray-500" />
                {t('affiliateRegister.form.socialChannels.other.label')}
              </Label>
              <Input
                id="other"
                placeholder={t('affiliateRegister.form.socialChannels.other.placeholder')}
                value={formData.socialChannels.other}
                onChange={(e) => handleSocialChannelChange('other', e.target.value)}
                className="bg-white border-gray-200 text-gray-900"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Terms Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            {t('affiliateRegister.form.terms.title')}
          </h3>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600 space-y-2">
            <p>{t('affiliateRegister.form.terms.intro')}</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>{t('affiliateRegister.form.terms.rule1')}</li>
              <li>{t('affiliateRegister.form.terms.rule2')}</li>
              <li>{t('affiliateRegister.form.terms.rule3')}</li>
              <li>{t('affiliateRegister.form.terms.rule4')}</li>
              <li>{t('affiliateRegister.form.terms.rule5')}</li>
              <li>{t('affiliateRegister.form.terms.rule6')}</li>
            </ul>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="acceptTerms"
              checked={formData.acceptTerms}
              onCheckedChange={(checked) => handleInputChange('acceptTerms', checked as boolean)}
              className="border-gray-300"
            />
            <Label htmlFor="acceptTerms" className="text-sm cursor-pointer text-gray-700">
              {t('affiliateRegister.form.terms.accept')}
            </Label>
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl" size="lg" disabled={loading || !formData.acceptTerms}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('affiliateRegister.form.submitting')}
          </>
        ) : (
          t('affiliateRegister.form.submit')
        )}
      </Button>
    </form>
  );
}
