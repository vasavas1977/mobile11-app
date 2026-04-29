import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { EsimQrCode } from '@/components/my-esims/EsimQrCode';
import { Copy, QrCode, Smartphone, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { detectDevice } from '@/lib/deviceDetection';
import { createAppleEsimUrl } from '@/lib/installationHelpers';

export default function InstallEsimPage() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const deviceInfo = useMemo(() => detectDevice(), []);

  useEffect(() => {
    async function fetchOrder() {
      if (!shortCode) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('get_esim_install_data', {
          p_short_code: shortCode,
        });

        if (error || !data) {
          setNotFound(true);
        } else {
          setOrder(data);
        }
      } catch {
        setNotFound(true);
      }
      setLoading(false);
    }

    fetchOrder();
  }, [shortCode]);

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: t('installEsimFlow.copied'), description: label, duration: 2000 });
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const LogoLink = () => (
    <Link to="/" className="flex items-center justify-center gap-2 mb-6">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
        <span className="text-white font-bold text-lg">M</span>
      </div>
      <span className="text-xl font-bold text-gray-800">Mobile11</span>
    </Link>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center">
        <LogoLink />
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-6">
        <LogoLink />
        <div className="text-center max-w-sm">
          <QrCode className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">eSIM Not Found</h1>
          <p className="text-gray-500 text-sm">This installation link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  const pkg = order.esim_packages;
  const esimName = pkg?.country_name || 'eSIM';

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-4">
      <LogoLink />
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white text-center">
          <Smartphone className="w-10 h-10 mx-auto mb-3" />
          <h1 className="text-xl font-bold mb-1">Install Your eSIM</h1>
          <p className="text-orange-100 text-sm">
            {esimName} {pkg?.data_amount && `• ${pkg.data_amount}`} {pkg?.validity_days && `• ${pkg.validity_days} days`}
          </p>
        </div>

        <div className="p-6">
          {/* Direct Install for iOS 17.4+ */}
          {deviceInfo.supportsOneClick && order.download_link && (
            <div className="mb-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border border-orange-200">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-5 h-5 text-orange-500" />
                <h2 className="font-bold text-gray-800">Direct Installation</h2>
                <span className="ml-auto text-xs font-semibold bg-orange-500 text-white px-2 py-0.5 rounded-full">
                  Recommended
                </span>
              </div>
              <p className="text-gray-500 text-sm mb-4">
                Tap the button below to install this eSIM directly on your iPhone — no QR code scanning needed.
              </p>
              <button
                onClick={() => window.open(createAppleEsimUrl(order.download_link), '_blank')}
                className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold text-base transition-colors flex items-center justify-center gap-2 shadow-md"
              >
                <Smartphone className="w-5 h-5" />
                Install eSIM Now
              </button>
            </div>
          )}

          {/* QR Code */}
          {(order.download_link || order.qr_code) && (
            <div className="mb-6">
              <p className="text-gray-600 text-sm text-center mb-4">
                {deviceInfo.supportsOneClick ? 'Or scan this QR code from another device:' : 'Scan this QR code from your device\'s eSIM settings to install:'}
              </p>
              <div className="flex justify-center">
                <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                  <EsimQrCode
                    qrCode={order.qr_code}
                    downloadLink={order.download_link}
                    size={220}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Manual details */}
          {(order.smdp_address || order.activation_code) && (
            <div className="bg-gray-50 rounded-xl overflow-hidden mb-6">
              <p className="px-4 pt-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Manual Installation
              </p>
              {order.smdp_address && (
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-400 text-xs mb-0.5">SM-DP+ Address</p>
                      <p className="text-gray-800 font-medium text-sm break-all">{order.smdp_address}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(order.smdp_address, 'SM-DP+ Address')}
                      className="ml-3 p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
                    >
                      <Copy className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              )}
              {order.activation_code && (
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-400 text-xs mb-0.5">Activation Code</p>
                      <p className="text-gray-800 font-medium text-sm break-all font-mono">{order.activation_code}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(order.activation_code, 'Activation Code')}
                      className="ml-3 p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
                    >
                      <Copy className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Steps */}
          <div className="space-y-3 mb-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">How to Install</p>
            {[
              'Go to Settings → Cellular/Mobile → Add eSIM',
              'Choose "Use QR Code" and scan the code above',
              'Or enter the SM-DP+ address and activation code manually',
              'Label your eSIM and select it for data usage',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-gray-700 text-sm">{step}</p>
              </div>
            ))}
          </div>

          {/* Branding */}
          <div className="text-center pt-4 border-t border-gray-100">
            <p className="text-gray-400 text-xs">Powered by <span className="font-semibold text-gray-500">Mobile11</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
