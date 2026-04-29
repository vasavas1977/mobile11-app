export const SuitcaseIllustration = () => {
  return (
    <svg viewBox="0 0 400 300" className="w-full h-full" fill="none">
      {/* Background glow */}
      <defs>
        <radialGradient id="suitcaseGlow" cx="50%" cy="60%" r="50%">
          <stop offset="0%" stopColor="#FFEDD5" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#FFEDD5" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="200" cy="170" rx="160" ry="100" fill="url(#suitcaseGlow)" />
      
      {/* Suitcase */}
      <g transform="translate(120, 100)">
        {/* Main body */}
        <rect x="0" y="30" width="140" height="120" rx="12" fill="#F97316" />
        <rect x="5" y="35" width="130" height="110" rx="10" fill="#EA580C" />
        
        {/* Handle */}
        <rect x="50" y="10" width="40" height="25" rx="4" fill="#C2410C" />
        <rect x="55" y="0" width="30" height="15" rx="3" fill="#9A3412" />
        
        {/* Straps */}
        <rect x="25" y="35" width="8" height="110" fill="#C2410C" />
        <rect x="107" y="35" width="8" height="110" fill="#C2410C" />
        
        {/* Buckles */}
        <rect x="22" y="70" width="14" height="10" rx="2" fill="#FBBF24" />
        <rect x="104" y="70" width="14" height="10" rx="2" fill="#FBBF24" />
        
        {/* Wheels */}
        <circle cx="30" cy="155" r="8" fill="#374151" />
        <circle cx="110" cy="155" r="8" fill="#374151" />
        
        {/* Stickers */}
        <circle cx="80" cy="90" r="15" fill="#FCD34D" />
        <text x="80" y="95" textAnchor="middle" fill="#F59E0B" fontSize="12" fontWeight="bold">✈</text>
      </g>
      
      {/* Airplane */}
      <g transform="translate(280, 50) rotate(15)">
        <path d="M0 20 L50 15 L55 10 L60 15 L80 12 L60 20 L80 28 L60 25 L55 30 L50 25 L0 20 Z" fill="#60A5FA" />
        <ellipse cx="25" cy="20" rx="8" ry="4" fill="#3B82F6" />
      </g>
      
      {/* Cloud */}
      <g transform="translate(60, 40)">
        <ellipse cx="30" cy="20" rx="25" ry="15" fill="white" opacity="0.8" />
        <ellipse cx="50" cy="25" rx="20" ry="12" fill="white" opacity="0.8" />
        <ellipse cx="15" cy="25" rx="15" ry="10" fill="white" opacity="0.8" />
      </g>
      
      {/* Floating coins */}
      <g className="animate-[bounce_2.5s_ease-in-out_infinite]">
        <circle cx="320" cy="150" r="20" fill="#FBBF24" />
        <circle cx="320" cy="150" r="16" fill="#F59E0B" />
        <text x="320" y="156" textAnchor="middle" fill="#FBBF24" fontSize="16" fontWeight="bold">$</text>
      </g>
      
      <g className="animate-[bounce_2.5s_ease-in-out_infinite_0.3s]">
        <circle cx="80" cy="180" r="16" fill="#FBBF24" />
        <circle cx="80" cy="180" r="12" fill="#F59E0B" />
        <text x="80" y="185" textAnchor="middle" fill="#FBBF24" fontSize="12" fontWeight="bold">$</text>
      </g>
      
      <g className="animate-[bounce_2.5s_ease-in-out_infinite_0.6s]">
        <circle cx="350" cy="220" r="14" fill="#FBBF24" />
        <circle cx="350" cy="220" r="10" fill="#F59E0B" />
        <text x="350" y="225" textAnchor="middle" fill="#FBBF24" fontSize="10" fontWeight="bold">$</text>
      </g>
      
      {/* Sparkles */}
      <polygon points="300,80 303,88 311,88 305,93 307,101 300,96 293,101 295,93 289,88 297,88" fill="#FCD34D" />
      <polygon points="50,120 52,125 57,125 53,128 55,133 50,130 45,133 47,128 43,125 48,125" fill="#FCD34D" />
    </svg>
  );
};
