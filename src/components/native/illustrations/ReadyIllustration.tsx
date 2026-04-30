export function ReadyIllustration() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Background blob */}
      <ellipse cx="100" cy="100" rx="75" ry="72" fill="#FEF3E2" />
      {/* Phone body */}
      <rect x="72" y="50" width="56" height="100" rx="12" fill="white" stroke="#F97316" strokeWidth="2" />
      {/* Screen */}
      <rect x="78" y="62" width="44" height="76" rx="4" fill="#FFF7ED" />
      {/* Checkmark circle */}
      <circle cx="100" cy="92" r="18" fill="#F97316" />
      <path d="M91 92 L97 98 L110 85" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {/* Signal bars on phone */}
      <rect x="84" y="115" width="4" height="8" rx="2" fill="#FDBA74" />
      <rect x="91" y="112" width="4" height="11" rx="2" fill="#FDBA74" />
      <rect x="98" y="109" width="4" height="14" rx="2" fill="#F97316" />
      <rect x="105" y="106" width="4" height="17" rx="2" fill="#F97316" />
      <rect x="112" y="103" width="4" height="20" rx="2" fill="#F97316" />
      {/* Sparkles */}
      <circle cx="50" cy="65" r="4" fill="#FED7AA" />
      <circle cx="150" cy="70" r="5" fill="#FDBA74" />
      <circle cx="145" cy="140" r="3" fill="#FED7AA" />
      <circle cx="55" cy="135" r="4" fill="#FDBA74" />
      {/* Small stars */}
      <path d="M45 95 L47 90 L49 95 L54 97 L49 99 L47 104 L45 99 L40 97Z" fill="#FDBA74" />
      <path d="M155 105 L157 100 L159 105 L164 107 L159 109 L157 114 L155 109 L150 107Z" fill="#FED7AA" />
    </svg>
  );
}
