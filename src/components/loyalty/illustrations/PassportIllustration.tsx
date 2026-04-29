export const PassportIllustration = () => {
  return (
    <svg viewBox="0 0 400 300" className="w-full h-full" fill="none">
      {/* Background glow */}
      <defs>
        <radialGradient id="passportGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#FEF3C7" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="200" cy="150" rx="150" ry="120" fill="url(#passportGlow)" />
      
      {/* Globe */}
      <circle cx="280" cy="100" r="50" fill="#93C5FD" opacity="0.3" />
      <circle cx="280" cy="100" r="45" fill="none" stroke="#60A5FA" strokeWidth="2" />
      <ellipse cx="280" cy="100" rx="20" ry="45" fill="none" stroke="#60A5FA" strokeWidth="1.5" />
      <path d="M235 100 Q280 90 325 100" fill="none" stroke="#60A5FA" strokeWidth="1.5" />
      <path d="M235 100 Q280 110 325 100" fill="none" stroke="#60A5FA" strokeWidth="1.5" />
      
      {/* Passport */}
      <g transform="translate(120, 80)">
        <rect x="0" y="0" width="100" height="140" rx="8" fill="#475569" />
        <rect x="5" y="5" width="90" height="130" rx="6" fill="#334155" />
        <circle cx="50" cy="50" r="25" fill="#64748B" />
        <circle cx="50" cy="50" r="20" fill="#475569" />
        <text x="50" y="55" textAnchor="middle" fill="#94A3B8" fontSize="12" fontWeight="bold">✈</text>
        <rect x="20" y="90" width="60" height="6" rx="2" fill="#64748B" />
        <rect x="25" y="105" width="50" height="4" rx="1" fill="#64748B" />
        <rect x="30" y="115" width="40" height="4" rx="1" fill="#64748B" />
      </g>
      
      {/* Tickets behind passport */}
      <g transform="translate(90, 120) rotate(-15)">
        <rect x="0" y="0" width="80" height="50" rx="4" fill="#FCD34D" />
        <rect x="5" y="5" width="70" height="40" rx="2" fill="#FBBF24" />
        <rect x="10" y="15" width="30" height="4" rx="1" fill="#F59E0B" />
        <rect x="10" y="25" width="50" height="3" rx="1" fill="#F59E0B" />
        <circle cx="65" cy="25" r="8" fill="#F59E0B" opacity="0.5" />
      </g>
      
      {/* Floating coins */}
      <g className="animate-[bounce_3s_ease-in-out_infinite]">
        <circle cx="320" cy="180" r="18" fill="#FBBF24" />
        <circle cx="320" cy="180" r="14" fill="#F59E0B" />
        <text x="320" y="185" textAnchor="middle" fill="#FBBF24" fontSize="14" fontWeight="bold">$</text>
      </g>
      
      <g className="animate-[bounce_3s_ease-in-out_infinite_0.5s]">
        <circle cx="100" cy="70" r="15" fill="#FBBF24" />
        <circle cx="100" cy="70" r="11" fill="#F59E0B" />
        <text x="100" y="75" textAnchor="middle" fill="#FBBF24" fontSize="12" fontWeight="bold">$</text>
      </g>
      
      <g className="animate-[bounce_3s_ease-in-out_infinite_1s]">
        <circle cx="350" cy="120" r="12" fill="#FBBF24" />
        <circle cx="350" cy="120" r="9" fill="#F59E0B" />
        <text x="350" y="124" textAnchor="middle" fill="#FBBF24" fontSize="10" fontWeight="bold">$</text>
      </g>
      
      {/* Sparkles */}
      <polygon points="70,150 73,158 81,158 75,163 77,171 70,166 63,171 65,163 59,158 67,158" fill="#FCD34D" />
      <polygon points="340,200 342,205 347,205 343,208 345,213 340,210 335,213 337,208 333,205 338,205" fill="#FCD34D" />
    </svg>
  );
};
