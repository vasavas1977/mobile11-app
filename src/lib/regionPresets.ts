import { RegionalPackageData } from './excelRegionalParser';

/**
 * Preset regional package data for common packages
 * Used as fallback when included_countries is null in database
 */

export const EUROPE_42: RegionalPackageData = {
  countries: [
    { name: 'Albania', code: 'AL', carriers: [{ name: 'Vodafone', networks: ['LTE'] }] },
    { name: 'Andorra', code: 'AD', carriers: [{ name: 'Mobiland STA', networks: ['5G'] }] },
    { name: 'Austria', code: 'AT', carriers: [{ name: 'A1', networks: ['5G'] }, { name: 'H3G', networks: ['5G'] }, { name: 'T-mobile', networks: ['5G'] }] },
    { name: 'Belgium', code: 'BE', carriers: [{ name: 'Orange', networks: ['5G'] }, { name: 'Proximus', networks: ['LTE'] }, { name: 'Base', networks: ['LTE'] }] },
    { name: 'Bulgaria', code: 'BG', carriers: [{ name: 'Vivacom', networks: ['5G'] }, { name: 'Mobitel A1', networks: ['5G'] }, { name: 'Telenor', networks: ['LTE'] }] },
    { name: 'Croatia', code: 'HR', carriers: [{ name: 'Telemach', networks: ['5G'] }, { name: 'A1 Hrvatska', networks: ['LTE'] }, { name: 'T-mobile', networks: ['5G'] }] },
    { name: 'Cyprus', code: 'CY', carriers: [{ name: 'MTN', networks: ['5G'] }, { name: 'CYTA', networks: ['LTE'] }] },
    { name: 'Czech Republic', code: 'CZ', carriers: [{ name: 'Vodafone', networks: ['LTE'] }, { name: 'O2', networks: ['5G'] }, { name: 'T-mobile', networks: ['5G'] }] },
    { name: 'Denmark', code: 'DK', carriers: [{ name: 'TDC', networks: ['5G'] }, { name: 'Telia', networks: ['5G'] }, { name: 'Telenor', networks: ['5G'] }, { name: 'Hi3G Danemark', networks: ['LTE'] }] },
    { name: 'Estonia', code: 'EE', carriers: [{ name: 'Telia', networks: ['5G'] }, { name: 'Tele2', networks: ['5G'] }, { name: 'Elisa', networks: ['5G'] }] },
    { name: 'Finland', code: 'FI', carriers: [{ name: 'DNA', networks: ['5G'] }, { name: 'Elisa', networks: ['5G'] }] },
    { name: 'France', code: 'FR', carriers: [{ name: 'BOUYGUES TELECOM', networks: ['5G'] }, { name: 'Orange', networks: ['5G'] }, { name: 'SFR', networks: ['5G'] }] },
    { name: 'Germany', code: 'DE', carriers: [{ name: 'Vodafone', networks: ['LTE'] }, { name: 'O2', networks: ['5G'] }] },
    { name: 'Greece', code: 'GR', carriers: [{ name: 'Cosmote', networks: ['5G'] }, { name: 'Vodafone', networks: ['5G'] }, { name: 'Wind', networks: ['5G'] }] },
    { name: 'Guernsey', code: 'GG', carriers: [{ name: 'Sure', networks: ['LTE'] }] },
    { name: 'Hungary', code: 'HU', carriers: [{ name: 'Telenor', networks: ['5G'] }, { name: 'T-Mobile', networks: ['5G'] }, { name: 'Vodafone', networks: ['5G'] }] },
    { name: 'Iceland', code: 'IS', carriers: [{ name: 'Sýn hf.', networks: ['5G'] }, { name: 'Nova ehf.', networks: ['5G'] }] },
    { name: 'Ireland', code: 'IE', carriers: [{ name: 'Three Ireland', networks: ['5G'] }, { name: 'Meteor', networks: ['5G'] }, { name: 'Vodafone', networks: ['LTE'] }] },
    { name: 'Isle of Man', code: 'IM', carriers: [{ name: 'Manx Telecom', networks: ['LTE'] }] },
    { name: 'Italy', code: 'IT', carriers: [{ name: 'TIM', networks: ['5G'] }, { name: 'Vodafone', networks: ['LTE'] }, { name: 'Wind', networks: ['5G'] }, { name: 'Iliad', networks: ['5G'] }] },
    { name: 'Jersey', code: 'JE', carriers: [{ name: 'Sure', networks: ['LTE'] }] },
    { name: 'Latvia', code: 'LV', carriers: [{ name: 'Tele2', networks: ['5G'] }, { name: 'SIA Bite Mobile', networks: ['LTE'] }, { name: 'LMT', networks: ['5G'] }] },
    { name: 'Liechtenstein', code: 'LI', carriers: [{ name: 'Telecom Liechtenstein', networks: ['LTE'] }] },
    { name: 'Lithuania', code: 'LT', carriers: [{ name: 'Bite', networks: ['5G'] }, { name: 'Telia', networks: ['5G'] }, { name: 'Tele2', networks: ['5G'] }] },
    { name: 'Luxembourg', code: 'LU', carriers: [{ name: 'Tango SA', networks: ['LTE'] }, { name: 'Orange', networks: ['5G'] }, { name: 'POST', networks: ['5G'] }] },
    { name: 'Malta', code: 'MT', carriers: [{ name: 'Vodafone', networks: ['5G'] }, { name: 'GO', networks: ['LTE'] }] },
    { name: 'Monaco', code: 'MC', carriers: [{ name: 'Monaco Telecom', networks: ['LTE'] }] },
    { name: 'Netherlands', code: 'NL', carriers: [{ name: 'KPN', networks: ['5G'] }, { name: 'Vodafone', networks: ['5G'] }] },
    { name: 'Norway', code: 'NO', carriers: [{ name: 'TELENOR', networks: ['5G'] }, { name: 'Telia', networks: ['5G'] }] },
    { name: 'Poland', code: 'PL', carriers: [{ name: 'Play(P4)', networks: ['LTE'] }, { name: 'Orange', networks: ['5G'] }, { name: 'T-Mobile', networks: ['5G'] }] },
    { name: 'Portugal', code: 'PT', carriers: [{ name: 'NOS', networks: ['5G'] }, { name: 'Vodafone', networks: ['LTE'] }, { name: 'MEO', networks: ['5G'] }] },
    { name: 'Romania', code: 'RO', carriers: [{ name: 'Vodafone', networks: ['LTE'] }, { name: 'Orange', networks: ['5G'] }] },
    { name: 'San Marino', code: 'SM', carriers: [{ name: 'TIM San Marino', networks: ['LTE'] }] },
    { name: 'Serbia', code: 'RS', carriers: [{ name: 'Telekom', networks: ['LTE'] }, { name: 'A1', networks: ['LTE'] }, { name: 'Telenor', networks: ['LTE'] }] },
    { name: 'Slovakia', code: 'SK', carriers: [{ name: 'Orange', networks: ['5G'] }, { name: 'O2', networks: ['LTE'] }, { name: 'Slovak Telekom', networks: ['5G'] }] },
    { name: 'Slovenia', code: 'SI', carriers: [{ name: 'Telemach', networks: ['5G'] }, { name: 'A1', networks: ['LTE'] }, { name: 'Mobitel', networks: ['5G'] }] },
    { name: 'Spain', code: 'ES', carriers: [{ name: 'YOIGO', networks: ['LTE'] }, { name: 'Vodafone', networks: ['LTE'] }, { name: 'Orange', networks: ['5G'] }] },
    { name: 'Sweden', code: 'SE', carriers: [{ name: 'Telenor', networks: ['5G'] }, { name: '3', networks: ['5G'] }, { name: 'Tele2', networks: ['5G'] }] },
    { name: 'Switzerland', code: 'CH', carriers: [{ name: 'Salt', networks: ['5G'] }, { name: 'Sunrise', networks: ['5G'] }] },
    { name: 'Turkey', code: 'TR', carriers: [{ name: 'AVEA', networks: ['5G'] }, { name: 'Turkcell', networks: ['5G'] }] },
    { name: 'Ukraine', code: 'UA', carriers: [{ name: 'KyivStar', networks: ['LTE'] }, { name: 'MTS', networks: ['LTE'] }, { name: 'Vodafone', networks: ['LTE'] }] },
    { name: 'United Kingdom', code: 'GB', carriers: [{ name: 'Telefonica UK', networks: ['5G'] }, { name: 'Vodafone', networks: ['LTE'] }, { name: 'H3G', networks: ['LTE'] }, { name: 'EE', networks: ['5G'] }] },
    { name: 'Vatican City', code: 'VA', carriers: [{ name: 'TIM', networks: ['LTE'] }] },
  ]
};

export const EUROPE_42_STOPOVER: RegionalPackageData = {
  countries: [
    ...EUROPE_42.countries,
    { name: 'United Arab Emirates', code: 'AE', carriers: [{ name: 'Etisalat', networks: ['5G'] }, { name: 'DU', networks: ['5G'] }] },
    { name: 'Qatar', code: 'QA', carriers: [{ name: 'Ooredoo (Qtel)', networks: ['5G'] }, { name: 'Vodafone', networks: ['5G'] }] },
  ]
};

export const ASIA_13: RegionalPackageData = {
  countries: [
    { name: 'Thailand', code: 'TH', carriers: [
      { name: 'Real Future (Truemove)', networks: ['5G'] }
    ]},
    { name: 'Indonesia', code: 'ID', carriers: [
      { name: 'XL (Excelcom)', networks: ['4G'] },
      { name: 'Indosat', networks: ['4G'] },
      { name: 'Telkomsel', networks: ['4G'] }
    ]},
    { name: 'Singapore', code: 'SG', carriers: [
      { name: 'Singtel', networks: ['5G'] }
    ]},
    { name: 'Taiwan', code: 'TW', carriers: [
      { name: 'Chunghwa', networks: ['4G'] }
    ]},
    { name: 'Japan', code: 'JP', carriers: [
      { name: 'KDDI', networks: ['5G'] },
      { name: 'Softbank', networks: ['5G'] },
      { name: 'Docomo', networks: ['5G'] }
    ]},
    { name: 'Laos', code: 'LA', carriers: [
      { name: 'LTC', networks: ['5G'] }
    ]},
    { name: 'China', code: 'CN', carriers: [
      { name: 'CMCC', networks: ['5G'] }
    ]},
    { name: 'Cambodia', code: 'KH', carriers: [
      { name: 'CamGSM', networks: ['4G'] }
    ]},
    { name: 'Malaysia', code: 'MY', carriers: [
      { name: 'Maxis', networks: ['4G'] },
      { name: 'Celcom', networks: ['4G'] },
      { name: 'Digi', networks: ['4G'] }
    ]},
    { name: 'Philippines', code: 'PH', carriers: [
      { name: 'Smart', networks: ['5G'] },
      { name: 'Globe', networks: ['5G'] }
    ]},
    { name: 'Hong Kong', code: 'HK', carriers: [
      { name: 'CMHK', networks: ['4G'] }
    ]},
    { name: 'Macau', code: 'MO', carriers: [
      { name: 'CTM', networks: ['5G'] }
    ]},
    { name: 'Vietnam', code: 'VN', carriers: [
      { name: 'Vinaphone', networks: ['5G'] },
      { name: 'Mobifone', networks: ['5G'] },
      { name: 'Viettel', networks: ['5G'] }
    ]}
  ]
};

export const ASIA_3: RegionalPackageData = {
  countries: [
    { name: 'Thailand', code: 'TH', carriers: [
      { name: 'Real Future (Truemove)', networks: ['5G'] }
    ]},
    { name: 'Singapore', code: 'SG', carriers: [
      { name: 'Singtel', networks: ['5G'] }
    ]},
    { name: 'Malaysia', code: 'MY', carriers: [
      { name: 'Maxis', networks: ['4G'] },
      { name: 'Celcom', networks: ['4G'] },
      { name: 'Digi', networks: ['4G'] }
    ]}
  ]
};

export const ASIA_8: RegionalPackageData = {
  countries: [
    { name: 'Hong Kong', code: 'HK', carriers: [
      { name: 'CMHK', networks: ['4G'] }
    ]},
    { name: 'Macau', code: 'MO', carriers: [
      { name: 'CTM', networks: ['5G'] }
    ]},
    { name: 'Singapore', code: 'SG', carriers: [
      { name: 'Singtel', networks: ['5G'] }
    ]},
    { name: 'Malaysia', code: 'MY', carriers: [
      { name: 'Maxis', networks: ['4G'] },
      { name: 'Celcom', networks: ['4G'] },
      { name: 'Digi', networks: ['4G'] }
    ]},
    { name: 'Thailand', code: 'TH', carriers: [
      { name: 'Real Future (Truemove)', networks: ['5G'] }
    ]},
    { name: 'Indonesia', code: 'ID', carriers: [
      { name: 'XL (Excelcom)', networks: ['4G'] },
      { name: 'Indosat', networks: ['4G'] },
      { name: 'Telkomsel', networks: ['4G'] }
    ]},
    { name: 'Vietnam', code: 'VN', carriers: [
      { name: 'Vinaphone', networks: ['5G'] },
      { name: 'Mobifone', networks: ['5G'] },
      { name: 'Viettel', networks: ['5G'] }
    ]},
    { name: 'Cambodia', code: 'KH', carriers: [
      { name: 'CamGSM', networks: ['4G'] }
    ]}
  ]
};

export const HONGKONG_MACAU: RegionalPackageData = {
  countries: [
    { name: 'Hong Kong', code: 'HK', carriers: [
      { name: 'CMHK', networks: ['3G', '4G'] }
    ]},
    { name: 'Macau', code: 'MO', carriers: [
      { name: 'CTM', networks: ['3G', '4G', '5G'] }
    ]}
  ]
};

export const CHINA_HONGKONG_MACAU: RegionalPackageData = {
  countries: [
    { name: 'China', code: 'CN', carriers: [
      { name: 'CMCC', networks: ['3G', '4G', '5G'] }
    ]},
    { name: 'Hong Kong', code: 'HK', carriers: [
      { name: 'CMHK', networks: ['3G', '4G'] }
    ]},
    { name: 'Macau', code: 'MO', carriers: [
      { name: 'CTM', networks: ['3G', '4G', '5G'] }
    ]}
  ]
};

export const GLOBAL_109: RegionalPackageData = {
  countries: [
    { name: 'Greece', code: 'GR', carriers: [{ name: 'Vodafone / Cosmote / Wind Hellas', networks: ['5G'] }] },
    { name: 'Netherlands', code: 'NL', carriers: [{ name: 'Vodafone / KPN', networks: ['5G'] }] },
    { name: 'Belgium', code: 'BE', carriers: [{ name: 'Proximus / Orange', networks: ['5G'] }] },
    { name: 'France', code: 'FR', carriers: [{ name: 'SFR / Orange', networks: ['5G'] }] },
    { name: 'Spain', code: 'ES', carriers: [{ name: 'Orange / Telefonica / Vodafone', networks: ['5G'] }] },
    { name: 'Hungary', code: 'HU', carriers: [{ name: 'Telenor / Vodafone', networks: ['5G'] }] },
    { name: 'Bosnia and Herzegovina', code: 'BA', carriers: [{ name: 'HT (Eronet)', networks: ['LTE'] }] },
    { name: 'Croatia', code: 'HR', carriers: [{ name: 'T-mobile / A1 Hrvatska', networks: ['5G'] }] },
    { name: 'Serbia', code: 'RS', carriers: [{ name: 'Telenor', networks: ['LTE'] }] },
    { name: 'Italy', code: 'IT', carriers: [{ name: 'Vodafone / TIM', networks: ['5G'] }] },
    { name: 'Romania', code: 'RO', carriers: [{ name: 'Vodafone', networks: ['LTE'] }] },
    { name: 'Switzerland', code: 'CH', carriers: [{ name: 'Sunrise / SALT', networks: ['5G'] }] },
    { name: 'Czech Republic', code: 'CZ', carriers: [{ name: 'Vodafone / T-mobile', networks: ['5G'] }] },
    { name: 'Slovakia', code: 'SK', carriers: [{ name: 'O2 / Orange', networks: ['5G'] }] },
    { name: 'Austria', code: 'AT', carriers: [{ name: 'T-mobile / Orange (H3G)', networks: ['5G'] }] },
    { name: 'United Kingdom', code: 'GB', carriers: [{ name: 'Vodafone / EE / O2', networks: ['5G'] }] },
    { name: 'Denmark', code: 'DK', carriers: [{ name: 'TDC / Telia', networks: ['5G'] }] },
    { name: 'Sweden', code: 'SE', carriers: [{ name: 'Telenor / TeliaSonera', networks: ['5G'] }] },
    { name: 'Norway', code: 'NO', carriers: [{ name: 'Telia / Telenor', networks: ['5G'] }] },
    { name: 'Finland', code: 'FI', carriers: [{ name: 'Elisa', networks: ['5G'] }] },
    { name: 'Lithuania', code: 'LT', carriers: [{ name: 'BITE / Tele2', networks: ['5G'] }] },
    { name: 'Latvia', code: 'LV', carriers: [{ name: 'Tele2', networks: ['5G'] }] },
    { name: 'Estonia', code: 'EE', carriers: [{ name: 'Tele2 / Elisa EMT', networks: ['5G'] }] },
    { name: 'Ukraine', code: 'UA', carriers: [{ name: 'Vodafone / Kyivstar', networks: ['LTE'] }] },
    { name: 'Moldova', code: 'MD', carriers: [{ name: 'Orange', networks: ['4G'] }] },
    { name: 'Poland', code: 'PL', carriers: [{ name: 'Orange / T-mobile', networks: ['5G'] }] },
    { name: 'Germany', code: 'DE', carriers: [{ name: 'Vodafone / O2', networks: ['5G'] }] },
    { name: 'Gibraltar', code: 'GI', carriers: [{ name: 'Gibtel', networks: ['4G'] }] },
    { name: 'Portugal', code: 'PT', carriers: [{ name: 'TMN / NOS / Vodafone', networks: ['5G'] }] },
    { name: 'Luxembourg', code: 'LU', carriers: [{ name: 'TANGO / POST / Orange', networks: ['5G'] }] },
    { name: 'Ireland', code: 'IE', carriers: [{ name: 'Meteor', networks: ['5G'] }] },
    { name: 'Iceland', code: 'IS', carriers: [{ name: 'Siminn', networks: ['5G'] }] },
    { name: 'Albania', code: 'AL', carriers: [{ name: 'Vodafone', networks: ['LTE'] }] },
    { name: 'Malta', code: 'MT', carriers: [{ name: 'Epic / GO', networks: ['5G'] }] },
    { name: 'Cyprus', code: 'CY', carriers: [{ name: 'CYTA', networks: ['LTE'] }] },
    { name: 'Georgia', code: 'GE', carriers: [{ name: 'Geocell / Mobitel', networks: ['4G'] }] },
    { name: 'Armenia', code: 'AM', carriers: [{ name: 'ArmenTel', networks: ['4G'] }] },
    { name: 'Bulgaria', code: 'BG', carriers: [{ name: 'Yettel (Telenor)', networks: ['5G'] }] },
    { name: 'Turkey', code: 'TR', carriers: [{ name: 'Turkcell', networks: ['5G'] }] },
    { name: 'Slovenia', code: 'SI', carriers: [{ name: 'A1 (Si Mobile)', networks: ['5G'] }] },
    { name: 'Faroe Islands', code: 'FO', carriers: [{ name: 'Faroese Telecom', networks: ['5G'] }] },
    { name: 'French Guiana', code: 'GF', carriers: [{ name: 'Digicel', networks: ['4G'] }] },
    { name: 'Martinique', code: 'MQ', carriers: [{ name: 'Digicel', networks: ['4G'] }] },
    { name: 'Montenegro', code: 'ME', carriers: [{ name: 'Telenor', networks: ['4G'] }] },
    { name: 'Russia', code: 'RU', carriers: [{ name: 'MTS / T2 Mobile', networks: ['4G'] }] },
    { name: 'Qatar', code: 'QA', carriers: [{ name: 'Ooredoo / Vodafone', networks: ['5G'] }] },
    { name: 'United Arab Emirates', code: 'AE', carriers: [{ name: 'Etisalat / DU', networks: ['5G'] }] },
    { name: 'Canada', code: 'CA', carriers: [{ name: 'Bell / Telus / Sasktel', networks: ['5G'] }] },
    { name: 'United States', code: 'US', carriers: [{ name: 'AT&T / T-Mobile', networks: ['5G'] }] },
    { name: 'Mexico', code: 'MX', carriers: [{ name: 'Telefonica / Telcel', networks: ['5G'] }] },
    { name: 'Dominican Republic', code: 'DO', carriers: [{ name: 'Claro / Altice', networks: ['4G'] }] },
    { name: 'Azerbaijan', code: 'AZ', carriers: [{ name: 'Azercell', networks: ['5G'] }] },
    { name: 'Kazakhstan', code: 'KZ', carriers: [{ name: 'Tele2', networks: ['5G'] }] },
    { name: 'India', code: 'IN', carriers: [{ name: 'Airtel', networks: ['4G'] }] },
    { name: 'Pakistan', code: 'PK', carriers: [{ name: 'CMPak', networks: ['4G'] }] },
    { name: 'Sri Lanka', code: 'LK', carriers: [{ name: 'Dialog', networks: ['4G'] }] },
    { name: 'Jordan', code: 'JO', carriers: [{ name: 'Zain', networks: ['4G'] }] },
    { name: 'Kuwait', code: 'KW', carriers: [{ name: 'Ooredoo', networks: ['5G'] }] },
    { name: 'Saudi Arabia', code: 'SA', carriers: [{ name: 'Mobily', networks: ['5G'] }] },
    { name: 'Yemen', code: 'YE', carriers: [{ name: 'MTN', networks: ['4G'] }] },
    { name: 'Oman', code: 'OM', carriers: [{ name: 'Omantel', networks: ['5G'] }] },
    { name: 'Israel', code: 'IL', carriers: [{ name: 'Partner / Cellcom', networks: ['5G'] }] },
    { name: 'Mongolia', code: 'MN', carriers: [{ name: 'Unitel', networks: ['5G', '4G'] }] },
    { name: 'Nepal', code: 'NP', carriers: [{ name: 'Nepal Telecom', networks: ['4G'] }] },
    { name: 'Iran', code: 'IR', carriers: [{ name: 'MTN Irancell', networks: ['4G'] }] },
    { name: 'Uzbekistan', code: 'UZ', carriers: [{ name: 'Unitel', networks: ['4G'] }] },
    { name: 'Tajikistan', code: 'TJ', carriers: [{ name: 'Beeline', networks: ['4G'] }] },
    { name: 'Japan', code: 'JP', carriers: [{ name: 'KDDI / Softbank', networks: ['5G'] }] },
    { name: 'Vietnam', code: 'VN', carriers: [{ name: 'Viettel / Vinaphone / Mobifone', networks: ['5G'] }] },
    { name: 'Hong Kong', code: 'HK', carriers: [{ name: 'CMHK', networks: ['4G'] }] },
    { name: 'Macau', code: 'MO', carriers: [{ name: 'CTM', networks: ['5G'] }] },
    { name: 'Cambodia', code: 'KH', carriers: [{ name: 'CamGSM', networks: ['4G'] }] },
    { name: 'China', code: 'CN', carriers: [{ name: 'CMCC', networks: ['5G'] }] },
    { name: 'Bangladesh', code: 'BD', carriers: [{ name: 'GrameenPhone', networks: ['4G'] }] },
    { name: 'Taiwan', code: 'TW', carriers: [{ name: 'Chunghwa', networks: ['4G'] }] },
    { name: 'Malaysia', code: 'MY', carriers: [{ name: 'Maxis / Celcom', networks: ['4G'] }] },
    { name: 'Australia', code: 'AU', carriers: [{ name: 'Optus', networks: ['5G'] }] },
    { name: 'Indonesia', code: 'ID', carriers: [{ name: 'XL / Indosat / Telkomsel', networks: ['4G'] }] },
    { name: 'Philippines', code: 'PH', carriers: [{ name: 'Smart', networks: ['5G'] }] },
    { name: 'Thailand', code: 'TH', carriers: [{ name: 'Truemove', networks: ['5G'] }] },
    { name: 'Singapore', code: 'SG', carriers: [{ name: 'Singtel', networks: ['5G'] }] },
    { name: 'Brunei', code: 'BN', carriers: [{ name: 'UNN', networks: ['5G'] }] },
    { name: 'New Zealand', code: 'NZ', carriers: [{ name: 'Spark / Vodafone', networks: ['5G'] }] },
    { name: 'Papua New Guinea', code: 'PG', carriers: [{ name: 'Digicel', networks: ['4G'] }] },
    { name: 'Tonga', code: 'TO', carriers: [{ name: 'Digicel', networks: ['4G'] }] },
    { name: 'Vanuatu', code: 'VU', carriers: [{ name: 'Digicel', networks: ['4G'] }] },
    { name: 'Fiji', code: 'FJ', carriers: [{ name: 'Digicel', networks: ['4G'] }] },
    { name: 'Egypt', code: 'EG', carriers: [{ name: 'Vodafone / Etisalat', networks: ['5G'] }] },
    { name: 'Algeria', code: 'DZ', carriers: [{ name: 'Mobilis', networks: ['4G'] }] },
    { name: 'Morocco', code: 'MA', carriers: [{ name: 'Orange Morocco', networks: ['4G'] }] },
    { name: "Cote d'Ivoire", code: 'CI', carriers: [{ name: 'MTN', networks: ['4G'] }] },
    { name: 'Mauritius', code: 'MU', carriers: [{ name: 'Emtel', networks: ['4G'] }] },
    { name: 'Liberia', code: 'LR', carriers: [{ name: 'Cellcom Liberia', networks: ['4G'] }] },
    { name: 'Ghana', code: 'GH', carriers: [{ name: 'MTN / Vodafone', networks: ['4G'] }] },
    { name: 'DR Congo', code: 'CD', carriers: [{ name: 'Airtel / Vodacom', networks: ['4G'] }] },
    { name: 'Seychelles', code: 'SC', carriers: [{ name: 'Airtel', networks: ['4G'] }] },
    { name: 'Sudan', code: 'SD', carriers: [{ name: 'MTN', networks: ['4G'] }] },
    { name: 'Rwanda', code: 'RW', carriers: [{ name: 'MTN Rwanda Cell', networks: ['4G'] }] },
    { name: 'Kenya', code: 'KE', carriers: [{ name: 'Airtel', networks: ['4G'] }] },
    { name: 'Tanzania', code: 'TZ', carriers: [{ name: 'Vodacom', networks: ['4G'] }] },
    { name: 'Uganda', code: 'UG', carriers: [{ name: 'Airtel', networks: ['4G'] }] },
    { name: 'Mozambique', code: 'MZ', carriers: [{ name: 'Vodacom', networks: ['4G'] }] },
    { name: 'Zambia', code: 'ZM', carriers: [{ name: 'Airtel', networks: ['4G'] }] },
    { name: 'Madagascar', code: 'MG', carriers: [{ name: 'Airtel', networks: ['4G'] }] },
    { name: 'Malawi', code: 'MW', carriers: [{ name: 'Airtel', networks: ['4G'] }] },
    { name: 'South Africa', code: 'ZA', carriers: [{ name: 'MTN / Vodacom', networks: ['5G'] }] },
    { name: 'Guatemala', code: 'GT', carriers: [{ name: 'Claro / Telefonica', networks: ['4G'] }] },
    { name: 'Costa Rica', code: 'CR', carriers: [{ name: 'Telefonica', networks: ['4G'] }] },
    { name: 'Panama', code: 'PA', carriers: [{ name: 'Telefonica', networks: ['4G'] }] },
    { name: 'Peru', code: 'PE', carriers: [{ name: 'Claro / Telefonica', networks: ['4G'] }] },
    { name: 'Argentina', code: 'AR', carriers: [{ name: 'Claro / Telefonica', networks: ['4G'] }] },
    { name: 'Brazil', code: 'BR', carriers: [{ name: 'VIVO', networks: ['4G'] }] },
    { name: 'Chile', code: 'CL', carriers: [{ name: 'Claro / Telefonica', networks: ['4G'] }] },
    { name: 'Colombia', code: 'CO', carriers: [{ name: 'Telefonica / Claro', networks: ['4G'] }] },
    { name: 'Uruguay', code: 'UY', carriers: [{ name: 'Antel / Telefonica', networks: ['4G'] }] },
  ]
};

export const GLOBAL_151: RegionalPackageData = {
  countries: [
    { name: "Albania", code: "AL", carriers: [{ name: "Vodafone / One", networks: ["4G"] }] },
    { name: "Algeria", code: "DZ", carriers: [{ name: "Mobilis / Orascom Telecom", networks: ["4G"] }] },
    { name: "Anguilla", code: "AI", carriers: [{ name: "Digicel / C&W", networks: ["4G"] }] },
    { name: "Antigua and Barbuda", code: "AG", carriers: [{ name: "Digicel / C&W", networks: ["4G"] }] },
    { name: "Argentina", code: "AR", carriers: [{ name: "Claro / Telefonica", networks: ["4G"] }] },
    { name: "Armenia", code: "AM", carriers: [{ name: "ArmenTel / VIVA", networks: ["4G"] }] },
    { name: "Aruba", code: "AW", carriers: [{ name: "Digicel", networks: ["4G"] }] },
    { name: "Australia", code: "AU", carriers: [{ name: "Optus / Telstra", networks: ["5G"] }] },
    { name: "Austria", code: "AT", carriers: [{ name: "T-mobile / Orange / A1", networks: ["5G"] }] },
    { name: "Azerbaijan", code: "AZ", carriers: [{ name: "Azercell / Bakcell", networks: ["5G"] }] },
    { name: "Bangladesh", code: "BD", carriers: [{ name: "GrameenPhone", networks: ["4G"] }] },
    { name: "Barbados", code: "BB", carriers: [{ name: "Digicel / C&W", networks: ["4G"] }] },
    { name: "Belarus", code: "BY", carriers: [{ name: "FE VELCOM / life", networks: ["4G"] }] },
    { name: "Belgium", code: "BE", carriers: [{ name: "Proximus / Orange / Base", networks: ["5G"] }] },
    { name: "Bermuda", code: "BM", carriers: [{ name: "Digicel", networks: ["4G"] }] },
    { name: "Bosnia and Herzegovina", code: "BA", carriers: [{ name: "HT Eronet / BH Telecom", networks: ["4G"] }] },
    { name: "Brazil", code: "BR", carriers: [{ name: "VIVO / TIM / Claro", networks: ["4G"] }] },
    { name: "British Virgin Islands", code: "VG", carriers: [{ name: "Digicel / C&W", networks: ["4G"] }] },
    { name: "Brunei", code: "BN", carriers: [{ name: "UNN", networks: ["5G"] }] },
    { name: "Bulgaria", code: "BG", carriers: [{ name: "Yettel / A1 / Vivacom", networks: ["5G"] }] },
    { name: "Cambodia", code: "KH", carriers: [{ name: "CamGSM / Smart / Metfone", networks: ["4G"] }] },
    { name: "Cameroon", code: "CM", carriers: [{ name: "Orange", networks: ["4G"] }] },
    { name: "Canada", code: "CA", carriers: [{ name: "Bell / Telus / Rogers", networks: ["5G"] }] },
    { name: "Cayman Islands", code: "KY", carriers: [{ name: "Digicel", networks: ["4G"] }] },
    { name: "Centrafrique", code: "CF", carriers: [{ name: "Orange", networks: ["4G"] }] },
    { name: "Chile", code: "CL", carriers: [{ name: "Claro / Telefonica / Entel", networks: ["4G"] }] },
    { name: "China", code: "CN", carriers: [{ name: "CMCC", networks: ["5G"] }] },
    { name: "Colombia", code: "CO", carriers: [{ name: "Movistar / Claro / Tigo", networks: ["4G"] }] },
    { name: "Costa Rica", code: "CR", carriers: [{ name: "Movistar / Claro", networks: ["4G"] }] },
    { name: "Croatia", code: "HR", carriers: [{ name: "T-mobile / A1 Hrvatska", networks: ["5G"] }] },
    { name: "Curacao", code: "CW", carriers: [{ name: "Digicel / UTS", networks: ["4G"] }] },
    { name: "Cyprus", code: "CY", carriers: [{ name: "CYTA / MTN Cyprus", networks: ["5G"] }] },
    { name: "Czech Republic", code: "CZ", carriers: [{ name: "Vodafone / T-mobile / O2", networks: ["5G"] }] },
    { name: "Democratic Republic of Congo", code: "CD", carriers: [{ name: "Airtel / Vodacom / Orange", networks: ["4G"] }] },
    { name: "Denmark", code: "DK", carriers: [{ name: "TDC / Telia / Telenor", networks: ["5G"] }] },
    { name: "Dominica", code: "DM", carriers: [{ name: "Digicel / C&W", networks: ["4G"] }] },
    { name: "Dominican Republic", code: "DO", carriers: [{ name: "Claro / Altice", networks: ["4G"] }] },
    { name: "Ecuador", code: "EC", carriers: [{ name: "Claro / Telefonica", networks: ["4G"] }] },
    { name: "Egypt", code: "EG", carriers: [{ name: "Vodafone / Orange / Etisalat", networks: ["5G"] }] },
    { name: "El Salvador", code: "SV", carriers: [{ name: "Claro", networks: ["4G"] }] },
    { name: "Estonia", code: "EE", carriers: [{ name: "Tele2 / Elisa / Telia", networks: ["5G"] }] },
    { name: "Faroe Islands", code: "FO", carriers: [{ name: "Faroese Telecom", networks: ["5G"] }] },
    { name: "Fiji", code: "FJ", carriers: [{ name: "Digicel / Vodafone", networks: ["4G"] }] },
    { name: "Finland", code: "FI", carriers: [{ name: "Elisa / DNA / Telia", networks: ["5G"] }] },
    { name: "France", code: "FR", carriers: [{ name: "SFR / Orange / Bouygues", networks: ["5G"] }] },
    { name: "French Guiana", code: "GF", carriers: [{ name: "Digicel / Orange", networks: ["4G"] }] },
    { name: "Georgia", code: "GE", carriers: [{ name: "Geocell / Mobitel", networks: ["5G"] }] },
    { name: "Germany", code: "DE", carriers: [{ name: "Vodafone / O2 / T-mobile", networks: ["5G"] }] },
    { name: "Ghana", code: "GH", carriers: [{ name: "MTN / Vodafone", networks: ["4G"] }] },
    { name: "Gibraltar", code: "GI", carriers: [{ name: "Gibtel", networks: ["4G"] }] },
    { name: "Greece", code: "GR", carriers: [{ name: "Vodafone / Cosmote / Wind", networks: ["5G"] }] },
    { name: "Grenada", code: "GD", carriers: [{ name: "Digicel / C&W", networks: ["4G"] }] },
    { name: "Guadeloupe", code: "GP", carriers: [{ name: "Digicel / Orange", networks: ["LTE"] }] },
    { name: "Guam", code: "GU", carriers: [{ name: "Docomo Pacific", networks: ["4G"] }] },
    { name: "Guatemala", code: "GT", carriers: [{ name: "Claro / Telefonica / Tigo", networks: ["4G"] }] },
    { name: "Guyana", code: "GY", carriers: [{ name: "Digicel / GTT", networks: ["4G"] }] },
    { name: "Haiti", code: "HT", carriers: [{ name: "Digicel", networks: ["4G"] }] },
    { name: "Honduras", code: "HN", carriers: [{ name: "Claro / Telefonica", networks: ["4G"] }] },
    { name: "Hong Kong", code: "HK", carriers: [{ name: "CMHK", networks: ["5G"] }] },
    { name: "Hungary", code: "HU", carriers: [{ name: "Telenor / Vodafone / T-mobile", networks: ["5G"] }] },
    { name: "Iceland", code: "IS", carriers: [{ name: "Siminn / Vodafone / Nova", networks: ["5G"] }] },
    { name: "India", code: "IN", carriers: [{ name: "Reliance Jio/Bharti Airtel", networks: ["4G"] }] },
    { name: "Indonesia", code: "ID", carriers: [{ name: "XL / Telkomsel / Indosat", networks: ["5G"] }] },
    { name: "Iran", code: "IR", carriers: [{ name: "MTN Irancell", networks: ["4G"] }] },
    { name: "Ireland", code: "IE", carriers: [{ name: "Meteor / 3 Ireland", networks: ["5G"] }] },
    { name: "Israel", code: "IL", carriers: [{ name: "Partner / Cellcom / Pelephone", networks: ["5G"] }] },
    { name: "Italy", code: "IT", carriers: [{ name: "Vodafone / TIM / WIND / Iliad", networks: ["5G"] }] },
    { name: "Ivory Coast", code: "CI", carriers: [{ name: "MTN / Orange", networks: ["4G"] }] },
    { name: "Jamaica", code: "JM", carriers: [{ name: "Digicel / C&W", networks: ["4G"] }] },
    { name: "Japan", code: "JP", carriers: [{ name: "KDDI / Softbank / Docomo", networks: ["5G"] }] },
    { name: "Jordan", code: "JO", carriers: [{ name: "Zain / Umniah", networks: ["4G"] }] },
    { name: "Kazakhstan", code: "KZ", carriers: [{ name: "Tele2 / K'Cell", networks: ["5G"] }] },
    { name: "Kenya", code: "KE", carriers: [{ name: "Airtel", networks: ["4G"] }] },
    { name: "Kuwait", code: "KW", carriers: [{ name: "Ooredoo", networks: ["5G"] }] },
    { name: "Kyrgyzstan", code: "KG", carriers: [{ name: "Beeline / Alfa Telecom", networks: ["4G"] }] },
    { name: "Laos", code: "LA", carriers: [{ name: "LTC", networks: ["5G"] }] },
    { name: "Latvia", code: "LV", carriers: [{ name: "Tele2 / BITE / LMT", networks: ["5G"] }] },
    { name: "Liberia", code: "LR", carriers: [{ name: "Cellcom / Orange", networks: ["4G"] }] },
    { name: "Lithuania", code: "LT", carriers: [{ name: "BITE / Tele2 / Omnitel", networks: ["5G"] }] },
    { name: "Luxembourg", code: "LU", carriers: [{ name: "TANGO / POST / Orange", networks: ["5G"] }] },
    { name: "Macau", code: "MO", carriers: [{ name: "CTM", networks: ["5G"] }] },
    { name: "Madagascar", code: "MG", carriers: [{ name: "Airtel / Orange", networks: ["4G"] }] },
    { name: "Malaysia", code: "MY", carriers: [{ name: "Maxis / Celcom / Digi", networks: ["5G"] }] },
    { name: "Malta", code: "MT", carriers: [{ name: "Vodafone / GO", networks: ["5G"] }] },
    { name: "Malawi", code: "MW", carriers: [{ name: "Airtel", networks: ["4G"] }] },
    { name: "Martinique", code: "MQ", carriers: [{ name: "Digicel / Orange", networks: ["4G"] }] },
    { name: "Mauritius", code: "MU", carriers: [{ name: "Emtel / Orange", networks: ["4G"] }] },
    { name: "Mexico", code: "MX", carriers: [{ name: "Movistar / Telcel / AT&T", networks: ["5G"] }] },
    { name: "Moldova", code: "MD", carriers: [{ name: "Orange", networks: ["4G"] }] },
    { name: "Mongolia", code: "MN", carriers: [{ name: "Unitel / Mobicom", networks: ["4G"] }] },
    { name: "Montenegro", code: "ME", carriers: [{ name: "Telenor / T-mobile / Mtel", networks: ["4G"] }] },
    { name: "Morocco", code: "MA", carriers: [{ name: "Orange / Maroc Telecom", networks: ["4G"] }] },
    { name: "Mozambique", code: "MZ", carriers: [{ name: "Vodacom / Mcel / Movitel", networks: ["4G"] }] },
    { name: "Nepal", code: "NP", carriers: [{ name: "Nepal Telecom", networks: ["4G"] }] },
    { name: "Netherlands", code: "NL", carriers: [{ name: "Vodafone / KPN / T-mobile", networks: ["5G"] }] },
    { name: "New Zealand", code: "NZ", carriers: [{ name: "Spark / Vodafone / 2 Degrees", networks: ["5G"] }] },
    { name: "Nicaragua", code: "NI", carriers: [{ name: "Claro", networks: ["4G"] }] },
    { name: "Norway", code: "NO", carriers: [{ name: "Telia / Telenor", networks: ["5G"] }] },
    { name: "Oman", code: "OM", carriers: [{ name: "Omantel / Ooredoo", networks: ["5G"] }] },
    { name: "Pakistan", code: "PK", carriers: [{ name: "CMPak", networks: ["4G"] }] },
    { name: "Panama", code: "PA", carriers: [{ name: "Tigo / C&W / Claro", networks: ["4G"] }] },
    { name: "Papua New Guinea", code: "PG", carriers: [{ name: "Digicel", networks: ["4G"] }] },
    { name: "Paraguay", code: "PY", carriers: [{ name: "Claro", networks: ["4G"] }] },
    { name: "Peru", code: "PE", carriers: [{ name: "Claro / Telefonica", networks: ["4G"] }] },
    { name: "Philippines", code: "PH", carriers: [{ name: "Smart / Globe", networks: ["5G"] }] },
    { name: "Poland", code: "PL", carriers: [{ name: "Orange / T-mobile / Plus / P4", networks: ["5G"] }] },
    { name: "Portugal", code: "PT", carriers: [{ name: "MEO / NOS / Vodafone", networks: ["5G"] }] },
    { name: "Qatar", code: "QA", carriers: [{ name: "Ooredoo / Vodafone", networks: ["5G"] }] },
    { name: "Romania", code: "RO", carriers: [{ name: "Vodafone / Orange / Digi", networks: ["5G"] }] },
    { name: "Russia", code: "RU", carriers: [{ name: "MTS", networks: ["4G"] }, { name: "Tele2/Beeline", networks: ["4G"] }] },
    { name: "Rwanda", code: "RW", carriers: [{ name: "MTN / Tigo / Airtel", networks: ["4G"] }] },
    { name: "Saudi Arabia", code: "SA", carriers: [{ name: "Mobily", networks: ["5G"] }] },
    { name: "Serbia", code: "RS", carriers: [{ name: "Telenor / Telekom / A1", networks: ["4G"] }] },
    { name: "Seychelles", code: "SC", carriers: [{ name: "Airtel / C&W", networks: ["4G"] }] },
    { name: "Sierra Leone", code: "SL", carriers: [{ name: "Orange / Africell", networks: ["4G"] }] },
    { name: "Singapore", code: "SG", carriers: [{ name: "Singtel", networks: ["5G"] }] },
    { name: "Slovakia", code: "SK", carriers: [{ name: "O2 / Orange", networks: ["4G"] }] },
    { name: "Slovenia", code: "SI", carriers: [{ name: "A1 / Telekom", networks: ["5G"] }] },
    { name: "South Africa", code: "ZA", carriers: [{ name: "Vodacom / MTN / Telkom", networks: ["4G"] }] },
    { name: "South Korea", code: "KR", carriers: [{ name: "LGU / SK / KT", networks: ["5G"] }] },
    { name: "Spain", code: "ES", carriers: [{ name: "Orange / Telefonica / Vodafone", networks: ["5G"] }] },
    { name: "Sri Lanka", code: "LK", carriers: [{ name: "Dialog", networks: ["4G"] }] },
    { name: "St. Kitts/Nevis", code: "KN", carriers: [{ name: "Digicel / C&W", networks: ["4G"] }] },
    { name: "St. Lucia", code: "LC", carriers: [{ name: "Digicel", networks: ["4G"] }] },
    { name: "St. Vincent", code: "VC", carriers: [{ name: "Digicel", networks: ["4G"] }] },
    { name: "Sudan", code: "SD", carriers: [{ name: "MTN / Zain", networks: ["4G"] }] },
    { name: "Swaziland", code: "SZ", carriers: [{ name: "MTN", networks: ["4G"] }] },
    { name: "Sweden", code: "SE", carriers: [{ name: "Telenor / Telia / Tele2", networks: ["5G"] }] },
    { name: "Switzerland", code: "CH", carriers: [{ name: "Sunrise / SALT / Swisscom", networks: ["5G"] }] },
    { name: "Taiwan", code: "TW", carriers: [{ name: "Chunghwa", networks: ["5G"] }] },
    { name: "Tajikistan", code: "TJ", carriers: [{ name: "Beeline / Tcell", networks: ["4G"] }] },
    { name: "Tanzania", code: "TZ", carriers: [{ name: "Vodacom / Airtel", networks: ["4G"] }] },
    { name: "Thailand", code: "TH", carriers: [{ name: "Truemove / DTAC", networks: ["5G"] }] },
    { name: "Tonga", code: "TO", carriers: [{ name: "Digicel", networks: ["4G"] }] },
    { name: "Trinidad and Tobago", code: "TT", carriers: [{ name: "Digicel", networks: ["4G"] }] },
    { name: "Tunisia", code: "TN", carriers: [{ name: "Tunisie Telecom / Ooredoo / Orange", networks: ["4G"] }] },
    { name: "Turkey", code: "TR", carriers: [{ name: "Turkcell / Vodafone / AVEA", networks: ["5G"] }] },
    { name: "Turks and Caicos", code: "TC", carriers: [{ name: "Digicel / C&W", networks: ["4G"] }] },
    { name: "UAE", code: "AE", carriers: [{ name: "Etisalat / DU", networks: ["5G"] }] },
    { name: "Uganda", code: "UG", carriers: [{ name: "Airtel / MTN", networks: ["4G"] }] },
    { name: "Ukraine", code: "UA", carriers: [{ name: "Vodafone / Kyivstar / Lifecell", networks: ["4G"] }] },
    { name: "United Kingdom", code: "GB", carriers: [{ name: "Vodafone / EE / O2 / 3UK", networks: ["5G"] }] },
    { name: "Uruguay", code: "UY", carriers: [{ name: "Antel / Telefonica / Claro", networks: ["5G"] }] },
    { name: "USA", code: "US", carriers: [{ name: "AT&T / T-Mobile", networks: ["5G"] }] },
    { name: "Uzbekistan", code: "UZ", carriers: [{ name: "Unitel", networks: ["5G"] }] },
    { name: "Vanuatu", code: "VU", carriers: [{ name: "Digicel", networks: ["4G"] }] },
    { name: "Vatican City", code: "VA", carriers: [{ name: "Vodafone / TIM / WIND", networks: ["4G"] }] },
    { name: "Vietnam", code: "VN", carriers: [{ name: "Vinaphone / Mobifone / Viettel", networks: ["4G"] }] },
    { name: "Yemen", code: "YE", carriers: [{ name: "MTN Yemen", networks: ["4G"] }] },
    { name: "Zambia", code: "ZM", carriers: [{ name: "Airtel", networks: ["4G"] }] },
    { name: "San Marino", code: "SM", carriers: [{ name: "Vodafone / TIM / WIND", networks: ["4G"] }] }
  ]
};

/**
 * Get regional preset data based on package name or country name
 */
export const EUROPE_41: RegionalPackageData = {
  countries: [
    { name: 'Albania', code: 'AL', carriers: [{ name: 'Vodafone', networks: ['LTE'] }] },
    { name: 'Andorra', code: 'AD', carriers: [{ name: 'Mobiland STA', networks: ['5G'] }] },
    { name: 'Austria', code: 'AT', carriers: [{ name: 'A1', networks: ['5G'] }, { name: 'H3G', networks: ['5G'] }] },
    { name: 'Belarus', code: 'BY', carriers: [{ name: 'Unitary velcom', networks: ['LTE'] }, { name: 'BEST', networks: ['LTE'] }] },
    { name: 'Belgium', code: 'BE', carriers: [{ name: 'Orange', networks: ['5G'] }, { name: 'Proximus', networks: ['LTE'] }] },
    { name: 'Bosnia and Herzegovina', code: 'BA', carriers: [{ name: 'BH Telecom', networks: ['LTE'] }, { name: 'Eronet', networks: ['LTE'] }] },
    { name: 'Bulgaria', code: 'BG', carriers: [{ name: 'Vivacom', networks: ['5G'] }, { name: 'Mobitel A1', networks: ['5G'] }, { name: 'Telenor', networks: ['LTE'] }] },
    { name: 'Croatia', code: 'HR', carriers: [{ name: 'Telemach/TM', networks: ['5G'] }, { name: 'A1 Hrvatska', networks: ['LTE'] }] },
    { name: 'Cyprus', code: 'CY', carriers: [{ name: 'MTN', networks: ['5G'] }, { name: 'Primetel', networks: ['3G'] }] },
    { name: 'Czech Republic', code: 'CZ', carriers: [{ name: 'Vodafone', networks: ['LTE'] }, { name: 'O2', networks: ['5G'] }] },
    { name: 'Denmark', code: 'DK', carriers: [{ name: 'TDC', networks: ['5G'] }, { name: 'Sonofon Denmark', networks: ['LTE'] }, { name: 'Hi3G Danemark', networks: ['LTE'] }, { name: 'Telia', networks: ['5G'] }] },
    { name: 'Estonia', code: 'EE', carriers: [{ name: 'Telia', networks: ['5G'] }, { name: 'Tele2', networks: ['5G'] }] },
    { name: 'Faroe Islands', code: 'FO', carriers: [{ name: 'Vodafone', networks: ['LTE'] }] },
    { name: 'Finland', code: 'FI', carriers: [{ name: 'DNA', networks: ['5G'] }, { name: 'Elisa', networks: ['5G'] }] },
    { name: 'France', code: 'FR', carriers: [{ name: 'BOUYGUES TELECOM', networks: ['5G'] }, { name: 'Orange', networks: ['5G'] }, { name: 'SFR', networks: ['5G'] }] },
    { name: 'Georgia', code: 'GE', carriers: [{ name: 'Geocell', networks: ['LTE'] }] },
    { name: 'Germany', code: 'DE', carriers: [{ name: 'Vodafone', networks: ['LTE'] }, { name: 'O2', networks: ['5G'] }] },
    { name: 'Gibraltar', code: 'GI', carriers: [{ name: 'Gibtelecom', networks: ['5G'] }] },
    { name: 'Greece', code: 'GR', carriers: [{ name: 'Cosmote', networks: ['5G'] }, { name: 'Vodafone', networks: ['5G'] }, { name: 'Wind', networks: ['5G'] }] },
    { name: 'Hungary', code: 'HU', carriers: [{ name: 'Telenor', networks: ['5G'] }, { name: 'T-Mobile', networks: ['5G'] }] },
    { name: 'Iceland', code: 'IS', carriers: [{ name: 'Sýn hf.', networks: ['5G'] }, { name: 'Nova ehf.', networks: ['5G'] }] },
    { name: 'Ireland', code: 'IE', carriers: [{ name: 'Three Ireland', networks: ['5G'] }, { name: 'Meteor', networks: ['5G'] }, { name: 'Vodafone', networks: ['LTE'] }] },
    { name: 'Italy', code: 'IT', carriers: [{ name: 'TIM', networks: ['5G'] }, { name: 'Vodafone', networks: ['LTE'] }, { name: 'Wind', networks: ['5G'] }] },
    { name: 'Latvia', code: 'LV', carriers: [{ name: 'Tele2', networks: ['5G'] }, { name: 'SIA Bite Mobile', networks: ['LTE'] }, { name: 'LMT', networks: ['5G'] }] },
    { name: 'Liechtenstein', code: 'LI', carriers: [{ name: 'Telecom Liechtenstein', networks: ['LTE'] }] },
    { name: 'Lithuania', code: 'LT', carriers: [{ name: 'Bite', networks: ['5G'] }, { name: 'Telia', networks: ['5G'] }] },
    { name: 'Luxembourg', code: 'LU', carriers: [{ name: 'Tango SA', networks: ['LTE'] }, { name: 'Orange', networks: ['5G'] }] },
    { name: 'Malta', code: 'MT', carriers: [{ name: 'Vodafone', networks: ['5G'] }] },
    { name: 'Moldova', code: 'MD', carriers: [{ name: 'Orange', networks: ['LTE'] }] },
    { name: 'Montenegro', code: 'ME', carriers: [{ name: 'MTEL', networks: ['LTE'] }] },
    { name: 'Netherlands', code: 'NL', carriers: [{ name: 'KPN', networks: ['5G'] }] },
    { name: 'North Macedonia', code: 'MK', carriers: [{ name: 'A1 mk', networks: ['LTE'] }] },
    { name: 'Norway', code: 'NO', carriers: [{ name: 'TELENOR', networks: ['5G'] }, { name: 'Telia', networks: ['5G'] }] },
    { name: 'Poland', code: 'PL', carriers: [{ name: 'Play(P4)', networks: ['LTE'] }] },
    { name: 'Portugal', code: 'PT', carriers: [{ name: 'NOS', networks: ['5G'] }, { name: 'Vodafone', networks: ['LTE'] }] },
    { name: 'Romania', code: 'RO', carriers: [{ name: 'Vodafone', networks: ['LTE'] }, { name: 'Orange', networks: ['5G'] }] },
    { name: 'Serbia', code: 'RS', carriers: [{ name: 'Vip mobile', networks: ['LTE'] }, { name: 'Telekom', networks: ['LTE'] }] },
    { name: 'Slovakia', code: 'SK', carriers: [{ name: 'Orange', networks: ['5G'] }, { name: 'O2', networks: ['LTE'] }] },
    { name: 'Slovenia', code: 'SI', carriers: [{ name: 'Telemach', networks: ['5G'] }, { name: 'A1', networks: ['LTE'] }, { name: 'Mobitel', networks: ['5G'] }] },
    { name: 'Spain', code: 'ES', carriers: [{ name: 'YOIGO', networks: ['LTE'] }, { name: 'Vodafone', networks: ['LTE'] }] },
    { name: 'Sweden', code: 'SE', carriers: [{ name: 'Telenor', networks: ['5G'] }, { name: '3', networks: ['5G'] }] },
    { name: 'Switzerland', code: 'CH', carriers: [{ name: 'Salt', networks: ['5G'] }] },
    { name: 'Turkey', code: 'TR', carriers: [{ name: 'AVEA', networks: ['5G'] }] },
    { name: 'Ukraine', code: 'UA', carriers: [{ name: 'KyivStar', networks: ['LTE'] }, { name: 'MTS', networks: ['LTE'] }] },
    { name: 'United Kingdom', code: 'GB', carriers: [{ name: 'Telefonica UK', networks: ['5G'] }, { name: 'Vodafone', networks: ['LTE'] }, { name: 'H3G', networks: ['LTE'] }, { name: 'EE', networks: ['5G'] }] },
  ]
};

export const EUROPE_33: RegionalPackageData = {
  countries: [
    { name: 'Austria', code: 'AT', carriers: [{ name: 'H3G', networks: ['5G'] }, { name: 'T-Mobile', networks: ['5G'] }, { name: 'A1', networks: ['5G'] }] },
    { name: 'Belgium', code: 'BE', carriers: [{ name: 'Telenet', networks: ['4G'] }, { name: 'ORANGE', networks: ['5G'] }] },
    { name: 'Bulgaria', code: 'BG', carriers: [{ name: 'Mobiltel', networks: ['5G'] }, { name: 'Telenor', networks: ['LTE'] }, { name: 'Vivacom', networks: ['5G'] }] },
    { name: 'Switzerland', code: 'CH', carriers: [{ name: 'Swisscom', networks: ['5G'] }, { name: 'Sunrise', networks: ['5G'] }, { name: 'Salt', networks: ['5G'] }] },
    { name: 'Cyprus', code: 'CY', carriers: [{ name: 'CYTA', networks: ['LTE'] }, { name: 'Primetel', networks: ['3G'] }, { name: 'Epic', networks: ['4G'] }] },
    { name: 'Czech Republic', code: 'CZ', carriers: [{ name: 'Vodafone', networks: ['LTE'] }, { name: 'O2', networks: ['5G'] }, { name: 'T-Mobile', networks: ['5G'] }] },
    { name: 'Germany', code: 'DE', carriers: [{ name: 'T-Mobile', networks: ['5G'] }, { name: 'Vodafone', networks: ['LTE'] }] },
    { name: 'Denmark', code: 'DK', carriers: [{ name: 'Telenor', networks: ['LTE'] }, { name: 'HI3G', networks: ['LTE'] }, { name: 'Telia', networks: ['5G'] }, { name: 'TDC', networks: ['5G'] }, { name: 'nuuday', networks: ['4G'] }] },
    { name: 'Spain', code: 'ES', carriers: [{ name: 'Vodafone', networks: ['LTE'] }, { name: 'Orange', networks: ['5G'] }, { name: 'Yoigo', networks: ['LTE'] }] },
    { name: 'Estonia', code: 'EE', carriers: [{ name: 'Telia', networks: ['5G'] }, { name: 'Tele2', networks: ['5G'] }, { name: 'Elisa', networks: ['5G'] }] },
    { name: 'Finland', code: 'FI', carriers: [{ name: 'DNA', networks: ['5G'] }, { name: 'Elisa', networks: ['5G'] }, { name: 'Telia', networks: ['5G'] }] },
    { name: 'France', code: 'FR', carriers: [{ name: 'Orange', networks: ['5G'] }, { name: 'Bouygues', networks: ['5G'] }, { name: 'Free Mobile', networks: ['5G'] }] },
    { name: 'United Kingdom', code: 'GB', carriers: [{ name: 'H3G', networks: ['5G'] }, { name: 'EE', networks: ['5G'] }, { name: 'Vodafone', networks: ['LTE'] }] },
    { name: 'Greece', code: 'GR', carriers: [{ name: 'Cosmote', networks: ['5G'] }, { name: 'Vodafone', networks: ['5G'] }, { name: 'Wind(Nova)', networks: ['5G'] }] },
    { name: 'Croatia', code: 'HR', carriers: [{ name: 'Hrvatski', networks: ['5G'] }, { name: 'Tele2', networks: ['LTE'] }, { name: 'VIPnet', networks: ['LTE'] }] },
    { name: 'Hungary', code: 'HU', carriers: [{ name: 'Telenor', networks: ['5G'] }, { name: 'T-Mobile', networks: ['5G'] }, { name: 'Vodafone', networks: ['5G'] }] },
    { name: 'Ireland', code: 'IE', carriers: [{ name: 'H3G', networks: ['5G'] }, { name: 'Vodafone', networks: ['LTE'] }] },
    { name: 'Iceland', code: 'IS', carriers: [{ name: 'Landssiminn - ISLPS', networks: ['5G'] }] },
    { name: 'Italy', code: 'IT', carriers: [{ name: 'ILIAD', networks: ['5G'] }, { name: 'H3G', networks: ['5G'] }, { name: 'Vodafone', networks: ['LTE'] }, { name: 'Telecom', networks: ['5G'] }, { name: 'Wind', networks: ['5G'] }] },
    { name: 'Liechtenstein', code: 'LI', carriers: [{ name: 'Orange', networks: ['4G'] }, { name: 'Telecom AG', networks: ['LTE'] }] },
    { name: 'Lithuania', code: 'LT', carriers: [{ name: 'Tele2', networks: ['5G'] }, { name: 'Bite', networks: ['5G'] }, { name: 'Omnitel', networks: ['5G'] }] },
    { name: 'Luxembourg', code: 'LU', carriers: [{ name: 'Orange', networks: ['5G'] }] },
    { name: 'Latvia', code: 'LV', carriers: [{ name: 'Tele2', networks: ['5G'] }, { name: 'Bite', networks: ['LTE'] }, { name: 'Mobilais', networks: ['4G'] }] },
    { name: 'Moldova', code: 'MD', carriers: [{ name: 'Orange', networks: ['4G'] }] },
    { name: 'Malta', code: 'MT', carriers: [{ name: 'GO', networks: ['LTE'] }, { name: 'Vodafone', networks: ['5G'] }] },
    { name: 'Netherlands', code: 'NL', carriers: [{ name: 'Vodafone', networks: ['5G'] }, { name: 'Odido', networks: ['5G'] }, { name: 'KPN', networks: ['5G'] }, { name: 'Telfort', networks: ['4G'] }] },
    { name: 'Norway', code: 'NO', carriers: [{ name: 'Telia', networks: ['5G'] }, { name: 'Network AS', networks: ['4G'] }, { name: 'Telenor', networks: ['5G'] }] },
    { name: 'Portugal', code: 'PT', carriers: [{ name: 'Optimus', networks: ['LTE'] }, { name: 'Vodafone', networks: ['LTE'] }] },
    { name: 'Romania', code: 'RO', carriers: [{ name: 'DIGI', networks: ['4G'] }, { name: 'Telekom', networks: ['LTE'] }, { name: 'Vodafone', networks: ['LTE'] }, { name: 'Orange', networks: ['5G'] }] },
    { name: 'Slovakia', code: 'SK', carriers: [{ name: 'Slovak Telekom (DT)', networks: ['5G'] }, { name: 'Orange', networks: ['5G'] }, { name: 'O2', networks: ['LTE'] }] },
    { name: 'Slovenia', code: 'SI', carriers: [{ name: 'Telekom', networks: ['5G'] }, { name: 'A1', networks: ['LTE'] }, { name: 'Telemach', networks: ['5G'] }] },
    { name: 'Sweden', code: 'SE', carriers: [{ name: 'Telenor (Vodafone)', networks: ['5G'] }, { name: 'H3G', networks: ['5G'] }, { name: 'Tele2', networks: ['5G'] }, { name: 'Telia', networks: ['5G'] }] },
    { name: 'Ukraine', code: 'UA', carriers: [{ name: 'lifecell', networks: ['LTE'] }, { name: 'KyivStar', networks: ['LTE'] }, { name: 'Beeline', networks: ['LTE'] }, { name: 'KyivStar-RS', networks: ['LTE'] }, { name: 'MTS', networks: ['LTE'] }] },
  ]
};

export const AFRICA_18: RegionalPackageData = {
  countries: [
    { name: 'Congo (DR)', code: 'CD', carriers: [{ name: 'ZAIN', networks: ['4G'] }] },
    { name: 'Morocco', code: 'MA', carriers: [{ name: 'Orange', networks: ['4G'] }] },
    { name: 'Egypt', code: 'EG', carriers: [{ name: 'EMS Mobinil/Etisalat', networks: ['4G'] }] },
    { name: 'Congo', code: 'CG', carriers: [{ name: 'Airtel', networks: ['4G'] }] },
    { name: 'Tunisia', code: 'TN', carriers: [{ name: 'Tunisie Telecom/Ooredoo', networks: ['4G'] }] },
    { name: 'Uganda', code: 'UG', carriers: [{ name: 'Airtel/Warid', networks: ['4G'] }] },
    { name: 'Gabon', code: 'GA', carriers: [{ name: 'ZAIN/Celtel', networks: ['4G'] }] },
    { name: 'Kenya', code: 'KE', carriers: [{ name: 'Zain/Celtel', networks: ['4G'] }] },
    { name: 'Tanzania', code: 'TZ', carriers: [{ name: 'ZAIN/Celtel', networks: ['4G'] }] },
    { name: 'Chad', code: 'TD', carriers: [{ name: 'Zain/Airtel/Celtel', networks: ['4G'] }] },
    { name: 'Ghana', code: 'GH', carriers: [{ name: 'Vodafone', networks: ['4G'] }] },
    { name: 'Algeria', code: 'DZ', carriers: [{ name: 'Orascom', networks: ['4G'] }] },
    { name: 'Niger', code: 'NE', carriers: [{ name: 'Zain/CelTel', networks: ['4G'] }] },
    { name: 'Mauritius', code: 'MU', carriers: [{ name: 'Cellplus Mobile', networks: ['4G'] }] },
    { name: 'Malawi', code: 'MW', carriers: [{ name: 'Airtel', networks: ['4G'] }] },
    { name: 'Madagascar', code: 'MG', carriers: [{ name: 'Airtel', networks: ['4G'] }] },
    { name: 'Nigeria', code: 'NG', carriers: [{ name: 'Glo/Airtel/ZAIN', networks: ['4G'] }] },
    { name: 'Réunion', code: 'RE', carriers: [{ name: 'TELCO', networks: ['4G'] }] },
  ]
};

export function getRegionPresetForName(name: string): RegionalPackageData | null {
  const n = (name || '').toLowerCase();
  
  // Global 151 Countries (check first, most specific)
  if (n.includes('global') && n.includes('151')) {
    return GLOBAL_151;
  }
  
  // Global 109/111 Countries
  if (n.includes('global') && (n.includes('109') || n.includes('111'))) {
    return GLOBAL_109;
  }
  
  // Europe 42 + 2 Stopover (check before plain Europe 42)
  if (n.includes('europe') && n.includes('42') && (n.includes('stopover') || n.includes('2stopover'))) {
    return EUROPE_42_STOPOVER;
  }

  // Europe 42
  if (n.includes('europe') && n.includes('42')) {
    return EUROPE_42;
  }

  // Europe 41
  if (n.includes('europe') && n.includes('41')) {
    return EUROPE_41;
  }

  // Europe 33
  if (n.includes('europe') && n.includes('33')) {
    return EUROPE_33;
  }
  
  // Asia 13 Countries
  if (n.includes('asia') && n.includes('13')) {
    return ASIA_13;
  }
  
  // South East Asia 8 Countries (check before 3 to avoid false match on data amounts like "3GB")
  if ((n.includes('south east asia') || n.includes('sea')) && n.includes('8 countr')) {
    return ASIA_8;
  }
  
  // South East Asia 3 Countries / Singapore, Malaysia & Thailand
  if (((n.includes('south east asia') || n.includes('sea')) && n.includes('3 countr')) || n === 'singapore, malaysia & thailand') {
    return ASIA_3;
  }
  
  // Hong Kong/Macau (also matches "Hong Kong & Macau" display name)
  if ((n === 'hongkong/macau' || n === 'hong kong/macau' || n === 'hong kong & macau') && !n.includes('china')) {
    return HONGKONG_MACAU;
  }
  
  // China/Hong Kong/Macau (also matches "China, Hong Kong & Macau" display name)
  if ((n === 'china/hongkong/macau' || n === 'china/hong kong/macau' || n === 'china, hong kong & macau')) {
    return CHINA_HONGKONG_MACAU;
  }
  
  // Africa 18 Countries
  if (n.includes('africa') && n.includes('18')) {
    return AFRICA_18;
  }
  
  return null;
}
