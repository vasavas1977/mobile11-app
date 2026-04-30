export function DestinationIllustration() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Background blob */}
      <ellipse cx="100" cy="110" rx="80" ry="70" fill="#FEF3E2" />
      {/* Globe */}
      <circle cx="100" cy="95" r="45" fill="#FFF7ED" stroke="#F97316" strokeWidth="2" />
      {/* Meridians */}
      <ellipse cx="100" cy="95" rx="20" ry="45" fill="none" stroke="#FDBA74" strokeWidth="1.5" />
      <line x1="55" y1="95" x2="145" y2="95" stroke="#FDBA74" strokeWidth="1.5" />
      <ellipse cx="100" cy="75" rx="35" ry="8" fill="none" stroke="#FDBA74" strokeWidth="1" />
      <ellipse cx="100" cy="115" rx="35" ry="8" fill="none" stroke="#FDBA74" strokeWidth="1" />
      {/* Pin */}
      <path d="M120 70 C120 58 132 55 132 67 C132 75 120 85 120 85 C120 85 108 75 108 67 C108 55 120 58 120 70Z" fill="#F97316" />
      <circle cx="120" cy="67" r="4" fill="white" />
      {/* Small decorative dots */}
      <circle cx="40" cy="60" r="4" fill="#FED7AA" />
      <circle cx="160" cy="130" r="6" fill="#FED7AA" />
      <circle cx="155" cy="55" r="3" fill="#FDBA74" />
    </svg>
  );
}
