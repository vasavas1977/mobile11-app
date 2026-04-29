import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAdminCheck } from '@/hooks/useAdminCheck';

type DataMode = 'live' | 'sample';

interface PartnerDataModeContextValue {
  mode: DataMode;
  setMode: (mode: DataMode) => void;
  isSampleMode: boolean;
  /** True when sample mode is active — all mutations should be blocked */
  isReadOnly: boolean;
  /** Whether the current user is allowed to toggle sample mode */
  canAccessSampleMode: boolean;
  /** Whether role check is still loading */
  roleLoading: boolean;
}

const PartnerDataModeContext = createContext<PartnerDataModeContextValue | null>(null);

export function PartnerDataModeProvider({ children }: { children: ReactNode }) {
  const { isAdmin, loading: roleLoading } = useAdminCheck();

  const [mode, setModeState] = useState<DataMode>(() => {
    try {
      const stored = localStorage.getItem('partner_data_mode');
      return stored === 'sample' ? 'sample' : 'live';
    } catch {
      return 'live';
    }
  });

  // Force back to live if user is not admin (after role loads)
  useEffect(() => {
    if (!roleLoading && !isAdmin && mode === 'sample') {
      setModeState('live');
      try { localStorage.setItem('partner_data_mode', 'live'); } catch {}
    }
  }, [roleLoading, isAdmin, mode]);

  const setMode = (newMode: DataMode) => {
    // Block non-admins from switching to sample
    if (newMode === 'sample' && !isAdmin) return;
    setModeState(newMode);
    try { localStorage.setItem('partner_data_mode', newMode); } catch {}
  };

  const isSampleMode = mode === 'sample';

  return (
    <PartnerDataModeContext.Provider value={{
      mode,
      setMode,
      isSampleMode,
      isReadOnly: isSampleMode,
      canAccessSampleMode: !roleLoading && isAdmin,
      roleLoading,
    }}>
      {children}
    </PartnerDataModeContext.Provider>
  );
}

export function usePartnerDataMode() {
  const ctx = useContext(PartnerDataModeContext);
  if (!ctx) throw new Error('usePartnerDataMode must be used within PartnerDataModeProvider');
  return ctx;
}
