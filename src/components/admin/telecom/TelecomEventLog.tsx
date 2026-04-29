import { useTelecomEventLog } from "@/hooks/useTelecomUsage";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export function TelecomEventLog() {
  const { data, isLoading } = useTelecomEventLog();

  return (
    <div className="bg-white rounded-xl border border-[#F3F0EB] overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#FAF7F2]">
            <TableHead className="text-[11px] font-semibold">Entity</TableHead>
            <TableHead className="text-[11px] font-semibold">Event</TableHead>
            <TableHead className="text-[11px] font-semibold">Actor</TableHead>
            <TableHead className="text-[11px] font-semibold">Data</TableHead>
            <TableHead className="text-[11px] font-semibold">Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={5} className="text-center py-8 text-sm text-[#9CA3AF]">Loading...</TableCell></TableRow>
          ) : !data?.length ? (
            <TableRow><TableCell colSpan={5} className="text-center py-8 text-sm text-[#9CA3AF]">No events logged yet.</TableCell></TableRow>
          ) : data.map((evt: any) => (
            <TableRow key={evt.id}>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] capitalize">{evt.entity_type.replace("_", " ")}</Badge>
                  <span className="text-[10px] text-[#9CA3AF] font-mono">{evt.entity_id.slice(0, 8)}</span>
                </div>
              </TableCell>
              <TableCell className="text-xs font-medium">{evt.event_type}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-[10px] capitalize">{evt.actor_type}</Badge>
              </TableCell>
              <TableCell className="text-xs text-[#6B7280] max-w-[250px] truncate font-mono">
                {JSON.stringify(evt.event_data).slice(0, 80)}
              </TableCell>
              <TableCell className="text-xs">{format(new Date(evt.created_at), "dd MMM HH:mm:ss")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
