import { Calendar, Phone, AlertTriangle } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const INCLUDED_COUNTRIES = [
  'Argentina', 'Brazil', 'Canada', 'Chile', 'China', 'Colombia',
  'France', 'Germany', 'Guam', 'Hong Kong', 'Hungary', 'Iceland',
  'India', 'Indonesia', 'Ireland', 'Japan', 'Malaysia', 'Malta',
  'Mexico', 'New Zealand', 'Norway', 'Peru', 'Philippines',
  'Puerto Rico', 'Romania', 'Singapore', 'Slovenia', 'South Korea',
  'Sweden', 'Taiwan', 'Thailand', 'Ukraine', 'United Kingdom',
  'United States', 'Venezuela',
];

interface DesignatedDateInfoCardProps {
  activationDate: string;
  activationEndDate?: string;
  validityDays: number;
  dataAmount: string;
}

export function DesignatedDateInfoCard({ 
  activationDate, 
  activationEndDate, 
  validityDays, 
  dataAmount 
}: DesignatedDateInfoCardProps) {
  const startDate = new Date(activationDate);
  const endDate = activationEndDate 
    ? new Date(activationEndDate) 
    : addDays(startDate, validityDays);

  return (
    <div className="space-y-3 mb-4">
      {/* Activation Period */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-blue-900">Activation Period</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-blue-700">Start Date</span>
          <span className="text-blue-900 font-medium">{format(startDate, 'PPP')}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-blue-700">End Date</span>
          <span className="text-blue-900 font-medium">{format(endDate, 'PPP')}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-blue-700">Data</span>
          <span className="text-blue-900 font-medium">{dataAmount}</span>
        </div>
      </div>

      {/* QR Warning */}
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-800">
          QR code supports <strong>one-time download only</strong>. Please scan carefully.
        </p>
      </div>

      {/* Unlimited Calls */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 w-full">
          <Phone className="w-4 h-4" />
          <span className="underline">Unlimited calls to 35 countries + Talk & Text</span>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <div className="flex flex-wrap gap-1.5">
              {INCLUDED_COUNTRIES.map((country) => (
                <span
                  key={country}
                  className="text-xs bg-white border border-blue-200 text-blue-800 px-2 py-0.5 rounded-full"
                >
                  {country}
                </span>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
