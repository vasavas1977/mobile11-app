import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type KBArticle = {
  id: string;
  title: string;
  content: string;
  category: string;
  language: string;
  tags: string[];
  is_published: boolean;
  is_internal: boolean;
  slug?: string | null;
  description?: string | null;
  display_order?: number | null;
  source?: string | null;
};

type FormData = {
  title: string;
  content: string;
  category: string;
  language: string;
  tags: string;
  is_published: boolean;
  is_internal: boolean;
  description: string;
  display_order: number;
  source: string;
};

const CATEGORIES = [
  { value: "about-mobile11", label: "About Mobile11" },
  { value: "getting-started", label: "Getting Started" },
  { value: "using-esim", label: "Using & Managing eSIMs" },
  { value: "account", label: "My Account & Money" },
  { value: "troubleshoot", label: "Troubleshooting" },
  { value: "affiliate", label: "Affiliates & Partnerships" },
  { value: "bot-core-knowledge", label: "🤖 Bot Core Knowledge" },
];

const SOURCE_OPTIONS = [
  { value: "both", label: "🔄 Both (Website + Chatbot)" },
  { value: "website", label: "🌐 Website Only" },
  { value: "chatbot", label: "💬 Chatbot Only" },
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article: KBArticle | null;
};

const KBArticleDialog = ({ open, onOpenChange, article }: Props) => {
  const queryClient = useQueryClient();
  const isEditing = !!article;

  const form = useForm<FormData>({
    defaultValues: {
      title: "",
      content: "",
      category: "about-mobile11",
      language: "en",
      tags: "",
      is_published: true,
      is_internal: false,
      description: "",
      display_order: 0,
      source: "both",
    },
  });

  useEffect(() => {
    if (article) {
      form.reset({
        title: article.title,
        content: article.content,
        category: article.category,
        language: article.language,
        tags: article.tags?.join(", ") || "",
        is_published: article.is_published,
        is_internal: article.is_internal,
        description: article.description || "",
        display_order: article.display_order || 0,
        source: article.source || "both",
      });
    } else {
      form.reset({
        title: "",
        content: "",
        category: "about-mobile11",
        language: "en",
        tags: "",
        is_published: true,
        is_internal: false,
        description: "",
        display_order: 0,
        source: "both",
      });
    }
  }, [article, form]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const tagsArray = data.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        title: data.title,
        content: data.content,
        category: data.category,
        language: data.language,
        tags: tagsArray,
        is_published: data.is_published,
        is_internal: data.is_internal,
        description: data.description || null,
        display_order: data.display_order || null,
        source: data.source,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("kb_articles")
          .update(payload)
          .eq("id", article.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("kb_articles").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kb-articles"] });
      toast.success(isEditing ? "Article updated" : "Article created");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Failed to ${isEditing ? "update" : "create"} article`);
      console.error(error);
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white text-[#1A1A1A] border-[#E5E7EB] [&_label]:text-[#374151] [&_input]:bg-white [&_input]:border-[#E5E7EB] [&_input]:text-[#1A1A1A] [&_textarea]:bg-white [&_textarea]:border-[#E5E7EB] [&_textarea]:text-[#1A1A1A] [&_button[role=combobox]]:bg-white [&_button[role=combobox]]:border-[#E5E7EB] [&_button[role=combobox]]:text-[#1A1A1A]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Article" : "Create Article"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              rules={{ required: "Title is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Article title..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (preview text)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Short summary for previews..."
                      className="min-h-[60px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEditing && article?.slug && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-[#6B7280]">Slug (auto-generated)</label>
                <Input value={article.slug} readOnly className="bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source / Visibility</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SOURCE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="en">🇺🇸 English</SelectItem>
                        <SelectItem value="th">🇹🇭 Thai</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="display_order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="content"
              rules={{ required: "Content is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Article content..."
                      className="min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (comma-separated)</FormLabel>
                  <FormControl>
                    <Input placeholder="esim, japan, installation..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-6">
              <FormField
                control={form.control}
                name="is_published"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">Published</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_internal"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">Internal Only</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : isEditing ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default KBArticleDialog;
