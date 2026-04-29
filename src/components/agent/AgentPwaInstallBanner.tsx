import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function AgentPwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true;
    setIsStandalone(standalone);

    const wasDismissed = sessionStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) setDismissed(true);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (isStandalone || dismissed || !deferredPrompt) return null;

  const handleInstall = async () => {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  return (
    <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl mx-4 mt-3 p-3 flex items-center gap-3 md:hidden">
      <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shrink-0">
        <Download className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#1A1A1A]">Install Agent App</p>
        <p className="text-xs text-[#9CA3AF]">Push notifications & quick access</p>
      </div>
      <Button 
        size="sm" 
        onClick={handleInstall} 
        className="shrink-0 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-sm"
      >
        Install
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 rounded-xl hover:bg-orange-500/10" onClick={handleDismiss}>
        <X className="h-4 w-4 text-[#9CA3AF]" />
      </Button>
    </div>
  );
}
