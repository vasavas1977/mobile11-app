import { TugePriceComparison } from '../TugePriceComparison';
import { VendorCostComparison } from '../packages/VendorCostComparison';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';

export function CatalogCompetitorTab() {
  const [subTab, setSubTab] = useState('price');

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Competitor & Vendor Comparison</h2>
        <p className="text-sm text-muted-foreground">Compare pricing against competitors and supplier cost structures</p>
      </div>

      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList className="h-9">
          <TabsTrigger value="price" className="text-xs">Price Comparison</TabsTrigger>
          <TabsTrigger value="vendor" className="text-xs">Vendor Cost Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="price" className="mt-4">
          <TugePriceComparison />
        </TabsContent>

        <TabsContent value="vendor" className="mt-4">
          <VendorCostComparison />
        </TabsContent>
      </Tabs>
    </div>
  );
}
