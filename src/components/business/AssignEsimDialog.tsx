import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, User, Calendar, FileText, Loader2, Smartphone } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { useAssignEsim } from '@/hooks/useOrganizationEsims';
import { useOrganizationMembers } from '@/hooks/useOrganization';
import type { OrganizationMember } from '@/types/organization';

const formSchema = z.object({
  assignedTo: z.string().min(1, 'Please select a team member'),
  assignmentNote: z.string().optional(),
  tripStartDate: z.string().optional(),
  tripEndDate: z.string().optional(),
}).refine((data) => {
  if (data.tripStartDate && data.tripEndDate) {
    return new Date(data.tripStartDate) <= new Date(data.tripEndDate);
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["tripEndDate"],
});

type FormData = z.infer<typeof formSchema>;

interface AssignEsimDialogProps {
  orgId: string;
  orderId: string;
  packageName: string;
  countryName: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function AssignEsimDialog({ 
  orgId, 
  orderId, 
  packageName, 
  countryName,
  trigger, 
  onSuccess 
}: AssignEsimDialogProps) {
  const [open, setOpen] = useState(false);
  const assignEsim = useAssignEsim();
  const { data: members = [] } = useOrganizationMembers(orgId);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assignedTo: '',
      assignmentNote: '',
      tripStartDate: '',
      tripEndDate: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    await assignEsim.mutateAsync({
      orgId,
      orderId,
      assignedTo: data.assignedTo,
      assignmentNote: data.assignmentNote,
      tripStartDate: data.tripStartDate || undefined,
      tripEndDate: data.tripEndDate || undefined,
    });
    form.reset();
    setOpen(false);
    onSuccess?.();
  };

  const getMemberDisplayName = (member: OrganizationMember) => {
    const firstName = member.profiles?.first_name || '';
    const lastName = member.profiles?.last_name || '';
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    return member.profiles?.email || 'Unknown';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            size="sm" 
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Assign
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white border-gray-100">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-xl">
              <Smartphone className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <DialogTitle className="text-gray-900">Assign eSIM</DialogTitle>
              <DialogDescription className="text-gray-500">
                {packageName} • {countryName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-4">
            <FormField
              control={form.control}
              name="assignedTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    Team Member
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-white border-gray-200 text-gray-700 rounded-lg">
                        <SelectValue placeholder="Select team member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white border-gray-100">
                      {members.map((member) => (
                        <SelectItem 
                          key={member.id} 
                          value={member.user_id}
                          className="text-gray-700"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{getMemberDisplayName(member)}</span>
                            {member.profiles?.email && (
                              <span className="text-xs text-gray-500">{member.profiles.email}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="tripStartDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      Start Date
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="date"
                        {...field} 
                        className="bg-white border-gray-200 text-gray-900 focus:ring-orange-500 focus:border-orange-500 rounded-lg"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tripEndDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      End Date
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="date"
                        {...field} 
                        className="bg-white border-gray-200 text-gray-900 focus:ring-orange-500 focus:border-orange-500 rounded-lg"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
            </div>
            <FormDescription className="text-gray-500 text-xs -mt-2">
              Optional: Set expected travel dates for this eSIM
            </FormDescription>

            <FormField
              control={form.control}
              name="assignmentNote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    Note (Optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="e.g., Q1 Sales conference in Tokyo" 
                      rows={2}
                      {...field} 
                      className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-orange-500 focus:border-orange-500 rounded-lg resize-none"
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
                disabled={assignEsim.isPending}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
              >
                {assignEsim.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign eSIM
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
