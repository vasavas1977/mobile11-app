import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Shield, MessageSquare, Plus, Trash2 } from 'lucide-react';

interface CannedResponse {
  id: string;
  title: string;
  content: string;
  shortcut: string | null;
  is_global: boolean;
  created_by: string | null;
}

export function AgentSettingsView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [cannedResponses, setCannedResponses] = useState<CannedResponse[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newShortcut, setNewShortcut] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchCannedResponses();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user!.id)
      .single();
    setProfile(data);
  };

  const fetchCannedResponses = async () => {
    const { data } = await supabase
      .from('canned_responses')
      .select('*')
      .or(`is_global.eq.true,created_by.eq.${user!.id}`)
      .order('title');
    setCannedResponses(data || []);
  };

  const handleAddCanned = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('canned_responses').insert({
        title: newTitle.trim(),
        content: newContent.trim(),
        shortcut: newShortcut.trim() || null,
        is_global: false,
        created_by: user!.id,
      });
      if (error) throw error;
      setNewTitle('');
      setNewContent('');
      setNewShortcut('');
      fetchCannedResponses();
      toast({ title: 'Canned response added' });
    } catch {
      toast({ title: 'Error', description: 'Failed to add response', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCanned = async (id: string) => {
    const { error } = await supabase.from('canned_responses').delete().eq('id', id).eq('created_by', user!.id);
    if (!error) {
      fetchCannedResponses();
      toast({ title: 'Deleted' });
    }
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full max-w-3xl">
      <h1 className="text-2xl font-bold text-[#1A1A1A]">Settings</h1>

      {/* Profile */}
      <Card className="bg-white border-[#E5E7EB]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#1A1A1A]">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-[#6B7280]" />
            <span className="text-sm text-[#1A1A1A]">{user?.email}</span>
          </div>
          {profile && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-[#6B7280]" />
              <span className="text-sm text-[#1A1A1A]">
                {profile.first_name} {profile.last_name}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#6B7280]" />
            <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">Agent</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Canned Responses */}
      <Card className="bg-white border-[#E5E7EB]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#1A1A1A]">
            <MessageSquare className="h-5 w-5" />
            My Canned Responses
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new */}
          <div className="space-y-2 p-3 rounded-lg border border-dashed border-[#E5E7EB]">
            <Input
              placeholder="Title"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="bg-white border-[#E5E7EB] text-[#1A1A1A]"
            />
            <Textarea
              placeholder="Response content..."
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              className="bg-white border-[#E5E7EB] text-[#1A1A1A] min-h-[60px]"
            />
            <div className="flex gap-2">
              <Input
                placeholder="Shortcut (optional)"
                value={newShortcut}
                onChange={e => setNewShortcut(e.target.value)}
                className="bg-white border-[#E5E7EB] text-[#1A1A1A] w-40"
              />
              <Button
                onClick={handleAddCanned}
                disabled={saving || !newTitle.trim() || !newContent.trim()}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>

          {/* List */}
          <div className="space-y-2">
            {cannedResponses.map(cr => (
              <div key={cr.id} className="flex items-start justify-between p-3 rounded-lg border border-[#E5E7EB]">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-[#1A1A1A]">{cr.title}</p>
                    {cr.is_global && <Badge variant="outline" className="text-[10px]">Global</Badge>}
                    {cr.shortcut && <Badge variant="outline" className="text-[10px]">/{cr.shortcut}</Badge>}
                  </div>
                  <p className="text-xs text-[#6B7280] mt-1 line-clamp-2">{cr.content}</p>
                </div>
                {cr.created_by === user?.id && (
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteCanned(cr.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {cannedResponses.length === 0 && (
              <p className="text-sm text-[#6B7280] text-center py-4">No canned responses yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
