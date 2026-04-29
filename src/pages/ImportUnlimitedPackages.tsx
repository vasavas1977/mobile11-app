import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import * as XLSX from 'xlsx';

export default function ImportUnlimitedPackages() {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setProgress(0);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      
      // Find "Unlimited" sheet
      const sheetName = workbook.SheetNames.find(name => 
        /unlimited/i.test(name)
      ) || workbook.SheetNames[4]; // Or use index 4 for Page 5
      
      if (!sheetName) {
        throw new Error('Unlimited sheet not found');
      }

      const worksheet = workbook.Sheets[sheetName];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Find header row
      let headerRowIndex = -1;
      for (let i = 0; i < Math.min(10, jsonData.length); i++) {
        const row = jsonData[i];
        if (Array.isArray(row) && row.some((cell: any) => 
          /Option ID/i.test(String(cell || ''))
        )) {
          headerRowIndex = i;
          break;
        }
      }
      
      if (headerRowIndex === -1) {
        throw new Error('Header row not found');
      }

      const headers = jsonData[headerRowIndex].map((h: any) => 
        String(h || '').trim().toLowerCase()
      );
      
      const packages = [];
      
      // Process data rows
      for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!Array.isArray(row) || row.length < 10) continue;
        
        const getCell = (headerNames: string[]) => {
          for (const name of headerNames) {
            const idx = headers.findIndex(h => h.includes(name.toLowerCase()));
            if (idx !== -1 && row[idx] !== undefined && row[idx] !== null && String(row[idx]).trim()) {
              return String(row[idx]).trim();
            }
          }
          return '';
        };

        const plan = getCell(['plan']);
        const days = getCell(['day', 'days']);
        const dataAmount = getCell(['data']);
        const optionId = getCell(['option id', 'optionid']);
        const qosSpeed = getCell(['qos', 'qos speed']);
        const b2bPrice = getCell(['b2b price', 'b2bprice']);
        
        if (!plan || !days || !dataAmount || !optionId || !b2bPrice) continue;
        
        // Check if it's an unlimited package
        const isUnlimited = /unlimited/i.test(dataAmount);
        if (!isUnlimited) continue;
        
        // Check if it's 1Mbps or 5Mbps (flexible match to handle variations like "1 Mbps (Non-Stop)")
        const isNonStop = /[15]\s*mbps/i.test(qosSpeed);
        if (!isNonStop) continue;
        
        // Determine package type and short_name
        const is5Mbps = /5\s*mbps/i.test(qosSpeed);
        const shortName = is5Mbps ? '5 Mbps unlimited' : '1 Mbps unlimited';
        
        // Parse validity days
        const daysMatch = days.match(/(\d+)/);
        const validityDays = daysMatch ? parseInt(daysMatch[1]) : 1;
        
        // Parse price
        const price = parseFloat(b2bPrice) || 0;
        
        const packageData = {
          package_id: optionId,
          name: `${plan} ${days} / ${dataAmount}`.trim(),
          short_name: shortName,
          country_name: plan,
          country_code: '',
          data_amount: dataAmount,
          validity_days: validityDays,
          price: price,
          currency: 'USD',
          sim_type: getCell(['sim type', 'simtype']),
          carrier: getCell(['carrier']),
          network_type: getCell(['network', 'network type']),
          access_type: getCell(['access type', 'accesstype']),
          qos_speed: qosSpeed,
          validity_period: getCell(['validity']),
          apn: getCell(['apn']),
          availability: getCell(['preinstallation', 'availability']),
          hot_spot: getCell(['hot-spot', 'hotspot']) === 'O',
          top_up: getCell(['top-up', 'topup']) === 'O',
          kyc: getCell(['kyc']) === 'O',
          pre_installation: getCell(['preinstallation']) === 'Available',
          support_data: true,
          support_voice: false,
          support_sms: false,
          initialize_policy: getCell(['initialize policy', 'initializepolicy']),
          is_active: true,
          is_cancelable: false,
          package_type: 'limitless',
          daily_data_reset: false,
          daily_reset_amount: null,
          speed_after_limit: null,
          category: 'regional'
        };
        
        packages.push(packageData);
      }

      console.log(`Found ${packages.length} Limitless unlimited packages to import`);
      toast.info(`Found ${packages.length} packages to import`);
      
      // Bulk insert in batches of 100
      const batchSize = 100;
      for (let i = 0; i < packages.length; i += batchSize) {
        const batch = packages.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('esim_packages')
          .upsert(batch, { 
            onConflict: 'package_id',
            ignoreDuplicates: false 
          });
        
        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        
        setProgress(Math.round(((i + batch.length) / packages.length) * 100));
      }

      toast.success(`Successfully imported ${packages.length} Limitless unlimited packages!`);
    } catch (error) {
      console.error('Import error:', error);
      toast.error(`Import failed: ${error.message}`);
    } finally {
      setImporting(false);
      setProgress(0);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Import Limitless Unlimited Packages</h1>
          <p className="text-muted-foreground">
            Upload the Excel file to import 625 Limitless unlimited packages (1Mbps & 5Mbps)
          </p>
        </div>

        <div className="border-2 border-dashed rounded-lg p-12 text-center">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileImport}
            disabled={importing}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button disabled={importing} asChild>
              <span className="cursor-pointer">
                {importing ? 'Importing...' : 'Select Excel File'}
              </span>
            </Button>
          </label>
          
          {importing && (
            <div className="mt-4">
              <div className="w-full bg-secondary rounded-full h-2.5">
                <div 
                  className="bg-primary h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">{progress}% complete</p>
            </div>
          )}
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Select the Excel file (1-TO-ALL_B2B_Price_v4_final-4.xlsx)</li>
            <li>The system will automatically find the "Unlimited" sheet</li>
            <li>Only packages with 1Mbps or 5Mbps QoS will be imported</li>
            <li>Packages will be marked as package_type: "limitless"</li>
            <li>Wait for the import to complete</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
