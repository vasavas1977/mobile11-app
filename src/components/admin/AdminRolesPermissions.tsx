import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  ShieldCheck, Users, Eye, Plus, Pencil, Trash2,
  Crown, Briefcase, Headphones, Wallet, Globe, Store, Truck, Code, BarChart3,
} from "lucide-react";
import { toast } from "sonner";

const ROLE_META: Record<string, { label: string; icon: any; color: string; description: string }> = {
  super_admin: { label: "HQ Super Admin", icon: Crown, color: "text-orange-600 bg-orange-50 border-orange-200", description: "Full platform access, all operations" },
  admin: { label: "Admin", icon: ShieldCheck, color: "text-blue-600 bg-blue-50 border-blue-200", description: "Full access (legacy role)" },
  commerce_admin: { label: "Commerce Admin", icon: Briefcase, color: "text-emerald-600 bg-emerald-50 border-emerald-200", description: "Orders, refunds, packages" },
  support_admin: { label: "Support Admin", icon: Headphones, color: "text-purple-600 bg-purple-50 border-purple-200", description: "Contact center, KB management" },
  finance_admin: { label: "Finance Admin", icon: Wallet, color: "text-amber-600 bg-amber-50 border-amber-200", description: "Refunds, wallets, settlements" },
  partner_manager: { label: "Partner Manager", icon: Users, color: "text-cyan-600 bg-cyan-50 border-cyan-200", description: "Partner operations & wallets" },
  territory_manager: { label: "Territory Manager", icon: Globe, color: "text-teal-600 bg-teal-50 border-teal-200", description: "Regional partner oversight" },
  reseller_admin: { label: "Reseller Admin", icon: Store, color: "text-pink-600 bg-pink-50 border-pink-200", description: "Reseller-scoped operations" },
  distributor_admin: { label: "Distributor Admin", icon: Truck, color: "text-indigo-600 bg-indigo-50 border-indigo-200", description: "Distributor-scoped operations" },
  api_partner_admin: { label: "API Partner Admin", icon: Code, color: "text-slate-600 bg-slate-50 border-slate-200", description: "API credentials & analytics" },
  read_only_analyst: { label: "Read-Only Analyst", icon: BarChart3, color: "text-gray-600 bg-gray-50 border-gray-200", description: "View-only dashboard & analytics" },
  supervisor: { label: "Supervisor", icon: Users, color: "text-violet-600 bg-violet-50 border-violet-200", description: "Contact center supervision" },
  agent: { label: "Agent", icon: Headphones, color: "text-rose-600 bg-rose-50 border-rose-200", description: "Contact center agent" },
};

const PERMISSION_AREAS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "orders", label: "Order Management" },
  { key: "refunds", label: "Refunds" },
  { key: "packages", label: "Package Management" },
  { key: "partners", label: "Partner Management" },
  { key: "wallets", label: "Wallet Adjustments" },
  { key: "settlements", label: "Settlements" },
  { key: "api_credentials", label: "API Credentials" },
  { key: "contact_center", label: "Contact Center" },
  { key: "kb_editing", label: "KB Editing" },
  { key: "analytics", label: "Analytics" },
  { key: "settings", label: "Settings" },
  { key: "developer_tools", label: "Developer Tools" },
];

const ADMIN_ROLES = Object.keys(ROLE_META).filter(r => r !== "customer" && r !== "affiliate");

type Permission = {
  id: string;
  role: string;
  permission_area: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
};

type UserRole = {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
};

export function AdminRolesPermissions() {
  const [activeTab, setActiveTab] = useState("roles");
  const [selectedRole, setSelectedRole] = useState<string>("super_admin");
  const [assignDialog, setAssignDialog] = useState(false);
  const [assignEmail, setAssignEmail] = useState("");
  const [assignRole, setAssignRole] = useState<string>("read_only_analyst");
  const queryClient = useQueryClient();

  // Fetch permissions matrix
  const { data: permissions, isLoading: permLoading } = useQuery({
    queryKey: ["admin-permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_permissions")
        .select("*")
        .order("role")
        .order("permission_area");
      if (error) throw error;
      return data as Permission[];
    },
  });

  // Fetch user roles
  const { data: userRoles, isLoading: rolesLoading } = useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .in("role", ADMIN_ROLES as any)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as UserRole[];
    },
  });

  // Fetch profiles for user display
  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles", userRoles],
    enabled: !!userRoles?.length,
    queryFn: async () => {
      const userIds = [...new Set(userRoles?.map(r => r.user_id) || [])];
      if (!userIds.length) return [];
      const { data } = await supabase
        .from("profiles")
        .select("user_id, email, first_name, last_name")
        .in("user_id", userIds);
      return data || [];
    },
  });

  // Toggle permission
  const togglePerm = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: boolean }) => {
      const { error } = await supabase
        .from("admin_permissions")
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-permissions"] }),
  });

  // Remove role
  const removeRole = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      toast.success("Role removed");
    },
  });

  // Assign role
  const assignRoleMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      // Find user by email
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", email)
        .single();
      if (!profile) throw new Error("User not found with that email");

      const { error } = await supabase.from("user_roles").insert({
        user_id: profile.user_id,
        role: role as any,
      });
      if (error) {
        if (error.code === "23505") throw new Error("User already has this role");
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      toast.success("Role assigned");
      setAssignDialog(false);
      setAssignEmail("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const rolePerms = permissions?.filter(p => p.role === selectedRole) || [];
  const getProfile = (userId: string) => profiles?.find(p => p.user_id === userId);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md">
          <ShieldCheck className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-foreground">Roles & Permissions</h2>
          <p className="text-xs text-muted-foreground">Manage admin roles, permission areas, and user assignments</p>
        </div>
        <Button size="sm" onClick={() => setAssignDialog(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
          <Plus className="h-4 w-4 mr-1" /> Assign Role
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="roles" className="gap-1.5 text-xs">
            <ShieldCheck className="h-3.5 w-3.5" /> Role Overview
          </TabsTrigger>
          <TabsTrigger value="matrix" className="gap-1.5 text-xs">
            <Eye className="h-3.5 w-3.5" /> Permission Matrix
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5 text-xs">
            <Users className="h-3.5 w-3.5" /> User Assignments
          </TabsTrigger>
        </TabsList>

        {/* Tab: Role Overview */}
        <TabsContent value="roles" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ADMIN_ROLES.map(role => {
              const meta = ROLE_META[role];
              if (!meta) return null;
              const count = userRoles?.filter(r => r.role === role).length || 0;
              const permCount = permissions?.filter(p => p.role === role && p.can_view).length || 0;
              return (
                <Card key={role} className={`border cursor-pointer transition-all hover:shadow-md ${selectedRole === role ? 'ring-2 ring-orange-400' : 'border-border/60'}`}
                  onClick={() => { setSelectedRole(role); setActiveTab("matrix"); }}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg border ${meta.color}`}>
                        <meta.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground">{meta.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="text-[10px]">{count} users</Badge>
                          <Badge variant="outline" className="text-[10px]">{permCount} areas</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab: Permission Matrix */}
        <TabsContent value="matrix" className="mt-4">
          <div className="flex items-center gap-3 mb-4">
            <p className="text-sm font-medium text-muted-foreground">Editing:</p>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ADMIN_ROLES.map(r => (
                  <SelectItem key={r} value={r}>{ROLE_META[r]?.label || r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card className="border-border/60">
            <CardContent className="p-0">
              {permLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Permission Area</TableHead>
                      <TableHead className="text-center w-20">View</TableHead>
                      <TableHead className="text-center w-20">Create</TableHead>
                      <TableHead className="text-center w-20">Edit</TableHead>
                      <TableHead className="text-center w-20">Delete</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {PERMISSION_AREAS.map(area => {
                      const perm = rolePerms.find(p => p.permission_area === area.key);
                      if (!perm) return (
                        <TableRow key={area.key}>
                          <TableCell className="font-medium text-sm">{area.label}</TableCell>
                          <TableCell colSpan={4} className="text-center text-xs text-muted-foreground">No access configured</TableCell>
                        </TableRow>
                      );
                      return (
                        <TableRow key={area.key}>
                          <TableCell className="font-medium text-sm">{area.label}</TableCell>
                          {(["can_view", "can_create", "can_edit", "can_delete"] as const).map(field => (
                            <TableCell key={field} className="text-center">
                              <Switch
                                checked={perm[field]}
                                onCheckedChange={(val) => togglePerm.mutate({ id: perm.id, field, value: val })}
                                className="data-[state=checked]:bg-orange-500"
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: User Assignments */}
        <TabsContent value="users" className="mt-4">
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Assigned Users ({userRoles?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {rolesLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : !userRoles?.length ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No role assignments found.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Assigned</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userRoles.map(ur => {
                      const profile = getProfile(ur.user_id);
                      const meta = ROLE_META[ur.role];
                      return (
                        <TableRow key={ur.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">
                                {profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email : ur.user_id.slice(0, 8)}
                              </p>
                              <p className="text-xs text-muted-foreground">{profile?.email || ""}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {meta ? (
                              <Badge className={`${meta.color} border text-xs`}>
                                {meta.label}
                              </Badge>
                            ) : (
                              <Badge variant="outline">{ur.role}</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(ur.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700"
                              onClick={() => { if (confirm("Remove this role?")) removeRole.mutate(ur.id); }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assign Role Dialog */}
      <Dialog open={assignDialog} onOpenChange={setAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role to User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">User Email</label>
              <Input
                value={assignEmail}
                onChange={e => setAssignEmail(e.target.value)}
                placeholder="user@example.com"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Role</label>
              <Select value={assignRole} onValueChange={setAssignRole}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ADMIN_ROLES.map(r => (
                    <SelectItem key={r} value={r}>{ROLE_META[r]?.label || r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog(false)}>Cancel</Button>
            <Button
              onClick={() => assignRoleMutation.mutate({ email: assignEmail, role: assignRole })}
              disabled={!assignEmail || assignRoleMutation.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {assignRoleMutation.isPending ? "Assigning..." : "Assign Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
