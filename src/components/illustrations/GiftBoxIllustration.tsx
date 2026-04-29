import React from 'react';

interface GiftBoxIllustrationProps {
  className?: string;
}

export const GiftBoxIllustration: React.FC<GiftBoxIllustrationProps> = ({ className = '' }) => {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Orange blob background */}
      <ellipse cx="60" cy="60" rx="50" ry="50" fill="#FFF7ED" />
      
      {/* Decorative elements */}
      <circle cx="25" cy="40" r="4" fill="#FDBA74" />
      <circle cx="95" cy="35" r="3" fill="#FB923C" />
      <circle cx="90" cy="85" r="5" fill="#FED7AA" />
      <rect x="28" y="85" width="5" height="5" rx="1" fill="#FDBA74" transform="rotate(20 28 85)" />
      
      {/* Percent badge */}
      <circle cx="90" cy="30" r="12" fill="#F97316" />
      <text x="90" y="35" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">%</text>
      
      {/* Gift box lid */}
      <rect x="30" y="40" width="60" height="15" rx="3" fill="#FB923C" stroke="#EA580C" strokeWidth="2" />
      
      {/* Gift box body */}
      <rect x="33" y="55" width="54" height="40" rx="2" fill="#F97316" stroke="#EA580C" strokeWidth="2" />
      
      {/* Vertical ribbon */}
      <rect x="55" y="40" width="10" height="55" fill="#DC2626" />
      
      {/* Horizontal ribbon on lid */}
      <rect x="30" y="45" width="60" height="6" fill="#DC2626" />
      
      {/* Ribbon bow - left loop */}
      <ellipse cx="48" cy="38" rx="10" ry="8" fill="#EF4444" stroke="#DC2626" strokeWidth="1.5" />
      
      {/* Ribbon bow - right loop */}
      <ellipse cx="72" cy="38" rx="10" ry="8" fill="#EF4444" stroke="#DC2626" strokeWidth="1.5" />
      
      {/* Bow center */}
      <circle cx="60" cy="40" r="5" fill="#DC2626" />
      
      {/* Ribbon tails */}
      <path d="M55 45 L48 58 L52 58 L57 48 Z" fill="#B91C1C" />
      <path d="M65 45 L72 58 L68 58 L63 48 Z" fill="#B91C1C" />
      
      {/* Sparkles */}
      <circle cx="20" cy="55" r="2" fill="#FCD34D" />
      <circle cx="100" cy="60" r="2.5" fill="#FBBF24" />
      <circle cx="25" cy="75" r="1.5" fill="#FCD34D" />
    </svg>
  );
};

export default GiftBoxIllustration;
