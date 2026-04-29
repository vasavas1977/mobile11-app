import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface DeviceToggleProps {
  activeDevice: 'android' | 'ios';
  onDeviceChange: (device: 'android' | 'ios') => void;
}

export function DeviceToggle({ activeDevice, onDeviceChange }: DeviceToggleProps) {
  const { t } = useLanguage();

  return (
    <div className="flex justify-center mb-8">
      <div className="inline-flex rounded-xl bg-muted p-1.5 gap-1">
        <button
          onClick={() => onDeviceChange('android')}
          className={cn(
            'flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200',
            activeDevice === 'android'
              ? 'bg-card text-foreground shadow-md'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.523 15.341c.134-.133.208-.315.208-.502v-4.89c0-.188-.074-.37-.208-.504-.133-.133-.315-.207-.502-.207s-.37.074-.503.207c-.134.134-.208.316-.208.504v4.89c0 .187.074.369.208.502.133.134.315.208.503.208s.369-.074.502-.208zm-11.046 0c.134-.133.208-.315.208-.502v-4.89c0-.188-.074-.37-.208-.504-.133-.133-.315-.207-.503-.207s-.369.074-.502.207c-.134.134-.208.316-.208.504v4.89c0 .187.074.369.208.502.133.134.315.208.502.208s.37-.074.503-.208zm1.664 4.753h.002v2.155c0 .414.168.79.44 1.06.27.272.645.44 1.06.44.413 0 .788-.168 1.059-.44.271-.27.439-.646.439-1.06v-2.155h1.718v2.155c0 .414.168.79.439 1.06.271.272.646.44 1.06.44.413 0 .788-.168 1.059-.44.271-.27.44-.646.44-1.06v-2.155h.001c.55 0 1.048-.223 1.41-.583.36-.361.584-.86.584-1.41V9.837H6.148v8.264c0 .55.223 1.049.583 1.41.361.36.86.583 1.41.583zm8.169-14.58l.915-1.587c.05-.087.02-.198-.067-.248-.088-.05-.199-.02-.248.067l-.926 1.606c-.785-.357-1.664-.556-2.584-.556-.92 0-1.799.199-2.584.556l-.926-1.606c-.05-.087-.16-.117-.248-.067-.087.05-.117.161-.067.248l.915 1.587C8.928 6.534 7.57 8.06 7.148 9.837h9.704c-.422-1.777-1.78-3.303-3.542-4.323zm-5.25 2.485c-.276 0-.5-.224-.5-.5s.224-.5.5-.5.5.224.5.5-.224.5-.5.5zm4.88 0c-.276 0-.5-.224-.5-.5s.224-.5.5-.5.5.224.5.5-.224.5-.5.5z"/>
          </svg>
          <span>{t('guide.device.android')}</span>
        </button>
        <button
          onClick={() => onDeviceChange('ios')}
          className={cn(
            'flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200',
            activeDevice === 'ios'
              ? 'bg-card text-foreground shadow-md'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          <span>{t('guide.device.ios')}</span>
        </button>
      </div>
    </div>
  );
}
