import { useState } from 'react';
import { 
  History, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  RefreshCw,
  Loader2,
  AlertCircle,
  Building2,
  CreditCard,
  Search
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header as Navbar } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BusinessPortalNav } from '@/components/business/BusinessPortalNav';
import { useAuth } from '@/hooks/useAuth';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { useOrganizationCreditTransactions, useOrganizationCredit } from '@/hooks/useOrganizationCredit';
import { CreateOrganizationDialog } from '@/components/business/CreateOrganizationDialog';
import { BusinessTopUpDialog } from '@/components/business/BusinessTopUpDialog';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { useEffect } from 'react';
import { toast } from 'sonner';

export default function BusinessTransactionsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { currentOrg, isLoading: orgLoading, organizations, isOrgAdmin } = useOrganizationContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const { data: transactions = [], isLoading: txLoading, refetch: refetchTransactions } = useOrganizationCreditTransactions(currentOrg?.id || null);
  const { data: credit, refetch: refetchCredit } = useOrganizationCredit(currentOrg?.id || null);

  // Handle top-up success/cancel from URL params
  useEffect(() => {
    const topupStatus = searchParams.get('topup');
    const amount = searchParams.get('amount');
    
    if (topupStatus === 'success') {
      toast.success(`Successfully topped up ฿${amount ? parseInt(amount).toLocaleString() : ''} credit!`);
      // Refetch data to show updated balance
      refetchCredit();
      refetchTransactions();
      // Clear URL params
      setSearchParams({});
    } else if (topupStatus === 'cancelled') {
      toast.info('Top-up was cancelled');
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, refetchCredit, refetchTransactions]);

  const filteredTransactions = transactions.filter(tx => {
    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      return tx.description?.toLowerCase().includes(search) || 
             tx.type.toLowerCase().includes(search);
    }
    return true;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'topup':
        return <ArrowUpCircle className="h-5 w-5 text-emerald-600" />;
      case 'purchase':
        return <ArrowDownCircle className="h-5 w-5 text-red-600" />;
      case 'refund':
        return <RefreshCw className="h-5 w-5 text-blue-600" />;
      default:
        return <History className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'topup':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Top Up</Badge>;
      case 'purchase':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Purchase</Badge>;
      case 'refund':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Refund</Badge>;
      case 'adjustment':
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Adjustment</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  // Loading state
  if (authLoading || orgLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
        <Footer />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md mx-4 bg-white border-gray-100 shadow-sm rounded-xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-gray-100 rounded-xl w-fit">
                <AlertCircle className="h-8 w-8 text-gray-500" />
              </div>
              <CardTitle className="text-gray-900">Sign in required</CardTitle>
              <CardDescription className="text-gray-600">
                Please sign in to access the business portal.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full" 
                onClick={() => navigate('/business/login')}
              >
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // No organization
  if (!organizations.length) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white border-gray-100 shadow-sm rounded-xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-orange-100 rounded-xl w-fit">
                <Building2 className="h-8 w-8 text-orange-600" />
              </div>
              <CardTitle className="text-gray-900">No Organization</CardTitle>
              <CardDescription className="text-gray-600">
                Create an organization to start managing your team's eSIMs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateOrganizationDialog
                trigger={
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full">
                    Create Organization
                  </Button>
                }
              />
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const balance = credit?.credit_balance || 0;

  // Calculate totals
  const totalTopUps = transactions
    .filter(tx => tx.type === 'topup')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalPurchases = transactions
    .filter(tx => tx.type === 'purchase')
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
      <Navbar />
      <BusinessPortalNav />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <History className="h-6 w-6 text-orange-600" />
              Credit Transactions
            </h1>
            <p className="text-gray-600">
              View your organization's credit history
            </p>
          </div>
          {isOrgAdmin && <BusinessTopUpDialog />}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-white border-gray-100 shadow-sm rounded-xl">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <CreditCard className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">฿{balance.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Current Balance</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-gray-100 shadow-sm rounded-xl">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <ArrowUpCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">฿{totalTopUps.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Total Top-ups</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-gray-100 shadow-sm rounded-xl">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-xl">
                  <ArrowDownCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">฿{totalPurchases.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Total Purchases</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-orange-500 focus:border-orange-500 rounded-xl"
            />
          </div>

          <Tabs value={filterType} onValueChange={setFilterType} className="w-auto">
            <TabsList className="bg-white border border-gray-100 shadow-sm rounded-xl p-1">
              <TabsTrigger 
                value="all" 
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg text-gray-700"
              >
                All
              </TabsTrigger>
              <TabsTrigger 
                value="topup" 
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg text-gray-700"
              >
                Top-ups
              </TabsTrigger>
              <TabsTrigger 
                value="purchase" 
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg text-gray-700"
              >
                Purchases
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Transactions List */}
        <Card className="bg-white border-gray-100 shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg">Transaction History</CardTitle>
            <CardDescription>
              {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {txLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto mb-4 p-3 bg-gray-100 rounded-xl w-fit">
                  <History className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-600">
                  {searchQuery || filterType !== 'all' 
                    ? 'No transactions match your filters' 
                    : 'No transactions yet'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Contact Mobile11 to add credit to your account
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((tx) => (
                  <div 
                    key={tx.id} 
                    className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl"
                  >
                    <div className="mt-1">
                      {getTypeIcon(tx.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        {getTypeBadge(tx.type)}
                        <span className={`text-lg font-semibold ${tx.amount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {tx.amount > 0 ? '+' : ''}฿{Math.abs(tx.amount).toLocaleString()}
                        </span>
                      </div>
                      {tx.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {tx.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span>{format(new Date(tx.created_at), 'MMM d, yyyy h:mm a')}</span>
                        <span>Balance after: ฿{tx.balance_after.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
