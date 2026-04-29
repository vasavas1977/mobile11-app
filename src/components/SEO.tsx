import { Helmet } from 'react-helmet-async';
import { useEffect } from 'react';

// Strip tracking/locale query params that create duplicate URLs in Google's index.
// `lang` is handled via <html lang> + hreflang, so the query param is redundant.
const STRIPPABLE_PARAMS = ['lang'];

function useStripDuplicateQueryParams() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    let changed = false;
    for (const param of STRIPPABLE_PARAMS) {
      if (url.searchParams.has(param)) {
        url.searchParams.delete(param);
        changed = true;
      }
    }
    if (changed) {
      window.history.replaceState({}, '', url.pathname + url.search + url.hash);
    }
  }, []);
}

interface SEOProps {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  image?: string;
  type?: 'website' | 'product' | 'article';
  structuredData?: object;
  noindex?: boolean;
  alternateLanguages?: { lang: string; url: string }[];
}

const BASE_URL = 'https://mobile11.com';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;
const SITE_NAME = 'Mobile11';

export function SEO({
  title,
  description,
  keywords = [],
  canonical,
  image = DEFAULT_IMAGE,
  type = 'website',
  structuredData,
  noindex = false,
  alternateLanguages = []
}: SEOProps) {
  useStripDuplicateQueryParams();
  const fullTitle = `${SITE_NAME} | ${title}`;
  const canonicalUrl = canonical || BASE_URL;

  // Default Organization structured data
  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Mobile11",
    "url": BASE_URL,
    "logo": `${BASE_URL}/favicon-512.png`,
    "description": "Unlimited data eSIM for global travelers. No speed limits, no data caps in 151 countries.",
    "sameAs": [
      "https://www.facebook.com/mobile11esim",
      "https://twitter.com/mobile11esim"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": "support@mobile11.com",
      "availableLanguage": ["English", "Thai"]
    }
  };

  // LocalBusiness structured data for 1-TO-ALL headquarters
  const localBusinessData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Mobile11 by 1-TO-ALL",
    "image": `${BASE_URL}/favicon-512.png`,
    "description": "eSIM provider with unlimited data plans for 151 countries. Powered by 1-TO-ALL, Thailand's 4th licensed telecom operator.",
    "@id": `${BASE_URL}/#localbusiness`,
    "url": BASE_URL,
    "telephone": "+66-2-026-6289",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "359, 361, 363 Pracha Uthit Rd",
      "addressLocality": "Huai Khwang",
      "addressRegion": "Bangkok",
      "postalCode": "10310",
      "addressCountry": "TH"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 13.7726414,
      "longitude": 100.5789425
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "09:00",
      "closes": "18:00"
    },
    "priceRange": "$$"
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Robots */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />
      <meta property="og:locale:alternate" content="th_TH" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@mobile11esim" />
      
      {/* Alternate Languages */}
      {alternateLanguages.map(({ lang, url }) => (
        <link key={lang} rel="alternate" hrefLang={lang} href={url} />
      ))}
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(organizationData)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(localBusinessData)}
      </script>
      {structuredData && (
        Array.isArray(structuredData) ? (
          structuredData.map((data, index) => (
            <script key={`sd-${index}`} type="application/ld+json">
              {JSON.stringify(data)}
            </script>
          ))
        ) : (
          <script type="application/ld+json">
            {JSON.stringify(structuredData)}
          </script>
        )
      )}
    </Helmet>
  );
}

// Pre-defined SEO configurations for common pages (English)
export const SEO_CONFIG = {
  home: {
    title: 'eSIM for Travel | Unlimited Data Travel SIM & Roaming SIM',
    description: 'Buy eSIM for global travel with unlimited data. No roaming fees in 151 countries. Best travel SIM & roaming SIM alternative. Instant activation for iPhone & Android.',
    keywords: ['esim', 'travel sim', 'roaming sim', 'unlimited data esim', 'international sim card', 'esim for travel', 'no roaming fees', 'instant esim activation']
  },
  whatIsEsim: {
    title: 'What is eSIM? How eSIM Works for Travelers',
    description: 'Learn what eSIM is and how it works. The best travel SIM and roaming SIM replacement. No physical SIM needed. Instant activation via QR code for iPhone & Android.',
    keywords: ['what is esim', 'how esim works', 'esim explained', 'esim vs sim card', 'embedded sim', 'esim activation', 'esim iphone', 'esim android']
  },
  packages: {
    title: 'Buy eSIM Data Plans | Unlimited Data Packages',
    description: 'Browse and buy eSIM data plans for 151 countries. Unlimited data packages with instant activation. Compare prices for Japan, Korea, Europe, USA and more.',
    keywords: ['buy esim', 'esim plans', 'esim packages', 'data plans', 'unlimited data', 'international data']
  },
  japan: {
    title: 'eSIM Japan | Unlimited Data Japan SIM Card',
    description: 'Buy Japan eSIM with unlimited data. Best Japan travel SIM. Works on Docomo, Softbank, au networks. Instant activation, no roaming fees. Perfect for Tokyo, Osaka travel.',
    keywords: ['esim japan', 'japan sim card', 'japan travel sim', 'unlimited data japan', 'japan esim unlimited', 'tokyo sim card', 'docomo esim']
  },
  korea: {
    title: 'eSIM Korea | Unlimited Data Korea SIM Card',
    description: 'Buy Korea eSIM with unlimited data. Best Korea travel SIM. Works on SKT, KT, LG U+. Perfect for Seoul, Busan travel. Instant QR activation.',
    keywords: ['esim korea', 'korea sim card', 'korea travel sim', 'south korea esim', 'seoul sim card', 'unlimited data korea', 'korean sim']
  },
  china: {
    title: 'eSIM China | China Data SIM with VPN Access',
    description: 'Buy China eSIM with data access. Works across mainland China including Beijing, Shanghai. Easy activation for tourists and business travelers.',
    keywords: ['esim china', 'china sim card', 'china travel sim', 'china data sim', 'china esim vpn', 'beijing sim card', 'shanghai sim']
  },
  usa: {
    title: 'eSIM USA | Unlimited Data USA SIM Card',
    description: 'Buy USA eSIM with unlimited data. Works on AT&T, T-Mobile, Verizon networks. Perfect for US travel. Instant activation, no roaming fees.',
    keywords: ['esim usa', 'usa sim card', 'american travel sim', 'us data sim', 'usa esim unlimited', 'att esim', 'tmobile esim']
  },
  europe: {
    title: 'eSIM Europe | Unlimited Data Europe SIM Card',
    description: 'Buy Europe eSIM with unlimited data covering 42+ countries. One eSIM for all of Europe including UK, France, Germany, Italy, Spain. No roaming fees across EU.',
    keywords: ['esim europe', 'europe sim card', 'european travel sim', 'eu roaming', 'europe esim unlimited', 'uk esim', 'france esim', 'germany esim']
  },
  thailand: {
    title: 'eSIM Thailand | Unlimited Data Thai SIM Card',
    description: 'Buy Thailand eSIM with truly unlimited data. Best local Thai SIM alternative. Works on AIS, True, DTAC networks. Instant activation for tourists & locals.',
    keywords: ['esim thailand', 'thailand sim card', 'thai travel sim', 'bangkok sim', 'thailand esim unlimited', 'ais esim', 'true esim', 'dtac esim']
  },
  taiwan: {
    title: 'eSIM Taiwan | Unlimited Data Taiwan SIM Card',
    description: 'Buy Taiwan eSIM with unlimited data. Best Taiwan travel SIM. Works across Taipei, Taichung, Kaohsiung. Instant activation for tourists.',
    keywords: ['esim taiwan', 'taiwan sim card', 'taiwan travel sim', 'taipei sim card', 'taiwan esim unlimited', 'taiwan data sim']
  },
  hongkong: {
    title: 'eSIM Hong Kong | Unlimited Data HK SIM Card',
    description: 'Buy Hong Kong eSIM with unlimited data. Best HK travel SIM. Fast 4G/5G coverage. Instant activation, no roaming fees.',
    keywords: ['esim hong kong', 'hong kong sim card', 'hk travel sim', 'hong kong esim unlimited', 'hk data sim']
  }
};

// Thai SEO configurations for high-traffic Thai keywords
export const SEO_CONFIG_TH = {
  home: {
    title: 'eSIM เน็ตไม่อั้น ซิมต่างประเทศ 151 ประเทศ | ซื้อออนไลน์ทันที',
    description: 'ซื้อ eSIM ซิมต่างประเทศ เน็ตไม่อั้น ราคาถูก ใช้งานได้ทันที ไม่ต้องเปลี่ยนซิม ครอบคลุม 151 ประเทศทั่วโลก ญี่ปุ่น เกาหลี ยุโรป อเมริกา',
    keywords: ['eSIM', 'ซิมต่างประเทศ', 'เน็ตไม่อั้น', 'ซิมญี่ปุ่น', 'ซิมเกาหลี', 'ซิมยุโรป', 'ซิมท่องเที่ยว', 'ซิมเที่ยวต่างประเทศ', 'sim roaming', 'sim ต่างประเทศ ราคาถูก', 'ซิมโรมมิ่ง', 'eSIM ราคาถูก', 'ซิมเที่ยวต่างประเทศ ราคาถูก', 'esim ต่างประเทศ']
  },
  packages: {
    title: 'ซื้อ eSIM ซิมต่างประเทศ เน็ตไม่อั้น | ราคาถูก 151 ประเทศ',
    description: 'เลือกซื้อ eSIM ซิมต่างประเทศ เน็ตไม่อั้น ราคาถูก ครอบคลุม 151 ประเทศ ญี่ปุ่น เกาหลี ยุโรป อเมริกา ใช้งานได้ทันที ไม่ต้องเปลี่ยนซิม',
    keywords: ['ซื้อ eSIM', 'ซิมต่างประเทศ', 'ซิมเที่ยวต่างประเทศ', 'eSIM ราคาถูก', 'เน็ตไม่อั้น', 'sim roaming ราคาถูก', 'sim ต่างประเทศ']
  },
  japan: {
    title: 'ซิมญี่ปุ่น eSIM เน็ตไม่อั้น 2025 | ราคาถูก ซื้อออนไลน์ทันที',
    description: 'ซิมญี่ปุ่น eSIM เน็ตไม่อั้น ใช้ได้ทันที ไม่ต้องเปลี่ยนซิม รองรับ Docomo, Softbank, au ครอบคลุมทั่วญี่ปุ่น โตเกียว โอซาก้า เกียวโต ราคาเริ่มต้น ฿99',
    keywords: ['ซิมญี่ปุ่น', 'eSIM ญี่ปุ่น', 'ซิมเน็ตญี่ปุ่น', 'ซิมญี่ปุ่น ราคาถูก', 'ซิมท่องเที่ยวญี่ปุ่น', 'ซิมญี่ปุ่น เน็ตไม่อั้น', 'ซิมญี่ปุ่น 2025', 'ซิมโตเกียว', 'ซิมโอซาก้า', 'sim roaming ญี่ปุ่น', 'ซิมต่างประเทศ ญี่ปุ่น', 'sim ญี่ปุ่น ราคาถูก', 'esim japan']
  },
  korea: {
    title: 'ซิมเกาหลี eSIM เน็ตไม่อั้น 2025 | ราคาถูก ซื้อง่าย ใช้ได้ทันที',
    description: 'ซิมเกาหลี eSIM เน็ตไม่อั้น ใช้ได้ทันที รองรับ SKT, KT, LG U+ เที่ยวโซล ปูซาน เชจู สะดวกสบาย ไม่ต้องเปลี่ยนซิม ราคาเริ่มต้น ฿99',
    keywords: ['ซิมเกาหลี', 'eSIM เกาหลี', 'ซิมเน็ตเกาหลี', 'ซิมเกาหลี ราคาถูก', 'ซิมท่องเที่ยวเกาหลี', 'ซิมเกาหลี เน็ตไม่อั้น', 'ซิมโซล', 'ซิมปูซาน', 'ซิมเกาหลี 2025', 'sim roaming เกาหลี', 'ซิมต่างประเทศ เกาหลี', 'sim เกาหลี ราคาถูก', 'esim korea']
  },
  taiwan: {
    title: 'ซิมไต้หวัน eSIM เน็ตไม่อั้น 2025 | ราคาถูก ซื้อออนไลน์',
    description: 'ซิมไต้หวัน eSIM เน็ตไม่อั้น ใช้ได้ทันที เที่ยวไทเป เกาสง ไถจง สะดวกสบาย ไม่ต้องเปลี่ยนซิม 4G/5G ความเร็วสูง ราคาเริ่มต้น ฿99',
    keywords: ['ซิมไต้หวัน', 'eSIM ไต้หวัน', 'ซิมเน็ตไต้หวัน', 'ซิมไต้หวัน ราคาถูก', 'ซิมท่องเที่ยวไต้หวัน', 'ซิมไทเป', 'ซิมไต้หวัน เน็ตไม่อั้น', 'ซิมไต้หวัน 2025', 'sim roaming ไต้หวัน', 'ซิมต่างประเทศ ไต้หวัน', 'sim ไต้หวัน ราคาถูก']
  },
  hongkong: {
    title: 'ซิมฮ่องกง eSIM เน็ตไม่อั้น 2025 | ราคาถูก ซื้อง่าย',
    description: 'ซิมฮ่องกง eSIM เน็ตไม่อั้น ใช้ได้ทันที 4G/5G ความเร็วสูง ครอบคลุมทั่วฮ่องกง ไม่ต้องเปลี่ยนซิม ราคาเริ่มต้น ฿99',
    keywords: ['ซิมฮ่องกง', 'eSIM ฮ่องกง', 'ซิมเน็ตฮ่องกง', 'ซิมฮ่องกง ราคาถูก', 'ซิมท่องเที่ยวฮ่องกง', 'ซิมฮ่องกง เน็ตไม่อั้น', 'ซิมฮ่องกง 2025', 'sim roaming ฮ่องกง', 'ซิมต่างประเทศ ฮ่องกง']
  },
  europe: {
    title: 'ซิมยุโรป eSIM เน็ตไม่อั้น 42 ประเทศ 2025 | ราคาถูก',
    description: 'ซิมยุโรป eSIM เน็ตไม่อั้น 1 ซิมใช้ได้ 42 ประเทศ อังกฤษ ฝรั่งเศส เยอรมัน อิตาลี สเปน ไม่ต้องเปลี่ยนซิม ไม่มีค่าโรมมิ่ง ราคาเริ่มต้น ฿199',
    keywords: ['ซิมยุโรป', 'eSIM ยุโรป', 'ซิมเน็ตยุโรป', 'ซิมยุโรป ราคาถูก', 'ซิมท่องเที่ยวยุโรป', 'ซิมยุโรป เน็ตไม่อั้น', 'ซิมยุโรป 42 ประเทศ', 'ซิมอังกฤษ', 'ซิมฝรั่งเศส', 'ซิมเยอรมัน', 'sim roaming ยุโรป', 'ซิมต่างประเทศ ยุโรป', 'esim europe']
  },
  china: {
    title: 'ซิมจีน eSIM 2025 | ใช้งานได้ทันที ราคาถูก ไม่ต้องโรมมิ่ง',
    description: 'ซิมจีน eSIM ใช้ได้ทันที ครอบคลุมทั่วจีน ปักกิ่ง เซี่ยงไฮ้ กวางโจว ไม่ต้องเปลี่ยนซิม ราคาถูกกว่า sim roaming เหมาะสำหรับนักท่องเที่ยวและนักธุรกิจ',
    keywords: ['ซิมจีน', 'eSIM จีน', 'ซิมเน็ตจีน', 'ซิมจีน ราคาถูก', 'ซิมท่องเที่ยวจีน', 'ซิมปักกิ่ง', 'ซิมเซี่ยงไฮ้', 'sim จีน', 'sim roaming จีน', 'ซิมต่างประเทศ จีน', 'sim จีน ราคาถูก', 'esim china', 'eSIM จีน ราคาถูก']
  },
  usa: {
    title: 'ซิมอเมริกา eSIM เน็ตไม่อั้น 2025 | ราคาถูก ซื้อออนไลน์',
    description: 'ซิมอเมริกา eSIM เน็ตไม่อั้น รองรับ AT&T, T-Mobile, Verizon ครอบคลุมทั่วสหรัฐ ไม่ต้องเปลี่ยนซิม ใช้งานได้ทันที ราคาถูกกว่าซิมโรมมิ่ง',
    keywords: ['ซิมอเมริกา', 'eSIM อเมริกา', 'ซิมเน็ตอเมริกา', 'ซิมอเมริกา ราคาถูก', 'ซิมท่องเที่ยวอเมริกา', 'ซิมสหรัฐ', 'ซิม USA', 'sim roaming อเมริกา', 'ซิมต่างประเทศ อเมริกา', 'sim อเมริกา ราคาถูก']
  },
  singapore: {
    title: 'ซิมสิงคโปร์ eSIM เน็ตไม่อั้น 2025 | ราคาถูก',
    description: 'ซิมสิงคโปร์ eSIM เน็ตไม่อั้น ใช้ได้ทันที 4G/5G ความเร็วสูง ไม่ต้องเปลี่ยนซิม ราคาเริ่มต้น ฿99 ดีกว่า sim roaming',
    keywords: ['ซิมสิงคโปร์', 'eSIM สิงคโปร์', 'ซิมเน็ตสิงคโปร์', 'ซิมสิงคโปร์ ราคาถูก', 'ซิมท่องเที่ยวสิงคโปร์', 'sim roaming สิงคโปร์', 'ซิมต่างประเทศ สิงคโปร์']
  },
  malaysia: {
    title: 'ซิมมาเลเซีย eSIM เน็ตไม่อั้น 2025 | ราคาถูก',
    description: 'ซิมมาเลเซีย eSIM เน็ตไม่อั้น ใช้ได้ทันที ครอบคลุม KL เกนติ้ง ปีนัง ไม่ต้องเปลี่ยนซิม ราคาเริ่มต้น ฿99 ดีกว่า sim roaming',
    keywords: ['ซิมมาเลเซีย', 'eSIM มาเลเซีย', 'ซิมเน็ตมาเลเซีย', 'ซิมมาเลเซีย ราคาถูก', 'ซิมท่องเที่ยวมาเลเซีย', 'ซิม KL', 'sim roaming มาเลเซีย', 'ซิมต่างประเทศ มาเลเซีย']
  },
  vietnam: {
    title: 'ซิมเวียดนาม eSIM เน็ตไม่อั้น 2025 | ราคาถูก',
    description: 'ซิมเวียดนาม eSIM เน็ตไม่อั้น ใช้ได้ทันที ครอบคลุม ฮานอย โฮจิมินห์ ดานัง ไม่ต้องเปลี่ยนซิม ราคาเริ่มต้น ฿99 ดีกว่า sim roaming',
    keywords: ['ซิมเวียดนาม', 'eSIM เวียดนาม', 'ซิมเน็ตเวียดนาม', 'ซิมเวียดนาม ราคาถูก', 'ซิมท่องเที่ยวเวียดนาม', 'sim roaming เวียดนาม', 'ซิมต่างประเทศ เวียดนาม']
  },
  simRoaming: {
    title: 'ซิมต่างประเทศ ราคาถูก 2025 | eSIM โรมมิ่ง 151 ประเทศ ดีกว่า SIM Roaming',
    description: 'ซื้อซิมต่างประเทศ eSIM ราคาถูก ดีกว่า sim roaming ไม่มีค่าโรมมิ่ง ครอบคลุม 151 ประเทศ ใช้ได้ทันที ญี่ปุ่น เกาหลี จีน ยุโรป อเมริกา',
    keywords: ['sim roaming', 'sim ต่างประเทศ ราคาถูก', 'ซิมโรมมิ่ง', 'ซิมต่างประเทศ', 'esim ต่างประเทศ', 'ซิมเที่ยวต่างประเทศ ราคาถูก', 'sim roaming ราคาถูก', 'eSIM ราคาถูก', 'ซิมโรมมิ่ง ราคาเท่าไหร่', 'sim roaming คืออะไร', 'ซิมต่างประเทศ ยี่ห้อไหนดี']
  }
};

// Helper to get country-specific SEO
export function getCountrySEO(country: string): { title: string; description: string; keywords: string[] } {
  const countryLower = country.toLowerCase();
  
  // Check for exact matches first
  if (countryLower === 'japan') return SEO_CONFIG.japan;
  if (countryLower === 'korea' || countryLower === 'south korea') return SEO_CONFIG.korea;
  if (countryLower === 'china') return SEO_CONFIG.china;
  if (countryLower === 'usa' || countryLower === 'united states') return SEO_CONFIG.usa;
  if (countryLower.includes('europe')) return SEO_CONFIG.europe;
  if (countryLower === 'thailand') return SEO_CONFIG.thailand;
  
  // Generic country SEO
  const formattedCountry = country.charAt(0).toUpperCase() + country.slice(1);
  return {
    title: `eSIM ${formattedCountry} | Unlimited Data ${formattedCountry} SIM Card`,
    description: `Buy ${formattedCountry} eSIM with unlimited data. Best ${formattedCountry} travel SIM alternative. Instant activation, no roaming fees. Works on iPhone & Android.`,
    keywords: [`esim ${countryLower}`, `${countryLower} sim card`, `${countryLower} travel sim`, `${countryLower} data sim`, `unlimited data ${countryLower}`]
  };
}

// Language-aware helper to get country SEO config
export function getCountrySEOByLanguage(country: string, language: 'en' | 'th' = 'en'): { title: string; description: string; keywords: string[] } {
  const countryLower = country.toLowerCase();
  
  if (language === 'th') {
    // Check Thai SEO config first
    if (countryLower === 'japan') return SEO_CONFIG_TH.japan;
    if (countryLower === 'korea' || countryLower === 'south korea') return SEO_CONFIG_TH.korea;
    if (countryLower === 'taiwan') return SEO_CONFIG_TH.taiwan;
    if (countryLower === 'hong kong' || countryLower === 'hongkong') return SEO_CONFIG_TH.hongkong;
    if (countryLower.includes('europe')) return SEO_CONFIG_TH.europe;
    if (countryLower === 'china') return SEO_CONFIG_TH.china;
    if (countryLower === 'usa' || countryLower === 'united states') return SEO_CONFIG_TH.usa;
    if (countryLower === 'singapore') return SEO_CONFIG_TH.singapore;
    if (countryLower === 'malaysia') return SEO_CONFIG_TH.malaysia;
    if (countryLower === 'vietnam') return SEO_CONFIG_TH.vietnam;
    
    // Generic Thai SEO for other countries
    const formattedCountry = country.charAt(0).toUpperCase() + country.slice(1);
    return {
      title: `ซิม${formattedCountry} eSIM เน็ตไม่อั้น 2025 | ราคาถูก`,
      description: `ซื้อซิม${formattedCountry} eSIM เน็ตไม่อั้น ใช้ได้ทันที ไม่ต้องเปลี่ยนซิม ราคาถูก`,
      keywords: [`ซิม${formattedCountry}`, `eSIM ${formattedCountry}`, `ซิมเน็ต${formattedCountry}`, `ซิม${formattedCountry} ราคาถูก`]
    };
  }
  
  // Fall back to English SEO
  return getCountrySEO(country);
}

// Product structured data helper
export function getProductStructuredData(product: {
  name: string;
  description: string;
  price: number;
  currency?: string;
  image?: string;
  country?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": product.image || DEFAULT_IMAGE,
    "brand": {
      "@type": "Brand",
      "name": "Mobile11"
    },
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": product.currency || "USD",
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "Mobile11"
      }
    },
    "category": "eSIM Data Plan",
    "audience": {
      "@type": "Audience",
      "audienceType": "Travelers"
    }
  };
}

// FAQ structured data helper
export function getFAQStructuredData(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

// Breadcrumb structured data helper
export function getBreadcrumbStructuredData(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}
