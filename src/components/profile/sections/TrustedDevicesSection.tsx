import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Monitor, Info, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTrustedDevice } from '@/hooks/useTrustedDevice';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { getDateLocale } from '@/lib/dateLocale';

export const TrustedDevicesSection: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const { removeDevice } = useTrustedDevice();

  const locale = getDateLocale(language);

  const { data: devices = [] } = useQuery({
    queryKey: ['trusted-devices', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('trusted_devices')
        .select('*')
        .eq('user_id', user.id)
        .order('last_used_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const removeMutation = useMutation({
    mutationFn: removeDevice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trusted-devices', user?.id] });
      toast.success(t('profile.devices.deviceRemoved'));
    },
    onError: () => {
      toast.error('Failed to remove device');
    },
  });

  const handleRemoveDevice = (deviceId: string, isCurrent: boolean) => {
    if (isCurrent) {
      toast.error(t('profile.devices.cannotRemoveCurrent'));
      return;
    }
    removeMutation.mutate(deviceId);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t('profile.devices.title')}</h2>
        <p className="text-sm text-gray-500 mb-6">
          {t('profile.devices.description')}{' '}
          <Link to="/help-center/account/what-are-trusted-devices" className="text-orange-500 hover:underline">{t('profile.devices.learnMore')}</Link>
        </p>

        {/* Info Banner */}
        <div className="bg-blue-50 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700">
            {t('profile.devices.securityWarning')}
          </p>
        </div>

        {/* Devices List */}
        <div className="space-y-4">
          {devices.length === 0 ? (
            <div className="text-center py-8">
              <Monitor className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">{t('profile.devices.noDevices')}</p>
              <p className="text-sm text-gray-400 mt-1">
                {t('profile.devices.currentDeviceNote')}
              </p>
            </div>
          ) : (
            devices.map((device) => (
              <div 
                key={device.id}
                className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl"
              >
                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Monitor className="w-5 h-5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">
                      {device.browser} ({device.os})
                    </span>
                    {device.is_current && (
                      <Badge className="bg-cyan-100 text-cyan-700 hover:bg-cyan-100 text-xs">
                        {t('profile.devices.currentDevice')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('profile.devices.addedOn')} {new Date(device.created_at).toLocaleDateString(locale, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })} at {new Date(device.created_at).toLocaleTimeString(locale, {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                      timeZoneName: 'short',
                    })}
                  </p>
                  {device.location && (
                    <p className="text-sm text-gray-900 font-medium">
                      {device.location}
                    </p>
                  )}
                </div>
                {!device.is_current && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-red-500"
                    onClick={() => handleRemoveDevice(device.id, device.is_current || false)}
                    disabled={removeMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};