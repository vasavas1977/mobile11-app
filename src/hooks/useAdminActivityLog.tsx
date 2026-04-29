import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Json } from '@/integrations/supabase/types';

export type ActionType = 
  | 'order_status_change'
  | 'order_refund'
  | 'user_role_change'
  | 'user_delete'
  | 'affiliate_approve'
  | 'affiliate_reject'
  | 'affiliate_suspend'
  | 'affiliate_status_change'
  | 'promo_code_create'
  | 'promo_code_update'
  | 'promo_code_delete'
  | 'ticket_status_change'
  | 'ticket_assign'
  | 'payout_process'
  | 'settings_change'
  | 'package_update';

export type EntityType = 
  | 'order'
  | 'user'
  | 'affiliate'
  | 'promo_code'
  | 'ticket'
  | 'payout'
  | 'settings'
  | 'package';

interface LogActivityParams {
  actionType: ActionType;
  entityType: EntityType;
  entityId?: string;
  oldValue?: Json;
  newValue?: Json;
  description: string;
  metadata?: Json;
}

export const useAdminActivityLog = () => {
  const { user } = useAuth();

  const logActivity = async (params: LogActivityParams) => {
    if (!user) {
      console.error('Cannot log activity: No user logged in');
      return null;
    }

    try {
      const { data, error } = await supabase.rpc('log_admin_activity', {
        p_admin_user_id: user.id,
        p_action_type: params.actionType,
        p_entity_type: params.entityType,
        p_entity_id: params.entityId || null,
        p_old_value: params.oldValue || null,
        p_new_value: params.newValue || null,
        p_description: params.description,
        p_metadata: params.metadata || {}
      });

      if (error) {
        console.error('Error logging admin activity:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error logging admin activity:', error);
      return null;
    }
  };

  return { logActivity };
};
