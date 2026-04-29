import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, Mail, Shield, Building2, Loader2, Info } from 'lucide-react';
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
  FormDescription,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCreateInvitation } from '@/hooks/useOrganizationInvitations';
import type { OrgRole } from '@/types/organization';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['admin', 'manager', 'member'] as const),
  department: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface InviteMemberDialogProps {
  orgId: string;
  orgName: string;
  trigger?: React.ReactNode;
}

const roleDescriptions: Record<string, string> = {
  admin: 'Full access to manage team members, eSIMs, and billing',
  manager: 'Can manage eSIMs and view team members',
  member: 'Can view and use assigned eSIMs only',
};

export function InviteMemberDialog({ orgId, orgName, trigger }: InviteMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const createInvitation = useCreateInvitation();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      role: 'member',
      department: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    await createInvitation.mutateAsync({
      orgId,
      orgName,
      email: data.email,
      role: data.role as OrgRole,
      department: data.department || undefined,
    });
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-full">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white border-gray-100">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-xl">
              <UserPlus className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <DialogTitle className="text-gray-900">Invite Team Member</DialogTitle>
              <DialogDescription className="text-gray-500">
                Send an invitation to join {orgName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    Email Address
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="colleague@company.com" 
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
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-gray-400" />
                    Role
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs bg-gray-900 text-white">
                          <p className="text-sm">Roles determine what actions the member can perform.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-white border-gray-200 text-gray-700 rounded-lg">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white border-gray-100">
                      <SelectItem value="admin" className="text-gray-700">
                        <span className="font-medium">Admin</span>
                      </SelectItem>
                      <SelectItem value="manager" className="text-gray-700">
                        <span className="font-medium">Manager</span>
                      </SelectItem>
                      <SelectItem value="member" className="text-gray-700">
                        <span className="font-medium">Member</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-gray-500 text-sm">
                    {roleDescriptions[field.value]}
                  </FormDescription>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    Department (Optional)
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Sales, Engineering, Marketing" 
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
                onClick={() => setOpen(false)}
                className="flex-1 bg-white border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createInvitation.isPending}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
              >
                {createInvitation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
