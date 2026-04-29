import { useState } from "react";
import { Undo2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import prevFiles from "@/data/bridge-files-stable-prev.json";

export function ManualRollbackButton() {
  const [running, setRunning] = useState(false);

  async function handleRollback() {
    setRunning(true);
    try {
      // Strip deploy-agent.ts — it ships in the snapshot for the "Update Deploy
      // Agent" download flow but the VPS deploy-agent's whitelist refuses to
      // overwrite itself, which makes the deploy-bridge edge function flag the
      // whole rollback as a partial-deploy failure. Send only runtime files.
      const { ["deploy-agent.ts"]: _ignored, ...runtimeFiles } = prevFiles as Record<string, string>;
      const { data, error } = await supabase.functions.invoke("deploy-bridge", {
        body: { files: runtimeFiles },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({
        title: "Rollback deployed",
        description: `Reverted to previous stable bundle. ${data?.deployed?.length ?? 0} files updated.`,
      });
    } catch (err: any) {
      toast({
        title: "Rollback failed",
        description: String(err?.message ?? err),
        variant: "destructive",
      });
    } finally {
      setRunning(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-red-200 text-red-700 hover:bg-red-50">
          <Undo2 className="h-3.5 w-3.5 mr-1" /> Manual Rollback
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Roll back to previous stable bundle?</AlertDialogTitle>
          <AlertDialogDescription>
            This redeploys <code className="text-xs bg-[#FAF7F2] px-1 rounded">bridge-files-stable-prev.json</code> to the
            VPS via the existing <code className="text-xs bg-[#FAF7F2] px-1 rounded">deploy-bridge</code> edge function.
            Active calls will continue, but new sessions will use the previous bridge code. Use this if Phase B (Gemini
            3.1 setup-fix) is failing.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRollback}
            disabled={running}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {running ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Undo2 className="h-3.5 w-3.5 mr-1" />}
            Confirm rollback
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
