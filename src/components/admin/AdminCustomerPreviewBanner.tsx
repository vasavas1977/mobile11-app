import { Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useParams } from 'react-router-dom';

interface AdminCustomerPreviewBannerProps {
  customerName: string | null;
  customerEmail: string | null;
}

export function AdminCustomerPreviewBanner({ customerName, customerEmail }: AdminCustomerPreviewBannerProps) {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  
  const displayName = customerName || customerEmail || 'Customer';

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Eye className="w-5 h-5" />
          <span className="font-medium">
            Viewing as: <span className="font-bold">{displayName}</span>
            {customerEmail && customerName && (
              <span className="opacity-80 ml-2">({customerEmail})</span>
            )}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/admin/users/${userId}`)}
          className="text-white hover:bg-orange-600 gap-2"
        >
          <X className="w-4 h-4" />
          Exit Preview
        </Button>
      </div>
    </div>
  );
}
