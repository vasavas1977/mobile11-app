import { useState } from "react";
import { useTelecomPlans } from "@/hooks/useTelecomUsage";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function TelecomPlans() {
  const { data, isLoading } = useTelecomPlans();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div />
        <Button size="sm" className="h-9 gap-1.5 bg-orange-500 hover:bg-orange-600 text-white">
          <Plus className="h-3.5 w-3.5" /> Add Plan
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-[#F3F0EB] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#FAF7F2]">
              <TableHead className="text-[11px] font-semibold">Plan Name</TableHead>
              <TableHead className="text-[11px] font-semibold">Code</TableHead>
              <TableHead className="text-[11px] font-semibold">Type</TableHead>
              <TableHead className="text-[11px] font-semibold">SIM Type</TableHead>
              <TableHead className="text-[11px] font-semibold">Data</TableHead>
              <TableHead className="text-[11px] font-semibold">Voice</TableHead>
              <TableHead className="text-[11px] font-semibold">Validity</TableHead>
              <TableHead className="text-[11px] font-semibold">Price</TableHead>
              <TableHead className="text-[11px] font-semibold">Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-sm text-[#9CA3AF]">Loading...</TableCell></TableRow>
            ) : !data?.length ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-sm text-[#9CA3AF]">No plans defined yet. Add your first telecom plan.</TableCell></TableRow>
            ) : data.map((plan: any) => (
              <TableRow key={plan.id}>
                <TableCell className="text-xs font-medium">{plan.plan_name}</TableCell>
                <TableCell className="text-xs font-mono text-[#6B7280]">{plan.plan_code || "—"}</TableCell>
                <TableCell><Badge variant="outline" className="text-[10px] capitalize">{plan.plan_type}</Badge></TableCell>
                <TableCell><Badge variant="outline" className="text-[10px] capitalize">{plan.sim_type}</Badge></TableCell>
                <TableCell className="text-xs">{plan.data_limit_mb ? `${plan.data_limit_mb} MB` : "Unlimited"}</TableCell>
                <TableCell className="text-xs">{plan.voice_minutes ? `${plan.voice_minutes} min` : "—"}</TableCell>
                <TableCell className="text-xs">{plan.validity_days ? `${plan.validity_days}d` : "—"}</TableCell>
                <TableCell className="text-xs font-medium">{plan.currency} {plan.retail_price}</TableCell>
                <TableCell>
                  <Badge className={`text-[10px] border-0 ${plan.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                    {plan.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
