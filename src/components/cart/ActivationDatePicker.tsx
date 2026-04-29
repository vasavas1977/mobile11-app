import { useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';
import { CalendarIcon, AlertTriangle, Phone } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useLanguage } from '@/contexts/LanguageContext';

interface ActivationDatePickerProps {
  validityDays: number;
  activationDate?: string;
  onDateChange: (date: string) => void;
  minAdvanceDays?: number;
  showCallsInfo?: boolean;
  activationTimeNote?: string;
}

const INCLUDED_COUNTRIES = [
  'Argentina', 'Brazil', 'Canada', 'Chile', 'China', 'Colombia',
  'France', 'Germany', 'Guam', 'Hong Kong', 'Hungary', 'Iceland',
  'India', 'Indonesia', 'Ireland', 'Japan', 'Malaysia', 'Malta',
  'Mexico', 'New Zealand', 'Norway', 'Peru', 'Philippines',
  'Puerto Rico', 'Romania', 'Singapore', 'Slovenia', 'South Korea',
  'Sweden', 'Taiwan', 'Thailand', 'Ukraine', 'United Kingdom',
  'United States', 'Venezuela',
];

const texts = {
  en: {
    title: 'Select Activation Date',
    warningTitle: 'Advance booking required',
    warningLine1: 'You must select a date at least',
    warningLine1End: '. The eSIM will activate on the selected date.',
    warningLine2: 'QR code supports',
    warningLine2Bold: 'one-time download only',
    pickDate: 'Pick activation date',
    startDate: 'Start Date',
    endDate: 'End Date',
    duration: 'Duration',
    days: 'days',
    daysAdvance: 'days from today',
    callsInfo: 'Unlimited calls to 35 countries + Talk & Text',
  },
  th: {
    title: 'เลือกวันเปิดใช้งาน',
    warningTitle: 'ต้องจองล่วงหน้า',
    warningLine1: 'คุณต้องเลือกวันที่อย่างน้อย',
    warningLine1End: ' eSIM จะเปิดใช้งานในวันที่เลือก',
    warningLine2: 'QR code รองรับ',
    warningLine2Bold: 'การดาวน์โหลดครั้งเดียวเท่านั้น',
    pickDate: 'เลือกวันเปิดใช้งาน',
    startDate: 'วันเริ่มต้น',
    endDate: 'วันสิ้นสุด',
    duration: 'ระยะเวลา',
    days: 'วัน',
    daysAdvance: 'วันล่วงหน้า',
    callsInfo: 'โทรไม่อั้น 35 ประเทศ + โทร & ข้อความ',
  },
};

export function ActivationDatePicker({ 
  validityDays, 
  activationDate, 
  onDateChange, 
  minAdvanceDays = 2,
  showCallsInfo = true,
  activationTimeNote,
}: ActivationDatePickerProps) {
  const { language } = useLanguage();
  const t = texts[language];
  const minDate = useMemo(() => addDays(new Date(), minAdvanceDays), [minAdvanceDays]);

  const selectedDate = activationDate ? new Date(activationDate) : undefined;
  const endDate = selectedDate ? addDays(selectedDate, validityDays) : undefined;

  return (
    <div className="bg-[#FAF7F2] rounded-2xl shadow-sm border border-gray-200 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <CalendarIcon className="w-5 h-5 text-orange-500" />
        <h3 className="font-semibold text-gray-900 text-sm">{t.title}</h3>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-2 bg-orange-50/50 border border-orange-200 rounded-xl p-3">
        <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-gray-700 space-y-1">
          <p className="font-medium text-gray-900">{t.warningTitle}</p>
          <p>{t.warningLine1} <strong>{minAdvanceDays} {t.daysAdvance}</strong>{t.warningLine1End}</p>
          <p>{t.warningLine2} <strong>{t.warningLine2Bold}</strong></p>
          {activationTimeNote && (
            <p className="font-medium text-orange-700">{activationTimeNote}</p>
          )}
        </div>
      </div>

      {/* Date Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal rounded-xl h-12 bg-white border border-gray-200 text-gray-900 hover:border-orange-300 hover:bg-white",
              !selectedDate && "text-gray-400"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
            {selectedDate ? format(selectedDate, "PPP") : <span>{t.pickDate}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (date) onDateChange(format(date, 'yyyy-MM-dd'));
            }}
            disabled={(date) => date < minDate}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>

      {/* Activation Period Display */}
      {selectedDate && endDate && (
        <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t.startDate}</span>
            <span className="text-gray-900 font-medium">{format(selectedDate, 'PPP')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t.endDate}</span>
            <span className="text-gray-900 font-medium">{format(endDate, 'PPP')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t.duration}</span>
            <span className="text-orange-600 font-medium">{validityDays} {t.days}</span>
          </div>
        </div>
      )}

      {/* Unlimited Calls Info - only for Australia Vodafone */}
      {showCallsInfo && (
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 w-full">
            <Phone className="w-4 h-4" />
            <span className="underline">{t.callsInfo}</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="bg-white border border-gray-200 rounded-xl p-3">
              <div className="flex flex-wrap gap-1.5">
                {INCLUDED_COUNTRIES.map((country) => (
                  <span
                    key={country}
                    className="text-xs bg-[#FAF7F2] border border-gray-200 text-gray-700 px-2 py-0.5 rounded-full"
                  >
                    {country}
                  </span>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
