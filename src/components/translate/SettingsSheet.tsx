import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { LayoutMode, InputMode, FontSizeLevel, OutputMode } from '@/types/translate';
import { Monitor, Users, Columns, Mic, Hand, Volume2, Type } from 'lucide-react';

interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
  layoutMode: LayoutMode;
  onLayoutChange: (mode: LayoutMode) => void;
  inputMode: InputMode;
  onInputModeChange: (mode: InputMode) => void;
  fontSize: FontSizeLevel;
  onFontSizeChange: (size: FontSizeLevel) => void;
  outputMode: OutputMode;
  onOutputModeChange: (mode: OutputMode) => void;
  onEndSession: () => void;
}

const layouts: { mode: LayoutMode; label: string; icon: typeof Monitor }[] = [
  { mode: 'single', label: 'Single', icon: Monitor },
  { mode: 'face-to-face', label: 'Face to Face', icon: Users },
  { mode: 'side-by-side', label: 'Side by Side', icon: Columns },
];

const inputModes: { mode: InputMode; label: string; icon: typeof Mic }[] = [
  { mode: 'realtime', label: 'Realtime', icon: Mic },
  { mode: 'hold-to-talk', label: 'Hold to Talk', icon: Hand },
];

const outputModes: { mode: OutputMode; label: string; icon: typeof Volume2 }[] = [
  { mode: 'voice', label: 'Voice + Text', icon: Volume2 },
  { mode: 'text-only', label: 'Text Only', icon: Type },
];

const fontSizes: { size: FontSizeLevel; label: string }[] = [
  { size: 'small', label: 'A' },
  { size: 'default', label: 'A' },
  { size: 'large', label: 'A' },
];

export function SettingsSheet({
  open, onClose, layoutMode, onLayoutChange, inputMode, onInputModeChange,
  fontSize, onFontSizeChange, outputMode, onOutputModeChange, onEndSession
}: SettingsSheetProps) {
  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Settings</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-6 space-y-6">
          {/* Layout */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Layout</p>
            <div className="grid grid-cols-3 gap-2">
              {layouts.map(l => (
                <button
                  key={l.mode}
                  onClick={() => onLayoutChange(l.mode)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-colors ${
                    layoutMode === l.mode
                      ? 'bg-orange-50 border-orange-300 text-orange-700'
                      : 'border-gray-200 hover:bg-gray-50 text-foreground'
                  }`}
                >
                  <l.icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{l.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Output mode */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Output</p>
            <div className="grid grid-cols-2 gap-2">
              {outputModes.map(m => (
                <button
                  key={m.mode}
                  onClick={() => onOutputModeChange(m.mode)}
                  className={`flex items-center gap-2 p-3 rounded-xl border transition-colors ${
                    outputMode === m.mode
                      ? 'bg-orange-50 border-orange-300 text-orange-700'
                      : 'border-gray-200 hover:bg-gray-50 text-foreground'
                  }`}
                >
                  <m.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Input mode */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Input Mode</p>
            <div className="grid grid-cols-2 gap-2">
              {inputModes.map(m => (
                <button
                  key={m.mode}
                  onClick={() => onInputModeChange(m.mode)}
                  className={`flex items-center gap-2 p-3 rounded-xl border transition-colors ${
                    inputMode === m.mode
                      ? 'bg-orange-50 border-orange-300 text-orange-700'
                      : 'border-gray-200 hover:bg-gray-50 text-foreground'
                  }`}
                >
                  <m.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Font size */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Font Size</p>
            <div className="grid grid-cols-3 gap-2">
              {fontSizes.map((f, i) => (
                <button
                  key={f.size}
                  onClick={() => onFontSizeChange(f.size)}
                  className={`p-3 rounded-xl border transition-colors ${
                    fontSize === f.size
                      ? 'bg-orange-50 border-orange-300 text-orange-700'
                      : 'border-gray-200 hover:bg-gray-50 text-foreground'
                  }`}
                >
                  <span className={`font-semibold ${i === 0 ? 'text-sm' : i === 1 ? 'text-base' : 'text-xl'}`}>
                    {f.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* End session */}
          <Button variant="destructive" onClick={onEndSession} className="w-full rounded-xl h-12">
            End Session
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
