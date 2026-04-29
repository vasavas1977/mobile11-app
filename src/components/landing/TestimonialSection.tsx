import { useRef, useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

// Import testimonial images
import testimonialJue from '@/assets/testimonials/testimonial-jue-china.jpg';
import testimonialBeer from '@/assets/testimonials/testimonial-beer-hongkong.jpg';
import testimonialChong from '@/assets/testimonials/testimonial-chong-china.jpg';
import testimonialMontri from '@/assets/testimonials/testimonial-montri-singapore.jpg';
import testimonialPangpang from '@/assets/testimonials/testimonial-pangpang-japan.jpg';
import testimonialNu from '@/assets/testimonials/testimonial-nu-korea.jpg';
import testimonialTao from '@/assets/testimonials/testimonial-tao-france.jpg';

interface Testimonial {
  id: number;
  nameEn: string;
  nameTh?: string;
  nameJa?: string;
  destination: string;
  destinationTh?: string;
  destinationJa?: string;
  flag: string;
  role: string;
  roleEn: string;
  roleTh?: string;
  roleJa?: string;
  quoteEn: string;
  quoteTh?: string;
  quoteJa?: string;
  image: string;
  [key: string]: string | number | undefined;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    nameTh: "จือ", nameEn: "Jue", nameJa: "ジュー", nameZh: "Jue", nameKo: "주에", nameFr: "Jue", nameDe: "Jue", nameEs: "Jue", namePt: "Jue", nameAr: "جو",
    destination: "China", destinationTh: "จีน", destinationJa: "中国", destinationZh: "中国", destinationKo: "중국", destinationFr: "Chine", destinationDe: "China", destinationEs: "China", destinationPt: "China", destinationAr: "الصين",
    flag: "🇨🇳",
    roleTh: "เจ้าหน้าที่การตลาด บริษัทเอกชน", role: "Marketing Officer, Private Company", roleEn: "Marketing Officer, Private Company",
    roleJa: "マーケティング担当、民間企業", roleZh: "市场营销主管，私营企业", roleKo: "마케팅 담당, 민간기업", roleFr: "Responsable Marketing", roleDe: "Marketing-Leitung", roleEs: "Responsable de Marketing", rolePt: "Gerente de Marketing", roleAr: "مسؤول التسويق",
    quoteTh: "เดินทางไปจีนหลายวัน ทั้งไปทำงานและท่องเที่ยวสถานที่สำคัญ ไหนจะนั่งรถ ใน eSIM แทนเพราะสะดวกกว่า ไม่ต้องกลัวเน็ตหมด ดู Map ต้องกดแอปแปลภาษา ถ้าไม่มีเน็ตไม่ได้เลย eSIM นี้ตอบโจทย์มาก จะอัปโหลดดาวน์โหลดได้ ไม่ต้องกลัวเน็ตหมด",
    quoteEn: "Traveled to China for work and sightseeing. eSIM was so convenient - no worries about running out of data. Maps and translation apps work perfectly. eSIM is a game changer for travelers!",
    quoteJa: "中国に出張と観光で行きました。eSIMはとても便利で、データ切れの心配がありません。マップや翻訳アプリも完璧に動きます。旅行者にとってeSIMは画期的です！",
    quoteZh: "去中国出差和观光，eSIM太方便了——完全不用担心流量用完。地图和翻译应用运行完美。eSIM对旅行者来说是游戏规则的改变者！",
    quoteKo: "중국 출장과 관광을 갔는데, eSIM이 정말 편리했어요. 데이터 걱정 없이 지도와 번역 앱을 완벽하게 사용할 수 있었습니다!",
    quoteFr: "Voyage en Chine pour le travail et le tourisme. L'eSIM était si pratique — plus de soucis de données. Les cartes et apps de traduction fonctionnent parfaitement !",
    quoteDe: "Geschäftsreise nach China — eSIM war so praktisch! Keine Sorgen wegen Datenvolumen. Karten und Übersetzungs-Apps liefen perfekt!",
    quoteEs: "Viajé a China por trabajo y turismo. ¡La eSIM fue tan práctica! Sin preocuparme por los datos. Mapas y apps de traducción funcionaron perfectamente.",
    quotePt: "Viajei para a China a trabalho e turismo. O eSIM foi super prático — sem preocupação com dados. Mapas e apps de tradução funcionaram perfeitamente!",
    quoteAr: "سافرت إلى الصين للعمل والسياحة. كانت شريحة eSIM مريحة جداً — لا قلق بشأن نفاد البيانات. الخرائط وتطبيقات الترجمة تعمل بشكل مثالي!",
    image: testimonialJue,
  },
  {
    id: 2,
    nameTh: "เบียร์", nameEn: "Beer", nameJa: "ビア", nameZh: "Beer", nameKo: "비어", nameFr: "Beer", nameDe: "Beer", nameEs: "Beer", namePt: "Beer", nameAr: "بير",
    destination: "Hong Kong", destinationTh: "ฮ่องกง", destinationJa: "香港", destinationZh: "香港", destinationKo: "홍콩", destinationFr: "Hong Kong", destinationDe: "Hongkong", destinationEs: "Hong Kong", destinationPt: "Hong Kong", destinationAr: "هونغ كونغ",
    flag: "🇭🇰",
    roleTh: "Content Marketing บริษัทเอกชน", role: "Content Marketing, Private Company", roleEn: "Content Marketing, Private Company",
    roleJa: "コンテンツマーケティング、民間企業", roleZh: "内容营销，私营企业", roleKo: "콘텐츠 마케팅, 민간기업", roleFr: "Marketing de contenu", roleDe: "Content Marketing", roleEs: "Marketing de Contenidos", rolePt: "Marketing de Conteúdo", roleAr: "تسويق المحتوى",
    quoteTh: "ก่อนหน้านี้ลองใช้ eSIM ตอนไปเที่ยวฮ่องกง รู้สึกแรกบอกเลยว่าจะไปใช้แต่เน็ตหมดเลย เล่น IG TikTok ใช้ได้เพลิน เหมาะกับสาย social",
    quoteEn: "Used eSIM for my Hong Kong trip. The unlimited data was perfect for IG and TikTok. Great for social media lovers!",
    quoteJa: "香港旅行でeSIMを使いました。無制限データでIGやTikTokを楽しめました。SNS好きにぴったり！",
    quoteZh: "香港旅行用了eSIM，无限流量刷IG和TikTok太爽了。非常适合社交媒体爱好者！",
    quoteKo: "홍콩 여행에서 eSIM을 사용했는데, 무제한 데이터로 IG와 TikTok을 마음껏 즐겼어요!",
    quoteFr: "J'ai utilisé l'eSIM pour mon voyage à Hong Kong. Les données illimitées étaient parfaites pour IG et TikTok !",
    quoteDe: "eSIM für meine Hongkong-Reise genutzt. Unbegrenztes Datenvolumen war perfekt für IG und TikTok!",
    quoteEs: "Usé eSIM en mi viaje a Hong Kong. ¡Los datos ilimitados fueron perfectos para IG y TikTok!",
    quotePt: "Usei eSIM na minha viagem a Hong Kong. Dados ilimitados foram perfeitos para IG e TikTok!",
    quoteAr: "استخدمت eSIM في رحلتي إلى هونغ كونغ. البيانات غير المحدودة كانت مثالية لإنستغرام وتيك توك!",
    image: testimonialBeer,
  },
  {
    id: 3,
    nameTh: "ชง", nameEn: "Chong", nameJa: "チョン", nameZh: "Chong", nameKo: "총", nameFr: "Chong", nameDe: "Chong", nameEs: "Chong", namePt: "Chong", nameAr: "تشونغ",
    destination: "China", destinationTh: "จีน", destinationJa: "中国", destinationZh: "中国", destinationKo: "중국", destinationFr: "Chine", destinationDe: "China", destinationEs: "China", destinationPt: "China", destinationAr: "الصين",
    flag: "🇨🇳",
    roleTh: "CEO บริษัทวันทูออล จำกัด", role: "CEO, 1-TO-ALL Co., Ltd", roleEn: "CEO, 1-TO-ALL Co., Ltd",
    roleJa: "CEO、1-TO-ALL株式会社", roleZh: "CEO, 1-TO-ALL Co., Ltd", roleKo: "CEO, 1-TO-ALL Co., Ltd", roleFr: "PDG, 1-TO-ALL Co., Ltd", roleDe: "CEO, 1-TO-ALL Co., Ltd", roleEs: "CEO, 1-TO-ALL Co., Ltd", rolePt: "CEO, 1-TO-ALL Co., Ltd", roleAr: "الرئيس التنفيذي، 1-TO-ALL",
    quoteTh: "ไปจีนหลายวัน บอกตรงๆ ว่าไม่เน็ตอะทำอะไรไม่ได้ ใช้ eSIM แล้วสบายมาก เช็คงาน แปลภาษาได้ตลอด ไม่ต้องกลัวเน็ตจะหมดหรือช้าเลย",
    quoteEn: "Business trip to China - can't do anything without internet there. eSIM was a lifesaver for work and translation apps. Never worried about data!",
    quoteJa: "中国出張では、インターネットなしでは何もできません。eSIMは仕事や翻訳アプリの救世主でした。データの心配は一切なし！",
    quoteZh: "去中国出差——没有网络真的什么都做不了。eSIM是工作和翻译应用的救星。再也不用担心流量问题！",
    quoteKo: "중국 출장 — 인터넷 없이는 아무것도 할 수 없어요. eSIM 덕분에 업무와 번역 앱을 편리하게 사용했습니다!",
    quoteFr: "Voyage d'affaires en Chine — impossible sans internet. L'eSIM m'a sauvé pour le travail et la traduction !",
    quoteDe: "Geschäftsreise nach China — ohne Internet geht nichts. eSIM war ein Lebensretter für Arbeit und Übersetzungs-Apps!",
    quoteEs: "Viaje de negocios a China — sin internet no se puede hacer nada. ¡La eSIM fue un salvavidas para el trabajo y las apps de traducción!",
    quotePt: "Viagem de negócios à China — sem internet não dá para fazer nada. O eSIM foi essencial para trabalho e apps de tradução!",
    quoteAr: "رحلة عمل إلى الصين — لا يمكن فعل أي شيء بدون إنترنت. كانت شريحة eSIM منقذة للعمل وتطبيقات الترجمة!",
    image: testimonialChong,
  },
  {
    id: 4,
    nameTh: "มนตรี", nameEn: "Montri", nameJa: "モントリ", nameZh: "Montri", nameKo: "몬트리", nameFr: "Montri", nameDe: "Montri", nameEs: "Montri", namePt: "Montri", nameAr: "مونتري",
    destination: "Singapore", destinationTh: "สิงคโปร์", destinationJa: "シンガポール", destinationZh: "新加坡", destinationKo: "싱가포르", destinationFr: "Singapour", destinationDe: "Singapur", destinationEs: "Singapur", destinationPt: "Singapura", destinationAr: "سنغافورة",
    flag: "🇸🇬",
    roleTh: "อดีตผู้บริการบริษัท ทรู คอร์ปอเรชั่น จํากัด (มหาชน)", role: "Ex-Management, True Corporation Public Company Limited", roleEn: "Ex-Management, True Corporation Public Company Limited",
    roleJa: "元経営陣、True Corporation公開会社", roleZh: "前高管，True Corporation上市公司", roleKo: "전 경영진, True Corporation", roleFr: "Ex-Direction, True Corporation", roleDe: "Ex-Management, True Corporation", roleEs: "Ex-Directivo, True Corporation", rolePt: "Ex-Gerência, True Corporation", roleAr: "إدارة سابقة، True Corporation",
    quoteTh: "ทำ Trip ฮ่องกงรอบนี้เป็นทำงาน เปลี่ยนโลเคชั่นตลอด ลองวีดีโอคอลหาลูกรอบครอบก็ได้สะดวกเลย ตอบแชทงานได้แบบไม่ต้องห่วงว่าเน็ตจะช้า",
    quoteEn: "This Singapore trip was for work, constantly changing locations. Video calls with family worked perfectly. Never worried about slow internet!",
    quoteJa: "シンガポール出張では常に場所を変えていました。家族とのビデオ通話も完璧。遅いインターネットの心配なし！",
    quoteZh: "新加坡出差，不断换地方。和家人视频通话完全没问题。再也不用担心网速慢！",
    quoteKo: "싱가포르 출장에서 계속 장소를 바꿨는데, 가족과의 영상통화도 완벽했어요!",
    quoteFr: "Voyage d'affaires à Singapour. Les appels vidéo avec la famille fonctionnaient parfaitement !",
    quoteDe: "Geschäftsreise nach Singapur. Videoanrufe mit der Familie funktionierten perfekt!",
    quoteEs: "Viaje de negocios a Singapur. ¡Las videollamadas con la familia funcionaron perfectamente!",
    quotePt: "Viagem de negócios a Singapura. As chamadas de vídeo com a família funcionaram perfeitamente!",
    quoteAr: "رحلة عمل إلى سنغافورة. مكالمات الفيديو مع العائلة عملت بشكل مثالي!",
    image: testimonialMontri,
  },
  {
    id: 5,
    nameTh: "ปังปัง", nameEn: "Pangpang", nameJa: "パンパン", nameZh: "Pangpang", nameKo: "팡팡", nameFr: "Pangpang", nameDe: "Pangpang", nameEs: "Pangpang", namePt: "Pangpang", nameAr: "بانغ بانغ",
    destination: "Japan", destinationTh: "ญี่ปุ่น", destinationJa: "日本", destinationZh: "日本", destinationKo: "일본", destinationFr: "Japon", destinationDe: "Japan", destinationEs: "Japón", destinationPt: "Japão", destinationAr: "اليابان",
    flag: "🇯🇵",
    roleTh: "Content Creator", role: "Content Creator", roleEn: "Content Creator",
    roleJa: "コンテンツクリエイター", roleZh: "内容创作者", roleKo: "콘텐츠 크리에이터", roleFr: "Créateur de contenu", roleDe: "Content Creator", roleEs: "Creador de Contenido", rolePt: "Criador de Conteúdo", roleAr: "صانع محتوى",
    quoteTh: "ไปญี่ปุ่น รู้เลยว่า eSIM สัญญาณแรง เพราะต้องใช้งานเน็ตออนไลน์แรง เหมาะกับสายอัปโหลดไอเดีย ลองไลฟ์ก็น่าสนใจเลย",
    quoteEn: "In Japan, eSIM signal was super strong! Perfect for content creators who need to upload and go live. Highly recommend!",
    quoteJa: "日本でeSIMの信号はとても強かったです！アップロードやライブ配信が必要なクリエイターに最適。おすすめです！",
    quoteZh: "在日本，eSIM信号超强！非常适合需要上传和直播的内容创作者。强烈推荐！",
    quoteKo: "일본에서 eSIM 신호가 정말 강했어요! 업로드와 라이브가 필요한 크리에이터에게 딱이에요!",
    quoteFr: "Au Japon, le signal eSIM était super fort ! Parfait pour les créateurs qui doivent uploader et streamer !",
    quoteDe: "In Japan war das eSIM-Signal super stark! Perfekt für Content Creator, die uploaden und live gehen müssen!",
    quoteEs: "¡En Japón, la señal de eSIM fue súper fuerte! Perfecto para creadores de contenido que necesitan subir y hacer lives.",
    quotePt: "No Japão, o sinal do eSIM foi super forte! Perfeito para criadores de conteúdo que precisam fazer upload e lives!",
    quoteAr: "في اليابان، كانت إشارة eSIM قوية جداً! مثالية لصناع المحتوى الذين يحتاجون للرفع والبث المباشر!",
    image: testimonialPangpang,
  },
  {
    id: 6,
    nameTh: "นุ", nameEn: "Nu", nameJa: "ヌ", nameZh: "Nu", nameKo: "누", nameFr: "Nu", nameDe: "Nu", nameEs: "Nu", namePt: "Nu", nameAr: "نو",
    destination: "South Korea", destinationTh: "เกาหลีใต้", destinationJa: "韓国", destinationZh: "韩国", destinationKo: "한국", destinationFr: "Corée du Sud", destinationDe: "Südkorea", destinationEs: "Corea del Sur", destinationPt: "Coreia do Sul", destinationAr: "كوريا الجنوبية",
    flag: "🇰🇷",
    roleTh: "นักธุรกิจ", role: "Business Owner", roleEn: "Business Owner",
    roleJa: "ビジネスオーナー", roleZh: "企业主", roleKo: "사업가", roleFr: "Chef d'entreprise", roleDe: "Unternehmer", roleEs: "Empresario", rolePt: "Empresário", roleAr: "صاحب أعمال",
    quoteTh: "เดินทางไปเกาหลีหลายรอบ บอกเลยว่าเน็ตต้องพร้อม ลองใช้ eSIM แล้วจะรู้ว่ามันประทับใจมาก เล่นเกมได้สบายไป ทำงานไปแบบสบายใจ ไม่ต้องห่วงเน็ตตะหรอเลย",
    quoteEn: "Traveled to Korea many times - reliable internet is a must. eSIM impressed me so much! Gaming and work without any data worries.",
    quoteJa: "韓国に何度も旅行しました。安定したインターネットは必須です。eSIMにとても感動！ゲームも仕事もデータの心配なし。",
    quoteZh: "去韩国很多次了——稳定的网络是必须的。eSIM给我留下了深刻印象！游戏和工作都不用担心流量。",
    quoteKo: "한국을 여러 번 여행했는데, 안정적인 인터넷은 필수예요. eSIM에 정말 감동했어요! 게임도 업무도 데이터 걱정 없이!",
    quoteFr: "Voyagé en Corée plusieurs fois — un internet fiable est indispensable. L'eSIM m'a vraiment impressionné !",
    quoteDe: "Mehrmals nach Korea gereist — zuverlässiges Internet ist ein Muss. eSIM hat mich begeistert!",
    quoteEs: "Viajé a Corea muchas veces — internet confiable es imprescindible. ¡La eSIM me impresionó mucho!",
    quotePt: "Viajei para a Coreia várias vezes — internet confiável é essencial. O eSIM me impressionou muito!",
    quoteAr: "سافرت إلى كوريا مرات عديدة — الإنترنت الموثوق ضروري. شريحة eSIM أبهرتني كثيراً!",
    image: testimonialNu,
  },
  {
    id: 7,
    nameTh: "เต้า", nameEn: "Tao", nameJa: "タオ", nameZh: "Tao", nameKo: "타오", nameFr: "Tao", nameDe: "Tao", nameEs: "Tao", namePt: "Tao", nameAr: "تاو",
    destination: "France", destinationTh: "ฝรั่งเศส", destinationJa: "フランス", destinationZh: "法国", destinationKo: "프랑스", destinationFr: "France", destinationDe: "Frankreich", destinationEs: "Francia", destinationPt: "França", destinationAr: "فرنسا",
    flag: "🇫🇷",
    roleTh: "ผู้บริหาร 3BB และ JASMINE", role: "Executive, 3BB & JASMINE", roleEn: "Executive, 3BB & JASMINE",
    roleJa: "エグゼクティブ、3BB & JASMINE", roleZh: "高管，3BB & JASMINE", roleKo: "임원, 3BB & JASMINE", roleFr: "Cadre dirigeant, 3BB & JASMINE", roleDe: "Führungskraft, 3BB & JASMINE", roleEs: "Ejecutivo, 3BB & JASMINE", rolePt: "Executivo, 3BB & JASMINE", roleAr: "تنفيذي، 3BB & JASMINE",
    quoteTh: "ไปฝรั่งเศสทั้งทำงานและเที่ยว ว่าเน็ตสำคัญมาก แต่ก่อนใช้เน็ตแบบโรมมิ่ง แต่พอเจอ eSIM แล้วรู้สึกว่าดีกว่า เพราะใช้เน็ตได้ไม่อั้น เช็คงาน หรือเล่นเกมได้ตลอด อีกอย่างเสถียร สัญญาณไม่หาย",
    quoteEn: "France trip for work and leisure - internet is crucial. Used to use roaming, but eSIM is way better! Unlimited data, stable signal. Perfect for work and gaming.",
    quoteJa: "フランスへの出張と観光。インターネットは不可欠です。以前はローミングを使っていましたが、eSIMの方がずっと良い！無制限データで安定した信号。仕事にもゲームにも最適。",
    quoteZh: "去法国出差和旅游——网络至关重要。以前用漫游，但eSIM好太多了！无限流量，信号稳定。工作和游戏都完美！",
    quoteKo: "프랑스 출장과 여행 — 인터넷이 정말 중요해요. 예전엔 로밍을 썼는데, eSIM이 훨씬 좋아요! 무제한 데이터에 안정적인 신호!",
    quoteFr: "Voyage en France pour le travail et les loisirs. L'eSIM est bien mieux que le roaming ! Données illimitées, signal stable.",
    quoteDe: "Frankreich-Reise für Arbeit und Freizeit. eSIM ist viel besser als Roaming! Unbegrenzte Daten, stabiles Signal.",
    quoteEs: "Viaje a Francia por trabajo y placer — el internet es crucial. ¡La eSIM es mucho mejor que el roaming! Datos ilimitados, señal estable.",
    quotePt: "Viagem à França a trabalho e lazer — internet é crucial. O eSIM é muito melhor que roaming! Dados ilimitados, sinal estável.",
    quoteAr: "رحلة إلى فرنسا للعمل والترفيه — الإنترنت ضروري. eSIM أفضل بكثير من التجوال! بيانات غير محدودة وإشارة مستقرة.",
    image: testimonialTao,
  },
];

export default function TestimonialSection() {
  const { language, t } = useLanguage();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const autoplayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  // Autoplay logic
  useEffect(() => {
    if (!api || isPaused) return;

    autoplayRef.current = setInterval(() => {
      api.scrollNext();
    }, 5000);

    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
      }
    };
  }, [api, isPaused]);

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  return (
    <section className="py-20 md:py-28 bg-white relative overflow-hidden">
      <div className="container relative">
        {/* Section Header */}
        <div className="text-center mb-14 md:mb-20 space-y-3">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-orange-500/80">
            {t('testimonials.subtitle') || 'What travelers say'}
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-display font-bold text-gray-900 leading-tight">
            {t('testimonials.title')}
          </h2>
        </div>

        {/* Carousel */}
        <div 
          className="relative px-4 md:px-12"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <Carousel
            setApi={setApi}
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {testimonials.map((testimonial) => (
                <CarouselItem 
                  key={testimonial.id} 
                  className="pl-4 basis-full md:basis-1/2 lg:basis-1/3"
                >
                  <TestimonialCard testimonial={testimonial} language={language} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {/* Navigation Buttons */}
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex h-10 w-10 rounded-full bg-white border-gray-200 text-gray-600 shadow-sm hover:bg-gray-50 hover:shadow-md"
            onClick={() => api?.scrollPrev()}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex h-10 w-10 rounded-full bg-white border-gray-200 text-gray-600 shadow-sm hover:bg-gray-50 hover:shadow-md"
            onClick={() => api?.scrollNext()}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: count }).map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                index === current 
                  ? 'w-8 bg-orange-500' 
                  : 'w-2.5 bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

interface TestimonialCardProps {
  testimonial: Testimonial;
  language: string;
}

function TestimonialCard({ testimonial, language }: TestimonialCardProps) {
  const { localizeField } = useLanguage();
  const name = localizeField(testimonial, 'name');
  const destination = localizeField(testimonial, 'destination');
  const role = localizeField(testimonial, 'role');
  const quote = localizeField(testimonial, 'quote');

  return (
    <div className="group relative bg-[#FAFAF8] rounded-2xl border border-gray-100 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 overflow-hidden">
      {/* Circular Avatar Image */}
      <div className="pt-6 px-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-orange-100 flex-shrink-0">
            <OptimizedImage
              src={testimonial.image}
              alt={`${name} - ${destination}`}
              className="w-full h-full object-cover"
              loading="lazy"
              fetchPriority="low"
              sizes="64px"
              placeholderEmoji={testimonial.flag}
            />
          </div>
          {/* Author Info next to avatar */}
          <div className="space-y-0.5">
            <p className="text-gray-900 font-bold text-base">{name}</p>
            <p className="text-gray-500 text-sm line-clamp-2">{role}</p>
          </div>
        </div>
        
        {/* Destination Badge */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500 text-white text-xs font-medium flex-shrink-0">
          <span className="text-sm">{testimonial.flag}</span>
          {destination}
        </span>
      </div>
      
      {/* Content */}
      <div className="p-6 pt-4">
        {/* Quote Icon */}
        <div className="mb-3">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-orange-50">
            <Quote className="h-5 w-5 text-orange-500" />
          </div>
        </div>
        
        {/* Quote Text */}
        <p className="text-gray-700 text-sm leading-relaxed line-clamp-5 min-h-[100px]">
          "{quote}"
        </p>
      </div>
    </div>
  );
}
