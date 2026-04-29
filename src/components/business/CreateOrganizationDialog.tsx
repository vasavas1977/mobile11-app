import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Mail, FileText, Users, Briefcase, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateOrganization } from '@/hooks/useOrganization';

const formSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  billing_email: z.string().email('Please enter a valid email address'),
  tax_id: z.string().optional(),
  industry: z.string().optional(),
  company_size: z.enum(['small', 'medium', 'large', 'enterprise']).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateOrganizationDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function CreateOrganizationDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onSuccess,
  trigger,
}: CreateOrganizationDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const onOpenChange = controlledOnOpenChange || setInternalOpen;
  const createOrg = useCreateOrganization();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      billing_email: '',
      tax_id: '',
      industry: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await createOrg.mutateAsync({
        name: values.name,
        billing_email: values.billing_email,
        tax_id: values.tax_id,
        industry: values.industry,
        company_size: values.company_size,
      });
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch {
      // Error handled in hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-lg bg-white border-gray-100">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-xl">
              <Building2 className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <DialogTitle className="text-gray-900">Create Organization</DialogTitle>
              <DialogDescription className="text-gray-500">
                Set up your business account to manage team eSIMs
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    Organization Name
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Acme Corporation" 
                      {...field} 
                      className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-orange-500 focus:border-orange-500 rounded-lg"
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="billing_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    Billing Email
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="billing@company.com" 
                      type="email"
                      {...field} 
                      className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-orange-500 focus:border-orange-500 rounded-lg"
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tax_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      Tax ID (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="VAT/Tax Number" 
                        {...field} 
                        className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-orange-500 focus:border-orange-500 rounded-lg"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company_size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      Company Size
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white border-gray-200 text-gray-700 rounded-lg">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white border-gray-100">
                        <SelectItem value="small" className="text-gray-700">1-10 employees</SelectItem>
                        <SelectItem value="medium" className="text-gray-700">11-50 employees</SelectItem>
                        <SelectItem value="large" className="text-gray-700">51-200 employees</SelectItem>
                        <SelectItem value="enterprise" className="text-gray-700">200+ employees</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-gray-400" />
                    Industry (Optional)
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Technology, Consulting, Travel" 
                      {...field} 
                      className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-orange-500 focus:border-orange-500 rounded-lg"
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="flex-1 bg-white border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createOrg.isPending}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
              >
                {createOrg.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Organization'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
