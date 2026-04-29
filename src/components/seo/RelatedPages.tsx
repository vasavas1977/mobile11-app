import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LucideIcon } from 'lucide-react';

export interface RelatedPageItem {
  to: string;
  titleKey?: string;
  descriptionKey?: string;
  icon: LucideIcon;
  titleEn?: string;
  titleTh?: string;
  titleZh?: string;
  titleJa?: string;
  titleKo?: string;
  titleFr?: string;
  titleDe?: string;
  titleEs?: string;
  titlePt?: string;
  titleAr?: string;
  descriptionEn?: string;
  descriptionTh?: string;
  descriptionZh?: string;
  descriptionJa?: string;
  descriptionKo?: string;
  descriptionFr?: string;
  descriptionDe?: string;
  descriptionEs?: string;
  descriptionPt?: string;
  descriptionAr?: string;
}

interface RelatedPagesProps {
  items: RelatedPageItem[];
  titleKey?: string;
  titleEn?: string;
  titleTh?: string;
  titleZh?: string;
  titleJa?: string;
  titleKo?: string;
  titleFr?: string;
  titleDe?: string;
  titleEs?: string;
  titlePt?: string;
  titleAr?: string;
}

export function RelatedPages({ 
  items, 
  titleKey,
  titleEn = 'Helpful Resources', 
  titleTh = 'แหล่งข้อมูลที่เป็นประโยชน์',
  titleZh = '实用资源',
  titleJa = '関連リソース',
  titleKo = '유용한 자료',
  titleFr = 'Ressources utiles',
  titleDe = 'Hilfreiche Ressourcen',
  titleEs = 'Recursos útiles',
  titlePt = 'Recursos úteis',
  titleAr = 'موارد مفيدة',
}: RelatedPagesProps) {
  const { t, language, localizeField } = useLanguage();

  const sectionTitle = titleKey ? t(titleKey) : localizeField({ nameEn: titleEn, nameTh: titleTh, nameZh: titleZh, nameJa: titleJa, nameKo: titleKo, nameFr: titleFr, nameDe: titleDe, nameEs: titleEs, namePt: titlePt, nameAr: titleAr }, 'name');

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
          {sectionTitle}
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {items.map((item) => {
            const title = item.titleKey ? t(item.titleKey) : localizeField({ nameEn: item.titleEn, nameTh: item.titleTh, nameZh: item.titleZh, nameJa: item.titleJa, nameKo: item.titleKo, nameFr: item.titleFr, nameDe: item.titleDe, nameEs: item.titleEs, namePt: item.titlePt, nameAr: item.titleAr }, 'name');
            const description = item.descriptionKey ? t(item.descriptionKey) : localizeField({ nameEn: item.descriptionEn, nameTh: item.descriptionTh, nameZh: item.descriptionZh, nameJa: item.descriptionJa, nameKo: item.descriptionKo, nameFr: item.descriptionFr, nameDe: item.descriptionDe, nameEs: item.descriptionEs, namePt: item.descriptionPt, nameAr: item.descriptionAr }, 'name');

            return (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all group"
              >
                <div className="p-2.5 rounded-xl bg-orange-50 text-orange-500 group-hover:bg-orange-100 transition-colors flex-shrink-0">
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors mb-1">
                    {title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
