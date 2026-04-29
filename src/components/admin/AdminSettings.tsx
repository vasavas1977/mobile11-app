import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { Loader2, Database, Plug, Mail, Shield } from "lucide-react";
import SpamFilterSettings from "./SpamFilterSettings";
import { AdminDeveloper } from "./AdminDeveloper";

const AdminSettings = () => {
  const { settings, loading, saving, updateSetting, getSetting } = useSystemSettings();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
          <p className="text-muted-foreground">
            Manage your application configuration and preferences
          </p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="spam" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Spam Filter
          </TabsTrigger>
          <TabsTrigger value="developer">Developer Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic configuration for your eSIM platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input 
                    id="siteName" 
                    value={getSetting('site_name', 'Mobile11')}
                    onChange={(e) => updateSetting('site_name', e.target.value)}
                    disabled={saving}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Displayed in emails and page titles
                  </p>
                </div>

                <div>
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Textarea 
                    id="siteDescription" 
                    value={getSetting('site_description', 'Your trusted eSIM provider')}
                    onChange={(e) => updateSetting('site_description', e.target.value)}
                    rows={3}
                    disabled={saving}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Used for SEO meta tags
                  </p>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input 
                      id="contactEmail" 
                      type="email"
                      value={getSetting('contact_email', 'contact@mobile11.com')}
                      onChange={(e) => updateSetting('contact_email', e.target.value)}
                      disabled={saving}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      General inquiries email
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input 
                      id="supportEmail" 
                      type="email"
                      value={getSetting('support_email', 'support@mobile11.com')}
                      onChange={(e) => updateSetting('support_email', e.target.value)}
                      disabled={saving}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Customer support email
                    </p>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Control how and when notifications are sent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Enable email notifications globally</p>
                  </div>
                  <Switch 
                    checked={getSetting('email_enabled', true)}
                    onCheckedChange={(checked) => updateSetting('email_enabled', checked)}
                    disabled={saving}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Order Confirmation</Label>
                    <p className="text-sm text-muted-foreground">Send confirmation emails after order placement</p>
                  </div>
                  <Switch 
                    checked={getSetting('order_confirmation_enabled', true)}
                    onCheckedChange={(checked) => updateSetting('order_confirmation_enabled', checked)}
                    disabled={saving}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>eSIM Delivery Notification</Label>
                    <p className="text-sm text-muted-foreground">Send email when eSIM is ready to use</p>
                  </div>
                  <Switch 
                    checked={getSetting('esim_delivery_enabled', true)}
                    onCheckedChange={(checked) => updateSetting('esim_delivery_enabled', checked)}
                    disabled={saving}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integration Status</CardTitle>
              <CardDescription>Monitor your third-party integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Database className="h-10 w-10 text-primary" />
                    <div>
                      <p className="font-medium">Supabase Database</p>
                      <p className="text-sm text-green-600">Connected</p>
                    </div>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Plug className="h-10 w-10 text-primary" />
                    <div>
                      <p className="font-medium">Stripe Payments</p>
                      <p className="text-sm text-green-600">Active - Production Mode</p>
                    </div>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Mail className="h-10 w-10 text-primary" />
                    <div>
                      <p className="font-medium">Email Service (Resend)</p>
                      <p className="text-sm text-green-600">Configured</p>
                    </div>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Plug className="h-10 w-10 text-primary" />
                    <div>
                      <p className="font-medium">USIMSA API</p>
                      <p className="text-sm text-green-600">Connected - Production Mode</p>
                    </div>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm font-medium">Environment</p>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium">
                    Test Mode
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Some integrations are running in test mode
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spam" className="space-y-4">
          <SpamFilterSettings />
        </TabsContent>

        <TabsContent value="developer" className="space-y-4">
          <AdminDeveloper />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
