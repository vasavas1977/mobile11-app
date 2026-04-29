import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, User, CreditCard, ShoppingBag, Coins, Mail, Phone, Calendar, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { AdminCustomerProfile } from './AdminCustomerProfile';
import { AdminCustomerEsims } from './AdminCustomerEsims';
import { AdminCustomerOrders } from './AdminCustomerOrders';
import { AdminCustomerLoyalty } from './AdminCustomerLoyalty';

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

interface LoyaltyData {
  balance: number;
  tier: string;
  totalSpent: number;
}

export function AdminCustomerDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
  const [orderCount, setOrderCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchCustomerData();
    }
  }, [userId]);

  const fetchCustomerData = async () => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch order count
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      setOrderCount(count || 0);

      // Fetch loyalty data (Mobile11 Money balance)
      const { data: transactionsData } = await supabase
        .from('mobile11_money_transactions')
        .select('amount')
        .eq('user_id', userId);

      const balance = transactionsData?.reduce((sum, t) => sum + t.amount, 0) || 0;

      // Calculate total spent from orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('user_id', userId)
        .eq('status', 'completed');

      const totalSpent = ordersData?.reduce((sum, o) => sum + o.total_amount, 0) || 0;

      // Determine tier based on spending
      let tier = 'Bronze';
      if (totalSpent >= 500) tier = 'Platinum';
      else if (totalSpent >= 200) tier = 'Gold';
      else if (totalSpent >= 50) tier = 'Silver';

      setLoyaltyData({ balance, tier, totalSpent });
    } catch (error) {
      console.error('Error fetching customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-1/3 animate-pulse"></div>
        <div className="h-64 bg-muted rounded animate-pulse"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/admin/users')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Customer not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const initials = `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || profile.email[0]}`.toUpperCase();

  return (
    <div className="space-y-6">
      {/* Back Button + View as Customer */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/admin/users')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Button>
        <Button 
          variant="outline" 
          onClick={() => navigate(`/admin/users/${userId}/preview/esims`)} 
          className="gap-2"
        >
          <Eye className="h-4 w-4" />
          View as Customer
        </Button>
      </div>

      {/* Customer Header */}
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold">
                  {profile.first_name || profile.last_name 
                    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
                    : 'Unnamed Customer'}
                </h1>
                {loyaltyData && (
                  <Badge 
                    className={
                      loyaltyData.tier === 'Platinum' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                      loyaltyData.tier === 'Gold' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                      loyaltyData.tier === 'Silver' ? 'bg-gray-400/20 text-gray-300 border-gray-400/30' :
                      'bg-amber-700/20 text-amber-600 border-amber-700/30'
                    }
                  >
                    {loyaltyData.tier}
                  </Badge>
                )}
              </div>
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {profile.email}
                </span>
                {profile.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {profile.phone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {new Date(profile.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-6 text-center">
              <div>
                <div className="text-2xl font-bold">{orderCount}</div>
                <div className="text-xs text-muted-foreground">Orders</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-500">
                  ${loyaltyData?.balance.toFixed(2) || '0.00'}
                </div>
                <div className="text-xs text-muted-foreground">Balance</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  ${loyaltyData?.totalSpent.toFixed(2) || '0.00'}
                </div>
                <div className="text-xs text-muted-foreground">Total Spent</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="esims" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">eSIMs</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Orders</span>
          </TabsTrigger>
          <TabsTrigger value="loyalty" className="gap-2">
            <Coins className="h-4 w-4" />
            <span className="hidden sm:inline">Loyalty</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <AdminCustomerProfile profile={profile} />
        </TabsContent>

        <TabsContent value="esims">
          <AdminCustomerEsims userId={userId!} />
        </TabsContent>

        <TabsContent value="orders">
          <AdminCustomerOrders userId={userId!} />
        </TabsContent>

        <TabsContent value="loyalty">
          <AdminCustomerLoyalty userId={userId!} loyaltyData={loyaltyData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
