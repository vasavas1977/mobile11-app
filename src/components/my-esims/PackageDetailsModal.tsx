import { Dialog, DialogPortal, DialogOverlay, DialogClose, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Clock, CalendarDays, ArrowLeftRight, Upload, Info, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { addDays, format } from 'date-fns';
import { cn } from '@/lib/utils';

interface PackageDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseDate: string;
}

export function PackageDetailsModal({ open, onOpenChange, purchaseDate }: PackageDetailsModalProps) {
  const { t } = useLanguage();
  
  const expiryDate = addDays(new Date(purchaseDate), 180);
  const formattedExpiryDate = format(expiryDate, 'MMM d, yyyy');
  
  const sections = [
    {
      icon: Clock,
      title: t('myEsims.packageDetailsModal.activationPolicyTitle'),
      description: t('myEsims.packageDetailsModal.activationPolicyDescription').replace('{expiryDate}', formattedExpiryDate),
    },
    {
      icon: CalendarDays,
      title: t('myEsims.packageDetailsModal.validityPolicyTitle'),
      description: t('myEsims.packageDetailsModal.validityPolicyDescription'),
    },
    {
      icon: ArrowLeftRight,
      title: t('myEsims.packageDetailsModal.ipRoutingTitle'),
      description: t('myEsims.packageDetailsModal.ipRoutingDescription'),
    },
    {
      icon: Upload,
      title: t('myEsims.packageDetailsModal.topUpTitle'),
      description: t('myEsims.packageDetailsModal.topUpDescription'),
    },
    {
      icon: Info,
      title: t('myEsims.packageDetailsModal.otherInfoTitle'),
      description: t('myEsims.packageDetailsModal.otherInfoDefault'),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="z-[9998]" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-[9999] grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] border bg-[#FAF7F2] shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-2xl p-0 gap-0"
          )}
        >
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-xl font-bold text-gray-900">
              {t('myEsims.packageDetails')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="px-6 pb-6">
            {sections.map((section, index) => (
              <div
                key={index}
                className={`flex gap-4 py-4 ${
                  index !== sections.length - 1 ? 'border-b border-gray-200' : ''
                }`}
              >
                <section.icon className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">
                    {section.title}
                  </h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {section.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
