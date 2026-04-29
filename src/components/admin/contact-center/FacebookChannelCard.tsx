import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { Facebook, Link2, Unlink, Loader2, CheckCircle, AlertCircle, ExternalLink, Send, MessageSquareText, ChevronDown, Plus, List, Zap } from "lucide-react";
import { FacebookPageSelector, FacebookPage } from "./FacebookPageSelector";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ChannelConnection {
  id: string;
  channel_type: string;
  external_id: string;
  name: string;
  profile_picture_url: string | null;
  status: string;
  connected_by: string;
  connected_at: string;
  last_verified_at: string | null;
}

function UtilityMessagingTestSection({ pageId }: { pageId: string }) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isListing, setIsListing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [createResult, setCreateResult] = useState<string | null>(null);
  const [sendResult, setSendResult] = useState<string | null>(null);
  const [recipientPsid, setRecipientPsid] = useState('');
  const [placeholders, setPlaceholders] = useState({
    packageName: 'Japan 5GB',
    country: 'Japan',
    data: '5GB',
    validity: '7',
    amount: '15.00',
    orderId: 'ORD-TEST-001',
  });

  const callUtilityTest = async (action: string, extra: Record<string, any> = {}) => {
    const { data, error } = await supabase.functions.invoke('facebook-utility-test', {
      body: { pageId, action, ...extra },
    });
    if (error) throw error;
    return data;
  };

  const handleListTemplates = async () => {
    setIsListing(true);
    try {
      const data = await callUtilityTest('list-templates');
      if (data.success) {
        setTemplates(data.templates || []);
        toast({ title: `Found ${data.templateCount} template(s)` });
      } else {
        toast({ title: "Failed", description: data.error, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsListing(false);
    }
  };

  const handleCreateTemplate = async () => {
    setIsCreating(true);
    setCreateResult(null);
    try {
      const data = await callUtilityTest('create-template');
      if (data.success) {
        setCreateResult(`✅ Template created (ID: ${data.templateId})`);
        handleListTemplates();
      } else if (data.alreadyExists) {
        setCreateResult('ℹ️ Template already exists. See list below.');
        handleListTemplates();
      } else {
        setCreateResult(`❌ ${data.error}`);
      }
    } catch (e: any) {
      setCreateResult(`❌ ${e.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSendTest = async () => {
    if (!recipientPsid.trim()) {
      toast({ title: "PSID required", description: "Enter the recipient's Page-Scoped ID", variant: "destructive" });
      return;
    }
    setIsSending(true);
    setSendResult(null);
    try {
      const data = await callUtilityTest('send-test', { recipientPsid: recipientPsid.trim(), placeholders });
      if (data.success) {
        setSendResult(`✅ ${data.message}`);
      } else {
        setSendResult(`❌ ${data.error}`);
      }
    } catch (e: any) {
      setSendResult(`❌ ${e.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="border-t pt-3 mt-1">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between px-0 hover:bg-transparent">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Utility Messaging Test</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-3">
          {/* Step 1: Create Template */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Step 1: Create Template</p>
            <Button variant="outline" size="sm" onClick={handleCreateTemplate} disabled={isCreating}>
              {isCreating ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Creating...</> : <><Plus className="h-4 w-4 mr-1" /> Create order_confirmation Template</>}
            </Button>
            {createResult && <p className="text-xs">{createResult}</p>}
          </div>

          {/* Step 2: List Templates */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Step 2: View Templates</p>
            <Button variant="outline" size="sm" onClick={handleListTemplates} disabled={isListing}>
              {isListing ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Loading...</> : <><List className="h-4 w-4 mr-1" /> List Templates</>}
            </Button>
            {templates.length > 0 && (
              <div className="rounded-md border p-2 space-y-1 max-h-32 overflow-y-auto">
                {templates.map((t: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="font-mono">{t.name || t.id || `Template ${i + 1}`}</span>
                    <Badge variant="secondary" className="text-[10px]">{t.status || 'unknown'}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Step 3: Send Test Message */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Step 3: Send Test Message</p>
            <div className="space-y-2">
              <Label className="text-xs">Recipient PSID</Label>
              <Input
                placeholder="e.g. 6088049614603xxx"
                value={recipientPsid}
                onChange={(e) => setRecipientPsid(e.target.value)}
                className="h-8 text-xs"
              />
              <p className="text-[10px] text-muted-foreground">Find PSIDs in your contacts table (facebook_id column)</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(placeholders).map(([key, val]) => (
                <div key={key} className="space-y-1">
                  <Label className="text-[10px] capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                  <Input
                    value={val}
                    onChange={(e) => setPlaceholders(prev => ({ ...prev, [key]: e.target.value }))}
                    className="h-7 text-xs"
                  />
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={handleSendTest} disabled={isSending} className="w-full">
              {isSending ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Sending...</> : <><Send className="h-4 w-4 mr-1" /> Send Test Message</>}
            </Button>
            {sendResult && (
              <p className={`text-xs ${sendResult.startsWith('✅') ? 'text-green-600' : 'text-destructive'}`}>{sendResult}</p>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export function FacebookChannelCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [showPageSelector, setShowPageSelector] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<ChannelConnection | null>(null);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  // Fetch existing connections
  const { data: connections, isLoading } = useQuery({
    queryKey: ['channel-connections', 'facebook'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `https://jaqyvbjllsanrnpzlyjw.supabase.co/functions/v1/facebook-connect?action=get-connections`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch connections');
      }

      const data = await response.json();
      return (data.connections || []).filter((c: ChannelConnection) => c.channel_type === 'facebook') as ChannelConnection[];
    },
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `https://jaqyvbjllsanrnpzlyjw.supabase.co/functions/v1/facebook-connect?action=disconnect`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ connectionId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to disconnect');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel-connections'] });
      toast({
        title: "Disconnected",
        description: "Facebook Page has been disconnected.",
      });
      setShowDisconnectDialog(false);
      setSelectedConnection(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle OAuth flow
  const handleConnect = useCallback(async () => {
    setIsConnecting(true);
    
    // Open popup immediately on user click to avoid browser popup blockers
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    const popup = window.open(
      'about:blank',
      'facebook-oauth',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    if (!popup) {
      toast({
        title: "Popup blocked",
        description: "Please allow popups for this site and try again.",
        variant: "destructive",
      });
      setIsConnecting(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        popup.close();
        toast({
          title: "Not authenticated",
          description: "Please sign in to connect a Facebook Page.",
          variant: "destructive",
        });
        return;
      }

      // Get OAuth URL
      const response = await fetch(
        `https://jaqyvbjllsanrnpzlyjw.supabase.co/functions/v1/facebook-connect?action=initiate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        popup.close();
        const error = await response.json();
        throw new Error(error.error || 'Failed to initiate OAuth');
      }

      const { oauthUrl, redirectUri } = await response.json();

      // Navigate the already-open popup to the OAuth URL
      popup.location.href = oauthUrl;

      // Listen for OAuth callback
      const handleMessage = async (event: MessageEvent) => {
        if (event.data?.type === 'facebook-oauth-callback') {
          window.removeEventListener('message', handleMessage);
          popup?.close();

          const { code, error, error_code } = event.data;
          
          if (error) {
            const isInvalidScopes = error_code === '1349168' || 
              (typeof error === 'string' && error.toLowerCase().includes('invalid scopes'));
            toast({
              title: isInvalidScopes ? "Facebook Permission Error" : "OAuth Failed",
              description: isInvalidScopes 
                ? "Some Facebook permissions are not approved yet. Please try reconnecting or contact support."
                : error,
              variant: "destructive",
            });
            return;
          }

          if (code) {
            // Exchange code for pages list
            const callbackResponse = await fetch(
              `https://jaqyvbjllsanrnpzlyjw.supabase.co/functions/v1/facebook-connect?action=callback`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code, redirectUri }),
              }
            );

            if (!callbackResponse.ok) {
              const err = await callbackResponse.json();
              toast({
                title: "OAuth Failed",
                description: err.message || err.error || 'Failed to complete OAuth',
                variant: "destructive",
              });
              return;
            }

            const { pages: fetchedPages } = await callbackResponse.json();
            setPages(fetchedPages);
            setShowPageSelector(true);
          }
        }
      };

      window.addEventListener('message', handleMessage);

      // Fallback: listen for localStorage changes (when window.opener is null)
      const STORAGE_KEY = 'facebook-oauth-result';
      const handleStorage = (e: StorageEvent) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          try {
            const payload = JSON.parse(e.newValue);
            if (payload?.type === 'facebook-oauth-callback') {
              window.removeEventListener('message', handleMessage);
              window.removeEventListener('storage', handleStorage);
              localStorage.removeItem(STORAGE_KEY);
              handleMessage({ data: payload } as MessageEvent);
            }
          } catch (err) {
            console.error('Failed to parse OAuth storage result', err);
          }
        }
      };
      window.addEventListener('storage', handleStorage);

      // Poll for popup close (fallback if no message received)
      const pollTimer = setInterval(() => {
        if (popup?.closed) {
          clearInterval(pollTimer);
          // Check localStorage one last time in case the popup wrote before closing
          try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
              const payload = JSON.parse(stored);
              if (payload?.type === 'facebook-oauth-callback') {
                localStorage.removeItem(STORAGE_KEY);
                handleMessage({ data: payload } as MessageEvent);
              }
            }
          } catch (err) {
            console.error('Failed to read OAuth storage result', err);
          }
          window.removeEventListener('message', handleMessage);
          window.removeEventListener('storage', handleStorage);
          setIsConnecting(false);
        }
      }, 500);

    } catch (error) {
      console.error('Connect error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to connect',
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [toast]);

  // Handle page selection
  const handlePageSelect = useCallback(async (page: FacebookPage) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `https://jaqyvbjllsanrnpzlyjw.supabase.co/functions/v1/facebook-connect?action=select-page`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pageId: page.id,
            pageName: page.name,
            pageAccessToken: page.access_token,
            pagePicture: page.picture,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save page');
      }

      queryClient.invalidateQueries({ queryKey: ['channel-connections'] });
      setShowPageSelector(false);
      setPages([]);
      
      toast({
        title: "Connected!",
        description: `${page.name} is now connected to your Contact Center.`,
      });
    } catch (error) {
      console.error('Page selection error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to connect page',
        variant: "destructive",
      });
    }
  }, [queryClient, toast]);

  const facebookConnection = connections?.[0];

  // Handle upgrade permissions for comment auto-reply
  const handleUpgradePermissions = useCallback(async () => {
    setIsUpgrading(true);
    const width = 600, height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const popup = window.open('about:blank', 'facebook-oauth-upgrade', `width=${width},height=${height},left=${left},top=${top}`);
    if (!popup) {
      toast({ title: "Popup blocked", description: "Please allow popups and try again.", variant: "destructive" });
      setIsUpgrading(false);
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { popup.close(); setIsUpgrading(false); return; }
      const response = await fetch(
        `https://jaqyvbjllsanrnpzlyjw.supabase.co/functions/v1/facebook-connect?action=upgrade-permissions`,
        { method: 'POST', headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({}) }
      );
      if (!response.ok) { popup.close(); throw new Error('Failed to start upgrade'); }
      const { oauthUrl } = await response.json();
      popup.location.href = oauthUrl;

      const handleMessage = async (event: MessageEvent) => {
        if (event.data?.type !== 'facebook-oauth-callback') return;
        window.removeEventListener('message', handleMessage);
        popup?.close();
        const { code, error, error_code, error_reason, rawQuery } = event.data;
        if (error) {
          const errorStr = typeof error === 'string' ? error.toLowerCase() : '';
          const isInvalidScopes = error_code === '1349168' || errorStr.includes('invalid scopes');
          const hasLegacyScope = errorStr.includes('pages_read_user_content');
          
          let title = "Upgrade Failed";
          let description = error;
          
          if (hasLegacyScope) {
            title = "Meta App Configuration Issue";
            description = "Meta is enforcing a scope (pages_read_user_content) that is not approved yet. Go to Meta App Dashboard → App Review → Permissions and submit pages_read_user_content and pages_manage_engagement for review.";
          } else if (isInvalidScopes) {
            title = "Permissions Not Approved";
            description = "pages_read_user_content / pages_manage_engagement are not approved by Meta yet. Submit them for App Review first.";
          }
          
          setUpgradeError(`${title}: ${description}${rawQuery ? `\n\nDiagnostic: ${rawQuery}` : ''}`);
          toast({ title, description, variant: "destructive" });
          setIsUpgrading(false);
          return;
        }
        if (code) {
          const cbRes = await fetch(
            `https://jaqyvbjllsanrnpzlyjw.supabase.co/functions/v1/facebook-connect?action=callback`,
            { method: 'POST', headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) }
          );
          if (!cbRes.ok) { toast({ title: "Upgrade Failed", description: "Could not exchange token.", variant: "destructive" }); setIsUpgrading(false); return; }
          const { pages: upgradedPages } = await cbRes.json();
          const currentPage = upgradedPages?.find((p: FacebookPage) => p.id === facebookConnection?.external_id);
          if (currentPage) {
            await handlePageSelect(currentPage);
            toast({ title: "✅ Comment Auto-Reply Enabled", description: "Engagement permissions granted. Comment auto-replies are now active." });
          } else {
            setPages(upgradedPages || []);
            setShowPageSelector(true);
          }
        }
        setIsUpgrading(false);
      };
      window.addEventListener('message', handleMessage);
      const STORAGE_KEY = 'facebook-oauth-result';
      const handleStorage = (e: StorageEvent) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          try {
            const payload = JSON.parse(e.newValue);
            if (payload?.type === 'facebook-oauth-callback') {
              window.removeEventListener('message', handleMessage);
              window.removeEventListener('storage', handleStorage);
              localStorage.removeItem(STORAGE_KEY);
              handleMessage({ data: payload } as MessageEvent);
            }
          } catch (err) { console.error('Failed to parse OAuth storage result', err); }
        }
      };
      window.addEventListener('storage', handleStorage);
      const pollTimer = setInterval(() => {
        if (popup?.closed) {
          clearInterval(pollTimer);
          try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
              const payload = JSON.parse(stored);
              if (payload?.type === 'facebook-oauth-callback') { localStorage.removeItem(STORAGE_KEY); handleMessage({ data: payload } as MessageEvent); }
            }
          } catch (err) { console.error('Failed to read OAuth storage result', err); }
          window.removeEventListener('message', handleMessage);
          window.removeEventListener('storage', handleStorage);
          setIsUpgrading(false);
        }
      }, 500);
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : 'Failed to upgrade', variant: "destructive" });
      setIsUpgrading(false);
    }
  }, [toast, facebookConnection, handlePageSelect]);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#1877F2] flex items-center justify-center">
              <Facebook className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Facebook Messenger</CardTitle>
              <CardDescription>
                Receive and respond to messages from your Facebook Page
              </CardDescription>
            </div>
          </div>
          {facebookConnection && (
            <Badge variant={facebookConnection.status === 'active' ? 'default' : 'secondary'}>
              {facebookConnection.status === 'active' ? (
                <><CheckCircle className="h-3 w-3 mr-1" /> Active</>
              ) : (
                <><AlertCircle className="h-3 w-3 mr-1" /> {facebookConnection.status}</>
              )}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : facebookConnection ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={facebookConnection.profile_picture_url || undefined} />
                  <AvatarFallback>
                    <Facebook className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{facebookConnection.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Page ID: {facebookConnection.external_id}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Connected: {format(new Date(facebookConnection.connected_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    setSelectedConnection(facebookConnection);
                    setShowDisconnectDialog(true);
                  }}
                >
                  <Unlink className="h-4 w-4 mr-1" />
                  Disconnect
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ExternalLink className="h-4 w-4" />
                <a
                  href={`https://facebook.com/${facebookConnection.external_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  View Page on Facebook
                </a>
              </div>
              <UtilityMessagingTestSection
                pageId={facebookConnection.external_id}
              />
              <div className="border-t pt-3 mt-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Comment Auto-Reply</p>
                    <p className="text-xs text-muted-foreground">
                      Enable auto-replies to post comments &amp; private messages to commenters
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Requires: <code className="bg-muted px-1 rounded">pages_read_user_content</code> + <code className="bg-muted px-1 rounded">pages_manage_engagement</code>
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setUpgradeError(null); handleUpgradePermissions(); }}
                    disabled={isUpgrading}
                  >
                    {isUpgrading ? (
                      <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Upgrading...</>
                    ) : (
                      <><MessageSquareText className="h-4 w-4 mr-1" /> Enable</>
                    )}
                  </Button>
                </div>
                {upgradeError && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 space-y-1">
                    <p className="text-xs text-destructive whitespace-pre-wrap">{upgradeError}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() => { navigator.clipboard.writeText(upgradeError); toast({ title: "Copied" }); }}
                    >
                      Copy diagnostic details
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect your Facebook Page to receive and respond to customer messages directly from your Contact Center.
              </p>
              <Button onClick={handleConnect} disabled={isConnecting}>
                {isConnecting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Connecting...</>
                ) : (
                  <><Link2 className="h-4 w-4 mr-2" /> Connect Facebook Page</>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Page Selector Dialog */}
      <FacebookPageSelector
        open={showPageSelector}
        onOpenChange={setShowPageSelector}
        pages={pages}
        onSelect={handlePageSelect}
      />

      {/* Disconnect Confirmation Dialog */}
      <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Facebook Page?</AlertDialogTitle>
            <AlertDialogDescription>
              This will stop receiving messages from {selectedConnection?.name}. 
              You can reconnect at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedConnection && disconnectMutation.mutate(selectedConnection.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {disconnectMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Disconnecting...</>
              ) : (
                'Disconnect'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
