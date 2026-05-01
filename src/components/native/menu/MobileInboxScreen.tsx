import React, { useState } from 'react';
import { MobileMenuShell } from './MobileMenuShell';

type InboxTab = 'all' | 'promotions' | 'features' | 'updates';

const TABS: { id: InboxTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'promotions', label: 'Promotions' },
  { id: 'features', label: 'New features' },
  { id: 'updates', label: 'Service updates' },
];

const EMPTY_STATES: Record<InboxTab, { title: string; body: string }> = {
  all: {
    title: 'Your inbox is empty',
    body: 'Promotions, new features, and service updates will show up here.',
  },
  promotions: {
    title: 'No promotions yet',
    body: 'Special deals and offers will appear here when available.',
  },
  features: {
    title: "Explore what's new with Mobile11",
    body: "This is where you'll find the latest updates and features as we roll them out.",
  },
  updates: {
    title: 'No service updates',
    body: 'Important updates about your eSIMs and account will show up here.',
  },
};

export const MobileInboxScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<InboxTab>('all');
  const emptyState = EMPTY_STATES[activeTab];

  return (
    <MobileMenuShell title="Inbox">
      {/* Chip tabs */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex gap-2 overflow-x-auto min-w-max pb-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`h-10 rounded-full px-4 text-sm font-medium border whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-white border-orange-500 text-gray-900'
                    : 'bg-transparent border-gray-300 text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty state */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-16">
        {/* Inline SVG illustration */}
        <svg
          width="160"
          height="140"
          viewBox="0 0 160 140"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="mb-6"
        >
          {/* Rock/ground */}
          <ellipse cx="80" cy="130" rx="50" ry="10" fill="#E5E7EB" />
          {/* Person body */}
          <path
            d="M70 90 C70 75 65 65 75 55 C80 50 85 50 90 55 C100 65 95 75 95 90 L95 115 C95 120 90 125 80 125 C70 125 70 120 70 115 Z"
            fill="#FCD34D"
          />
          {/* Head */}
          <circle cx="82" cy="45" r="14" fill="#FBBF24" />
          {/* Hair */}
          <path
            d="M70 40 C70 30 75 25 82 25 C89 25 95 30 95 40 C95 35 90 32 82 32 C74 32 70 35 70 40Z"
            fill="#92400E"
          />
          {/* Phone */}
          <rect x="88" y="70" width="14" height="24" rx="3" fill="#374151" />
          <rect x="90" y="73" width="10" height="18" rx="1" fill="#60A5FA" />
          {/* Arm holding phone */}
          <path
            d="M90 75 C95 72 98 70 95 68"
            stroke="#FBBF24"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Legs */}
          <path d="M75 115 L72 130" stroke="#FCD34D" strokeWidth="5" strokeLinecap="round" />
          <path d="M88 115 L90 130" stroke="#FCD34D" strokeWidth="5" strokeLinecap="round" />
          {/* Shoes */}
          <ellipse cx="71" cy="132" rx="5" ry="3" fill="#374151" />
          <ellipse cx="91" cy="132" rx="5" ry="3" fill="#374151" />
        </svg>

        <h3 className="text-lg font-extrabold text-gray-900 text-center mb-2">
          {emptyState.title}
        </h3>
        <p className="text-[15px] text-gray-500 text-center leading-relaxed max-w-[280px]">
          {emptyState.body}
        </p>
      </div>
    </MobileMenuShell>
  );
};
