import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Loader2, PenLine } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ManualEsimEntryProps {
  orderId: string;
  orderDisplayId: string;
  onSuccess: () => void;
}

export function ManualEsimEntry({ orderId, orderDisplayId, onSuccess }: ManualEsimEntryProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState({
    iccid: '',
    qr_code: '',
    smdp_address: '',
    activation_code: '',
    download_link: '',
  });

  const hasMinimumData = fields.iccid.trim() && (fields.qr_code.trim() || fields.activation_code.trim());

  const handleSave = async () => {
    if (!hasMinimumData) return;

    const updateData: Record<string, string> = { status: 'completed' };
    if (fields.iccid.trim()) updateData.iccid = fields.iccid.trim();
    if (fields.qr_code.trim()) updateData.qr_code = fields.qr_code.trim();
    if (fields.smdp_address.trim()) updateData.smdp_address = fields.smdp_address.trim();
    if (fields.activation_code.trim()) updateData.activation_code = fields.activation_code.trim();
    if (fields.download_link.trim()) updateData.download_link = fields.download_link.trim();

    try {
      setSaving(true);

      const { error: updateError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Trigger confirmation email
      await supabase.functions.invoke('send-order-confirmation', {
        body: { orderId },
      });

      toast({
        title: 'Order completed',
        description: `eSIM data saved and confirmation email sent for ${orderDisplayId}.`,
      });
      onSuccess();
    } catch (err: any) {
      toast({
        title: 'Failed to save',
        description: err?.message || 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-800">
          <PenLine className="h-4 w-4" />
          Manual eSIM Entry
        </CardTitle>
        <p className="text-[11px] text-amber-600 mt-1">
          This order has no QR code. Enter eSIM details from the provider to complete it.
        </p>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        <Field label="ICCID *" value={fields.iccid} onChange={v => setFields(f => ({ ...f, iccid: v }))} placeholder="e.g. 8901234567890123456" />
        <Field label="QR Code (URL or LPA string) *" value={fields.qr_code} onChange={v => setFields(f => ({ ...f, qr_code: v }))} placeholder="LPA:1$... or https://..." />
        <Field label="SM-DP+ Address" value={fields.smdp_address} onChange={v => setFields(f => ({ ...f, smdp_address: v }))} placeholder="e.g. lpa.example.com" />
        <Field label="Activation Code" value={fields.activation_code} onChange={v => setFields(f => ({ ...f, activation_code: v }))} placeholder="e.g. K-XXXX-XXXX" />
        <Field label="Download Link" value={fields.download_link} onChange={v => setFields(f => ({ ...f, download_link: v }))} placeholder="https://..." />

        {!hasMinimumData && (
          <p className="text-[11px] text-amber-600 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> ICCID and either QR Code or Activation Code are required.
          </p>
        )}

        <Button
          size="sm"
          className="w-full h-9 text-xs"
          disabled={!hasMinimumData || saving}
          onClick={handleSave}
        >
          {saving ? (
            <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> Saving...</>
          ) : (
            <><CheckCircle className="h-3 w-3 mr-1.5" /> Save & Complete Order</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-[11px] font-medium text-[#6B7280] block mb-1">{label}</label>
      <Input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 text-xs bg-white"
      />
    </div>
  );
}
