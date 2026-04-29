import { useContext } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Smartphone, Globe, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { LanguageContext } from '@/contexts/LanguageContext';
import { useState } from 'react';

interface LineLoginHelperProps {
  open: boolean;
  onClose: () => void;
  onOpenInApp: () => void;
  onContinueInBrowser: () => void;
  isLoading: boolean;
}

// Fallback translations for resilience
const fallbackTranslations = {
  en: {
    'auth.line.openingApp': 'Opening LINE...',
    'auth.line.appNotOpen': "If the LINE app doesn't open automatically, tap below:",
    'auth.line.openInApp': 'Open in LINE App',
    'auth.line.continueInBrowser': 'Continue in Browser',
    'auth.line.whyNotOpen': "Why didn't the app open?",
    'auth.line.reasonNotInstalled': 'LINE app may not be installed',
    'auth.line.reasonPrivate': "You're in private browsing mode",
    'auth.line.reasonDisabled': 'App links are disabled on your device',
  },
  th: {
    'auth.line.openingApp': 'กำลังเปิด LINE...',
    'auth.line.appNotOpen': 'หาก LINE ไม่เปิดโดยอัตโนมัติ กดปุ่มด้านล่าง:',
    'auth.line.openInApp': 'เปิดใน LINE App',
    'auth.line.continueInBrowser': 'ดำเนินการต่อในเบราว์เซอร์',
    'auth.line.whyNotOpen': 'ทำไม LINE ไม่เปิด?',
    'auth.line.reasonNotInstalled': 'อาจไม่ได้ติดตั้งแอป LINE',
    'auth.line.reasonPrivate': 'คุณอยู่ในโหมดส่วนตัว',
    'auth.line.reasonDisabled': 'ลิงก์แอปถูกปิดบนอุปกรณ์ของคุณ',
  },
  zh: {
    'auth.line.openingApp': '正在打开LINE...',
    'auth.line.appNotOpen': '如果LINE应用未自动打开，请点击下方：',
    'auth.line.openInApp': '在LINE应用中打开',
    'auth.line.continueInBrowser': '在浏览器中继续',
    'auth.line.whyNotOpen': '为什么应用没有打开？',
    'auth.line.reasonNotInstalled': '可能未安装LINE应用',
    'auth.line.reasonPrivate': '您正在使用隐私浏览模式',
    'auth.line.reasonDisabled': '您的设备上已禁用应用链接',
  },
};

export function LineLoginHelper({
  open,
  onClose,
  onOpenInApp,
  onContinueInBrowser,
  isLoading,
}: LineLoginHelperProps) {
  const langContext = useContext(LanguageContext);
  const language = langContext?.language || 'en';
  const [showHelp, setShowHelp] = useState(false);

  // Translation function with fallback
  const t = (key: string): string => {
    // Try to get from context first
    if (langContext?.t) {
      const translation = langContext.t(key);
      if (translation !== key) return translation;
    }
    // Fallback to local translations
    const lang = language as 'en' | 'th';
    const fallback = fallbackTranslations[lang] || fallbackTranslations.en;
    return (fallback as Record<string, string>)[key] || key;
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm p-6 rounded-3xl border-0 gap-0">
        <DialogTitle className="sr-only">LINE Login</DialogTitle>

        <div className="flex flex-col items-center text-center space-y-4">
          {/* LINE Logo with loading animation */}
          <div className="relative">
            <div className="h-16 w-16 rounded-full bg-[#06C755] flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-9 w-9 text-white fill-current">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
              </svg>
            </div>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-20 w-20 rounded-full border-2 border-[#06C755] border-t-transparent animate-spin" />
              </div>
            )}
          </div>

          {/* Title */}
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {t('auth.line.openingApp')}
            </h3>
            <p className="text-sm text-gray-500">
              {t('auth.line.appNotOpen')}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-3 pt-2">
            <Button
              onClick={onOpenInApp}
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-[#06C755] hover:bg-[#05B04C] text-white font-medium flex items-center justify-center gap-2"
            >
              <Smartphone className="h-5 w-5" />
              {t('auth.line.openInApp')}
            </Button>

            <Button
              onClick={onContinueInBrowser}
              disabled={isLoading}
              variant="outline"
              className="w-full h-12 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 font-medium flex items-center justify-center gap-2"
            >
              <Globe className="h-5 w-5" />
              {t('auth.line.continueInBrowser')}
            </Button>
          </div>

          {/* Help Section */}
          <div className="w-full pt-2">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mx-auto"
            >
              <HelpCircle className="h-4 w-4" />
              {t('auth.line.whyNotOpen')}
              {showHelp ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {showHelp && (
              <div className="mt-3 p-3 bg-gray-50 rounded-xl text-left">
                <ul className="space-y-2 text-sm text-gray-500">
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    {t('auth.line.reasonNotInstalled')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    {t('auth.line.reasonPrivate')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    {t('auth.line.reasonDisabled')}
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
