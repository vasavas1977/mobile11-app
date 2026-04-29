import { useState, useEffect } from 'react';
import { Coins, TrendingUp, Award, ArrowUpRight, ArrowDownRight, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  amount: number;
  type: string | null;
  description: string | null;
  created_at: string;
  order_id: string | null;
}

interface LoyaltyData {
  balance: number;
  tier: string;
  totalSpent: number;
}

interface AdminCustomerLoyaltyProps {
  userId: string;
  loyaltyData: LoyaltyData | null;
}

export function AdminCustomerLoyalty({ userId, loyaltyData }: AdminCustomerLoyaltyProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTransactions();
  }, [userId]);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('mobile11_money_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch loyalty transactions',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'Platinum':
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">{tier}</Badge>;
      case 'Gold':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">{tier}</Badge>;
      case 'Silver':
        return <Badge className="bg-gray-400/20 text-gray-300 border-gray-400/30">{tier}</Badge>;
      default:
        return <Badge className="bg-amber-700/20 text-amber-600 border-amber-700/30">{tier}</Badge>;
    }
  };

  const getTransactionIcon = (amount: number) => {
    if (amount > 0) {
      return <ArrowUpRight className="h-4 w-4 text-green-500" />;
    }
    return <ArrowDownRight className="h-4 w-4 text-red-500" />;
  };

  const formatAmount = (amount: number) => {
    const prefix = amount > 0 ? '+' : '';
    return `${prefix}$${Math.abs(amount).toFixed(2)}`;
  };

  // Calculate tier progress
  const getTierProgress = (totalSpent: number) => {
    if (totalSpent >= 500) {
      return { current: 'Platinum', next: null, progress: 100, needed: 0 };
    } else if (totalSpent >= 200) {
      return { current: 'Gold', next: 'Platinum', progress: ((totalSpent - 200) / 300) * 100, needed: 500 - totalSpent };
    } else if (totalSpent >= 50) {
      return { current: 'Silver', next: 'Gold', progress: ((totalSpent - 50) / 150) * 100, needed: 200 - totalSpent };
    } else {
      return { current: 'Bronze', next: 'Silver', progress: (totalSpent / 50) * 100, needed: 50 - totalSpent };
    }
  };

  const tierProgress = loyaltyData ? getTierProgress(loyaltyData.totalSpent) : null;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-24" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Mobile11 Money Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              ${loyaltyData?.balance.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Award className="h-4 w-4" />
              Loyalty Tier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {loyaltyData && getTierBadge(loyaltyData.tier)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${loyaltyData?.totalSpent.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tier Progress */}
      {tierProgress && tierProgress.next && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Progress to {tierProgress.next}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="w-full bg-muted rounded-full h-3">
              <div 
                className="bg-primary h-3 rounded-full transition-all" 
                style={{ width: `${Math.min(tierProgress.progress, 100)}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              ${tierProgress.needed.toFixed(2)} more to reach {tierProgress.next}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="py-8 text-center">
              <Coins className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No transactions yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(transaction.amount)}
                        <span className="capitalize">{transaction.type || 'Transaction'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {transaction.description || '-'}
                    </TableCell>
                    <TableCell>
                      <span className={transaction.amount > 0 ? 'text-green-500' : 'text-red-500'}>
                        {formatAmount(transaction.amount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
