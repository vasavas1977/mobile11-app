import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminPreviewProvider } from '@/contexts/AdminPreviewContext';
import { AdminCustomerPreviewBanner } from './AdminCustomerPreviewBanner';
import { ProfileSidebar } from '@/components/profile/ProfileSidebar';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileDecorations } from '@/components/profile/ProfileDecorations';
import { AccountInfoSection } from '@/components/profile/sections/AccountInfoSection';
import { TrustedDevicesSection } from '@/components/profile/sections/TrustedDevicesSection';
import { LoyaltySection } from '@/components/profile/sections/LoyaltySection';
import { SavedCardsSection } from '@/components/profile/sections/SavedCardsSection';
import { ReferAndEarnSection } from '@/components/profile/sections/ReferAndEarnSection';
import { OrdersSection } from '@/components/profile/sections/OrdersSection';
import { BusinessSection } from '@/components/profile/sections/BusinessSection';
import { OrderDetailSection } from '@/components/profile/sections/OrderDetailSection';
import { ProfileSection } from '@/components/profile/ProfileLayout';

export function AdminProfilePreview() {
  const { userId } = useParams<{ userId: string }>();
  const [activeSection, setActiveSection] = useState<ProfileSection>('account');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Fetch customer profile
  const { data: profile } = useQuery({
    queryKey: ['admin-preview-full-profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId
  });

  // Fetch customer loyalty data
  const { data: loyalty } = useQuery({
    queryKey: ['admin-preview-loyalty', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_loyalty')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code === 'PGRST116') {
        return null;
      }
      if (error) throw error;
      return data;
    },
    enabled: !!userId
  });

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setActiveSection('order-detail');
  };

  const handleBackToOrders = () => {
    setSelectedOrderId(null);
    setActiveSection('orders');
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'account':
        return <AccountInfoSection profile={profile} />;
      case 'devices':
        return <TrustedDevicesSection />;
      case 'loyalty':
        return <LoyaltySection loyalty={loyalty} />;
      case 'cards':
        return <SavedCardsSection />;
      case 'referrals':
        return <ReferAndEarnSection loyalty={loyalty} />;
      case 'orders':
        return <OrdersSection onSelectOrder={handleSelectOrder} />;
      case 'order-detail':
        return selectedOrderId ? (
          <OrderDetailSection orderId={selectedOrderId} onBack={handleBackToOrders} />
        ) : (
          <OrdersSection onSelectOrder={handleSelectOrder} />
        );
      case 'business':
        return <BusinessSection />;
      default:
        return <AccountInfoSection profile={profile} />;
    }
  };

  const customerName = profile 
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || null
    : null;

  const userName = profile?.first_name 
    ? `${profile.first_name}${profile.last_name ? ' ' + profile.last_name : ''}`
    : profile?.email?.split('@')[0] || 'User';

  return (
    <AdminPreviewProvider 
      userId={userId!}
      customerName={customerName}
      customerEmail={profile?.email}
    >
      <div className="min-h-screen bg-[#FAF7F2] relative overflow-hidden">
        {/* Admin Preview Banner */}
        <AdminCustomerPreviewBanner 
          customerName={customerName}
          customerEmail={profile?.email || null}
        />
        
        <ProfileDecorations />
        
        {/* Content with top padding for banner */}
        <div className="container mx-auto px-4 pb-8 pt-20 relative z-10">
          {/* Top Row: Profile Header + Breadcrumb */}
          <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-8">
            <div className="md:w-72 flex-shrink-0">
              <ProfileHeader
                userName={userName} 
                tier={loyalty?.tier || 'explorer'} 
                avatarUrl={profile?.line_picture_url}
              />
            </div>
            
            <div className="flex-1 min-w-0 md:pt-3">
              <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
              <p className="text-sm text-gray-500">
                Profile &gt; {
                  {
                    'account': 'Account information',
                    'devices': 'Trusted devices',
                    'loyalty': 'Mobile11 Money & Membership',
                    'cards': 'Saved cards',
                    'referrals': 'Refer and earn',
                    'orders': 'Orders',
                    'order-detail': 'Order details',
                    'business': 'Mobile11 for Business',
                  }[activeSection]
                }
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex flex-col md:flex-row gap-8 mt-8">
            <div className="md:w-72 flex-shrink-0">
              <ProfileSidebar 
                activeSection={activeSection} 
                onSectionChange={setActiveSection} 
              />
            </div>

            <div className="flex-1 min-w-0">
              {renderSection()}
            </div>
          </div>
        </div>
      </div>
    </AdminPreviewProvider>
  );
}
