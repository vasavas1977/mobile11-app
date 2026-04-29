import { Mic, MessageSquare, Keyboard, Monitor } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const tabs = [
  { id: 'conversation', label: 'Talk', icon: Mic, path: '/translate2/conversation' },
  { id: 'phrases', label: 'Phrases', icon: MessageSquare, path: '/translate2/phrases' },
  { id: 'type', label: 'Type', icon: Keyboard, path: '/translate2/type' },
  { id: 'show', label: 'Show', icon: Monitor, path: '/translate2/show' },
] as const;

export function Translate2NavBar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white/98 backdrop-blur-lg border-t border-gray-200/60 px-2 pb-[env(safe-area-inset-bottom)] z-50 shadow-[0_-1px_12px_rgba(0,0,0,0.04)]"
      role="tablist"
      aria-label="Translation modes"
    >
      <div className="flex items-center justify-around py-2">
        {tabs.map(tab => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-label={tab.label}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-1 px-5 py-2 rounded-2xl transition-all min-w-[64px] min-h-[52px] active:scale-95 ${
                isActive
                  ? 'text-orange-600 bg-orange-50 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <tab.icon className={`w-[22px] h-[22px] ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className={`text-[11px] leading-none ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
