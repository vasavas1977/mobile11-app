import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const AFFILIATE_COOKIE_KEY = 'mobile11_affiliate';
const AFFILIATE_EXPIRY_DAYS = 30;

interface AffiliateData {
  affiliateId: string;
  sessionId: string;
  expiresAt: string;
}

// Get affiliate data from cookie
export const getAffiliateData = (): AffiliateData | null => {
  try {
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${AFFILIATE_COOKIE_KEY}=`))
      ?.split('=')[1];
    
    if (!cookieValue) return null;
    
    const data = JSON.parse(decodeURIComponent(cookieValue)) as AffiliateData;
    
    // Check if expired
    if (new Date(data.expiresAt) < new Date()) {
      clearAffiliateData();
      return null;
    }
    
    return data;
  } catch {
    return null;
  }
};

// Set affiliate data in cookie
const setAffiliateData = (data: AffiliateData) => {
  const expiryDate = new Date(data.expiresAt);
  document.cookie = `${AFFILIATE_COOKIE_KEY}=${encodeURIComponent(JSON.stringify(data))}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
};

// Clear affiliate data
export const clearAffiliateData = () => {
  document.cookie = `${AFFILIATE_COOKIE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

// Get affiliate ID for checkout
export const getAffiliateIdForCheckout = (): string | null => {
  const data = getAffiliateData();
  return data?.affiliateId || null;
};

// Get session ID for checkout
export const getAffiliateSessionId = (): string | null => {
  const data = getAffiliateData();
  return data?.sessionId || null;
};

export function useAffiliateTracking() {
  const trackAffiliateClick = useCallback(async (ref: string | null, linkCode: string | null) => {
    if (!ref && !linkCode) return;

    // Check if we already have valid affiliate data
    const existingData = getAffiliateData();
    if (existingData) {
      console.log('Affiliate already tracked:', existingData.affiliateId);
      return;
    }

    try {
      console.log('Tracking affiliate click:', { ref, linkCode });
      
      const { data, error } = await supabase.functions.invoke('track-affiliate-click', {
        body: {
          ref,
          link_code: linkCode,
          destination: window.location.pathname,
        },
      });

      if (error) {
        console.error('Error tracking affiliate click:', error);
        return;
      }

      if (data?.success && data?.affiliate_id && data?.session_id) {
        const affiliateData: AffiliateData = {
          affiliateId: data.affiliate_id,
          sessionId: data.session_id,
          expiresAt: data.expires_at,
        };
        
        setAffiliateData(affiliateData);
        console.log('Affiliate tracked successfully:', affiliateData);
      }
    } catch (error) {
      console.error('Error in affiliate tracking:', error);
    }
  }, []);

  useEffect(() => {
    // Check URL for affiliate parameters
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    const linkCode = urlParams.get('link') || urlParams.get('l');

    if (ref || linkCode) {
      trackAffiliateClick(ref, linkCode);
      
      // Clean up URL by removing affiliate params
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('ref');
      newUrl.searchParams.delete('link');
      newUrl.searchParams.delete('l');
      
      // Only update URL if we removed params
      if (newUrl.href !== window.location.href) {
        window.history.replaceState({}, '', newUrl.href);
      }
    }
  }, [trackAffiliateClick]);

  return {
    getAffiliateData,
    getAffiliateIdForCheckout,
    getAffiliateSessionId,
    clearAffiliateData,
  };
}
