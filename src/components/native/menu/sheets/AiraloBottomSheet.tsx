import React from 'react';
import { X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet';

interface AiraloBottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  whiteBody?: boolean;
  children: React.ReactNode;
}

export const AiraloBottomSheet: React.FC<AiraloBottomSheetProps> = ({
  open,
  onClose,
  title,
  whiteBody = true,
  children,
}) => {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl max-h-[92vh] p-0 [&>button.absolute]:hidden border-0"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 bg-[#FAF7F2] rounded-t-3xl">
          <div className="w-10 h-[5px] rounded-full bg-gray-300" />
        </div>

        {/* Beige header band */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#FAF7F2]">
          <SheetTitle className="text-xl font-bold text-gray-900">{title}</SheetTitle>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center"
          >
            <X className="w-4 h-4 text-gray-700" />
          </button>
        </div>

        {/* Body */}
        <div
          className={`overflow-y-auto max-h-[calc(92vh-120px)] ${
            whiteBody ? 'bg-white' : 'bg-[#FAF7F2]'
          }`}
        >
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
};
