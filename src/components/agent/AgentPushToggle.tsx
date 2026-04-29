import { Bell, BellOff, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function AgentPushToggle() {
  const { permission, isSubscribed, isLoading, isSupported, subscribe, unsubscribe } = usePushNotifications();

  if (!isSupported) return null;

  const handleClick = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  const label = isSubscribed
    ? 'Push notifications enabled'
    : permission === 'denied'
      ? 'Notifications blocked in browser'
      : 'Enable push notifications';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 relative"
            onClick={handleClick}
            disabled={isLoading || permission === 'denied'}
          >
            {isSubscribed ? (
              <BellRing className="h-5 w-5 text-primary" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            )}
            {isSubscribed && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-green-500" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
