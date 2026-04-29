import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Volume2, Target, Globe, BookOpen, TrendingUp, AlertTriangle } from "lucide-react";
import { QualityRatingSummary } from "./quality/QualityRatingSummary";
import { QualityLowRated } from "./quality/QualityLowRated";
import { QualityDeadAir } from "./quality/QualityDeadAir";
import { QualityFailedIntents } from "./quality/QualityFailedIntents";
import { QualityLanguageIssues } from "./quality/QualityLanguageIssues";
import { QualityBotTracking } from "./quality/QualityBotTracking";
import PendingKBSuggestions from "../kb/PendingKBSuggestions";

const tabs = [
  { value: "summary", label: "Rating Summary", icon: Star },
  { value: "low-rated", label: "Low-Rated", icon: AlertTriangle },
  { value: "dead-air", label: "Dead Air", icon: Volume2 },
  { value: "intents", label: "Failed Intents", icon: Target },
  { value: "language", label: "Language", icon: Globe },
  { value: "kb-suggestions", label: "KB Suggestions", icon: BookOpen },
  { value: "tracking", label: "Bot Tracking", icon: TrendingUp },
];

export function ContactCenterRatingReport() {
  const [activeTab, setActiveTab] = useState("summary");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md">
          <Star className="h-5 w-5 text-white fill-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">AI Quality Command Center</h2>
          <p className="text-xs text-muted-foreground">Actionable quality insights, optimization workflows & improvement tracking</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 h-auto flex-wrap gap-1 p-1">
          {tabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 text-xs data-[state=active]:bg-background">
              <tab.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="summary" className="mt-4"><QualityRatingSummary /></TabsContent>
        <TabsContent value="low-rated" className="mt-4"><QualityLowRated /></TabsContent>
        <TabsContent value="dead-air" className="mt-4"><QualityDeadAir /></TabsContent>
        <TabsContent value="intents" className="mt-4"><QualityFailedIntents /></TabsContent>
        <TabsContent value="language" className="mt-4"><QualityLanguageIssues /></TabsContent>
        <TabsContent value="kb-suggestions" className="mt-4"><PendingKBSuggestions /></TabsContent>
        <TabsContent value="tracking" className="mt-4"><QualityBotTracking /></TabsContent>
      </Tabs>
    </div>
  );
}
