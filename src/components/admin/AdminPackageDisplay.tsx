import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save, Eye, EyeOff } from 'lucide-react';

interface DisplaySetting {
  id: string;
  field_name: string;
  display_name: string;
  is_visible: boolean;
  display_order: number;
  field_category: string;
}

export function AdminPackageDisplay() {
  const [settings, setSettings] = useState<DisplaySetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('package_display_settings')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error fetching display settings:', error);
      toast({
        title: "Error",
        description: "Failed to load display settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = (id: string) => {
    setSettings(settings.map(setting =>
      setting.id === id ? { ...setting, is_visible: !setting.is_visible } : setting
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const setting of settings) {
        const { error } = await supabase
          .from('package_display_settings')
          .update({ is_visible: setting.is_visible })
          .eq('id', setting.id);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Display settings saved successfully"
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save display settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (category: string, visible: boolean) => {
    setSettings(settings.map(setting =>
      setting.field_category === category ? { ...setting, is_visible: visible } : setting
    ));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-1/3 animate-pulse"></div>
        <div className="h-64 bg-muted rounded animate-pulse"></div>
      </div>
    );
  }

  const categories = Array.from(new Set(settings.map(s => s.field_category)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Package Display Settings</h1>
          <p className="text-muted-foreground">
            Control which package information is shown to customers
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid gap-6">
        {categories.map(category => {
          const categorySettings = settings.filter(s => s.field_category === category);
          const allVisible = categorySettings.every(s => s.is_visible);
          const someVisible = categorySettings.some(s => s.is_visible);

          return (
            <Card key={category}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="capitalize">{category} Information</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleCategory(category, true)}
                      disabled={allVisible}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Show All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleCategory(category, false)}
                      disabled={!someVisible}
                    >
                      <EyeOff className="h-4 w-4 mr-2" />
                      Hide All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categorySettings.map(setting => (
                    <div
                      key={setting.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <Label htmlFor={setting.id} className="font-medium cursor-pointer">
                          {setting.display_name}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Field: {setting.field_name}
                        </p>
                      </div>
                      <Switch
                        id={setting.id}
                        checked={setting.is_visible}
                        onCheckedChange={() => toggleVisibility(setting.id)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Preview Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-800">
            Changes will take effect immediately after saving. Visit the customer-facing 
            packages page to see how your changes look to end users.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}