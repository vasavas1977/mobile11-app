import { Translate2Header } from './Translate2Header';
import { LayoutMode, InputMode, FontSizeLevel } from '@/types/translate';
import { Layout, Mic, Type, Trash2 } from 'lucide-react';

interface Translate2SettingsProps {
  layoutMode: LayoutMode;
  onLayoutChange: (m: LayoutMode) => void;
  inputMode: InputMode;
  onInputModeChange: (m: InputMode) => void;
  fontSize: FontSizeLevel;
  onFontSizeChange: (s: FontSizeLevel) => void;
}

const layoutOptions: { value: LayoutMode; label: string; desc: string }[] = [
  { value: 'single', label: 'Single', desc: 'Standard scrolling view' },
  { value: 'face-to-face', label: 'Face to Face', desc: 'Split screen for two people' },
  { value: 'side-by-side', label: 'Side by Side', desc: 'Two columns layout' },
];

const fontOptions: { value: FontSizeLevel; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'default', label: 'Default' },
  { value: 'large', label: 'Large' },
];

export function Translate2Settings(props: Translate2SettingsProps) {
  const { layoutMode, onLayoutChange, inputMode, onInputModeChange, fontSize, onFontSizeChange } = props;

  return (
    <div className="min-h-[100dvh] bg-white">
      <Translate2Header title="Settings" showBack />

      <div className="px-4 py-6 space-y-8">
        {/* Layout Mode */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Layout className="w-4 h-4 text-orange-500" />
            <h3 className="text-sm font-semibold text-foreground">Conversation Layout</h3>
          </div>
          <div className="space-y-2">
            {layoutOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => onLayoutChange(opt.value)}
                className={`w-full text-left p-3 rounded-xl border transition-colors ${
                  layoutMode === opt.value
                    ? 'bg-orange-50 border-orange-300'
                    : 'bg-white border-gray-200 hover:border-orange-200'
                }`}
              >
                <p className="text-sm font-medium text-foreground">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Input Mode */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Mic className="w-4 h-4 text-orange-500" />
            <h3 className="text-sm font-semibold text-foreground">Input Mode</h3>
          </div>
          <div className="flex gap-2">
            {(['hold-to-talk', 'realtime'] as InputMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => onInputModeChange(mode)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                  inputMode === mode
                    ? 'bg-orange-50 border-orange-300 text-orange-600'
                    : 'bg-white border-gray-200 text-foreground hover:border-orange-200'
                }`}
              >
                {mode === 'hold-to-talk' ? 'Hold to Talk' : 'Realtime'}
              </button>
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Type className="w-4 h-4 text-orange-500" />
            <h3 className="text-sm font-semibold text-foreground">Font Size</h3>
          </div>
          <div className="flex gap-2">
            {fontOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => onFontSizeChange(opt.value)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                  fontSize === opt.value
                    ? 'bg-orange-50 border-orange-300 text-orange-600'
                    : 'bg-white border-gray-200 text-foreground hover:border-orange-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Clear History */}
        <div className="pt-4 border-t border-gray-100">
          <button className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 transition-colors">
            <Trash2 className="w-4 h-4" />
            Clear Translation History
          </button>
        </div>
      </div>
    </div>
  );
}
