import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTelecomSIMs } from "@/hooks/useTelecomSIMs";
import { toast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function BulkImportSIMs({ open, onClose }: Props) {
  const [batchId, setBatchId] = useState("");
  const [parsed, setParsed] = useState<Array<{ iccid: string; msisdn?: string; imsi?: string }>>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const { bulkImport } = useTelecomSIMs();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split("\n").filter(Boolean);
      const header = lines[0].toLowerCase();
      const hasHeader = header.includes("iccid");
      const dataLines = hasHeader ? lines.slice(1) : lines;
      const rows = dataLines.map((line) => {
        const cols = line.split(",").map((c) => c.trim().replace(/"/g, ""));
        return { iccid: cols[0], msisdn: cols[1] || undefined, imsi: cols[2] || undefined };
      }).filter((r) => r.iccid);
      setParsed(rows);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!parsed.length) return;
    try {
      await bulkImport.mutateAsync(
        parsed.map((r) => ({
          sim_type: "physical" as const,
          iccid: r.iccid,
          msisdn: r.msisdn,
          imsi: r.imsi,
          batch_id: batchId || undefined,
        }))
      );
      toast({ title: `${parsed.length} SIM cards imported` });
      setParsed([]);
      setBatchId("");
      onClose();
    } catch (err: any) {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Import SIM Cards</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">CSV File (columns: iccid, msisdn, imsi)</Label>
            <Input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFile}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Batch ID (optional)</Label>
            <Input
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              placeholder="e.g. BATCH-2026-Q1"
              className="mt-1"
            />
          </div>
          {parsed.length > 0 && (
            <p className="text-sm text-emerald-600 font-medium">{parsed.length} SIM cards parsed from CSV</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleImport}
            disabled={!parsed.length || bulkImport.isPending}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            {bulkImport.isPending ? "Importing..." : `Import ${parsed.length} SIMs`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
