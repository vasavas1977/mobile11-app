import React from 'react';

export const HikersIllustration: React.FC = () => {
  return (
    <svg viewBox="0 0 400 400" className="w-full h-full max-w-md mx-auto">
      {/* Background glow/sunrise */}
      <defs>
        <radialGradient id="sunriseGlow" cx="50%" cy="70%" r="60%" fx="50%" fy="70%">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="50%" stopColor="#FDE68A" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#FAF7F2" stopOpacity="0" />
        </radialGradient>
      </defs>
      
      {/* Sunrise glow behind characters */}
      <ellipse cx="200" cy="340" rx="180" ry="120" fill="url(#sunriseGlow)" />
      
      {/* Grassy hill/platform */}
      <ellipse cx="200" cy="365" rx="175" ry="45" fill="#86EFAC" />
      <ellipse cx="200" cy="360" rx="160" ry="35" fill="#4ADE80" />
      
      {/* Small bushes/trees on hill */}
      <g className="animate-gentle-tilt" style={{ transformOrigin: '80px 320px' }}>
        <ellipse cx="80" cy="330" rx="20" ry="25" fill="#22C55E" />
        <ellipse cx="75" cy="325" rx="12" ry="18" fill="#16A34A" />
      </g>
      <g className="animate-gentle-tilt" style={{ transformOrigin: '320px 325px' }}>
        <ellipse cx="320" cy="335" rx="18" ry="22" fill="#22C55E" />
        <ellipse cx="325" cy="330" rx="10" ry="15" fill="#16A34A" />
      </g>
      <ellipse cx="50" cy="345" rx="12" ry="15" fill="#4ADE80" />
      <ellipse cx="350" cy="345" rx="14" ry="18" fill="#4ADE80" />

      {/* Character 1 - Pink hair woman with headphones (LEFT) */}
      <g className="character-1 animate-body-sway" style={{ transformOrigin: '130px 340px' }}>
        {/* Legs - Blue jeans */}
        <path d="M115 295 L108 345" stroke="#3B82F6" strokeWidth="22" strokeLinecap="round" />
        <path d="M145 295 L152 345" stroke="#3B82F6" strokeWidth="22" strokeLinecap="round" />
        
        {/* Feet/shoes */}
        <ellipse cx="105" cy="350" rx="14" ry="8" fill="#1F2937" />
        <ellipse cx="155" cy="350" rx="14" ry="8" fill="#1F2937" />
        
        {/* Body - Orange/coral top */}
        <path d="M100 190 Q105 250 115 295 L145 295 Q155 250 160 190 Q130 165 100 190" fill="#F97316" />
        {/* Top highlight */}
        <path d="M110 195 Q130 180 150 195 L145 230 L115 230 Z" fill="#FB923C" opacity="0.6" />
        
        {/* Left arm down */}
        <path d="M105 205 Q80 240 75 280" stroke="#FCD9A8" strokeWidth="16" strokeLinecap="round" fill="none" />
        <circle cx="73" cy="285" r="12" fill="#FCD9A8" />
        
        {/* Right arm raised - waving with phone */}
        <g className="animate-arm-wave" style={{ transformOrigin: '160px 205px' }}>
          <path d="M155 205 Q185 170 195 130" stroke="#FCD9A8" strokeWidth="16" strokeLinecap="round" fill="none" />
          <circle cx="198" cy="125" r="13" fill="#FCD9A8" />
          {/* Phone in hand */}
          <g transform="translate(185, 95) rotate(-15)">
            <rect x="0" y="0" width="28" height="45" rx="4" fill="#1F2937" />
            <rect x="2" y="3" width="24" height="37" rx="2" fill="#60A5FA" />
            <circle cx="14" cy="8" r="3" fill="#1F2937" />
          </g>
        </g>
        
        {/* Neck */}
        <rect x="120" y="170" width="20" height="14" fill="#FCD9A8" />
        
        {/* Head */}
        <circle cx="130" cy="140" r="42" fill="#FCD9A8" />
        
        {/* Pink/coral hair with buns */}
        <circle cx="95" cy="115" r="22" fill="#FB7185" />
        <circle cx="165" cy="115" r="22" fill="#FB7185" />
        {/* Hair base */}
        <path d="M90 140 Q88 110 100 100 Q130 85 160 100 Q172 110 170 140" fill="#FB7185" />
        {/* Hair highlights */}
        <circle cx="95" cy="108" r="8" fill="#FDA4AF" opacity="0.6" />
        <circle cx="165" cy="108" r="8" fill="#FDA4AF" opacity="0.6" />
        
        {/* Pink headphones */}
        <path d="M88 135 Q75 100 95 85" stroke="#EC4899" strokeWidth="8" strokeLinecap="round" fill="none" />
        <path d="M172 135 Q185 100 165 85" stroke="#EC4899" strokeWidth="8" strokeLinecap="round" fill="none" />
        <ellipse cx="88" cy="140" rx="10" ry="15" fill="#EC4899" />
        <ellipse cx="172" cy="140" rx="10" ry="15" fill="#EC4899" />
        <ellipse cx="88" cy="140" rx="6" ry="10" fill="#DB2777" />
        <ellipse cx="172" cy="140" rx="6" ry="10" fill="#DB2777" />
        
        {/* Face */}
        <circle cx="115" cy="138" r="5" fill="#1F2937" />
        <circle cx="145" cy="138" r="5" fill="#1F2937" />
        {/* Eye shine */}
        <circle cx="117" cy="136" r="2" fill="white" />
        <circle cx="147" cy="136" r="2" fill="white" />
        {/* Happy closed-eye smile for left eye */}
        <path d="M112 138 Q115 142 118 138" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* Smile */}
        <path d="M115 158 Q130 172 145 158" stroke="#1F2937" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* Blush */}
        <ellipse cx="105" cy="150" rx="8" ry="5" fill="#FECACA" opacity="0.5" />
        <ellipse cx="155" cy="150" rx="8" ry="5" fill="#FECACA" opacity="0.5" />
      </g>

      {/* Character 2 - Dark hair woman in green jacket (RIGHT) */}
      <g className="character-2 animate-gentle-float" style={{ transformOrigin: '270px 340px' }}>
        {/* Legs - Tan/brown wide pants */}
        <path d="M250 300 L242 350" stroke="#D97706" strokeWidth="26" strokeLinecap="round" />
        <path d="M290 300 L298 350" stroke="#D97706" strokeWidth="26" strokeLinecap="round" />
        
        {/* Feet/shoes */}
        <ellipse cx="240" cy="355" rx="15" ry="8" fill="#92400E" />
        <ellipse cx="300" cy="355" rx="15" ry="8" fill="#92400E" />
        
        {/* Body - Green jacket over yellow top */}
        <path d="M235 195 Q240 255 250 300 L290 300 Q300 255 305 195 Q270 168 235 195" fill="#22C55E" />
        {/* Yellow inner top visible */}
        <path d="M250 200 Q270 188 290 200 L285 250 L255 250 Z" fill="#FBBF24" />
        {/* Jacket lapels */}
        <path d="M248 200 L260 240 L250 245" fill="#16A34A" />
        <path d="M292 200 L280 240 L290 245" fill="#16A34A" />
        
        {/* Left arm */}
        <path d="M240 215 Q215 250 210 290" stroke="#FCD9A8" strokeWidth="15" strokeLinecap="round" fill="none" />
        <circle cx="208" cy="295" r="11" fill="#FCD9A8" />
        
        {/* Right arm raised - holding phone up */}
        <g className="animate-phone-bob" style={{ transformOrigin: '305px 215px' }}>
          <path d="M300 215 Q330 175 340 135" stroke="#FCD9A8" strokeWidth="15" strokeLinecap="round" fill="none" />
          <circle cx="343" cy="130" r="12" fill="#FCD9A8" />
          {/* Phone held up */}
          <g transform="translate(328, 85) rotate(10)">
            <rect x="0" y="0" width="30" height="48" rx="5" fill="#1F2937" />
            <rect x="2" y="4" width="26" height="38" rx="3" fill="#60A5FA" />
            {/* Camera notch */}
            <circle cx="15" cy="9" r="3" fill="#1F2937" />
          </g>
        </g>
        
        {/* Neck */}
        <rect x="260" y="175" width="20" height="14" fill="#FCD9A8" />
        
        {/* Head */}
        <circle cx="270" cy="145" r="40" fill="#FCD9A8" />
        
        {/* Dark hair with buns */}
        <circle cx="235" cy="118" r="20" fill="#1F2937" />
        <circle cx="305" cy="118" r="20" fill="#1F2937" />
        {/* Hair base */}
        <path d="M232 145 Q228 115 242 105 Q270 88 298 105 Q312 115 308 145" fill="#1F2937" />
        {/* Hair shine */}
        <ellipse cx="250" cy="115" rx="8" ry="6" fill="#374151" opacity="0.5" />
        <ellipse cx="290" cy="115" rx="8" ry="6" fill="#374151" opacity="0.5" />
        
        {/* Face */}
        <circle cx="255" cy="142" r="4.5" fill="#1F2937" />
        <circle cx="285" cy="142" r="4.5" fill="#1F2937" />
        {/* Eye shine */}
        <circle cx="257" cy="140" r="1.5" fill="white" />
        <circle cx="287" cy="140" r="1.5" fill="white" />
        {/* Smile */}
        <path d="M255 162 Q270 175 285 162" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {/* Blush */}
        <ellipse cx="245" cy="152" rx="7" ry="4" fill="#FECACA" opacity="0.5" />
        <ellipse cx="295" cy="152" rx="7" ry="4" fill="#FECACA" opacity="0.5" />
      </g>

      {/* Small decorative grass tufts */}
      <g className="ground-elements">
        <path d="M100 360 Q103 350 101 360 Q106 345 104 360" stroke="#16A34A" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M300 358 Q303 348 301 358 Q306 343 304 358" stroke="#16A34A" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M180 365 Q182 358 181 365" stroke="#22C55E" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M220 365 Q222 358 221 365" stroke="#22C55E" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
};
