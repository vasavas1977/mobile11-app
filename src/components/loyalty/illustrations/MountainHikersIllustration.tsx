export const MountainHikersIllustration = () => {
  return (
    <svg viewBox="0 0 400 280" className="w-full h-full" fill="none">
      {/* Sky */}
      <defs>
        <linearGradient id="mountainSky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#DBEAFE" />
          <stop offset="100%" stopColor="#FEF3C7" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="400" height="280" fill="url(#mountainSky)" />
      
      {/* Mountains */}
      <polygon points="0,200 80,80 160,200" fill="#9CA3AF" />
      <polygon points="100,200 200,60 300,200" fill="#6B7280" />
      <polygon points="240,200 340,100 400,200" fill="#9CA3AF" />
      
      {/* Snow caps */}
      <polygon points="190,60 200,60 210,80 200,75 190,80" fill="white" />
      <polygon points="330,100 340,100 350,115 340,112 330,115" fill="white" />
      
      {/* Grass hill */}
      <ellipse cx="200" cy="260" rx="220" ry="60" fill="#86EFAC" />
      <ellipse cx="200" cy="265" rx="200" ry="50" fill="#4ADE80" />
      
      {/* Path */}
      <path d="M150 280 Q180 240 200 250 Q220 260 250 220" fill="none" stroke="#D4A574" strokeWidth="8" strokeLinecap="round" />
      
      {/* Hiker 1 */}
      <g transform="translate(160, 190)">
        {/* Legs */}
        <path d="M0 35 L-8 60" stroke="#374151" strokeWidth="6" strokeLinecap="round" />
        <path d="M0 35 L8 58" stroke="#374151" strokeWidth="6" strokeLinecap="round" />
        
        {/* Body */}
        <rect x="-8" y="10" width="16" height="28" rx="4" fill="#F97316" />
        
        {/* Head */}
        <circle cx="0" cy="0" r="12" fill="#FDBF6F" />
        
        {/* Hair */}
        <ellipse cx="0" cy="-8" rx="10" ry="6" fill="#92400E" />
        
        {/* Backpack */}
        <rect x="6" y="12" width="12" height="20" rx="3" fill="#3B82F6" />
        
        {/* Hiking pole */}
        <line x1="-15" y1="25" x2="-20" y2="60" stroke="#78716C" strokeWidth="3" strokeLinecap="round" />
        
        {/* Phone in hand */}
        <rect x="12" y="20" width="8" height="14" rx="2" fill="#1F2937" />
        <rect x="13" y="22" width="6" height="10" rx="1" fill="#60A5FA" />
      </g>
      
      {/* Hiker 2 */}
      <g transform="translate(230, 175)">
        {/* Legs */}
        <path d="M0 35 L-6 58" stroke="#374151" strokeWidth="5" strokeLinecap="round" />
        <path d="M0 35 L8 55" stroke="#374151" strokeWidth="5" strokeLinecap="round" />
        
        {/* Body */}
        <rect x="-7" y="10" width="14" height="26" rx="4" fill="#EC4899" />
        
        {/* Head */}
        <circle cx="0" cy="0" r="11" fill="#D4A574" />
        
        {/* Hair */}
        <path d="M-10 -5 Q0 -18 10 -5" fill="#1F2937" />
        <ellipse cx="0" cy="-2" rx="12" ry="8" fill="#1F2937" />
        
        {/* Backpack */}
        <rect x="5" y="12" width="10" height="18" rx="3" fill="#8B5CF6" />
        
        {/* Waving arm */}
        <path d="M8 18 Q20 5 25 15" stroke="#D4A574" strokeWidth="4" strokeLinecap="round" className="animate-[wave_1.5s_ease-in-out_infinite]" />
      </g>
      
      {/* Floating coins */}
      <g className="animate-[bounce_3s_ease-in-out_infinite]">
        <circle cx="300" cy="140" r="18" fill="#FBBF24" />
        <circle cx="300" cy="140" r="14" fill="#F59E0B" />
        <text x="300" y="145" textAnchor="middle" fill="#FBBF24" fontSize="14" fontWeight="bold">$</text>
      </g>
      
      <g className="animate-[bounce_3s_ease-in-out_infinite_0.5s]">
        <circle cx="100" cy="120" r="15" fill="#FBBF24" />
        <circle cx="100" cy="120" r="11" fill="#F59E0B" />
        <text x="100" y="125" textAnchor="middle" fill="#FBBF24" fontSize="12" fontWeight="bold">$</text>
      </g>
      
      <g className="animate-[bounce_3s_ease-in-out_infinite_1s]">
        <circle cx="350" cy="180" r="12" fill="#FBBF24" />
        <circle cx="350" cy="180" r="9" fill="#F59E0B" />
        <text x="350" y="184" textAnchor="middle" fill="#FBBF24" fontSize="10" fontWeight="bold">$</text>
      </g>
      
      {/* Sun */}
      <circle cx="50" cy="50" r="25" fill="#FCD34D" opacity="0.9" />
      
      {/* Birds */}
      <path d="M320 60 Q325 55 330 60 Q335 55 340 60" fill="none" stroke="#374151" strokeWidth="2" />
      <path d="M290 80 Q293 77 296 80 Q299 77 302 80" fill="none" stroke="#374151" strokeWidth="1.5" />
      
      {/* Flowers */}
      <g transform="translate(120, 250)">
        <circle cx="0" cy="0" r="4" fill="#F472B6" />
        <circle cx="0" cy="-8" r="3" fill="#F472B6" />
        <line x1="0" y1="4" x2="0" y2="15" stroke="#22C55E" strokeWidth="2" />
      </g>
      <g transform="translate(280, 245)">
        <circle cx="0" cy="0" r="3" fill="#FBBF24" />
        <line x1="0" y1="3" x2="0" y2="12" stroke="#22C55E" strokeWidth="2" />
      </g>
    </svg>
  );
};
