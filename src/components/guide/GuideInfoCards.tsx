import { Clock, Wifi } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export function GuideInfoCards() {
  const { t } = useLanguage();

  const cards = [
    {
      icon: Clock,
      title: t('guide.infoCards.activationTime.title'),
      description: t('guide.infoCards.activationTime.description'),
      color: 'from-primary to-primary/80',
    },
    {
      icon: Wifi,
      title: t('guide.infoCards.internetRequired.title'),
      description: t('guide.infoCards.internetRequired.description'),
      color: 'from-accent to-accent/80',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      {cards.map((card, index) => (
        <div
          key={index}
          className="relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all hover:shadow-lg hover:border-primary/30"
        >
          <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${card.color}`} />
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-md`}>
              <card.icon className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">{card.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
