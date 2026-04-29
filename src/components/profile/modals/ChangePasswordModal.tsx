import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, Check, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ChangePasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ open, onOpenChange }) => {
  const { t } = useLanguage();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const isValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) { toast.error(t('profile.changePassword.requirementsFailed')); return; }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success(t('profile.changePassword.success'));
      onOpenChange(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error('Failed to update password: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const PasswordRule = ({ met, label }: { met: boolean; label: string }) => (
    <div className="flex items-center gap-2 text-sm">
      {met ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-gray-400" />}
      <span className={met ? 'text-green-600' : 'text-gray-500'}>{label}</span>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-gray-900">{t('profile.changePassword.title')}</DialogTitle>
          <DialogDescription className="text-gray-600">{t('profile.changePassword.description')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-gray-900 font-medium">{t('profile.changePassword.newPassword')}</Label>
            <div className="relative">
              <Input id="newPassword" type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={t('profile.changePassword.placeholder')} className="h-12 rounded-xl pr-10 bg-white border-gray-300 text-gray-900" required />
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {newPassword.length > 0 && (
            <div className="space-y-1 p-3 bg-gray-50 rounded-xl border border-gray-200">
              <PasswordRule met={hasMinLength} label={t('profile.changePassword.requirements.minLength')} />
              <PasswordRule met={hasUppercase} label={t('profile.changePassword.requirements.uppercase')} />
              <PasswordRule met={hasLowercase} label={t('profile.changePassword.requirements.lowercase')} />
              <PasswordRule met={hasNumber} label={t('profile.changePassword.requirements.number')} />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-gray-900 font-medium">{t('profile.changePassword.confirmPassword')}</Label>
            <div className="relative">
              <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={t('profile.changePassword.confirmPlaceholder')} className="h-12 rounded-xl pr-10 bg-white border-gray-300 text-gray-900" required />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && <p className="text-sm text-red-500">{t('profile.changePassword.passwordsDoNotMatch')}</p>}
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 rounded-full bg-white border-gray-300 text-gray-900 hover:bg-gray-50">{t('profile.changePassword.cancel')}</Button>
            <Button type="submit" disabled={isLoading || !isValid} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-full">
              {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('profile.changePassword.updating')}</> : t('profile.changePassword.update')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};