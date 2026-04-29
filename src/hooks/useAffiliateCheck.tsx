import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface AffiliateStatus {
  isAffiliate: boolean;
  isPartnerManager: boolean;
  status: 'pending' | 'active' | 'suspended' | 'rejected' | null;
  affiliateId: string | null;
  affiliateCode: string | null;
}

export function useAffiliateCheck() {
  const { user, loading: authLoading } = useAuth();
  const [affiliateStatus, setAffiliateStatus] = useState<AffiliateStatus>({
    isAffiliate: false,
    isPartnerManager: false,
    status: null,
    affiliateId: null,
    affiliateCode: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAffiliateStatus() {
      if (!user || authLoading) {
        setAffiliateStatus({
          isAffiliate: false,
          isPartnerManager: false,
          status: null,
          affiliateId: null,
          affiliateCode: null,
        });
        setLoading(authLoading);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('affiliates')
          .select('id, affiliate_code, affiliate_type, status')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking affiliate status:', error);
          setAffiliateStatus({
            isAffiliate: false,
            isPartnerManager: false,
            status: null,
            affiliateId: null,
            affiliateCode: null,
          });
        } else if (data) {
          setAffiliateStatus({
            isAffiliate: true,
            isPartnerManager: data.affiliate_type === 'partner_manager',
            status: data.status as AffiliateStatus['status'],
            affiliateId: data.id,
            affiliateCode: data.affiliate_code,
          });
        } else {
          setAffiliateStatus({
            isAffiliate: false,
            isPartnerManager: false,
            status: null,
            affiliateId: null,
            affiliateCode: null,
          });
        }
      } catch (error) {
        console.error('Unexpected error checking affiliate status:', error);
        setAffiliateStatus({
          isAffiliate: false,
          isPartnerManager: false,
          status: null,
          affiliateId: null,
          affiliateCode: null,
        });
      } finally {
        setLoading(false);
      }
    }

    checkAffiliateStatus();
  }, [user, authLoading]);

  return { ...affiliateStatus, loading };
}
