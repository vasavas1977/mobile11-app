import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Check, X, MessageSquare, Sparkles, Clock, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type KBSuggestion = {
  id: string;
  user_question: string;
  ai_suggested_answer: string;
  ai_confidence: number;
  language: string;
  status: string;
  created_at: string;
  conversation_id: string | null;
};

const CATEGORIES = [
  "general",
  "esim",
  "installation",
  "payment",
  "troubleshooting",
  "account",
  "ordering",
  "packages",
  "compatibility",
  "refund",
];

const PendingKBSuggestions = () => {
  const queryClient = useQueryClient();
  const [approveDialog, setApproveDialog] = useState<KBSuggestion | null>(null);
  const [rejectDialog, setRejectDialog] = useState<KBSuggestion | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ["kb-suggestions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pending_kb_suggestions")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as KBSuggestion[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({
      suggestion,
      title,
      content,
      category,
    }: {
      suggestion: KBSuggestion;
      title: string;
      content: string;
      category: string;
    }) => {
      // Create KB article
      const { error: articleError } = await supabase.from("kb_articles").insert({
        title,
        content,
        category,
        language: suggestion.language,
        is_published: true,
        is_internal: false,
        tags: [],
      });
      if (articleError) throw articleError;

      // Update suggestion status
      const { error: suggestionError } = await supabase
        .from("pending_kb_suggestions")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", suggestion.id);
      if (suggestionError) throw suggestionError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kb-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["kb-articles"] });
      toast.success("Suggestion approved and article created");
      setApproveDialog(null);
    },
    onError: () => {
      toast.error("Failed to approve suggestion");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase
        .from("pending_kb_suggestions")
        .update({
          status: "rejected",
          rejection_reason: reason,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kb-suggestions"] });
      toast.success("Suggestion rejected");
      setRejectDialog(null);
      setRejectionReason("");
    },
    onError: () => {
      toast.error("Failed to reject suggestion");
    },
  });

  const handleRegenerate = async (suggestion: KBSuggestion) => {
    setRegeneratingId(suggestion.id);
    try {
      const { data, error } = await supabase.functions.invoke('generate-kb-answer', {
        body: {
          suggestion_id: suggestion.id,
          user_question: suggestion.user_question,
          language: suggestion.language,
        },
      });
      if (error) throw error;
      toast.success("AI answer regenerated successfully");
      queryClient.invalidateQueries({ queryKey: ["kb-suggestions"] });
    } catch (err) {
      console.error('Regeneration failed:', err);
      toast.error("Failed to regenerate answer");
    } finally {
      setRegeneratingId(null);
    }
  };

  const openApproveDialog = (suggestion: KBSuggestion) => {
    setEditedTitle(suggestion.user_question);
    setEditedContent(suggestion.ai_suggested_answer);
    setSelectedCategory("general");
    setApproveDialog(suggestion);
  };

  const handleApprove = () => {
    if (!approveDialog) return;
    approveMutation.mutate({
      suggestion: approveDialog,
      title: editedTitle,
      content: editedContent,
      category: selectedCategory,
    });
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return <Badge className="bg-green-500">High ({Math.round(confidence * 100)}%)</Badge>;
    if (confidence >= 0.6) return <Badge className="bg-yellow-500">Medium ({Math.round(confidence * 100)}%)</Badge>;
    return <Badge className="bg-red-500">Low ({Math.round(confidence * 100)}%)</Badge>;
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading suggestions...</div>;
  }

  if (!suggestions?.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No pending suggestions</h3>
          <p className="text-muted-foreground">
            AI-suggested KB articles will appear here for review
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Review and approve AI-generated knowledge base suggestions
      </p>

      {suggestions.map((suggestion) => (
        <Card key={suggestion.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">User Question</span>
                  <Badge variant="outline">
                    {suggestion.language === "th" ? "🇹🇭 TH" : suggestion.language === "ja" ? "🇯🇵 JA" : "🇺🇸 EN"}
                  </Badge>
                  {getConfidenceBadge(suggestion.ai_confidence)}
                </div>
                <p className="text-foreground">{suggestion.user_question}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {format(new Date(suggestion.created_at), "MMM d, HH:mm")}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">AI Suggested Answer</span>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-sm whitespace-pre-wrap">
                {suggestion.ai_suggested_answer}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRegenerate(suggestion)}
                disabled={regeneratingId === suggestion.id}
              >
                {regeneratingId === suggestion.id ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                {regeneratingId === suggestion.id ? 'Generating...' : 'Regenerate'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectDialog(suggestion)}
              >
                <X className="h-4 w-4 mr-1" />
                Reject
              </Button>
              <Button size="sm" onClick={() => openApproveDialog(suggestion)}>
                <Check className="h-4 w-4 mr-1" />
                Approve & Edit
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Approve Dialog */}
      <Dialog open={!!approveDialog} onOpenChange={() => setApproveDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create KB Article from Suggestion</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                placeholder="Article title..."
              />
            </div>

            <div>
              <label className="text-sm font-medium">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Content</label>
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[200px]"
                placeholder="Article content..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={approveMutation.isPending}>
              {approveMutation.isPending ? "Creating..." : "Create Article"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Suggestion</DialogTitle>
          </DialogHeader>

          <div>
            <label className="text-sm font-medium">Reason (optional)</label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Why is this suggestion being rejected?"
              className="mt-1"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                rejectDialog &&
                rejectMutation.mutate({ id: rejectDialog.id, reason: rejectionReason })
              }
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? "Rejecting..." : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PendingKBSuggestions;
