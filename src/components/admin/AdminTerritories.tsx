import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TerritoryList } from "./territories/TerritoryList";
import { TerritoryDetail } from "./territories/TerritoryDetail";
import { useToast } from "@/hooks/use-toast";

export function AdminTerritories() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: territories = [], isLoading } = useQuery({
    queryKey: ["admin-territories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("territories")
        .select("*")
        .order("territory_name");
      if (error) throw error;
      return data || [];
    },
  });

  const selected = territories.find((t: any) => t.id === selectedId);

  if (selected) {
    return <TerritoryDetail territory={selected} onBack={() => setSelectedId(null)} />;
  }

  return (
    <TerritoryList
      territories={territories as any[]}
      isLoading={isLoading}
      onSelect={setSelectedId}
      onAdd={() => toast({ title: "Coming soon", description: "Territory creation form will be available shortly." })}
    />
  );
}
