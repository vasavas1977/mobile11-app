import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ExcelPreviewTableProps {
  data: any[][];
  headerRowIndex: number;
  columnMap: Record<string, number>;
  maxRows?: number;
}

const REQUIRED_FIELDS = ['optionId', 'country', 'b2bPrice'];
const OPTIONAL_FIELDS = ['carrier', 'data', 'validity', 'normalPrice', 'minSellPrice', 'qosSpeed', 'networkType'];

export function ExcelPreviewTable({ 
  data, 
  headerRowIndex, 
  columnMap,
  maxRows = 10 
}: ExcelPreviewTableProps) {
  if (!data.length) return null;

  // Get column indices that are mapped
  const mappedColumns = new Set(Object.values(columnMap));
  
  // Reverse map: column index -> field name
  const columnToField: Record<number, string> = {};
  Object.entries(columnMap).forEach(([field, index]) => {
    columnToField[index] = field;
  });

  // Determine which columns to show (first 15 or all if less)
  const maxCols = Math.min(15, data[0]?.length || 0);
  const rowsToShow = data.slice(0, Math.min(maxRows, data.length));

  const getFieldBadge = (colIndex: number) => {
    const field = columnToField[colIndex];
    if (!field) return null;
    
    const isRequired = REQUIRED_FIELDS.includes(field);
    return (
      <Badge 
        variant={isRequired ? "default" : "secondary"} 
        className={cn(
          "text-xs ml-1",
          isRequired && "bg-green-500 hover:bg-green-600"
        )}
      >
        {field}
      </Badge>
    );
  };

  return (
    <div className="border rounded-lg overflow-auto max-h-[400px]">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            <TableHead className="w-12 text-center font-mono text-xs">Row</TableHead>
            {Array.from({ length: maxCols }).map((_, i) => (
              <TableHead 
                key={i} 
                className={cn(
                  "min-w-[120px] text-xs",
                  mappedColumns.has(i) && "bg-primary/10"
                )}
              >
                <div className="flex items-center gap-1">
                  <span className="font-mono text-muted-foreground">Col {i}</span>
                  {getFieldBadge(i)}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rowsToShow.map((row, rowIndex) => (
            <TableRow 
              key={rowIndex}
              className={cn(
                rowIndex === headerRowIndex && "bg-yellow-100 dark:bg-yellow-900/30 font-medium"
              )}
            >
              <TableCell className="text-center font-mono text-xs text-muted-foreground">
                {rowIndex}
                {rowIndex === headerRowIndex && (
                  <Badge variant="outline" className="ml-1 text-xs">Header</Badge>
                )}
              </TableCell>
              {Array.from({ length: maxCols }).map((_, colIndex) => (
                <TableCell 
                  key={colIndex}
                  className={cn(
                    "text-sm truncate max-w-[200px]",
                    mappedColumns.has(colIndex) && "bg-primary/5"
                  )}
                  title={String(row[colIndex] ?? '')}
                >
                  {String(row[colIndex] ?? '').slice(0, 50) || <span className="text-muted-foreground italic">empty</span>}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
