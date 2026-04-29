import React from 'react';

export const TravelersIllustration: React.FC = () => {
  return (
    <svg viewBox="0 0 400 380" className="w-full h-full max-w-md mx-auto">
      {/* Character 1 - Left: Yellow shirt guy high-fiving */}
      <g className="character-1">
        {/* Legs */}
        <path d="M95 320 L90 370" stroke="#14B8A6" strokeWidth="18" strokeLinecap="round" />
        <path d="M115 320 L120 370" stroke="#14B8A6" strokeWidth="18" strokeLinecap="round" />
        {/* Sneakers */}
        <ellipse cx="88" cy="372" rx="14" ry="8" fill="#1F2937" />
        <ellipse cx="122" cy="372" rx="14" ry="8" fill="#1F2937" />
        
        {/* Body - Yellow t-shirt */}
        <path d="M70 220 Q75 280 95 320 L115 320 Q135 280 140 220 Q105 200 70 220" fill="#FBBF24" />
        
        {/* Arms - High five animated */}
        <g className="animate-arm-highfive" style={{ transformOrigin: '105px 220px' }}>
          {/* Left arm up */}
          <path d="M75 230 Q50 180 45 130" stroke="#FCD9A8" strokeWidth="16" strokeLinecap="round" fill="none" />
          <circle cx="45" cy="125" r="12" fill="#FCD9A8" />
          {/* Right arm up */}
          <path d="M135 230 Q160 180 165 130" stroke="#FCD9A8" strokeWidth="16" strokeLinecap="round" fill="none" />
          <circle cx="165" cy="125" r="12" fill="#FCD9A8" />
        </g>
        
        {/* Neck */}
        <rect x="95" y="195" width="20" height="15" fill="#FCD9A8" />
        
        {/* Head */}
        <circle cx="105" cy="170" r="38" fill="#FCD9A8" />
        
        {/* Hair - Short brown */}
        <path d="M67 155 Q75 120 105 115 Q135 120 143 155 Q140 140 105 135 Q70 140 67 155" fill="#8B4513" />
        <ellipse cx="105" cy="135" rx="30" ry="15" fill="#8B4513" />
        
        {/* Face - Happy */}
        <circle cx="90" cy="165" r="4" fill="#1F2937" />
        <circle cx="120" cy="165" r="4" fill="#1F2937" />
        <path d="M90 185 Q105 200 120 185" stroke="#1F2937" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* Eyebrows - excited */}
        <path d="M85 155 L95 152" stroke="#8B4513" strokeWidth="2" strokeLinecap="round" />
        <path d="M115 152 L125 155" stroke="#8B4513" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Character 2 - Center: Woman with curly hair and phone */}
      <g className="character-2 animate-body-sway" style={{ transformOrigin: '200px 300px' }}>
        {/* Legs */}
        <path d="M185 340 L180 375" stroke="#3B82F6" strokeWidth="20" strokeLinecap="round" />
        <path d="M215 340 L220 375" stroke="#3B82F6" strokeWidth="20" strokeLinecap="round" />
        {/* Sneakers */}
        <ellipse cx="178" cy="378" rx="15" ry="9" fill="#E5E7EB" />
        <ellipse cx="222" cy="378" rx="15" ry="9" fill="#E5E7EB" />
        
        {/* Body - Denim overalls */}
        <path d="M160 235 Q165 300 185 340 L215 340 Q235 300 240 235 Q200 210 160 235" fill="#3B82F6" />
        {/* Overalls straps */}
        <path d="M175 235 L175 260" stroke="#2563EB" strokeWidth="8" strokeLinecap="round" />
        <path d="M225 235 L225 260" stroke="#2563EB" strokeWidth="8" strokeLinecap="round" />
        {/* Coral top visible */}
        <path d="M165 240 Q200 225 235 240 Q200 215 165 240" fill="#F87171" />
        
        {/* Arms */}
        <path d="M165 255 Q140 280 135 310" stroke="#FCD9A8" strokeWidth="14" strokeLinecap="round" fill="none" />
        <circle cx="133" cy="312" r="10" fill="#FCD9A8" />
        
        {/* Right arm with phone - animated */}
        <g className="animate-phone-bob" style={{ transformOrigin: '255px 280px' }}>
          <path d="M235 255 Q260 270 265 290" stroke="#FCD9A8" strokeWidth="14" strokeLinecap="round" fill="none" />
          <circle cx="268" cy="295" r="10" fill="#FCD9A8" />
          {/* Phone */}
          <g transform="translate(255, 300) rotate(-10)">
            <rect x="0" y="0" width="24" height="40" rx="4" fill="#1F2937" />
            <rect x="2" y="3" width="20" height="32" rx="2" fill="#60A5FA" />
          </g>
        </g>
        
        {/* Neck */}
        <rect x="190" y="205" width="20" height="12" fill="#FCD9A8" />
        
        {/* Head */}
        <circle cx="200" cy="175" r="42" fill="#FCD9A8" />
        
        {/* Curly afro hair - animated */}
        <g className="animate-hair-flutter" style={{ transformOrigin: '200px 140px' }}>
          <circle cx="165" cy="155" r="20" fill="#3D2314" />
          <circle cx="185" cy="140" r="22" fill="#3D2314" />
          <circle cx="210" cy="138" r="24" fill="#3D2314" />
          <circle cx="235" cy="150" r="20" fill="#3D2314" />
          <circle cx="175" cy="175" r="15" fill="#3D2314" />
          <circle cx="225" cy="175" r="15" fill="#3D2314" />
          <circle cx="200" cy="130" r="20" fill="#3D2314" />
          <circle cx="155" cy="170" r="12" fill="#3D2314" />
          <circle cx="245" cy="165" r="12" fill="#3D2314" />
        </g>
        
        {/* Face - Friendly smile */}
        <circle cx="185" cy="175" r="4" fill="#1F2937" />
        <circle cx="215" cy="175" r="4" fill="#1F2937" />
        <path d="M185 195 Q200 210 215 195" stroke="#1F2937" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* Blush */}
        <ellipse cx="172" cy="188" rx="8" ry="5" fill="#FECACA" opacity="0.6" />
        <ellipse cx="228" cy="188" rx="8" ry="5" fill="#FECACA" opacity="0.6" />
      </g>

      {/* Character 3 - Right: Woman with ponytail, green cardigan */}
      <g className="character-3">
        {/* Legs - Golden dress shows */}
        <path d="M285 340 L280 375" stroke="#F59E0B" strokeWidth="18" strokeLinecap="round" />
        <path d="M315 340 L320 375" stroke="#F59E0B" strokeWidth="18" strokeLinecap="round" />
        {/* Red sneakers */}
        <ellipse cx="278" cy="378" rx="14" ry="8" fill="#DC2626" />
        <ellipse cx="322" cy="378" rx="14" ry="8" fill="#DC2626" />
        
        {/* Body - Golden dress */}
        <path d="M265 235 Q268 295 285 340 L315 340 Q332 295 335 235 Q300 210 265 235" fill="#F59E0B" />
        
        {/* Green cardigan */}
        <path d="M258 235 Q260 280 270 310" stroke="#22C55E" strokeWidth="25" strokeLinecap="round" fill="none" />
        <path d="M342 235 Q340 280 330 310" stroke="#22C55E" strokeWidth="25" strokeLinecap="round" fill="none" />
        <path d="M265 235 Q300 220 335 235" stroke="#22C55E" strokeWidth="12" fill="none" />
        
        {/* Left arm */}
        <path d="M262 260 Q240 290 235 315" stroke="#FCD9A8" strokeWidth="13" strokeLinecap="round" fill="none" />
        <circle cx="233" cy="318" r="9" fill="#FCD9A8" />
        
        {/* Right arm with phone - animated */}
        <g className="animate-phone-bob-alt" style={{ transformOrigin: '345px 285px', animationDelay: '0.3s' }}>
          <path d="M338 260 Q355 280 360 300" stroke="#FCD9A8" strokeWidth="13" strokeLinecap="round" fill="none" />
          <circle cx="362" cy="305" r="9" fill="#FCD9A8" />
          {/* Phone */}
          <g transform="translate(350, 310) rotate(5)">
            <rect x="0" y="0" width="22" height="36" rx="3" fill="#1F2937" />
            <rect x="2" y="3" width="18" height="28" rx="2" fill="#A78BFA" />
          </g>
        </g>
        
        {/* Neck */}
        <rect x="290" y="200" width="18" height="12" fill="#FCD9A8" />
        
        {/* Head */}
        <circle cx="300" cy="170" r="36" fill="#FCD9A8" />
        
        {/* Hair - Brown ponytail */}
        <ellipse cx="300" cy="145" rx="28" ry="20" fill="#92400E" />
        <path d="M272 155 Q280 140 300 135 Q320 140 328 155" fill="#92400E" />
        {/* Ponytail - animated */}
        <g className="animate-ponytail-swing" style={{ transformOrigin: '330px 140px' }}>
          <path d="M325 145 Q355 140 365 175 Q360 210 340 230" stroke="#92400E" strokeWidth="18" strokeLinecap="round" fill="none" />
        </g>
        
        {/* Face */}
        <circle cx="288" cy="168" r="3.5" fill="#1F2937" />
        <circle cx="312" cy="168" r="3.5" fill="#1F2937" />
        <path d="M290 188 Q300 198 310 188" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {/* Blush */}
        <ellipse cx="278" cy="180" rx="7" ry="4" fill="#FECACA" opacity="0.5" />
        <ellipse cx="322" cy="180" rx="7" ry="4" fill="#FECACA" opacity="0.5" />
      </g>

      {/* Ground elements - grass and leaves */}
      <g className="ground-elements">
        {/* Grass tufts */}
        <path d="M50 378 Q55 365 52 378 Q58 360 55 378 Q62 368 60 378" stroke="#22C55E" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M140 380 Q145 370 143 380 Q148 365 146 380" stroke="#22C55E" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M250 378 Q255 368 253 378 Q258 362 256 378 Q262 370 260 378" stroke="#22C55E" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M350 380 Q354 372 352 380 Q358 368 356 380" stroke="#22C55E" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        
        {/* Small leaves */}
        <ellipse cx="70" cy="375" rx="8" ry="4" fill="#86EFAC" transform="rotate(-20, 70, 375)" />
        <ellipse cx="170" cy="377" rx="6" ry="3" fill="#86EFAC" transform="rotate(15, 170, 377)" />
        <ellipse cx="330" cy="376" rx="7" ry="3.5" fill="#86EFAC" transform="rotate(-10, 330, 376)" />
      </g>
    </svg>
  );
};
