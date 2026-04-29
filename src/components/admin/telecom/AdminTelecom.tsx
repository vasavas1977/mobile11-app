import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TelecomInventory } from "./TelecomInventory";
import { TelecomSubscriptions } from "./TelecomSubscriptions";
import { TelecomProviderJobs } from "./TelecomProviderJobs";
import { TelecomUsageMonitor } from "./TelecomUsageMonitor";
import { TelecomTransactions } from "./TelecomTransactions";
import { TelecomEventLog } from "./TelecomEventLog";
import { TelecomPlans } from "./TelecomPlans";
import { Smartphone, CreditCard, Activity, ArrowUpDown, ScrollText, ClipboardList, Tag } from "lucide-react";

export function AdminTelecom() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "inventory";

  const handleTabChange = (value: string) => {
    setSearchParams(value === "inventory" ? {} : { tab: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[#1A1A1A]">Telecom Operations</h1>
        <p className="text-sm text-[#6B7280]">Manage SIM inventory, subscriptions, provisioning jobs, and usage</p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="bg-[#FAF7F2] border border-[#F3F0EB] flex-wrap h-auto gap-0.5 p-1">
          <TabsTrigger value="inventory" className="text-xs gap-1.5 data-[state=active]:bg-white">
            <Smartphone className="h-3.5 w-3.5" /> Inventory
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="text-xs gap-1.5 data-[state=active]:bg-white">
            <CreditCard className="h-3.5 w-3.5" /> Subscriptions
          </TabsTrigger>
          <TabsTrigger value="plans" className="text-xs gap-1.5 data-[state=active]:bg-white">
            <Tag className="h-3.5 w-3.5" /> Plans
          </TabsTrigger>
          <TabsTrigger value="jobs" className="text-xs gap-1.5 data-[state=active]:bg-white">
            <Activity className="h-3.5 w-3.5" /> Jobs
          </TabsTrigger>
          <TabsTrigger value="usage" className="text-xs gap-1.5 data-[state=active]:bg-white">
            <ArrowUpDown className="h-3.5 w-3.5" /> Usage
          </TabsTrigger>
          <TabsTrigger value="transactions" className="text-xs gap-1.5 data-[state=active]:bg-white">
            <ScrollText className="h-3.5 w-3.5" /> Transactions
          </TabsTrigger>
          <TabsTrigger value="events" className="text-xs gap-1.5 data-[state=active]:bg-white">
            <ClipboardList className="h-3.5 w-3.5" /> Event Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory"><TelecomInventory /></TabsContent>
        <TabsContent value="subscriptions"><TelecomSubscriptions /></TabsContent>
        <TabsContent value="plans"><TelecomPlans /></TabsContent>
        <TabsContent value="jobs"><TelecomProviderJobs /></TabsContent>
        <TabsContent value="usage"><TelecomUsageMonitor /></TabsContent>
        <TabsContent value="transactions"><TelecomTransactions /></TabsContent>
        <TabsContent value="events"><TelecomEventLog /></TabsContent>
      </Tabs>
    </div>
  );
}
