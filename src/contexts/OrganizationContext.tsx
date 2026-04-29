import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useOrganizations } from '@/hooks/useOrganization';
import { AuthContext } from '@/contexts/AuthContext';
import type { AuthContextType } from '@/contexts/AuthContext';
import type { OrganizationWithRole } from '@/types/organization';

interface OrganizationContextType {
  organizations: OrganizationWithRole[];
  currentOrg: OrganizationWithRole | null;
  setCurrentOrgId: (id: string | null) => void;
  isLoading: boolean;
  isOrgAdmin: boolean;
  isOrgManager: boolean;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

const ORG_STORAGE_KEY = 'current_organization_id';

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const authContext = useContext(AuthContext);
  const authLoading = authContext?.loading ?? true;
  const { data: organizations = [], isLoading: orgsLoading } = useOrganizations();
  
  // Combined loading state - wait for both auth AND orgs to load
  const isLoading = authLoading || orgsLoading;
  const [currentOrgId, setCurrentOrgIdState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(ORG_STORAGE_KEY);
    }
    return null;
  });

  // Set current org ID and persist to localStorage
  const setCurrentOrgId = (id: string | null) => {
    setCurrentOrgIdState(id);
    if (id) {
      localStorage.setItem(ORG_STORAGE_KEY, id);
    } else {
      localStorage.removeItem(ORG_STORAGE_KEY);
    }
  };

  // Auto-select first org if none selected or current org no longer exists
  useEffect(() => {
    if (isLoading) return;
    
    if (organizations.length > 0) {
      // If no org selected, or current org doesn't exist anymore, select first available
      const currentOrgExists = currentOrgId && organizations.find(o => o.id === currentOrgId);
      if (!currentOrgExists) {
        setCurrentOrgId(organizations[0].id);
      }
    } else if (currentOrgId) {
      // No orgs available, clear selection
      setCurrentOrgId(null);
    }
  }, [organizations, isLoading, currentOrgId]);

  const currentOrg = organizations.find(o => o.id === currentOrgId) || null;
  const userRole = currentOrg?.userRole;
  
  const isOrgAdmin = userRole === 'owner' || userRole === 'admin';
  const isOrgManager = isOrgAdmin || userRole === 'manager';

  return (
    <OrganizationContext.Provider
      value={{
        organizations: organizations as OrganizationWithRole[],
        currentOrg,
        setCurrentOrgId,
        isLoading,
        isOrgAdmin,
        isOrgManager,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganizationContext() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganizationContext must be used within an OrganizationProvider');
  }
  return context;
}
