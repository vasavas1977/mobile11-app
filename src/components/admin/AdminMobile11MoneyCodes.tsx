import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Copy, CheckCircle, XCircle, Calendar, Users, Download, Layers, Coins } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface Mobile11MoneyCode {
  id: string;
  code: string;
  description: string;
  discount_type: string;
  discount_value: number;
  topup_amount: number;
  currency: 'USD' | 'THB';
  max_uses: number | null;
  current_uses: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

export function AdminMobile11MoneyCodes() {
  const [codes, setCodes] = useState<Mobile11MoneyCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [batchCreating, setBatchCreating] = useState(false);
  const [batchResults, setBatchResults] = useState<Mobile11MoneyCode[]>([]);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const [newCode, setNewCode] = useState({
    code: '',
    description: '',
    topup_amount: 0,
    currency: 'THB' as 'USD' | 'THB',
    max_uses: 1 as number | null,
    valid_until: null as string | null,
  });

  const [batchConfig, setBatchConfig] = useState({
    quantity: 100,
    prefix: '',
    codeLength: 8,
    description: '',
    topup_amount: 0,
    currency: 'THB' as 'USD' | 'THB',
    max_uses: 1 as number | null,
    valid_until: null as string | null,
    oneTimeUse: true,
  });

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('discount_type', 'mobile11_money_topup')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCodes((data || []) as Mobile11MoneyCode[]);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load Mobile11 Money codes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCode({ ...newCode, code });
  };

  const generateUniqueCode = (prefix: string, length: number, existingCodes: Set<string>): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let attempts = 0;
    let code = '';
    
    do {
      code = prefix;
      for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      attempts++;
      if (attempts > 100) {
        throw new Error('Failed to generate unique code after 100 attempts');
      }
    } while (existingCodes.has(code));
    
    return code;
  };

  const createBatchCodes = async () => {
    if (batchConfig.quantity < 1 || batchConfig.quantity > 1000) {
      toast({
        title: 'Error',
        description: 'Quantity must be between 1 and 1000',
        variant: 'destructive',
      });
      return;
    }

    if (batchConfig.topup_amount <= 0) {
      toast({
        title: 'Error',
        description: 'Top-up amount must be greater than 0',
        variant: 'destructive',
      });
      return;
    }

    setBatchCreating(true);
    try {
      const { data: existingCodesData } = await supabase
        .from('promo_codes')
        .select('code');
      
      const existingCodes = new Set(existingCodesData?.map(c => c.code) || []);
      
      const generatedCodes: string[] = [];
      const generatedSet = new Set<string>();
      
      for (let i = 0; i < batchConfig.quantity; i++) {
        const code = generateUniqueCode(batchConfig.prefix, batchConfig.codeLength, new Set([...existingCodes, ...generatedSet]));
        generatedCodes.push(code);
        generatedSet.add(code);
      }

      const symbol = batchConfig.currency === 'THB' ? '฿' : '$';
      const codeData = generatedCodes.map(code => ({
        code: code.toUpperCase(),
        description: batchConfig.description || `Mobile11 Money top-up: ${symbol}${batchConfig.topup_amount}`,
        discount_type: 'mobile11_money_topup',
        discount_value: 0,
        topup_amount: batchConfig.topup_amount,
        currency: batchConfig.currency,
        max_uses: batchConfig.oneTimeUse ? 1 : batchConfig.max_uses,
        valid_until: batchConfig.valid_until 
          ? new Date(batchConfig.valid_until).toISOString() 
          : null,
      }));

      // Retry logic for network errors
      const maxRetries = 3;
      let lastError: any;
      let data: any;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const result = await supabase
          .from('promo_codes')
          .insert(codeData)
          .select();

        if (!result.error) {
          data = result.data;
          break;
        }
        
        lastError = result.error;
        
        // Don't retry on non-network errors
        if (!result.error.message?.includes('Load failed') && !result.error.message?.includes('FunctionsFetchError')) {
          throw result.error;
        }
        
        // Wait before retry: 500ms, 1000ms, 2000ms
        if (attempt < maxRetries - 1) {
          await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt)));
        } else {
          throw lastError;
        }
      }

      toast({
        title: 'Success',
        description: `Successfully created ${batchConfig.quantity} Mobile11 Money codes`,
      });

      setBatchResults((data || []) as Mobile11MoneyCode[]);
      setShowResults(true);
      setBatchDialogOpen(false);
      
      setBatchConfig({
        quantity: 100,
        prefix: '',
        codeLength: 8,
        description: '',
        topup_amount: 0,
        currency: 'THB',
        max_uses: 1,
        valid_until: null,
        oneTimeUse: true,
      });
      
      fetchCodes();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create batch codes',
        variant: 'destructive',
      });
    } finally {
      setBatchCreating(false);
    }
  };

  const exportToCSV = (codes: Mobile11MoneyCode[]) => {
    const headers = ['Code', 'Description', 'Top-up Amount', 'Currency', 'Max Uses', 'Expiration'];
    const rows = codes.map(c => [
      c.code,
      c.description,
      c.topup_amount || c.discount_value,
      c.currency,
      c.max_uses || 'Unlimited',
      c.valid_until ? new Date(c.valid_until).toLocaleDateString() : 'No expiration'
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mobile11-money-codes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportToTXT = (codes: Mobile11MoneyCode[]) => {
    const txt = codes.map(c => c.code).join('\n');
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mobile11-money-codes-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  const copyAllCodes = (codes: Mobile11MoneyCode[]) => {
    const codesList = codes.map(c => c.code).join(', ');
    navigator.clipboard.writeText(codesList);
    toast({
      title: 'Copied',
      description: `${codes.length} codes copied to clipboard`,
    });
  };

  const createCode = async () => {
    if (!newCode.code.trim()) {
      toast({
        title: 'Error',
        description: 'Code is required',
        variant: 'destructive',
      });
      return;
    }

    if (newCode.topup_amount <= 0) {
      toast({
        title: 'Error',
        description: 'Top-up amount must be greater than 0',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);
    try {
      const symbol = newCode.currency === 'THB' ? '฿' : '$';
      const insertData = {
        code: newCode.code.toUpperCase(),
        description: newCode.description || `Mobile11 Money top-up: ${symbol}${newCode.topup_amount}`,
        discount_type: 'mobile11_money_topup',
        discount_value: 0,
        topup_amount: newCode.topup_amount,
        currency: newCode.currency,
        max_uses: newCode.max_uses,
        valid_until: newCode.valid_until 
          ? new Date(newCode.valid_until).toISOString() 
          : null,
      };

      // Retry logic for network errors
      const maxRetries = 3;
      let lastError: any;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const { error } = await supabase.from('promo_codes').insert(insertData);

        if (!error) {
          break;
        }
        
        lastError = error;
        
        // Don't retry on non-network errors
        if (!error.message?.includes('Load failed') && !error.message?.includes('FunctionsFetchError')) {
          throw error;
        }
        
        // Wait before retry: 500ms, 1000ms, 2000ms
        if (attempt < maxRetries - 1) {
          await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt)));
        } else {
          throw lastError;
        }
      }

      toast({
        title: 'Success',
        description: 'Mobile11 Money code created successfully',
      });

      setDialogOpen(false);
      setNewCode({
        code: '',
        description: '',
        topup_amount: 0,
        currency: 'THB',
        max_uses: 1,
        valid_until: null,
      });
      fetchCodes();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create code',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchCodes();
      toast({
        title: 'Success',
        description: `Code ${!currentStatus ? 'activated' : 'deactivated'}`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update code',
        variant: 'destructive',
      });
    }
  };

  const deleteCode = async (id: string) => {
    if (!confirm('Are you sure you want to delete this code?')) return;

    try {
      const { error } = await supabase.from('promo_codes').delete().eq('id', id);

      if (error) throw error;
      fetchCodes();
      toast({
        title: 'Success',
        description: 'Code deleted',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete code',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Copied',
      description: `Code "${code}" copied to clipboard`,
    });
  };

  const getValueDisplay = (item: Mobile11MoneyCode) => {
    const amount = item.topup_amount || item.discount_value || 0;
    if (item.discount_type === 'mobile11_money_topup') {
      const symbol = item.currency === 'THB' ? '฿' : '$';
      return `+${symbol}${amount}`;
    }
    // Legacy discount types
    if (item.discount_type === 'free') return 'FREE';
    if (item.discount_type === 'percentage') return `${item.discount_value}% OFF`;
    const symbol = item.currency === 'THB' ? '฿' : '$';
    return `${symbol}${item.discount_value} OFF`;
  };

  const isExpired = (item: Mobile11MoneyCode) => {
    return item.valid_until && new Date(item.valid_until) < new Date();
  };

  const isUsedUp = (item: Mobile11MoneyCode) => {
    return item.max_uses !== null && item.current_uses >= item.max_uses;
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading Mobile11 Money codes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Coins className="h-8 w-8 text-amber-500" />
            Mobile11 Money Codes
          </h2>
          <p className="text-muted-foreground">Create codes that add Mobile11 Money to user accounts</p>
        </div>

        <div className="flex gap-2">
          {/* Batch Create Dialog */}
          <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Layers className="mr-2 h-4 w-4" />
                Batch Create
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Batch Create Mobile11 Money Codes</DialogTitle>
                <DialogDescription>
                  Generate multiple unique codes that add balance to user accounts
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity">Quantity (1-1000)</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max="1000"
                      value={batchConfig.quantity}
                      onChange={(e) => setBatchConfig({ ...batchConfig, quantity: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="codeLength">Code Length</Label>
                    <Input
                      id="codeLength"
                      type="number"
                      min="4"
                      max="16"
                      value={batchConfig.codeLength}
                      onChange={(e) => setBatchConfig({ ...batchConfig, codeLength: parseInt(e.target.value) || 8 })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="prefix">Code Prefix (Optional)</Label>
                  <Input
                    id="prefix"
                    placeholder="e.g., M11-"
                    value={batchConfig.prefix}
                    onChange={(e) => setBatchConfig({ ...batchConfig, prefix: e.target.value.toUpperCase() })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Example: "M11-" generates codes like "M11-ABC123XY"
                  </p>
                </div>

                <div>
                  <Label htmlFor="batch-description">Description</Label>
                  <Input
                    id="batch-description"
                    placeholder="Mobile11 Money top-up for..."
                    value={batchConfig.description}
                    onChange={(e) => setBatchConfig({ ...batchConfig, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="batch-topup-amount">Top-up Amount</Label>
                    <Input
                      id="batch-topup-amount"
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="100"
                      value={batchConfig.topup_amount || ''}
                      onChange={(e) => setBatchConfig({ ...batchConfig, topup_amount: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="batch-currency">Currency</Label>
                    <Select
                      value={batchConfig.currency}
                      onValueChange={(value: 'USD' | 'THB') => setBatchConfig({ ...batchConfig, currency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="THB">฿ THB</SelectItem>
                        <SelectItem value="USD">$ USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="oneTimeUse">One-Time Use</Label>
                    <p className="text-xs text-muted-foreground">
                      Each code can only be used once
                    </p>
                  </div>
                  <Switch
                    id="oneTimeUse"
                    checked={batchConfig.oneTimeUse}
                    onCheckedChange={(checked) => setBatchConfig({ 
                      ...batchConfig, 
                      oneTimeUse: checked,
                      max_uses: checked ? 1 : null 
                    })}
                  />
                </div>

                {!batchConfig.oneTimeUse && (
                  <div>
                    <Label htmlFor="batch-max-uses">Max Uses (Optional)</Label>
                    <Input
                      id="batch-max-uses"
                      type="number"
                      min="1"
                      placeholder="Unlimited"
                      value={batchConfig.max_uses || ''}
                      onChange={(e) => setBatchConfig({ ...batchConfig, max_uses: parseInt(e.target.value) || null })}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="batch-valid-until">Expiration Date (Optional)</Label>
                  <Input
                    id="batch-valid-until"
                    type="datetime-local"
                    value={batchConfig.valid_until || ''}
                    onChange={(e) => setBatchConfig({ ...batchConfig, valid_until: e.target.value || null })}
                  />
                </div>

                <Button
                  onClick={createBatchCodes}
                  disabled={batchCreating}
                  className="w-full"
                >
                  {batchCreating ? 'Creating...' : `Create ${batchConfig.quantity} Codes`}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Single Create Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Code
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Mobile11 Money Code</DialogTitle>
                <DialogDescription>Generate a code that adds balance to user accounts</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Code</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="M11GIFT100"
                      value={newCode.code}
                      onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
                      maxLength={20}
                    />
                    <Button onClick={generateCode} variant="outline">
                      Generate
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Input
                    placeholder="Gift for new customers"
                    value={newCode.description}
                    onChange={(e) => setNewCode({ ...newCode, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Top-up Amount</Label>
                    <Input
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="100"
                      value={newCode.topup_amount || ''}
                      onChange={(e) => setNewCode({ ...newCode, topup_amount: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select
                      value={newCode.currency}
                      onValueChange={(value: 'USD' | 'THB') => setNewCode({ ...newCode, currency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="THB">฿ THB</SelectItem>
                        <SelectItem value="USD">$ USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Max Uses (optional)</Label>
                  <Input
                    type="number"
                    placeholder="1"
                    value={newCode.max_uses || ''}
                    onChange={(e) =>
                      setNewCode({ ...newCode, max_uses: e.target.value ? parseInt(e.target.value) : null })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Expiration Date (optional)</Label>
                  <Input
                    type="datetime-local"
                    value={newCode.valid_until || ''}
                    onChange={(e) => setNewCode({ ...newCode, valid_until: e.target.value || null })}
                  />
                </div>

                <Button onClick={createCode} disabled={creating} className="w-full">
                  {creating ? 'Creating...' : 'Create Code'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Codes</CardTitle>
          <CardDescription>Manage Mobile11 Money codes and legacy promo codes</CardDescription>
        </CardHeader>
        <CardContent>
          {codes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No codes yet. Create one to get started!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono font-semibold">
                      <div className="flex items-center gap-2">
                        {item.code}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(item.code)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground mt-1">{item.description}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.discount_type === 'mobile11_money_topup' ? 'default' : 'secondary'} 
                        className={item.discount_type === 'mobile11_money_topup' ? 'bg-amber-500 hover:bg-amber-600' : ''}>
                        {getValueDisplay(item)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {item.current_uses}/{item.max_uses || '∞'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {isExpired(item) ? (
                        <Badge variant="destructive">Expired</Badge>
                      ) : isUsedUp(item) ? (
                        <Badge variant="secondary">Used Up</Badge>
                      ) : item.is_active ? (
                        <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.valid_until ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {new Date(item.valid_until).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleActive(item.id, item.is_active)}
                        >
                          {item.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteCode(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Batch Results Dialog */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Batch Creation Results</DialogTitle>
            <DialogDescription>
              Successfully created {batchResults.length} Mobile11 Money codes
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={() => copyAllCodes(batchResults)} variant="outline" size="sm">
                <Copy className="mr-2 h-4 w-4" />
                Copy All Codes
              </Button>
              <Button onClick={() => exportToCSV(batchResults)} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download CSV
              </Button>
              <Button onClick={() => exportToTXT(batchResults)} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download TXT
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Top-up Amount</TableHead>
                    <TableHead>Max Uses</TableHead>
                    <TableHead>Expires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batchResults.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell className="font-mono font-semibold">{code.code}</TableCell>
                      <TableCell>{getValueDisplay(code)}</TableCell>
                      <TableCell>
                        {code.max_uses ? (
                          <span>{code.current_uses}/{code.max_uses}</span>
                        ) : (
                          <span>Unlimited</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {code.valid_until ? (
                          <span>{new Date(code.valid_until).toLocaleDateString()}</span>
                        ) : (
                          <span className="text-muted-foreground">No expiration</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
