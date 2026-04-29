import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ColumnMapperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  headerRow: any[];
  detectedMapping: Record<string, number>;
  onConfirmMapping: (mapping: Record<string, number>) => void;
}

const FIELD_DEFINITIONS = [
  { key: 'optionId', label: 'Option ID / Package Code', required: true, description: 'Unique package identifier for API' },
  { key: 'country', label: 'Country / Region', required: true, description: 'Coverage country or region name' },
  { key: 'b2bPrice', label: 'B2B Price (Cost)', required: true, description: 'Wholesale cost price in USD' },
  { key: 'carrier', label: 'Carrier / Operator', required: false, description: 'Network operator name' },
  { key: 'data', label: 'Data Amount', required: false, description: 'Data quota (e.g., 5GB, Unlimited)' },
  { key: 'validity', label: 'Validity (Days)', required: false, description: 'Package validity period in days' },
  { key: 'normalPrice', label: 'Normal Price', required: false, description: 'Suggested retail price' },
  { key: 'minSellPrice', label: 'Min Sell Price', required: false, description: 'Minimum selling price' },
  { key: 'qosSpeed', label: 'QoS Speed', required: false, description: 'Speed limit (e.g., 10Mbps)' },
  { key: 'networkType', label: 'Network Type', required: false, description: '4G/5G network type' },
];

const STORAGE_KEY = 'tuge-column-mapping-template';

export function ColumnMapperDialog({
  open,
  onOpenChange,
  headerRow,
  detectedMapping,
  onConfirmMapping,
}: ColumnMapperDialogProps) {
  const [mapping, setMapping] = useState<Record<string, number>>(detectedMapping);
  const [savedTemplates, setSavedTemplates] = useState<Record<string, Record<string, number>>>({});
  const [templateName, setTemplateName] = useState('');

  // Load saved templates on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setSavedTemplates(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load templates:', e);
    }
  }, []);

  // Reset mapping when dialog opens with new detected mapping
  useEffect(() => {
    if (open) {
      setMapping(detectedMapping);
    }
  }, [open, detectedMapping]);

  const handleFieldChange = (field: string, value: string) => {
    const newMapping = { ...mapping };
    if (value === 'none') {
      delete newMapping[field];
    } else {
      newMapping[field] = parseInt(value, 10);
    }
    setMapping(newMapping);
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;
    const updated = { ...savedTemplates, [templateName]: mapping };
    setSavedTemplates(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setTemplateName('');
  };

  const handleLoadTemplate = (name: string) => {
    if (savedTemplates[name]) {
      setMapping(savedTemplates[name]);
    }
  };

  const requiredMet = FIELD_DEFINITIONS
    .filter(f => f.required)
    .every(f => mapping[f.key] !== undefined);

  // Build column options with preview
  const columnOptions = headerRow.map((cell, index) => ({
    value: index.toString(),
    label: `Col ${index}: ${String(cell ?? '').slice(0, 30) || '(empty)'}`,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Map Excel Columns</DialogTitle>
          <DialogDescription>
            Auto-detection couldn't map all required columns. Please select which Excel column corresponds to each field.
          </DialogDescription>
        </DialogHeader>

        {/* Saved Templates */}
        {Object.keys(savedTemplates).length > 0 && (
          <div className="flex items-center gap-2 pb-2 border-b">
            <span className="text-sm text-muted-foreground">Load template:</span>
            {Object.keys(savedTemplates).map(name => (
              <Button
                key={name}
                variant="outline"
                size="sm"
                onClick={() => handleLoadTemplate(name)}
              >
                {name}
              </Button>
            ))}
          </div>
        )}

        <div className="space-y-4">
          {FIELD_DEFINITIONS.map(field => (
            <div key={field.key} className="flex items-center gap-4">
              <div className="w-48">
                <Label className="flex items-center gap-2">
                  {field.label}
                  {field.required ? (
                    <Badge variant="destructive" className="text-xs">Required</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Optional</Badge>
                  )}
                </Label>
                <p className="text-xs text-muted-foreground">{field.description}</p>
              </div>
              <div className="flex-1">
                <Select
                  value={mapping[field.key]?.toString() ?? 'none'}
                  onValueChange={(v) => handleFieldChange(field.key, v)}
                >
                  <SelectTrigger className={cn(
                    field.required && mapping[field.key] === undefined && "border-destructive"
                  )}>
                    <SelectValue placeholder="Select column..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Not mapped --</SelectItem>
                    {columnOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-8">
                {mapping[field.key] !== undefined ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : field.required ? (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              placeholder="Template name..."
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveTemplate}
              disabled={!templateName.trim()}
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
          <Button
            onClick={() => onConfirmMapping(mapping)}
            disabled={!requiredMet}
          >
            {requiredMet ? 'Apply Mapping' : 'Map Required Fields'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
