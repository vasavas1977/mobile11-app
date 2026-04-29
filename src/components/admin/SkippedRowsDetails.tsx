import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle, Filter, X } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { SkippedRowDetail } from '@/lib/tugeExcelParser';

interface SkippedRowsProps {
  skippedRows: {
    total: number;
    missingCountry: number;
    missingPrice: number;
    emptyRow: number;
    parseError?: number;
    details: SkippedRowDetail[];
  };
}

const REASON_LABELS: Record<SkippedRowDetail['reason'], string> = {
  missing_country: 'Missing Country',
  missing_price: 'Missing/Zero Price',
  empty_row: 'Empty Row',
  parse_error: 'Parse Error',
};

const REASON_COLORS: Record<SkippedRowDetail['reason'], string> = {
  missing_country: 'bg-orange-500/10 text-orange-700 border-orange-500/30',
  missing_price: 'bg-red-500/10 text-red-700 border-red-500/30',
  empty_row: 'bg-muted text-muted-foreground border-muted-foreground/30',
  parse_error: 'bg-destructive/10 text-destructive border-destructive/30',
};

export function SkippedRowsDetails({ skippedRows }: SkippedRowsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterReason, setFilterReason] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDetails = useMemo(() => {
    let details = skippedRows.details;

    // Filter by reason
    if (filterReason !== 'all') {
      details = details.filter(d => d.reason === filterReason);
    }

    // Filter by search query (searches country and data field)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      details = details.filter(d =>
        (d.country?.toLowerCase().includes(query)) ||
        (d.dataField?.toLowerCase().includes(query)) ||
        (d.price?.toLowerCase().includes(query))
      );
    }

    return details;
  }, [skippedRows.details, filterReason, searchQuery]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        {/* Summary Header - Always Visible */}
        <CollapsibleTrigger asChild>
          <button className="w-full text-left flex items-center justify-between hover:bg-yellow-500/5 -m-1 p-1 rounded transition-colors">
            <div>
              <p className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                Skipped Rows: {skippedRows.total}
              </p>
              <div className="flex flex-wrap gap-2 text-xs mt-1 text-muted-foreground">
                <span>Missing Country: {skippedRows.missingCountry}</span>
                <span>•</span>
                <span>Missing/Zero Price: {skippedRows.missingPrice}</span>
                <span>•</span>
                <span>Empty Rows: {skippedRows.emptyRow}</span>
                {skippedRows.parseError !== undefined && skippedRows.parseError > 0 && (
                  <>
                    <span>•</span>
                    <span>Parse Errors: {skippedRows.parseError}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {skippedRows.details.length > 0 && (
                <span>({skippedRows.details.length} with details)</span>
              )}
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        {/* Expandable Details */}
        <CollapsibleContent>
          {skippedRows.details.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-3">No detailed information available for skipped rows.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {/* Filters */}
              <div className="flex flex-wrap gap-2 items-center">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filterReason} onValueChange={setFilterReason}>
                  <SelectTrigger className="h-8 w-[160px] text-xs">
                    <SelectValue placeholder="Filter by reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reasons</SelectItem>
                    <SelectItem value="missing_country">Missing Country</SelectItem>
                    <SelectItem value="missing_price">Missing/Zero Price</SelectItem>
                    <SelectItem value="empty_row">Empty Row</SelectItem>
                    <SelectItem value="parse_error">Parse Error</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex-1 min-w-[150px] max-w-[250px]">
                  <Input
                    placeholder="Search country, data, price..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                {(filterReason !== 'all' || searchQuery) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => {
                      setFilterReason('all');
                      setSearchQuery('');
                    }}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
                <span className="text-xs text-muted-foreground ml-auto">
                  Showing {filteredDetails.length} of {skippedRows.details.length}
                </span>
              </div>

              {/* Details Table */}
              <ScrollArea className="h-[300px] border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px] text-xs">Row #</TableHead>
                      <TableHead className="w-[130px] text-xs">Reason</TableHead>
                      <TableHead className="w-[120px] text-xs">Country</TableHead>
                      <TableHead className="w-[80px] text-xs">Price</TableHead>
                      <TableHead className="w-[140px] text-xs">Data Field</TableHead>
                      <TableHead className="text-xs">Raw Data (first 5 cols)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDetails.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground text-sm py-8">
                          No rows match your filter criteria
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDetails.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono text-xs">{row.rowIndex}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs ${REASON_COLORS[row.reason]}`}>
                              {REASON_LABELS[row.reason]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {row.country || <span className="text-muted-foreground italic">(empty)</span>}
                          </TableCell>
                          <TableCell className="text-xs font-mono">
                            {row.price || <span className="text-muted-foreground italic">-</span>}
                          </TableCell>
                          <TableCell className="text-xs truncate max-w-[140px]" title={row.dataField}>
                            {row.dataField || <span className="text-muted-foreground italic">-</span>}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground truncate max-w-[200px]" title={row.rawData.slice(0, 5).join(' | ')}>
                            {row.rawData.slice(0, 5).map((cell, i) => (
                              <span key={i}>
                                {i > 0 && ' | '}
                                {cell === null || cell === undefined || cell === '' ? '∅' : String(cell).slice(0, 15)}
                              </span>
                            ))}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
