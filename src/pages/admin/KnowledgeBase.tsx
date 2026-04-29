import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Book, Lightbulb, Info } from "lucide-react";
import KBArticleList from "@/components/admin/kb/KBArticleList";
import PendingKBSuggestions from "@/components/admin/kb/PendingKBSuggestions";
import { Alert, AlertDescription } from "@/components/ui/alert";

const KnowledgeBase = () => {
  const [activeTab, setActiveTab] = useState("articles");

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground">
            Manage KB articles and review AI-suggested content
          </p>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Articles are the <strong>single source of truth</strong> for the Help Center website, AI chatbot, and voice bot.{" "}
          <strong>🤖 Bot Core Knowledge</strong> articles form the AI system prompt — update them here to instantly change bot behavior.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="articles" className="flex items-center gap-2">
            <Book className="h-4 w-4" />
            Articles
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            AI Suggestions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="mt-6">
          <KBArticleList />
        </TabsContent>

        <TabsContent value="suggestions" className="mt-6">
          <PendingKBSuggestions />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default KnowledgeBase;
