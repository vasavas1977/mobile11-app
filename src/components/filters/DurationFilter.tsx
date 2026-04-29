import { Calendar, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DurationFilterProps {
  selectedDuration: number | null;
  onDurationChange: (days: number | null) => void;
  availableDurations: number[];
}

export function DurationFilter({ selectedDuration, onDurationChange, availableDurations }: DurationFilterProps) {
  const { t } = useLanguage();
  
  // Generate duration options dynamically from available durations
  const durationOptions = availableDurations.map(days => ({
    days,
    label: days === 1 ? `1 ${t('packages.day')}` : `${days} ${t('packages.days')}`,
    icon: days <= 3 ? Clock : Calendar
  }));

  const selectedLabel = selectedDuration === null 
    ? t('packages.all')
    : durationOptions.find(opt => opt.days === selectedDuration)?.label || '';

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Calendar className="h-4 w-4 text-primary" />
        {t('packages.duration')}
      </h3>
      <Select
        value={selectedDuration?.toString() ?? "all"}
        onValueChange={(value) => onDurationChange(value === "all" ? null : parseInt(value))}
      >
        <SelectTrigger className="w-full">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <SelectValue>
              {selectedLabel}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            {t('packages.all')}
          </SelectItem>
          {durationOptions.map(({ days, label, icon: Icon }) => (
            <SelectItem key={days} value={days.toString()}>
              <div className="flex items-center gap-2">
                <Icon className="h-3 w-3" />
                {label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
