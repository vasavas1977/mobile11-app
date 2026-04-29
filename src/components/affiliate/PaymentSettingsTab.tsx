import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CreditCard, Upload, X, FileCheck, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PaymentSettingsTabProps {
  affiliateId: string;
}

interface PaymentData {
  paymentMethod: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  paypalEmail: string;
  cryptoWallet: string;
  otherPaymentDetails: string;
  idDocumentPath: string;
}

export function PaymentSettingsTab({ affiliateId }: PaymentSettingsTabProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newIdFile, setNewIdFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState<PaymentData>({
    paymentMethod: '',
    bankName: '',
    accountName: '',
    accountNumber: '',
    paypalEmail: '',
    cryptoWallet: '',
    otherPaymentDetails: '',
    idDocumentPath: '',
  });

  useEffect(() => {
    fetchPaymentSettings();
  }, [affiliateId]);

  const fetchPaymentSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('affiliates')
        .select('payment_method, payment_details')
        .eq('id', affiliateId)
        .single();

      if (error) throw error;

      if (data) {
        const details = (data.payment_details as Record<string, any>) || {};
        setFormData({
          paymentMethod: data.payment_method || '',
          bankName: details.bankName || '',
          accountName: details.accountName || '',
          accountNumber: details.accountNumber || '',
          paypalEmail: details.email || '',
          cryptoWallet: details.walletAddress || '',
          otherPaymentDetails: details.details || '',
          idDocumentPath: details.idDocumentPath || '',
        });
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof PaymentData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Error',
        description: t('affiliateRegister.form.payment.idDocumentTypeError'),
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: t('affiliateRegister.form.payment.idDocumentSizeError'),
        variant: 'destructive',
      });
      return;
    }

    setNewIdFile(file);
  };

  const removeFile = () => {
    setNewIdFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const uploadIdDocument = async (): Promise<string | null> => {
    if (!newIdFile) return formData.idDocumentPath || null;

    setUploading(true);
    try {
      const fileExt = newIdFile.name.split('.').pop();
      const fileName = `${affiliateId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('affiliate-documents')
        .upload(fileName, newIdFile);

      if (uploadError) throw uploadError;

      return fileName;
    } catch (error) {
      console.error('Error uploading ID document:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.paymentMethod) {
      toast({
        title: 'Error',
        description: t('affiliateDashboard.paymentSettings.selectMethod'),
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const idDocumentPath = await uploadIdDocument();

      let paymentDetails: Record<string, any> = {};
      switch (formData.paymentMethod) {
        case 'bank_transfer':
          paymentDetails = {
            bankName: formData.bankName,
            accountName: formData.accountName,
            accountNumber: formData.accountNumber,
          };
          break;
        case 'paypal':
          paymentDetails = { email: formData.paypalEmail };
          break;
        case 'crypto':
          paymentDetails = { walletAddress: formData.cryptoWallet };
          break;
        case 'other':
          paymentDetails = { details: formData.otherPaymentDetails };
          break;
      }

      if (idDocumentPath) {
        paymentDetails.idDocumentPath = idDocumentPath;
      }

      const { error } = await supabase
        .from('affiliates')
        .update({
          payment_method: formData.paymentMethod,
          payment_details: paymentDetails,
        })
        .eq('id', affiliateId);

      if (error) throw error;

      setNewIdFile(null);
      toast({
        title: t('affiliateDashboard.paymentSettings.saveSuccess'),
        description: t('affiliateDashboard.paymentSettings.saveSuccessDescription'),
      });
    } catch (error: any) {
      console.error('Error saving payment settings:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save payment settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </CardContent>
      </Card>
    );
  }

  const hasPaymentMethod = formData.paymentMethod && formData.paymentMethod !== 'pending';

  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <CreditCard className="h-5 w-5 text-orange-500" />
          {t('affiliateDashboard.paymentSettings.title')}
        </CardTitle>
        <CardDescription className="text-gray-600">
          {t('affiliateDashboard.paymentSettings.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!hasPaymentMethod && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-amber-700">
              {t('affiliateDashboard.paymentSettings.notSet')}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label className="text-gray-700">{t('affiliateRegister.form.payment.methodLabel')}</Label>
          <Select
            value={formData.paymentMethod}
            onValueChange={(value) => handleInputChange('paymentMethod', value)}
          >
            <SelectTrigger className="bg-white border-gray-200 text-gray-900">
              <SelectValue placeholder={t('affiliateRegister.form.payment.methodPlaceholder')} />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200">
              <SelectItem value="bank_transfer">{t('affiliateRegister.form.payment.bankTransfer')}</SelectItem>
              <SelectItem value="paypal">{t('affiliateRegister.form.payment.paypal')}</SelectItem>
              <SelectItem value="crypto">{t('affiliateRegister.form.payment.crypto')}</SelectItem>
              <SelectItem value="other">{t('affiliateRegister.form.payment.other')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.paymentMethod === 'bank_transfer' && (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="bankName" className="text-gray-700">{t('affiliateRegister.form.payment.bankName')}</Label>
              <Input
                id="bankName"
                placeholder={t('affiliateRegister.form.payment.bankNamePlaceholder')}
                value={formData.bankName}
                onChange={(e) => handleInputChange('bankName', e.target.value)}
                className="bg-white border-gray-200 text-gray-900"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountName" className="text-gray-700">{t('affiliateRegister.form.payment.accountName')}</Label>
              <Input
                id="accountName"
                placeholder={t('affiliateRegister.form.payment.accountNamePlaceholder')}
                value={formData.accountName}
                onChange={(e) => handleInputChange('accountName', e.target.value)}
                className="bg-white border-gray-200 text-gray-900"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountNumber" className="text-gray-700">{t('affiliateRegister.form.payment.accountNumber')}</Label>
              <Input
                id="accountNumber"
                placeholder={t('affiliateRegister.form.payment.accountNumberPlaceholder')}
                value={formData.accountNumber}
                onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                className="bg-white border-gray-200 text-gray-900"
              />
            </div>
          </div>
        )}

        {formData.paymentMethod === 'paypal' && (
          <div className="space-y-2">
            <Label htmlFor="paypalEmail" className="text-gray-700">{t('affiliateRegister.form.payment.paypalEmail')}</Label>
            <Input
              id="paypalEmail"
              type="email"
              placeholder={t('affiliateRegister.form.payment.paypalEmailPlaceholder')}
              value={formData.paypalEmail}
              onChange={(e) => handleInputChange('paypalEmail', e.target.value)}
              className="bg-white border-gray-200 text-gray-900"
            />
          </div>
        )}

        {formData.paymentMethod === 'crypto' && (
          <div className="space-y-2">
            <Label htmlFor="cryptoWallet" className="text-gray-700">{t('affiliateRegister.form.payment.cryptoWallet')}</Label>
            <Input
              id="cryptoWallet"
              placeholder={t('affiliateRegister.form.payment.cryptoWalletPlaceholder')}
              value={formData.cryptoWallet}
              onChange={(e) => handleInputChange('cryptoWallet', e.target.value)}
              className="bg-white border-gray-200 text-gray-900"
            />
          </div>
        )}

        {formData.paymentMethod === 'other' && (
          <div className="space-y-2">
            <Label htmlFor="otherPaymentDetails" className="text-gray-700">{t('affiliateRegister.form.payment.otherDetails')}</Label>
            <Textarea
              id="otherPaymentDetails"
              placeholder={t('affiliateRegister.form.payment.otherDetailsPlaceholder')}
              value={formData.otherPaymentDetails}
              onChange={(e) => handleInputChange('otherPaymentDetails', e.target.value)}
              className="bg-white border-gray-200 text-gray-900"
            />
          </div>
        )}

        {/* ID Document Upload */}
        <div className="space-y-2 pt-4 border-t border-gray-200">
          <Label className="flex items-center gap-2 text-gray-700">
            <FileCheck className="h-4 w-4" />
            {t('affiliateRegister.form.payment.idDocument')}
          </Label>
          <p className="text-sm text-gray-500">
            {t('affiliateRegister.form.payment.idDocumentHint')}
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />

          {formData.idDocumentPath && !newIdFile && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
              <FileCheck className="h-8 w-8 text-green-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{t('affiliateDashboard.paymentSettings.documentUploaded')}</p>
                <p className="text-sm text-gray-500">
                  {t('affiliateDashboard.paymentSettings.documentUploadedHint')}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-gray-200 text-gray-700 hover:bg-gray-100"
                onClick={() => fileInputRef.current?.click()}
              >
                {t('affiliateDashboard.paymentSettings.replaceDocument')}
              </Button>
            </div>
          )}

          {newIdFile && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
              <FileCheck className="h-8 w-8 text-orange-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-gray-900">{newIdFile.name}</p>
                <p className="text-sm text-gray-500">
                  {formatFileSize(newIdFile.size)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={removeFile}
                className="flex-shrink-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {!formData.idDocumentPath && !newIdFile && (
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-24 border-dashed border-gray-300 flex flex-col gap-2 hover:bg-gray-50 text-gray-600"
            >
              <Upload className="h-6 w-6 text-gray-400" />
              <span>{t('affiliateRegister.form.payment.uploadButton')}</span>
            </Button>
          )}
        </div>

        <Button 
          onClick={handleSave} 
          className="w-full bg-orange-500 hover:bg-orange-600 text-white" 
          disabled={saving || uploading}
        >
          {saving || uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('affiliateDashboard.paymentSettings.saving')}
            </>
          ) : (
            t('affiliateDashboard.paymentSettings.saveButton')
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
