import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SystemSetting {
  id: string;
  category: string;
  key: string;
  value: any;
  data_type: string;
  description: string | null;
  is_public: boolean;
}

interface SettingsMap {
  [key: string]: any;
}

export function useSystemSettings() {
  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;

      // Convert array to key-value map
      const settingsMap: SettingsMap = {};
      data?.forEach((setting: SystemSetting) => {
        // Parse JSON value based on data_type
        let parsedValue = setting.value;
        if (setting.data_type === 'string' || setting.data_type === 'text') {
          parsedValue = typeof setting.value === 'string' ? setting.value : JSON.parse(setting.value);
        } else if (setting.data_type === 'boolean') {
          parsedValue = typeof setting.value === 'boolean' ? setting.value : setting.value === true || setting.value === 'true';
        } else if (setting.data_type === 'number') {
          parsedValue = typeof setting.value === 'number' ? setting.value : Number(setting.value);
        }
        
        settingsMap[setting.key] = parsedValue;
      });

      setSettings(settingsMap);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    setSaving(true);
    try {
      // Convert value to JSON for storage
      let jsonValue = value;
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        jsonValue = JSON.stringify(value);
      }

      const { error } = await supabase
        .from('system_settings')
        .update({ value: jsonValue })
        .eq('key', key);

      if (error) throw error;

      // Update local state
      setSettings(prev => ({ ...prev, [key]: value }));
      toast.success('Setting updated successfully');
      
      return true;
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error('Failed to update setting');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const getSetting = (key: string, defaultValue: any = null) => {
    return settings[key] ?? defaultValue;
  };

  return {
    settings,
    loading,
    saving,
    updateSetting,
    getSetting,
    refetch: fetchSettings,
  };
}
