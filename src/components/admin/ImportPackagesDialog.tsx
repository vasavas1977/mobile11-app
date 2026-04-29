import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package, Globe, Radio, DollarSign, AlertCircle } from 'lucide-react';
import { TugePackage } from '@/lib/tugeExcelParser';
import { getCountryCode } from '@/lib/countryCodeMapping';

export interface ImportSettings {
  markupPercentage: number;
  carrierOverride: string | null;
  networkType: string;
  isActive: boolean;
  qosSpeedOverride: string | null;
}

interface ImportPackagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packages: TugePackage[];
  onConfirm: (settings: ImportSettings) => Promise<void>;
  isImporting: boolean;
}

export function ImportPackagesDialog({
  open,
  onOpenChange,
  packages,
  onConfirm,
  isImporting,
}: ImportPackagesDialogProps) {
  const [markupPercentage, setMarkupPercentage] = useState(50);
  const [carrierOverride, setCarrierOverride] = useState('');
  const [networkType, setNetworkType] = useState('4G/5G');
  const [isActive, setIsActive] = useState(true);
  const [qosSpeedOverride, setQosSpeedOverride] = useState('');

  // Summary statistics
  const summary = useMemo(() => {
    if (!packages.length) return null;

    const countries = [...new Set(packages.map(p => p.country))];
    const carriers = [...new Set(packages.map(p => p.carrier).filter(Boolean))];
    const costs = packages.map(p => p.b2bPrice).filter(p => p > 0);
    const minCost = Math.min(...costs);
    const maxCost = Math.max(...costs);
    
    // Check for unknown country codes
    const unknownCountries = countries.filter(c => getCountryCode(c) === 'XX');

    return {
      count: packages.length,
      countries,
      carriers,
      minCost,
      maxCost,
      unknownCountries,
    };
  }, [packages]);

  // Preview packages with calculated prices
  const previewPackages = useMemo(() => {
    return packages.slice(0, 3).map(pkg => ({
      ...pkg,
      retailPrice: pkg.b2bPrice * (1 + markupPercentage / 100),
    }));
  }, [packages, markupPercentage]);

  const handleConfirm = async () => {
    await onConfirm({
      markupPercentage,
      carrierOverride: carrierOverride.trim() || null,
      networkType,
      isActive,
      qosSpeedOverride: qosSpeedOverride.trim() || null,
    });
  };

  // Generate package name preview
  const generatePackageName = (pkg: TugePackage): string => {
    const days = pkg.validityDays;
    const data = pkg.dataAmount;
    
    if (pkg.packageType === 'day_pass') {
      return `${pkg.country} ${days} days, ${data}/day`;
    } else if (pkg.packageType === 'limitless') {
      return `${pkg.country} ${days} days, Unlimited`;
    } else {
      return `${pkg.country} ${days} days, ${data}`;
    }
  };

  if (!summary) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Import {summary.count} Packages to Database
          </DialogTitle>
          <DialogDescription>
            Configure import settings before adding packages to the database
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Summary Section */}
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-sm">Summary</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span>Packages:</span>
                <Badge variant="secondary">{summary.count}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span>Countries:</span>
                <Badge variant="secondary">{summary.countries.length}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-muted-foreground" />
                <span>Carriers:</span>
                <Badge variant="secondary">{summary.carriers.length || 'Various'}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>Cost Range:</span>
                <span className="text-muted-foreground">
                  ${summary.minCost.toFixed(2)} - ${summary.maxCost.toFixed(2)}
                </span>
              </div>
            </div>
            
            {/* Warning for unknown countries */}
            {summary.unknownCountries.length > 0 && (
              <div className="flex items-start gap-2 p-2 bg-accent rounded text-accent-foreground text-xs mt-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>
                  Unknown country codes for: {summary.unknownCountries.slice(0, 3).join(', ')}
                  {summary.unknownCountries.length > 3 && ` (+${summary.unknownCountries.length - 3} more)`}. 
                  These will be set to 'XX'.
                </span>
              </div>
            )}
          </div>

          {/* Settings Section */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Settings</h4>
            
            {/* Markup Percentage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Markup Percentage</Label>
                <span className="text-sm font-medium">{markupPercentage}%</span>
              </div>
              <Slider
                value={[markupPercentage]}
                onValueChange={(value) => setMarkupPercentage(value[0])}
                min={10}
                max={300}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Retail = cost × {(1 + markupPercentage / 100).toFixed(2)}
              </p>
            </div>

            {/* Carrier Override */}
            <div className="space-y-2">
              <Label htmlFor="carrier-override">Carrier Name Override</Label>
              <Input
                id="carrier-override"
                placeholder={summary.carriers[0] || 'Leave empty to use parsed values'}
                value={carrierOverride}
                onChange={(e) => setCarrierOverride(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Override carrier name for all packages (e.g., "Docomo", "SoftBank")
              </p>
            </div>

            {/* Network Type */}
            <div className="space-y-2">
              <Label>Network Type</Label>
              <Select value={networkType} onValueChange={setNetworkType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4G">4G</SelectItem>
                  <SelectItem value="4G/5G">4G/5G</SelectItem>
                  <SelectItem value="5G">5G</SelectItem>
                  <SelectItem value="3G/4G">3G/4G</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is-active">Import as Active</Label>
                <p className="text-xs text-muted-foreground">
                  Packages will be immediately visible to customers
                </p>
              </div>
              <Switch
                id="is-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>

          {/* Preview Section */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Preview (first 3)</h4>
            <div className="space-y-2 text-sm">
              {previewPackages.map((pkg, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <span className="truncate flex-1">{generatePackageName(pkg)}</span>
                  <span className="text-muted-foreground ml-2">
                    ${pkg.b2bPrice.toFixed(2)} → <span className="text-foreground font-medium">${pkg.retailPrice.toFixed(2)}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isImporting}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isImporting}
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>Import {summary.count} Packages</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
