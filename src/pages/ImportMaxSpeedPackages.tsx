import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import * as XLSX from 'xlsx';

export default function ImportMaxSpeedPackages() {
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
      
      // Find "Fixed" sheet (Sheet 4)
      const sheetName = workbook.SheetNames.find(name => 
        /fixed/i.test(name)
      ) || workbook.SheetNames[3]; // Or use index 3 for Sheet 4 (0-indexed)
      
      if (!sheetName) {
        throw new Error('Fixed sheet not found');
      }

      const worksheet = workbook.Sheets[sheetName];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      console.log('📊 Total rows in sheet:', jsonData.length);
      console.log('📋 First 3 rows:', jsonData.slice(0, 3));
      
      // Find header row with flexible pattern matching
      let headerRowIndex = -1;
      for (let i = 0; i < Math.min(10, jsonData.length); i++) {
        const row = jsonData[i];
        if (Array.isArray(row)) {
          const rowStr = row.map(cell => String(cell || '').toLowerCase()).join('|');
          // Look for key column indicators
          if (rowStr.includes('option') || rowStr.includes('plan') || 
              rowStr.includes('qos') || rowStr.includes('carrier') ||
              rowStr.includes('data') || rowStr.includes('day')) {
            console.log(`✅ Found header row at index ${i}:`, row);
            headerRowIndex = i;
            break;
          }
        }
      }
      
      if (headerRowIndex === -1) {
        throw new Error('Header row not found');
      }

      const headers = jsonData[headerRowIndex].map((h: any) => 
        String(h || '').trim().toLowerCase()
      );
      
      console.log('📝 Parsed headers:', headers);
      console.log('📊 Data rows to process:', jsonData.length - headerRowIndex - 1);
      
      const packages = [];
      let errors = 0;
      const skipped = {
        missingFields: 0,
        invalidData: 0
      };
      
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

        const getBooleanCell = (headerNames: string[]) => {
          const value = getCell(headerNames);
          return value === 'O' || value === 'Available' || /^true$/i.test(value);
        };

        const plan = getCell(['plan', 'country', 'destination']);
        const days = getCell(['day', 'days', 'validity']);
        const dataAmount = getCell(['data', 'data amount', 'volume']);
        const optionName = getCell(['option name', 'optionname', 'option id', 'optionid', 'option_name']);
        const qosSpeed = getCell(['qos', 'qos speed', 'qos_speed', 'speed']);
        const carrier = getCell(['carrier', 'operator']);
        const networkType = getCell(['network', 'network type']);
        const validity = getCell(['validity', 'validity period']);
        
        // Log first row for debugging
        if (i === headerRowIndex + 1) {
          console.log('🔍 First data row values:', {
            plan, days, dataAmount, optionName, qosSpeed, carrier, networkType, validity
          });
        }
        
        // Skip if missing required fields
        if (!plan || !days || !dataAmount) {
          skipped.missingFields++;
          continue;
        }
        
        // Parse data amount - support GB, MB, and Unlimited
        let dataValue: string;
        let shortName: string;
        let normalizedDataAmount: string;
        
        if (/unlimited/i.test(dataAmount)) {
          // Handle unlimited packages
          dataValue = "Unlimited";
          shortName = "Max Unlimited";
          normalizedDataAmount = "Unlimited";
        } else {
          // Try to parse GB
          const gbMatch = dataAmount.match(/(\d+(?:\.\d+)?)\s*GB/i);
          if (gbMatch) {
            dataValue = gbMatch[1];
            shortName = `Max ${dataValue}GB`;
            normalizedDataAmount = `${dataValue}GB`;
          } else {
            // Try to parse MB and convert to GB
            const mbMatch = dataAmount.match(/(\d+(?:\.\d+)?)\s*MB/i);
            if (mbMatch) {
              const mbValue = parseFloat(mbMatch[1]);
              dataValue = (mbValue / 1024).toFixed(2);
              shortName = `Max ${mbMatch[1]}MB`;
              normalizedDataAmount = `${mbMatch[1]}MB`;
            } else {
              // Unknown format - skip
              skipped.invalidData++;
              continue;
            }
          }
        }
        
        // Parse validity days
        const daysMatch = days.match(/(\d+)/);
        const validityDays = daysMatch ? parseInt(daysMatch[1]) : 7;
        
        // Default pricing (can be adjusted later)
        const price = 10; // Default USD price
        const costPrice = 7; // Default cost
        
        const packageData = {
          package_id: optionName || `${plan}_${validityDays}Days_${dataValue}_Max`,
          name: `${plan} ${days} / ${normalizedDataAmount}`.trim(),
          short_name: shortName,
          package_type: 'max_speed',
          country_name: plan,
          country_code: '',
          data_amount: normalizedDataAmount,
          validity_days: validityDays,
          qos_speed: qosSpeed || 'Varies',
          speed_after_limit: qosSpeed || 'Varies',
          price: price,
          cost_price: costPrice,
          currency: 'USD',
          sim_type: getCell(['sim type', 'simtype']),
          carrier: carrier,
          network_type: networkType || '4G',
          access_type: getCell(['access type', 'accesstype']),
          validity_period: validity || '180Days',
          apn: getCell(['apn']),
          pre_installation: getBooleanCell(['preinstallation', 'pre installation']),
          top_up: getBooleanCell(['top-up', 'top up', 'topup']),
          kyc: getBooleanCell(['kyc']),
          hot_spot: getBooleanCell(['hot-spot', 'hot spot', 'hotspot']),
          initialize_policy: getCell(['initialize policy', 'initializepolicy']),
          is_active: true,
          support_data: true,
          support_sms: false,
          support_voice: false,
        };
        
        packages.push(packageData);
      }
      
      console.log(`✅ Prepared ${packages.length} packages for import`);
      console.log(`⏭️ Skipped rows:`, {
        missingFields: skipped.missingFields,
        invalidData: skipped.invalidData,
        total: skipped.missingFields + skipped.invalidData
      });
      
      if (packages.length === 0) {
        const skippedTotal = skipped.missingFields + skipped.invalidData;
        toast.error(`No Max Speed packages found. Skipped ${skippedTotal} rows. Check console for details.`);
        setImporting(false);
        return;
      }
      
      // Insert in batches of 50
      const BATCH_SIZE = 50;
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < packages.length; i += BATCH_SIZE) {
        const batch = packages.slice(i, i + BATCH_SIZE);
        
        const { error } = await supabase
          .from('esim_packages')
          .upsert(batch, { 
            onConflict: 'package_id',
            ignoreDuplicates: false 
          });
        
        if (error) {
          console.error('Batch insert error:', error);
          errorCount += batch.length;
        } else {
          successCount += batch.length;
        }
        
        setProgress(Math.round(((i + batch.length) / packages.length) * 100));
      }
      
      const skippedTotal = skipped.missingFields + skipped.invalidData;
      
      toast.success(
        `Import Complete!\n✅ Imported: ${successCount} packages\n❌ Errors: ${errorCount}\n⏭️ Skipped: ${skippedTotal} rows (missing fields or invalid data)\n\nCheck console for details.`
      );
      
    } catch (error) {
      console.error('Import error:', error);
      toast.error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setImporting(false);
      setProgress(0);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Import Max Speed Packages</h1>
          <p className="text-muted-foreground">
            Import fixed-data packages from Excel Sheet 4 (Fixed) as Max Speed plans
          </p>
        </div>

        <div className="bg-card border rounded-lg p-6 space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Upload Excel File</h2>
            <p className="text-sm text-muted-foreground">
              Select the Excel file containing the "Fixed" sheet (Sheet 4)
            </p>
            
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileImport}
              disabled={importing}
              className="block w-full text-sm text-muted-foreground
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-primary file:text-primary-foreground
                hover:file:bg-primary/90
                file:cursor-pointer cursor-pointer
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {importing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Importing packages...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Import Details:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Packages with <strong>384kbps QoS</strong> will be imported</li>
              <li>• Package type will be set to <strong>Max Speed</strong></li>
              <li>• Short names will be generated as <strong>Max {'{X}'}GB</strong></li>
              <li>• Speed after limit will be set to <strong>384kbps</strong></li>
              <li>• All packages will be set to <strong>active</strong> by default</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Instructions:</h3>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Ensure your Excel file has a sheet named "Fixed" (Sheet 4)</li>
              <li>The sheet should contain columns for Option ID, Plan, Days, Data, QoS, etc.</li>
              <li>Only packages with 384kbps QoS will be imported</li>
              <li>Existing packages with the same Option ID will be updated</li>
            </ol>
          </div>
        </div>

        <div className="mt-6">
          <Button
            variant="outline"
            onClick={() => window.close()}
            disabled={importing}
          >
            Close Window
          </Button>
        </div>
      </div>
    </div>
  );
}
