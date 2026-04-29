import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { FooterAiralo } from '@/components/landing/FooterAiralo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Smartphone, ShoppingBag, CreditCard, User, Plus, Mail } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

export function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['user-orders', user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          esim_packages:package_id (
            name,
            country_name,
            data_amount
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5">
        <Header />
        <div className="flex items-center justify-center pt-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      completed: 'default',
      failed: 'destructive'
    } as const;
    
    return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t('dashboard.welcomeBack')}{profile?.first_name ? `, ${profile.first_name}` : ''}!
            </h1>
            <p className="text-lg text-muted-foreground">
              {t('dashboard.subtitle')}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-elevation hover:shadow-glow transition-shadow cursor-pointer" onClick={() => navigate('/packages')}>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center mb-2">
                  <Plus className="h-6 w-6 text-primary-foreground" />
                </div>
                <CardTitle className="text-lg">{t('dashboard.browsePackages')}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground">{t('dashboard.browsePackagesDescription')}</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-elevation hover:shadow-glow transition-shadow cursor-pointer" onClick={() => navigate('/orders')}>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center mb-2">
                  <ShoppingBag className="h-6 w-6 text-primary-foreground" />
                </div>
                <CardTitle className="text-lg">{t('dashboard.myOrders')}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground">{t('dashboard.myOrdersDescription')}</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-elevation hover:shadow-glow transition-shadow cursor-pointer" onClick={() => navigate('/settings')}>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center mb-2">
                  <User className="h-6 w-6 text-primary-foreground" />
                </div>
                <CardTitle className="text-lg">{t('dashboard.accountSettings')}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground">{t('dashboard.accountSettingsDescription')}</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-elevation hover:shadow-glow transition-shadow cursor-pointer" onClick={() => navigate('/email-conversations')}>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center mb-2">
                  <Mail className="h-6 w-6 text-primary-foreground" />
                </div>
                <CardTitle className="text-lg">Email Support</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground">View your email conversation history</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders */}
          <Card className="border-0 shadow-elevation">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    {t('dashboard.recentOrders')}
                  </CardTitle>
                  <CardDescription>{t('dashboard.recentOrdersSubtitle')}</CardDescription>
                </div>
                <Button variant="outline" onClick={() => navigate('/orders')}>
                  {t('dashboard.viewAll')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8">
                  <Smartphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{t('dashboard.noOrdersYet')}</p>
                  <Button className="mt-4" onClick={() => navigate('/packages')}>
                    {t('dashboard.browseEsimPackages')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 flex items-center justify-center">
                          <Smartphone className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{order.esim_packages?.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {order.esim_packages?.country_name} • {order.esim_packages?.data_amount}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(order.status)}
                        <p className="text-sm font-medium mt-1">
                          {order.currency} {Number(order.total_amount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      <FooterAiralo />
    </div>
  );
}
