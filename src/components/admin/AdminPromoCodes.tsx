import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminMobile11MoneyCodes } from './AdminMobile11MoneyCodes';
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
import { Plus, Trash2, Copy, CheckCircle, XCircle, Calendar, Users, Download, Layers } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface PromoCode {
  id: string;
  code: string;
  description: string;
  discount_type: 'free' | 'percentage' | 'fixed_amount';
  discount_value: number;
  currency: 'USD' | 'THB';
  max_uses: number | null;
  current_uses: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

export function AdminPromoCodes() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [batchCreating, setBatchCreating] = useState(false);
  const [batchResults, setBatchResults] = useState<PromoCode[]>([]);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const [newCode, setNewCode] = useState({
    code: '',
    description: '',
    discount_type: 'free' as 'free' | 'percentage' | 'fixed_amount',
    discount_value: 0,
    currency: 'USD' as 'USD' | 'THB',
    max_uses: null as number | null,
    valid_until: null as string | null,
  });

  const [batchConfig, setBatchConfig] = useState<{
    quantity: number;
    prefix: string;
    codeLength: number;
    description: string;
    discount_type: 'free' | 'percentage' | 'fixed_amount';
    discount_value: number;
    currency: 'USD' | 'THB';
    max_uses: number | null;
    valid_until: string | null;
    oneTimeUse: boolean;
  }>({
    quantity: 100,
    prefix: '',
    codeLength: 8,
    description: '',
    discount_type: 'fixed_amount',
    discount_value: 0,
    currency: 'USD',
    max_uses: 1,
    valid_until: null,
    oneTimeUse: true,
  });

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .neq('discount_type', 'mobile11_money_topup')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromoCodes((data || []) as PromoCode[]);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load promo codes',
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

  const createBatchPromoCodes = async () => {
    if (batchConfig.quantity < 1 || batchConfig.quantity > 1000) {
      toast({
        title: 'Error',
        description: 'Quantity must be between 1 and 1000',
        variant: 'destructive',
      });
      return;
    }

    if (batchConfig.discount_value <= 0) {
      toast({
        title: 'Error',
        description: 'Discount value must be greater than 0',
        variant: 'destructive',
      });
      return;
    }

    setBatchCreating(true);
    try {
      // Fetch existing codes to check for duplicates
      const { data: existingCodesData } = await supabase
        .from('promo_codes')
        .select('code');
      
      const existingCodes = new Set(existingCodesData?.map(c => c.code) || []);
      
      // Generate unique codes
      const codes: string[] = [];
      const generatedSet = new Set<string>();
      
      for (let i = 0; i < batchConfig.quantity; i++) {
        const code = generateUniqueCode(batchConfig.prefix, batchConfig.codeLength, new Set([...existingCodes, ...generatedSet]));
        codes.push(code);
        generatedSet.add(code);
      }

      // Prepare batch insert data
      const promoCodeData = codes.map(code => ({
        code: code.toUpperCase(),
        description: batchConfig.description || `Batch generated - ${batchConfig.discount_value} ${batchConfig.discount_type === 'percentage' ? '%' : batchConfig.currency} discount`,
        discount_type: batchConfig.discount_type,
        discount_value: batchConfig.discount_value,
        currency: batchConfig.currency,
        max_uses: batchConfig.oneTimeUse ? 1 : batchConfig.max_uses,
        valid_until: batchConfig.valid_until,
      }));

      // Batch insert
      const { data, error } = await supabase
        .from('promo_codes')
        .insert(promoCodeData)
        .select();

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Successfully created ${batchConfig.quantity} promo codes`,
      });

      setBatchResults((data || []) as PromoCode[]);
      setShowResults(true);
      setBatchDialogOpen(false);
      
      // Reset form
      setBatchConfig({
        quantity: 100,
        prefix: '',
        codeLength: 8,
        description: '',
        discount_type: 'fixed_amount',
        discount_value: 0,
        currency: 'USD',
        max_uses: 1,
        valid_until: null,
        oneTimeUse: true,
      });
      
      fetchPromoCodes();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create batch promo codes',
        variant: 'destructive',
      });
    } finally {
      setBatchCreating(false);
    }
  };

  const exportToCSV = (codes: PromoCode[]) => {
    const headers = ['Code', 'Description', 'Discount Type', 'Discount Value', 'Max Uses', 'Expiration'];
    const rows = codes.map(c => [
      c.code,
      c.description,
      c.discount_type,
      c.discount_value,
      c.max_uses || 'Unlimited',
      c.valid_until ? new Date(c.valid_until).toLocaleDateString() : 'No expiration'
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `promo-codes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportToTXT = (codes: PromoCode[]) => {
    const txt = codes.map(c => c.code).join('\n');
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `promo-codes-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  const copyAllCodes = (codes: PromoCode[]) => {
    const codesList = codes.map(c => c.code).join(', ');
    navigator.clipboard.writeText(codesList);
    toast({
      title: 'Copied',
      description: `${codes.length} promo codes copied to clipboard`,
    });
  };

  const createPromoCode = async () => {
    if (!newCode.code.trim()) {
      toast({
        title: 'Error',
        description: 'Promo code is required',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);
    try {
      const { error } = await supabase.from('promo_codes').insert({
        code: newCode.code.toUpperCase(),
        description: newCode.description,
        discount_type: newCode.discount_type,
        discount_value: newCode.discount_value,
        currency: newCode.currency,
        max_uses: newCode.max_uses,
        valid_until: newCode.valid_until,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Promo code created successfully',
      });

      setDialogOpen(false);
      setNewCode({
        code: '',
        description: '',
        discount_type: 'free',
        discount_value: 0,
        currency: 'USD',
        max_uses: null,
        valid_until: null,
      });
      fetchPromoCodes();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create promo code',
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
      fetchPromoCodes();
      toast({
        title: 'Success',
        description: `Promo code ${!currentStatus ? 'activated' : 'deactivated'}`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update promo code',
        variant: 'destructive',
      });
    }
  };

  const deletePromoCode = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promo code?')) return;

    try {
      const { error } = await supabase.from('promo_codes').delete().eq('id', id);

      if (error) throw error;
      fetchPromoCodes();
      toast({
        title: 'Success',
        description: 'Promo code deleted',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete promo code',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Copied',
      description: `Promo code "${code}" copied to clipboard`,
    });
  };

  const getDiscountDisplay = (promo: PromoCode) => {
    if (promo.discount_type === 'free') return 'FREE';
    if (promo.discount_type === 'percentage') return `${promo.discount_value}% OFF`;
    const symbol = promo.currency === 'THB' ? '฿' : '$';
    return `${symbol}${promo.discount_value} OFF`;
  };

  const isExpired = (promo: PromoCode) => {
    return promo.valid_until && new Date(promo.valid_until) < new Date();
  };

  const isUsedUp = (promo: PromoCode) => {
    return promo.max_uses !== null && promo.current_uses >= promo.max_uses;
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading promo codes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Promo & Loyalty Codes</h2>
          <p className="text-muted-foreground">Manage promotional codes and Mobile11 Money loyalty codes</p>
        </div>
      </div>

      <Tabs defaultValue="promo" className="space-y-4">
        <TabsList>
          <TabsTrigger value="promo">Promo Codes</TabsTrigger>
          <TabsTrigger value="loyalty">Loyalty Codes</TabsTrigger>
        </TabsList>

        <TabsContent value="promo" className="space-y-6">
      <div className="flex justify-end">
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
                <DialogTitle>Batch Create Promo Codes</DialogTitle>
                <DialogDescription>
                  Generate multiple unique promo codes at once
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
                    placeholder="e.g., 3USD-"
                    value={batchConfig.prefix}
                    onChange={(e) => setBatchConfig({ ...batchConfig, prefix: e.target.value.toUpperCase() })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Example: "3USD-" generates codes like "3USD-ABC123XY"
                  </p>
                </div>

                <div>
                  <Label htmlFor="batch-description">Description</Label>
                  <Input
                    id="batch-description"
                    placeholder="Batch promo codes for..."
                    value={batchConfig.description}
                    onChange={(e) => setBatchConfig({ ...batchConfig, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="batch-discount-type">Discount Type</Label>
                    <Select
                      value={batchConfig.discount_type}
                      onValueChange={(value: 'free' | 'percentage' | 'fixed_amount') => setBatchConfig({ ...batchConfig, discount_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free (100% off)</SelectItem>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {batchConfig.discount_type === 'fixed_amount' && (
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
                          <SelectItem value="USD">$ USD</SelectItem>
                          <SelectItem value="THB">฿ THB</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="batch-discount-value">
                    {batchConfig.discount_type === 'free' ? 'Value (ignored)' : 
                     batchConfig.discount_type === 'percentage' ? 'Percentage (%)' : 
                     `Amount (${batchConfig.currency})`}
                  </Label>
                  <Input
                    id="batch-discount-value"
                    type="number"
                    min="0"
                    step={batchConfig.discount_type === 'percentage' ? '1' : '0.01'}
                    disabled={batchConfig.discount_type === 'free'}
                    value={batchConfig.discount_value}
                    onChange={(e) => setBatchConfig({ ...batchConfig, discount_value: parseFloat(e.target.value) || 0 })}
                  />
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
                  onClick={createBatchPromoCodes}
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
                Create Promo Code
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Promo Code</DialogTitle>
              <DialogDescription>Generate a new promotional code for customers</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Promo Code</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="FREETRIAL2024"
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
                  placeholder="Free trial for new customers"
                  value={newCode.description}
                  onChange={(e) => setNewCode({ ...newCode, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select
                  value={newCode.discount_type}
                  onValueChange={(value: any) => setNewCode({ ...newCode, discount_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free (100% off)</SelectItem>
                    <SelectItem value="percentage">Percentage Off</SelectItem>
                    <SelectItem value="fixed_amount">Fixed Amount Off</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newCode.discount_type === 'fixed_amount' && (
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
                      <SelectItem value="USD">$ USD</SelectItem>
                      <SelectItem value="THB">฿ THB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {newCode.discount_type !== 'free' && (
                <div className="space-y-2">
                  <Label>Discount Value {newCode.discount_type === 'fixed_amount' ? `(${newCode.currency})` : '(%)'}</Label>
                  <Input
                    type="number"
                    placeholder={newCode.discount_type === 'percentage' ? '50' : '10'}
                    value={newCode.discount_value || ''}
                    onChange={(e) => setNewCode({ ...newCode, discount_value: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Max Uses (optional)</Label>
                <Input
                  type="number"
                  placeholder="Unlimited"
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

              <Button onClick={createPromoCode} disabled={creating} className="w-full">
                {creating ? 'Creating...' : 'Create Promo Code'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Promo Codes</CardTitle>
          <CardDescription>Manage and monitor your promotional codes</CardDescription>
        </CardHeader>
        <CardContent>
          {promoCodes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No promo codes yet. Create one to get started!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promoCodes.map((promo) => (
                  <TableRow key={promo.id}>
                    <TableCell className="font-mono font-semibold">
                      <div className="flex items-center gap-2">
                        {promo.code}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(promo.code)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      {promo.description && (
                        <div className="text-xs text-muted-foreground mt-1">{promo.description}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{getDiscountDisplay(promo)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {promo.current_uses}/{promo.max_uses || '∞'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {isExpired(promo) ? (
                        <Badge variant="destructive">Expired</Badge>
                      ) : isUsedUp(promo) ? (
                        <Badge variant="secondary">Used Up</Badge>
                      ) : promo.is_active ? (
                        <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {promo.valid_until ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {new Date(promo.valid_until).toLocaleDateString()}
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
                          onClick={() => toggleActive(promo.id, promo.is_active)}
                        >
                          {promo.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deletePromoCode(promo.id)}>
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
              Successfully created {batchResults.length} promo codes
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
                    <TableHead>Discount</TableHead>
                    <TableHead>Max Uses</TableHead>
                    <TableHead>Expires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batchResults.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell className="font-mono font-semibold">{code.code}</TableCell>
                      <TableCell>{getDiscountDisplay(code)}</TableCell>
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
        </TabsContent>

        <TabsContent value="loyalty">
          <AdminMobile11MoneyCodes />
        </TabsContent>
      </Tabs>
    </div>
  );
}
