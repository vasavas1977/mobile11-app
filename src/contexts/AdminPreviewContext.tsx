import { createContext, useContext, ReactNode } from 'react';

interface AdminPreviewContextType {
  /** The user ID being previewed (null if not in preview mode) */
  previewUserId: string | null;
  /** Whether we're in admin preview mode */
  isAdminPreview: boolean;
  /** Customer name for display in banner */
  customerName: string | null;
  /** Customer email for display in banner */
  customerEmail: string | null;
}

const AdminPreviewContext = createContext<AdminPreviewContextType>({
  previewUserId: null,
  isAdminPreview: false,
  customerName: null,
  customerEmail: null,
});

interface AdminPreviewProviderProps {
  children: ReactNode;
  userId: string;
  customerName?: string | null;
  customerEmail?: string | null;
}

export function AdminPreviewProvider({ 
  children, 
  userId, 
  customerName = null, 
  customerEmail = null 
}: AdminPreviewProviderProps) {
  return (
    <AdminPreviewContext.Provider value={{
      previewUserId: userId,
      isAdminPreview: true,
      customerName,
      customerEmail,
    }}>
      {children}
    </AdminPreviewContext.Provider>
  );
}

export function useAdminPreview() {
  return useContext(AdminPreviewContext);
}
