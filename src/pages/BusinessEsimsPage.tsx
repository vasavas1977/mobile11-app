import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Smartphone, 
  Loader2,
  AlertCircle,
  Search,
  ShoppingCart,
  Users,
  Package,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Header as Navbar } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { 
  useOrganizationAssignments, 
  useUnassignedOrders,
  useUpdateAssignment,
  useUnassignEsim 
} from '@/hooks/useOrganizationEsims';
import { OrganizationEsimCard } from '@/components/business/OrganizationEsimCard';
import { CreateOrganizationDialog } from '@/components/business/CreateOrganizationDialog';
import { BusinessPortalNav } from '@/components/business/BusinessPortalNav';

export default function BusinessEsimsPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { currentOrg, isOrgManager, isLoading: orgLoading, organizations } = useOrganizationContext();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: assignments = [], isLoading: assignmentsLoading } = useOrganizationAssignments(currentOrg?.id || null);
  const { data: unassignedOrders = [], isLoading: unassignedLoading } = useUnassignedOrders(currentOrg?.id || null);

  const updateAssignment = useUpdateAssignment();
  const unassignEsim = useUnassignEsim();

  // Filter assignments
  const activeAssignments = assignments.filter(a => a.status === 'assigned' || a.status === 'in_use');
  const inUseAssignments = assignments.filter(a => a.status === 'in_use');

  // Search filter
  const filterBySearch = (items: typeof assignments) => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(a => {
      const country = a.order?.esim_packages?.country_name?.toLowerCase() || '';
      const name = `${a.assignee_profile?.first_name || ''} ${a.assignee_profile?.last_name || ''}`.toLowerCase();
      return country.includes(query) || name.includes(query);
    });
  };

  const handleUnassign = (assignmentId: string) => {
    if (!currentOrg) return;
    unassignEsim.mutate({ assignmentId, orgId: currentOrg.id });
  };

  const handleMarkInUse = (assignmentId: string) => {
    if (!currentOrg) return;
    updateAssignment.mutate({ 
      assignmentId, 
      orgId: currentOrg.id, 
      updates: { status: 'in_use' } 
    });
  };

  // Stats
  const totalEsims = activeAssignments.length + unassignedOrders.length;
  const assignedCount = activeAssignments.length;
  const availableCount = unassignedOrders.length;
  const inUseCount = inUseAssignments.length;

  // Wait for auth to fully load first
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

  // Only show login prompt after auth is fully loaded
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

  // No organization check (auth and org loading already passed)
  if (!organizations.length) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white border-gray-100 shadow-sm rounded-xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-orange-100 rounded-xl w-fit">
                <Smartphone className="h-8 w-8 text-orange-600" />
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

  const isLoading = assignmentsLoading || unassignedLoading;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
      <Navbar />
      <BusinessPortalNav />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Smartphone className="h-6 w-6 text-orange-600" />
              eSIM Inventory
            </h1>
            <p className="text-gray-600">
              Manage and assign eSIMs to your team
            </p>
          </div>
          
          <Link 
            to="/business/purchase"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium h-10 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full transition-colors"
          >
            <ShoppingCart className="h-4 w-4" />
            Purchase eSIMs
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white border-gray-100 shadow-sm rounded-xl">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <Package className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalEsims}</p>
                  <p className="text-sm text-gray-500">Total eSIMs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-gray-100 shadow-sm rounded-xl">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{assignedCount}</p>
                  <p className="text-sm text-gray-500">Assigned</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-100 shadow-sm rounded-xl">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <Smartphone className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{availableCount}</p>
                  <p className="text-sm text-gray-500">Available</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-gray-100 shadow-sm rounded-xl">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{inUseCount}</p>
                  <p className="text-sm text-gray-500">In Use</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="bg-white border border-gray-100 shadow-sm rounded-xl p-1">
            <TabsTrigger 
              value="all" 
              className="gap-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg text-gray-700"
            >
              All eSIMs
              <Badge variant="secondary" className="ml-1 bg-gray-100 text-gray-700">{totalEsims}</Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="available" 
              className="gap-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg text-gray-700"
            >
              Available
              {availableCount > 0 && (
                <Badge variant="secondary" className="ml-1 bg-emerald-100 text-emerald-700">{availableCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="assigned" 
              className="gap-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg text-gray-700"
            >
              Assigned
              {assignedCount > 0 && (
                <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-700">{assignedCount}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by country or assignee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-orange-500 focus:border-orange-500 rounded-xl"
            />
          </div>

          {/* All eSIMs Tab */}
          <TabsContent value="all" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              </div>
            ) : totalEsims === 0 ? (
              <Card className="py-12 bg-white border-gray-100 shadow-sm rounded-xl">
                <CardContent className="text-center">
                  <div className="mx-auto mb-4 p-3 bg-gray-100 rounded-xl w-fit">
                    <Smartphone className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-4">No eSIMs in your organization yet</p>
                  <Link 
                    to="/business/purchase"
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium h-10 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full transition-colors"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Purchase eSIMs
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {/* Available eSIMs first */}
                {unassignedOrders.map((order) => (
                  <OrganizationEsimCard
                    key={order.id}
                    unassignedOrder={order}
                    orgId={currentOrg?.id || ''}
                    isManager={isOrgManager}
                  />
                ))}
                {/* Then assigned eSIMs */}
                {filterBySearch(activeAssignments).map((assignment) => (
                  <OrganizationEsimCard
                    key={assignment.id}
                    assignment={assignment}
                    orgId={currentOrg?.id || ''}
                    isManager={isOrgManager}
                    onUnassign={handleUnassign}
                    onMarkInUse={handleMarkInUse}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Available eSIMs Tab */}
          <TabsContent value="available" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              </div>
            ) : unassignedOrders.length === 0 ? (
              <Card className="py-12 bg-white border-gray-100 shadow-sm rounded-xl">
                <CardContent className="text-center">
                  <div className="mx-auto mb-4 p-3 bg-gray-100 rounded-xl w-fit">
                    <Smartphone className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-4">All eSIMs have been assigned</p>
                  <Link 
                    to="/business/purchase"
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium h-10 px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-full transition-colors"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Purchase More
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {unassignedOrders.map((order) => (
                  <OrganizationEsimCard
                    key={order.id}
                    unassignedOrder={order}
                    orgId={currentOrg?.id || ''}
                    isManager={isOrgManager}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Assigned eSIMs Tab */}
          <TabsContent value="assigned" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              </div>
            ) : activeAssignments.length === 0 ? (
              <Card className="py-12 bg-white border-gray-100 shadow-sm rounded-xl">
                <CardContent className="text-center">
                  <div className="mx-auto mb-4 p-3 bg-gray-100 rounded-xl w-fit">
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600">No eSIMs have been assigned yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {filterBySearch(activeAssignments).map((assignment) => (
                  <OrganizationEsimCard
                    key={assignment.id}
                    assignment={assignment}
                    orgId={currentOrg?.id || ''}
                    isManager={isOrgManager}
                    onUnassign={handleUnassign}
                    onMarkInUse={handleMarkInUse}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
