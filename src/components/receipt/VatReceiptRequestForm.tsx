import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { CheckCircle, FileText, Building2, User } from 'lucide-react';

const vatSchema = z.object({
  first_name: z.string().min(1, 'Required').max(100),
  last_name: z.string().min(1, 'Required').max(100),
  address: z.string().min(1, 'Required').max(500),
  phone: z.string().min(1, 'Required').max(20),
  email: z.string().email('Invalid email').max(255),
  id_number: z.string().optional(),
  company_tax_id: z.string().optional(),
});

type VatFormData = z.infer<typeof vatSchema>;

interface VatReceiptRequestFormProps {
  orderId: string;
  userId?: string | null;
  customerName?: string;
  customerEmail?: string;
  existingRequest?: any;
}

export default function VatReceiptRequestForm({
  orderId,
  userId,
  customerName,
  customerEmail,
  existingRequest,
}: VatReceiptRequestFormProps) {
  const { t } = useLanguage();
  const [receiptType, setReceiptType] = useState<'personal' | 'company'>('personal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(!!existingRequest);

  const { register, handleSubmit, formState: { errors } } = useForm<VatFormData>({
    resolver: zodResolver(vatSchema),
    defaultValues: {
      first_name: customerName?.split(' ')[0] || '',
      last_name: customerName?.split(' ').slice(1).join(' ') || '',
      email: customerEmail || '',
    },
  });

  const onSubmit = async (data: VatFormData) => {
    setIsSubmitting(true);
    try {
      const { data: insertData, error } = await supabase
        .from('vat_receipt_requests' as any)
        .insert({
          order_id: orderId,
          user_id: userId || null,
          receipt_type: receiptType,
          first_name: data.first_name,
          last_name: data.last_name,
          address: data.address,
          phone: data.phone,
          email: data.email,
          id_number: receiptType === 'personal' ? data.id_number : null,
          company_tax_id: receiptType === 'company' ? data.company_tax_id : null,
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Send notification emails
      await supabase.functions.invoke('send-vat-receipt-request', {
        body: { requestId: (insertData as any).id },
      });

      setSubmitted(true);
      toast.success(t('vatReceipt.submitted'));
    } catch (err: any) {
      console.error('VAT request error:', err);
      toast.error(err.message || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted || existingRequest) {
    const req = existingRequest;
    return (
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mt-6 print:hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold text-gray-900">{t('vatReceipt.title')}</h3>
          </div>
          <p className="text-sm text-green-600">{t('vatReceipt.submitted')}</p>
          {req && (
            <div className="mt-3 text-sm text-gray-500 space-y-1">
              <p>{t('vatReceipt.type')}: {req.receipt_type === 'personal' ? t('vatReceipt.personal') : t('vatReceipt.company')}</p>
              <p>{t('vatReceipt.status')}: {req.status}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden mt-6 print:hidden">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold text-gray-900">{t('vatReceipt.title')}</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">{t('vatReceipt.description')}</p>

        {/* Type Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setReceiptType('personal')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              receiptType === 'personal'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <User className="w-4 h-4" />
            {t('vatReceipt.personal')}
          </button>
          <button
            type="button"
            onClick={() => setReceiptType('company')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              receiptType === 'company'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            {t('vatReceipt.company')}
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name" className="text-gray-700">{t('vatReceipt.firstName')}</Label>
              <Input id="first_name" {...register('first_name')} className="mt-1 bg-white border-gray-300 text-gray-900" />
              {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name.message}</p>}
            </div>
            <div>
              <Label htmlFor="last_name" className="text-gray-700">{t('vatReceipt.lastName')}</Label>
              <Input id="last_name" {...register('last_name')} className="mt-1 bg-white border-gray-300 text-gray-900" />
              {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="address" className="text-gray-700">
              {receiptType === 'company' ? t('vatReceipt.companyAddress') : t('vatReceipt.address')}
            </Label>
            <Input id="address" {...register('address')} className="mt-1 bg-white border-gray-300 text-gray-900" />
            {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
          </div>

          <div>
            <Label htmlFor="phone" className="text-gray-700">{t('vatReceipt.phone')}</Label>
            <Input id="phone" type="tel" {...register('phone')} className="mt-1 bg-white border-gray-300 text-gray-900" />
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
          </div>

          {receiptType === 'personal' && (
            <div>
              <Label htmlFor="id_number" className="text-gray-700">{t('vatReceipt.idNumber')}</Label>
              <Input id="id_number" {...register('id_number')} className="mt-1 bg-white border-gray-300 text-gray-900" />
            </div>
          )}

          {receiptType === 'company' && (
            <div>
              <Label htmlFor="company_tax_id" className="text-gray-700">{t('vatReceipt.companyTaxId')}</Label>
              <Input id="company_tax_id" {...register('company_tax_id')} className="mt-1 bg-white border-gray-300 text-gray-900" />
            </div>
          )}

          <div>
            <Label htmlFor="email" className="text-gray-700">{t('vatReceipt.email')}</Label>
            <Input id="email" type="email" {...register('email')} className="mt-1 bg-white border-gray-300 text-gray-900" />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isSubmitting ? t('vatReceipt.submitting') : t('vatReceipt.submit')}
          </Button>
        </form>
      </div>
    </div>
  );
}
