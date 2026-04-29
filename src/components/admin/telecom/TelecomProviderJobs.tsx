import { useState } from "react";
import { useTelecomJobs } from "@/hooks/useTelecomJobs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, RotateCcw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { JobStatus } from "@/types/telecom";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-blue-100 text-blue-700",
  processing: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
  retrying: "bg-purple-100 text-purple-700",
};

export function TelecomProviderJobs() {
  const [statusFilter, setStatusFilter] = useState<JobStatus | "all">("all");
  const { data, isLoading, refetch, retryJob } = useTelecomJobs({
    status: statusFilter !== "all" ? statusFilter as JobStatus : undefined,
  });

  const handleRetry = async (jobId: string) => {
    try {
      await retryJob.mutateAsync(jobId);
      toast({ title: "Job queued for retry" });
    } catch {
      toast({ title: "Failed to retry job", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as JobStatus | "all")}>
          <SelectTrigger className="w-[140px] h-9 text-xs bg-white border-[#F3F0EB]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="retrying">Retrying</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="h-9 border-[#F3F0EB]">
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-[#F3F0EB] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#FAF7F2]">
              <TableHead className="text-[11px] font-semibold">Job Type</TableHead>
              <TableHead className="text-[11px] font-semibold">SIM</TableHead>
              <TableHead className="text-[11px] font-semibold">Status</TableHead>
              <TableHead className="text-[11px] font-semibold">Attempts</TableHead>
              <TableHead className="text-[11px] font-semibold">Error</TableHead>
              <TableHead className="text-[11px] font-semibold">Created</TableHead>
              <TableHead className="text-[11px] font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-sm text-[#9CA3AF]">Loading...</TableCell></TableRow>
            ) : !data?.length ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-sm text-[#9CA3AF]">No provider jobs found.</TableCell></TableRow>
            ) : data.map((job: any) => (
              <TableRow key={job.id}>
                <TableCell><Badge variant="outline" className="text-[10px] capitalize">{job.job_type}</Badge></TableCell>
                <TableCell className="font-mono text-xs">{job.telecom_sim_cards?.iccid || job.telecom_sim_cards?.msisdn || "—"}</TableCell>
                <TableCell><Badge className={`text-[10px] capitalize border-0 ${STATUS_COLORS[job.status]}`}>{job.status}</Badge></TableCell>
                <TableCell className="text-xs">{job.attempts}/{job.max_attempts}</TableCell>
                <TableCell className="text-xs text-red-600 max-w-[200px] truncate">{job.error_message || "—"}</TableCell>
                <TableCell className="text-xs">{format(new Date(job.created_at), "dd MMM HH:mm")}</TableCell>
                <TableCell>
                  {job.status === "failed" && (
                    <Button variant="ghost" size="sm" onClick={() => handleRetry(job.id)} className="h-7 text-xs gap-1">
                      <RotateCcw className="h-3 w-3" /> Retry
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
