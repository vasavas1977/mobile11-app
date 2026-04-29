import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Australia
import australiaEsimHero from "@/assets/blog/australia-esim-hero.jpg";
import australiaGreatBarrierReef from "@/assets/blog/australia-great-barrier-reef.jpg";
import australiaMelbourneLaneway from "@/assets/blog/australia-melbourne-laneway.jpg";
import australiaSydneyOpera from "@/assets/blog/australia-sydney-opera.jpg";
import australiaUluru from "@/assets/blog/australia-uluru.jpg";

// China
import chinaEsimHero from "@/assets/blog/china-esim-hero.jpg";
import chinaForbiddenCity from "@/assets/blog/china-forbidden-city.jpg";
import chinaGreatWall from "@/assets/blog/china-great-wall.jpg";
import chinaShanghaiB from "@/assets/blog/china-shanghai-bund.jpg";
import chinaStreetFood from "@/assets/blog/china-street-food.jpg";

// eSIM general
import esimEcoFriendly from "@/assets/blog/esim-eco-friendly.jpg";
import esimMultipleProfiles from "@/assets/blog/esim-multiple-profiles.jpg";
import esimTravelerAirport from "@/assets/blog/esim-traveler-airport.jpg";
import esimVsSimComparison from "@/assets/blog/esim-vs-sim-comparison.jpg";
import esimVsSimHero from "@/assets/blog/esim-vs-sim-hero.jpg";

// Europe
import europe42RankedHero from "@/assets/blog/europe-42-ranked-hero.jpg";
import europeCafeCulture from "@/assets/blog/europe-cafe-culture.jpg";
import europeEsimHero from "@/assets/blog/europe-esim-hero.jpg";
import europeLandmarksMontage from "@/assets/blog/europe-landmarks-montage.jpg";
import europeMediterraneanCoast from "@/assets/blog/europe-mediterranean-coast.jpg";
import europeTrainScenic from "@/assets/blog/europe-train-scenic.jpg";

// France
import franceEiffelTower from "@/assets/blog/france-eiffel-tower.jpg";
import franceEsimHero from "@/assets/blog/france-esim-hero.jpg";
import franceLavenderProvence from "@/assets/blog/france-lavender-provence.jpg";
import franceParisCafe from "@/assets/blog/france-paris-cafe.jpg";
import francePastries from "@/assets/blog/france-pastries.jpg";

// Germany
import germanyBeerHall from "@/assets/blog/germany-beer-hall.jpg";
import germanyBrandenburgGate from "@/assets/blog/germany-brandenburg-gate.jpg";
import germanyEsimHero from "@/assets/blog/germany-esim-hero.jpg";
import germanyNeuschwanstein from "@/assets/blog/germany-neuschwanstein.jpg";
import germanyTrain from "@/assets/blog/germany-train.jpg";

// Hong Kong
import hongkongDimSum from "@/assets/blog/hongkong-dim-sum.jpg";
import hongkongEsimHero from "@/assets/blog/hongkong-esim-hero.jpg";
import hongkongPeakTram from "@/assets/blog/hongkong-peak-tram.jpg";
import hongkongTempleStreet from "@/assets/blog/hongkong-temple-street.jpg";
import hongkongVictoriaHarbour from "@/assets/blog/hongkong-victoria-harbour.jpg";

// Italy
import italyAmalfiCoast from "@/assets/blog/italy-amalfi-coast.jpg";
import italyColosseum from "@/assets/blog/italy-colosseum.jpg";
import italyEsimHero from "@/assets/blog/italy-esim-hero.jpg";
import italyPizza from "@/assets/blog/italy-pizza.jpg";
import italyVeniceCanal from "@/assets/blog/italy-venice-canal.jpg";

// Japan
import japanEsimHero from "@/assets/blog/japan-esim-hero.jpg";
import japanFoodRamen from "@/assets/blog/japan-food-ramen.jpg";
import japanKyotoFushimi from "@/assets/blog/japan-kyoto-fushimi.jpg";
import japanSakuraNight from "@/assets/blog/japan-sakura-night.jpg";
import japanShinkansen from "@/assets/blog/japan-shinkansen.jpg";
import japanTokyoShibuya from "@/assets/blog/japan-tokyo-shibuya.jpg";

// Korea
import koreaBbq from "@/assets/blog/korea-bbq.jpg";
import koreaBusanGamcheon from "@/assets/blog/korea-busan-gamcheon.jpg";
import koreaEsimHero from "@/assets/blog/korea-esim-hero.jpg";
import koreaHongdae from "@/assets/blog/korea-hongdae.jpg";
import koreaPalaceHanbok from "@/assets/blog/korea-palace-hanbok.jpg";
import koreaStreetFood from "@/assets/blog/korea-street-food.jpg";

// Malaysia
import malaysiaBatuCaves from "@/assets/blog/malaysia-batu-caves.jpg";
import malaysiaEsimHero from "@/assets/blog/malaysia-esim-hero.jpg";
import malaysiaFood from "@/assets/blog/malaysia-food.jpg";
import malaysiaPenangArt from "@/assets/blog/malaysia-penang-art.jpg";
import malaysiaPetronas from "@/assets/blog/malaysia-petronas.jpg";

// Netherlands
import netherlandsAmsterdamCanals from "@/assets/blog/netherlands-amsterdam-canals.jpg";
import netherlandsBicycles from "@/assets/blog/netherlands-bicycles.jpg";
import netherlandsCheese from "@/assets/blog/netherlands-cheese.jpg";
import netherlandsEsimHero from "@/assets/blog/netherlands-esim-hero.jpg";
import netherlandsTulips from "@/assets/blog/netherlands-tulips.jpg";

// Singapore
import singaporeChinatown from "@/assets/blog/singapore-chinatown.jpg";
import singaporeEsimHero from "@/assets/blog/singapore-esim-hero.jpg";
import singaporeGardensBay from "@/assets/blog/singapore-gardens-bay.jpg";
import singaporeHawkerFood from "@/assets/blog/singapore-hawker-food.jpg";
import singaporeMarinaBay from "@/assets/blog/singapore-marina-bay.jpg";

// Spain
import spainAlhambra from "@/assets/blog/spain-alhambra.jpg";
import spainEsimHero from "@/assets/blog/spain-esim-hero.jpg";
import spainFlamenco from "@/assets/blog/spain-flamenco.jpg";
import spainSagradaFamilia from "@/assets/blog/spain-sagrada-familia.jpg";
import spainTapas from "@/assets/blog/spain-tapas.jpg";

// Switzerland
import switzerlandEsimHero from "@/assets/blog/switzerland-esim-hero.jpg";
import switzerlandFondue from "@/assets/blog/switzerland-fondue.jpg";
import switzerlandLucerne from "@/assets/blog/switzerland-lucerne.jpg";
import switzerlandMatterhorn from "@/assets/blog/switzerland-matterhorn.jpg";
import switzerlandTrain from "@/assets/blog/switzerland-train.jpg";

// Taiwan
import taiwanEsimHero from "@/assets/blog/taiwan-esim-hero.jpg";
import taiwanJiufen from "@/assets/blog/taiwan-jiufen.jpg";
import taiwanNightMarket from "@/assets/blog/taiwan-night-market.jpg";
import taiwanSunMoonLake from "@/assets/blog/taiwan-sun-moon-lake.jpg";
import taiwanTaipei101 from "@/assets/blog/taiwan-taipei-101.jpg";

// UK
import ukAfternoonTea from "@/assets/blog/uk-afternoon-tea.jpg";
import ukBigBen from "@/assets/blog/uk-big-ben.jpg";
import ukEsimHero from "@/assets/blog/uk-esim-hero.jpg";
import ukTowerBridge from "@/assets/blog/uk-tower-bridge.jpg";
import ukUnderground from "@/assets/blog/uk-underground.jpg";

// USA
import usaEsimHero from "@/assets/blog/usa-esim-hero.jpg";
import usaGoldenGate from "@/assets/blog/usa-golden-gate.jpg";
import usaGrandCanyon from "@/assets/blog/usa-grand-canyon.jpg";
import usaStatueLiberty from "@/assets/blog/usa-statue-liberty.jpg";
import usaTimesSquare from "@/assets/blog/usa-times-square.jpg";

// Vietnam
import vietnamEsimHero from "@/assets/blog/vietnam-esim-hero.jpg";
import vietnamHalongBay from "@/assets/blog/vietnam-halong-bay.jpg";
import vietnamHoiAn from "@/assets/blog/vietnam-hoi-an.jpg";
import vietnamMotorbikes from "@/assets/blog/vietnam-motorbikes.jpg";
import vietnamPhoStreet from "@/assets/blog/vietnam-pho-street.jpg";

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
  // Australia (5)
  { id: 'australia-esim-hero', name: 'Australia eSIM Hero', localPath: australiaEsimHero, storagePath: 'blog/australia-esim-hero.jpg', contentType: 'image/jpeg' },
  { id: 'australia-great-barrier-reef', name: 'Australia Great Barrier Reef', localPath: australiaGreatBarrierReef, storagePath: 'blog/australia-great-barrier-reef.jpg', contentType: 'image/jpeg' },
  { id: 'australia-melbourne-laneway', name: 'Australia Melbourne Laneway', localPath: australiaMelbourneLaneway, storagePath: 'blog/australia-melbourne-laneway.jpg', contentType: 'image/jpeg' },
  { id: 'australia-sydney-opera', name: 'Australia Sydney Opera', localPath: australiaSydneyOpera, storagePath: 'blog/australia-sydney-opera.jpg', contentType: 'image/jpeg' },
  { id: 'australia-uluru', name: 'Australia Uluru', localPath: australiaUluru, storagePath: 'blog/australia-uluru.jpg', contentType: 'image/jpeg' },
  
  // China (5)
  { id: 'china-esim-hero', name: 'China eSIM Hero', localPath: chinaEsimHero, storagePath: 'blog/china-esim-hero.jpg', contentType: 'image/jpeg' },
  { id: 'china-forbidden-city', name: 'China Forbidden City', localPath: chinaForbiddenCity, storagePath: 'blog/china-forbidden-city.jpg', contentType: 'image/jpeg' },
  { id: 'china-great-wall', name: 'China Great Wall', localPath: chinaGreatWall, storagePath: 'blog/china-great-wall.jpg', contentType: 'image/jpeg' },
  { id: 'china-shanghai-bund', name: 'China Shanghai Bund', localPath: chinaShanghaiB, storagePath: 'blog/china-shanghai-bund.jpg', contentType: 'image/jpeg' },
  { id: 'china-street-food', name: 'China Street Food', localPath: chinaStreetFood, storagePath: 'blog/china-street-food.jpg', contentType: 'image/jpeg' },
  
  // eSIM General (5)
  { id: 'esim-eco-friendly', name: 'eSIM Eco Friendly', localPath: esimEcoFriendly, storagePath: 'blog/esim-eco-friendly.jpg', contentType: 'image/jpeg' },
  { id: 'esim-multiple-profiles', name: 'eSIM Multiple Profiles', localPath: esimMultipleProfiles, storagePath: 'blog/esim-multiple-profiles.jpg', contentType: 'image/jpeg' },
  { id: 'esim-traveler-airport', name: 'eSIM Traveler Airport', localPath: esimTravelerAirport, storagePath: 'blog/esim-traveler-airport.jpg', contentType: 'image/jpeg' },
  { id: 'esim-vs-sim-comparison', name: 'eSIM vs SIM Comparison', localPath: esimVsSimComparison, storagePath: 'blog/esim-vs-sim-comparison.jpg', contentType: 'image/jpeg' },
  { id: 'esim-vs-sim-hero', name: 'eSIM vs SIM Hero', localPath: esimVsSimHero, storagePath: 'blog/esim-vs-sim-hero.jpg', contentType: 'image/jpeg' },
  
  // Europe (6)
  { id: 'europe-42-ranked-hero', name: 'Europe 42 Ranked Hero', localPath: europe42RankedHero, storagePath: 'blog/europe-42-ranked-hero.jpg', contentType: 'image/jpeg' },
  { id: 'europe-cafe-culture', name: 'Europe Cafe Culture', localPath: europeCafeCulture, storagePath: 'blog/europe-cafe-culture.jpg', contentType: 'image/jpeg' },
  { id: 'europe-esim-hero', name: 'Europe eSIM Hero', localPath: europeEsimHero, storagePath: 'blog/europe-esim-hero.jpg', contentType: 'image/jpeg' },
  { id: 'europe-landmarks-montage', name: 'Europe Landmarks Montage', localPath: europeLandmarksMontage, storagePath: 'blog/europe-landmarks-montage.jpg', contentType: 'image/jpeg' },
  { id: 'europe-mediterranean-coast', name: 'Europe Mediterranean Coast', localPath: europeMediterraneanCoast, storagePath: 'blog/europe-mediterranean-coast.jpg', contentType: 'image/jpeg' },
  { id: 'europe-train-scenic', name: 'Europe Train Scenic', localPath: europeTrainScenic, storagePath: 'blog/europe-train-scenic.jpg', contentType: 'image/jpeg' },
  
  // France (5)
  { id: 'france-eiffel-tower', name: 'France Eiffel Tower', localPath: franceEiffelTower, storagePath: 'blog/france-eiffel-tower.jpg', contentType: 'image/jpeg' },
  { id: 'france-esim-hero', name: 'France eSIM Hero', localPath: franceEsimHero, storagePath: 'blog/france-esim-hero.jpg', contentType: 'image/jpeg' },
  { id: 'france-lavender-provence', name: 'France Lavender Provence', localPath: franceLavenderProvence, storagePath: 'blog/france-lavender-provence.jpg', contentType: 'image/jpeg' },
  { id: 'france-paris-cafe', name: 'France Paris Cafe', localPath: franceParisCafe, storagePath: 'blog/france-paris-cafe.jpg', contentType: 'image/jpeg' },
  { id: 'france-pastries', name: 'France Pastries', localPath: francePastries, storagePath: 'blog/france-pastries.jpg', contentType: 'image/jpeg' },
  
  // Germany (5)
  { id: 'germany-beer-hall', name: 'Germany Beer Hall', localPath: germanyBeerHall, storagePath: 'blog/germany-beer-hall.jpg', contentType: 'image/jpeg' },
  { id: 'germany-brandenburg-gate', name: 'Germany Brandenburg Gate', localPath: germanyBrandenburgGate, storagePath: 'blog/germany-brandenburg-gate.jpg', contentType: 'image/jpeg' },
  { id: 'germany-esim-hero', name: 'Germany eSIM Hero', localPath: germanyEsimHero, storagePath: 'blog/germany-esim-hero.jpg', contentType: 'image/jpeg' },
  { id: 'germany-neuschwanstein', name: 'Germany Neuschwanstein', localPath: germanyNeuschwanstein, storagePath: 'blog/germany-neuschwanstein.jpg', contentType: 'image/jpeg' },
  { id: 'germany-train', name: 'Germany Train', localPath: germanyTrain, storagePath: 'blog/germany-train.jpg', contentType: 'image/jpeg' },
  
  // Hong Kong (5)
  { id: 'hongkong-dim-sum', name: 'Hong Kong Dim Sum', localPath: hongkongDimSum, storagePath: 'blog/hongkong-dim-sum.jpg', contentType: 'image/jpeg' },
  { id: 'hongkong-esim-hero', name: 'Hong Kong eSIM Hero', localPath: hongkongEsimHero, storagePath: 'blog/hongkong-esim-hero.jpg', contentType: 'image/jpeg' },
  { id: 'hongkong-peak-tram', name: 'Hong Kong Peak Tram', localPath: hongkongPeakTram, storagePath: 'blog/hongkong-peak-tram.jpg', contentType: 'image/jpeg' },
  { id: 'hongkong-temple-street', name: 'Hong Kong Temple Street', localPath: hongkongTempleStreet, storagePath: 'blog/hongkong-temple-street.jpg', contentType: 'image/jpeg' },
  { id: 'hongkong-victoria-harbour', name: 'Hong Kong Victoria Harbour', localPath: hongkongVictoriaHarbour, storagePath: 'blog/hongkong-victoria-harbour.jpg', contentType: 'image/jpeg' },
  
  // Italy (5)
  { id: 'italy-amalfi-coast', name: 'Italy Amalfi Coast', localPath: italyAmalfiCoast, storagePath: 'blog/italy-amalfi-coast.jpg', contentType: 'image/jpeg' },
  { id: 'italy-colosseum', name: 'Italy Colosseum', localPath: italyColosseum, storagePath: 'blog/italy-colosseum.jpg', contentType: 'image/jpeg' },
  { id: 'italy-esim-hero', name: 'Italy eSIM Hero', localPath: italyEsimHero, storagePath: 'blog/italy-esim-hero.jpg', contentType: 'image/jpeg' },
  { id: 'italy-pizza', name: 'Italy Pizza', localPath: italyPizza, storagePath: 'blog/italy-pizza.jpg', contentType: 'image/jpeg' },
  { id: 'italy-venice-canal', name: 'Italy Venice Canal', localPath: italyVeniceCanal, storagePath: 'blog/italy-venice-canal.jpg', contentType: 'image/jpeg' },
  
  // Japan (6)
  { id: 'japan-esim-hero', name: 'Japan eSIM Hero', localPath: japanEsimHero, storagePath: 'blog/japan-esim-hero.jpg', contentType: 'image/jpeg' },
  { id: 'japan-food-ramen', name: 'Japan Food Ramen', localPath: japanFoodRamen, storagePath: 'blog/japan-food-ramen.jpg', contentType: 'image/jpeg' },
  { id: 'japan-kyoto-fushimi', name: 'Japan Kyoto Fushimi', localPath: japanKyotoFushimi, storagePath: 'blog/japan-kyoto-fushimi.jpg', contentType: 'image/jpeg' },
  { id: 'japan-sakura-night', name: 'Japan Sakura Night', localPath: japanSakuraNight, storagePath: 'blog/japan-sakura-night.jpg', contentType: 'image/jpeg' },
  { id: 'japan-shinkansen', name: 'Japan Shinkansen', localPath: japanShinkansen, storagePath: 'blog/japan-shinkansen.jpg', contentType: 'image/jpeg' },
  { id: 'japan-tokyo-shibuya', name: 'Japan Tokyo Shibuya', localPath: japanTokyoShibuya, storagePath: 'blog/japan-tokyo-shibuya.jpg', contentType: 'image/jpeg' },
  
  // Korea (6)
  { id: 'korea-bbq', name: 'Korea BBQ', localPath: koreaBbq, storagePath: 'blog/korea-bbq.jpg', contentType: 'image/jpeg' },
  { id: 'korea-busan-gamcheon', name: 'Korea Busan Gamcheon', localPath: koreaBusanGamcheon, storagePath: 'blog/korea-busan-gamcheon.jpg', contentType: 'image/jpeg' },
  { id: 'korea-esim-hero', name: 'Korea eSIM Hero', localPath: koreaEsimHero, storagePath: 'blog/korea-esim-hero.jpg', contentType: 'image/jpeg' },
  { id: 'korea-hongdae', name: 'Korea Hongdae', localPath: koreaHongdae, storagePath: 'blog/korea-hongdae.jpg', contentType: 'image/jpeg' },
  { id: 'korea-palace-hanbok', name: 'Korea Palace Hanbok', localPath: koreaPalaceHanbok, storagePath: 'blog/korea-palace-hanbok.jpg', contentType: 'image/jpeg' },
  { id: 'korea-street-food', name: 'Korea Street Food', localPath: koreaStreetFood, storagePath: 'blog/korea-street-food.jpg', contentType: 'image/jpeg' },
  
  // Malaysia (5)
  { id: 'malaysia-batu-caves', name: 'Malaysia Batu Caves', localPath: malaysiaBatuCaves, storagePath: 'blog/malaysia-batu-caves.jpg', contentType: 'image/jpeg' },
  { id: 'malaysia-esim-hero', name: 'Malaysia eSIM Hero', localPath: malaysiaEsimHero, storagePath: 'blog/malaysia-esim-hero.jpg', contentType: 'image/jpeg' },
  { id: 'malaysia-food', name: 'Malaysia Food', localPath: malaysiaFood, storagePath: 'blog/malaysia-food.jpg', contentType: 'image/jpeg' },
  { id: 'malaysia-penang-art', name: 'Malaysia Penang Art', localPath: malaysiaPenangArt, storagePath: 'blog/malaysia-penang-art.jpg', contentType: 'image/jpeg' },
  { id: 'malaysia-petronas', name: 'Malaysia Petronas', localPath: malaysiaPetronas, storagePath: 'blog/malaysia-petronas.jpg', contentType: 'image/jpeg' },
  
  // Netherlands (5)
  { id: 'netherlands-amsterdam-canals', name: 'Netherlands Amsterdam Canals', localPath: netherlandsAmsterdamCanals, storagePath: 'blog/netherlands-amsterdam-canals.jpg', contentType: 'image/jpeg' },
  { id: 'netherlands-bicycles', name: 'Netherlands Bicycles', localPath: netherlandsBicycles, storagePath: 'blog/netherlands-bicycles.jpg', contentType: 'image/jpeg' },
  { id: 'netherlands-cheese', name: 'Netherlands Cheese', localPath: netherlandsCheese, storagePath: 'blog/netherlands-cheese.jpg', contentType: 'image/jpeg' },
  { id: 'netherlands-esim-hero', name: 'Netherlands eSIM Hero', localPath: netherlandsEsimHero, storagePath: 'blog/netherlands-esim-hero.jpg', contentType: 'image/jpeg' },
  { id: 'netherlands-tulips', name: 'Netherlands Tulips', localPath: netherlandsTulips, storagePath: 'blog/netherlands-tulips.jpg', contentType: 'image/jpeg' },
  
  // Singapore (5)
  { id: 'singapore-chinatown', name: 'Singapore Chinatown', localPath: singaporeChinatown, storagePath: 'blog/singapore-chinatown.jpg', contentType: 'image/jpeg' },
  { id: 'singapore-esim-hero', name: 'Singapore eSIM Hero', localPath: singaporeEsimHero, storagePath: 'blog/singapore-esim-hero.jpg', contentType: 'image/jpeg' },
  { id: 'singapore-gardens-bay', name: 'Singapore Gardens Bay', localPath: singaporeGardensBay, storagePath: 'blog/singapore-gardens-bay.jpg', contentType: 'image/jpeg' },
  { id: 'singapore-hawker-food', name: 'Singapore Hawker Food', localPath: singaporeHawkerFood, storagePath: 'blog/singapore-hawker-food.jpg', contentType: 'image/jpeg' },
  { id: 'singapore-marina-bay', name: 'Singapore Marina Bay', localPath: singaporeMarinaBay, storagePath: 'blog/singapore-marina-bay.jpg', contentType: 'image/jpeg' },
  
  // Spain (5)
  { id: 'spain-alhambra', name: 'Spain Alhambra', localPath: spainAlhambra, storagePath: 'blog/spain-alhambra.jpg', contentType: 'image/jpeg' },
  { id: 'spain-esim-hero', name: 'Spain eSIM Hero', localPath: spainEsimHero, storagePath: 'blog/spain-esim-hero.jpg', contentType: 'image/jpeg' },
  { id: 'spain-flamenco', name: 'Spain Flamenco', localPath: spainFlamenco, storagePath: 'blog/spain-flamenco.jpg', contentType: 'image/jpeg' },
  { id: 'spain-sagrada-familia', name: 'Spain Sagrada Familia', localPath: spainSagradaFamilia, storagePath: 'blog/spain-sagrada-familia.jpg', contentType: 'image/jpeg' },
  { id: 'spain-tapas', name: 'Spain Tapas', localPath: spainTapas, storagePath: 'blog/spain-tapas.jpg', contentType: 'image/jpeg' },
  
  // Switzerland (5)
  { id: 'switzerland-esim-hero', name: 'Switzerland eSIM Hero', localPath: switzerlandEsimHero, storagePath: 'blog/switzerland-esim-hero.jpg', contentType: 'image/jpeg' },
  { id: 'switzerland-fondue', name: 'Switzerland Fondue', localPath: switzerlandFondue, storagePath: 'blog/switzerland-fondue.jpg', contentType: 'image/jpeg' },
  { id: 'switzerland-lucerne', name: 'Switzerland Lucerne', localPath: switzerlandLucerne, storagePath: 'blog/switzerland-lucerne.jpg', contentType: 'image/jpeg' },
  { id: 'switzerland-matterhorn', name: 'Switzerland Matterhorn', localPath: switzerlandMatterhorn, storagePath: 'blog/switzerland-matterhorn.jpg', contentType: 'image/jpeg' },
  { id: 'switzerland-train', name: 'Switzerland Train', localPath: switzerlandTrain, storagePath: 'blog/switzerland-train.jpg', contentType: 'image/jpeg' },
  
  // Taiwan (5)
  { id: 'taiwan-esim-hero', name: 'Taiwan eSIM Hero', localPath: taiwanEsimHero, storagePath: 'blog/taiwan-esim-hero.jpg', contentType: 'image/jpeg' },
  { id: 'taiwan-jiufen', name: 'Taiwan Jiufen', localPath: taiwanJiufen, storagePath: 'blog/taiwan-jiufen.jpg', contentType: 'image/jpeg' },
  { id: 'taiwan-night-market', name: 'Taiwan Night Market', localPath: taiwanNightMarket, storagePath: 'blog/taiwan-night-market.jpg', contentType: 'image/jpeg' },
  { id: 'taiwan-sun-moon-lake', name: 'Taiwan Sun Moon Lake', localPath: taiwanSunMoonLake, storagePath: 'blog/taiwan-sun-moon-lake.jpg', contentType: 'image/jpeg' },
  { id: 'taiwan-taipei-101', name: 'Taiwan Taipei 101', localPath: taiwanTaipei101, storagePath: 'blog/taiwan-taipei-101.jpg', contentType: 'image/jpeg' },
  
  // UK (5)
  { id: 'uk-afternoon-tea', name: 'UK Afternoon Tea', localPath: ukAfternoonTea, storagePath: 'blog/uk-afternoon-tea.jpg', contentType: 'image/jpeg' },
  { id: 'uk-big-ben', name: 'UK Big Ben', localPath: ukBigBen, storagePath: 'blog/uk-big-ben.jpg', contentType: 'image/jpeg' },
  { id: 'uk-esim-hero', name: 'UK eSIM Hero', localPath: ukEsimHero, storagePath: 'blog/uk-esim-hero.jpg', contentType: 'image/jpeg' },
  { id: 'uk-tower-bridge', name: 'UK Tower Bridge', localPath: ukTowerBridge, storagePath: 'blog/uk-tower-bridge.jpg', contentType: 'image/jpeg' },
  { id: 'uk-underground', name: 'UK Underground', localPath: ukUnderground, storagePath: 'blog/uk-underground.jpg', contentType: 'image/jpeg' },
  
  // USA (5)
  { id: 'usa-esim-hero', name: 'USA eSIM Hero', localPath: usaEsimHero, storagePath: 'blog/usa-esim-hero.jpg', contentType: 'image/jpeg' },
  { id: 'usa-golden-gate', name: 'USA Golden Gate', localPath: usaGoldenGate, storagePath: 'blog/usa-golden-gate.jpg', contentType: 'image/jpeg' },
  { id: 'usa-grand-canyon', name: 'USA Grand Canyon', localPath: usaGrandCanyon, storagePath: 'blog/usa-grand-canyon.jpg', contentType: 'image/jpeg' },
  { id: 'usa-statue-liberty', name: 'USA Statue of Liberty', localPath: usaStatueLiberty, storagePath: 'blog/usa-statue-liberty.jpg', contentType: 'image/jpeg' },
  { id: 'usa-times-square', name: 'USA Times Square', localPath: usaTimesSquare, storagePath: 'blog/usa-times-square.jpg', contentType: 'image/jpeg' },
  
  // Vietnam (5)
  { id: 'vietnam-esim-hero', name: 'Vietnam eSIM Hero', localPath: vietnamEsimHero, storagePath: 'blog/vietnam-esim-hero.jpg', contentType: 'image/jpeg' },
  { id: 'vietnam-halong-bay', name: 'Vietnam Halong Bay', localPath: vietnamHalongBay, storagePath: 'blog/vietnam-halong-bay.jpg', contentType: 'image/jpeg' },
  { id: 'vietnam-hoi-an', name: 'Vietnam Hoi An', localPath: vietnamHoiAn, storagePath: 'blog/vietnam-hoi-an.jpg', contentType: 'image/jpeg' },
  { id: 'vietnam-motorbikes', name: 'Vietnam Motorbikes', localPath: vietnamMotorbikes, storagePath: 'blog/vietnam-motorbikes.jpg', contentType: 'image/jpeg' },
  { id: 'vietnam-pho-street', name: 'Vietnam Pho Street', localPath: vietnamPhoStreet, storagePath: 'blog/vietnam-pho-street.jpg', contentType: 'image/jpeg' },
];

export default function MigrateBlogRootPage() {
  const [migrationStatus, setMigrationStatus] = useState<Record<string, MigrationStatus>>({});
  const [isMigrating, setIsMigrating] = useState(false);
  const { toast } = useToast();

  const fetchImageAsBase64 = async (imagePath: string): Promise<string> => {
    const response = await fetch(imagePath);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
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

      const { data, error } = await supabase.functions.invoke('migrate-assets', {
        body: {
          imageData: base64Data,
          storagePath: asset.storagePath,
          contentType: asset.contentType
        }
      });

      if (error) throw error;

      setMigrationStatus(prev => ({
        ...prev,
        [asset.id]: { 
          status: 'success', 
          publicUrl: data.publicUrl 
        }
      }));

      return true;
    } catch (error: any) {
      console.error(`Failed to migrate ${asset.name}:`, error);
      setMigrationStatus(prev => ({
        ...prev,
        [asset.id]: { 
          status: 'error', 
          error: error.message 
        }
      }));
      return false;
    }
  };

  const migrateAll = async () => {
    setIsMigrating(true);
    let successCount = 0;
    let errorCount = 0;

    for (const asset of assetsToMigrate) {
      const success = await migrateAsset(asset);
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
    }

    setIsMigrating(false);
    toast({
      title: "Migration Complete",
      description: `Successfully migrated ${successCount} assets. ${errorCount} failed.`,
      variant: errorCount > 0 ? "destructive" : "default"
    });
  };

  const completedCount = Object.values(migrationStatus).filter(s => s.status === 'success').length;
  const progress = (completedCount / assetsToMigrate.length) * 100;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/admin/migrate-assets">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Migrate Blog Root Images</h1>
            <p className="text-muted-foreground">
              {assetsToMigrate.length} images to migrate
            </p>
          </div>
        </div>

        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Progress: {completedCount} / {assetsToMigrate.length}
              </p>
              <Progress value={progress} className="w-64" />
            </div>
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
                  Migrate All
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {assetsToMigrate.map((asset) => {
            const status = migrationStatus[asset.id];
            return (
              <Card key={asset.id} className="overflow-hidden">
                <div className="aspect-video relative">
                  <img
                    src={asset.localPath}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                  />
                  {status?.status === 'uploading' && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 text-white animate-spin" />
                    </div>
                  )}
                  {status?.status === 'success' && (
                    <div className="absolute inset-0 bg-green-500/50 flex items-center justify-center">
                      <CheckCircle className="h-8 w-8 text-white" />
                    </div>
                  )}
                  {status?.status === 'error' && (
                    <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
                      <XCircle className="h-8 w-8 text-white" />
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <p className="text-sm font-medium truncate">{asset.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{asset.storagePath}</p>
                  {status?.status === 'success' && status.publicUrl && (
                    <a 
                      href={status.publicUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                    >
                      View <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {status?.status === 'error' && (
                    <p className="text-xs text-destructive mt-1">{status.error}</p>
                  )}
                  {!status && (
                    <Badge variant="secondary" className="mt-1">Pending</Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
