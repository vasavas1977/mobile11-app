import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { detectDevice } from '@/utils/deviceDetection';

const fetchLocation = async (): Promise<{ location: string; ip: string } | null> => {
  // Try ipapi.co first
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    if (data.city && data.country_name) {
      return {
        location: `${data.city}, ${data.country_name}`,
        ip: data.ip,
      };
    }
  } catch (error) {
    console.error('[TrustedDevice] ipapi.co failed:', error);
  }

  // Fallback to ip-api.com
  try {
    const response = await fetch('http://ip-api.com/json/');
    const data = await response.json();
    if (data.city && data.country) {
      return {
        location: `${data.city}, ${data.country}`,
        ip: data.query,
      };
    }
  } catch (error) {
    console.error('[TrustedDevice] ip-api.com fallback failed:', error);
  }

  return null;
};

export function useTrustedDevice() {
  const registerDevice = useCallback(async (userId: string) => {
    try {
      const { browser, os, deviceName } = detectDevice();
      const locationData = await fetchLocation();
      
      // First, mark all other devices as not current for this user
      await supabase
        .from('trusted_devices')
        .update({ is_current: false })
        .eq('user_id', userId);
      
      // Check if this device already exists (by browser + OS combination)
      const { data: existingDevices } = await supabase
        .from('trusted_devices')
        .select('id')
        .eq('user_id', userId)
        .eq('browser', browser)
        .eq('os', os)
        .limit(1);
      
      if (existingDevices && existingDevices.length > 0) {
        // Update existing device with refreshed location
        await supabase
          .from('trusted_devices')
          .update({
            is_current: true,
            last_used_at: new Date().toISOString(),
            location: locationData?.location || undefined,
            ip_address: locationData?.ip || undefined,
          })
          .eq('id', existingDevices[0].id);
      } else {
        // Insert new device
        await supabase
          .from('trusted_devices')
          .insert({
            user_id: userId,
            device_name: deviceName,
            browser,
            os,
            is_current: true,
            last_used_at: new Date().toISOString(),
            location: locationData?.location || null,
            ip_address: locationData?.ip || null,
          });
      }
      
      console.log('[TrustedDevice] Device registered successfully');
    } catch (error) {
      console.error('[TrustedDevice] Failed to register device:', error);
    }
  }, []);

  const removeDevice = useCallback(async (deviceId: string) => {
    const { error } = await supabase
      .from('trusted_devices')
      .delete()
      .eq('id', deviceId);
    
    if (error) {
      throw error;
    }
  }, []);

  return { registerDevice, removeDevice };
}
