import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// SEM China series
import semChinaApps from "@/assets/blog/thai/sem-china-apps.jpg";
import semChinaEsimInstall from "@/assets/blog/thai/sem-china-esim-install.jpg";
import semChinaNavigation from "@/assets/blog/thai/sem-china-navigation.jpg";
import semChinaPayment from "@/assets/blog/thai/sem-china-payment.jpg";
import semChinaPrepHero from "@/assets/blog/thai/sem-china-prep-hero.jpg";

// SEM First Japan series
import semFirstJapanArrival from "@/assets/blog/thai/sem-first-japan-arrival.jpg";
import semFirstJapanFood from "@/assets/blog/thai/sem-first-japan-food.jpg";
import semFirstJapanHero from "@/assets/blog/thai/sem-first-japan-hero.jpg";
import semFirstJapanJrpass from "@/assets/blog/thai/sem-first-japan-jrpass.jpg";
import semFirstJapanTranslate from "@/assets/blog/thai/sem-first-japan-translate.jpg";

// SEM Japan series
import semJapanCulture from "@/assets/blog/thai/sem-japan-culture.jpg";
import semJapanDocuments from "@/assets/blog/thai/sem-japan-documents.jpg";
import semJapanNavigation from "@/assets/blog/thai/sem-japan-navigation.jpg";
import semJapanPrepHero from "@/assets/blog/thai/sem-japan-prep-hero.jpg";
import semJapanTransport from "@/assets/blog/thai/sem-japan-transport.jpg";

// SEM Mobile11 series
import semMobile11BenefitsHero from "@/assets/blog/thai/sem-mobile11-benefits-hero.jpg";
import semMobile11Global from "@/assets/blog/thai/sem-mobile11-global.jpg";
import semMobile11Install from "@/assets/blog/thai/sem-mobile11-install.jpg";
import semMobile11Price from "@/assets/blog/thai/sem-mobile11-price.jpg";
import semMobile11Unlimited from "@/assets/blog/thai/sem-mobile11-unlimited.jpg";

// SEM Self Plan series
import semSelfPlanAttractions from "@/assets/blog/thai/sem-self-plan-attractions.jpg";
import semSelfPlanBooking from "@/assets/blog/thai/sem-self-plan-booking.jpg";
import semSelfPlanEsim from "@/assets/blog/thai/sem-self-plan-esim.jpg";
import semSelfPlanItinerary from "@/assets/blog/thai/sem-self-plan-itinerary.jpg";
import semSelfPlanJapanHero from "@/assets/blog/thai/sem-self-plan-japan-hero.jpg";

// Thai blog images
import thaiAirportEsim from "@/assets/blog/thai/thai-airport-esim.jpg";
import thaiAsiaDestinations from "@/assets/blog/thai/thai-asia-destinations.jpg";
import thaiCarrierLogos from "@/assets/blog/thai/thai-carrier-logos.jpg";
import thaiCoupleSensojiTemple from "@/assets/blog/thai/thai-couple-sensoji-temple.jpg";
import thaiDestinationsHero from "@/assets/blog/thai/thai-destinations-hero.jpg";
import thaiDualSim from "@/assets/blog/thai/thai-dual-sim.jpg";
import thaiEsimActivationAirport from "@/assets/blog/thai/thai-esim-activation-airport.jpg";
import thaiEsimGuideHero from "@/assets/blog/thai/thai-esim-guide-hero.jpg";
import thaiEsimInstallation from "@/assets/blog/thai/thai-esim-installation.jpg";
import thaiEsimSmartphones from "@/assets/blog/thai/thai-esim-smartphones.jpg";
import thaiEsimVsSim from "@/assets/blog/thai/thai-esim-vs-sim.jpg";
import thaiEuropeDestinations from "@/assets/blog/thai/thai-europe-destinations.jpg";
import thaiGlobalConnectivityMap from "@/assets/blog/thai/thai-global-connectivity-map.jpg";
import thaiJapanCarriers from "@/assets/blog/thai/thai-japan-carriers.jpg";
import thaiJapanDigitalNomad from "@/assets/blog/thai/thai-japan-digital-nomad.jpg";
import thaiJapanFoodTranslate from "@/assets/blog/thai/thai-japan-food-translate.jpg";
import thaiJapanSimHero from "@/assets/blog/thai/thai-japan-sim-hero.jpg";
import thaiPriceComparison from "@/assets/blog/thai/thai-price-comparison.jpg";
import thaiRoamingVsEsimHero from "@/assets/blog/thai/thai-roaming-vs-esim-hero.jpg";
import thaiSeaDestinations from "@/assets/blog/thai/thai-sea-destinations.jpg";
import thaiShinkansenTraveler from "@/assets/blog/thai/thai-shinkansen-traveler.jpg";
import thaiTravelerAbroad from "@/assets/blog/thai/thai-traveler-abroad.jpg";
import thaiTravelerTokyoNavigation from "@/assets/blog/thai/thai-traveler-tokyo-navigation.jpg";
import thaiTravelersGroup from "@/assets/blog/thai/thai-travelers-group.jpg";

interface AssetItem {
  id: string;
  name: string;
  localPath: string;
  storagePath: string;
  contentType: string;
}

interface MigrationStatus {
  status: 'pending' | 'uploading' | 'success' | 'error';
  publicUrl?: string;
  error?: string;
}

const assetsToMigrate: AssetItem[] = [
  // SEM China series
  { id: 'sem-china-apps', name: 'SEM China Apps', localPath: semChinaApps, storagePath: 'blog/thai/sem-china-apps.jpg', contentType: 'image/jpeg' },
  { id: 'sem-china-esim-install', name: 'SEM China eSIM Install', localPath: semChinaEsimInstall, storagePath: 'blog/thai/sem-china-esim-install.jpg', contentType: 'image/jpeg' },
  { id: 'sem-china-navigation', name: 'SEM China Navigation', localPath: semChinaNavigation, storagePath: 'blog/thai/sem-china-navigation.jpg', contentType: 'image/jpeg' },
  { id: 'sem-china-payment', name: 'SEM China Payment', localPath: semChinaPayment, storagePath: 'blog/thai/sem-china-payment.jpg', contentType: 'image/jpeg' },
  { id: 'sem-china-prep-hero', name: 'SEM China Prep Hero', localPath: semChinaPrepHero, storagePath: 'blog/thai/sem-china-prep-hero.jpg', contentType: 'image/jpeg' },
  
  // SEM First Japan series
  { id: 'sem-first-japan-arrival', name: 'SEM First Japan Arrival', localPath: semFirstJapanArrival, storagePath: 'blog/thai/sem-first-japan-arrival.jpg', contentType: 'image/jpeg' },
  { id: 'sem-first-japan-food', name: 'SEM First Japan Food', localPath: semFirstJapanFood, storagePath: 'blog/thai/sem-first-japan-food.jpg', contentType: 'image/jpeg' },
  { id: 'sem-first-japan-hero', name: 'SEM First Japan Hero', localPath: semFirstJapanHero, storagePath: 'blog/thai/sem-first-japan-hero.jpg', contentType: 'image/jpeg' },
  { id: 'sem-first-japan-jrpass', name: 'SEM First Japan JR Pass', localPath: semFirstJapanJrpass, storagePath: 'blog/thai/sem-first-japan-jrpass.jpg', contentType: 'image/jpeg' },
  { id: 'sem-first-japan-translate', name: 'SEM First Japan Translate', localPath: semFirstJapanTranslate, storagePath: 'blog/thai/sem-first-japan-translate.jpg', contentType: 'image/jpeg' },
  
  // SEM Japan series
  { id: 'sem-japan-culture', name: 'SEM Japan Culture', localPath: semJapanCulture, storagePath: 'blog/thai/sem-japan-culture.jpg', contentType: 'image/jpeg' },
  { id: 'sem-japan-documents', name: 'SEM Japan Documents', localPath: semJapanDocuments, storagePath: 'blog/thai/sem-japan-documents.jpg', contentType: 'image/jpeg' },
  { id: 'sem-japan-navigation', name: 'SEM Japan Navigation', localPath: semJapanNavigation, storagePath: 'blog/thai/sem-japan-navigation.jpg', contentType: 'image/jpeg' },
  { id: 'sem-japan-prep-hero', name: 'SEM Japan Prep Hero', localPath: semJapanPrepHero, storagePath: 'blog/thai/sem-japan-prep-hero.jpg', contentType: 'image/jpeg' },
  { id: 'sem-japan-transport', name: 'SEM Japan Transport', localPath: semJapanTransport, storagePath: 'blog/thai/sem-japan-transport.jpg', contentType: 'image/jpeg' },
  
  // SEM Mobile11 series
  { id: 'sem-mobile11-benefits-hero', name: 'SEM Mobile11 Benefits Hero', localPath: semMobile11BenefitsHero, storagePath: 'blog/thai/sem-mobile11-benefits-hero.jpg', contentType: 'image/jpeg' },
  { id: 'sem-mobile11-global', name: 'SEM Mobile11 Global', localPath: semMobile11Global, storagePath: 'blog/thai/sem-mobile11-global.jpg', contentType: 'image/jpeg' },
  { id: 'sem-mobile11-install', name: 'SEM Mobile11 Install', localPath: semMobile11Install, storagePath: 'blog/thai/sem-mobile11-install.jpg', contentType: 'image/jpeg' },
  { id: 'sem-mobile11-price', name: 'SEM Mobile11 Price', localPath: semMobile11Price, storagePath: 'blog/thai/sem-mobile11-price.jpg', contentType: 'image/jpeg' },
  { id: 'sem-mobile11-unlimited', name: 'SEM Mobile11 Unlimited', localPath: semMobile11Unlimited, storagePath: 'blog/thai/sem-mobile11-unlimited.jpg', contentType: 'image/jpeg' },
  
  // SEM Self Plan series
  { id: 'sem-self-plan-attractions', name: 'SEM Self Plan Attractions', localPath: semSelfPlanAttractions, storagePath: 'blog/thai/sem-self-plan-attractions.jpg', contentType: 'image/jpeg' },
  { id: 'sem-self-plan-booking', name: 'SEM Self Plan Booking', localPath: semSelfPlanBooking, storagePath: 'blog/thai/sem-self-plan-booking.jpg', contentType: 'image/jpeg' },
  { id: 'sem-self-plan-esim', name: 'SEM Self Plan eSIM', localPath: semSelfPlanEsim, storagePath: 'blog/thai/sem-self-plan-esim.jpg', contentType: 'image/jpeg' },
  { id: 'sem-self-plan-itinerary', name: 'SEM Self Plan Itinerary', localPath: semSelfPlanItinerary, storagePath: 'blog/thai/sem-self-plan-itinerary.jpg', contentType: 'image/jpeg' },
  { id: 'sem-self-plan-japan-hero', name: 'SEM Self Plan Japan Hero', localPath: semSelfPlanJapanHero, storagePath: 'blog/thai/sem-self-plan-japan-hero.jpg', contentType: 'image/jpeg' },
  
  // Thai series
  { id: 'thai-airport-esim', name: 'Thai Airport eSIM', localPath: thaiAirportEsim, storagePath: 'blog/thai/thai-airport-esim.jpg', contentType: 'image/jpeg' },
  { id: 'thai-asia-destinations', name: 'Thai Asia Destinations', localPath: thaiAsiaDestinations, storagePath: 'blog/thai/thai-asia-destinations.jpg', contentType: 'image/jpeg' },
  { id: 'thai-carrier-logos', name: 'Thai Carrier Logos', localPath: thaiCarrierLogos, storagePath: 'blog/thai/thai-carrier-logos.jpg', contentType: 'image/jpeg' },
  { id: 'thai-couple-sensoji-temple', name: 'Thai Couple Sensoji Temple', localPath: thaiCoupleSensojiTemple, storagePath: 'blog/thai/thai-couple-sensoji-temple.jpg', contentType: 'image/jpeg' },
  { id: 'thai-destinations-hero', name: 'Thai Destinations Hero', localPath: thaiDestinationsHero, storagePath: 'blog/thai/thai-destinations-hero.jpg', contentType: 'image/jpeg' },
  { id: 'thai-dual-sim', name: 'Thai Dual SIM', localPath: thaiDualSim, storagePath: 'blog/thai/thai-dual-sim.jpg', contentType: 'image/jpeg' },
  { id: 'thai-esim-activation-airport', name: 'Thai eSIM Activation Airport', localPath: thaiEsimActivationAirport, storagePath: 'blog/thai/thai-esim-activation-airport.jpg', contentType: 'image/jpeg' },
  { id: 'thai-esim-guide-hero', name: 'Thai eSIM Guide Hero', localPath: thaiEsimGuideHero, storagePath: 'blog/thai/thai-esim-guide-hero.jpg', contentType: 'image/jpeg' },
  { id: 'thai-esim-installation', name: 'Thai eSIM Installation', localPath: thaiEsimInstallation, storagePath: 'blog/thai/thai-esim-installation.jpg', contentType: 'image/jpeg' },
  { id: 'thai-esim-smartphones', name: 'Thai eSIM Smartphones', localPath: thaiEsimSmartphones, storagePath: 'blog/thai/thai-esim-smartphones.jpg', contentType: 'image/jpeg' },
  { id: 'thai-esim-vs-sim', name: 'Thai eSIM vs SIM', localPath: thaiEsimVsSim, storagePath: 'blog/thai/thai-esim-vs-sim.jpg', contentType: 'image/jpeg' },
  { id: 'thai-europe-destinations', name: 'Thai Europe Destinations', localPath: thaiEuropeDestinations, storagePath: 'blog/thai/thai-europe-destinations.jpg', contentType: 'image/jpeg' },
  { id: 'thai-global-connectivity-map', name: 'Thai Global Connectivity Map', localPath: thaiGlobalConnectivityMap, storagePath: 'blog/thai/thai-global-connectivity-map.jpg', contentType: 'image/jpeg' },
  { id: 'thai-japan-carriers', name: 'Thai Japan Carriers', localPath: thaiJapanCarriers, storagePath: 'blog/thai/thai-japan-carriers.jpg', contentType: 'image/jpeg' },
  { id: 'thai-japan-digital-nomad', name: 'Thai Japan Digital Nomad', localPath: thaiJapanDigitalNomad, storagePath: 'blog/thai/thai-japan-digital-nomad.jpg', contentType: 'image/jpeg' },
  { id: 'thai-japan-food-translate', name: 'Thai Japan Food Translate', localPath: thaiJapanFoodTranslate, storagePath: 'blog/thai/thai-japan-food-translate.jpg', contentType: 'image/jpeg' },
  { id: 'thai-japan-sim-hero', name: 'Thai Japan SIM Hero', localPath: thaiJapanSimHero, storagePath: 'blog/thai/thai-japan-sim-hero.jpg', contentType: 'image/jpeg' },
  { id: 'thai-price-comparison', name: 'Thai Price Comparison', localPath: thaiPriceComparison, storagePath: 'blog/thai/thai-price-comparison.jpg', contentType: 'image/jpeg' },
  { id: 'thai-roaming-vs-esim-hero', name: 'Thai Roaming vs eSIM Hero', localPath: thaiRoamingVsEsimHero, storagePath: 'blog/thai/thai-roaming-vs-esim-hero.jpg', contentType: 'image/jpeg' },
  { id: 'thai-sea-destinations', name: 'Thai SEA Destinations', localPath: thaiSeaDestinations, storagePath: 'blog/thai/thai-sea-destinations.jpg', contentType: 'image/jpeg' },
  { id: 'thai-shinkansen-traveler', name: 'Thai Shinkansen Traveler', localPath: thaiShinkansenTraveler, storagePath: 'blog/thai/thai-shinkansen-traveler.jpg', contentType: 'image/jpeg' },
  { id: 'thai-traveler-abroad', name: 'Thai Traveler Abroad', localPath: thaiTravelerAbroad, storagePath: 'blog/thai/thai-traveler-abroad.jpg', contentType: 'image/jpeg' },
  { id: 'thai-traveler-tokyo-navigation', name: 'Thai Traveler Tokyo Navigation', localPath: thaiTravelerTokyoNavigation, storagePath: 'blog/thai/thai-traveler-tokyo-navigation.jpg', contentType: 'image/jpeg' },
  { id: 'thai-travelers-group', name: 'Thai Travelers Group', localPath: thaiTravelersGroup, storagePath: 'blog/thai/thai-travelers-group.jpg', contentType: 'image/jpeg' },
];

export default function MigrateThaiPage() {
  const [migrationStatus, setMigrationStatus] = useState<Record<string, MigrationStatus>>({});
  const [isMigrating, setIsMigrating] = useState(false);
  const { toast } = useToast();

  const fetchImageAsBase64 = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const migrateAsset = async (asset: AssetItem) => {
    setMigrationStatus(prev => ({
      ...prev,
      [asset.id]: { status: 'uploading' }
    }));

    try {
      const base64Data = await fetchImageAsBase64(asset.localPath);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await supabase.functions.invoke('migrate-assets', {
        body: {
          imageData: base64Data,
          path: asset.storagePath,
          contentType: asset.contentType,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setMigrationStatus(prev => ({
        ...prev,
        [asset.id]: { status: 'success', publicUrl: response.data.publicUrl }
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMigrationStatus(prev => ({
        ...prev,
        [asset.id]: { status: 'error', error: errorMessage }
      }));
    }
  };

  const migrateAll = async () => {
    setIsMigrating(true);
    for (const asset of assetsToMigrate) {
      if (migrationStatus[asset.id]?.status !== 'success') {
        await migrateAsset(asset);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    setIsMigrating(false);
    toast({
      title: "Migration Complete",
      description: `Processed ${assetsToMigrate.length} Thai blog images.`,
    });
  };

  const completedCount = Object.values(migrationStatus).filter(s => s.status === 'success').length;
  const progress = (completedCount / assetsToMigrate.length) * 100;

  const getStatusIcon = (status?: MigrationStatus) => {
    if (!status) return null;
    switch (status.status) {
      case 'uploading': return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link to="/admin/migrate-assets" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Migration Hub
        </Link>
        <h1 className="text-3xl font-bold">Migrate Thai Blog Images</h1>
        <p className="text-muted-foreground mt-2">
          Upload {assetsToMigrate.length} Thai destination images to Supabase Storage
        </p>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Progress: {completedCount} / {assetsToMigrate.length}</p>
              <Progress value={progress} className="w-64 mt-2" />
            </div>
            <Button onClick={migrateAll} disabled={isMigrating}>
              {isMigrating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Migrating...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Migrate All
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-3">
        {assetsToMigrate.map((asset) => {
          const status = migrationStatus[asset.id];
          return (
            <Card key={asset.id} className="overflow-hidden">
              <div className="aspect-video bg-muted relative">
                <img 
                  src={asset.localPath} 
                  alt={asset.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute top-1 right-1">
                  {getStatusIcon(status)}
                </div>
              </div>
              <CardContent className="p-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium truncate">{asset.name}</span>
                  {status?.status === 'success' ? (
                    <Badge variant="outline" className="text-green-600 text-xs px-1">✓</Badge>
                  ) : status?.status === 'error' ? (
                    <Badge variant="destructive" className="text-xs px-1">✗</Badge>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
