import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { COMPATIBLE_DEVICES, getPhoneBrands, type DeviceBrand, type DeviceBrandKey } from '@/constants/compatibleDevices';
import { Search, CheckCircle2, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CompatibilityCheckDialog() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ios' | 'android'>('ios');
  const [search, setSearch] = useState('');

  const phoneBrands = useMemo(() => getPhoneBrands(), []);

  const iosBrands = useMemo(() => 
    phoneBrands.filter(([key]) => key === 'apple'),
    [phoneBrands]
  );

  const androidBrands = useMemo(() => 
    phoneBrands.filter(([key]) => key !== 'apple'),
    [phoneBrands]
  );

  const currentBrands = activeTab === 'ios' ? iosBrands : androidBrands;

  const filteredBrands = useMemo(() => {
    if (!search.trim()) return currentBrands;
    const q = search.toLowerCase();
    return currentBrands
      .map(([key, brand]) => {
        const matchBrand = brand.name.toLowerCase().includes(q);
        const matchedDevices = brand.devices.filter(d => d.toLowerCase().includes(q));
        if (matchBrand || matchedDevices.length > 0) {
          return [key, { ...brand, devices: matchBrand ? brand.devices : matchedDevices }] as [DeviceBrandKey, DeviceBrand];
        }
        return null;
      })
      .filter(Boolean) as [DeviceBrandKey, DeviceBrand][];
  }, [currentBrands, search]);

  const conditions = [
    t('compatibilityDialog.condition1'),
    t('compatibilityDialog.condition2'),
    t('compatibilityDialog.condition3'),
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-brand text-brand-foreground hover:bg-brand/90">
          <Smartphone className="w-4 h-4 mr-2" />
          {t('countryPage.checkCompatibility')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-0 gap-0 !bg-[#FAF7F2] border-gray-200">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-lg font-bold text-gray-900">
            {t('compatibilityDialog.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 space-y-4">
          {/* Conditions */}
          <div className="space-y-2">
            <p className="text-sm text-gray-500 font-medium">
              {t('compatibilityDialog.conditionsTitle')}
            </p>
            {conditions.map((c, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{c}</span>
              </div>
            ))}
          </div>

          {/* Info text */}
          <p className="text-xs text-gray-400">{t('compatibilityDialog.infoText')}</p>

          {/* Tabs */}
          <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => { setActiveTab('ios'); setSearch(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                activeTab === 'ios'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              iOS
            </button>
            <button
              onClick={() => { setActiveTab('android'); setSearch(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                activeTab === 'android'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Android
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              placeholder={t('compatibilityDialog.searchDevices') as string}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />
          </div>
        </div>

        {/* Scrollable device list */}
        <div className="flex-1 mt-4 overflow-y-auto min-h-0" style={{ maxHeight: '340px' }}>
          <div className="px-6 pb-6 space-y-5">
            {filteredBrands.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                {t('compatibilityDialog.noDevicesFound')}
              </p>
            ) : (
              filteredBrands.map(([key, brand]) => (
                <div key={key}>
                  <h3 className="text-sm font-bold text-gray-900 mb-2">{brand.name}</h3>
                  <div className="space-y-1">
                    {brand.devices.map((device, i) => (
                      <p key={i} className="text-sm text-gray-600 pl-1">{device}</p>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
