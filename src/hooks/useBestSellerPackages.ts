import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Market-specific best seller IDs ordered by regional demand
const BEST_SELLER_IDS_BY_LANGUAGE: Record<string, string[]> = {
  // English/Thai default — ranked by Thai outbound travel demand
  en: [
    'd8264ece-d88a-465b-852e-1a043bbb7127', // Japan 5 Days
    'c826c177-c1ac-4c3d-bdc2-dafa12f77396', // China 5 Days
    '77d64e29-97c1-4952-aa8a-5a80c3ef2df5', // Korea 5 Days
    '69687f42-cfcf-412d-963f-d6b160c25941', // Singapore 3 Days
    'd78df768-c903-43b8-a178-83e1c5a66bb9', // Vietnam 5 Days
    '3f40a548-aa6c-4eff-8005-36ae1d48b2ef', // Hong Kong/Macau 3 Days
    '68701b92-8f94-4c7a-9393-2951d391c5e1', // Europe 42 Countries 5 Days
    'fe25cb9f-8e73-4884-980f-2946b2d712b1', // USA/Canada 7 Days
  ],
  // Japanese market — Korea #1, Taiwan #2, then Thailand, Vietnam, China
  ja: [
    '77d64e29-97c1-4952-aa8a-5a80c3ef2df5', // Korea 5 Days
    'e6635485-9bea-4597-96f7-dc8ff2114911', // Taiwan 5 Days
    '5e780d42-8fe1-487f-9edf-6f23e03370c0', // Thailand 5 Days
    'd78df768-c903-43b8-a178-83e1c5a66bb9', // Vietnam 5 Days
    'c826c177-c1ac-4c3d-bdc2-dafa12f77396', // China 5 Days
    '69687f42-cfcf-412d-963f-d6b160c25941', // Singapore 3 Days
    '3f40a548-aa6c-4eff-8005-36ae1d48b2ef', // Hong Kong/Macau 3 Days
    '68701b92-8f94-4c7a-9393-2951d391c5e1', // Europe 42 Countries 5 Days
  ],
  // Korean market — Japan dominant #1, then Vietnam, Thailand, Indonesia
  ko: [
    'd8264ece-d88a-465b-852e-1a043bbb7127', // Japan 5 Days
    'd78df768-c903-43b8-a178-83e1c5a66bb9', // Vietnam 5 Days
    '5e780d42-8fe1-487f-9edf-6f23e03370c0', // Thailand 5 Days
    'b69b0c14-3154-410c-a8a4-f87515de2eee', // Indonesia 5 Days
    'e6635485-9bea-4597-96f7-dc8ff2114911', // Taiwan 5 Days
    'c826c177-c1ac-4c3d-bdc2-dafa12f77396', // China 5 Days
    'fe25cb9f-8e73-4884-980f-2946b2d712b1', // USA/Canada 7 Days
    '3f40a548-aa6c-4eff-8005-36ae1d48b2ef', // Hong Kong/Macau 3 Days
  ],
  // French market — USA #1 (Spain is EU), then Thailand, Vietnam, Japan
  fr: [
    'fe25cb9f-8e73-4884-980f-2946b2d712b1', // USA/Canada 7 Days
    '5e780d42-8fe1-487f-9edf-6f23e03370c0', // Thailand 5 Days
    'd78df768-c903-43b8-a178-83e1c5a66bb9', // Vietnam 5 Days
    'd8264ece-d88a-465b-852e-1a043bbb7127', // Japan 5 Days
    'b69b0c14-3154-410c-a8a4-f87515de2eee', // Indonesia 5 Days
    'b533346c-9cca-4cff-bccc-81d70c71e382', // Turkey 5 Days
    '68701b92-8f94-4c7a-9393-2951d391c5e1', // Europe 42 Countries 5 Days
    '894adc7b-f0ad-4cbf-a8ed-486c26ce9e78', // Australia 5 Days
  ],
  // German market — Turkey #1 (Spain is EU), then Thailand, USA, Japan
  de: [
    'b533346c-9cca-4cff-bccc-81d70c71e382', // Turkey 5 Days
    '5e780d42-8fe1-487f-9edf-6f23e03370c0', // Thailand 5 Days
    'fe25cb9f-8e73-4884-980f-2946b2d712b1', // USA/Canada 7 Days
    'd8264ece-d88a-465b-852e-1a043bbb7127', // Japan 5 Days
    'b69b0c14-3154-410c-a8a4-f87515de2eee', // Indonesia 5 Days
    '894adc7b-f0ad-4cbf-a8ed-486c26ce9e78', // Australia 5 Days
  ],
  // Spanish market — USA #1, then Mexico neighbors, Europe, Thailand
  es: [
    'fe25cb9f-8e73-4884-980f-2946b2d712b1', // USA/Canada 7 Days
    '68701b92-8f94-4c7a-9393-2951d391c5e1', // Europe 42 Countries 5 Days
    '5e780d42-8fe1-487f-9edf-6f23e03370c0', // Thailand 5 Days
    'd8264ece-d88a-465b-852e-1a043bbb7127', // Japan 5 Days
    'b533346c-9cca-4cff-bccc-81d70c71e382', // Turkey 5 Days
    'b69b0c14-3154-410c-a8a4-f87515de2eee', // Indonesia 5 Days
  ],
  // Portuguese (Brazil) market — USA #1, then Europe, Argentina neighbors
  pt: [
    'fe25cb9f-8e73-4884-980f-2946b2d712b1', // USA/Canada 7 Days
    '68701b92-8f94-4c7a-9393-2951d391c5e1', // Europe 42 Countries 5 Days
    'd8264ece-d88a-465b-852e-1a043bbb7127', // Japan 5 Days
    '5e780d42-8fe1-487f-9edf-6f23e03370c0', // Thailand 5 Days
    '77d64e29-97c1-4952-aa8a-5a80c3ef2df5', // Korea 5 Days
    'b533346c-9cca-4cff-bccc-81d70c71e382', // Turkey 5 Days
  ],
  // Arabic market — Turkey #1, then Europe, Thailand, Malaysia
  ar: [
    'b533346c-9cca-4cff-bccc-81d70c71e382', // Turkey 5 Days
    '68701b92-8f94-4c7a-9393-2951d391c5e1', // Europe 42 Countries 5 Days
    '5e780d42-8fe1-487f-9edf-6f23e03370c0', // Thailand 5 Days
    'fe25cb9f-8e73-4884-980f-2946b2d712b1', // USA/Canada 7 Days
    'b69b0c14-3154-410c-a8a4-f87515de2eee', // Indonesia 5 Days
    'd8264ece-d88a-465b-852e-1a043bbb7127', // Japan 5 Days
  ],
};

// Thai uses same as English
BEST_SELLER_IDS_BY_LANGUAGE['th'] = BEST_SELLER_IDS_BY_LANGUAGE['en'];

function getBestSellerIds(language: string): string[] {
  return BEST_SELLER_IDS_BY_LANGUAGE[language] || BEST_SELLER_IDS_BY_LANGUAGE['en'];
}

// Keep legacy export for backwards compatibility
export const BEST_SELLER_IDS = BEST_SELLER_IDS_BY_LANGUAGE['en'];

export interface BestSellerPackage {
  id: string;
  name: string;
  country_name: string;
  country_code: string;
  price: number;
  validity_days: number;
  data_amount: string;
  qos_speed: string | null;
  package_type: string | null;
  description: string | null;
  speed_after_limit: string | null;
  carrier: string | null;
  network_type: string | null;
  sim_type: string | null;
  daily_reset_amount: string | null;
  support_data: boolean | null;
  support_sms: boolean | null;
  support_voice: boolean | null;
  hot_spot: boolean | null;
}

const fetchBestSellerPackages = async (language: string): Promise<BestSellerPackage[]> => {
  const ids = getBestSellerIds(language);
  
  const { data, error } = await supabase
    .from('esim_packages')
    .select('id, name, country_name, country_code, price, validity_days, data_amount, qos_speed, package_type, description, speed_after_limit, carrier, network_type, sim_type, daily_reset_amount, support_data, support_sms, support_voice, hot_spot')
    .in('id', ids)
    .eq('is_active', true);

  if (error) throw error;

  // Sort by the order in the language-specific ID list
  return ids
    .map(id => data?.find(p => p.id === id))
    .filter(Boolean) as BestSellerPackage[];
};

export const BEST_SELLER_QUERY_KEY = ['best-seller-packages'];

export function useBestSellerPackages(language: string = 'en') {
  return useQuery({
    queryKey: [...BEST_SELLER_QUERY_KEY, language],
    queryFn: () => fetchBestSellerPackages(language),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Prefetch function to be called early in the app
export function usePrefetchBestSellers() {
  const queryClient = useQueryClient();
  
  return (language: string = 'en') => {
    queryClient.prefetchQuery({
      queryKey: [...BEST_SELLER_QUERY_KEY, language],
      queryFn: () => fetchBestSellerPackages(language),
      staleTime: 5 * 60 * 1000,
    });
  };
}
