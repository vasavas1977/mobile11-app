export function DurationIllustration() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Background blob */}
      <ellipse cx="100" cy="105" rx="75" ry="68" fill="#FEF3E2" />
      {/* Calendar body */}
      <rect x="55" y="65" width="90" height="80" rx="12" fill="white" stroke="#F97316" strokeWidth="2" />
      {/* Calendar header */}
      <rect x="55" y="65" width="90" height="24" rx="12" fill="#F97316" />
      <rect x="55" y="77" width="90" height="12" fill="#F97316" />
      {/* Calendar hooks */}
      <rect x="78" y="58" width="4" height="14" rx="2" fill="#FDBA74" />
      <rect x="118" y="58" width="4" height="14" rx="2" fill="#FDBA74" />
      {/* Day dots */}
      <circle cx="75" cy="105" r="4" fill="#FED7AA" />
      <circle cx="92" cy="105" r="4" fill="#FED7AA" />
      <circle cx="109" cy="105" r="4" fill="#F97316" />
      <circle cx="126" cy="105" r="4" fill="#FED7AA" />
      <circle cx="75" cy="122" r="4" fill="#FED7AA" />
      <circle cx="92" cy="122" r="4" fill="#FED7AA" />
      <circle cx="109" cy="122" r="4" fill="#FED7AA" />
      <circle cx="126" cy="122" r="4" fill="#FED7AA" />
      {/* Decorative elements */}
      <circle cx="38" cy="80" r="5" fill="#FED7AA" />
      <circle cx="165" cy="140" r="4" fill="#FDBA74" />
    </svg>
  );
}
