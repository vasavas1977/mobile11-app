import React from 'react';

interface PhoneCoinsIllustrationProps {
  className?: string;
}

export const PhoneCoinsIllustration: React.FC<PhoneCoinsIllustrationProps> = ({ className = '' }) => {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Green blob background */}
      <ellipse cx="60" cy="60" rx="50" ry="50" fill="#ECFDF5" />
      
      {/* Decorative elements */}
      <circle cx="25" cy="35" r="4" fill="#6EE7B7" />
      <circle cx="95" cy="80" r="3" fill="#34D399" />
      <rect x="90" y="35" width="5" height="5" rx="1" fill="#6EE7B7" transform="rotate(15 90 35)" />
      <rect x="20" y="80" width="4" height="4" rx="1" fill="#A7F3D0" transform="rotate(-10 20 80)" />
      
      {/* Phone body */}
      <rect x="40" y="25" width="40" height="75" rx="6" fill="#1F2937" stroke="#111827" strokeWidth="2" />
      
      {/* Phone screen */}
      <rect x="44" y="32" width="32" height="58" rx="2" fill="#374151" />
      
      {/* Phone notch */}
      <rect x="52" y="27" width="16" height="3" rx="1.5" fill="#374151" />
      
      {/* Home button */}
      <circle cx="60" cy="93" r="4" fill="#374151" stroke="#4B5563" strokeWidth="1" />
      
      {/* Dollar sign on screen */}
      <text x="60" y="68" textAnchor="middle" fill="#10B981" fontSize="24" fontWeight="bold">$</text>
      
      {/* Floating coins - coin 1 (top left) */}
      <ellipse cx="28" cy="45" rx="12" ry="12" fill="#FCD34D" stroke="#F59E0B" strokeWidth="2" />
      <text x="28" y="50" textAnchor="middle" fill="#B45309" fontSize="12" fontWeight="bold">$</text>
      
      {/* Floating coins - coin 2 (top right) */}
      <ellipse cx="92" cy="50" rx="10" ry="10" fill="#FBBF24" stroke="#F59E0B" strokeWidth="2" />
      <text x="92" y="55" textAnchor="middle" fill="#B45309" fontSize="10" fontWeight="bold">$</text>
      
      {/* Floating coins - coin 3 (bottom left) */}
      <ellipse cx="25" cy="70" rx="8" ry="8" fill="#FDE68A" stroke="#FBBF24" strokeWidth="1.5" />
      <text x="25" y="74" textAnchor="middle" fill="#B45309" fontSize="8" fontWeight="bold">$</text>
      
      {/* Sparkles */}
      <circle cx="38" cy="35" r="2" fill="#34D399" />
      <circle cx="82" cy="38" r="2.5" fill="#10B981" />
      <circle cx="95" cy="65" r="2" fill="#6EE7B7" />
      <circle cx="20" cy="55" r="1.5" fill="#A7F3D0" />
      
      {/* Motion lines for coins */}
      <path d="M35 50 L38 53" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 42 L15 39" stroke="#FCD34D" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M85 42 L82 39" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};

export default PhoneCoinsIllustration;
