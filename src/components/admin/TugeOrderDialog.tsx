import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Loader2, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { LPAQRCode } from '@/components/esim/LPAQRCode';

interface TugeOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const TugeOrderDialog = ({ open, onOpenChange, onSuccess }: TugeOrderDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [packages, setPackages] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  
  // Form states
  const [selectedPkgId, setSelectedPkgId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('none');
  const [email, setEmail] = useState('');
  const [environment, setEnvironment] = useState<'test' | 'production'>('test');
  const [eid, setEid] = useState('');
  const [imei2, setImei2] = useState('');
  
  // Success states
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [polling, setPolling] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchTugePackages();
      fetchUsers();
    } else {
      resetForm();
    }
  }, [open]);

  const fetchTugePackages = async () => {
    setSearching(true);
    try {
      const allPackages: any[] = [];
      const pageSize = 1000;
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('esim_packages')
          .select('id, package_id, name, country_code, country_name, data_amount, validity_days, price, provider_id, esim_providers!inner(provider_code)')
          .eq('esim_providers.provider_code', 'tuge')
          .eq('is_active', true)
          .order('country_name', { ascending: true })
          .order('id', { ascending: true })
          .range(offset, offset + pageSize - 1);

        if (error) throw error;
        
        if (data && data.length > 0) {
          allPackages.push(...data);
          offset += pageSize;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      console.log(`[TugeOrderDialog] Loaded ${allPackages.length} TUGE packages in ${Math.ceil(allPackages.length / pageSize)} batches`);
      setPackages(allPackages);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const allUsers: any[] = [];
      const pageSize = 1000;
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, email, first_name, last_name')
          .order('email', { ascending: true })
          .order('user_id', { ascending: true })
          .range(offset, offset + pageSize - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allUsers.push(...data);
          offset += pageSize;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      console.log(`[TugeOrderDialog] Loaded ${allUsers.length} users`);
      setUsers(allUsers);
    } catch (e) {
      console.error('Failed to fetch users:', e);
    }
  };

  const resetForm = () => {
    setSelectedPkgId('');
    setSelectedUserId('none');
    setEmail('');
    setEnvironment('test');
    setCreatedOrder(null);
    setPolling(false);
    setUserSearchTerm('');
    setEid('');
    setImei2('');
  };

  

  const handleCreateOrder = async () => {
    if (!selectedPkgId) {
      toast({ title: "Required", description: "Please select a package", variant: "destructive" });
      return;
    }

    if (isPushMode && (!eidValid || !imei2Valid)) {
      toast({ title: "Required", description: "T-Mobile orders require valid EID (32 hex) and IMEI2 (15 digits)", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-tuge-order', {
        body: {
          packageId: selectedPkgId,
          userId: selectedUserId === 'none' ? undefined : selectedUserId,
          email: email || undefined,
          notificationEmail: email || undefined,
          environment,
          ...(isPushMode ? { eid, imei2 } : {}),
        }
      });

      if (error) throw error;

      setCreatedOrder(data);
      setPolling(true);
      toast({ title: "Order Created", description: "Request sent to TUGE. Waiting for activation..." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Poll for QR code
  useEffect(() => {
    let interval: any;
    if (polling && createdOrder?.id) {
      interval = setInterval(async () => {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', createdOrder.id)
          .single();
        
        if (!error && data?.qr_code) {
          setCreatedOrder(data);
          setPolling(false);
          toast({ title: "eSIM Ready", description: "QR code has been delivered!" });
          if (onSuccess) onSuccess();
          
          // Send confirmation email to user's account (if a user was selected)
          if (selectedUserId && selectedUserId !== 'none') {
            try {
              await supabase.functions.invoke('send-order-confirmation', {
                body: { orderId: data.id }
              });
              const userObj = users.find(u => u.user_id === selectedUserId);
              toast({ title: "Email Sent", description: `Confirmation sent to ${userObj?.email || 'user account'}` });
            } catch (emailErr) {
              console.error('User email send error:', emailErr);
            }
          }

          // Send separately to notification email if provided
          if (email) {
            try {
              await supabase.functions.invoke('send-order-confirmation', {
                body: { orderId: data.id, overrideEmail: email }
              });
              toast({ title: "Email Sent", description: `Confirmation sent to ${email}` });
            } catch (emailErr) {
              console.error('Notification email send error:', emailErr);
            }
          }
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [polling, createdOrder?.id, selectedUserId, email, users]);

  const filteredPackages = packages.filter(pkg => {
    const terms = searchTerm.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return true;
    const haystack = `${pkg.name} ${pkg.country_name} ${pkg.package_id}`.toLowerCase();
    return terms.every(term => haystack.includes(term));
  });

  const filteredUsers = users.filter(u => {
    const terms = userSearchTerm.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return true;
    const haystack = `${u.email || ''} ${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
    return terms.every(term => haystack.includes(term));
  });

  const selectedPkg = packages.find(p => p.id === selectedPkgId);
  const selectedUser = users.find(u => u.user_id === selectedUserId);
  const isPushMode = selectedPkg?.package_id?.includes('TMO') || false;
  const eidValid = /^[0-9a-fA-F]{32}$/.test(eid);
  const imei2Valid = /^\d{15}$/.test(imei2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Create TUGE Order
            {environment === 'test' ? (
              <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">Sandbox</Badge>
            ) : (
              <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Production</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Directly provision an eSIM from TUGE for testing or manual fulfillment.
          </DialogDescription>
        </DialogHeader>

        {!createdOrder ? (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Search & Select TUGE Package</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Country, name or product code..." 
                  className="pl-8" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="border rounded-md max-h-48 overflow-y-auto bg-muted/20">
                {searching ? (
                  <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
                ) : filteredPackages.length > 0 ? (
                  filteredPackages.map(pkg => (
                    <div 
                      key={pkg.id} 
                      className={`p-2 border-b last:border-0 cursor-pointer hover:bg-muted transition-colors text-sm flex justify-between items-center ${selectedPkgId === pkg.id ? 'bg-primary/10 border-primary' : ''}`}
                      onClick={() => setSelectedPkgId(pkg.id)}
                    >
                      <div>
                        <div className="font-medium">{pkg.country_name} - {pkg.name}</div>
                        <div className="text-xs text-muted-foreground">{pkg.package_id} • {pkg.data_amount} • {pkg.validity_days} days</div>
                      </div>
                      <div className="font-mono text-xs">${pkg.price}</div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">No TUGE packages found</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 items-start">
              <div className="space-y-2 col-span-2">
                <Label>User (Optional){selectedUser && selectedUserId !== 'none' ? `: ${selectedUser.email}` : ''}</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by email or name..."
                    className="pl-8"
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                  />
                </div>
                <div className="border rounded-md max-h-32 overflow-y-auto bg-muted/20">
                  <div
                    className={`p-2 border-b cursor-pointer hover:bg-muted transition-colors text-sm ${selectedUserId === 'none' ? 'bg-primary/10 border-primary' : ''}`}
                    onClick={() => setSelectedUserId('none')}
                  >
                    <span className="font-medium">Internal / No User</span>
                  </div>
                  {filteredUsers.map(u => (
                    <div
                      key={u.user_id}
                      className={`p-2 border-b last:border-0 cursor-pointer hover:bg-muted transition-colors text-sm ${selectedUserId === u.user_id ? 'bg-primary/10 border-primary' : ''}`}
                      onClick={() => setSelectedUserId(u.user_id)}
                    >
                      <div className="font-medium">{u.email}</div>
                      {(u.first_name || u.last_name) && (
                        <div className="text-xs text-muted-foreground">{u.first_name} {u.last_name}</div>
                      )}
                    </div>
                  ))}
                  {filteredUsers.length === 0 && userSearchTerm && (
                    <div className="p-4 text-center text-muted-foreground text-sm">No users found</div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Environment</Label>
                <Select value={environment} onValueChange={(v: any) => setEnvironment(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="test">Sandbox (Test)</SelectItem>
                    <SelectItem value="production">Production (Real)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notification Email (Optional)</Label>
              <Input 
                placeholder="Where to send eSIM details..." 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {isPushMode && (
              <div className="space-y-3 p-3 border border-orange-200 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium text-orange-700">
                  <AlertCircle className="h-4 w-4" />
                  T-Mobile Push Mode — Device Info Required
                </div>
                <div className="space-y-2">
                  <Label>EID (32 hex characters)</Label>
                  <Input 
                    placeholder="Enter 32-character EID..."
                    value={eid}
                    onChange={(e) => setEid(e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 32))}
                  />
                  {eid.length > 0 && !eidValid && (
                    <p className="text-xs text-destructive">EID must be exactly 32 hex characters</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>IMEI2 (15 digits)</Label>
                  <Input 
                    placeholder="Enter 15-digit IMEI2..."
                    value={imei2}
                    onChange={(e) => setImei2(e.target.value.replace(/\D/g, '').slice(0, 15))}
                    inputMode="numeric"
                  />
                  {imei2.length > 0 && !imei2Valid && (
                    <p className="text-xs text-destructive">IMEI2 must be exactly 15 digits</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 py-4 flex flex-col items-center">
            {createdOrder.qr_code ? (
              <div className="w-full space-y-4">
                <div className="flex items-center justify-center gap-2 text-green-600 font-bold">
                  <CheckCircle2 className="h-5 w-5" />
                  Order Completed Successfully
                </div>
                <LPAQRCode 
                  lpaString={createdOrder.qr_code} 
                  downloadFilename={`TUGE-${createdOrder.provider_order_id}`}
                />
                <div className="bg-muted/30 p-4 rounded-lg border border-border space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Internal Order ID:</span>
                    <span className="font-mono font-bold">{createdOrder.order_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">TUGE Order No:</span>
                    <span className="font-mono font-bold">{createdOrder.provider_order_id}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4 py-8">
                <div className="relative mx-auto w-16 h-16">
                  <Loader2 className="h-16 w-16 animate-spin text-primary" />
                  <RefreshCw className="h-8 w-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary/50" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-lg">Waiting for TUGE...</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    The order has been created (ID: {createdOrder.provider_order_id}). 
                    We are waiting for the provider to deliver the eSIM details via webhook.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {createdOrder ? 'Close' : 'Cancel'}
          </Button>
          {!createdOrder && (
            <Button onClick={handleCreateOrder} disabled={loading || !selectedPkgId || (isPushMode && (!eidValid || !imei2Valid))}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : 'Create TUGE Order'}
            </Button>
          )}
          {createdOrder && !createdOrder.qr_code && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
              <AlertCircle className="h-3 w-3" />
              This usually takes 5-30 seconds
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
