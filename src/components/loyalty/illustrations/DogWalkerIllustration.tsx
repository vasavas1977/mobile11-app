export const DogWalkerIllustration = () => {
  return (
    <svg viewBox="0 0 400 280" className="w-full h-full" fill="none">
      {/* Background */}
      <defs>
        <linearGradient id="parkSky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E0F2FE" />
          <stop offset="100%" stopColor="#FEF3C7" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="400" height="280" fill="url(#parkSky)" />
      
      {/* Ground */}
      <ellipse cx="200" cy="270" rx="220" ry="50" fill="#86EFAC" />
      
      {/* Tree */}
      <g transform="translate(50, 140)">
        <rect x="15" y="60" width="20" height="50" fill="#92400E" />
        <ellipse cx="25" cy="40" rx="40" ry="50" fill="#22C55E" />
        <ellipse cx="15" cy="55" rx="25" ry="30" fill="#16A34A" />
        <ellipse cx="40" cy="50" rx="20" ry="25" fill="#4ADE80" />
      </g>
      
      {/* Person running */}
      <g transform="translate(220, 160)">
        {/* Back leg */}
        <path d="M-5 50 L-20 80 L-15 82" stroke="#374151" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Front leg */}
        <path d="M5 50 L25 75 L30 72" stroke="#374151" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Body */}
        <ellipse cx="0" cy="35" rx="18" ry="22" fill="#8B5CF6" />
        
        {/* Head */}
        <circle cx="5" cy="5" r="16" fill="#FDBF6F" />
        
        {/* Hair */}
        <path d="M-12 -5 Q5 -25 20 -5" fill="#92400E" />
        <ellipse cx="5" cy="-5" rx="14" ry="10" fill="#92400E" />
        
        {/* Ponytail */}
        <path d="M15 -8 Q35 -15 30 5" stroke="#92400E" strokeWidth="6" strokeLinecap="round" />
        
        {/* Happy face */}
        <circle cx="0" cy="3" r="2" fill="#374151" />
        <circle cx="10" cy="3" r="2" fill="#374151" />
        <path d="M2 10 Q5 14 8 10" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
        
        {/* Arm with phone */}
        <path d="M15 30 L35 15 L40 20" stroke="#FDBF6F" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="35" y="10" width="12" height="20" rx="2" fill="#1F2937" transform="rotate(20 41 20)" />
        <rect x="37" y="13" width="8" height="14" rx="1" fill="#60A5FA" transform="rotate(20 41 20)" />
        
        {/* Leash hand */}
        <path d="M-15 35 L-30 50" stroke="#FDBF6F" strokeWidth="5" strokeLinecap="round" />
      </g>
      
      {/* Leash */}
      <path d="M190 210 Q160 200 140 215" stroke="#78716C" strokeWidth="3" fill="none" />
      
      {/* Dog */}
      <g transform="translate(100, 200)">
        {/* Body */}
        <ellipse cx="30" cy="15" rx="30" ry="18" fill="#D4A574" />
        
        {/* Head */}
        <circle cx="65" cy="8" r="15" fill="#D4A574" />
        
        {/* Snout */}
        <ellipse cx="78" cy="12" rx="8" ry="6" fill="#C4A574" />
        <circle cx="80" cy="10" r="3" fill="#374151" />
        
        {/* Ear */}
        <ellipse cx="55" cy="0" rx="8" ry="12" fill="#B8956F" />
        
        {/* Eye */}
        <circle cx="68" cy="5" r="3" fill="#374151" />
        <circle cx="69" cy="4" r="1" fill="white" />
        
        {/* Tail */}
        <path d="M0 10 Q-15 -10 -5 -15" stroke="#D4A574" strokeWidth="8" strokeLinecap="round" className="animate-[wag_0.5s_ease-in-out_infinite]" />
        
        {/* Legs */}
        <rect x="15" y="28" width="8" height="18" rx="3" fill="#C4A574" />
        <rect x="35" y="28" width="8" height="18" rx="3" fill="#C4A574" />
        <rect x="50" y="25" width="7" height="20" rx="3" fill="#C4A574" />
        
        {/* Collar */}
        <rect x="55" y="18" width="20" height="6" rx="2" fill="#EF4444" />
      </g>
      
      {/* Floating coins */}
      <g className="animate-[bounce_2.5s_ease-in-out_infinite]">
        <circle cx="320" cy="100" r="20" fill="#FBBF24" />
        <circle cx="320" cy="100" r="16" fill="#F59E0B" />
        <text x="320" y="106" textAnchor="middle" fill="#FBBF24" fontSize="16" fontWeight="bold">$</text>
      </g>
      
      <g className="animate-[bounce_2.5s_ease-in-out_infinite_0.4s]">
        <circle cx="280" cy="60" r="16" fill="#FBBF24" />
        <circle cx="280" cy="60" r="12" fill="#F59E0B" />
        <text x="280" y="65" textAnchor="middle" fill="#FBBF24" fontSize="12" fontWeight="bold">$</text>
      </g>
      
      <g className="animate-[bounce_2.5s_ease-in-out_infinite_0.8s]">
        <circle cx="360" cy="150" r="14" fill="#FBBF24" />
        <circle cx="360" cy="150" r="10" fill="#F59E0B" />
        <text x="360" y="155" textAnchor="middle" fill="#FBBF24" fontSize="10" fontWeight="bold">$</text>
      </g>
      
      {/* Confetti */}
      <rect x="300" y="130" width="10" height="10" rx="1" fill="#F472B6" transform="rotate(30 305 135)" className="animate-[bounce_2s_ease-in-out_infinite]" />
      <rect x="340" y="80" width="8" height="8" rx="1" fill="#60A5FA" transform="rotate(-20 344 84)" className="animate-[bounce_2s_ease-in-out_infinite_0.3s]" />
      <circle cx="250" cy="50" r="5" fill="#4ADE80" className="animate-[bounce_2s_ease-in-out_infinite_0.6s]" />
      <polygon points="370,120 373,128 381,128 375,133 377,141 370,136 363,141 365,133 359,128 367,128" fill="#FCD34D" className="animate-[bounce_2s_ease-in-out_infinite_0.9s]" />
      
      {/* Sun */}
      <circle cx="350" cy="40" r="25" fill="#FCD34D" opacity="0.8" />
      
      {/* Small clouds */}
      <g transform="translate(150, 30)">
        <ellipse cx="20" cy="10" rx="20" ry="10" fill="white" opacity="0.7" />
        <ellipse cx="35" cy="12" rx="15" ry="8" fill="white" opacity="0.7" />
      </g>
      
      {/* Flowers */}
      <g transform="translate(320, 250)">
        <circle cx="0" cy="0" r="4" fill="#F472B6" />
        <circle cx="0" cy="0" r="2" fill="#FBBF24" />
        <line x1="0" y1="4" x2="0" y2="15" stroke="#22C55E" strokeWidth="2" />
      </g>
      <g transform="translate(180, 255)">
        <circle cx="0" cy="0" r="3" fill="#FBBF24" />
        <line x1="0" y1="3" x2="0" y2="10" stroke="#22C55E" strokeWidth="2" />
      </g>
      
      <style>
        {`
          @keyframes wag {
            0%, 100% { transform: rotate(-10deg); }
            50% { transform: rotate(10deg); }
          }
          @keyframes wave {
            0%, 100% { transform: rotate(-5deg); }
            50% { transform: rotate(5deg); }
          }
        `}
      </style>
    </svg>
  );
};
