import { RefreshCw, Clock, Zap, Calendar } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getDateLocale } from '@/lib/dateLocale';
import { useState, useEffect } from 'react';

interface DayPassUsageCardProps {
  usage: {
    validFrom: string | null;
    validUntil: string | null;
    remainingData?: string | null;
    dataUsed?: string | null;
    usageMb?: number;
    remainingDataMb?: number | null;
    // Day Pass specific
    isDayPass?: boolean;
    dailyAllowance?: string;
    dailyAllowanceMb?: number;
    todayUsedMb?: number;
    todayRemainingMb?: number;
    currentDay?: number;
    totalDays?: number;
    nextResetTime?: string | null;
    secondsUntilReset?: number;
    speedStatus?: 'high-speed' | 'throttled';
    fallbackSpeed?: string;
  };
  packageData?: {
    package_type?: string | null;
    daily_reset_amount?: string | null;
    speed_after_limit?: string | null;
    validity_days?: number;
  };
}

export function DayPassUsageCard({ usage, packageData }: DayPassUsageCardProps) {
  const { t, language } = useLanguage();
  const [countdown, setCountdown] = useState<string>('');
  
  // Detect if this is a Limitless package (hide detailed usage)
  const normalizedType = (packageData?.package_type || '').toLowerCase().replace(/[\s_-]/g, '');
  const isLimitless = normalizedType.includes('limitless') || normalizedType.includes('unlimited');
  
  // Calculate values from available data
  const dailyAllowance = usage.dailyAllowance || packageData?.daily_reset_amount || '2GB';
  const dailyAllowanceMb = usage.dailyAllowanceMb || parseDataToMb(dailyAllowance);
  const todayUsedMb = usage.todayUsedMb ?? usage.usageMb ?? 0;
  const todayRemainingMb = usage.todayRemainingMb ?? Math.max(0, dailyAllowanceMb - todayUsedMb);
  const totalDays = usage.totalDays || packageData?.validity_days || 7;
  const fallbackSpeed = usage.fallbackSpeed || packageData?.speed_after_limit || '1 Mbps';
  
  // Calculate current day based on activeTime
  const currentDay = usage.currentDay || calculateCurrentDay(usage.validFrom, totalDays);
  
  // Check if this is the final day
  const isFinalDay = currentDay >= totalDays;
  
  // Calculate remaining percentage for today
  const todayPercentage = dailyAllowanceMb > 0 
    ? Math.max(0, Math.min(100, (todayRemainingMb / dailyAllowanceMb) * 100))
    : 100;
  
  // Determine speed status
  const speedStatus = usage.speedStatus || (todayRemainingMb > 0 ? 'high-speed' : 'throttled');
  
  // Calculate next reset time (24 hours from activeTime) - only if not final day
  const nextResetTime = !isFinalDay ? (usage.nextResetTime || calculateNextReset(usage.validFrom)) : null;
  
  // Calculate time until plan expires (for final day)
  const [expiryCountdown, setExpiryCountdown] = useState<string>('');
  
  // Live countdown effect
  useEffect(() => {
    const updateCountdown = () => {
      if (isFinalDay) {
        // On final day, show countdown to plan expiry
        if (!usage.validUntil) {
          setExpiryCountdown('--:--');
          return;
        }
        const now = new Date().getTime();
        const expiryTime = new Date(usage.validUntil).getTime();
        const diff = expiryTime - now;
        
        if (diff <= 0) {
          setExpiryCountdown(t('myEsims.expired') || 'Expired');
          return;
        }
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setExpiryCountdown(`${hours}h ${minutes}m`);
      } else {
        // Not final day, show next reset countdown
        if (!nextResetTime) {
          setCountdown('--:--');
          return;
        }
        
        const now = new Date().getTime();
        const resetTime = new Date(nextResetTime).getTime();
        const diff = resetTime - now;
        
        if (diff <= 0) {
          setCountdown(t('myEsims.resetting') || 'Resetting...');
          return;
        }
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setCountdown(`${hours}h ${minutes}m`);
      }
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [nextResetTime, isFinalDay, usage.validUntil, t]);
  
  // Format expiry date
  const locale = getDateLocale(language);
  const expiryDate = usage.validUntil 
    ? new Date(usage.validUntil).toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : null;
  

  // Calculate percentage USED (not remaining)
  const todayUsedPercentage = dailyAllowanceMb > 0 
    ? Math.max(0, Math.min(100, (todayUsedMb / dailyAllowanceMb) * 100))
    : 0;

  return (
    <div className="space-y-4">
      {/* Header with Day Counter */}
      <div className="flex items-center justify-end">
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          isFinalDay 
            ? 'bg-amber-50 text-amber-600' 
            : 'bg-blue-50 text-blue-600'
        }`}>
          {isFinalDay 
            ? (t('myEsims.finalDay') || 'Final Day')
            : `${t('myEsims.day') || 'Day'} ${currentDay} / ${totalDays}`
          }
        </div>
      </div>
      
      {/* Main Stats - Single Card Layout */}
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <RefreshCw className="w-4 h-4 text-blue-500" />
          <span className="text-xs text-gray-500">
            {isFinalDay 
              ? (t('myEsims.totalUsed') || 'Total Used')
              : (t('myEsims.todaysData') || "Today's Data")
            }
          </span>
        </div>
        
        {/* Two-value display - hide for Limitless plans */}
        {!isLimitless && (
          <div className="flex items-baseline gap-4 mb-2">
            {/* Used (secondary) */}
            <div>
              <span className="text-lg font-semibold text-gray-600">{formatMbToDisplay(todayUsedMb)}</span>
              <span className="text-xs text-gray-400 ml-1">{t('myEsims.used') || 'used'}</span>
            </div>
            {/* Remaining (primary - larger) */}
            <div>
              <span className="text-2xl font-bold text-gray-800">{formatMbToDisplay(todayRemainingMb)}</span>
              <span className="text-sm text-gray-500 ml-1">{t('myEsims.remaining') || 'remaining'}</span>
            </div>
          </div>
        )}
        
        {/* Single progress bar with percentage indicator */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                todayPercentage > 50 ? 'bg-green-500' :
                todayPercentage > 20 ? 'bg-orange-400' : 'bg-red-500'
              }`}
              style={{ width: `${todayPercentage}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 min-w-[28px]">
            {Math.round(todayPercentage)}%
          </span>
        </div>
        
        <p className="text-xs text-gray-400">
          {isLimitless 
            ? `${dailyAllowance} ${t('myEsims.dailyHighSpeed') || 'daily high-speed'}`
            : `${dailyAllowance} ${t('myEsims.dailyHighSpeed') || 'daily high-speed'} • ${t('myEsims.afterDailyLimit') || 'After limit'}: ${fallbackSpeed}`
          }
        </p>
      </div>
      
      {/* Next Reset OR Plan Expires row */}
      {isFinalDay ? (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-amber-600">{t('myEsims.planEnds') || 'Plan Ends'}</span>
          </div>
          
          <div className="mb-2">
            <span className="text-2xl font-bold text-amber-700">{expiryCountdown}</span>
          </div>
          
          <p className="text-xs text-amber-500">
            {t('myEsims.useDataBeforeExpiry') || 'Use your data before expiry'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-gray-500">{t('myEsims.nextReset') || 'Next Reset'}</span>
          </div>
          
          <div className="mb-2">
            <span className="text-2xl font-bold text-gray-800">{countdown}</span>
          </div>
          
          <p className="text-xs text-gray-400">
            {t('myEsims.untilReset') || 'until reset'}
          </p>
          
          {nextResetTime && (
            <p className="text-xs text-gray-400 mt-1">
              {new Date(nextResetTime).toLocaleTimeString(locale, {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          )}
        </div>
      )}
      
      {/* Speed Status Banner */}
      <div className={`rounded-xl p-3 flex items-center gap-3 ${
        speedStatus === 'high-speed' 
          ? 'bg-green-50 border border-green-100' 
          : 'bg-amber-50 border border-amber-100'
      }`}>
        <Zap className={`w-5 h-5 ${
          speedStatus === 'high-speed' ? 'text-green-500' : 'text-amber-500'
        }`} />
        <div>
          <p className={`text-sm font-medium ${
            speedStatus === 'high-speed' ? 'text-green-700' : 'text-amber-700'
          }`}>
            {speedStatus === 'high-speed' 
              ? (t('myEsims.highSpeedActive') || 'High-speed active')
              : (t('myEsims.throttledSpeed') || 'Reduced speed mode')
            }
          </p>
          <p className="text-xs text-gray-500">
            {t('myEsims.afterDailyLimit') || 'After daily limit'}: {fallbackSpeed}
          </p>
        </div>
      </div>
      
      {/* Plan Expiry - only show if not final day (final day has it in the card above) */}
      {!isFinalDay && expiryDate && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>{t('myEsims.planExpires') || 'Plan expires'}: {expiryDate}</span>
        </div>
      )}
    </div>
  );
}

// Helper functions
function parseDataToMb(dataStr: string): number {
  const match = dataStr.match(/^([\d.]+)\s*(GB|MB|TB)/i);
  if (!match) return 2048; // Default 2GB
  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  switch (unit) {
    case 'TB': return value * 1024 * 1024;
    case 'GB': return value * 1024;
    case 'MB': return value;
    default: return 2048;
  }
}

function formatMbToDisplay(mb: number): string {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)} GB`;
  }
  return `${Math.round(mb)} MB`;
}

function calculateCurrentDay(validFrom: string | null, totalDays: number): number {
  if (!validFrom) return 1;
  const start = new Date(validFrom).getTime();
  const now = Date.now();
  const daysPassed = Math.floor((now - start) / (24 * 60 * 60 * 1000));
  return Math.min(Math.max(1, daysPassed + 1), totalDays);
}

function calculateNextReset(validFrom: string | null): string | null {
  if (!validFrom) return null;
  
  const start = new Date(validFrom).getTime();
  const now = Date.now();
  const daysPassed = Math.floor((now - start) / (24 * 60 * 60 * 1000));
  
  // Next reset is (daysPassed + 1) * 24 hours from start
  const nextReset = new Date(start + (daysPassed + 1) * 24 * 60 * 60 * 1000);
  return nextReset.toISOString();
}
