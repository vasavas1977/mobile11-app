import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSpamRules, SpamRule, SpamLogEntry } from '@/hooks/useSpamRules';
import { useEmailWhitelist } from '@/hooks/useEmailWhitelist';
import { Loader2, Plus, Trash2, Shield, AlertTriangle, Mail, Filter, ShieldCheck, UserCheck } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const SpamFilterSettings = () => {
  const { rules, spamLog, loading, saving, addRule, toggleRule, deleteRule, clearSpamLog, refetchSpamLog } = useSpamRules();
  const { whitelist, loading: whitelistLoading, saving: whitelistSaving, addToWhitelist, removeFromWhitelist } = useEmailWhitelist();
  const { toast } = useToast();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddWhitelistDialogOpen, setIsAddWhitelistDialogOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const [newRule, setNewRule] = useState({
    rule_type: 'keyword' as SpamRule['rule_type'],
    value: '',
    description: '',
    match_in: ['subject', 'body'] as string[],
    is_active: true,
  });
  
  const [newWhitelistEmail, setNewWhitelistEmail] = useState('');
  const [newWhitelistReason, setNewWhitelistReason] = useState('');

  const handleAddRule = async () => {
    if (!newRule.value.trim()) return;
    
    try {
      await addRule({
        rule_type: newRule.rule_type,
        value: newRule.value.trim(),
        description: newRule.description.trim() || null,
        match_in: newRule.match_in,
        is_active: newRule.is_active,
      });
      setIsAddDialogOpen(false);
      setNewRule({
        rule_type: 'keyword',
        value: '',
        description: '',
        match_in: ['subject', 'body'],
        is_active: true,
      });
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleAddWhitelist = async () => {
    if (!newWhitelistEmail.trim()) return;
    
    try {
      await addToWhitelist(newWhitelistEmail.trim(), newWhitelistReason.trim() || undefined);
      setIsAddWhitelistDialogOpen(false);
      setNewWhitelistEmail('');
      setNewWhitelistReason('');
    } catch (error) {
      // Error handled in hook
    }
  };

  // Extract email address from format like "Name <email@domain.com>"
  const extractEmail = (fromField: string): string => {
    const match = fromField.match(/<([^>]+)>/);
    return (match ? match[1] : fromField).toLowerCase().trim();
  };

  // Extract display name from format like "Name <email@domain.com>"
  const extractName = (fromField: string): string | null => {
    const match = fromField.match(/^([^<]+)\s*</);
    return match ? match[1].trim().replace(/"/g, '') : null;
  };

  const handleMarkAsNotSpam = async (entry: SpamLogEntry) => {
    setProcessingId(entry.id);
    try {
      const senderEmail = extractEmail(entry.from_email);
      const senderName = extractName(entry.from_email);

      // 1. Add to whitelist
      await addToWhitelist(senderEmail, `Marked as not spam from spam log`);

      // 2. Get or create contact
      let contactId: string | null = null;
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id')
        .eq('email', senderEmail)
        .maybeSingle();

      if (existingContact) {
        contactId = existingContact.id;
      } else {
        const { data: newContact, error: contactError } = await supabase
          .from('contacts')
          .insert({
            email: senderEmail,
            name: senderName,
          })
          .select('id')
          .single();

        if (contactError) throw contactError;
        contactId = newContact.id;
      }

      // 3. Create conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          contact_id: contactId,
          channel: 'email',
          subject: entry.subject || '(No Subject)',
          status: 'open',
          priority: 'medium',
        })
        .select('id')
        .single();

      if (convError) throw convError;

      // 4. Create message from spam log
      const { error: msgError } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: conversation.id,
          content: entry.message_preview || '(Email content not available)',
          sender_type: 'customer',
          sender_id: null,
        });

      if (msgError) throw msgError;

      // 5. Delete from spam log
      await supabase
        .from('spam_log')
        .delete()
        .eq('id', entry.id);

      toast({
        title: 'Email recovered',
        description: `${senderEmail} has been whitelisted and conversation created`,
      });

      // Refresh the spam log
      refetchSpamLog();
    } catch (error) {
      console.error('Error marking as not spam:', error);
      toast({
        title: 'Error',
        description: 'Failed to recover email',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getRuleTypeBadge = (type: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      keyword: { color: 'bg-blue-100 text-blue-800', label: 'Keyword' },
      domain: { color: 'bg-purple-100 text-purple-800', label: 'Domain' },
      email: { color: 'bg-green-100 text-green-800', label: 'Email' },
      regex: { color: 'bg-orange-100 text-orange-800', label: 'Regex' },
    };
    const variant = variants[type] || { color: 'bg-gray-100 text-gray-800', label: type };
    return <Badge className={variant.color}>{variant.label}</Badge>;
  };

  if (loading || whitelistLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeRules = rules.filter(r => r.is_active).length;
  const blockedToday = spamLog.filter(l => {
    const today = new Date();
    const logDate = new Date(l.created_at);
    return logDate.toDateString() === today.toDateString();
  }).length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRules}</div>
            <p className="text-xs text-muted-foreground">of {rules.length} total rules</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Whitelisted</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{whitelist.length}</div>
            <p className="text-xs text-muted-foreground">trusted senders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Today</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blockedToday}</div>
            <p className="text-xs text-muted-foreground">spam emails blocked</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Blocked</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{spamLog.length}</div>
            <p className="text-xs text-muted-foreground">in last 100 entries</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter Rules
          </TabsTrigger>
          <TabsTrigger value="whitelist" className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Whitelist
          </TabsTrigger>
          <TabsTrigger value="log" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Spam Log
            {spamLog.length > 0 && (
              <Badge variant="secondary" className="ml-1">{spamLog.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Filter Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Spam Filter Rules</CardTitle>
                <CardDescription>Manage keywords, domains, and patterns to block spam</CardDescription>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Rule
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Spam Filter Rule</DialogTitle>
                    <DialogDescription>Create a new rule to block spam emails</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Rule Type</Label>
                      <Select
                        value={newRule.rule_type}
                        onValueChange={(value) => setNewRule({ ...newRule, rule_type: value as SpamRule['rule_type'] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="keyword">Keyword (case-insensitive match)</SelectItem>
                          <SelectItem value="domain">Domain (sender domain)</SelectItem>
                          <SelectItem value="email">Email (exact sender)</SelectItem>
                          <SelectItem value="regex">Regex (advanced pattern)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Value</Label>
                      <Input
                        placeholder={
                          newRule.rule_type === 'keyword' ? 'e.g., verify your account' :
                          newRule.rule_type === 'domain' ? 'e.g., spam-domain.com' :
                          newRule.rule_type === 'email' ? 'e.g., spammer@example.com' :
                          'e.g., meta-[a-z]+\\.com$'
                        }
                        value={newRule.value}
                        onChange={(e) => setNewRule({ ...newRule, value: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description (optional)</Label>
                      <Input
                        placeholder="Brief description of this rule"
                        value={newRule.description}
                        onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Match In</Label>
                      <div className="flex flex-wrap gap-4">
                        {['subject', 'body', 'from'].map((field) => (
                          <div key={field} className="flex items-center space-x-2">
                            <Checkbox
                              id={`match-${field}`}
                              checked={newRule.match_in.includes(field)}
                              onCheckedChange={(checked) => {
                                setNewRule({
                                  ...newRule,
                                  match_in: checked
                                    ? [...newRule.match_in, field]
                                    : newRule.match_in.filter(f => f !== field)
                                });
                              }}
                            />
                            <Label htmlFor={`match-${field}`} className="capitalize">{field}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={newRule.is_active}
                        onCheckedChange={(checked) => setNewRule({ ...newRule, is_active: checked })}
                      />
                      <Label>Active</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddRule} disabled={!newRule.value.trim() || saving}>
                      {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Add Rule
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Match In</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No spam filter rules configured
                        </TableCell>
                      </TableRow>
                    ) : (
                      rules.map((rule) => (
                        <TableRow key={rule.id}>
                          <TableCell>{getRuleTypeBadge(rule.rule_type)}</TableCell>
                          <TableCell className="font-mono text-sm max-w-[200px] truncate">{rule.value}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {rule.match_in?.map((field) => (
                                <Badge key={field} variant="outline" className="text-xs capitalize">{field}</Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                            {rule.description || '-'}
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={rule.is_active}
                              onCheckedChange={(checked) => toggleRule(rule.id, checked)}
                              disabled={saving}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteRule(rule.id)}
                              disabled={saving}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Whitelist Tab */}
        <TabsContent value="whitelist" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Email Whitelist</CardTitle>
                <CardDescription>Trusted senders that bypass spam filtering</CardDescription>
              </div>
              <Dialog open={isAddWhitelistDialogOpen} onOpenChange={setIsAddWhitelistDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Email
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add to Whitelist</DialogTitle>
                    <DialogDescription>Add an email address to the whitelist to bypass spam filtering</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Email Address</Label>
                      <Input
                        type="email"
                        placeholder="e.g., trusted@example.com"
                        value={newWhitelistEmail}
                        onChange={(e) => setNewWhitelistEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Reason (optional)</Label>
                      <Input
                        placeholder="e.g., Trusted business partner"
                        value={newWhitelistReason}
                        onChange={(e) => setNewWhitelistReason(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddWhitelistDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddWhitelist} disabled={!newWhitelistEmail.trim() || whitelistSaving}>
                      {whitelistSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Add to Whitelist
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {whitelist.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          No whitelisted emails
                        </TableCell>
                      </TableRow>
                    ) : (
                      whitelist.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">{entry.email}</TableCell>
                          <TableCell className="text-muted-foreground text-sm max-w-[250px] truncate">
                            {entry.reason || '-'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                          </TableCell>
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={whitelistSaving}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove from whitelist?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Emails from {entry.email} will be subject to spam filtering again.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => removeFromWhitelist(entry.id)}>
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Spam Log Tab */}
        <TabsContent value="log" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Spam Log</CardTitle>
                <CardDescription>Recently blocked spam emails - Mark as "Not Spam" to whitelist sender</CardDescription>
              </div>
              {spamLog.length > 0 && (
                <Button variant="outline" onClick={clearSpamLog} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Clear Log
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Matched Rules</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {spamLog.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No spam blocked yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      spamLog.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {format(new Date(entry.created_at), 'MMM d, HH:mm')}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{entry.from_email}</TableCell>
                          <TableCell className="max-w-[250px] truncate">{entry.subject || '(No subject)'}</TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {entry.matched_rules?.slice(0, 2).map((rule, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">{rule}</Badge>
                              ))}
                              {(entry.matched_rules?.length || 0) > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{(entry.matched_rules?.length || 0) - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkAsNotSpam(entry)}
                              disabled={processingId === entry.id || whitelistSaving}
                            >
                              {processingId === entry.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <ShieldCheck className="h-4 w-4 mr-1" />
                                  Not Spam
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SpamFilterSettings;
