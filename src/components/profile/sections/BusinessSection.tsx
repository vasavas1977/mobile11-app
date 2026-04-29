import React from 'react';
import { Briefcase, Building2, Users, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

export const BusinessSection: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleConnectBusiness = () => {
    navigate('/business');
  };

  return (
    <div className="space-y-6">
      {/* Main CTA Card */}
      <div className="relative bg-gradient-to-br from-sky-600 to-blue-700 rounded-2xl p-8 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-32 h-32 bg-white rounded-full" />
          <div className="absolute bottom-10 left-10 w-24 h-24 bg-white rounded-full" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">
              {t('profile.business.title')}
            </h2>
          </div>
          
          <p className="text-white/90 text-lg mb-6 max-w-md">
            {t('profile.business.description')}
          </p>
          
          <Link to="/business">
            <Button className="bg-white text-blue-700 hover:bg-white/90 rounded-full px-6 font-semibold">
              {t('profile.business.discoverBenefits')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
          <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-7 h-7 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">
            {t('profile.business.centralizedManagement')}
          </h3>
          <p className="text-sm text-gray-500">
            {t('profile.business.centralizedManagementDesc')}
          </p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
          <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-7 h-7 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">
            {t('profile.business.easyExpensing')}
          </h3>
          <p className="text-sm text-gray-500">
            {t('profile.business.easyExpensingDesc')}
          </p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
          <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">
            {t('profile.business.teamCollaboration')}
          </h3>
          <p className="text-sm text-gray-500">
            {t('profile.business.teamCollaborationDesc')}
          </p>
        </div>
      </div>

      {/* Connect Account Section */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <p className="text-gray-600 mb-4">
          {t('profile.business.connectAccount')}
        </p>
        <Button 
          className="rounded-full bg-orange-500 hover:bg-orange-600 text-white"
          onClick={handleConnectBusiness}
        >
          <Briefcase className="w-4 h-4 mr-2" />
          {t('profile.business.connectButton')}
        </Button>
      </div>
    </div>
  );
};