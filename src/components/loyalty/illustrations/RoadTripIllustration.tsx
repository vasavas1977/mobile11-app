export const RoadTripIllustration = () => {
  return (
    <svg viewBox="0 0 400 280" className="w-full h-full" fill="none">
      {/* Sky gradient */}
      <defs>
        <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E0F2FE" />
          <stop offset="100%" stopColor="#FEF3C7" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="400" height="200" fill="url(#skyGradient)" />
      
      {/* Hills */}
      <ellipse cx="100" cy="200" rx="120" ry="40" fill="#86EFAC" />
      <ellipse cx="320" cy="210" rx="100" ry="35" fill="#4ADE80" />
      
      {/* Road */}
      <path d="M0 250 Q200 200 400 250" fill="#6B7280" />
      <path d="M50 248 Q200 205 350 248" fill="none" stroke="#FCD34D" strokeWidth="3" strokeDasharray="15 10" />
      
      {/* Van */}
      <g transform="translate(140, 170)">
        {/* Van body */}
        <rect x="0" y="20" width="120" height="60" rx="8" fill="#F97316" />
        <rect x="5" y="25" width="110" height="50" rx="6" fill="#EA580C" />
        
        {/* Windows */}
        <rect x="70" y="30" width="35" height="25" rx="4" fill="#60A5FA" />
        <rect x="15" y="30" width="45" height="25" rx="4" fill="#60A5FA" />
        
        {/* Roof rack */}
        <rect x="20" y="10" width="80" height="12" rx="3" fill="#9A3412" />
        <rect x="30" y="2" width="25" height="10" rx="2" fill="#78716C" />
        <rect x="65" y="2" width="25" height="10" rx="2" fill="#78716C" />
        
        {/* Wheels */}
        <circle cx="30" cy="80" r="14" fill="#374151" />
        <circle cx="30" cy="80" r="8" fill="#6B7280" />
        <circle cx="90" cy="80" r="14" fill="#374151" />
        <circle cx="90" cy="80" r="8" fill="#6B7280" />
        
        {/* Headlights */}
        <circle cx="115" cy="55" r="5" fill="#FCD34D" />
      </g>
      
      {/* Trophy */}
      <g transform="translate(300, 120)">
        <rect x="15" y="50" width="30" height="10" rx="2" fill="#B45309" />
        <rect x="20" y="40" width="20" height="12" fill="#FBBF24" />
        <path d="M10 10 Q10 35 30 40 Q50 35 50 10 L45 10 Q45 30 30 35 Q15 30 15 10 Z" fill="#FBBF24" />
        <rect x="15" y="5" width="30" height="8" rx="2" fill="#F59E0B" />
        <ellipse cx="5" cy="20" rx="8" ry="12" fill="none" stroke="#FBBF24" strokeWidth="4" />
        <ellipse cx="55" cy="20" rx="8" ry="12" fill="none" stroke="#FBBF24" strokeWidth="4" />
        <text x="30" y="28" textAnchor="middle" fill="#B45309" fontSize="14" fontWeight="bold">1</text>
      </g>
      
      {/* Travelers in van */}
      <g transform="translate(165, 180)">
        {/* Person 1 */}
        <circle cx="0" cy="5" r="8" fill="#FDBF6F" />
        <rect x="-5" y="13" width="10" height="12" rx="2" fill="#60A5FA" />
        {/* Waving arm */}
        <path d="M5 15 Q15 5 20 10" stroke="#FDBF6F" strokeWidth="4" strokeLinecap="round" className="animate-[wave_1s_ease-in-out_infinite]" />
      </g>
      
      <g transform="translate(195, 182)">
        {/* Person 2 */}
        <circle cx="0" cy="5" r="7" fill="#D4A574" />
        <rect x="-4" y="12" width="8" height="10" rx="2" fill="#F472B6" />
      </g>
      
      {/* Sun */}
      <circle cx="350" cy="50" r="25" fill="#FCD34D" />
      <circle cx="350" cy="50" r="20" fill="#FBBF24" />
      
      {/* Birds */}
      <path d="M50 60 Q55 55 60 60 Q65 55 70 60" fill="none" stroke="#374151" strokeWidth="2" />
      <path d="M80 80 Q83 77 86 80 Q89 77 92 80" fill="none" stroke="#374151" strokeWidth="1.5" />
      
      {/* Confetti */}
      <rect x="280" y="90" width="8" height="8" rx="1" fill="#F472B6" transform="rotate(30 284 94)" className="animate-[bounce_2s_ease-in-out_infinite]" />
      <rect x="320" y="70" width="6" height="6" rx="1" fill="#60A5FA" transform="rotate(-20 323 73)" className="animate-[bounce_2s_ease-in-out_infinite_0.3s]" />
      <circle cx="340" cy="100" r="4" fill="#4ADE80" className="animate-[bounce_2s_ease-in-out_infinite_0.6s]" />
      <circle cx="290" cy="60" r="3" fill="#FBBF24" className="animate-[bounce_2s_ease-in-out_infinite_0.9s]" />
      
      {/* Trees */}
      <g transform="translate(30, 180)">
        <rect x="8" y="20" width="8" height="15" fill="#92400E" />
        <ellipse cx="12" cy="15" rx="15" ry="20" fill="#22C55E" />
      </g>
      <g transform="translate(350, 175)">
        <rect x="6" y="15" width="6" height="12" fill="#92400E" />
        <ellipse cx="9" cy="10" rx="12" ry="16" fill="#16A34A" />
      </g>
    </svg>
  );
};
