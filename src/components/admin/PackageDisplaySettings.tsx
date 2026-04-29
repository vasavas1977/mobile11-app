import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save, Eye, EyeOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DisplaySetting {
  id: string;
  field_name: string;
  display_name: string;
  is_visible: boolean;
  display_order: number;
  field_category: string;
}

export function PackageDisplaySettings() {
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
    setSettings(settings.map(s => 
      s.id === id ? { ...s, is_visible: !s.is_visible } : s
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = settings.map(setting => ({
        id: setting.id,
        is_visible: setting.is_visible
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('package_display_settings')
          .update({ is_visible: update.is_visible })
          .eq('id', update.id);

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
        description: "Failed to save settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'basic': return 'bg-blue-100 text-blue-800';
      case 'network': return 'bg-purple-100 text-purple-800';
      case 'details': return 'bg-green-100 text-green-800';
      case 'technical': return 'bg-orange-100 text-orange-800';
      case 'features': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const groupedSettings = settings.reduce((acc, setting) => {
    const category = setting.field_category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(setting);
    return acc;
  }, {} as Record<string, DisplaySetting[]>);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded w-1/3 animate-pulse"></div>
        <div className="h-64 bg-muted rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Package Display Settings</h1>
          <p className="text-muted-foreground">
            Control which fields are visible to customers on the package cards
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid gap-6">
        {Object.entries(groupedSettings).map(([category, categorySettings]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-lg capitalize">{category} Fields</CardTitle>
              <CardDescription>
                {categorySettings.filter(s => s.is_visible).length} of {categorySettings.length} visible
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {categorySettings.map((setting) => (
                  <div
                    key={setting.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col gap-1">
                        <Label 
                          htmlFor={setting.id}
                          className="font-medium cursor-pointer"
                        >
                          {setting.display_name}
                        </Label>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {setting.field_name}
                          </code>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getCategoryColor(setting.field_category)}`}
                          >
                            {setting.field_category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {setting.is_visible ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Switch
                        id={setting.id}
                        checked={setting.is_visible}
                        onCheckedChange={() => toggleVisibility(setting.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>
    </div>
  );
}