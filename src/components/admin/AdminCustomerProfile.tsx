import { Mail, Phone, User, Calendar, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  created_at: string;
  promotional_emails?: boolean;
}

interface AdminCustomerProfileProps {
  profile: Profile;
}

export function AdminCustomerProfile({ profile }: AdminCustomerProfileProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">First Name</label>
              <p className="font-medium">{profile.first_name || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Last Name</label>
              <p className="font-medium">{profile.last_name || '-'}</p>
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">User ID</label>
            <p className="font-mono text-xs text-muted-foreground break-all">{profile.user_id}</p>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Email</label>
            <p className="font-medium">{profile.email}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Phone</label>
            <p className="font-medium">{profile.phone || '-'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Account Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Account Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Created At</label>
            <p className="font-medium">
              {new Date(profile.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Profile ID</label>
            <p className="font-mono text-xs text-muted-foreground break-all">{profile.id}</p>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Promotional Emails</span>
            <Badge variant={profile.promotional_emails ? 'default' : 'secondary'}>
              {profile.promotional_emails ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
