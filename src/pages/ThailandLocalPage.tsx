import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { FooterAiralo } from '@/components/landing/FooterAiralo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { SEO, SEO_CONFIG } from '@/components/SEO';
import { 
  Zap, 
  Globe, 
  Shield, 
  Clock,
  CheckCircle2,
  XCircle,
  Smartphone,
  TrendingUp,
  Users,
  Briefcase,
  Gamepad2,
  Truck,
  GraduationCap,
  Check
} from 'lucide-react';
import heroImage from '@/assets/thailand-local-hero.jpg';

interface SpeedTierPackage {
  id: string;
  name: string;
  validity_days: number;
  price: number;
  qos_speed: string;
}

interface TierPricing {
  minPrice: number;
  packages: SpeedTierPackage[];
}

export function ThailandLocalPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [fastTierPricing, setFastTierPricing] = useState<TierPricing>({ minPrice: 0, packages: [] });
  const [goodTierPricing, setGoodTierPricing] = useState<TierPricing>({ minPrice: 0, packages: [] });
  const [workTierPricing, setWorkTierPricing] = useState<TierPricing>({ minPrice: 0, packages: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTierPricing();
  }, []);

  const fetchTierPricing = async () => {
    try {
      setLoading(true);

      // Fetch Fast Tier (5Mbps) - Limitless packages
      const { data: fastData } = await supabase
        .from('esim_packages')
        .select('id, name, validity_days, price, qos_speed')
        .eq('country_name', 'Thailand')
        .eq('qos_speed', '5Mbps')
        .eq('is_active', true)
        .order('price', { ascending: true });

      // Fetch Good Tier (1Mbps) - Day Pass packages
      const { data: goodData } = await supabase
        .from('esim_packages')
        .select('id, name, validity_days, price, qos_speed')
        .eq('country_name', 'Thailand')
        .eq('package_type', 'day_pass')
        .eq('qos_speed', '1Mbps')
        .eq('is_active', true)
        .order('price', { ascending: true });

      // Fetch Work Tier (384kbps) - Day Pass packages
      const { data: workData } = await supabase
        .from('esim_packages')
        .select('id, name, validity_days, price, qos_speed')
        .eq('country_name', 'Thailand')
        .eq('package_type', 'day_pass')
        .eq('qos_speed', '384kbps')
        .eq('is_active', true)
        .order('price', { ascending: true });

      setFastTierPricing({
        minPrice: fastData && fastData.length > 0 ? fastData[0].price : 0,
        packages: fastData || []
      });

      setGoodTierPricing({
        minPrice: goodData && goodData.length > 0 ? goodData[0].price : 0,
        packages: goodData || []
      });

      setWorkTierPricing({
        minPrice: workData && workData.length > 0 ? workData[0].price : 0,
        packages: workData || []
      });

    } catch (error) {
      console.error('Error fetching tier pricing:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (usdPrice: number) => {
    const thbPrice = usdPrice * 35; // USD to THB conversion
    return `฿${Math.round(thbPrice)}`;
  };

  const navigateToTier = (speed: string) => {
    navigate(`/packages?country=Thailand&speed=${speed}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <FooterAiralo />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={SEO_CONFIG.thailand.title}
        description={SEO_CONFIG.thailand.description}
        keywords={SEO_CONFIG.thailand.keywords}
        canonical="https://mobile11.com/thailand-local"
        alternateLanguages={[
          { lang: 'en', url: 'https://mobile11.com/thailand-local?lang=en' },
          { lang: 'th', url: 'https://mobile11.com/thailand-local?lang=th' }
        ]}
      />
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage}
            alt="Thailand Local Hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/30" />
        </div>

        {/* Animated decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-[120px] animate-pulse delay-1000" />

        <div className="container relative z-10 py-20">
          <div className="max-w-3xl">
            <div className="inline-block px-4 py-2 mb-6 bg-primary/10 backdrop-blur-sm border border-primary/20 rounded-full">
              <span className="text-primary font-medium">{t('thailandLocal.hero.badge')}</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent pt-3 break-words">
              {t('thailandLocal.hero.title')}
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-4 break-words">
              {t('thailandLocal.hero.subtitle')}
            </p>
            
            <p className="text-base md:text-lg text-muted-foreground/80 mb-8 break-words">
              {t('thailandLocal.hero.description')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 bg-primary hover:bg-primary/90"
                onClick={() => navigate('/packages?country=Thailand')}
              >
                {t('thailandLocal.hero.cta')}
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 py-6 backdrop-blur-sm"
                onClick={() => navigate('/packages?country=Thailand')}
              >
                {t('thailandLocal.hero.ctaSecondary')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Three Speed Tiers Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/20">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent pt-3 break-words">
              {t('thailandLocal.hero.subtitle')}
            </h2>
            <p className="text-lg text-muted-foreground break-words">
              {t('thailandLocal.hero.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
            {/* Fast Tier (5Mbps) */}
            <Card className="relative overflow-hidden border-2 hover:border-orange-500/50 transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 opacity-50 group-hover:opacity-100 transition-opacity" />
              <CardContent className="relative p-6 md:p-8">
                <div className="text-4xl mb-4">🚀</div>
                <h3 className="text-2xl font-bold mb-2 break-words">{t('thailandLocal.tiers.fast.name')}</h3>
                <div className="text-sm text-muted-foreground mb-4">{t('thailandLocal.tiers.fast.speed')}</div>
                <p className="text-base font-semibold text-orange-600 dark:text-orange-400 mb-3 break-words">
                  {t('thailandLocal.tiers.fast.tagline')}
                </p>
                <p className="text-sm text-muted-foreground mb-4 break-words">
                  {t('thailandLocal.tiers.fast.description')}
                </p>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-sm text-muted-foreground">{t('thailandLocal.tiers.startingFrom')}</span>
                  <span className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                    {formatPrice(fastTierPricing.minPrice)}
                  </span>
                  <span className="text-sm text-muted-foreground">/วัน</span>
                </div>
                <div className="space-y-2 mb-6 text-sm">
                  {t('thailandLocal.tiers.fast.useCases').split(' • ').map((useCase: string, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-orange-500" />
                      <span className="break-words">{useCase}</span>
                    </div>
                  ))}
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  onClick={() => navigateToTier('5Mbps')}
                >
                  {t('thailandLocal.tiers.selectPackage')}
                </Button>
              </CardContent>
            </Card>

            {/* Good Tier (1Mbps) - Most Popular */}
            <Card className="relative overflow-hidden border-2 border-green-500/50 hover:border-green-500 transition-all duration-300 group shadow-xl scale-105">
              <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold z-10">
                {t('thailandLocal.tiers.good.badge')}
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 opacity-70 group-hover:opacity-100 transition-opacity" />
              <CardContent className="relative p-6 md:p-8">
                <div className="text-4xl mb-4">⭐</div>
                <h3 className="text-2xl font-bold mb-2 break-words">{t('thailandLocal.tiers.good.name')}</h3>
                <div className="text-sm text-muted-foreground mb-4">{t('thailandLocal.tiers.good.speed')}</div>
                <p className="text-base font-semibold text-green-600 dark:text-green-400 mb-3 break-words">
                  {t('thailandLocal.tiers.good.tagline')}
                </p>
                <p className="text-sm text-muted-foreground mb-4 break-words">
                  {t('thailandLocal.tiers.good.description')}
                </p>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-sm text-muted-foreground">{t('thailandLocal.tiers.startingFrom')}</span>
                  <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {formatPrice(goodTierPricing.minPrice)}
                  </span>
                  <span className="text-sm text-muted-foreground">/วัน</span>
                </div>
                <div className="space-y-2 mb-6 text-sm">
                  {t('thailandLocal.tiers.good.useCases').split(' • ').map((useCase: string, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="break-words">{useCase}</span>
                    </div>
                  ))}
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  onClick={() => navigateToTier('1Mbps')}
                >
                  {t('thailandLocal.tiers.selectPackage')}
                </Button>
              </CardContent>
            </Card>

            {/* Work Tier (384kbps) */}
            <Card className="relative overflow-hidden border-2 hover:border-blue-500/50 transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-50 group-hover:opacity-100 transition-opacity" />
              <CardContent className="relative p-6 md:p-8">
                <div className="text-4xl mb-4">💼</div>
                <h3 className="text-2xl font-bold mb-2 break-words">{t('thailandLocal.tiers.work.name')}</h3>
                <div className="text-sm text-muted-foreground mb-4">{t('thailandLocal.tiers.work.speed')}</div>
                <p className="text-base font-semibold text-blue-600 dark:text-blue-400 mb-3 break-words">
                  {t('thailandLocal.tiers.work.tagline')}
                </p>
                <p className="text-sm text-muted-foreground mb-4 break-words">
                  {t('thailandLocal.tiers.work.description')}
                </p>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-sm text-muted-foreground">{t('thailandLocal.tiers.startingFrom')}</span>
                  <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {formatPrice(workTierPricing.minPrice)}
                  </span>
                  <span className="text-sm text-muted-foreground">/วัน</span>
                </div>
                <div className="space-y-2 mb-6 text-sm">
                  {t('thailandLocal.tiers.work.useCases').split(' • ').map((useCase: string, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-500" />
                      <span className="break-words">{useCase}</span>
                    </div>
                  ))}
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                  onClick={() => navigateToTier('384kbps')}
                >
                  {t('thailandLocal.tiers.selectPackage')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Speed Comparison Table */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="container max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 break-words">{t('thailandLocal.speedComparison.title')}</h2>
            <p className="text-lg text-muted-foreground break-words">{t('thailandLocal.speedComparison.subtitle')}</p>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-4 text-left font-semibold">Activity</th>
                    <th className="p-4 text-center font-semibold">
                      <div className="break-words">โปรแรงไม่อั้น</div>
                      <div className="text-xs font-normal text-muted-foreground">5Mbps</div>
                    </th>
                    <th className="p-4 text-center font-semibold">
                      <div className="break-words">โปรดีไม่อั้น</div>
                      <div className="text-xs font-normal text-muted-foreground">1Mbps</div>
                    </th>
                    <th className="p-4 text-center font-semibold">
                      <div className="break-words">โปรงานไม่อั้น</div>
                      <div className="text-xs font-normal text-muted-foreground">384kbps</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="p-4 break-words">{t('thailandLocal.speedComparison.activities.hdStreaming')}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <span className="text-sm break-words">{t('thailandLocal.speedComparison.ratings.excellent')}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-yellow-500" />
                        <span className="text-sm break-words">{t('thailandLocal.speedComparison.ratings.sdOnly')}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-t bg-muted/30">
                    <td className="p-4 break-words">{t('thailandLocal.speedComparison.activities.gaming')}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <span className="text-sm break-words">{t('thailandLocal.speedComparison.ratings.excellent')}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-yellow-500" />
                        <span className="text-sm break-words">{t('thailandLocal.speedComparison.ratings.ok')}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-t">
                    <td className="p-4 break-words">{t('thailandLocal.speedComparison.activities.socialMedia')}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <span className="text-sm break-words">{t('thailandLocal.speedComparison.ratings.excellent')}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <span className="text-sm break-words">{t('thailandLocal.speedComparison.ratings.good')}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-yellow-500" />
                        <span className="text-sm break-words">{t('thailandLocal.speedComparison.ratings.ok')}</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-t bg-muted/30">
                    <td className="p-4 break-words">{t('thailandLocal.speedComparison.activities.videoCall')}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <span className="text-sm break-words">{t('thailandLocal.speedComparison.ratings.excellent')}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <span className="text-sm break-words">{t('thailandLocal.speedComparison.ratings.good')}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-yellow-500" />
                        <span className="text-sm break-words">{t('thailandLocal.speedComparison.ratings.audioOnly')}</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-t">
                    <td className="p-4 break-words">{t('thailandLocal.speedComparison.activities.emailMaps')}</td>
                    <td className="p-4 text-center">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                    <td className="p-4 text-center">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                    <td className="p-4 text-center">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-t bg-muted/30">
                    <td className="p-4 break-words">{t('thailandLocal.speedComparison.activities.messaging')}</td>
                    <td className="p-4 text-center">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                    <td className="p-4 text-center">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                    <td className="p-4 text-center">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/20">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent pt-3 break-words">
              {t('thailandLocal.useCases.title')}
            </h2>
            <p className="text-lg text-muted-foreground break-words">
              {t('thailandLocal.useCases.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="mb-4 p-3 bg-green-500/10 rounded-full w-fit group-hover:scale-110 transition-transform">
                  <GraduationCap className="h-6 w-6 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2 break-words">{t('thailandLocal.useCases.student.title')}</h3>
                <p className="text-muted-foreground mb-3 break-words">{t('thailandLocal.useCases.student.description')}</p>
                <div className="text-sm font-medium text-green-600 dark:text-green-400 break-words">
                  → {t('thailandLocal.useCases.student.tier')}
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="mb-4 p-3 bg-blue-500/10 rounded-full w-fit group-hover:scale-110 transition-transform">
                  <Briefcase className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2 break-words">{t('thailandLocal.useCases.professional.title')}</h3>
                <p className="text-muted-foreground mb-3 break-words">{t('thailandLocal.useCases.professional.description')}</p>
                <div className="text-sm font-medium text-blue-600 dark:text-blue-400 break-words">
                  → {t('thailandLocal.useCases.professional.tier')}
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="mb-4 p-3 bg-orange-500/10 rounded-full w-fit group-hover:scale-110 transition-transform">
                  <Gamepad2 className="h-6 w-6 text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2 break-words">{t('thailandLocal.useCases.gamer.title')}</h3>
                <p className="text-muted-foreground mb-3 break-words">{t('thailandLocal.useCases.gamer.description')}</p>
                <div className="text-sm font-medium text-orange-600 dark:text-orange-400 break-words">
                  → {t('thailandLocal.useCases.gamer.tier')}
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="mb-4 p-3 bg-blue-500/10 rounded-full w-fit group-hover:scale-110 transition-transform">
                  <Truck className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2 break-words">{t('thailandLocal.useCases.driver.title')}</h3>
                <p className="text-muted-foreground mb-3 break-words">{t('thailandLocal.useCases.driver.description')}</p>
                <div className="text-sm font-medium text-blue-600 dark:text-blue-400 break-words">
                  → {t('thailandLocal.useCases.driver.tier')}
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="mb-4 p-3 bg-green-500/10 rounded-full w-fit group-hover:scale-110 transition-transform">
                  <Users className="h-6 w-6 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2 break-words">{t('thailandLocal.useCases.social.title')}</h3>
                <p className="text-muted-foreground mb-3 break-words">{t('thailandLocal.useCases.social.description')}</p>
                <div className="text-sm font-medium text-green-600 dark:text-green-400 break-words">
                  → {t('thailandLocal.useCases.social.tier')}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 break-words">
              {t('thailandLocal.features.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            <Card className="group hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="mb-4 p-3 bg-primary/10 rounded-full w-fit group-hover:scale-110 transition-transform">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 break-words">{t('thailandLocal.features.instant.title')}</h3>
                <p className="text-muted-foreground break-words">{t('thailandLocal.features.instant.description')}</p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="mb-4 p-3 bg-primary/10 rounded-full w-fit group-hover:scale-110 transition-transform">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 break-words">{t('thailandLocal.features.dualSim.title')}</h3>
                <p className="text-muted-foreground break-words">{t('thailandLocal.features.dualSim.description')}</p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="mb-4 p-3 bg-primary/10 rounded-full w-fit group-hover:scale-110 transition-transform">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 break-words">{t('thailandLocal.features.noContract.title')}</h3>
                <p className="text-muted-foreground break-words">{t('thailandLocal.features.noContract.description')}</p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="mb-4 p-3 bg-primary/10 rounded-full w-fit group-hover:scale-110 transition-transform">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 break-words">{t('thailandLocal.features.network.title')}</h3>
                <p className="text-muted-foreground break-words">{t('thailandLocal.features.network.description')}</p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="mb-4 p-3 bg-primary/10 rounded-full w-fit group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 break-words">{t('thailandLocal.features.savings.title')}</h3>
                <p className="text-muted-foreground break-words">{t('thailandLocal.features.savings.description')}</p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="mb-4 p-3 bg-primary/10 rounded-full w-fit group-hover:scale-110 transition-transform">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 break-words">{t('thailandLocal.features.flexible.title')}</h3>
                <p className="text-muted-foreground break-words">{t('thailandLocal.features.flexible.description')}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/20">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 break-words">
              {t('thailandLocal.howItWorks.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-4xl mx-auto">
            {[1, 2, 3].map((step) => (
              <div key={step} className="text-center">
                <div className="mb-4 mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">{step}</span>
                </div>
                <h3 className="text-xl font-semibold mb-2 break-words">
                  {t(`thailandLocal.howItWorks.step${step}.title`)}
                </h3>
                <p className="text-muted-foreground break-words">
                  {t(`thailandLocal.howItWorks.step${step}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mini FAQ */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="container max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 break-words">
              {t('thailandLocal.faq.title')}
            </h2>
          </div>

          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((num) => (
              <Card key={num}>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2 break-words">
                    {t(`thailandLocal.faq.q${num}.question`)}
                  </h3>
                  <p className="text-muted-foreground break-words">
                    {t(`thailandLocal.faq.q${num}.answer`)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-b from-background to-primary/5">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 break-words">
            {t('thailandLocal.cta.title')}
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto break-words">
            {t('thailandLocal.cta.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6"
              onClick={() => navigate('/packages?country=Thailand')}
            >
              {t('thailandLocal.hero.cta')}
            </Button>
          </div>
        </div>
      </section>

      <FooterAiralo />
    </div>
  );
}
