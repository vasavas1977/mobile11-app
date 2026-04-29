import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Upload, FileSpreadsheet, Download, Filter, TrendingUp, TrendingDown, Equal, AlertCircle, CheckCircle, HelpCircle, ChevronDown, Settings2, ChevronLeft, ChevronRight, Eye, Loader2, Search, X, Save, FolderOpen, Trash2, Database } from 'lucide-react';
import { parseTugeExcel, reparseWithMapping, getUniqueCountries, getUniqueCarriers, TugePackage, ParseResult } from '@/lib/tugeExcelParser';
import { SkippedRowsDetails } from './SkippedRowsDetails';
import { calculateMatchQuality, getCountryMatchScore, MatchResult } from '@/lib/carrierMatcher';
import { cn } from '@/lib/utils';
import { ExcelPreviewTable } from './ExcelPreviewTable';
import { ColumnMapperDialog } from './ColumnMapperDialog';
import { ImportPackagesDialog, ImportSettings } from './ImportPackagesDialog';
import { getCountryCode } from '@/lib/countryCodeMapping';
import { toast } from 'sonner';

interface PriceFileUpload {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  file_type: string;
  sheet_name: string | null;
  packages_count: number | null;
  uploaded_by: string | null;
  uploaded_at: string;
  is_active: boolean;
  notes: string | null;
}

interface UsimPackage {
  id: string;
  package_id: string;
  name: string;
  country_name: string;
  carrier: string | null;
  package_type: string | null;
  data_amount: string;
  validity_days: number;
  cost_price: number | null;
  cost_price_per_gb: number | null;
  price: number;
  qos_speed: string | null;
  is_active: boolean;
}

interface ComparisonResult {
  tugePackage: TugePackage;
  usimPackage: UsimPackage | null;
  matchResult: MatchResult;
  priceDifference: number;
  percentageDifference: number;
  cheaperProvider: 'tuge' | 'usimsa' | 'equal' | 'unknown';
  savings: number;
}

type FilterShow = 'all' | 'tuge_wins' | 'usimsa_wins' | 'no_match';

const ITEMS_PER_PAGE = 50;
const BATCH_SIZE = 100;

export function TugePriceComparison() {
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [filterCountry, setFilterCountry] = useState<string>('all');
  const [filterCarrier, setFilterCarrier] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterMatch, setFilterMatch] = useState<string>('all');
  const [filterShow, setFilterShow] = useState<FilterShow>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Processing state for chunked computation
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const [comparisons, setComparisons] = useState<ComparisonResult[]>([]);
  const processingCancelRef = useRef(false);
  
  // Debug mode state
  const [debugMode, setDebugMode] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [showColumnMapper, setShowColumnMapper] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  
  // Package Finder state (debug tool - for TUGE packages)
  const [finderCountry, setFinderCountry] = useState('');
  const [finderData, setFinderData] = useState('');
  const [finderValidity, setFinderValidity] = useState('');
  const [showFinderResults, setShowFinderResults] = useState(false);
  
  // USIMSA Finder state (debug tool - search loaded USIMSA packages)
  const [usimFinderCountry, setUsimFinderCountry] = useState('');
  const [usimFinderData, setUsimFinderData] = useState('');
  const [usimFinderValidity, setUsimFinderValidity] = useState('');
  const [usimFinderType, setUsimFinderType] = useState('');
  const [showUsimFinderResults, setShowUsimFinderResults] = useState(false);
  
  // Saved files state
  const [isSavingFile, setIsSavingFile] = useState(false);
  const [loadingSavedFile, setLoadingSavedFile] = useState(false);
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  
  // Import to database state
  const [selectedForImport, setSelectedForImport] = useState<Set<string>>(new Set());
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  const queryClient = useQueryClient();
  
  // Keep reference to uploaded file for re-parsing
  const uploadedFileRef = useRef<File | null>(null);
  
  // TUGE Provider ID (fixed UUID)
  const TUGE_PROVIDER_ID = '4e7e5af2-8e7a-4d5c-aea2-302fea9c5dac';

  // Fetch USIMSA packages from database with pagination to avoid truncation
  const { data: usimPackagesData, isLoading: isLoadingUsim } = useQuery({
    queryKey: ['usimsa-packages-paginated'],
    queryFn: async () => {
      const PAGE_SIZE = 1000;
      let allPackages: UsimPackage[] = [];
      let from = 0;
      let hasMore = true;
      
      while (hasMore) {
        const { data, error } = await supabase
          .from('esim_packages')
          .select('id, package_id, name, country_name, carrier, package_type, data_amount, validity_days, cost_price, cost_price_per_gb, price, qos_speed, is_active')
          .eq('is_active', true)
          .order('country_name')
          .order('id')
          .range(from, from + PAGE_SIZE - 1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          allPackages = [...allPackages, ...(data as UsimPackage[])];
          from += PAGE_SIZE;
          hasMore = data.length === PAGE_SIZE;
        } else {
          hasMore = false;
        }
      }
      
      // Get total count to verify we fetched everything
      const { count } = await supabase
        .from('esim_packages')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      
      console.log(`📦 USIMSA packages loaded: ${allPackages.length} / ${count} total active`);
      
      return { packages: allPackages, totalCount: count || allPackages.length };
    },
  });

  // Fetch saved TUGE files
  const { data: savedFilesData, isLoading: isLoadingSavedFiles } = useQuery({
    queryKey: ['saved-price-files'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('price_file_uploads')
        .select('*')
        .eq('file_type', 'tuge')
        .eq('is_active', true)
        .order('uploaded_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as PriceFileUpload[];
    }
  });

  const usimPackages = usimPackagesData?.packages || [];
  const usimTotalCount = usimPackagesData?.totalCount || 0;

  // Pre-index USIMSA packages by country for O(1) lookup
  const usimByCountry = useMemo(() => {
    const map = new Map<string, UsimPackage[]>();
    usimPackages.forEach(pkg => {
      const key = pkg.country_name.toLowerCase().trim();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(pkg);
    });
    return map;
  }, [usimPackages]);

  // Build a list of all country keys for fuzzy matching
  const usimCountryKeys = useMemo(() => Array.from(usimByCountry.keys()), [usimByCountry]);

  // Handle file upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    uploadedFileRef.current = file;
    setIsUploading(true);
    setComparisons([]);
    setCurrentPage(1);
    
    try {
      const result = await parseTugeExcel(file);
      setParseResult(result);
      setSelectedSheet(result.sheetName);
      
      // If parsing failed due to missing columns, auto-show the mapper
      if (result.packages.length === 0 && result.rawData && result.rawData.length > 0) {
        setShowColumnMapper(true);
      }
    } catch (error) {
      console.error('Failed to parse file:', error);
    } finally {
      setIsUploading(false);
    }
  }, []);

  // Handle manual column mapping confirmation
  const handleColumnMappingConfirm = useCallback(async (mapping: Record<string, number>) => {
    if (!uploadedFileRef.current || !parseResult) return;
    
    setIsUploading(true);
    setShowColumnMapper(false);
    setComparisons([]);
    
    try {
      const headerRow = parseResult.headerRowIndex !== undefined && parseResult.headerRowIndex >= 0
        ? parseResult.headerRowIndex
        : 0;
      
      const result = await reparseWithMapping(
        uploadedFileRef.current, 
        mapping, 
        headerRow,
        selectedSheet
      );
      setParseResult(result);
    } catch (error) {
      console.error('Failed to re-parse with mapping:', error);
    } finally {
      setIsUploading(false);
    }
  }, [parseResult, selectedSheet]);

  // Handle sheet change
  const handleSheetChange = useCallback(async (sheetName: string) => {
    if (!uploadedFileRef.current) return;
    
    setSelectedSheet(sheetName);
    setIsUploading(true);
    setComparisons([]);
    
    try {
      const result = await parseTugeExcel(uploadedFileRef.current, { sheetName });
      setParseResult(result);
    } catch (error) {
      console.error('Failed to parse sheet:', error);
    } finally {
      setIsUploading(false);
    }
  }, []);

  // Save current file to storage
  const handleSaveFile = useCallback(async () => {
    if (!uploadedFileRef.current || !parseResult) {
      toast.error('No file to save');
      return;
    }
    
    setIsSavingFile(true);
    const file = uploadedFileRef.current;
    const timestamp = Date.now();
    // Sanitize filename: replace special chars with underscores, keep alphanumeric, dots, hyphens
    const sanitizedName = file.name
      .replace(/[^\w\s.-]/g, '_')  // Replace special chars with underscore
      .replace(/\s+/g, '_')         // Replace spaces with underscore
      .replace(/_+/g, '_');         // Collapse multiple underscores
    const filePath = `tuge/${timestamp}_${sanitizedName}`;
    
    try {
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('price-files')
        .upload(filePath, file);
      
      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Failed to save file: ' + uploadError.message);
        return;
      }
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Save metadata
      const { data: insertedFile, error: dbError } = await supabase
        .from('price_file_uploads')
        .insert({
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: 'tuge',
          sheet_name: selectedSheet,
          packages_count: parseResult.packages.length,
          uploaded_by: user?.id || null
        })
        .select()
        .single();
      
      if (dbError) {
        console.error('DB error:', dbError);
        toast.error('Failed to save file metadata');
        return;
      }
      
      // Refresh saved files list
      queryClient.invalidateQueries({ queryKey: ['saved-price-files'] });
      setCurrentFileId(insertedFile?.id || null);
      toast.success('File saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save file');
    } finally {
      setIsSavingFile(false);
    }
  }, [parseResult, selectedSheet, queryClient]);

  // Load a saved file from storage
  const handleLoadSavedFile = useCallback(async (fileId: string) => {
    const fileRecord = savedFilesData?.find(f => f.id === fileId);
    if (!fileRecord) {
      toast.error('File not found');
      return;
    }
    
    setLoadingSavedFile(true);
    setComparisons([]);
    setCurrentPage(1);
    
    try {
      // Download from storage
      const { data, error } = await supabase.storage
        .from('price-files')
        .download(fileRecord.file_path);
      
      if (error || !data) {
        console.error('Download error:', error);
        toast.error('Failed to load file');
        return;
      }
      
      // Convert blob to File and parse
      const file = new File([data], fileRecord.file_name, { type: data.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      uploadedFileRef.current = file;
      
      // Parse the file
      const result = await parseTugeExcel(file, { 
        sheetName: fileRecord.sheet_name || undefined 
      });
      setParseResult(result);
      setSelectedSheet(fileRecord.sheet_name || result.sheetName);
      setCurrentFileId(fileId);
      
      toast.success(`Loaded ${result.packages.length} packages from saved file`);
    } catch (error) {
      console.error('Load error:', error);
      toast.error('Failed to load file');
    } finally {
      setLoadingSavedFile(false);
    }
  }, [savedFilesData]);

  // Delete a saved file
  const handleDeleteSavedFile = useCallback(async (fileId: string) => {
    const fileRecord = savedFilesData?.find(f => f.id === fileId);
    if (!fileRecord) return;
    
    try {
      // Delete from storage
      await supabase.storage
        .from('price-files')
        .remove([fileRecord.file_path]);
      
      // Mark as inactive in database
      await supabase
        .from('price_file_uploads')
        .update({ is_active: false })
        .eq('id', fileId);
      
      queryClient.invalidateQueries({ queryKey: ['saved-price-files'] });
      
      if (currentFileId === fileId) {
        setCurrentFileId(null);
      }
      
      toast.success('File deleted');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete file');
    }
  }, [savedFilesData, currentFileId, queryClient]);

  // Auto-load most recent saved file on mount (only if no file is loaded)
  useEffect(() => {
    if (savedFilesData?.length && !parseResult && !loadingSavedFile && !isUploading) {
      const mostRecent = savedFilesData[0];
      handleLoadSavedFile(mostRecent.id);
    }
  }, [savedFilesData]); // Only run when savedFilesData changes

  // Process comparisons in chunks to avoid blocking UI
  useEffect(() => {
    if (!parseResult?.packages.length || usimPackages.length === 0) {
      setComparisons([]);
      return;
    }

    // Reset and start processing
    processingCancelRef.current = false;
    setIsProcessing(true);
    setProcessProgress(0);
    setComparisons([]);

    const packages = parseResult.packages;
    const results: ComparisonResult[] = [];
    let currentIndex = 0;

    const processBatch = () => {
      if (processingCancelRef.current) {
        setIsProcessing(false);
        return;
      }

      const batchEnd = Math.min(currentIndex + BATCH_SIZE, packages.length);
      
      for (let i = currentIndex; i < batchEnd; i++) {
        const tugePkg = packages[i];
        
        // Fast country lookup - first try exact match
        const tugeCountryKey = tugePkg.country.toLowerCase().trim();
        let countryMatches = usimByCountry.get(tugeCountryKey) || [];
        
        // If no exact match, do fuzzy matching only on country keys (much faster)
        if (countryMatches.length === 0) {
          for (const countryKey of usimCountryKeys) {
            const score = getCountryMatchScore(countryKey, tugeCountryKey);
            if (score >= 0.5) {
              countryMatches = [...countryMatches, ...(usimByCountry.get(countryKey) || [])];
            }
          }
        }

        if (countryMatches.length === 0) {
          results.push({
            tugePackage: tugePkg,
            usimPackage: null,
            matchResult: { matchType: 'no_match' as const, score: 0, carrierScore: 0 },
            priceDifference: 0,
            percentageDifference: 0,
            cheaperProvider: 'unknown' as const,
            savings: 0,
          });
          continue;
        }

        // Score each potential match and find the best one
        let bestMatch: UsimPackage | null = null;
        let bestMatchResult: MatchResult = { matchType: 'no_match', score: 0, carrierScore: 0 };

        for (const usim of countryMatches) {
          // Ensure validity days are compared as numbers
          const tugeValidity = Number(tugePkg.validityDays) || 0;
          const usimValidity = Number(usim.validity_days) || 0;
          
          const matchResult = calculateMatchQuality(
            tugePkg.country,
            tugePkg.carrier,
            tugePkg.packageType,
            tugePkg.dataAmount,
            tugeValidity,
            usim.country_name,
            usim.carrier || '',
            usim.package_type || 'max_speed',
            usim.data_amount,
            usimValidity
          );

          // Debug: Log Indonesia 1GB/7d specifically with package types
          if (tugePkg.country.toLowerCase().includes('indonesia') && 
              tugePkg.dataAmount === '1GB' && tugeValidity === 7) {
            console.log(`🔎 Indonesia 1GB/7d: TUGE [${tugePkg.packageType}] vs USIMSA ${usim.carrier} [${usim.package_type}] ${usim.data_amount}/${usimValidity}d → score: ${matchResult.score}`);
          }
          
          // Debug: Log first few Indonesia comparisons with types
          if (tugePkg.country.toLowerCase().includes('indonesia') && countryMatches.indexOf(usim) < 3) {
            console.log(`🔍 Comparing: TUGE ${tugePkg.dataAmount}/${tugeValidity}d [${tugePkg.packageType}] vs USIMSA ${usim.data_amount}/${usimValidity}d [${usim.package_type}] → score: ${matchResult.score}`);
          }

          // ONLY accept matches with score > 0
          // This ensures data amount AND validity days match exactly
          if (matchResult.score > 0 && matchResult.score > bestMatchResult.score) {
            bestMatch = usim;
            bestMatchResult = matchResult;
          }
        }

        // If no valid match found (score is 0), explicitly nullify
        if (bestMatchResult.score === 0) {
          bestMatch = null;
        }

        // Calculate price comparison
        const tugeCost = tugePkg.b2bPrice;
        const usimCost = bestMatch?.cost_price || 0;
        const priceDifference = tugeCost - usimCost;
        const percentageDifference = usimCost > 0 ? ((tugeCost - usimCost) / usimCost) * 100 : 0;
        
        let cheaperProvider: 'tuge' | 'usimsa' | 'equal' | 'unknown';
        if (!bestMatch || usimCost <= 0) {
          cheaperProvider = 'unknown';
        } else if (Math.abs(priceDifference) < 0.05) {
          cheaperProvider = 'equal';
        } else if (priceDifference < 0) {
          cheaperProvider = 'tuge';
        } else {
          cheaperProvider = 'usimsa';
        }

        results.push({
          tugePackage: tugePkg,
          usimPackage: bestMatch,
          matchResult: bestMatchResult,
          priceDifference,
          percentageDifference,
          cheaperProvider,
          savings: Math.abs(priceDifference),
        });
      }

      currentIndex = batchEnd;
      const progress = Math.round((currentIndex / packages.length) * 100);
      setProcessProgress(progress);

      if (currentIndex < packages.length) {
        // Schedule next batch
        requestAnimationFrame(processBatch);
      } else {
        // Done processing
        setComparisons(results);
        setIsProcessing(false);
      }
    };

    // Start processing
    requestAnimationFrame(processBatch);

    // Cleanup on unmount or re-run
    return () => {
      processingCancelRef.current = true;
    };
  }, [parseResult, usimPackages, usimByCountry, usimCountryKeys]);

  // Filter comparisons
  const filteredComparisons = useMemo(() => {
    return comparisons.filter(comp => {
      if (filterCountry !== 'all' && comp.tugePackage.country !== filterCountry) return false;
      if (filterCarrier !== 'all' && comp.tugePackage.carrier !== filterCarrier) return false;
      if (filterType !== 'all' && comp.tugePackage.packageType !== filterType) return false;
      if (filterMatch !== 'all' && comp.matchResult.matchType !== filterMatch) return false;
      if (filterShow === 'tuge_wins' && comp.cheaperProvider !== 'tuge') return false;
      if (filterShow === 'usimsa_wins' && comp.cheaperProvider !== 'usimsa') return false;
      if (filterShow === 'no_match' && comp.usimPackage !== null) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return comp.tugePackage.country.toLowerCase().includes(query) ||
               comp.tugePackage.carrier.toLowerCase().includes(query) ||
               comp.tugePackage.optionId.toLowerCase().includes(query);
      }
      return true;
    });
  }, [comparisons, filterCountry, filterCarrier, filterType, filterMatch, filterShow, searchQuery]);

  // Paginated comparisons
  const totalPages = Math.ceil(filteredComparisons.length / ITEMS_PER_PAGE);
  const paginatedComparisons = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredComparisons.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredComparisons, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterCountry, filterCarrier, filterType, filterMatch, filterShow, searchQuery]);

  // Calculate summary statistics
  const stats = useMemo(() => {
    const total = comparisons.length;
    const tugeWins = comparisons.filter(c => c.cheaperProvider === 'tuge').length;
    const usimWins = comparisons.filter(c => c.cheaperProvider === 'usimsa').length;
    const equal = comparisons.filter(c => c.cheaperProvider === 'equal').length;
    const noMatch = comparisons.filter(c => c.usimPackage === null).length;
    const exactMatch = comparisons.filter(c => c.matchResult.matchType === 'exact').length;
    const fuzzyMatch = comparisons.filter(c => c.matchResult.matchType === 'carrier_fuzzy').length;
    const countryOnly = comparisons.filter(c => c.matchResult.matchType === 'country_only').length;
    
    const totalSavings = comparisons
      .filter(c => c.cheaperProvider === 'tuge')
      .reduce((sum, c) => sum + c.savings, 0);
    
    const avgSavings = tugeWins > 0 ? totalSavings / tugeWins : 0;

    return { total, tugeWins, usimWins, equal, noMatch, exactMatch, fuzzyMatch, countryOnly, totalSavings, avgSavings };
  }, [comparisons]);

  // Package type breakdown for debug mode
  const typeBreakdown = useMemo(() => {
    if (!parseResult?.packages) return { max_speed: 0, day_pass: 0, limitless: 0 };
    return parseResult.packages.reduce((acc, pkg) => {
      const type = pkg.packageType as 'max_speed' | 'day_pass' | 'limitless';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, { max_speed: 0, day_pass: 0, limitless: 0 } as Record<string, number>);
  }, [parseResult]);

  // Package Finder results (debug tool - TUGE packages)
  const finderResults = useMemo(() => {
    if (!parseResult?.packages || !showFinderResults) return [];
    
    return parseResult.packages.filter(pkg => {
      const countryMatch = !finderCountry || 
        pkg.country.toLowerCase().includes(finderCountry.toLowerCase());
      const dataMatch = !finderData || 
        pkg.dataAmount.toLowerCase().includes(finderData.toLowerCase());
      const validityMatch = !finderValidity || 
        pkg.validityDays.toString() === finderValidity;
      
      return countryMatch && dataMatch && validityMatch;
    }).slice(0, 20); // Limit results
  }, [parseResult, finderCountry, finderData, finderValidity, showFinderResults]);

  // USIMSA Finder results (debug tool - search loaded USIMSA packages)
  const usimFinderResults = useMemo(() => {
    if (!showUsimFinderResults || usimPackages.length === 0) return [];
    
    return usimPackages.filter(pkg => {
      const countryMatch = !usimFinderCountry || 
        pkg.country_name.toLowerCase().includes(usimFinderCountry.toLowerCase());
      const dataMatch = !usimFinderData || 
        pkg.data_amount.toLowerCase().includes(usimFinderData.toLowerCase());
      const validityMatch = !usimFinderValidity || 
        pkg.validity_days.toString() === usimFinderValidity;
      const typeMatch = !usimFinderType || 
        (pkg.package_type || 'max_speed').toLowerCase().includes(usimFinderType.toLowerCase());
      
      return countryMatch && dataMatch && validityMatch && typeMatch;
    }).slice(0, 30); // Limit results
  }, [usimPackages, usimFinderCountry, usimFinderData, usimFinderValidity, usimFinderType, showUsimFinderResults]);

  // Get comparison breakdown for a specific TUGE package
  const getComparisonBreakdown = useCallback((tugePkg: TugePackage) => {
    const tugeCountryKey = tugePkg.country.toLowerCase().trim();
    let countryMatches = usimByCountry.get(tugeCountryKey) || [];
    
    // Fuzzy country match
    if (countryMatches.length === 0) {
      for (const countryKey of usimCountryKeys) {
        const score = getCountryMatchScore(countryKey, tugeCountryKey);
        if (score >= 0.5) {
          countryMatches = [...countryMatches, ...(usimByCountry.get(countryKey) || [])];
        }
      }
    }

    const tugeValidity = Number(tugePkg.validityDays) || 0;
    const tugeDataNorm = tugePkg.dataAmount.toLowerCase().replace(/\s/g, '');

    // Sort candidates by relevance (matching data, validity, type FIRST)
    const sortedCandidates = [...countryMatches].sort((a, b) => {
      const scoreA = (a.data_amount.toLowerCase().replace(/\s/g, '') === tugeDataNorm ? 3 : 0) +
                     (a.validity_days === tugeValidity ? 3 : 0) +
                     (a.package_type === tugePkg.packageType ? 2 : 0);
      const scoreB = (b.data_amount.toLowerCase().replace(/\s/g, '') === tugeDataNorm ? 3 : 0) +
                     (b.validity_days === tugeValidity ? 3 : 0) +
                     (b.package_type === tugePkg.packageType ? 2 : 0);
      return scoreB - scoreA; // Higher scores first
    });

    const breakdown: { usim: UsimPackage; checks: { label: string; pass: boolean; detail: string }[] }[] = [];
    
    // Show top 5 most relevant candidates
    for (const usim of sortedCandidates.slice(0, 5)) {
      const usimValidity = Number(usim.validity_days) || 0;
      const usimDataNorm = usim.data_amount.toLowerCase().replace(/\s/g, '');
      
      const checks = [
        { 
          label: 'Country', 
          pass: true, 
          detail: `${tugePkg.country} ↔ ${usim.country_name}` 
        },
        { 
          label: 'Data', 
          pass: tugeDataNorm === usimDataNorm, 
          detail: `${tugePkg.dataAmount} ${tugeDataNorm === usimDataNorm ? '=' : '≠'} ${usim.data_amount}` 
        },
        { 
          label: 'Validity', 
          pass: tugeValidity === usimValidity, 
          detail: `${tugeValidity}d ${tugeValidity === usimValidity ? '=' : '≠'} ${usimValidity}d` 
        },
        { 
          label: 'Type', 
          pass: tugePkg.packageType === usim.package_type, 
          detail: `${tugePkg.packageType} ${tugePkg.packageType === usim.package_type ? '=' : '≠'} ${usim.package_type}` 
        },
      ];
      
      breakdown.push({ usim, checks });
    }
    
    // Log for Indonesia 1GB/7d specifically
    if (tugeCountryKey.includes('indonesia') && tugeDataNorm.includes('1gb') && tugeValidity === 7) {
      console.log(`🔍 Indonesia 1GB/7d ${tugePkg.packageType}:`, {
        totalCandidates: countryMatches.length,
        topMatch: sortedCandidates[0] ? `${sortedCandidates[0].data_amount}/${sortedCandidates[0].validity_days}d ${sortedCandidates[0].package_type} @ $${sortedCandidates[0].cost_price}` : 'none'
      });
    }
    
    return { breakdown, totalCandidates: countryMatches.length };
  }, [usimByCountry, usimCountryKeys]);

  // Get unique values for filters
  const countries = parseResult ? getUniqueCountries(parseResult.packages) : [];
  const carriers = parseResult ? getUniqueCarriers(parseResult.packages) : [];

  // Export to CSV
  const handleExport = useCallback(() => {
    const headers = [
      'Country', 'TUGE Carrier', 'USIMSA Carrier', 'Match Type', 'Package Type',
      'Data Amount', 'Validity (Days)', 'TUGE Cost ($)', 'USIMSA Cost ($)',
      'TUGE $/GB', 'USIMSA $/GB', 'Difference ($)', 'Difference (%)', 'Cheaper Provider'
    ];

    const rows = filteredComparisons.map(comp => [
      comp.tugePackage.country,
      comp.tugePackage.carrier,
      comp.usimPackage?.carrier || 'N/A',
      comp.matchResult.matchType,
      comp.tugePackage.packageType,
      comp.tugePackage.dataAmount,
      comp.tugePackage.validityDays,
      comp.tugePackage.b2bPrice.toFixed(2),
      comp.usimPackage?.cost_price?.toFixed(2) || 'N/A',
      comp.tugePackage.costPerGb?.toFixed(2) || 'N/A',
      comp.usimPackage?.cost_price_per_gb?.toFixed(2) || 'N/A',
      comp.priceDifference.toFixed(2),
      comp.percentageDifference.toFixed(1) + '%',
      comp.cheaperProvider,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tuge-usimsa-comparison-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredComparisons]);

  // Get packages available for import (no_match only)
  // Get all selected packages for import (now allows ALL packages, not just no_match)
  const importablePackages = useMemo(() => {
    return comparisons
      .filter(c => selectedForImport.has(c.tugePackage.optionId))
      .map(c => c.tugePackage);
  }, [comparisons, selectedForImport]);

  // Get all no_match packages for stats display
  const noMatchPackages = useMemo(() => {
    return comparisons.filter(c => c.matchResult.matchType === 'no_match');
  }, [comparisons]);

  // Handle select all packages for import (selects ALL TUGE packages, not just no_match)
  const handleSelectAllForImport = useCallback((checked: boolean) => {
    if (checked) {
      // Select ALL packages from TUGE file for import
      const allIds = comparisons.map(c => c.tugePackage.optionId);
      setSelectedForImport(new Set(allIds));
    } else {
      setSelectedForImport(new Set());
    }
  }, [comparisons]);

  // Toggle single package selection
  const togglePackageSelection = useCallback((optionId: string) => {
    setSelectedForImport(prev => {
      const next = new Set(prev);
      if (next.has(optionId)) {
        next.delete(optionId);
      } else {
        next.add(optionId);
      }
      return next;
    });
  }, []);

  // Generate package name for import
  const generatePackageName = useCallback((pkg: TugePackage): string => {
    const days = pkg.validityDays;
    const data = pkg.dataAmount;
    
    if (pkg.packageType === 'day_pass') {
      return `${pkg.country} ${days} days, ${data}/day`;
    } else if (pkg.packageType === 'limitless') {
      return `${pkg.country} ${days} days, Unlimited`;
    } else {
      return `${pkg.country} ${days} days, ${data}`;
    }
  }, []);

  // Generate description for import
  const generateDescription = useCallback((pkg: TugePackage): string => {
    const carrier = pkg.carrier || 'Local carrier';
    const network = pkg.networkType || '4G/5G';
    return `${carrier} ${network} coverage in ${pkg.country}. ${pkg.dataAmount} data valid for ${pkg.validityDays} days.`;
  }, []);

  // Import packages to database
  const handleImportPackages = useCallback(async (settings: ImportSettings) => {
    setIsImporting(true);
    
    try {
      // Import all selected packages (regardless of match type - they're different carriers)
      const packagesToImport = comparisons
        .filter(c => selectedForImport.has(c.tugePackage.optionId))
        .map(c => c.tugePackage);
      
      if (packagesToImport.length === 0) {
        toast.error('No packages selected for import');
        return;
      }
      
      // Limit batch size to 100
      if (packagesToImport.length > 100) {
        toast.error(`Please select at most 100 packages at a time. Currently selected: ${packagesToImport.length}`);
        return;
      }
      
      const insertData = packagesToImport.map(pkg => {
        const retailPrice = pkg.b2bPrice * (1 + settings.markupPercentage / 100);
        const carrierName = settings.carrierOverride || pkg.carrier;
        
        // Determine field mapping based on package type
        let qos_speed: string | null = null;
        let speed_after_limit: string | null = null;
        
        if (pkg.packageType === 'day_pass') {
          // For day_pass: qosSpeed is the backup/throttle speed after daily limit
          speed_after_limit = settings.qosSpeedOverride || pkg.qosSpeed || null;
          qos_speed = null;
        } else if (pkg.packageType === 'limitless') {
          // For limitless: Set a default qos_speed for display
          qos_speed = settings.qosSpeedOverride || pkg.qosSpeed || 'Unlimited';
          speed_after_limit = null;
        } else {
          // For max_speed: No throttle, data expires when used
          qos_speed = settings.qosSpeedOverride || pkg.qosSpeed || null;
          speed_after_limit = null;
        }
        
        return {
          package_id: pkg.optionId,
          name: generatePackageName(pkg),
          description: generateDescription(pkg),
          country_code: getCountryCode(pkg.country),
          country_name: pkg.country,
          carrier: carrierName,
          package_type: pkg.packageType,
          data_amount: pkg.dataAmount,
          validity_days: pkg.validityDays,
          cost_price: pkg.b2bPrice,
          price: parseFloat(retailPrice.toFixed(2)),
          currency: 'USD',
          qos_speed,
          speed_after_limit,
          network_type: settings.networkType,
          is_active: settings.isActive,
          provider_id: TUGE_PROVIDER_ID,
          normal_price: pkg.normalPrice || 0,
          min_sell_price: pkg.minSellPrice || 0,
          daily_data_reset: pkg.packageType === 'day_pass',
          daily_reset_amount: pkg.packageType === 'day_pass' ? pkg.dataAmount : null,
        };
      });
      
      // Batch upsert (handle duplicates by package_id)
      const { data, error } = await supabase
        .from('esim_packages')
        .upsert(insertData, { onConflict: 'package_id' })
        .select();
      
      if (error) {
        console.error('Import error:', error);
        toast.error(`Import failed: ${error.message}`);
      } else {
        toast.success(`Successfully imported ${data?.length || 0} packages to database`);
        setSelectedForImport(new Set());
        // Refresh USIMSA packages to include newly imported ones
        queryClient.invalidateQueries({ queryKey: ['usimsa-packages-paginated'] });
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import packages');
    } finally {
      setIsImporting(false);
      setShowImportDialog(false);
    }
  }, [comparisons, selectedForImport, generatePackageName, generateDescription, queryClient]);

  const getMatchIcon = (matchType: string) => {
    switch (matchType) {
      case 'exact': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'carrier_fuzzy': return <HelpCircle className="h-4 w-4 text-yellow-500" />;
      case 'country_only': return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default: return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getWinnerBadge = (provider: string) => {
    switch (provider) {
      case 'tuge':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600"><TrendingDown className="h-3 w-3 mr-1" />TUGE</Badge>;
      case 'usimsa':
        return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600"><TrendingUp className="h-3 w-3 mr-1" />USIMSA</Badge>;
      case 'equal':
        return <Badge variant="secondary"><Equal className="h-3 w-3 mr-1" />Equal</Badge>;
      default:
        return <Badge variant="outline">N/A</Badge>;
    }
  };

  // Determine if we need to show debug/mapping tools
  const needsManualMapping = parseResult && parseResult.packages.length === 0 && parseResult.rawData && parseResult.rawData.length > 0;
  const hasColumnMap = parseResult?.columnMap && Object.keys(parseResult.columnMap).length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">TUGE vs USIMSA Price Comparison</h1>
          <p className="text-muted-foreground">
            Upload TUGE Excel file to compare wholesale pricing with USIMSA packages
          </p>
        </div>
        
        {/* Debug Mode Toggle */}
        <div className="flex items-center gap-2">
          <Switch
            id="debug-mode"
            checked={debugMode}
            onCheckedChange={setDebugMode}
          />
          <Label htmlFor="debug-mode" className="text-sm cursor-pointer">
            Debug Mode
          </Label>
        </div>
      </div>

      {/* File Upload */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Upload and Load Saved Row */}
            <div className="flex items-stretch gap-4">
              {/* Upload New File */}
              <label
                htmlFor="file-upload"
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                  "hover:border-primary hover:bg-muted/50",
                  (isUploading || loadingSavedFile) && "opacity-50 pointer-events-none"
                )}
              >
                <Upload className="h-6 w-6 text-muted-foreground" />
                <div className="text-center">
                  <p className="font-medium text-sm">Upload New File</p>
                  <p className="text-xs text-muted-foreground">.xlsx, .xls</p>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading || loadingSavedFile}
                />
              </label>
              
              {/* OR Divider */}
              <div className="flex items-center">
                <span className="text-xs text-muted-foreground px-2">OR</span>
              </div>
              
              {/* Load Saved File */}
              <div className="flex-1 flex flex-col gap-2">
                <Select 
                  value={currentFileId || ''} 
                  onValueChange={handleLoadSavedFile}
                  disabled={loadingSavedFile || isUploading}
                >
                  <SelectTrigger className="h-auto min-h-[80px]">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-5 w-5 text-muted-foreground" />
                      <div className="text-left">
                        <p className="font-medium text-sm">
                          {loadingSavedFile ? 'Loading...' : 'Load Saved File'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {savedFilesData?.length || 0} saved files
                        </p>
                      </div>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {!savedFilesData?.length ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        No saved files
                      </div>
                    ) : (
                      savedFilesData.map(file => (
                        <SelectItem key={file.id} value={file.id}>
                          <div className="flex items-center justify-between gap-4 w-full">
                            <div>
                              <span className="font-medium">{file.file_name}</span>
                              <span className="text-muted-foreground ml-2 text-xs">
                                ({file.packages_count} packages)
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(file.uploaded_at).toLocaleDateString()}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Current File Info */}
              {parseResult && (
                <div className="flex flex-col items-center gap-2 p-4 bg-muted/50 rounded-lg min-w-[180px]">
                  <FileSpreadsheet className="h-6 w-6 text-primary" />
                  <div className="text-center">
                    <p className="font-medium text-sm">{parseResult.sheetName}</p>
                    <p className="text-xs text-muted-foreground">
                      {parseResult.parsedRows} / {parseResult.totalRows} rows
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {/* Save Button */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleSaveFile}
                      disabled={isSavingFile || !uploadedFileRef.current}
                      className="h-7 text-xs"
                    >
                      {isSavingFile ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <Save className="h-3 w-3 mr-1" />
                          Save
                        </>
                      )}
                    </Button>
                    {/* Delete Button (only if loaded from saved) */}
                    {currentFileId && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteSavedFile(currentFileId)}
                        className="h-7 text-xs text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Parse errors */}
          {parseResult?.errors.length ? (
            <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              <p className="font-medium">Parse Errors:</p>
              <ul className="list-disc list-inside">
                {parseResult.errors.slice(0, 5).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {parseResult.errors.length > 5 && (
                  <li>...and {parseResult.errors.length - 5} more</li>
                )}
              </ul>
            </div>
          ) : null}

          {/* Manual mapping prompt */}
          {needsManualMapping && (
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    Could not auto-detect column mapping
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    The Excel file format wasn't recognized. Please use manual column mapping to specify which columns contain the required data.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => setShowColumnMapper(true)}
                  >
                    <Settings2 className="h-4 w-4 mr-2" />
                    Map Columns Manually
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Progress */}
      {isProcessing && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-2">
                  <span>Processing comparisons...</span>
                  <span>{processProgress}%</span>
                </div>
                <Progress value={processProgress} className="h-2" />
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => { processingCancelRef.current = true; }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Panel */}
      {debugMode && parseResult && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="h-4 w-4" /> Debug: Excel Preview & Column Mapping
              </CardTitle>
              <div className="flex items-center gap-3">
                {/* Sheet selector with current sheet info */}
                {parseResult.availableSheets && parseResult.availableSheets.length > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Sheet:</span>
                    <Select value={selectedSheet} onValueChange={handleSheetChange}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select sheet" />
                      </SelectTrigger>
                      <SelectContent>
                        {parseResult.availableSheets.map(sheet => (
                          <SelectItem key={sheet} value={sheet}>
                            {sheet} {sheet === selectedSheet && `(${parseResult.packages.length} packages)`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowColumnMapper(true)}
                >
                  <Settings2 className="h-4 w-4 mr-2" />
                  Edit Column Mapping
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* USIMSA Load Status */}
            <div className={cn(
              "p-3 rounded-lg",
              usimPackages.length < usimTotalCount 
                ? "bg-red-500/10 border border-red-500/30" 
                : "bg-green-500/10 border border-green-500/30"
            )}>
              <p className="text-sm font-medium mb-2">
                {usimPackages.length < usimTotalCount ? '⚠️' : '✅'} USIMSA Database Status:
              </p>
              <div className="flex flex-wrap gap-4 text-xs">
                <span>Loaded: <strong>{usimPackages.length.toLocaleString()}</strong></span>
                <span>Total Active: <strong>{usimTotalCount.toLocaleString()}</strong></span>
                <span>Countries: <strong>{usimByCountry.size}</strong></span>
                {usimPackages.length < usimTotalCount && (
                  <span className="text-red-600 font-medium">
                    ⚠️ TRUNCATED! Matching may be incorrect.
                  </span>
                )}
              </div>
            </div>

            {/* Package Type Breakdown */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-2">📦 Parsed Package Types:</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">
                  max_speed: {typeBreakdown.max_speed}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  day_pass: {typeBreakdown.day_pass}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  limitless: {typeBreakdown.limitless}
                </Badge>
              </div>
            </div>

            {/* Skipped Rows Summary with Details */}
            {parseResult.skippedRows && parseResult.skippedRows.total > 0 && (
              <SkippedRowsDetails skippedRows={parseResult.skippedRows} />
            )}

            {/* Package Finder Tool */}
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm font-medium mb-3">🔍 Package Finder (search parsed TUGE packages):</p>
              <div className="flex flex-wrap gap-2 mb-3">
                <div className="flex-1 min-w-[120px]">
                  <Input
                    placeholder="Country (e.g. Indonesia)"
                    value={finderCountry}
                    onChange={(e) => setFinderCountry(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="w-24">
                  <Input
                    placeholder="Data (1GB)"
                    value={finderData}
                    onChange={(e) => setFinderData(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="w-20">
                  <Input
                    placeholder="Days"
                    value={finderValidity}
                    onChange={(e) => setFinderValidity(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <Button 
                  size="sm" 
                  className="h-8"
                  onClick={() => setShowFinderResults(true)}
                  disabled={!finderCountry && !finderData && !finderValidity}
                >
                  <Search className="h-3 w-3 mr-1" />
                  Find
                </Button>
                {showFinderResults && (
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="h-8"
                    onClick={() => {
                      setShowFinderResults(false);
                      setFinderCountry('');
                      setFinderData('');
                      setFinderValidity('');
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              
              {/* Finder Results */}
{showFinderResults && (
                <div className="space-y-2">
                  {finderResults.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No packages found matching criteria</p>
                  ) : (
                    <>
                      <p className="text-xs text-muted-foreground">Found {finderResults.length} package(s):</p>
                      <div className="max-h-[300px] overflow-auto space-y-2">
                        {finderResults.map((pkg, idx) => {
                          const { breakdown, totalCandidates } = getComparisonBreakdown(pkg);
                          const matchingUsim = comparisons.find(c => c.tugePackage.optionId === pkg.optionId)?.usimPackage;
                          
                          return (
                            <div key={idx} className="p-2 bg-background rounded border text-xs">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="font-medium">{pkg.country}</span>
                                  <span className="mx-1">|</span>
                                  <span>{pkg.dataAmount}</span>
                                  <span className="mx-1">|</span>
                                  <span>{pkg.validityDays}d</span>
                                  <span className="mx-1">|</span>
                                  <Badge variant="outline" className="text-[10px] py-0">{pkg.packageType}</Badge>
                                </div>
                                <span className="font-mono font-medium">${pkg.b2bPrice.toFixed(2)}</span>
                              </div>
                              <div className="text-muted-foreground mt-1">
                                Carrier: {pkg.carrier} | ID: {pkg.optionId} | <span className="text-blue-500">{totalCandidates} USIMSA candidates</span>
                              </div>
                              
                              {/* Comparison breakdown */}
                              {breakdown.length > 0 && (
                                <div className="mt-2 pt-2 border-t">
                                  <p className="font-medium mb-1">USIMSA Comparison (top 5 by relevance):</p>
                                  {matchingUsim ? (
                                    <div className="text-green-600 dark:text-green-400">
                                      ✓ Match: {matchingUsim.carrier} @ ${matchingUsim.cost_price?.toFixed(2) || 'N/A'}
                                    </div>
                                  ) : (
                                    <div className="space-y-1">
                                      <p className="text-yellow-600 dark:text-yellow-400">No match found. Closest candidates:</p>
                                      {breakdown.map((b, bIdx) => (
                                        <div key={bIdx} className="pl-2 border-l-2 border-muted">
                                          <div className="flex flex-wrap gap-1">
                                            {b.checks.map((c, cIdx) => (
                                              <span key={cIdx} className={c.pass ? 'text-green-600' : 'text-red-500'}>
                                                {c.pass ? '✓' : '✗'} {c.label}: {c.detail}
                                              </span>
                                            ))}
                                          </div>
                                          <div className="text-muted-foreground mt-0.5">
                                            → {b.usim.carrier} @ ${b.usim.cost_price?.toFixed(2) || 'N/A'}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* USIMSA Finder Tool - Search loaded USIMSA packages */}
            <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <p className="text-sm font-medium mb-3">🗄️ USIMSA Finder (search loaded database packages):</p>
              <div className="flex flex-wrap gap-2 mb-3">
                <div className="flex-1 min-w-[120px]">
                  <Input
                    placeholder="Country (e.g. Indonesia)"
                    value={usimFinderCountry}
                    onChange={(e) => setUsimFinderCountry(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="w-24">
                  <Input
                    placeholder="Data (1GB)"
                    value={usimFinderData}
                    onChange={(e) => setUsimFinderData(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="w-20">
                  <Input
                    placeholder="Days"
                    value={usimFinderValidity}
                    onChange={(e) => setUsimFinderValidity(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="w-28">
                  <Input
                    placeholder="Type"
                    value={usimFinderType}
                    onChange={(e) => setUsimFinderType(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <Button 
                  size="sm" 
                  className="h-8"
                  onClick={() => setShowUsimFinderResults(true)}
                  disabled={!usimFinderCountry && !usimFinderData && !usimFinderValidity && !usimFinderType}
                >
                  <Search className="h-3 w-3 mr-1" />
                  Find
                </Button>
                {showUsimFinderResults && (
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="h-8"
                    onClick={() => {
                      setShowUsimFinderResults(false);
                      setUsimFinderCountry('');
                      setUsimFinderData('');
                      setUsimFinderValidity('');
                      setUsimFinderType('');
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              
              {/* USIMSA Finder Results */}
              {showUsimFinderResults && (
                <div className="space-y-2">
                  {usimFinderResults.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No USIMSA packages found matching criteria in loaded data</p>
                  ) : (
                    <>
                      <p className="text-xs text-muted-foreground">
                        Found {usimFinderResults.length} package(s) in loaded USIMSA data:
                      </p>
                      <div className="max-h-[200px] overflow-auto space-y-1">
                        {usimFinderResults.map((pkg, idx) => (
                          <div key={idx} className="p-2 bg-background rounded border text-xs flex justify-between items-center">
                            <div>
                              <span className="font-medium">{pkg.country_name}</span>
                              <span className="mx-1">|</span>
                              <span>{pkg.data_amount}</span>
                              <span className="mx-1">|</span>
                              <span>{pkg.validity_days}d</span>
                              <span className="mx-1">|</span>
                              <Badge variant="outline" className="text-[10px] py-0">{pkg.package_type || 'max_speed'}</Badge>
                              <span className="ml-2 text-muted-foreground">{pkg.carrier}</span>
                            </div>
                            <span className="font-mono font-medium text-green-600">
                              ${pkg.cost_price?.toFixed(2) || 'N/A'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Detected columns:</span>
              {hasColumnMap ? (
                Object.entries(parseResult.columnMap!).map(([field, col]) => (
                  <Badge key={field} variant="secondary" className="text-xs">
                    {field}: Col {col}
                  </Badge>
                ))
              ) : (
                <Badge variant="destructive" className="text-xs">No columns mapped</Badge>
              )}
            </div>

            {/* Preview toggle */}
            <Collapsible open={showPreview} onOpenChange={setShowPreview}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between">
                  <span>Raw Excel Data (First 10 rows)</span>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", showPreview && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                {parseResult.rawData && parseResult.rawData.length > 0 && (
                  <ExcelPreviewTable
                    data={parseResult.rawData}
                    headerRowIndex={parseResult.headerRowIndex ?? -1}
                    columnMap={parseResult.columnMap ?? {}}
                    maxRows={10}
                  />
                )}
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      )}

      {/* Column Mapper Dialog */}
      {parseResult?.rawData && parseResult.rawData.length > 0 && (
        <ColumnMapperDialog
          open={showColumnMapper}
          onOpenChange={setShowColumnMapper}
          headerRow={parseResult.rawData[parseResult.headerRowIndex ?? 0] ?? []}
          detectedMapping={parseResult.columnMap ?? {}}
          onConfirmMapping={handleColumnMappingConfirm}
        />
      )}

      {/* Statistics */}
      {parseResult && parseResult.packages.length > 0 && !isProcessing && comparisons.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Total Analyzed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-500">{stats.tugeWins}</div>
              <p className="text-xs text-muted-foreground">TUGE Cheaper</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-500">{stats.usimWins}</div>
              <p className="text-xs text-muted-foreground">USIMSA Cheaper</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.exactMatch}</div>
              <p className="text-xs text-muted-foreground">Exact Matches</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-orange-500">{stats.noMatch}</div>
              <p className="text-xs text-muted-foreground">No Match</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      {parseResult && parseResult.packages.length > 0 && !isProcessing && comparisons.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="h-4 w-4" /> Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48"
              />
              
              <Select value={filterCountry} onValueChange={setFilterCountry}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {countries.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterCarrier} onValueChange={setFilterCarrier}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Carrier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Carriers</SelectItem>
                  {carriers.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="max_speed">Max Speed</SelectItem>
                  <SelectItem value="day_pass">Day Pass</SelectItem>
                  <SelectItem value="limitless">Limitless</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterMatch} onValueChange={setFilterMatch}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Match" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Matches</SelectItem>
                  <SelectItem value="exact">Exact</SelectItem>
                  <SelectItem value="carrier_fuzzy">Fuzzy</SelectItem>
                  <SelectItem value="country_only">Country Only</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterShow} onValueChange={(v) => setFilterShow(v as FilterShow)}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Show" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Show All</SelectItem>
                  <SelectItem value="tuge_wins">TUGE Wins</SelectItem>
                  <SelectItem value="usimsa_wins">USIMSA Wins</SelectItem>
                  <SelectItem value="no_match">No Match</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2 ml-auto">
                {/* Select All for Import checkbox */}
                {comparisons.length > 0 && (
                  <div className="flex items-center gap-2 mr-4">
                    <Checkbox
                      id="select-all-for-import"
                      checked={selectedForImport.size === comparisons.length && comparisons.length > 0}
                      onCheckedChange={(checked) => handleSelectAllForImport(checked === true)}
                    />
                    <Label htmlFor="select-all-for-import" className="text-sm cursor-pointer">
                      Select All ({comparisons.length})
                    </Label>
                  </div>
                )}
                
                {/* Import Button */}
                <Button 
                  onClick={() => setShowImportDialog(true)}
                  disabled={selectedForImport.size === 0}
                >
                  <Database className="h-4 w-4 mr-2" />
                  Import {selectedForImport.size > 0 ? `${selectedForImport.size} ` : ''}to DB
                </Button>
                
                <Button variant="outline" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison Table */}
      {parseResult && parseResult.packages.length > 0 && !isProcessing && comparisons.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Comparison Results ({filteredComparisons.length} packages)
              </CardTitle>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>TUGE Carrier</TableHead>
                    <TableHead>USIMSA Carrier</TableHead>
                    <TableHead>Match</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead className="text-right">TUGE $</TableHead>
                    <TableHead className="text-right">USIMSA $</TableHead>
                    <TableHead className="text-right">T $/GB</TableHead>
                    <TableHead className="text-right">U $/GB</TableHead>
                    <TableHead className="text-right">Diff</TableHead>
                    <TableHead>Winner</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedComparisons.map((comp, i) => {
                    const isNoMatch = comp.matchResult.matchType === 'no_match';
                    const isSelected = selectedForImport.has(comp.tugePackage.optionId);
                    
                    return (
                      <TableRow 
                        key={`${comp.tugePackage.optionId}-${i}`}
                        className={cn(
                          comp.cheaperProvider === 'tuge' && 'bg-green-500/5',
                          comp.cheaperProvider === 'usimsa' && 'bg-blue-500/5',
                          isSelected && 'bg-primary/10'
                        )}
                      >
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => togglePackageSelection(comp.tugePackage.optionId)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{comp.tugePackage.country}</TableCell>
                        <TableCell>{comp.tugePackage.carrier}</TableCell>
                        <TableCell>{comp.usimPackage?.carrier || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getMatchIcon(comp.matchResult.matchType)}
                          <span className="text-xs capitalize">{comp.matchResult.matchType.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{comp.tugePackage.packageType}</Badge>
                      </TableCell>
                      <TableCell>{comp.tugePackage.dataAmount}</TableCell>
                      <TableCell>{comp.tugePackage.validityDays}</TableCell>
                      <TableCell className="text-right font-mono">${comp.tugePackage.b2bPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono">
                        {comp.usimPackage?.cost_price ? `$${comp.usimPackage.cost_price.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {comp.tugePackage.costPerGb ? `$${comp.tugePackage.costPerGb.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {comp.usimPackage?.cost_price_per_gb ? `$${comp.usimPackage.cost_price_per_gb.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-mono",
                        comp.priceDifference < 0 ? 'text-green-600' : comp.priceDifference > 0 ? 'text-red-600' : ''
                      )}>
                        {comp.usimPackage ? `${comp.priceDifference > 0 ? '+' : ''}$${comp.priceDifference.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell>{getWinnerBadge(comp.cheaperProvider)}</TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            
            {/* Bottom Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredComparisons.length)} of {filteredComparisons.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {isLoadingUsim && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-pulse text-muted-foreground">Loading USIMSA packages...</div>
        </div>
      )}

      {/* Empty state */}
      {!parseResult && !isUploading && (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Upload a TUGE Excel file to start comparing prices</p>
          </div>
        </Card>
      )}

      {/* Import Packages Dialog */}
      <ImportPackagesDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        packages={importablePackages}
        onConfirm={handleImportPackages}
        isImporting={isImporting}
      />
    </div>
  );
}
