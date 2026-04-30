export function DataIllustration() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Background blob */}
      <ellipse cx="100" cy="105" rx="78" ry="70" fill="#FEF3E2" />
      {/* Signal tower */}
      <rect x="96" y="70" width="8" height="60" rx="4" fill="#F97316" />
      <rect x="92" y="130" width="16" height="6" rx="3" fill="#FDBA74" />
      {/* Signal waves */}
      <path d="M75 85 C75 70 100 60 100 60" stroke="#FDBA74" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M65 95 C65 72 100 55 100 55" stroke="#FED7AA" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M125 85 C125 70 100 60 100 60" stroke="#FDBA74" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M135 95 C135 72 100 55 100 55" stroke="#FED7AA" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Data bars */}
      <rect x="55" y="145" width="12" height="20" rx="4" fill="#FED7AA" />
      <rect x="72" y="138" width="12" height="27" rx="4" fill="#FDBA74" />
      <rect x="89" y="130" width="12" height="35" rx="4" fill="#F97316" />
      <rect x="106" y="135" width="12" height="30" rx="4" fill="#FDBA74" />
      <rect x="123" y="142" width="12" height="23" rx="4" fill="#FED7AA" />
      {/* Decorative */}
      <circle cx="45" cy="70" r="4" fill="#FED7AA" />
      <circle cx="158" cy="75" r="5" fill="#FDBA74" />
    </svg>
  );
}
