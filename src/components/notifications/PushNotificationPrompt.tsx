import { useState } from 'react';
import { Bell, X, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

interface PushNotificationPromptProps {
  onDismiss?: () => void;
  variant?: 'banner' | 'inline' | 'minimal';
}

export function PushNotificationPrompt({ 
  onDismiss, 
  variant = 'banner' 
}: PushNotificationPromptProps) {
  const { t, language } = useLanguage();
  const { 
    permission, 
    isSubscribed, 
    isLoading, 
    isSupported, 
    error,
    subscribe 
  } = usePushNotifications();
  
  const [isDismissed, setIsDismissed] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Text content based on language
  const texts = {
    subscribed: t('pushNotifications.subscribed'),
    loading: t('pushNotifications.loading'),
    enable: t('pushNotifications.enable'),
    promptInline: t('pushNotifications.promptInline'),
    enableShort: t('pushNotifications.enableShort'),
    title: t('pushNotifications.title'),
    description: t('pushNotifications.description'),
    notNow: t('pushNotifications.notNow'),
  };

  // Don't show if not supported, already subscribed, denied, or dismissed
  if (!isSupported || isSubscribed || permission === 'denied' || isDismissed) {
    return null;
  }

  const handleSubscribe = async () => {
    const success = await subscribe();
    if (success) {
      setShowSuccess(true);
      setTimeout(() => {
        setIsDismissed(true);
        onDismiss?.();
      }, 2000);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  // Success state
  if (showSuccess) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Check className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm text-foreground">
            {texts.subscribed}
          </p>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (variant === 'minimal') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleSubscribe}
        disabled={isLoading}
        className="gap-2"
      >
        <Bell className="w-4 h-4" />
        {isLoading ? texts.loading : texts.enable}
      </Button>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
        <Bell className="w-5 h-5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground">
            {texts.promptInline}
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleSubscribe}
          disabled={isLoading}
        >
          {isLoading ? '...' : texts.enableShort}
        </Button>
      </div>
    );
  }

  // Banner variant (default)
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-4 shadow-sm"
      >
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted/50 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="flex items-start gap-4 pr-6">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <Bell className="w-6 h-6 text-primary" />
          </div>
          
          <div className="flex-1 space-y-2">
            <h4 className="font-medium text-foreground">
              {texts.title}
            </h4>
            <p className="text-sm text-muted-foreground">
              {texts.description}
            </p>
            
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                onClick={handleSubscribe}
                disabled={isLoading}
                className="gap-2"
              >
                <Bell className="w-4 h-4" />
                {isLoading ? texts.loading : texts.enable}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
              >
                {texts.notNow}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
