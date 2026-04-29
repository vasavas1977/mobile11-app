import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ChangeEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail: string;
  onSuccess?: () => void;
}

export const ChangeEmailModal: React.FC<ChangeEmailModalProps> = ({
  open,
  onOpenChange,
  currentEmail,
  onSuccess,
}) => {
  const { t } = useLanguage();
  const [newEmail, setNewEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEmail || newEmail === currentEmail) {
      toast.error(t('profile.changeEmail.differentEmail'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast.error(t('profile.changeEmail.invalidEmail'));
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;

      // Also sync to profiles table
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        await supabase.from('profiles').update({ email: newEmail }).eq('user_id', authUser.id);
      }
      
      toast.success(t('profile.changeEmail.success'));
      onOpenChange(false);
      setNewEmail('');
      onSuccess?.();
    } catch (error) {
      const msg = (error as Error).message || '';
      if (msg === 'session_expired' || msg.includes('sub claim') || msg.includes('not exist')) {
        toast.error(t('profile.changeEmail.sessionExpired') || 'Your session has expired. Please log in again.');
        const { supabase } = await import('@/integrations/supabase/client');
        await supabase.auth.signOut();
        onOpenChange(false);
      } else {
        toast.error('Failed to update email: ' + msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-gray-900">{t('profile.changeEmail.title')}</DialogTitle>
          <DialogDescription className="text-gray-600">
            {t('profile.changeEmail.description')}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label className="text-sm text-gray-900 font-medium">{t('profile.changeEmail.currentEmail')}</Label>
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
              <Mail className="w-4 h-4 text-gray-500" />
              <span className="text-gray-900">{currentEmail}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="newEmail" className="text-gray-900 font-medium">{t('profile.changeEmail.newEmail')}</Label>
            <Input
              id="newEmail"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder={t('profile.changeEmail.placeholder')}
              className="h-12 rounded-xl bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:ring-orange-500"
              required
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 rounded-full bg-white border-gray-300 text-gray-900 hover:bg-gray-50">
              {t('profile.changeEmail.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading || !newEmail} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-full">
              {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('profile.changeEmail.sending')}</> : t('profile.changeEmail.update')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};