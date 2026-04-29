import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DisplaySetting {
  field_name: string;
  display_name: string;
  is_visible: boolean;
  display_order: number;
  field_category: string;
}

export function usePackageDisplaySettings() {
  const [settings, setSettings] = useState<DisplaySetting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('package_display_settings')
        .select('field_name, display_name, is_visible, display_order, field_category')
        .eq('is_visible', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error fetching display settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const isFieldVisible = (fieldName: string) => {
    // Critical fields that should ALWAYS be visible
    const criticalFields = ['price', 'data_amount', 'validity_days'];
    if (criticalFields.includes(fieldName)) return true;
    
    // If no settings exist, default to showing fields so details are visible
    if (settings.length === 0) return true;
    const setting = settings.find(s => s.field_name === fieldName);
    return setting?.is_visible ?? false;
  };

  return { settings, loading, isFieldVisible };
}