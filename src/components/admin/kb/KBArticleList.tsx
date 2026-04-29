import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Globe, Lock, Bot } from "lucide-react";
import { toast } from "sonner";
import KBArticleDialog from "./KBArticleDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type KBArticle = {
  id: string;
  title: string;
  content: string;
  category: string;
  language: string;
  tags: string[];
  is_published: boolean;
  is_internal: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  slug: string | null;
  description: string | null;
  display_order: number | null;
  source: string | null;
};

const CATEGORY_OPTIONS = [
  { value: "all", label: "All Categories" },
  { value: "about-mobile11", label: "About Mobile11" },
  { value: "getting-started", label: "Getting Started" },
  { value: "using-esim", label: "Using eSIMs" },
  { value: "account", label: "Account & Money" },
  { value: "troubleshoot", label: "Troubleshooting" },
  { value: "affiliate", label: "Affiliates" },
  { value: "bot-core-knowledge", label: "🤖 Bot Core" },
];

const getSourceBadge = (source: string | null) => {
  switch (source) {
    case "website":
      return <Badge variant="outline" className="text-xs">🌐 Website</Badge>;
    case "chatbot":
      return <Badge variant="outline" className="text-xs">💬 Chatbot</Badge>;
    case "both":
    default:
      return <Badge variant="outline" className="text-xs">🔄 Both</Badge>;
  }
};

const KBArticleList = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<KBArticle | null>(null);
  const [deleteArticle, setDeleteArticle] = useState<KBArticle | null>(null);

  const { data: articles, isLoading } = useQuery({
    queryKey: ["kb-articles", search, categoryFilter, languageFilter],
    queryFn: async () => {
      let query = supabase
        .from("kb_articles")
        .select("*")
        .order("updated_at", { ascending: false });

      if (search) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
      }
      if (categoryFilter !== "all") {
        query = query.eq("category", categoryFilter);
      }
      if (languageFilter !== "all") {
        query = query.eq("language", languageFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as KBArticle[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("kb_articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kb-articles"] });
      toast.success("Article deleted");
      setDeleteArticle(null);
    },
    onError: () => {
      toast.error("Failed to delete article");
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase
        .from("kb_articles")
        .update({ is_published })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kb-articles"] });
      toast.success("Article updated");
    },
  });

  const handleEdit = (article: KBArticle) => {
    setEditingArticle(article);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingArticle(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4 text-[#1A1A1A]">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={languageFilter} onValueChange={setLanguageFilter}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="th">Thai</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Article
        </Button>
      </div>

      <div className="border border-[#E5E7EB] rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Views</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : articles?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No articles found
                </TableCell>
              </TableRow>
            ) : (
              articles?.map((article) => (
                <TableRow key={article.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {article.category === "bot-core-knowledge" ? (
                        <Bot className="h-4 w-4 text-primary" />
                      ) : article.is_internal ? (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Globe className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium truncate max-w-[250px] text-[#1A1A1A]">
                        {article.title}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={article.category === "bot-core-knowledge" ? "default" : "secondary"}
                    >
                      {article.category === "bot-core-knowledge" ? "🤖 Bot Core" : article.category}
                    </Badge>
                  </TableCell>
                  <TableCell>{getSourceBadge(article.source)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {article.language === "th" ? "🇹🇭 TH" : article.language === "ja" ? "🇯🇵 JA" : "🇺🇸 EN"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={article.is_published ? "default" : "secondary"}>
                      {article.is_published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell>{article.view_count}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          togglePublishMutation.mutate({
                            id: article.id,
                            is_published: !article.is_published,
                          })
                        }
                        title={article.is_published ? "Unpublish" : "Publish"}
                      >
                        {article.is_published ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(article)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteArticle(article)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <KBArticleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        article={editingArticle}
      />

      <AlertDialog open={!!deleteArticle} onOpenChange={() => setDeleteArticle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Article</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteArticle?.title}"? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteArticle && deleteMutation.mutate(deleteArticle.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default KBArticleList;
