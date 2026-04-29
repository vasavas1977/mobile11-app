import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Search, BookOpen, Copy, Check, Edit, Trash2, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import KBArticleDialog from '@/components/admin/kb/KBArticleDialog';
import { AgentFAQAnalytics } from './AgentFAQAnalytics';

export function AgentKnowledgeBaseView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editArticle, setEditArticle] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteArticleId, setDeleteArticleId] = useState<string | null>(null);

  const { data: articles, isLoading } = useQuery({
    queryKey: ['agent-kb-articles'],
    queryFn: async () => {
      const { data } = await supabase
        .from('kb_articles')
        .select('id, title, content, category, description, tags, is_internal, slug, source, display_order, language, is_published')
        .eq('is_published', true)
        .order('category')
        .order('display_order', { ascending: true });
      return data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('kb_articles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-kb-articles'] });
      queryClient.invalidateQueries({ queryKey: ['kb-articles'] });
      toast({ title: 'Article deleted' });
      setDeleteArticleId(null);
    },
    onError: () => {
      toast({ title: 'Failed to delete article', variant: 'destructive' });
    },
  });

  const categories = [...new Set(articles?.map(a => a.category) || [])];

  const filtered = articles?.filter(a => {
    if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q) || a.description?.toLowerCase().includes(q);
  }) || [];

  const handleCopy = async (article: any) => {
    await navigator.clipboard.writeText(article.content);
    setCopiedId(article.id);
    toast({ title: 'Copied to clipboard' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleEdit = (article: any) => {
    setEditArticle(article);
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = (open: boolean) => {
    setEditDialogOpen(open);
    if (!open) {
      setEditArticle(null);
      queryClient.invalidateQueries({ queryKey: ['agent-kb-articles'] });
    }
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <h1 className="text-2xl font-bold text-[#1A1A1A]">Knowledge Base</h1>

      <Tabs defaultValue="articles" className="w-full">
        <TabsList className="bg-[#F3F4F6] border border-[#E5E7EB]">
          <TabsTrigger value="articles" className="data-[state=active]:bg-white data-[state=active]:text-[#1A1A1A] text-[#6B7280]">
            <BookOpen className="h-4 w-4 mr-1.5" />
            Articles
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:text-[#1A1A1A] text-[#6B7280]">
            <BarChart3 className="h-4 w-4 mr-1.5" />
            FAQ Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="space-y-4 mt-4">
          {/* Search & Filter */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
              <Input
                placeholder="Search articles..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-white border-[#E5E7EB] text-[#1A1A1A]"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px] bg-white border-[#E5E7EB] text-[#1A1A1A]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#E5E7EB]">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Articles */}
          {isLoading ? (
            <div className="py-8 text-center text-[#6B7280]">Loading articles...</div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-[#6B7280]">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No articles found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(article => (
                <Card key={article.id} className="bg-white border-[#E5E7EB]">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setExpandedId(expandedId === article.id ? null : article.id)}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-[#1A1A1A]">{article.title}</h3>
                          <Badge variant="outline" className="text-[10px] border-[#E5E7EB] text-[#374151]">
                            {article.category}
                          </Badge>
                          {article.is_internal && (
                            <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-600">Internal</Badge>
                          )}
                          {article.source && article.source !== 'both' && (
                            <Badge variant="outline" className="text-[10px] border-blue-200 text-blue-600">
                              {article.source === 'website' ? '🌐' : '💬'} {article.source}
                            </Badge>
                          )}
                        </div>
                        {article.description && (
                          <p className="text-sm text-[#6B7280] mt-1">{article.description}</p>
                        )}
                        {article.tags && article.tags.length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {article.tags.slice(0, 5).map((tag: string) => (
                              <Badge key={tag} variant="outline" className="text-[10px] text-[#9CA3AF]">{tag}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(article)}
                          className="border-[#E5E7EB] text-[#374151] hover:bg-[#F3F4F6] h-8 w-8 p-0"
                        >
                          {copiedId === article.id ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(article)}
                          className="border-[#E5E7EB] text-[#374151] hover:bg-[#F3F4F6] h-8 w-8 p-0"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteArticleId(article.id)}
                          className="border-red-200 text-red-500 hover:bg-red-50 h-8 w-8 p-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {expandedId === article.id && (
                      <div className="mt-3 pt-3 border-t border-[#E5E7EB]">
                        <pre className="text-sm text-[#374151] whitespace-pre-wrap font-sans max-h-[400px] overflow-y-auto">
                          {article.content}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <AgentFAQAnalytics />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <KBArticleDialog
        open={editDialogOpen}
        onOpenChange={handleEditDialogClose}
        article={editArticle}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteArticleId} onOpenChange={(open) => !open && setDeleteArticleId(null)}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1A1A1A]">Delete Article</AlertDialogTitle>
            <AlertDialogDescription className="text-[#6B7280]">
              This will permanently delete this KB article. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#E5E7EB] text-[#374151]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteArticleId && deleteMutation.mutate(deleteArticleId)}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
