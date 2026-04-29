import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { POPULAR_DESTINATIONS, TRIP_LENGTH_OPTIONS, UserFlowData } from './types';
import { supabase } from '@/integrations/supabase/client';
import { searchCountries, countryToSlug, getCountryCarriers, getCountryBestNetwork } from '@/lib/countryDestinations';
import { navigateWithChatPersistence } from '../utils/chatNavigation';

interface BuyEsimFlowProps {
  step: string;
  userData: UserFlowData;
  onNavigateStep: (step: string, data?: Partial<UserFlowData>) => void;
  onUpdateData: (data: Partial<UserFlowData>) => void;
  onNavigateToFlow: (flow: string, step?: string) => void;
}

type SalesStep = 'destination-days' | 'carrier-price-summary' | 'saving-redirect';

export function BuyEsimFlow({ step, userData, onNavigateStep, onUpdateData, onNavigateToFlow }: BuyEsimFlowProps) {
  const currentStep = (step as SalesStep) || 'destination-days';

  const handleDestinationDays = (destination: string, days: number) => {
    onUpdateData({ destination, tripDays: days });
    onNavigateStep('carrier-price-summary');
  };

  const handleViewPackages = async () => {
    const { language } = useLanguage();
    try {
      await supabase.from('chatbot_leads' as any).insert({
        name: userData.userName || 'Unknown',
        destination: userData.destination,
        trip_days: userData.tripDays,
        language,
      });
    } catch (e) {
      console.error('Error saving lead:', e);
    }

    const slug = userData.destination ? countryToSlug(userData.destination) : null;
    const url = slug ? `/esim/${slug}` : '/esim';
    setTimeout(() => navigateWithChatPersistence(url), 500);
    onNavigateStep('saving-redirect');
  };

  switch (currentStep) {
    case 'destination-days':
      return <DestinationDaysStep userName={userData.userName} onComplete={handleDestinationDays} />;
    case 'carrier-price-summary':
      return <CarrierPriceSummaryStep destination={userData.destination} tripDays={userData.tripDays} userName={userData.userName} onViewPackages={handleViewPackages} />;
    case 'saving-redirect':
      return <SavingRedirectStep userName={userData.userName} destination={userData.destination} />;
    default:
      return <DestinationDaysStep userName={userData.userName} onComplete={handleDestinationDays} />;
  }
}


// Combined destination + days step
function DestinationDaysStep({ userName, onComplete }: { userName?: string; onComplete: (dest: string, days: number) => void }) {
  const { t, localizeField } = useLanguage();
  const [selectedDest, setSelectedDest] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<{ code: string; name: string }[]>([]);

  useEffect(() => {
    if (searchValue.length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(() => {
      const results = searchCountries(searchValue);
      setSearchResults(results.slice(0, 8).map(r => ({ code: r.code, name: r.name })));
    }, 150);
    return () => clearTimeout(timer);
  }, [searchValue]);

  if (selectedDest) {
    return (
      <div className="p-4 space-y-3">
        <div className="flex justify-end">
          <div className="bg-orange-500 text-white rounded-2xl px-4 py-2 text-sm">{selectedDest}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-sm text-gray-800 mb-3">
            {t('chatbot.flows.howManyDaysIn').replace('{destination}', selectedDest)}
          </p>
          <div className="flex flex-wrap gap-2">
            {TRIP_LENGTH_OPTIONS.map((days) => (
              <button
                key={days}
                onClick={() => onComplete(selectedDest, days)}
                className="px-4 py-2.5 text-sm font-semibold text-gray-900 bg-white border border-gray-200
                           rounded-full hover:bg-orange-50 hover:border-orange-500 hover:text-orange-700 transition-all"
              >
                {days} {t('chatbot.buyEsim.days')}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <p className="text-sm text-gray-800 mb-3">
          {t('chatbot.flows.whereTraveling')}
        </p>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={t('chatbot.buyEsim.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 text-sm text-gray-900 bg-white placeholder-gray-400
                       border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2
                       focus:ring-orange-500/20 focus:border-orange-500"
            autoFocus
          />
        </div>

        {searchResults.length > 0 && (
          <div className="mb-4 space-y-1">
            {searchResults.map((result) => (
              <button
                key={result.code}
                onClick={() => setSelectedDest(result.name)}
                className="w-full text-left px-3 py-2 text-sm text-gray-900 rounded-lg
                           bg-white hover:bg-orange-50 border border-gray-200
                           hover:border-orange-200 transition-colors"
              >
                {result.name}
              </button>
            ))}
          </div>
        )}

        {searchResults.length === 0 && (
          <>
            <p className="text-xs text-gray-500 mb-2">{t('chatbot.buyEsim.popular')}</p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_DESTINATIONS.map((dest) => (
                <button
                  key={dest.code}
                  onClick={() => setSelectedDest(dest.nameEn)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-900 bg-white
                             border border-gray-200 rounded-full hover:bg-orange-50
                             hover:border-orange-200 transition-colors"
                >
                  {dest.emoji} {localizeField(dest, 'name')}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Carrier + Price Summary step
function CarrierPriceSummaryStep({ destination, tripDays, userName, onViewPackages }: {
  destination?: string;
  tripDays?: number;
  userName?: string;
  onViewPackages: () => void;
}) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [standardPricePerDay, setStandardPricePerDay] = useState<number | null>(null);
  const [unlimitedPricePerDay, setUnlimitedPricePerDay] = useState<number | null>(null);

  const carriers = destination ? getCountryCarriers(destination) : [];
  const bestNetwork = destination ? getCountryBestNetwork(destination) : null;
  const carrierNames = carriers.slice(0, 3).map(c => c.name);

  useEffect(() => {
    if (!destination) { setLoading(false); return; }

    const fetchPrices = async () => {
      try {
        const { data } = await supabase
          .from('esim_packages')
          .select('price, package_type, data_amount, validity_days')
          .eq('is_active', true)
          .ilike('country_name', destination)
          .limit(50);

        if (data && data.length > 0) {
          const standardPkgs = data.filter((p: any) => {
            if (p.package_type !== 'day_pass') return false;
            const amt = p.data_amount?.toLowerCase() || '';
            if (amt.includes('500mb') || amt.includes('0.5')) return false;
            return true;
          });
          if (standardPkgs.length > 0) {
            const lowestStd = Math.min(...standardPkgs.map((p: any) => p.price / (p.validity_days || 1)));
            setStandardPricePerDay(lowestStd);
          }

          const unlimitedPkgs = data.filter((p: any) => p.package_type === 'limitless');
          if (unlimitedPkgs.length > 0 && tripDays) {
            const eligible = unlimitedPkgs
              .filter((p: any) => p.validity_days >= tripDays)
              .sort((a: any, b: any) => a.validity_days - b.validity_days);
            const best = eligible.length > 0 ? eligible[0] : unlimitedPkgs.sort((a: any, b: any) => b.validity_days - a.validity_days)[0];
            setUnlimitedPricePerDay(best.price / (best.validity_days || 1));
          }
        }
      } catch (e) {
        console.error('Error fetching prices:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchPrices();
  }, [destination, tripDays]);

  if (loading) {
    return (
      <div className="p-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex justify-center">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex justify-end">
        <div className="bg-orange-500 text-white rounded-2xl px-4 py-2 text-sm">
          {destination} · {tripDays} {t('chatbot.buyEsim.days')}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold text-gray-900">{destination}</p>
          {bestNetwork && (
            <span className="px-2 py-0.5 text-xs font-bold text-white bg-orange-500 rounded-full">
              {bestNetwork}
            </span>
          )}
        </div>

        {carrierNames.length > 0 && (
          <div className="text-sm text-gray-600">
            <span className="font-medium text-gray-700">
              {t('chatbot.flows.networkLabel')}
            </span>
            {carrierNames.join(' / ')}
          </div>
        )}

        {(standardPricePerDay !== null || unlimitedPricePerDay !== null) && (
          <div className="bg-orange-50 rounded-xl px-3 py-2 space-y-1.5">
            {standardPricePerDay !== null && (
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-orange-600">
                  {t('chatbot.flows.valueLabel')}
                </span>
                <span className="ml-1">
                  {t('chatbot.flows.fromPrice')} ${standardPricePerDay.toFixed(2)}/{t('chatbot.flows.perDay')}
                </span>
              </p>
            )}
            {unlimitedPricePerDay !== null && (
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-purple-600">
                  {t('chatbot.flows.unlimitedLabel')}
                </span>
                <span className="ml-1">
                  ${unlimitedPricePerDay.toFixed(2)}/{t('chatbot.flows.perDay')}
                  {tripDays && (
                    <span className="text-gray-500 ml-1">
                      ({tripDays} {t('chatbot.buyEsim.days')})
                    </span>
                  )}
                </span>
              </p>
            )}
          </div>
        )}

        <button
          onClick={onViewPackages}
          className="w-full py-3 text-sm font-bold text-white bg-orange-500 rounded-xl
                     hover:bg-orange-600 transition-colors shadow-sm"
        >
          {t('chatbot.flows.viewPackagesFor').replace('{destination}', destination || '')}
        </button>
      </div>
    </div>
  );
}

function SavingRedirectStep({ userName, destination }: { userName?: string; destination?: string }) {
  const { t } = useLanguage();
  
  return (
    <div className="p-4 space-y-3">
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <p className="text-sm text-gray-800">
          {t('chatbot.flows.savingRedirect').replace('{destination}', destination || 'eSIM')}
        </p>
        <div className="mt-3 flex justify-center">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    </div>
  );
}
