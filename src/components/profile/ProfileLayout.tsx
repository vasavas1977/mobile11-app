import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { FooterAiralo } from '@/components/landing/FooterAiralo';
import { ProfileSidebar } from './ProfileSidebar';
import { ProfileHeader } from './ProfileHeader';
import { ProfileDecorations } from './ProfileDecorations';
import { AccountInfoSection } from './sections/AccountInfoSection';
import { TrustedDevicesSection } from './sections/TrustedDevicesSection';
import { LoyaltySection } from './sections/LoyaltySection';
import { SavedCardsSection } from './sections/SavedCardsSection';
import { ReferAndEarnSection } from './sections/ReferAndEarnSection';
import { OrdersSection } from './sections/OrdersSection';
import { BusinessSection } from './sections/BusinessSection';
import { OrderDetailSection } from './sections/OrderDetailSection';

export type ProfileSection = 
  | 'account' 
  | 'devices' 
  | 'loyalty' 
  | 'cards' 
  | 'referrals' 
  | 'orders' 
  | 'order-detail'
  | 'business';

interface ProfileLayoutProps {
  initialSection?: ProfileSection;
}

export const ProfileLayout: React.FC<ProfileLayoutProps> = ({ initialSection = 'account' }) => {
  const [activeSection, setActiveSection] = useState<ProfileSection>(initialSection);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const { user } = useAuth();

  // Sync activeSection when initialSection changes (e.g., URL param changes)
  useEffect(() => {
    setActiveSection(initialSection);
    // Reset selected order when navigating away
    if (initialSection !== 'order-detail') {
      setSelectedOrderId(null);
    }
  }, [initialSection]);

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setActiveSection('order-detail');
  };

  const handleBackToOrders = () => {
    setSelectedOrderId(null);
    setActiveSection('orders');
  };

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch user loyalty data
  const { data: loyalty } = useQuery({
    queryKey: ['user-loyalty', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('user_loyalty')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      // If no loyalty record exists, create one
      if (error && error.code === 'PGRST116') {
        const { data: newLoyalty, error: insertError } = await supabase
          .from('user_loyalty')
          .insert({ user_id: user.id })
          .select()
          .single();
        if (insertError) throw insertError;
        return newLoyalty;
      }
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

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

  const userName = profile?.first_name 
    ? `${profile.first_name}${profile.last_name ? ' ' + profile.last_name : ''}`
    : user?.email?.split('@')[0] || 'User';

  return (
    <div className="min-h-screen bg-[#FAF7F2] relative overflow-hidden">
      <Header />
      <ProfileDecorations />
      
      <div className="container mx-auto px-4 pb-8 pt-8 md:pt-12 relative z-10">
        {/* Top Row: Profile Header + Breadcrumb side by side */}
        <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-8">
          {/* Profile Header - Left side */}
          <div className="md:w-72 flex-shrink-0">
            <ProfileHeader
              userName={userName} 
              tier={loyalty?.tier || 'explorer'} 
              avatarUrl={profile?.line_picture_url}
            />
          </div>
          
          {/* Breadcrumb - Right side, aligned with content area */}
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
          {/* Sidebar */}
          <div className="md:w-72 flex-shrink-0">
            <ProfileSidebar 
              activeSection={activeSection} 
              onSectionChange={setActiveSection} 
            />
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            {renderSection()}
          </div>
        </div>
      </div>
      
      <FooterAiralo />
    </div>
  );
};

export default ProfileLayout;
