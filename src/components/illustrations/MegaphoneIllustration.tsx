import React from 'react';

interface MegaphoneIllustrationProps {
  className?: string;
}

export const MegaphoneIllustration: React.FC<MegaphoneIllustrationProps> = ({ className = '' }) => {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Blue blob background */}
      <ellipse cx="60" cy="60" rx="50" ry="50" fill="#E0F2FE" />
      
      {/* Decorative elements */}
      <circle cx="25" cy="35" r="4" fill="#93C5FD" />
      <circle cx="95" cy="45" r="3" fill="#60A5FA" />
      <circle cx="85" cy="85" r="5" fill="#BFDBFE" />
      <rect x="30" y="80" width="6" height="6" rx="1" fill="#93C5FD" transform="rotate(15 30 80)" />
      <rect x="90" cy="25" width="4" height="4" rx="1" fill="#60A5FA" transform="rotate(-10 90 25)" />
      
      {/* Megaphone body */}
      <path 
        d="M40 50 L75 35 L75 75 L40 65 Z" 
        fill="#3B82F6" 
        stroke="#1D4ED8" 
        strokeWidth="2"
      />
      
      {/* Megaphone cone */}
      <path 
        d="M75 35 L95 25 L95 85 L75 75 Z" 
        fill="#60A5FA" 
        stroke="#3B82F6" 
        strokeWidth="2"
      />
      
      {/* Megaphone handle */}
      <rect x="32" y="48" width="12" height="18" rx="3" fill="#1D4ED8" />
      
      {/* Sound waves */}
      <path 
        d="M98 45 Q105 55 98 65" 
        stroke="#93C5FD" 
        strokeWidth="3" 
        strokeLinecap="round" 
        fill="none"
      />
      <path 
        d="M103 40 Q112 55 103 70" 
        stroke="#BFDBFE" 
        strokeWidth="2" 
        strokeLinecap="round" 
        fill="none"
      />
      
      {/* Sparkles */}
      <circle cx="108" cy="35" r="2" fill="#FCD34D" />
      <circle cx="112" cy="50" r="2.5" fill="#FBBF24" />
      <circle cx="105" cy="75" r="2" fill="#FCD34D" />
    </svg>
  );
};

export default MegaphoneIllustration;
