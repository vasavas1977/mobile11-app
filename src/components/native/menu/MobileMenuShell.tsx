import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MobileMenuShellProps {
  title: string;
  onBack?: () => void;
  noDivider?: boolean;
  children: React.ReactNode;
}

export const MobileMenuShell: React.FC<MobileMenuShellProps> = ({
  title,
  onBack,
  noDivider = false,
  children,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/profile');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      {/* Header */}
      <div
        className="sticky top-0 z-40 bg-[#FAF7F2] flex items-center justify-center h-14 px-4"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <button
          onClick={handleBack}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center"
          style={{ marginTop: 'calc(env(safe-area-inset-top, 0px) / 2)' }}
        >
          <ChevronLeft className="w-6 h-6 text-gray-900" />
        </button>
        <span className="text-[17px] font-bold text-gray-900">{title}</span>
      </div>

      {/* Divider */}
      {!noDivider && <div className="h-px bg-black/5" />}

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
};
