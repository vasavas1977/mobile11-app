import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sun, Gauge, Zap, Check, X, Infinity, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ComparisonRow {
  attribute: string;
  attributeShort: string;
  dayPass: string | boolean;
  maxSpeed: string | boolean;
  limitless: string | boolean;
}

export function PackageComparisonTable() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const comparisonData: ComparisonRow[] = [
  {
    attribute: t('planTypes.comparison.maxSpeed'),
    attributeShort: 'Speed',
    dayPass: t('planTypes.comparison.carrierSpeed'),
    maxSpeed: t('planTypes.comparison.carrierSpeed'),
    limitless: t('planTypes.comparison.upTo1Gbps')
  },
  {
    attribute: t('planTypes.comparison.dataPolicy'),
    attributeShort: 'Data',
    dayPass: t('planTypes.comparison.dailyQuota'),
    maxSpeed: t('planTypes.comparison.totalQuota'),
    limitless: t('planTypes.comparison.trulyUnlimited')
  },
  {
    attribute: t('planTypes.comparison.afterLimit'),
    attributeShort: 'After',
    dayPass: '384 Kbps',
    maxSpeed: '384 Kbps',
    limitless: t('planTypes.comparison.noThrottling')
  },
  {
    attribute: t('planTypes.comparison.dailyReset'),
    attributeShort: 'Reset',
    dayPass: true,
    maxSpeed: false,
    limitless: t('planTypes.comparison.notApplicable')
  },
  {
    attribute: t('planTypes.comparison.speedThrottling'),
    attributeShort: 'Throttle',
    dayPass: t('planTypes.comparison.afterDailyLimit'),
    maxSpeed: t('planTypes.comparison.afterTotalLimit'),
    limitless: t('planTypes.comparison.never')
  },
  {
    attribute: t('planTypes.comparison.bestFor'),
    attributeShort: 'Best',
    dayPass: t('planTypes.dayPass.feature3'),
    maxSpeed: t('planTypes.maxSpeed.feature3'),
    limitless: t('planTypes.limitless.feature3')
  }];


  const renderValue = (value: string | boolean, compact = false) => {
    if (typeof value === 'boolean') {
      return value ?
      <Check className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} text-green-400 mx-auto`} /> :

      <X className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} text-gray-500 mx-auto`} />;

    }
    return value;
  };

  const planHeaders = [
  {
    key: 'dayPass',
    label: t('planTypes.dayPass.title'),
    shortLabel: 'Value',
    icon: Sun,
    color: 'text-blue-400'
  },
  {
    key: 'maxSpeed',
    label: t('planTypes.maxSpeed.title'),
    shortLabel: 'Pay-per-use',
    icon: Gauge,
    color: 'text-orange-400'
  },
  {
    key: 'limitless',
    label: t('planTypes.limitless.title'),
    shortLabel: 'Unlimited',
    icon: Zap,
    color: 'text-green-400',
    popular: true
  }];


  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full">

        {/* Collapsible Header/Trigger - Dark Navy Style */}
        <CollapsibleTrigger asChild>
          <button className="w-full group">
            




















          </button>
        </CollapsibleTrigger>

        {/* Collapsible Content */}
        <CollapsibleContent>
          <AnimatePresence>
            {isOpen &&
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden">

                <div className="pt-4">
                  {/* Desktop Table View - Dark Theme */}
                  <div className="hidden md:block rounded-xl overflow-visible bg-[#1a1f2e]">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#141821] hover:bg-[#141821] border-b border-gray-700">
                          <TableHead className="w-[200px] font-semibold text-gray-300">
                            {t('planTypes.comparison.feature')}
                          </TableHead>
                          {planHeaders.map((plan) => {
                          const Icon = plan.icon;
                          return (
                            <TableHead
                              key={plan.key}
                              className="text-center font-semibold">

                                <div className="flex flex-col items-center justify-center gap-1 py-1">
                                  {plan.popular &&
                                <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                                      {t('planTypes.mostPopular')}
                                    </span>
                                }
                                  <div className={`flex items-center justify-center gap-2 ${plan.color}`}>
                                    <Icon className="h-5 w-5" />
                                    <span>{plan.label}</span>
                                  </div>
                                </div>
                              </TableHead>);

                        })}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {comparisonData.map((row, index) =>
                      <TableRow
                        key={index}
                        className={`hover:bg-[#1e2436] border-b border-gray-700/50 ${
                        index % 2 === 0 ? 'bg-[#1a1f2e]' : 'bg-[#161a26]'}`
                        }>

                            <TableCell className="font-medium text-white">
                              {row.attribute}
                            </TableCell>
                            <TableCell className="text-center text-gray-300">
                              {renderValue(row.dayPass)}
                            </TableCell>
                            <TableCell className="text-center text-gray-300">
                              {renderValue(row.maxSpeed)}
                            </TableCell>
                            <TableCell className="text-center text-gray-300">
                              {renderValue(row.limitless)}
                            </TableCell>
                          </TableRow>
                      )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Compact Grid View - Dark Theme */}
                  <div className="md:hidden rounded-xl overflow-hidden bg-[#1a1f2e]">
                    {/* Mobile Header Row */}
                    <div className="grid grid-cols-4 bg-[#141821] border-b border-gray-700">
                      <div className="p-2 text-xs font-semibold text-gray-400">
                        {t('planTypes.comparison.feature')}
                      </div>
                      {planHeaders.map((plan) => {
                      const Icon = plan.icon;
                      return (
                        <div
                          key={plan.key}
                          className="p-2 text-center">

                            <div className={`flex flex-col items-center gap-1 ${plan.color}`}>
                              {plan.popular &&
                            <span className="bg-green-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap leading-none">
                                  ★
                                </span>
                            }
                              <Icon className="h-4 w-4" />
                              <span className="text-[10px] font-semibold leading-tight">{plan.shortLabel}</span>
                            </div>
                          </div>);

                    })}
                    </div>

                    {/* Mobile Data Rows */}
                    {comparisonData.map((row, index) =>
                  <div
                    key={index}
                    className={`grid grid-cols-4 border-b border-gray-700/50 last:border-0 ${
                    index % 2 === 0 ? 'bg-[#1a1f2e]' : 'bg-[#161a26]'}`
                    }>

                        <div className="p-2 text-xs font-medium text-white flex items-center">
                          {row.attributeShort}
                        </div>
                        <div className="p-2 text-center text-[11px] text-gray-300 flex items-center justify-center">
                          {renderValue(row.dayPass, true)}
                        </div>
                        <div className="p-2 text-center text-[11px] text-gray-300 flex items-center justify-center">
                          {renderValue(row.maxSpeed, true)}
                        </div>
                        <div className="p-2 text-center text-[11px] text-gray-300 flex items-center justify-center">
                          {renderValue(row.limitless, true)}
                        </div>
                      </div>
                  )}
                  </div>

                  {/* Footer Note - Dark Theme */}
                  <div className="mt-4 text-center">
                    <div className="inline-flex items-center gap-2 text-xs md:text-sm text-gray-400 bg-[#141821] px-3 py-1.5 md:px-4 md:py-2 rounded-full">
                      <Infinity className="h-3 w-3 md:h-4 md:w-4" />
                      <span>{t('planTypes.comparison.allUnlimited')}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            }
          </AnimatePresence>
        </CollapsibleContent>
      </motion.div>
    </Collapsible>);

}