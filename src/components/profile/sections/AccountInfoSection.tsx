import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Lock, X, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { ChangeEmailModal } from '../modals/ChangeEmailModal';
import { ChangePasswordModal } from '../modals/ChangePasswordModal';
import { useLanguage } from '@/contexts/LanguageContext';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  promotional_emails?: boolean;
}

interface AccountInfoSectionProps {
  profile: Profile | null | undefined;
}

export const AccountInfoSection: React.FC<AccountInfoSectionProps> = ({ profile }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [receiveEmails, setReceiveEmails] = useState(true);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setReceiveEmails(profile.promotional_emails ?? true);
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { first_name: string; last_name: string; promotional_emails: boolean }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success(t('profile.account.profileUpdated'));
    },
    onError: (error) => {
      toast.error('Failed to update profile: ' + (error as Error).message);
    },
  });

  const handleSave = () => {
    updateProfileMutation.mutate({
      first_name: firstName,
      last_name: lastName,
      promotional_emails: receiveEmails,
    });
  };

  const handleEmailToggle = async (checked: boolean) => {
    setReceiveEmails(checked);
    // Auto-save the toggle preference
    if (!user?.id) return;
    try {
      await supabase
        .from('profiles')
        .update({ promotional_emails: checked })
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Failed to save email preference:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">{t('profile.account.title')}</h2>
        
        <div className="space-y-5">
          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
              {t('profile.account.firstName')}
            </Label>
            <div className="relative">
              <Input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={t('profile.account.enterFirstName')}
                className="pr-10 bg-gray-50 border-gray-200 rounded-xl h-12 text-gray-900 placeholder:text-gray-500 caret-gray-900"
              />
              {firstName && (
                <button
                  onClick={() => setFirstName('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
              {t('profile.account.lastName')} <span className="text-gray-400">{t('profile.account.optional')}</span>
            </Label>
            <div className="relative">
              <Input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={t('profile.account.enterLastName')}
                className="pr-10 bg-gray-50 border-gray-200 rounded-xl h-12 text-gray-900 placeholder:text-gray-500 caret-gray-900"
              />
              {lastName && (
                <button
                  onClick={() => setLastName('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Email (read-only with edit button) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">{t('profile.account.email')}</Label>
            <div className="relative">
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-xl text-gray-600">
                <Mail className="w-4 h-4 text-gray-400" />
                <span>{user?.email || profile?.email}</span>
                <Lock className="w-4 h-4 text-gray-400 ml-auto" />
              </div>
            </div>
            <Button 
              variant="link" 
              className="text-orange-600 hover:text-orange-700 p-0 h-auto text-sm font-medium underline"
              onClick={() => setEmailModalOpen(true)}
            >
              {t('profile.account.edit')}
            </Button>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">{t('profile.account.currentPassword')}</Label>
            <div className="relative">
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-xl text-gray-600">
                <span>••••••••••••</span>
                <Lock className="w-4 h-4 text-gray-400 ml-auto" />
              </div>
            </div>
            <Button 
              variant="link" 
              className="text-orange-600 hover:text-orange-700 p-0 h-auto text-sm font-medium underline"
              onClick={() => setPasswordModalOpen(true)}
            >
              {t('profile.account.edit')}
            </Button>
          </div>

          {/* Promotional Emails Toggle */}
          <div className="flex items-center justify-between py-4 border-t border-gray-100">
            <span className="text-sm text-gray-700">
              {t('profile.account.promotionalEmails')}
            </span>
            <Switch
              checked={receiveEmails}
              onCheckedChange={handleEmailToggle}
              className="data-[state=checked]:bg-orange-500"
            />
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={updateProfileMutation.isPending}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full h-12 font-medium"
          >
            {updateProfileMutation.isPending ? t('profile.account.saving') : t('profile.account.saveChanges')}
          </Button>
        </div>
      </div>

      {/* Modals */}
      <ChangeEmailModal
        open={emailModalOpen}
        onOpenChange={setEmailModalOpen}
        currentEmail={user?.email || profile?.email || ''}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['profile'] })}
      />
      <ChangePasswordModal
        open={passwordModalOpen}
        onOpenChange={setPasswordModalOpen}
      />
    </div>
  );
};