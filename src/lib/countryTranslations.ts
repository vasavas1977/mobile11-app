// Multi-language country name mappings for search functionality
// Thai, Korean, French, German → English

export const thaiToEnglishCountry: Record<string, string> = {
  // === THAI ===
  // Southeast Asia
  'ไทย': 'Thailand',
  'ประเทศไทย': 'Thailand',
  'สิงคโปร์': 'Singapore',
  'มาเลเซีย': 'Malaysia',
  'อินโดนีเซีย': 'Indonesia',
  'เวียดนาม': 'Vietnam',
  'ฟิลิปปินส์': 'Philippines',
  'กัมพูชา': 'Cambodia',
  'ลาว': 'Laos',
  'เมียนมาร์': 'Myanmar',
  'พม่า': 'Myanmar',
  'บรูไน': 'Brunei',
  // East Asia
  'ญี่ปุ่น': 'Japan',
  'เกาหลี': 'South Korea',
  'เกาหลีใต้': 'South Korea',
  'จีน': 'China',
  'ไต้หวัน': 'Taiwan',
  'ฮ่องกง': 'Hongkong',
  'ฮ่องกง มาเก๊า': 'Hongkong Macau',
  'มาเก๊า': 'Macau',
  'มองโกเลีย': 'Mongolia',
  // South Asia
  'อินเดีย': 'India',
  'ปากีสถาน': 'Pakistan',
  'บังกลาเทศ': 'Bangladesh',
  'ศรีลังกา': 'Sri Lanka',
  'เนปาล': 'Nepal',
  'ภูฏาน': 'Bhutan',
  'มัลดีฟส์': 'Maldives',
  // Europe
  'ยุโรป': 'Europe',
  'อังกฤษ': 'United Kingdom',
  'สหราชอาณาจักร': 'United Kingdom',
  'ฝรั่งเศส': 'France',
  'เยอรมัน': 'Germany',
  'เยอรมนี': 'Germany',
  'อิตาลี': 'Italy',
  'สเปน': 'Spain',
  'โปรตุเกส': 'Portugal',
  'เนเธอร์แลนด์': 'Netherlands',
  'ฮอลแลนด์': 'Netherlands',
  'เบลเยียม': 'Belgium',
  'สวิตเซอร์แลนด์': 'Switzerland',
  'สวิส': 'Switzerland',
  'ออสเตรีย': 'Austria',
  'กรีซ': 'Greece',
  'โปแลนด์': 'Poland',
  'เช็ก': 'Czech Republic',
  'เช็กเกีย': 'Czech Republic',
  'ฮังการี': 'Hungary',
  'โรมาเนีย': 'Romania',
  'บัลแกเรีย': 'Bulgaria',
  'โครเอเชีย': 'Croatia',
  'สโลวาเกีย': 'Slovakia',
  'สโลวีเนีย': 'Slovenia',
  'เซอร์เบีย': 'Serbia',
  'ลิทัวเนีย': 'Lithuania',
  'ลัตเวีย': 'Latvia',
  'เอสโตเนีย': 'Estonia',
  'ไอซ์แลนด์': 'Iceland',
  'นอร์เวย์': 'Norway',
  'สวีเดน': 'Sweden',
  'ฟินแลนด์': 'Finland',
  'เดนมาร์ก': 'Denmark',
  'ไอร์แลนด์': 'Ireland',
  'รัสเซีย': 'Russia',
  'ยูเครน': 'Ukraine',
  'ตุรกี': 'Turkey',
  'เติร์กเมนิสถาน': 'Turkmenistan',
  // Americas
  'อเมริกา': 'United States',
  'สหรัฐอเมริกา': 'United States',
  'สหรัฐ': 'United States',
  'แคนาดา': 'Canada',
  'เม็กซิโก': 'Mexico',
  'บราซิล': 'Brazil',
  'อาร์เจนตินา': 'Argentina',
  'ชิลี': 'Chile',
  'โคลอมเบีย': 'Colombia',
  'เปรู': 'Peru',
  'เวเนซุเอลา': 'Venezuela',
  // Oceania
  'ออสเตรเลีย': 'Australia',
  'นิวซีแลนด์': 'New Zealand',
  'ฟิจิ': 'Fiji',
  // Middle East
  'ตะวันออกกลาง': 'Middle East',
  'สหรัฐอาหรับเอมิเรตส์': 'United Arab Emirates',
  'ยูเออี': 'United Arab Emirates',
  'ดูไบ': 'United Arab Emirates',
  'ซาอุดีอาระเบีย': 'Saudi Arabia',
  'กาตาร์': 'Qatar',
  'คูเวต': 'Kuwait',
  'บาห์เรน': 'Bahrain',
  'โอมาน': 'Oman',
  'อิสราเอล': 'Israel',
  'จอร์แดน': 'Jordan',
  'เลบานอน': 'Lebanon',
  // Africa
  'แอฟริกา': 'Africa',
  'แอฟริกาใต้': 'South Africa',
  'อียิปต์': 'Egypt',
  'โมร็อกโก': 'Morocco',
  'เคนยา': 'Kenya',
  'ไนจีเรีย': 'Nigeria',
  'กานา': 'Ghana',
  'ตูนิเซีย': 'Tunisia',
  'แทนซาเนีย': 'Tanzania',
  'ยูกันดา': 'Uganda',
  // Regional terms
  'เอเชีย': 'Asia',
  'เอเชียตะวันออกเฉียงใต้': 'Southeast Asia',
  'อาเซียน': 'Southeast Asia',
  'ทั่วโลก': 'Global',
  'โลก': 'Global',
  'ทวีปยุโรป': 'Europe',
  'ทวีปเอเชีย': 'Asia',
  'ทวีปอเมริกา': 'Americas',
  'ทวีปแอฟริกา': 'Africa',
  'ทวีปโอเชียเนีย': 'Oceania',
  // Package name terms
  '13 ประเทศ': '13 Countries',
  '42 ประเทศ': '42 Countries',
  '151 ประเทศ': '151 Countries',
  'ทั่วโลก 151': 'Global 151',
  'ยุโรป 42': 'Europe 42',
  'เอเชีย 13': 'Asia 13',

  // === KOREAN ===
  // East Asia
  '일본': 'Japan',
  '한국': 'South Korea',
  '대한민국': 'South Korea',
  '중국': 'China',
  '대만': 'Taiwan',
  '홍콩': 'Hongkong',
  '마카오': 'Macau',
  '몽골': 'Mongolia',
  // Southeast Asia
  '태국': 'Thailand',
  '싱가포르': 'Singapore',
  '말레이시아': 'Malaysia',
  '인도네시아': 'Indonesia',
  '베트남': 'Vietnam',
  '필리핀': 'Philippines',
  '캄보디아': 'Cambodia',
  '라오스': 'Laos',
  '미얀마': 'Myanmar',
  '브루나이': 'Brunei',
  // Europe
  '유럽': 'Europe',
  '영국': 'United Kingdom',
  '프랑스': 'France',
  '독일': 'Germany',
  '이탈리아': 'Italy',
  '스페인': 'Spain',
  '포르투갈': 'Portugal',
  '네덜란드': 'Netherlands',
  '벨기에': 'Belgium',
  '스위스': 'Switzerland',
  '오스트리아': 'Austria',
  '그리스': 'Greece',
  '폴란드': 'Poland',
  '체코': 'Czech Republic',
  '헝가리': 'Hungary',
  '루마니아': 'Romania',
  '크로아티아': 'Croatia',
  '아이슬란드': 'Iceland',
  '노르웨이': 'Norway',
  '스웨덴': 'Sweden',
  '핀란드': 'Finland',
  '덴마크': 'Denmark',
  '아일랜드': 'Ireland',
  '러시아': 'Russia',
  '우크라이나': 'Ukraine',
  '터키': 'Turkey',
  // Americas
  '미국': 'United States',
  '캐나다': 'Canada',
  '멕시코': 'Mexico',
  '브라질': 'Brazil',
  '아르헨티나': 'Argentina',
  '칠레': 'Chile',
  '콜롬비아': 'Colombia',
  '페루': 'Peru',
  // Oceania
  '호주': 'Australia',
  '뉴질랜드': 'New Zealand',
  // South Asia
  '인도': 'India',
  '파키스탄': 'Pakistan',
  '방글라데시': 'Bangladesh',
  '스리랑카': 'Sri Lanka',
  '네팔': 'Nepal',
  '몰디브': 'Maldives',
  // Middle East
  '아랍에미리트': 'United Arab Emirates',
  '두바이': 'United Arab Emirates',
  '사우디아라비아': 'Saudi Arabia',
  '카타르': 'Qatar',
  '이스라엘': 'Israel',
  // Regional
  '아시아': 'Asia',
  '동남아시아': 'Southeast Asia',
  '아세안': 'Southeast Asia',
  '전세계': 'Global',
  '글로벌': 'Global',
  '아프리카': 'Africa',

  // === FRENCH ===
  // East Asia
  'japon': 'Japan',
  'corée du sud': 'South Korea',
  'corée': 'South Korea',
  'chine': 'China',
  'taïwan': 'Taiwan',
  // Southeast Asia
  'thaïlande': 'Thailand',
  'singapour': 'Singapore',
  'malaisie': 'Malaysia',
  'indonésie': 'Indonesia',
  'viêt nam': 'Vietnam',
  'cambodge': 'Cambodia',
  // Europe
  'royaume-uni': 'United Kingdom',
  'angleterre': 'United Kingdom',
  'allemagne': 'Germany',
  'italie': 'Italy',
  'espagne': 'Spain',
  'pays-bas': 'Netherlands',
  'belgique': 'Belgium',
  'suisse': 'Switzerland',
  'autriche': 'Austria',
  'grèce': 'Greece',
  'pologne': 'Poland',
  'tchéquie': 'Czech Republic',
  'hongrie': 'Hungary',
  'roumanie': 'Romania',
  'croatie': 'Croatia',
  'islande': 'Iceland',
  'norvège': 'Norway',
  'suède': 'Sweden',
  'finlande': 'Finland',
  'danemark': 'Denmark',
  'irlande': 'Ireland',
  'russie': 'Russia',
  'turquie': 'Turkey',
  // Americas
  'états-unis': 'United States',
  'mexique': 'Mexico',
  'brésil': 'Brazil',
  'argentine': 'Argentina',
  'colombie': 'Colombia',
  'pérou': 'Peru',
  // Oceania
  'australie': 'Australia',
  'nouvelle-zélande': 'New Zealand',
  // South Asia
  'inde': 'India',
  'maldives': 'Maldives',
  'népal': 'Nepal',
  // Middle East
  'émirats arabes unis': 'United Arab Emirates',
  'arabie saoudite': 'Saudi Arabia',
  'israël': 'Israel',
  // Africa
  'afrique du sud': 'South Africa',
  'égypte': 'Egypt',
  'maroc': 'Morocco',
  'tunisie': 'Tunisia',
  'tanzanie': 'Tanzania',
  'ouganda': 'Uganda',
  // Regional
  'asie': 'Asia',
  'asie du sud-est': 'Southeast Asia',
  'mondial': 'Global',
  'monde': 'Global',
  'afrique': 'Africa',
  'océanie': 'Oceania',
  'amériques': 'Americas',

  // === GERMAN ===
  // East Asia
  'südkorea': 'South Korea',
  'korea': 'South Korea',
  // Southeast Asia
  'singapur': 'Singapore',
  'indonesien': 'Indonesia',
  'kambodscha': 'Cambodia',
  // Europe
  'europa': 'Europe',
  'großbritannien': 'United Kingdom',
  'vereinigtes königreich': 'United Kingdom',
  'england': 'United Kingdom',
  'deutschland': 'Germany',
  'frankreich': 'France',
  'italien': 'Italy',
  'spanien': 'Spain',
  'niederlande': 'Netherlands',
  'belgien': 'Belgium',
  'schweiz': 'Switzerland',
  'österreich': 'Austria',
  'griechenland': 'Greece',
  'polen': 'Poland',
  'tschechien': 'Czech Republic',
  'ungarn': 'Hungary',
  'rumänien': 'Romania',
  'kroatien': 'Croatia',
  'slowakei': 'Slovakia',
  'slowenien': 'Slovenia',
  'serbien': 'Serbia',
  'litauen': 'Lithuania',
  'lettland': 'Latvia',
  'estland': 'Estonia',
  'norwegen': 'Norway',
  'schweden': 'Sweden',
  'finnland': 'Finland',
  'dänemark': 'Denmark',
  'irland': 'Ireland',
  'russland': 'Russia',
  'türkei': 'Turkey',
  // Americas
  'vereinigte staaten': 'United States',
  'kanada': 'Canada',
  'mexiko': 'Mexico',
  'brasilien': 'Brazil',
  'argentinien': 'Argentina',
  'kolumbien': 'Colombia',
  // Oceania
  'australien': 'Australia',
  'neuseeland': 'New Zealand',
  // South Asia
  'indien': 'India',
  'malediven': 'Maldives',
  // Middle East
  'vereinigte arabische emirate': 'United Arab Emirates',
  'saudi-arabien': 'Saudi Arabia',
  'katar': 'Qatar',
  // Africa
  'südafrika': 'South Africa',
  'ägypten': 'Egypt',
  'marokko': 'Morocco',
  'tunesien': 'Tunisia',
  'tansania': 'Tanzania',
  // Regional
  'asien': 'Asia',
  'südostasien': 'Southeast Asia',
  'weltweit': 'Global',
  'welt': 'Global',
  'afrika': 'Africa',
  'ozeanien': 'Oceania',
  'amerika': 'Americas',

  // === SPANISH ===
  'japón': 'Japan',
  'corea del sur': 'South Korea',
  'tailandia': 'Thailand',
  // 'singapur' already covered by German
  'malasia': 'Malaysia',
  'taiwán': 'Taiwan',
  'estados unidos': 'United States',
  'reino unido': 'United Kingdom',
  // 'alemania' already covered by Portuguese below uses different word
  'españa': 'Spain',
  'países bajos': 'Netherlands',
  'suiza': 'Switzerland',
  'turquía': 'Turkey',
  'canadá': 'Canada',
  'méxico': 'Mexico',
  // 'brasil' covered by Portuguese
  'nueva zelanda': 'New Zealand',
  'arabia saudita': 'Saudi Arabia',
  'emiratos árabes unidos': 'United Arab Emirates',
  'egipto': 'Egypt',
  'marruecos': 'Morocco',
  'sudáfrica': 'South Africa',
  // 'europa' already covered by German
  'mundo': 'Global',
  'áfrica': 'Africa',
  'oceanía': 'Oceania',
  'américas': 'Americas',
  'sudeste asiático': 'Southeast Asia',

  // === PORTUGUESE ===
  'japão': 'Japan',
  'coreia do sul': 'South Korea',
  'coreia': 'South Korea',
  'tailândia': 'Thailand',
  'singapura': 'Singapore',
  'malásia': 'Malaysia',
  'vietnã': 'Vietnam',
  'indonésia': 'Indonesia',
  'austrália': 'Australia',
  'nova zelândia': 'New Zealand',
  'alemanha': 'Germany',
  'frança': 'France',
  'espanha': 'Spain',
  'itália': 'Italy',
  'países baixos': 'Netherlands',
  'suíça': 'Switzerland',
  'grécia': 'Greece',
  'turquia': 'Turkey',
  'rússia': 'Russia',
  'ucrânia': 'Ukraine',
  'arábia saudita': 'Saudi Arabia',
  'emirados árabes unidos': 'United Arab Emirates',
  'egito': 'Egypt',
  'marrocos': 'Morocco',
  'tunísia': 'Tunisia',
  'tanzânia': 'Tanzania',
  'índia': 'India',
  // 'sudeste asiático' already in Spanish section
  'mundial': 'Global',

  // === ARABIC ===
  'اليابان': 'Japan',
  'كوريا الجنوبية': 'South Korea',
  'كوريا': 'South Korea',
  'الصين': 'China',
  'تايوان': 'Taiwan',
  'تايلاند': 'Thailand',
  'سنغافورة': 'Singapore',
  'ماليزيا': 'Malaysia',
  'فيتنام': 'Vietnam',
  'إندونيسيا': 'Indonesia',
  'أستراليا': 'Australia',
  'نيوزيلندا': 'New Zealand',
  'الولايات المتحدة': 'United States',
  'المملكة المتحدة': 'United Kingdom',
  'فرنسا': 'France',
  'ألمانيا': 'Germany',
  'إيطاليا': 'Italy',
  'إسبانيا': 'Spain',
  'البرتغال': 'Portugal',
  'هولندا': 'Netherlands',
  'سويسرا': 'Switzerland',
  'تركيا': 'Turkey',
  'روسيا': 'Russia',
  'كندا': 'Canada',
  'المكسيك': 'Mexico',
  'البرازيل': 'Brazil',
  'الأرجنتين': 'Argentina',
  'المملكة العربية السعودية': 'Saudi Arabia',
  'الإمارات العربية المتحدة': 'United Arab Emirates',
  'مصر': 'Egypt',
  'المغرب': 'Morocco',
  'الهند': 'India',
  'أوروبا': 'Europe',
  'آسيا': 'Asia',
  'عالمي': 'Global',
  'أفريقيا': 'Africa',
};

// English → Localized country name mappings for display
const ENGLISH_TO_LOCALIZED: Record<string, Record<string, string>> = {
  th: {
    'Japan': 'ญี่ปุ่น', 'South Korea': 'เกาหลีใต้', 'China': 'จีน',
    'Singapore': 'สิงคโปร์', 'Vietnam': 'เวียดนาม', 'Taiwan': 'ไต้หวัน',
    'Thailand': 'ไทย', 'Indonesia': 'อินโดนีเซีย', 'Turkey': 'ตุรกี',
    'Australia': 'ออสเตรเลีย', 'Malaysia': 'มาเลเซีย',
    'United States': 'สหรัฐอเมริกา', 'United Kingdom': 'อังกฤษ',
    'France': 'ฝรั่งเศส', 'Germany': 'เยอรมนี', 'India': 'อินเดีย',
    'Hongkong': 'ฮ่องกง', 'Hongkong Macau': 'ฮ่องกง มาเก๊า', 'Macau': 'มาเก๊า',
    'Europe': 'ยุโรป', 'Global': 'ทั่วโลก', 'Turkey(Türkiye)': 'ตุรกี',
  },
  ja: {
    'Japan': '日本', 'South Korea': '韓国', 'China': '中国',
    'Singapore': 'シンガポール', 'Vietnam': 'ベトナム', 'Taiwan': '台湾',
    'Thailand': 'タイ', 'Indonesia': 'インドネシア', 'Turkey': 'トルコ',
    'Australia': 'オーストラリア', 'Malaysia': 'マレーシア',
    'United States': 'アメリカ', 'United Kingdom': 'イギリス',
    'France': 'フランス', 'Germany': 'ドイツ', 'India': 'インド',
    'Hongkong': '香港', 'Hongkong Macau': '香港・マカオ', 'Macau': 'マカオ',
    'Europe': 'ヨーロッパ', 'Global': 'グローバル', 'Turkey(Türkiye)': 'トルコ',
  },
  ko: {
    'Japan': '일본', 'South Korea': '한국', 'China': '중국',
    'Singapore': '싱가포르', 'Vietnam': '베트남', 'Taiwan': '대만',
    'Thailand': '태국', 'Indonesia': '인도네시아', 'Turkey': '터키',
    'Australia': '호주', 'Malaysia': '말레이시아',
    'United States': '미국', 'United Kingdom': '영국',
    'France': '프랑스', 'Germany': '독일', 'India': '인도',
    'Hongkong': '홍콩', 'Hongkong Macau': '홍콩·마카오', 'Macau': '마카오',
    'Europe': '유럽', 'Global': '글로벌', 'Turkey(Türkiye)': '터키',
  },
  fr: {
    'Japan': 'Japon', 'South Korea': 'Corée du Sud', 'China': 'Chine',
    'Singapore': 'Singapour', 'Vietnam': 'Viêt Nam', 'Taiwan': 'Taïwan',
    'Thailand': 'Thaïlande', 'Indonesia': 'Indonésie', 'Turkey': 'Turquie',
    'Australia': 'Australie', 'Malaysia': 'Malaisie',
    'United States': 'États-Unis', 'United Kingdom': 'Royaume-Uni',
    'France': 'France', 'Germany': 'Allemagne', 'India': 'Inde',
    'Hongkong': 'Hong Kong', 'Hongkong Macau': 'Hong Kong-Macao', 'Macau': 'Macao',
    'Europe': 'Europe', 'Global': 'Mondial', 'Turkey(Türkiye)': 'Turquie',
  },
  de: {
    'Japan': 'Japan', 'South Korea': 'Südkorea', 'China': 'China',
    'Singapore': 'Singapur', 'Vietnam': 'Vietnam', 'Taiwan': 'Taiwan',
    'Thailand': 'Thailand', 'Indonesia': 'Indonesien', 'Turkey': 'Türkei',
    'Australia': 'Australien', 'Malaysia': 'Malaysia',
    'United States': 'Vereinigte Staaten', 'United Kingdom': 'Großbritannien',
    'France': 'Frankreich', 'Germany': 'Deutschland', 'India': 'Indien',
    'Hongkong': 'Hongkong', 'Hongkong Macau': 'Hongkong-Macau', 'Macau': 'Macau',
    'Europe': 'Europa', 'Global': 'Weltweit', 'Turkey(Türkiye)': 'Türkei',
  },
  zh: {
    'Japan': '日本', 'South Korea': '韩国', 'China': '中国',
    'Singapore': '新加坡', 'Vietnam': '越南', 'Taiwan': '台湾',
    'Thailand': '泰国', 'Indonesia': '印度尼西亚', 'Turkey': '土耳其',
    'Australia': '澳大利亚', 'Malaysia': '马来西亚',
    'United States': '美国', 'United Kingdom': '英国',
    'France': '法国', 'Germany': '德国', 'India': '印度',
    'Hongkong': '香港', 'Hongkong Macau': '香港 澳门', 'Macau': '澳门',
    'Europe': '欧洲', 'Global': '全球', 'Turkey(Türkiye)': '土耳其',
  },
  es: {
    'Japan': 'Japón', 'South Korea': 'Corea del Sur', 'China': 'China',
    'Singapore': 'Singapur', 'Vietnam': 'Vietnam', 'Taiwan': 'Taiwán',
    'Thailand': 'Tailandia', 'Indonesia': 'Indonesia', 'Turkey': 'Turquía',
    'Australia': 'Australia', 'Malaysia': 'Malasia',
    'United States': 'Estados Unidos', 'United Kingdom': 'Reino Unido',
    'France': 'Francia', 'Germany': 'Alemania', 'India': 'India',
    'Hongkong': 'Hong Kong', 'Hongkong Macau': 'Hong Kong-Macao', 'Macau': 'Macao',
    'Europe': 'Europa', 'Global': 'Global', 'Turkey(Türkiye)': 'Turquía',
    'Brazil': 'Brasil', 'Canada': 'Canadá', 'Mexico': 'México',
    'Spain': 'España', 'Portugal': 'Portugal', 'Italy': 'Italia',
    'Netherlands': 'Países Bajos', 'Switzerland': 'Suiza',
    'Saudi Arabia': 'Arabia Saudita', 'United Arab Emirates': 'Emiratos Árabes Unidos',
  },
  pt: {
    'Japan': 'Japão', 'South Korea': 'Coreia do Sul', 'China': 'China',
    'Singapore': 'Singapura', 'Vietnam': 'Vietnã', 'Taiwan': 'Taiwan',
    'Thailand': 'Tailândia', 'Indonesia': 'Indonésia', 'Turkey': 'Turquia',
    'Australia': 'Austrália', 'Malaysia': 'Malásia',
    'United States': 'Estados Unidos', 'United Kingdom': 'Reino Unido',
    'France': 'França', 'Germany': 'Alemanha', 'India': 'Índia',
    'Hongkong': 'Hong Kong', 'Hongkong Macau': 'Hong Kong-Macau', 'Macau': 'Macau',
    'Europe': 'Europa', 'Global': 'Global', 'Turkey(Türkiye)': 'Turquia',
    'Brazil': 'Brasil', 'Canada': 'Canadá', 'Mexico': 'México',
    'Spain': 'Espanha', 'Portugal': 'Portugal', 'Italy': 'Itália',
    'Netherlands': 'Países Baixos', 'Switzerland': 'Suíça',
    'Saudi Arabia': 'Arábia Saudita', 'United Arab Emirates': 'Emirados Árabes Unidos',
  },
  ar: {
    'Japan': 'اليابان', 'South Korea': 'كوريا الجنوبية', 'China': 'الصين',
    'Singapore': 'سنغافورة', 'Vietnam': 'فيتنام', 'Taiwan': 'تايوان',
    'Thailand': 'تايلاند', 'Indonesia': 'إندونيسيا', 'Turkey': 'تركيا',
    'Australia': 'أستراليا', 'Malaysia': 'ماليزيا',
    'United States': 'الولايات المتحدة', 'United Kingdom': 'المملكة المتحدة',
    'France': 'فرنسا', 'Germany': 'ألمانيا', 'India': 'الهند',
    'Hongkong': 'هونغ كونغ', 'Hongkong Macau': 'هونغ كونغ-ماكاو', 'Macau': 'ماكاو',
    'Europe': 'أوروبا', 'Global': 'عالمي', 'Turkey(Türkiye)': 'تركيا',
    'Brazil': 'البرازيل', 'Canada': 'كندا', 'Mexico': 'المكسيك',
    'Spain': 'إسبانيا', 'Portugal': 'البرتغال', 'Italy': 'إيطاليا',
    'Netherlands': 'هولندا', 'Switzerland': 'سويسرا',
    'Saudi Arabia': 'المملكة العربية السعودية', 'United Arab Emirates': 'الإمارات العربية المتحدة',
  },
};

/**
 * Returns the localized country name for display purposes.
 * Falls back to the English name if no translation exists.
 */
export function getLocalizedCountryName(englishName: string, language: string): string {
  if (!englishName || language === 'en') return englishName;
  
  const localeMap = ENGLISH_TO_LOCALIZED[language];
  if (!localeMap) return englishName;
  
  // Try exact match first
  if (localeMap[englishName]) return localeMap[englishName];
  
  // Try partial match for compound names like "Europe 42 Countries"
  for (const [key, value] of Object.entries(localeMap)) {
    if (englishName.startsWith(key)) {
      return englishName.replace(key, value);
    }
  }
  
  return englishName;
}

/**
 * Translates Thai search terms to English equivalents for country/region searching
 * Returns an array of possible English terms to search for
 */
export function translateSearchTerm(term: string): string[] {
  if (!term) return [];
  
  const normalizedTerm = term.trim().toLowerCase();
  const matches: string[] = [];
  
  // Check for exact and partial Thai matches
  Object.entries(thaiToEnglishCountry).forEach(([thai, english]) => {
    const normalizedThai = thai.toLowerCase();
    
    // Exact match
    if (normalizedThai === normalizedTerm) {
      matches.push(english.toLowerCase());
    }
    // Partial match (Thai contains search term OR search term contains Thai word)
    else if (normalizedThai.includes(normalizedTerm) || normalizedTerm.includes(normalizedThai)) {
      matches.push(english.toLowerCase());
    }
  });
  
  // Always include the original term for English searches
  matches.push(normalizedTerm);
  
  // Remove duplicates and return
  return [...new Set(matches)];
}
