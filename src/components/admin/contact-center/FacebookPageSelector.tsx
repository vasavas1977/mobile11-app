import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Facebook, Loader2, CheckCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface FacebookPage {
  id: string;
  name: string;
  category?: string;
  picture?: string;
  access_token: string;
}

interface FacebookPageSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pages: FacebookPage[];
  onSelect: (page: FacebookPage) => Promise<void>;
}

export function FacebookPageSelector({
  open,
  onOpenChange,
  pages,
  onSelect,
}: FacebookPageSelectorProps) {
  const [selectedPage, setSelectedPage] = useState<FacebookPage | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (!selectedPage) return;
    
    setIsConnecting(true);
    try {
      await onSelect(selectedPage);
    } finally {
      setIsConnecting(false);
      setSelectedPage(null);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isConnecting) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setSelectedPage(null);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Facebook className="h-5 w-5 text-[#1877F2]" />
            Select a Facebook Page
          </DialogTitle>
          <DialogDescription>
            Choose which Facebook Page you want to connect to your Contact Center.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[300px] pr-4">
          <div className="space-y-2">
            {pages.map((page) => (
              <button
                key={page.id}
                onClick={() => setSelectedPage(page)}
                disabled={isConnecting}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                  selectedPage?.id === page.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={page.picture} />
                  <AvatarFallback>
                    <Facebook className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{page.name}</p>
                  {page.category && (
                    <p className="text-xs text-muted-foreground truncate">
                      {page.category}
                    </p>
                  )}
                </div>
                {selectedPage?.id === page.id && (
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isConnecting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConnect}
            disabled={!selectedPage || isConnecting}
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect Page'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
