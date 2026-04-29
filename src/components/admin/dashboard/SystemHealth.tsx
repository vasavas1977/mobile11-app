import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Clock } from 'lucide-react';

interface SystemHealthProps {
  activePackages: number;
  totalPackages: number;
}

export function SystemHealth({ activePackages, totalPackages }: SystemHealthProps) {
  const inactivePackages = totalPackages - activePackages;
  
  return (
    <Card className="border-[#F3F0EB] bg-white shadow-sm rounded-2xl">
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="flex items-center gap-1 bg-emerald-50 border-emerald-200">
            <CheckCircle className="h-3 w-3 text-emerald-600" />
            <span className="text-emerald-700">Stripe Connected</span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 border-blue-200">
            <CheckCircle className="h-3 w-3 text-blue-600" />
            <span className="text-blue-700">Email Active</span>
          </Badge>
          {inactivePackages > 0 && (
            <Badge variant="outline" className="flex items-center gap-1 bg-orange-50 border-orange-200">
              <AlertTriangle className="h-3 w-3 text-orange-600" />
              <span className="text-orange-700">{inactivePackages} Inactive Packages</span>
            </Badge>
          )}
          <Badge variant="outline" className="flex items-center gap-1 bg-[#FAF7F2] border-[#F3F0EB]">
            <Clock className="h-3 w-3 text-[#9CA3AF]" />
            <span className="text-[#9CA3AF]">Updated 1m ago</span>
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
