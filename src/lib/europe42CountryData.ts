// Europe 42 Countries data for interactive blog explorer

export interface EuropeCountryData {
  name: string;
  code: string;
  flag: string;
  costIndex: number; // 1-10 (10 = most expensive)
  beautyScore: number; // 1-5 stars
  networkSpeed: '5G' | '4G' | '3G';
  avgSpeed: string;
  region: 'Western' | 'Eastern' | 'Northern' | 'Southern' | 'Balkans' | 'British Isles' | 'Microstates';
  highlight: string;
  highlightTh: string;
  esimTip: string;
  esimTipTh: string;
  carriers: string[];
  image?: string;
}

export const EUROPE_42_COUNTRIES: EuropeCountryData[] = [
  // Western Europe
  {
    name: 'France',
    code: 'FR',
    flag: '🇫🇷',
    costIndex: 7,
    beautyScore: 5,
    networkSpeed: '5G',
    avgSpeed: '120 Mbps',
    region: 'Western',
    highlight: 'Eiffel Tower, Provence lavender, wine country',
    highlightTh: 'หอไอเฟล ทุ่งลาเวนเดอร์ ดินแดนไวน์',
    esimTip: 'Paris Metro has excellent 4G coverage underground',
    esimTipTh: 'รถไฟใต้ดินปารีสมีสัญญาณ 4G ดีมาก',
    carriers: ['SFR', 'Orange', 'Bouygues']
  },
  {
    name: 'Germany',
    code: 'DE',
    flag: '🇩🇪',
    costIndex: 6,
    beautyScore: 4,
    networkSpeed: '5G',
    avgSpeed: '110 Mbps',
    region: 'Western',
    highlight: 'Brandenburg Gate, Neuschwanstein Castle, beer halls',
    highlightTh: 'ประตูบรันเดนเบิร์ก ปราสาทนอยชวานสไตน์ โรงเบียร์',
    esimTip: 'Download offline maps for rural Bavaria',
    esimTipTh: 'ดาวน์โหลดแผนที่ออฟไลน์สำหรับชนบทบาวาเรีย',
    carriers: ['Vodafone', 'Telefonica O2']
  },
  {
    name: 'Netherlands',
    code: 'NL',
    flag: '🇳🇱',
    costIndex: 7,
    beautyScore: 4,
    networkSpeed: '5G',
    avgSpeed: '130 Mbps',
    region: 'Western',
    highlight: 'Amsterdam canals, tulip fields, windmills',
    highlightTh: 'คลองอัมสเตอร์ดัม ทุ่งทิวลิป กังหันลม',
    esimTip: 'One of Europe\'s fastest mobile networks',
    esimTipTh: 'เครือข่ายมือถือเร็วที่สุดในยุโรป',
    carriers: ['Vodafone', 'KPN']
  },
  {
    name: 'Belgium',
    code: 'BE',
    flag: '🇧🇪',
    costIndex: 6,
    beautyScore: 4,
    networkSpeed: '5G',
    avgSpeed: '100 Mbps',
    region: 'Western',
    highlight: 'Grand Place, chocolate, medieval towns',
    highlightTh: 'กร็องปลาส ช็อกโกแลต เมืองยุคกลาง',
    esimTip: 'Perfect for day trips to multiple countries',
    esimTipTh: 'เหมาะสำหรับเที่ยวหลายประเทศในวันเดียว',
    carriers: ['Proximus', 'Orange', 'Base']
  },
  {
    name: 'Luxembourg',
    code: 'LU',
    flag: '🇱🇺',
    costIndex: 8,
    beautyScore: 3,
    networkSpeed: '5G',
    avgSpeed: '95 Mbps',
    region: 'Western',
    highlight: 'Old Town fortress, banking capital',
    highlightTh: 'ป้อมปราการเมืองเก่า เมืองหลวงการเงิน',
    esimTip: 'Small country, excellent coverage everywhere',
    esimTipTh: 'ประเทศเล็ก สัญญาณดีทั่วถึง',
    carriers: ['TANGO', 'POST', 'Orange']
  },
  {
    name: 'Austria',
    code: 'AT',
    flag: '🇦🇹',
    costIndex: 7,
    beautyScore: 5,
    networkSpeed: '5G',
    avgSpeed: '105 Mbps',
    region: 'Western',
    highlight: 'Hallstatt, Vienna palaces, Alpine skiing',
    highlightTh: 'ฮัลล์สตัทท์ พระราชวังเวียนนา สกีเทือกเขาแอลป์',
    esimTip: 'Mountainous areas may have slower speeds',
    esimTipTh: 'พื้นที่ภูเขาอาจมีสัญญาณช้า',
    carriers: ['T-Mobile', 'Orange', 'A1']
  },
  {
    name: 'Switzerland',
    code: 'CH',
    flag: '🇨🇭',
    costIndex: 10,
    beautyScore: 5,
    networkSpeed: '5G',
    avgSpeed: '140 Mbps',
    region: 'Western',
    highlight: 'Matterhorn, Swiss Alps, luxury watches',
    highlightTh: 'มัทเทอร์ฮอร์น สวิสแอลป์ นาฬิกาหรู',
    esimTip: 'Excellent network even in mountain tunnels',
    esimTipTh: 'เครือข่ายดีแม้ในอุโมงค์ภูเขา',
    carriers: ['Sunrise', 'SALT']
  },

  // Northern Europe
  {
    name: 'Denmark',
    code: 'DK',
    flag: '🇩🇰',
    costIndex: 8,
    beautyScore: 4,
    networkSpeed: '5G',
    avgSpeed: '125 Mbps',
    region: 'Northern',
    highlight: 'Copenhagen, Nyhavn, hygge culture',
    highlightTh: 'โคเปนเฮเกน นีฮาวน์ วัฒนธรรมฮุกเกอ',
    esimTip: 'Consistently fast speeds across the country',
    esimTipTh: 'ความเร็วสม่ำเสมอทั่วประเทศ',
    carriers: ['TDC', 'Telia', 'Telenor', 'Hi3G']
  },
  {
    name: 'Sweden',
    code: 'SE',
    flag: '🇸🇪',
    costIndex: 8,
    beautyScore: 4,
    networkSpeed: '5G',
    avgSpeed: '115 Mbps',
    region: 'Northern',
    highlight: 'Stockholm archipelago, ABBA museum, Northern Lights',
    highlightTh: 'หมู่เกาะสตอกโฮล์ม พิพิธภัณฑ์ ABBA แสงเหนือ',
    esimTip: 'Northern Sweden may have limited coverage',
    esimTipTh: 'สวีเดนตอนเหนืออาจมีสัญญาณจำกัด',
    carriers: ['Telenor', 'TeliaSonera', 'Tele2']
  },
  {
    name: 'Norway',
    code: 'NO',
    flag: '🇳🇴',
    costIndex: 10,
    beautyScore: 5,
    networkSpeed: '5G',
    avgSpeed: '120 Mbps',
    region: 'Northern',
    highlight: 'Fjords, Northern Lights, midnight sun',
    highlightTh: 'ฟยอร์ด แสงเหนือ พระอาทิตย์เที่ยงคืน',
    esimTip: 'Download offline content for remote fjord areas',
    esimTipTh: 'ดาวน์โหลดคอนเทนต์สำหรับพื้นที่ฟยอร์ด',
    carriers: ['Telia', 'Telenor']
  },
  {
    name: 'Finland',
    code: 'FI',
    flag: '🇫🇮',
    costIndex: 7,
    beautyScore: 4,
    networkSpeed: '5G',
    avgSpeed: '110 Mbps',
    region: 'Northern',
    highlight: 'Lapland, Santa Claus Village, saunas',
    highlightTh: 'แลปแลนด์ หมู่บ้านซานตาคลอส ซาวน่า',
    esimTip: 'Finland pioneered mobile technology - excellent coverage',
    esimTipTh: 'ฟินแลนด์เป็นผู้บุกเบิกเทคโนโลยีมือถือ - สัญญาณดีเยี่ยม',
    carriers: ['Elisa', 'Alcom', 'DNA']
  },
  {
    name: 'Iceland',
    code: 'IS',
    flag: '🇮🇸',
    costIndex: 9,
    beautyScore: 5,
    networkSpeed: '5G',
    avgSpeed: '95 Mbps',
    region: 'Northern',
    highlight: 'Blue Lagoon, Golden Circle, glaciers',
    highlightTh: 'บลูลากูน วงแหวนทอง ธารน้ำแข็ง',
    esimTip: 'Highland interior has no coverage - plan accordingly',
    esimTipTh: 'พื้นที่ตอนในไม่มีสัญญาณ - วางแผนล่วงหน้า',
    carriers: ['Siminn', 'Nova']
  },
  {
    name: 'Estonia',
    code: 'EE',
    flag: '🇪🇪',
    costIndex: 4,
    beautyScore: 3,
    networkSpeed: '5G',
    avgSpeed: '90 Mbps',
    region: 'Northern',
    highlight: 'Tallinn Old Town, digital society, forests',
    highlightTh: 'เมืองเก่าทาลลินน์ สังคมดิจิทัล ป่าไม้',
    esimTip: 'Most digitally advanced country in Europe',
    esimTipTh: 'ประเทศที่ก้าวหน้าทางดิจิทัลที่สุดในยุโรป',
    carriers: ['Tele2', 'Elisa', 'EMT']
  },
  {
    name: 'Latvia',
    code: 'LV',
    flag: '🇱🇻',
    costIndex: 4,
    beautyScore: 3,
    networkSpeed: '5G',
    avgSpeed: '85 Mbps',
    region: 'Northern',
    highlight: 'Riga Art Nouveau, Baltic beaches',
    highlightTh: 'ศิลปะอาร์ตนูโวริกา ชายหาดบอลติก',
    esimTip: 'Great value for Eastern European travel',
    esimTipTh: 'คุ้มค่าสำหรับเที่ยวยุโรปตะวันออก',
    carriers: ['BITE', 'Tele2']
  },
  {
    name: 'Lithuania',
    code: 'LT',
    flag: '🇱🇹',
    costIndex: 4,
    beautyScore: 3,
    networkSpeed: '5G',
    avgSpeed: '85 Mbps',
    region: 'Northern',
    highlight: 'Vilnius baroque architecture, Hill of Crosses',
    highlightTh: 'สถาปัตยกรรมบาโรกวิลนีอุส เนินไม้กางเขน',
    esimTip: 'Affordable gateway to the Baltics',
    esimTipTh: 'ประตูราคาประหยัดสู่บอลติก',
    carriers: ['BITE', 'Tele2']
  },

  // Southern Europe
  {
    name: 'Italy',
    code: 'IT',
    flag: '🇮🇹',
    costIndex: 6,
    beautyScore: 5,
    networkSpeed: '5G',
    avgSpeed: '100 Mbps',
    region: 'Southern',
    highlight: 'Colosseum, Venice canals, Amalfi Coast',
    highlightTh: 'โคลอสเซียม คลองเวนิส อามาลฟีโคสต์',
    esimTip: 'Coverage varies in rural Tuscany - download offline maps',
    esimTipTh: 'สัญญาณไม่แน่นอนในชนบททัสคานี',
    carriers: ['Vodafone', 'TIM', 'WIND', 'Iliad']
  },
  {
    name: 'Spain',
    code: 'ES',
    flag: '🇪🇸',
    costIndex: 5,
    beautyScore: 5,
    networkSpeed: '5G',
    avgSpeed: '95 Mbps',
    region: 'Southern',
    highlight: 'Sagrada Familia, Alhambra, tapas culture',
    highlightTh: 'ซากราดาฟามิเลีย อัลฮัมบรา วัฒนธรรมทาปาส',
    esimTip: 'Excellent coverage in cities and coastal areas',
    esimTipTh: 'สัญญาณดีในเมืองและชายฝั่ง',
    carriers: ['Orange', 'Telefonica', 'Vodafone', 'Xfera']
  },
  {
    name: 'Portugal',
    code: 'PT',
    flag: '🇵🇹',
    costIndex: 5,
    beautyScore: 5,
    networkSpeed: '5G',
    avgSpeed: '90 Mbps',
    region: 'Southern',
    highlight: 'Lisbon trams, Porto wine, Algarve beaches',
    highlightTh: 'รถรางลิสบอน ไวน์ปอร์โต หาดอัลการ์ฟ',
    esimTip: 'Great speeds for the price point',
    esimTipTh: 'ความเร็วดีสำหรับราคา',
    carriers: ['MEO', 'NOS', 'Vodafone']
  },
  {
    name: 'Greece',
    code: 'GR',
    flag: '🇬🇷',
    costIndex: 5,
    beautyScore: 5,
    networkSpeed: '5G',
    avgSpeed: '85 Mbps',
    region: 'Southern',
    highlight: 'Santorini sunsets, Acropolis, island hopping',
    highlightTh: 'พระอาทิตย์ตกซานโตรินี อะโครโพลิส เที่ยวเกาะ',
    esimTip: 'Island coverage varies - check before sailing',
    esimTipTh: 'สัญญาณบนเกาะไม่แน่นอน - ตรวจสอบก่อนเดินทาง',
    carriers: ['Vodafone', 'Cosmote', 'Wind Hellas']
  },
  {
    name: 'Malta',
    code: 'MT',
    flag: '🇲🇹',
    costIndex: 5,
    beautyScore: 4,
    networkSpeed: '5G',
    avgSpeed: '80 Mbps',
    region: 'Southern',
    highlight: 'Valletta, ancient temples, Blue Grotto',
    highlightTh: 'วัลเลตตา วิหารโบราณ บลูกร็อตโต',
    esimTip: 'Small island, consistent coverage',
    esimTipTh: 'เกาะเล็ก สัญญาณสม่ำเสมอ',
    carriers: ['Epic', 'GO']
  },
  {
    name: 'Cyprus',
    code: 'CY',
    flag: '🇨🇾',
    costIndex: 5,
    beautyScore: 4,
    networkSpeed: '5G',
    avgSpeed: '75 Mbps',
    region: 'Southern',
    highlight: 'Mediterranean beaches, ancient ruins',
    highlightTh: 'ชายหาดเมดิเตอร์เรเนียน ซากปรักหักพังโบราณ',
    esimTip: 'Note: Northern Cyprus may have different coverage',
    esimTipTh: 'หมายเหตุ: ไซปรัสเหนืออาจมีสัญญาณต่างกัน',
    carriers: ['MTN', 'CYTA']
  },

  // Eastern Europe
  {
    name: 'Poland',
    code: 'PL',
    flag: '🇵🇱',
    costIndex: 3,
    beautyScore: 4,
    networkSpeed: '5G',
    avgSpeed: '80 Mbps',
    region: 'Eastern',
    highlight: 'Krakow Old Town, Auschwitz, Tatra Mountains',
    highlightTh: 'เมืองเก่าคราคูฟ เอาช์วิทซ์ เทือกเขาทาทรา',
    esimTip: 'Excellent value - one of Europe\'s cheapest destinations',
    esimTipTh: 'คุ้มค่ามาก - ที่เที่ยวราคาถูกที่สุดในยุโรป',
    carriers: ['Orange', 'T-Mobile', 'P4', 'Polkomtel']
  },
  {
    name: 'Czech Republic',
    code: 'CZ',
    flag: '🇨🇿',
    costIndex: 4,
    beautyScore: 5,
    networkSpeed: '5G',
    avgSpeed: '85 Mbps',
    region: 'Eastern',
    highlight: 'Prague Castle, Charles Bridge, beer culture',
    highlightTh: 'ปราสาทปราก สะพานชาร์ลส์ วัฒนธรรมเบียร์',
    esimTip: 'Prague has excellent metro coverage',
    esimTipTh: 'ปรากมีสัญญาณรถไฟใต้ดินดีมาก',
    carriers: ['Vodafone', 'T-Mobile']
  },
  {
    name: 'Hungary',
    code: 'HU',
    flag: '🇭🇺',
    costIndex: 3,
    beautyScore: 4,
    networkSpeed: '5G',
    avgSpeed: '80 Mbps',
    region: 'Eastern',
    highlight: 'Budapest Parliament, thermal baths, ruin bars',
    highlightTh: 'รัฐสภาบูดาเปสต์ บ่อน้ำพุร้อน รูอินบาร์',
    esimTip: 'Budapest has one of Europe\'s best metro networks',
    esimTipTh: 'บูดาเปสต์มีเครือข่ายรถไฟใต้ดินดีที่สุด',
    carriers: ['Telenor', 'Vodafone', 'T-Mobile']
  },
  {
    name: 'Romania',
    code: 'RO',
    flag: '🇷🇴',
    costIndex: 2,
    beautyScore: 4,
    networkSpeed: '4G',
    avgSpeed: '70 Mbps',
    region: 'Eastern',
    highlight: 'Bran Castle, Transylvania, Bucharest',
    highlightTh: 'ปราสาทบราน ทรานซิลเวเนีย บูคาเรสต์',
    esimTip: 'One of Europe\'s cheapest destinations with good coverage',
    esimTipTh: 'ที่เที่ยวราคาถูกที่สุดกับสัญญาณดี',
    carriers: ['Vodafone']
  },
  {
    name: 'Bulgaria',
    code: 'BG',
    flag: '🇧🇬',
    costIndex: 2,
    beautyScore: 3,
    networkSpeed: '3G',
    avgSpeed: '45 Mbps',
    region: 'Eastern',
    highlight: 'Rila Monastery, Black Sea coast, ski resorts',
    highlightTh: 'อารามริลา ชายฝั่งทะเลดำ รีสอร์ทสกี',
    esimTip: 'Budget destination - 3G in rural areas',
    esimTipTh: 'ที่เที่ยวงบประหยัด - 3G ในชนบท',
    carriers: ['Mobitel', 'Yettel']
  },
  {
    name: 'Slovakia',
    code: 'SK',
    flag: '🇸🇰',
    costIndex: 4,
    beautyScore: 4,
    networkSpeed: '5G',
    avgSpeed: '80 Mbps',
    region: 'Eastern',
    highlight: 'High Tatras, castles, Bratislava',
    highlightTh: 'ไฮทาทราส ปราสาท บราติสลาวา',
    esimTip: 'Great for combining with Czech Republic trip',
    esimTipTh: 'เหมาะสำหรับเที่ยวรวมกับสาธารณรัฐเช็ก',
    carriers: ['O2', 'Slovak Telecom', 'Orange']
  },
  {
    name: 'Slovenia',
    code: 'SI',
    flag: '🇸🇮',
    costIndex: 5,
    beautyScore: 5,
    networkSpeed: '5G',
    avgSpeed: '85 Mbps',
    region: 'Eastern',
    highlight: 'Lake Bled, Ljubljana, Julian Alps',
    highlightTh: 'ทะเลสาบเบลด ลูบลิยานา เทือกเขาจูเลียน',
    esimTip: 'Compact country with excellent coverage',
    esimTipTh: 'ประเทศเล็กกะทัดรัด สัญญาณดีทั่วถึง',
    carriers: ['Telekom', 'Telemach', 'A1']
  },
  {
    name: 'Croatia',
    code: 'HR',
    flag: '🇭🇷',
    costIndex: 5,
    beautyScore: 5,
    networkSpeed: '5G',
    avgSpeed: '85 Mbps',
    region: 'Eastern',
    highlight: 'Dubrovnik walls, Plitvice Lakes, island hopping',
    highlightTh: 'กำแพงดูบรอฟนิก ทะเลสาบพลิตวิเซ เที่ยวเกาะ',
    esimTip: 'Islands have good coverage for tourists',
    esimTipTh: 'เกาะมีสัญญาณดีสำหรับนักท่องเที่ยว',
    carriers: ['T-Mobile', 'A1', 'Telemach']
  },
  {
    name: 'Ukraine',
    code: 'UA',
    flag: '🇺🇦',
    costIndex: 2,
    beautyScore: 3,
    networkSpeed: '4G',
    avgSpeed: '50 Mbps',
    region: 'Eastern',
    highlight: 'Kyiv, Lviv Old Town, Carpathian Mountains',
    highlightTh: 'เคียฟ เมืองเก่าลวิฟ เทือกเขาคาร์เพเธียน',
    esimTip: 'Check travel advisories before visiting',
    esimTipTh: 'ตรวจสอบคำแนะนำการเดินทางก่อนไป',
    carriers: ['Vodafone', 'Kyivstar']
  },

  // Balkans
  {
    name: 'Serbia',
    code: 'RS',
    flag: '🇷🇸',
    costIndex: 2,
    beautyScore: 3,
    networkSpeed: '4G',
    avgSpeed: '60 Mbps',
    region: 'Balkans',
    highlight: 'Belgrade nightlife, Novi Sad, monasteries',
    highlightTh: 'ไนท์ไลฟ์เบลเกรด โนวีซาด วัด',
    esimTip: 'Affordable alternative to Western Europe',
    esimTipTh: 'ทางเลือกราคาประหยัดแทนยุโรปตะวันตก',
    carriers: ['Telenor', 'Telekom', 'A1']
  },
  {
    name: 'Albania',
    code: 'AL',
    flag: '🇦🇱',
    costIndex: 2,
    beautyScore: 4,
    networkSpeed: '4G',
    avgSpeed: '55 Mbps',
    region: 'Balkans',
    highlight: 'Albanian Riviera, Berat, Gjirokaster',
    highlightTh: 'ริเวียร่าแอลเบเนีย เบรัต กีโรคาสเตอร์',
    esimTip: 'Hidden gem - coverage improving rapidly',
    esimTipTh: 'อัญมณีซ่อนเร้น - สัญญาณดีขึ้นเรื่อยๆ',
    carriers: ['Vodafone']
  },
  {
    name: 'Turkey',
    code: 'TR',
    flag: '🇹🇷',
    costIndex: 3,
    beautyScore: 5,
    networkSpeed: '4G',
    avgSpeed: '65 Mbps',
    region: 'Balkans',
    highlight: 'Istanbul, Cappadocia, Mediterranean coast',
    highlightTh: 'อิสตันบูล คัปปาโดเกีย ชายฝั่งเมดิเตอร์เรเนียน',
    esimTip: 'Excellent coverage in tourist areas',
    esimTipTh: 'สัญญาณดีในพื้นที่ท่องเที่ยว',
    carriers: ['Turkcell']
  },

  // British Isles
  {
    name: 'United Kingdom',
    code: 'GB',
    flag: '🇬🇧',
    costIndex: 7,
    beautyScore: 4,
    networkSpeed: '5G',
    avgSpeed: '100 Mbps',
    region: 'British Isles',
    highlight: 'Big Ben, Scottish Highlands, Stonehenge',
    highlightTh: 'บิ๊กเบน ไฮแลนด์สก็อตแลนด์ สโตนเฮนจ์',
    esimTip: 'London Underground has 4G coverage',
    esimTipTh: 'รถไฟใต้ดินลอนดอนมีสัญญาณ 4G',
    carriers: ['Vodafone', 'EE', 'O2', '3UK']
  },
  {
    name: 'Ireland',
    code: 'IE',
    flag: '🇮🇪',
    costIndex: 7,
    beautyScore: 5,
    networkSpeed: '5G',
    avgSpeed: '90 Mbps',
    region: 'British Isles',
    highlight: 'Cliffs of Moher, Dublin pubs, Ring of Kerry',
    highlightTh: 'หน้าผาโมเฮอร์ ผับดับลิน วงแหวนเคอร์รี',
    esimTip: 'Rural Wild Atlantic Way may have gaps',
    esimTipTh: 'ชนบท Wild Atlantic Way อาจมีช่องว่างสัญญาณ',
    carriers: ['Meteor', 'Hutchison']
  },
  {
    name: 'Jersey',
    code: 'JE',
    flag: '🇯🇪',
    costIndex: 7,
    beautyScore: 3,
    networkSpeed: '4G',
    avgSpeed: '70 Mbps',
    region: 'British Isles',
    highlight: 'Channel Islands, beaches, tax haven',
    highlightTh: 'หมู่เกาะแชนแนล หาด เขตปลอดภาษี',
    esimTip: 'Small island with reliable coverage',
    esimTipTh: 'เกาะเล็กกับสัญญาณเสถียร',
    carriers: []
  },
  {
    name: 'Guernsey',
    code: 'GG',
    flag: '🇬🇬',
    costIndex: 7,
    beautyScore: 3,
    networkSpeed: '4G',
    avgSpeed: '65 Mbps',
    region: 'British Isles',
    highlight: 'Island charm, WWII history, cliffs',
    highlightTh: 'เสน่ห์เกาะ ประวัติศาสตร์ WWII หน้าผา',
    esimTip: 'Compact island, easy to navigate',
    esimTipTh: 'เกาะกะทัดรัด เดินทางง่าย',
    carriers: []
  },
  {
    name: 'Isle of Man',
    code: 'IM',
    flag: '🇮🇲',
    costIndex: 6,
    beautyScore: 3,
    networkSpeed: '4G',
    avgSpeed: '65 Mbps',
    region: 'British Isles',
    highlight: 'TT motorcycle race, Celtic heritage',
    highlightTh: 'แข่งมอเตอร์ไซค์ TT มรดกเซลติก',
    esimTip: 'Good coverage for motorcycle routes',
    esimTipTh: 'สัญญาณดีสำหรับเส้นทางมอเตอร์ไซค์',
    carriers: []
  },

  // Microstates
  {
    name: 'Monaco',
    code: 'MC',
    flag: '🇲🇨',
    costIndex: 10,
    beautyScore: 4,
    networkSpeed: '5G',
    avgSpeed: '100 Mbps',
    region: 'Microstates',
    highlight: 'Monte Carlo casino, F1 Grand Prix, yachts',
    highlightTh: 'คาสิโนมอนติคาร์โล F1 กรังด์ปรีซ์ เรือยอชท์',
    esimTip: 'Uses French networks - seamless coverage',
    esimTipTh: 'ใช้เครือข่ายฝรั่งเศส - สัญญาณต่อเนื่อง',
    carriers: []
  },
  {
    name: 'Vatican City',
    code: 'VA',
    flag: '🇻🇦',
    costIndex: 6,
    beautyScore: 5,
    networkSpeed: '4G',
    avgSpeed: '80 Mbps',
    region: 'Microstates',
    highlight: 'St. Peter\'s Basilica, Sistine Chapel',
    highlightTh: 'มหาวิหารเซนต์ปีเตอร์ โบสถ์ซิสทีน',
    esimTip: 'Uses Italian networks - excellent coverage',
    esimTipTh: 'ใช้เครือข่ายอิตาลี - สัญญาณดีเยี่ยม',
    carriers: []
  },
  {
    name: 'San Marino',
    code: 'SM',
    flag: '🇸🇲',
    costIndex: 5,
    beautyScore: 4,
    networkSpeed: '4G',
    avgSpeed: '75 Mbps',
    region: 'Microstates',
    highlight: 'Mountain fortress, oldest republic',
    highlightTh: 'ป้อมปราการบนภูเขา สาธารณรัฐเก่าแก่ที่สุด',
    esimTip: 'Uses Italian networks - small area, good coverage',
    esimTipTh: 'ใช้เครือข่ายอิตาลี - พื้นที่เล็ก สัญญาณดี',
    carriers: []
  },
  {
    name: 'Andorra',
    code: 'AD',
    flag: '🇦🇩',
    costIndex: 6,
    beautyScore: 4,
    networkSpeed: '4G',
    avgSpeed: '70 Mbps',
    region: 'Microstates',
    highlight: 'Ski resorts, duty-free shopping, Pyrenees',
    highlightTh: 'รีสอร์ทสกี ช้อปปิ้งปลอดภาษี พิเรนีส',
    esimTip: 'Mountain coverage can be variable',
    esimTipTh: 'สัญญาณบนภูเขาอาจไม่แน่นอน',
    carriers: []
  },
  {
    name: 'Liechtenstein',
    code: 'LI',
    flag: '🇱🇮',
    costIndex: 9,
    beautyScore: 4,
    networkSpeed: '5G',
    avgSpeed: '95 Mbps',
    region: 'Microstates',
    highlight: 'Vaduz Castle, Alpine scenery, stamps',
    highlightTh: 'ปราสาทวาดุซ ทิวทัศน์แอลป์ แสตมป์',
    esimTip: 'Uses Swiss networks - premium coverage',
    esimTipTh: 'ใช้เครือข่ายสวิส - สัญญาณพรีเมียม',
    carriers: []
  }
];

// Utility functions
export const getCountriesByRegion = (region: EuropeCountryData['region']) => 
  EUROPE_42_COUNTRIES.filter(c => c.region === region);

export const getCountriesByCost = (maxCost: number) => 
  EUROPE_42_COUNTRIES.filter(c => c.costIndex <= maxCost);

export const getCountriesBySpeed = (speed: '5G' | '4G' | '3G') => 
  EUROPE_42_COUNTRIES.filter(c => c.networkSpeed === speed);

export const getCountriesByBeauty = (minBeauty: number) => 
  EUROPE_42_COUNTRIES.filter(c => c.beautyScore >= minBeauty);

export const sortByName = (countries: EuropeCountryData[]) => 
  [...countries].sort((a, b) => a.name.localeCompare(b.name));

export const sortByCost = (countries: EuropeCountryData[], desc = true) => 
  [...countries].sort((a, b) => desc ? b.costIndex - a.costIndex : a.costIndex - b.costIndex);

export const sortByBeauty = (countries: EuropeCountryData[], desc = true) => 
  [...countries].sort((a, b) => desc ? b.beautyScore - a.beautyScore : a.beautyScore - b.beautyScore);

export const sortBySpeed = (countries: EuropeCountryData[], desc = true) => {
  const speedOrder = { '5G': 3, '4G': 2, '3G': 1 };
  return [...countries].sort((a, b) => desc 
    ? speedOrder[b.networkSpeed] - speedOrder[a.networkSpeed]
    : speedOrder[a.networkSpeed] - speedOrder[b.networkSpeed]
  );
};

export const searchCountries = (query: string) => {
  const q = query.toLowerCase();
  return EUROPE_42_COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(q) ||
    c.highlight.toLowerCase().includes(q) ||
    c.region.toLowerCase().includes(q)
  );
};

// Statistics
export const getEurope42Stats = () => ({
  totalCountries: EUROPE_42_COUNTRIES.length,
  countriesWith5G: EUROPE_42_COUNTRIES.filter(c => c.networkSpeed === '5G').length,
  averageCostIndex: Math.round(EUROPE_42_COUNTRIES.reduce((sum, c) => sum + c.costIndex, 0) / EUROPE_42_COUNTRIES.length * 10) / 10,
  mostExpensive: EUROPE_42_COUNTRIES.filter(c => c.costIndex >= 9).map(c => c.name),
  mostBeautiful: EUROPE_42_COUNTRIES.filter(c => c.beautyScore === 5).map(c => c.name),
  budgetFriendly: EUROPE_42_COUNTRIES.filter(c => c.costIndex <= 3).map(c => c.name)
});

// Filter options for UI
export const REGION_OPTIONS = ['All', 'Western', 'Eastern', 'Northern', 'Southern', 'Balkans', 'British Isles', 'Microstates'] as const;
export const SPEED_OPTIONS = ['All', '5G', '4G', '3G'] as const;
export const COST_OPTIONS = ['All', 'Budget (1-3)', 'Moderate (4-6)', 'Expensive (7-10)'] as const;
export const BEAUTY_OPTIONS = ['All', '5 Stars', '4+ Stars', '3+ Stars'] as const;
export const SORT_OPTIONS = ['A-Z', 'Most Expensive', 'Most Beautiful', 'Fastest Network', 'Budget First'] as const;
