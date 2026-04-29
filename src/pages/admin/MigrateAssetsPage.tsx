import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Upload, Loader2, ExternalLink, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Import all destination images
import australiaImg from "@/assets/destinations/australia.png";
import chinaImg from "@/assets/destinations/china.png";
import europeImg from "@/assets/destinations/europe.png";
import hongkongMacauImg from "@/assets/destinations/hongkong-macau.png";
import japanImg from "@/assets/destinations/japan.png";
import koreaImg from "@/assets/destinations/korea.png";
import malaysiaImg from "@/assets/destinations/malaysia.png";
import singaporeImg from "@/assets/destinations/singapore.png";
import taiwanImg from "@/assets/destinations/taiwan.png";
import thailandImg from "@/assets/destinations/thailand.png";
import usaImg from "@/assets/destinations/usa.png";
import vietnamImg from "@/assets/destinations/vietnam.png";

// Import HQ building image
import hqBuildingImg from "@/assets/1toall-hq.png";

// Import blog root images
import australiaEsimHero from "@/assets/blog/australia-esim-hero.jpg";
import australiaGreatBarrierReef from "@/assets/blog/australia-great-barrier-reef.jpg";
import australiaMelbourneLaneway from "@/assets/blog/australia-melbourne-laneway.jpg";
import australiaSydneyOpera from "@/assets/blog/australia-sydney-opera.jpg";
import australiaUluru from "@/assets/blog/australia-uluru.jpg";
import chinaEsimHero from "@/assets/blog/china-esim-hero.jpg";
import chinaForbiddenCity from "@/assets/blog/china-forbidden-city.jpg";
import chinaGreatWall from "@/assets/blog/china-great-wall.jpg";
import chinaShanghaBund from "@/assets/blog/china-shanghai-bund.jpg";
import chinaStreetFood from "@/assets/blog/china-street-food.jpg";
import esimEcoFriendly from "@/assets/blog/esim-eco-friendly.jpg";
import esimMultipleProfiles from "@/assets/blog/esim-multiple-profiles.jpg";
import esimTravelerAirport from "@/assets/blog/esim-traveler-airport.jpg";
import esimVsSimComparison from "@/assets/blog/esim-vs-sim-comparison.jpg";
import esimVsSimHero from "@/assets/blog/esim-vs-sim-hero.jpg";
import europe42RankedHero from "@/assets/blog/europe-42-ranked-hero.jpg";
import europeCafeCulture from "@/assets/blog/europe-cafe-culture.jpg";
import europeEsimHero from "@/assets/blog/europe-esim-hero.jpg";
import europeLandmarksMontage from "@/assets/blog/europe-landmarks-montage.jpg";
import europeMediterraneanCoast from "@/assets/blog/europe-mediterranean-coast.jpg";
import europeTrainScenic from "@/assets/blog/europe-train-scenic.jpg";
import franceEiffelTower from "@/assets/blog/france-eiffel-tower.jpg";
import franceEsimHero from "@/assets/blog/france-esim-hero.jpg";
import franceLavenderProvence from "@/assets/blog/france-lavender-provence.jpg";
import franceParisCafe from "@/assets/blog/france-paris-cafe.jpg";
import francePastries from "@/assets/blog/france-pastries.jpg";
import germanyBeerHall from "@/assets/blog/germany-beer-hall.jpg";
import germanyBrandenburgGate from "@/assets/blog/germany-brandenburg-gate.jpg";
import germanyEsimHero from "@/assets/blog/germany-esim-hero.jpg";
import germanyNeuschwanstein from "@/assets/blog/germany-neuschwanstein.jpg";
import germanyTrain from "@/assets/blog/germany-train.jpg";
import hongkongDimSum from "@/assets/blog/hongkong-dim-sum.jpg";
import hongkongEsimHero from "@/assets/blog/hongkong-esim-hero.jpg";
import hongkongPeakTram from "@/assets/blog/hongkong-peak-tram.jpg";
import hongkongTempleStreet from "@/assets/blog/hongkong-temple-street.jpg";
import hongkongVictoriaHarbour from "@/assets/blog/hongkong-victoria-harbour.jpg";
import italyAmalfiCoast from "@/assets/blog/italy-amalfi-coast.jpg";
import italyColosseum from "@/assets/blog/italy-colosseum.jpg";
import italyEsimHero from "@/assets/blog/italy-esim-hero.jpg";
import italyPizza from "@/assets/blog/italy-pizza.jpg";
import italyVeniceCanal from "@/assets/blog/italy-venice-canal.jpg";
import japanEsimHero from "@/assets/blog/japan-esim-hero.jpg";
import japanFoodRamen from "@/assets/blog/japan-food-ramen.jpg";
import japanKyotoFushimi from "@/assets/blog/japan-kyoto-fushimi.jpg";
import japanSakuraNight from "@/assets/blog/japan-sakura-night.jpg";
import japanShinkansen from "@/assets/blog/japan-shinkansen.jpg";
import japanTokyoShibuya from "@/assets/blog/japan-tokyo-shibuya.jpg";
import koreaBbq from "@/assets/blog/korea-bbq.jpg";
import koreaBusanGamcheon from "@/assets/blog/korea-busan-gamcheon.jpg";
import koreaEsimHero from "@/assets/blog/korea-esim-hero.jpg";
import koreaHongdae from "@/assets/blog/korea-hongdae.jpg";
import koreaPalaceHanbok from "@/assets/blog/korea-palace-hanbok.jpg";
import koreaStreetFood from "@/assets/blog/korea-street-food.jpg";
import malaysiaBatuCaves from "@/assets/blog/malaysia-batu-caves.jpg";
import malaysiaEsimHero from "@/assets/blog/malaysia-esim-hero.jpg";
import malaysiaFood from "@/assets/blog/malaysia-food.jpg";
import malaysiaPenangArt from "@/assets/blog/malaysia-penang-art.jpg";
import malaysiaPetronas from "@/assets/blog/malaysia-petronas.jpg";
import netherlandsAmsterdamCanals from "@/assets/blog/netherlands-amsterdam-canals.jpg";
import netherlandsBicycles from "@/assets/blog/netherlands-bicycles.jpg";
import netherlandsCheese from "@/assets/blog/netherlands-cheese.jpg";
import netherlandsEsimHero from "@/assets/blog/netherlands-esim-hero.jpg";
import netherlandsTulips from "@/assets/blog/netherlands-tulips.jpg";
import singaporeChinatown from "@/assets/blog/singapore-chinatown.jpg";
import singaporeEsimHero from "@/assets/blog/singapore-esim-hero.jpg";
import singaporeGardensBay from "@/assets/blog/singapore-gardens-bay.jpg";
import singaporeHawkerFood from "@/assets/blog/singapore-hawker-food.jpg";
import singaporeMarinaBay from "@/assets/blog/singapore-marina-bay.jpg";
import spainAlhambra from "@/assets/blog/spain-alhambra.jpg";
import spainEsimHero from "@/assets/blog/spain-esim-hero.jpg";
import spainFlamenco from "@/assets/blog/spain-flamenco.jpg";
import spainSagradaFamilia from "@/assets/blog/spain-sagrada-familia.jpg";
import spainTapas from "@/assets/blog/spain-tapas.jpg";
import switzerlandEsimHero from "@/assets/blog/switzerland-esim-hero.jpg";
import switzerlandFondue from "@/assets/blog/switzerland-fondue.jpg";
import switzerlandLucerne from "@/assets/blog/switzerland-lucerne.jpg";
import switzerlandMatterhorn from "@/assets/blog/switzerland-matterhorn.jpg";
import switzerlandTrain from "@/assets/blog/switzerland-train.jpg";
import taiwanEsimHero from "@/assets/blog/taiwan-esim-hero.jpg";
import taiwanJiufen from "@/assets/blog/taiwan-jiufen.jpg";
import taiwanNightMarket from "@/assets/blog/taiwan-night-market.jpg";
import taiwanSunMoonLake from "@/assets/blog/taiwan-sun-moon-lake.jpg";
import taiwanTaipei101 from "@/assets/blog/taiwan-taipei-101.jpg";
import ukAfternoonTea from "@/assets/blog/uk-afternoon-tea.jpg";
import ukBigBen from "@/assets/blog/uk-big-ben.jpg";
import ukEsimHero from "@/assets/blog/uk-esim-hero.jpg";
import ukTowerBridge from "@/assets/blog/uk-tower-bridge.jpg";
import ukUnderground from "@/assets/blog/uk-underground.jpg";
import usaEsimHero from "@/assets/blog/usa-esim-hero.jpg";
import usaGoldenGate from "@/assets/blog/usa-golden-gate.jpg";
import usaGrandCanyon from "@/assets/blog/usa-grand-canyon.jpg";
import usaStatueLiberty from "@/assets/blog/usa-statue-liberty.jpg";
import usaTimesSquare from "@/assets/blog/usa-times-square.jpg";
import vietnamEsimHero from "@/assets/blog/vietnam-esim-hero.jpg";
import vietnamHalongBay from "@/assets/blog/vietnam-halong-bay.jpg";
import vietnamHoiAn from "@/assets/blog/vietnam-hoi-an.jpg";
import vietnamMotorbikes from "@/assets/blog/vietnam-motorbikes.jpg";
import vietnamPhoStreet from "@/assets/blog/vietnam-pho-street.jpg";

// Import Europe42 images
import albaniaImg from "@/assets/blog/europe42/albania.jpg";
import andorraImg from "@/assets/blog/europe42/andorra.jpg";
import austriaImg from "@/assets/blog/europe42/austria.jpg";
import belgiumImg from "@/assets/blog/europe42/belgium.jpg";
import bosniaImg from "@/assets/blog/europe42/bosnia.jpg";
import bulgariaImg from "@/assets/blog/europe42/bulgaria.jpg";
import croatiaImg from "@/assets/blog/europe42/croatia.jpg";
import cyprusImg from "@/assets/blog/europe42/cyprus.jpg";
import czechiaImg from "@/assets/blog/europe42/czechia.jpg";
import denmarkImg from "@/assets/blog/europe42/denmark.jpg";
import estoniaImg from "@/assets/blog/europe42/estonia.jpg";
import finlandImg from "@/assets/blog/europe42/finland.jpg";
import gibraltarImg from "@/assets/blog/europe42/gibraltar.jpg";
import greeceImg from "@/assets/blog/europe42/greece.jpg";
import guernseyImg from "@/assets/blog/europe42/guernsey.jpg";
import hungaryImg from "@/assets/blog/europe42/hungary.jpg";
import icelandImg from "@/assets/blog/europe42/iceland.jpg";
import irelandImg from "@/assets/blog/europe42/ireland.jpg";
import isleofmanImg from "@/assets/blog/europe42/isleofman.jpg";
import jerseyImg from "@/assets/blog/europe42/jersey.jpg";
import latviaImg from "@/assets/blog/europe42/latvia.jpg";
import liechtensteinImg from "@/assets/blog/europe42/liechtenstein.jpg";
import lithuaniaImg from "@/assets/blog/europe42/lithuania.jpg";
import luxembourgImg from "@/assets/blog/europe42/luxembourg.jpg";
import maltaImg from "@/assets/blog/europe42/malta.jpg";
import monacoImg from "@/assets/blog/europe42/monaco.jpg";
import montenegroImg from "@/assets/blog/europe42/montenegro.jpg";
import northmacedoniaImg from "@/assets/blog/europe42/northmacedonia.jpg";
import norwayImg from "@/assets/blog/europe42/norway.jpg";
import polandImg from "@/assets/blog/europe42/poland.jpg";
import portugalImg from "@/assets/blog/europe42/portugal.jpg";
import romaniaImg from "@/assets/blog/europe42/romania.jpg";
import sanmarinoImg from "@/assets/blog/europe42/sanmarino.jpg";
import serbiaImg from "@/assets/blog/europe42/serbia.jpg";
import slovakiaImg from "@/assets/blog/europe42/slovakia.jpg";
import sloveniaImg from "@/assets/blog/europe42/slovenia.jpg";
import swedenImg from "@/assets/blog/europe42/sweden.jpg";
import turkeyImg from "@/assets/blog/europe42/turkey.jpg";
import ukraineImg from "@/assets/blog/europe42/ukraine.jpg";
import vaticanImg from "@/assets/blog/europe42/vatican.jpg";

// Import Thai blog images
import semChinaApps from "@/assets/blog/thai/sem-china-apps.jpg";
import semChinaEsimInstall from "@/assets/blog/thai/sem-china-esim-install.jpg";
import semChinaNavigation from "@/assets/blog/thai/sem-china-navigation.jpg";
import semChinaPayment from "@/assets/blog/thai/sem-china-payment.jpg";
import semChinaPrepHero from "@/assets/blog/thai/sem-china-prep-hero.jpg";
import semFirstJapanArrival from "@/assets/blog/thai/sem-first-japan-arrival.jpg";
import semFirstJapanFood from "@/assets/blog/thai/sem-first-japan-food.jpg";
import semFirstJapanHero from "@/assets/blog/thai/sem-first-japan-hero.jpg";
import semFirstJapanJrpass from "@/assets/blog/thai/sem-first-japan-jrpass.jpg";
import semFirstJapanTranslate from "@/assets/blog/thai/sem-first-japan-translate.jpg";
import semJapanCulture from "@/assets/blog/thai/sem-japan-culture.jpg";
import semJapanDocuments from "@/assets/blog/thai/sem-japan-documents.jpg";
import semJapanNavigation from "@/assets/blog/thai/sem-japan-navigation.jpg";
import semJapanPrepHero from "@/assets/blog/thai/sem-japan-prep-hero.jpg";
import semJapanTransport from "@/assets/blog/thai/sem-japan-transport.jpg";
import semMobile11BenefitsHero from "@/assets/blog/thai/sem-mobile11-benefits-hero.jpg";
import semMobile11Global from "@/assets/blog/thai/sem-mobile11-global.jpg";
import semMobile11Install from "@/assets/blog/thai/sem-mobile11-install.jpg";
import semMobile11Price from "@/assets/blog/thai/sem-mobile11-price.jpg";
import semMobile11Unlimited from "@/assets/blog/thai/sem-mobile11-unlimited.jpg";
import semSelfPlanAttractions from "@/assets/blog/thai/sem-self-plan-attractions.jpg";
import semSelfPlanBooking from "@/assets/blog/thai/sem-self-plan-booking.jpg";
import semSelfPlanEsim from "@/assets/blog/thai/sem-self-plan-esim.jpg";
import semSelfPlanItinerary from "@/assets/blog/thai/sem-self-plan-itinerary.jpg";
import semSelfPlanJapanHero from "@/assets/blog/thai/sem-self-plan-japan-hero.jpg";
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
  category: 'destinations' | 'other' | 'blog' | 'europe42' | 'thai';
}

interface MigrationStatus {
  status: 'pending' | 'uploading' | 'success' | 'error';
  publicUrl?: string;
  error?: string;
}

// Define all assets to migrate
const assetsToMigrate: AssetItem[] = [
  // Destinations
  { id: 'australia', name: 'Australia', localPath: australiaImg, storagePath: 'destinations/australia.png', contentType: 'image/png', category: 'destinations' },
  { id: 'china', name: 'China', localPath: chinaImg, storagePath: 'destinations/china.png', contentType: 'image/png', category: 'destinations' },
  { id: 'europe', name: 'Europe', localPath: europeImg, storagePath: 'destinations/europe.png', contentType: 'image/png', category: 'destinations' },
  { id: 'hongkong-macau', name: 'Hong Kong & Macau', localPath: hongkongMacauImg, storagePath: 'destinations/hongkong-macau.png', contentType: 'image/png', category: 'destinations' },
  { id: 'japan', name: 'Japan', localPath: japanImg, storagePath: 'destinations/japan.png', contentType: 'image/png', category: 'destinations' },
  { id: 'korea', name: 'Korea', localPath: koreaImg, storagePath: 'destinations/korea.png', contentType: 'image/png', category: 'destinations' },
  { id: 'malaysia', name: 'Malaysia', localPath: malaysiaImg, storagePath: 'destinations/malaysia.png', contentType: 'image/png', category: 'destinations' },
  { id: 'singapore', name: 'Singapore', localPath: singaporeImg, storagePath: 'destinations/singapore.png', contentType: 'image/png', category: 'destinations' },
  { id: 'taiwan', name: 'Taiwan', localPath: taiwanImg, storagePath: 'destinations/taiwan.png', contentType: 'image/png', category: 'destinations' },
  { id: 'thailand', name: 'Thailand', localPath: thailandImg, storagePath: 'destinations/thailand.png', contentType: 'image/png', category: 'destinations' },
  { id: 'usa', name: 'USA', localPath: usaImg, storagePath: 'destinations/usa.png', contentType: 'image/png', category: 'destinations' },
  { id: 'vietnam', name: 'Vietnam', localPath: vietnamImg, storagePath: 'destinations/vietnam.png', contentType: 'image/png', category: 'destinations' },
  // HQ Building
  { id: '1toall-hq', name: '1toAll HQ Building', localPath: hqBuildingImg, storagePath: 'about/1toall-hq.png', contentType: 'image/png', category: 'other' },
  
  // Blog Root Images (96 images)
  { id: 'australia-esim-hero', name: 'Australia eSIM Hero', localPath: australiaEsimHero, storagePath: 'blog/australia-esim-hero.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'australia-great-barrier-reef', name: 'Great Barrier Reef', localPath: australiaGreatBarrierReef, storagePath: 'blog/australia-great-barrier-reef.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'australia-melbourne-laneway', name: 'Melbourne Laneway', localPath: australiaMelbourneLaneway, storagePath: 'blog/australia-melbourne-laneway.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'australia-sydney-opera', name: 'Sydney Opera', localPath: australiaSydneyOpera, storagePath: 'blog/australia-sydney-opera.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'australia-uluru', name: 'Uluru', localPath: australiaUluru, storagePath: 'blog/australia-uluru.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'china-esim-hero', name: 'China eSIM Hero', localPath: chinaEsimHero, storagePath: 'blog/china-esim-hero.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'china-forbidden-city', name: 'Forbidden City', localPath: chinaForbiddenCity, storagePath: 'blog/china-forbidden-city.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'china-great-wall', name: 'Great Wall', localPath: chinaGreatWall, storagePath: 'blog/china-great-wall.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'china-shanghai-bund', name: 'Shanghai Bund', localPath: chinaShanghaBund, storagePath: 'blog/china-shanghai-bund.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'china-street-food', name: 'China Street Food', localPath: chinaStreetFood, storagePath: 'blog/china-street-food.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'esim-eco-friendly', name: 'eSIM Eco Friendly', localPath: esimEcoFriendly, storagePath: 'blog/esim-eco-friendly.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'esim-multiple-profiles', name: 'eSIM Multiple Profiles', localPath: esimMultipleProfiles, storagePath: 'blog/esim-multiple-profiles.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'esim-traveler-airport', name: 'eSIM Traveler Airport', localPath: esimTravelerAirport, storagePath: 'blog/esim-traveler-airport.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'esim-vs-sim-comparison', name: 'eSIM vs SIM Comparison', localPath: esimVsSimComparison, storagePath: 'blog/esim-vs-sim-comparison.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'esim-vs-sim-hero', name: 'eSIM vs SIM Hero', localPath: esimVsSimHero, storagePath: 'blog/esim-vs-sim-hero.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'europe-42-ranked-hero', name: 'Europe 42 Ranked Hero', localPath: europe42RankedHero, storagePath: 'blog/europe-42-ranked-hero.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'europe-cafe-culture', name: 'Europe Cafe Culture', localPath: europeCafeCulture, storagePath: 'blog/europe-cafe-culture.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'europe-esim-hero', name: 'Europe eSIM Hero', localPath: europeEsimHero, storagePath: 'blog/europe-esim-hero.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'europe-landmarks-montage', name: 'Europe Landmarks', localPath: europeLandmarksMontage, storagePath: 'blog/europe-landmarks-montage.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'europe-mediterranean-coast', name: 'Mediterranean Coast', localPath: europeMediterraneanCoast, storagePath: 'blog/europe-mediterranean-coast.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'europe-train-scenic', name: 'Europe Train Scenic', localPath: europeTrainScenic, storagePath: 'blog/europe-train-scenic.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'france-eiffel-tower', name: 'Eiffel Tower', localPath: franceEiffelTower, storagePath: 'blog/france-eiffel-tower.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'france-esim-hero', name: 'France eSIM Hero', localPath: franceEsimHero, storagePath: 'blog/france-esim-hero.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'france-lavender-provence', name: 'Lavender Provence', localPath: franceLavenderProvence, storagePath: 'blog/france-lavender-provence.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'france-paris-cafe', name: 'Paris Cafe', localPath: franceParisCafe, storagePath: 'blog/france-paris-cafe.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'france-pastries', name: 'France Pastries', localPath: francePastries, storagePath: 'blog/france-pastries.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'germany-beer-hall', name: 'Germany Beer Hall', localPath: germanyBeerHall, storagePath: 'blog/germany-beer-hall.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'germany-brandenburg-gate', name: 'Brandenburg Gate', localPath: germanyBrandenburgGate, storagePath: 'blog/germany-brandenburg-gate.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'germany-esim-hero', name: 'Germany eSIM Hero', localPath: germanyEsimHero, storagePath: 'blog/germany-esim-hero.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'germany-neuschwanstein', name: 'Neuschwanstein Castle', localPath: germanyNeuschwanstein, storagePath: 'blog/germany-neuschwanstein.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'germany-train', name: 'Germany Train', localPath: germanyTrain, storagePath: 'blog/germany-train.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'hongkong-dim-sum', name: 'Hong Kong Dim Sum', localPath: hongkongDimSum, storagePath: 'blog/hongkong-dim-sum.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'hongkong-esim-hero', name: 'Hong Kong eSIM Hero', localPath: hongkongEsimHero, storagePath: 'blog/hongkong-esim-hero.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'hongkong-peak-tram', name: 'Peak Tram', localPath: hongkongPeakTram, storagePath: 'blog/hongkong-peak-tram.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'hongkong-temple-street', name: 'Temple Street', localPath: hongkongTempleStreet, storagePath: 'blog/hongkong-temple-street.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'hongkong-victoria-harbour', name: 'Victoria Harbour', localPath: hongkongVictoriaHarbour, storagePath: 'blog/hongkong-victoria-harbour.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'italy-amalfi-coast', name: 'Amalfi Coast', localPath: italyAmalfiCoast, storagePath: 'blog/italy-amalfi-coast.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'italy-colosseum', name: 'Colosseum', localPath: italyColosseum, storagePath: 'blog/italy-colosseum.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'italy-esim-hero', name: 'Italy eSIM Hero', localPath: italyEsimHero, storagePath: 'blog/italy-esim-hero.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'italy-pizza', name: 'Italy Pizza', localPath: italyPizza, storagePath: 'blog/italy-pizza.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'italy-venice-canal', name: 'Venice Canal', localPath: italyVeniceCanal, storagePath: 'blog/italy-venice-canal.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'japan-esim-hero', name: 'Japan eSIM Hero', localPath: japanEsimHero, storagePath: 'blog/japan-esim-hero.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'japan-food-ramen', name: 'Japan Ramen', localPath: japanFoodRamen, storagePath: 'blog/japan-food-ramen.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'japan-kyoto-fushimi', name: 'Kyoto Fushimi', localPath: japanKyotoFushimi, storagePath: 'blog/japan-kyoto-fushimi.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'japan-sakura-night', name: 'Japan Sakura Night', localPath: japanSakuraNight, storagePath: 'blog/japan-sakura-night.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'japan-shinkansen', name: 'Shinkansen', localPath: japanShinkansen, storagePath: 'blog/japan-shinkansen.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'japan-tokyo-shibuya', name: 'Tokyo Shibuya', localPath: japanTokyoShibuya, storagePath: 'blog/japan-tokyo-shibuya.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'korea-bbq', name: 'Korean BBQ', localPath: koreaBbq, storagePath: 'blog/korea-bbq.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'korea-busan-gamcheon', name: 'Busan Gamcheon', localPath: koreaBusanGamcheon, storagePath: 'blog/korea-busan-gamcheon.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'korea-esim-hero', name: 'Korea eSIM Hero', localPath: koreaEsimHero, storagePath: 'blog/korea-esim-hero.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'korea-hongdae', name: 'Hongdae', localPath: koreaHongdae, storagePath: 'blog/korea-hongdae.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'korea-palace-hanbok', name: 'Palace Hanbok', localPath: koreaPalaceHanbok, storagePath: 'blog/korea-palace-hanbok.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'korea-street-food', name: 'Korea Street Food', localPath: koreaStreetFood, storagePath: 'blog/korea-street-food.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'malaysia-batu-caves', name: 'Batu Caves', localPath: malaysiaBatuCaves, storagePath: 'blog/malaysia-batu-caves.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'malaysia-esim-hero', name: 'Malaysia eSIM Hero', localPath: malaysiaEsimHero, storagePath: 'blog/malaysia-esim-hero.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'malaysia-food', name: 'Malaysia Food', localPath: malaysiaFood, storagePath: 'blog/malaysia-food.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'malaysia-penang-art', name: 'Penang Art', localPath: malaysiaPenangArt, storagePath: 'blog/malaysia-penang-art.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'malaysia-petronas', name: 'Petronas Towers', localPath: malaysiaPetronas, storagePath: 'blog/malaysia-petronas.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'netherlands-amsterdam-canals', name: 'Amsterdam Canals', localPath: netherlandsAmsterdamCanals, storagePath: 'blog/netherlands-amsterdam-canals.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'netherlands-bicycles', name: 'Netherlands Bicycles', localPath: netherlandsBicycles, storagePath: 'blog/netherlands-bicycles.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'netherlands-cheese', name: 'Netherlands Cheese', localPath: netherlandsCheese, storagePath: 'blog/netherlands-cheese.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'netherlands-esim-hero', name: 'Netherlands eSIM Hero', localPath: netherlandsEsimHero, storagePath: 'blog/netherlands-esim-hero.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'netherlands-tulips', name: 'Netherlands Tulips', localPath: netherlandsTulips, storagePath: 'blog/netherlands-tulips.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'singapore-chinatown', name: 'Singapore Chinatown', localPath: singaporeChinatown, storagePath: 'blog/singapore-chinatown.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'singapore-esim-hero', name: 'Singapore eSIM Hero', localPath: singaporeEsimHero, storagePath: 'blog/singapore-esim-hero.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'singapore-gardens-bay', name: 'Gardens by the Bay', localPath: singaporeGardensBay, storagePath: 'blog/singapore-gardens-bay.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'singapore-hawker-food', name: 'Hawker Food', localPath: singaporeHawkerFood, storagePath: 'blog/singapore-hawker-food.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'singapore-marina-bay', name: 'Marina Bay', localPath: singaporeMarinaBay, storagePath: 'blog/singapore-marina-bay.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'spain-alhambra', name: 'Alhambra', localPath: spainAlhambra, storagePath: 'blog/spain-alhambra.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'spain-esim-hero', name: 'Spain eSIM Hero', localPath: spainEsimHero, storagePath: 'blog/spain-esim-hero.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'spain-flamenco', name: 'Flamenco', localPath: spainFlamenco, storagePath: 'blog/spain-flamenco.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'spain-sagrada-familia', name: 'Sagrada Familia', localPath: spainSagradaFamilia, storagePath: 'blog/spain-sagrada-familia.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'spain-tapas', name: 'Spain Tapas', localPath: spainTapas, storagePath: 'blog/spain-tapas.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'switzerland-esim-hero', name: 'Switzerland eSIM Hero', localPath: switzerlandEsimHero, storagePath: 'blog/switzerland-esim-hero.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'switzerland-fondue', name: 'Switzerland Fondue', localPath: switzerlandFondue, storagePath: 'blog/switzerland-fondue.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'switzerland-lucerne', name: 'Lucerne', localPath: switzerlandLucerne, storagePath: 'blog/switzerland-lucerne.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'switzerland-matterhorn', name: 'Matterhorn', localPath: switzerlandMatterhorn, storagePath: 'blog/switzerland-matterhorn.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'switzerland-train', name: 'Switzerland Train', localPath: switzerlandTrain, storagePath: 'blog/switzerland-train.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'taiwan-esim-hero', name: 'Taiwan eSIM Hero', localPath: taiwanEsimHero, storagePath: 'blog/taiwan-esim-hero.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'taiwan-jiufen', name: 'Jiufen', localPath: taiwanJiufen, storagePath: 'blog/taiwan-jiufen.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'taiwan-night-market', name: 'Night Market', localPath: taiwanNightMarket, storagePath: 'blog/taiwan-night-market.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'taiwan-sun-moon-lake', name: 'Sun Moon Lake', localPath: taiwanSunMoonLake, storagePath: 'blog/taiwan-sun-moon-lake.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'taiwan-taipei-101', name: 'Taipei 101', localPath: taiwanTaipei101, storagePath: 'blog/taiwan-taipei-101.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'uk-afternoon-tea', name: 'Afternoon Tea', localPath: ukAfternoonTea, storagePath: 'blog/uk-afternoon-tea.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'uk-big-ben', name: 'Big Ben', localPath: ukBigBen, storagePath: 'blog/uk-big-ben.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'uk-esim-hero', name: 'UK eSIM Hero', localPath: ukEsimHero, storagePath: 'blog/uk-esim-hero.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'uk-tower-bridge', name: 'Tower Bridge', localPath: ukTowerBridge, storagePath: 'blog/uk-tower-bridge.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'uk-underground', name: 'London Underground', localPath: ukUnderground, storagePath: 'blog/uk-underground.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'usa-esim-hero', name: 'USA eSIM Hero', localPath: usaEsimHero, storagePath: 'blog/usa-esim-hero.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'usa-golden-gate', name: 'Golden Gate Bridge', localPath: usaGoldenGate, storagePath: 'blog/usa-golden-gate.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'usa-grand-canyon', name: 'Grand Canyon', localPath: usaGrandCanyon, storagePath: 'blog/usa-grand-canyon.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'usa-statue-liberty', name: 'Statue of Liberty', localPath: usaStatueLiberty, storagePath: 'blog/usa-statue-liberty.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'usa-times-square', name: 'Times Square', localPath: usaTimesSquare, storagePath: 'blog/usa-times-square.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'vietnam-esim-hero', name: 'Vietnam eSIM Hero', localPath: vietnamEsimHero, storagePath: 'blog/vietnam-esim-hero.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'vietnam-halong-bay', name: 'Halong Bay', localPath: vietnamHalongBay, storagePath: 'blog/vietnam-halong-bay.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'vietnam-hoi-an', name: 'Hoi An', localPath: vietnamHoiAn, storagePath: 'blog/vietnam-hoi-an.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'vietnam-motorbikes', name: 'Vietnam Motorbikes', localPath: vietnamMotorbikes, storagePath: 'blog/vietnam-motorbikes.jpg', contentType: 'image/jpeg', category: 'blog' },
  { id: 'vietnam-pho-street', name: 'Pho Street', localPath: vietnamPhoStreet, storagePath: 'blog/vietnam-pho-street.jpg', contentType: 'image/jpeg', category: 'blog' },
  
  // Europe42 Images (40 images)
  { id: 'europe42-albania', name: 'Albania', localPath: albaniaImg, storagePath: 'blog/europe42/albania.jpg', contentType: 'image/jpeg', category: 'europe42' },
  { id: 'europe42-andorra', name: 'Andorra', localPath: andorraImg, storagePath: 'blog/europe42/andorra.jpg', contentType: 'image/jpeg', category: 'europe42' },
  { id: 'europe42-austria', name: 'Austria', localPath: austriaImg, storagePath: 'blog/europe42/austria.jpg', contentType: 'image/jpeg', category: 'europe42' },
  { id: 'europe42-belgium', name: 'Belgium', localPath: belgiumImg, storagePath: 'blog/europe42/belgium.jpg', contentType: 'image/jpeg', category: 'europe42' },
  { id: 'europe42-bosnia', name: 'Bosnia', localPath: bosniaImg, storagePath: 'blog/europe42/bosnia.jpg', contentType: 'image/jpeg', category: 'europe42' },
  { id: 'europe42-bulgaria', name: 'Bulgaria', localPath: bulgariaImg, storagePath: 'blog/europe42/bulgaria.jpg', contentType: 'image/jpeg', category: 'europe42' },
  { id: 'europe42-croatia', name: 'Croatia', localPath: croatiaImg, storagePath: 'blog/europe42/croatia.jpg', contentType: 'image/jpeg', category: 'europe42' },
  { id: 'europe42-cyprus', name: 'Cyprus', localPath: cyprusImg, storagePath: 'blog/europe42/cyprus.jpg', contentType: 'image/jpeg', category: 'europe42' },
  { id: 'europe42-czechia', name: 'Czechia', localPath: czechiaImg, storagePath: 'blog/europe42/czechia.jpg', contentType: 'image/jpeg', category: 'europe42' },
  { id: 'europe42-denmark', name: 'Denmark', localPath: denmarkImg, storagePath: 'blog/europe42/denmark.jpg', contentType: 'image/jpeg', category: 'europe42' },
  { id: 'europe42-estonia', name: 'Estonia', localPath: estoniaImg, storagePath: 'blog/europe42/estonia.jpg', contentType: 'image/jpeg', category: 'europe42' },
  { id: 'europe42-finland', name: 'Finland', localPath: finlandImg, storagePath: 'blog/europe42/finland.jpg', contentType: 'image/jpeg', category: 'europe42' },
  { id: 'europe42-gibraltar', name: 'Gibraltar', localPath: gibraltarImg, storagePath: 'blog/europe42/gibraltar.jpg', contentType: 'image/jpeg', category: 'europe42' },
  { id: 'europe42-greece', name: 'Greece', localPath: greeceImg, storagePath: 'blog/europe42/greece.jpg', contentType: 'image/jpeg', category: 'europe42' },
  { id: 'europe42-guernsey', name: 'Guernsey', localPath: guernseyImg, storagePath: 'blog/europe42/guernsey.jpg', contentType: 'image/jpeg', category: 'europe42' },
  { id: 'europe42-hungary', name: 'Hungary', localPath: hungaryImg, storagePath: 'blog/europe42/hungary.jpg', contentType: 'image/jpeg', category: 'europe42' },
  { id: 'europe42-iceland', name: 'Iceland', localPath: icelandImg, storagePath: 'blog/europe42/iceland.jpg', contentType: 'image/jpeg', category: 'europe42' },
  { id: 'europe42-ireland', name: 'Ireland', localPath: irelandImg, storagePath: 'blog/europe42/ireland.jpg', contentType: 'image/jpeg', category: 'europe42' },
  { id: 'europe42-isleofman', name: 'Isle of Man', localPath: isleofmanImg, storagePath: 'blog/europe42/isleofman.jpg', contentType: 'image/jpeg', category: 'europe42' },
  { id: 'europe42-jersey', name: 'Jersey', localPath: jerseyImg, storagePath: 'blog/europe42/jersey.jpg', contentType: 'image/jpeg', category: 'europe42' },
  { id: 'europe42-latvia', name: 'Latvia', localPath: latviaImg, storagePath: 'blog/europe42/latvia.jpg', contentType: 'image/jpeg', category: 'europe42' },
  { id: 'europe42-liechtenstein', name: 'Liechtenstein', localPath: liechtensteinImg, storagePath: 'blog/europe42/liechtenstein.jpg', contentType: 'image/jpeg', category: 'europe42' },
  { id: 'europe42-lithuania', name: 'Lithuania', localPath: lithuaniaImg, storagePath: 'blog/europe42/lithuania.jpg', contentType: 'image/jpeg', category: 'europe42' },
  { id: 'europe42-luxembourg', name: 'Luxembourg', localPath: luxembourgImg, storagePath: 'blog/europe42/luxembourg.jpg', contentType: 'image/jpeg', category: 'europe42' },
  { id: 'europe42-malta', name: 'Malta', localPath: maltaImg, storagePath: 'blog/europe42/malta.jpg', contentType: 'image/jpeg', category: 'europe42' },
  { id: 'europe42-monaco', name: 'Monaco', localPath: monacoImg, storagePath: 'blog/europe42/monaco.jpg', contentType: 'image/jpeg', category: 'europe42' },
  { id: 'europe42-montenegro', name: 'Montenegro', localPath: montenegroImg, storagePath: 'blog/europe42/montenegro.jpg', contentType: 'image/jpeg', category: 'europe42' },
  { id: 'europe42-northmacedonia', name: 'North Macedonia', localPath: northmacedoniaImg, storagePath: 'blog/europe42/northmacedonia.jpg', contentType: 'image/jpeg', category: 'europe42' },
  { id: 'europe42-norway', name: 'Norway', localPath: norwayImg, storagePath: 'blog/europe42/norway.jpg', contentType: 'image/jpeg', category: 'europe42' },
  { id: 'europe42-poland', name: 'Poland', localPath: polandImg, storagePath: 'blog/europe42/poland.jpg', contentType: 'image/jpeg', category: 'europe42' },
  { id: 'europe42-portugal', name: 'Portugal', localPath: portugalImg, storagePath: 'blog/europe42/portugal.jpg', contentType: 'image/jpeg', category: 'europe42' },
  { id: 'europe42-romania', name: 'Romania', localPath: romaniaImg, storagePath: 'blog/europe42/romania.jpg', contentType: 'image/jpeg', category: 'europe42' },
  { id: 'europe42-sanmarino', name: 'San Marino', localPath: sanmarinoImg, storagePath: 'blog/europe42/sanmarino.jpg', contentType: 'image/jpeg', category: 'europe42' },
  { id: 'europe42-serbia', name: 'Serbia', localPath: serbiaImg, storagePath: 'blog/europe42/serbia.jpg', contentType: 'image/jpeg', category: 'europe42' },
  { id: 'europe42-slovakia', name: 'Slovakia', localPath: slovakiaImg, storagePath: 'blog/europe42/slovakia.jpg', contentType: 'image/jpeg', category: 'europe42' },
  { id: 'europe42-slovenia', name: 'Slovenia', localPath: sloveniaImg, storagePath: 'blog/europe42/slovenia.jpg', contentType: 'image/jpeg', category: 'europe42' },
  { id: 'europe42-sweden', name: 'Sweden', localPath: swedenImg, storagePath: 'blog/europe42/sweden.jpg', contentType: 'image/jpeg', category: 'europe42' },
  { id: 'europe42-turkey', name: 'Turkey', localPath: turkeyImg, storagePath: 'blog/europe42/turkey.jpg', contentType: 'image/jpeg', category: 'europe42' },
  { id: 'europe42-ukraine', name: 'Ukraine', localPath: ukraineImg, storagePath: 'blog/europe42/ukraine.jpg', contentType: 'image/jpeg', category: 'europe42' },
  { id: 'europe42-vatican', name: 'Vatican', localPath: vaticanImg, storagePath: 'blog/europe42/vatican.jpg', contentType: 'image/jpeg', category: 'europe42' },
  
  // Thai Blog Images (49 images)
  { id: 'thai-sem-china-apps', name: 'China Apps', localPath: semChinaApps, storagePath: 'blog/thai/sem-china-apps.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-sem-china-esim-install', name: 'China eSIM Install', localPath: semChinaEsimInstall, storagePath: 'blog/thai/sem-china-esim-install.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-sem-china-navigation', name: 'China Navigation', localPath: semChinaNavigation, storagePath: 'blog/thai/sem-china-navigation.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-sem-china-payment', name: 'China Payment', localPath: semChinaPayment, storagePath: 'blog/thai/sem-china-payment.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-sem-china-prep-hero', name: 'China Prep Hero', localPath: semChinaPrepHero, storagePath: 'blog/thai/sem-china-prep-hero.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-sem-first-japan-arrival', name: 'First Japan Arrival', localPath: semFirstJapanArrival, storagePath: 'blog/thai/sem-first-japan-arrival.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-sem-first-japan-food', name: 'First Japan Food', localPath: semFirstJapanFood, storagePath: 'blog/thai/sem-first-japan-food.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-sem-first-japan-hero', name: 'First Japan Hero', localPath: semFirstJapanHero, storagePath: 'blog/thai/sem-first-japan-hero.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-sem-first-japan-jrpass', name: 'First Japan JR Pass', localPath: semFirstJapanJrpass, storagePath: 'blog/thai/sem-first-japan-jrpass.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-sem-first-japan-translate', name: 'First Japan Translate', localPath: semFirstJapanTranslate, storagePath: 'blog/thai/sem-first-japan-translate.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-sem-japan-culture', name: 'Japan Culture', localPath: semJapanCulture, storagePath: 'blog/thai/sem-japan-culture.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-sem-japan-documents', name: 'Japan Documents', localPath: semJapanDocuments, storagePath: 'blog/thai/sem-japan-documents.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-sem-japan-navigation', name: 'Japan Navigation', localPath: semJapanNavigation, storagePath: 'blog/thai/sem-japan-navigation.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-sem-japan-prep-hero', name: 'Japan Prep Hero', localPath: semJapanPrepHero, storagePath: 'blog/thai/sem-japan-prep-hero.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-sem-japan-transport', name: 'Japan Transport', localPath: semJapanTransport, storagePath: 'blog/thai/sem-japan-transport.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-sem-mobile11-benefits-hero', name: 'Mobile11 Benefits Hero', localPath: semMobile11BenefitsHero, storagePath: 'blog/thai/sem-mobile11-benefits-hero.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-sem-mobile11-global', name: 'Mobile11 Global', localPath: semMobile11Global, storagePath: 'blog/thai/sem-mobile11-global.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-sem-mobile11-install', name: 'Mobile11 Install', localPath: semMobile11Install, storagePath: 'blog/thai/sem-mobile11-install.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-sem-mobile11-price', name: 'Mobile11 Price', localPath: semMobile11Price, storagePath: 'blog/thai/sem-mobile11-price.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-sem-mobile11-unlimited', name: 'Mobile11 Unlimited', localPath: semMobile11Unlimited, storagePath: 'blog/thai/sem-mobile11-unlimited.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-sem-self-plan-attractions', name: 'Self Plan Attractions', localPath: semSelfPlanAttractions, storagePath: 'blog/thai/sem-self-plan-attractions.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-sem-self-plan-booking', name: 'Self Plan Booking', localPath: semSelfPlanBooking, storagePath: 'blog/thai/sem-self-plan-booking.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-sem-self-plan-esim', name: 'Self Plan eSIM', localPath: semSelfPlanEsim, storagePath: 'blog/thai/sem-self-plan-esim.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-sem-self-plan-itinerary', name: 'Self Plan Itinerary', localPath: semSelfPlanItinerary, storagePath: 'blog/thai/sem-self-plan-itinerary.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-sem-self-plan-japan-hero', name: 'Self Plan Japan Hero', localPath: semSelfPlanJapanHero, storagePath: 'blog/thai/sem-self-plan-japan-hero.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-airport-esim', name: 'Airport eSIM', localPath: thaiAirportEsim, storagePath: 'blog/thai/thai-airport-esim.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-asia-destinations', name: 'Asia Destinations', localPath: thaiAsiaDestinations, storagePath: 'blog/thai/thai-asia-destinations.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-carrier-logos', name: 'Carrier Logos', localPath: thaiCarrierLogos, storagePath: 'blog/thai/thai-carrier-logos.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-couple-sensoji-temple', name: 'Couple Sensoji Temple', localPath: thaiCoupleSensojiTemple, storagePath: 'blog/thai/thai-couple-sensoji-temple.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-destinations-hero', name: 'Destinations Hero', localPath: thaiDestinationsHero, storagePath: 'blog/thai/thai-destinations-hero.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-dual-sim', name: 'Dual SIM', localPath: thaiDualSim, storagePath: 'blog/thai/thai-dual-sim.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-esim-activation-airport', name: 'eSIM Activation Airport', localPath: thaiEsimActivationAirport, storagePath: 'blog/thai/thai-esim-activation-airport.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-esim-guide-hero', name: 'eSIM Guide Hero', localPath: thaiEsimGuideHero, storagePath: 'blog/thai/thai-esim-guide-hero.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-esim-installation', name: 'eSIM Installation', localPath: thaiEsimInstallation, storagePath: 'blog/thai/thai-esim-installation.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-esim-smartphones', name: 'eSIM Smartphones', localPath: thaiEsimSmartphones, storagePath: 'blog/thai/thai-esim-smartphones.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-esim-vs-sim', name: 'eSIM vs SIM', localPath: thaiEsimVsSim, storagePath: 'blog/thai/thai-esim-vs-sim.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-europe-destinations', name: 'Europe Destinations', localPath: thaiEuropeDestinations, storagePath: 'blog/thai/thai-europe-destinations.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-global-connectivity-map', name: 'Global Connectivity Map', localPath: thaiGlobalConnectivityMap, storagePath: 'blog/thai/thai-global-connectivity-map.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-japan-carriers', name: 'Japan Carriers', localPath: thaiJapanCarriers, storagePath: 'blog/thai/thai-japan-carriers.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-japan-digital-nomad', name: 'Japan Digital Nomad', localPath: thaiJapanDigitalNomad, storagePath: 'blog/thai/thai-japan-digital-nomad.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-japan-food-translate', name: 'Japan Food Translate', localPath: thaiJapanFoodTranslate, storagePath: 'blog/thai/thai-japan-food-translate.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-japan-sim-hero', name: 'Japan SIM Hero', localPath: thaiJapanSimHero, storagePath: 'blog/thai/thai-japan-sim-hero.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-price-comparison', name: 'Price Comparison', localPath: thaiPriceComparison, storagePath: 'blog/thai/thai-price-comparison.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-roaming-vs-esim-hero', name: 'Roaming vs eSIM Hero', localPath: thaiRoamingVsEsimHero, storagePath: 'blog/thai/thai-roaming-vs-esim-hero.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-sea-destinations', name: 'SEA Destinations', localPath: thaiSeaDestinations, storagePath: 'blog/thai/thai-sea-destinations.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-shinkansen-traveler', name: 'Shinkansen Traveler', localPath: thaiShinkansenTraveler, storagePath: 'blog/thai/thai-shinkansen-traveler.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-traveler-abroad', name: 'Traveler Abroad', localPath: thaiTravelerAbroad, storagePath: 'blog/thai/thai-traveler-abroad.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-traveler-tokyo-navigation', name: 'Traveler Tokyo Navigation', localPath: thaiTravelerTokyoNavigation, storagePath: 'blog/thai/thai-traveler-tokyo-navigation.jpg', contentType: 'image/jpeg', category: 'thai' },
  { id: 'thai-travelers-group', name: 'Travelers Group', localPath: thaiTravelersGroup, storagePath: 'blog/thai/thai-travelers-group.jpg', contentType: 'image/jpeg', category: 'thai' },
];

export default function MigrateAssetsPage() {
  const { toast } = useToast();
  const [migrationStatus, setMigrationStatus] = useState<Record<string, MigrationStatus>>({});
  const [isMigrating, setIsMigrating] = useState(false);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    destinations: true,
    other: true,
    blog: false,
    europe42: false,
    thai: false,
  });

  const completedCount = Object.values(migrationStatus).filter(s => s.status === 'success').length;
  const errorCount = Object.values(migrationStatus).filter(s => s.status === 'error').length;
  const progress = (completedCount / assetsToMigrate.length) * 100;

  const fetchImageAsBase64 = async (imagePath: string): Promise<string> => {
    const response = await fetch(imagePath);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const migrateAsset = async (asset: AssetItem): Promise<boolean> => {
    setMigrationStatus(prev => ({
      ...prev,
      [asset.id]: { status: 'uploading' }
    }));

    try {
      const imageData = await fetchImageAsBase64(asset.localPath);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `https://jaqyvbjllsanrnpzlyjw.supabase.co/functions/v1/migrate-assets`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            imageData,
            path: asset.storagePath,
            contentType: asset.contentType,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setMigrationStatus(prev => ({
        ...prev,
        [asset.id]: { status: 'success', publicUrl: result.publicUrl }
      }));

      return true;
    } catch (error) {
      console.error(`Error migrating ${asset.name}:`, error);
      setMigrationStatus(prev => ({
        ...prev,
        [asset.id]: { status: 'error', error: (error as Error).message }
      }));
      return false;
    }
  };

  const migrateAll = async () => {
    setIsMigrating(true);
    let successCount = 0;
    let failCount = 0;

    for (const asset of assetsToMigrate) {
      const success = await migrateAsset(asset);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setIsMigrating(false);

    toast({
      title: "Migration Complete",
      description: `${successCount} succeeded, ${failCount} failed`,
      variant: failCount > 0 ? "destructive" : "default",
    });
  };

  const migrateCategory = async (category: AssetItem['category']) => {
    setIsMigrating(true);
    let successCount = 0;
    let failCount = 0;

    const categoryAssets = assetsToMigrate.filter(a => a.category === category);
    
    for (const asset of categoryAssets) {
      const success = await migrateAsset(asset);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setIsMigrating(false);

    toast({
      title: `${category} Migration Complete`,
      description: `${successCount} succeeded, ${failCount} failed`,
      variant: failCount > 0 ? "destructive" : "default",
    });
  };

  const getStatusIcon = (status?: MigrationStatus) => {
    if (!status) return null;
    switch (status.status) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status?: MigrationStatus) => {
    if (!status) return <Badge variant="outline">Pending</Badge>;
    switch (status.status) {
      case 'uploading':
        return <Badge variant="secondary">Uploading...</Badge>;
      case 'success':
        return <Badge className="bg-green-500">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getCategoryStats = (category: AssetItem['category']) => {
    const categoryAssets = assetsToMigrate.filter(a => a.category === category);
    const completed = categoryAssets.filter(a => migrationStatus[a.id]?.status === 'success').length;
    return { total: categoryAssets.length, completed };
  };

  const renderAssetCard = (asset: AssetItem) => (
    <Card key={asset.id} className="p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img 
            src={asset.localPath} 
            alt={asset.name}
            className="w-10 h-10 object-cover rounded flex-shrink-0"
          />
          <div className="min-w-0">
            <div className="font-medium text-sm truncate">{asset.name}</div>
            <div className="text-xs text-muted-foreground truncate">{asset.storagePath}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {getStatusIcon(migrationStatus[asset.id])}
          {getStatusBadge(migrationStatus[asset.id])}
          {migrationStatus[asset.id]?.publicUrl && (
            <a 
              href={migrationStatus[asset.id].publicUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
      {migrationStatus[asset.id]?.error && (
        <div className="mt-2 text-xs text-red-500">
          Error: {migrationStatus[asset.id].error}
        </div>
      )}
    </Card>
  );

  const renderCategory = (
    category: AssetItem['category'], 
    title: string, 
    description?: string
  ) => {
    const stats = getCategoryStats(category);
    const isOpen = openCategories[category];

    return (
      <Collapsible 
        open={isOpen} 
        onOpenChange={(open) => setOpenCategories(prev => ({ ...prev, [category]: open }))}
      >
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {title}
                    <Badge variant="outline">{stats.completed}/{stats.total}</Badge>
                  </CardTitle>
                  {description && (
                    <p className="text-sm text-muted-foreground mt-1">{description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    disabled={isMigrating}
                    onClick={(e) => {
                      e.stopPropagation();
                      migrateCategory(category);
                    }}
                  >
                    Migrate {title}
                  </Button>
                  {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-2">
              {assetsToMigrate
                .filter(a => a.category === category)
                .map(renderAssetCard)}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Migrate Assets to Supabase Storage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Upload all {assetsToMigrate.length} image assets to Supabase Storage. 
              This includes destinations, blog images, and Thai blog content.
            </p>

            <div className="flex items-center gap-4">
              <Button 
                onClick={migrateAll} 
                disabled={isMigrating}
                size="lg"
              >
                {isMigrating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Migrating...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Migrate All ({assetsToMigrate.length})
                  </>
                )}
              </Button>

              {completedCount > 0 && (
                <div className="text-sm text-muted-foreground">
                  {completedCount}/{assetsToMigrate.length} completed
                  {errorCount > 0 && ` (${errorCount} errors)`}
                </div>
              )}
            </div>

            {(isMigrating || completedCount > 0) && (
              <Progress value={progress} className="h-2" />
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {renderCategory('destinations', 'Destinations', 'Homepage destination cards')}
          {renderCategory('other', 'Other Assets', 'HQ building and misc images')}
          {renderCategory('blog', 'Blog Images', '96 blog article images')}
          {renderCategory('europe42', 'Europe 42 Countries', '40 country images')}
          {renderCategory('thai', 'Thai Blog', '49 Thai language blog images')}
        </div>

        {completedCount === assetsToMigrate.length && (
          <Card className="border-green-500 bg-green-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                <div>
                  <div className="font-semibold text-green-700">All {assetsToMigrate.length} assets migrated!</div>
                  <div className="text-sm text-muted-foreground">
                    Blog is now ready. You can publish the app.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
