import { useLocation, useNavigate } from 'react-router-dom';
import { Users, Smartphone, ArrowLeft, History, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OrganizationSwitcher } from './OrganizationSwitcher';
import { OrganizationCreditBalance } from './OrganizationCreditBalance';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { useBusinessCart } from '@/contexts/BusinessCartContext';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/business/team', label: 'Team', icon: Users },
  { path: '/business/esims', label: 'eSIMs', icon: Smartphone },
  { path: '/business/transactions', label: 'Credit', icon: History },
];

export function BusinessPortalNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentOrg } = useOrganizationContext();
  const { totalItems } = useBusinessCart();
  
  return (
    <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14 gap-2">
          {/* Left: Back button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate('/business')}
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 gap-2 flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Business</span>
          </Button>
          
          {/* Center: Nav tabs */}
          <nav className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
            {navItems.map(item => {
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "gap-2 rounded-md transition-all",
                    isActive 
                      ? "bg-orange-500 text-white hover:bg-orange-600 hover:text-white" 
                      : "text-gray-600 hover:text-gray-900 hover:bg-white"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Button>
              );
            })}
          </nav>
          
          {/* Right: Cart + Credit balance + Org switcher */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Cart Icon */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/business/cart')}
              className="relative text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-orange-500 text-white text-xs rounded-full">
                  {totalItems > 9 ? '9+' : totalItems}
                </Badge>
              )}
            </Button>
            <div className="hidden md:block">
              <OrganizationCreditBalance orgId={currentOrg?.id || null} compact />
            </div>
            <OrganizationSwitcher />
          </div>
        </div>
      </div>
    </div>
  );
}
