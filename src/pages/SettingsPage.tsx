import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { FooterAiralo } from '@/components/landing/FooterAiralo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Phone, Lock, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

export function SettingsPage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const { t } = useLanguage();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: ''
  });

  // Update form data when profile loads
  useState(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || ''
      });
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('user_id', user?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast({
        title: t('settings.profileUpdated'),
        description: t('settings.profileUpdatedDescription')
      });
    },
    onError: (error) => {
      toast({
        title: t('settings.updateFailed'),
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    await updateProfileMutation.mutateAsync(formData);
    setIsUpdating(false);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5">
        <Header />
        <div className="flex items-center justify-center pt-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t('settings.title')}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t('settings.subtitle')}
            </p>
          </div>

          {/* Profile Information */}
          <Card className="border-0 shadow-elevation">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('settings.profileInfo')}
              </CardTitle>
              <CardDescription>
                {t('settings.profileInfoDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profileLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">{t('settings.firstName')}</Label>
                      <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        placeholder={t('settings.firstNamePlaceholder')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">{t('settings.lastName')}</Label>
                      <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        placeholder={t('settings.lastNamePlaceholder')}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('settings.emailAddress')}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={user.email || ''}
                        disabled
                        className="pl-10 bg-muted"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('settings.emailCannotChange')}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('settings.phoneNumber')}</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder={t('settings.phoneNumberPlaceholder')}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={isUpdating}
                    className="w-full"
                  >
                    {isUpdating ? t('settings.updating') : t('settings.updateProfile')}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="border-0 shadow-elevation">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                {t('settings.security')}
              </CardTitle>
              <CardDescription>
                {t('settings.securityDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">{t('settings.password')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.lastUpdated')}: {t('settings.notAvailable')}
                  </p>
                </div>
                <Button variant="outline" disabled>
                  {t('settings.changePassword')}
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">{t('settings.twoFactorAuth')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.twoFactorAuthDescription')}
                  </p>
                </div>
                <Button variant="outline" disabled>
                  {t('settings.setup2fa')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-0 shadow-elevation border-destructive/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                {t('settings.dangerZone')}
              </CardTitle>
              <CardDescription>
                {t('settings.dangerZoneDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                <h4 className="font-medium text-destructive mb-2">{t('settings.deleteAccount')}</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('settings.deleteAccountDescription')}
                </p>
                <Button variant="destructive" disabled>
                  {t('settings.deleteAccount')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <FooterAiralo />
    </div>
  );
}
