import { ArrowLeft, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Translate2HeaderProps {
  title: string;
  showBack?: boolean;
  showSettings?: boolean;
  rightAction?: React.ReactNode;
  onBack?: () => void;
}

export function Translate2Header({ title, showBack = false, showSettings = false, rightAction, onBack }: Translate2HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between px-4 h-[56px] bg-white/98 backdrop-blur-lg border-b border-gray-100/80 shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        {showBack && (
          <button
            onClick={() => onBack ? onBack() : navigate('/translate2')}
            className="p-2.5 -ml-2 rounded-2xl hover:bg-gray-100 active:scale-95 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
        )}
        <h1 className="text-[17px] font-bold text-foreground truncate">{title}</h1>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {rightAction}
        {showSettings && (
          <button
            onClick={() => navigate('/translate2/settings')}
            className="p-2.5 rounded-2xl hover:bg-gray-100 active:scale-95 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
      </div>
    </header>
  );
}
