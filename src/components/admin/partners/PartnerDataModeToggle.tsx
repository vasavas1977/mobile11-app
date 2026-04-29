import { usePartnerDataMode } from '@/contexts/PartnerDataModeContext';
import { Database, FlaskConical, Info, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAdminCheck } from '@/hooks/useAdminCheck';

export function PartnerDataModeToggle() {
  const { mode, setMode } = usePartnerDataMode();
  const { isAdmin, loading } = useAdminCheck();

  // While loading role, show only live mode button (no sample option visible)
  const canAccessSample = !loading && isAdmin;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-2.5">
        {/* Label */}
        <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider hidden sm:inline">
          Data Mode
        </span>

        {/* Segmented Control */}
        <div className="flex items-center bg-[#FAF7F2] border border-[#F3F0EB] rounded-lg p-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setMode('live')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all duration-150',
                  mode === 'live'
                    ? 'bg-white text-[#1A1A1A] shadow-sm ring-1 ring-[#F3F0EB]'
                    : 'text-[#9CA3AF] hover:text-[#6B7280]'
                )}
              >
                <Database className="h-3 w-3" />
                Live Data
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[11px] max-w-[200px]">
              Shows real partner records from the production database
            </TooltipContent>
          </Tooltip>

          {canAccessSample ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setMode('sample')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all duration-150',
                    mode === 'sample'
                      ? 'bg-white text-amber-600 shadow-sm ring-1 ring-amber-200/60'
                      : 'text-[#9CA3AF] hover:text-[#6B7280]'
                  )}
                >
                  <FlaskConical className="h-3 w-3" />
                  Sample Data
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[11px] max-w-[220px]">
                Shows seeded preview records for internal review — no production data is affected
              </TooltipContent>
            </Tooltip>
          ) : !loading ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium text-[#D1D5DB] cursor-not-allowed select-none">
                  <Lock className="h-3 w-3" />
                  Sample Data
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[11px] max-w-[200px]">
                Sample Data mode is restricted to authorized admin roles
              </TooltipContent>
            </Tooltip>
          ) : null}
        </div>

        {/* Active Sample Badge */}
        {mode === 'sample' && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200/80 rounded-full px-2.5 py-0.5 uppercase tracking-wide cursor-default">
                <Info className="h-2.5 w-2.5" />
                Preview Mode
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[11px] max-w-[220px]">
              You are viewing seeded sample data — switch to Live Data for production records
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
