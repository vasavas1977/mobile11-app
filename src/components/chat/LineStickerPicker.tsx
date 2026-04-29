import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Smile } from 'lucide-react';
import { LINE_STICKER_PACKAGES, getStickerImageUrl } from '@/lib/lineStickers';
import { cn } from '@/lib/utils';

interface LineStickerPickerProps {
  onSelectSticker: (packageId: string, stickerId: string) => void;
  disabled?: boolean;
}

export function LineStickerPicker({ onSelectSticker, disabled }: LineStickerPickerProps) {
  const [open, setOpen] = useState(false);
  const [activePackage, setActivePackage] = useState(LINE_STICKER_PACKAGES[0].packageId);

  const handleSelectSticker = (packageId: string, stickerId: string) => {
    onSelectSticker(packageId, stickerId);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          disabled={disabled}
          className="shrink-0"
          title="Send sticker"
        >
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0" 
        align="start"
        side="top"
      >
        <Tabs value={activePackage} onValueChange={setActivePackage} className="w-full">
          <div className="border-b border-border">
            <ScrollArea className="w-full">
              <TabsList className="h-10 w-max rounded-none bg-transparent p-0">
                {LINE_STICKER_PACKAGES.map((pkg) => (
                  <TabsTrigger
                    key={pkg.packageId}
                    value={pkg.packageId}
                    className={cn(
                      "h-10 rounded-none border-b-2 border-transparent px-3 text-xs font-medium",
                      "data-[state=active]:border-primary data-[state=active]:bg-transparent"
                    )}
                  >
                    {pkg.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollArea>
          </div>
          
          {LINE_STICKER_PACKAGES.map((pkg) => (
            <TabsContent key={pkg.packageId} value={pkg.packageId} className="m-0">
              <ScrollArea className="h-64">
                <div className="grid grid-cols-4 gap-1 p-2">
                  {pkg.stickers.slice(0, 20).map((stickerId) => (
                    <button
                      key={stickerId}
                      onClick={() => handleSelectSticker(pkg.packageId, stickerId)}
                      className="aspect-square p-1 rounded-lg hover:bg-muted transition-colors flex items-center justify-center"
                    >
                      <img
                        src={getStickerImageUrl(stickerId)}
                        alt={`Sticker ${stickerId}`}
                        className="w-12 h-12 object-contain"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
