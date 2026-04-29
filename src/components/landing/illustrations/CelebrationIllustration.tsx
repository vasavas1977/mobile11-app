import React from 'react';

// Accept isActive prop for consistency with other slide illustrations
export const CelebrationIllustration: React.FC<{ isActive?: boolean }> = () => {
  return (
    <svg viewBox="0 0 400 380" className="w-full h-full max-w-md mx-auto">
      {/* Confetti - animated */}
      <g className="confetti">
        <rect x="50" y="40" width="10" height="10" fill="#EF4444" className="animate-confetti-1" style={{ transformOrigin: '55px 45px' }} />
        <rect x="90" y="25" width="8" height="12" fill="#3B82F6" className="animate-confetti-2" style={{ transformOrigin: '94px 31px' }} />
        <rect x="140" y="35" width="10" height="8" fill="#10B981" className="animate-confetti-3" style={{ transformOrigin: '145px 39px' }} />
        <rect x="190" y="20" width="9" height="9" fill="#F59E0B" className="animate-confetti-1" style={{ transformOrigin: '195px 25px' }} />
        <rect x="240" y="40" width="8" height="11" fill="#EC4899" className="animate-confetti-2" style={{ transformOrigin: '244px 46px' }} />
        <rect x="290" y="30" width="10" height="8" fill="#8B5CF6" className="animate-confetti-3" style={{ transformOrigin: '295px 34px' }} />
        <rect x="340" y="45" width="9" height="10" fill="#06B6D4" className="animate-confetti-1" style={{ transformOrigin: '345px 50px' }} />
        
        <circle cx="70" cy="60" r="5" fill="#F97316" className="animate-confetti-2" />
        <circle cx="120" cy="50" r="6" fill="#14B8A6" className="animate-confetti-1" />
        <circle cx="170" cy="55" r="5" fill="#F43F5E" className="animate-confetti-3" />
        <circle cx="220" cy="45" r="6" fill="#84CC16" className="animate-confetti-2" />
        <circle cx="270" cy="60" r="5" fill="#A855F7" className="animate-confetti-1" />
        <circle cx="320" cy="50" r="6" fill="#FBBF24" className="animate-confetti-3" />
      </g>

      {/* Trophy - animated bounce */}
      <g className="trophy animate-trophy-bounce" style={{ transformOrigin: '200px 135px' }}>
        {/* Trophy handles */}
        <path d="M155 110 Q135 115 130 140 Q135 165 155 170" stroke="#FBBF24" strokeWidth="8" fill="none" strokeLinecap="round" />
        <path d="M245 110 Q265 115 270 140 Q265 165 245 170" stroke="#FBBF24" strokeWidth="8" fill="none" strokeLinecap="round" />
        
        {/* Trophy cup */}
        <path d="M155 95 L155 110 L245 110 L245 95 Z" fill="#FBBF24" />
        <path d="M155 110 L165 175 L235 175 L245 110 Z" fill="#FBBF24" />
        
        {/* Trophy base */}
        <rect x="180" y="175" width="40" height="25" fill="#F59E0B" />
        <rect x="165" y="195" width="70" height="15" rx="3" fill="#FBBF24" />
        
        {/* Trophy shine */}
        <ellipse cx="185" cy="140" rx="12" ry="18" fill="#FEF3C7" opacity="0.5" />
        
        {/* Star on trophy */}
        <polygon points="200,100 205,115 220,115 208,125 213,140 200,130 187,140 192,125 180,115 195,115" fill="#FEF3C7" className="animate-shine" />
        
        {/* Number 1 */}
        <text x="200" y="190" textAnchor="middle" fill="#92400E" fontSize="16" fontWeight="bold">1</text>
      </g>

      {/* Character 1 - Left, arms up celebrating */}
      <g className="character-1">
        {/* Legs */}
        <path d="M85 340 L80 378" stroke="#1E40AF" strokeWidth="18" strokeLinecap="round" />
        <path d="M115 340 L120 378" stroke="#1E40AF" strokeWidth="18" strokeLinecap="round" />
        <ellipse cx="78" cy="380" rx="12" ry="7" fill="#1F2937" />
        <ellipse cx="122" cy="380" rx="12" ry="7" fill="#1F2937" />
        
        {/* Body */}
        <path d="M70 245 Q75 300 85 340 L115 340 Q125 300 130 245 Q100 220 70 245" fill="#3B82F6" />
        
        {/* Arms up - animated */}
        <g className="animate-arms-celebrate" style={{ transformOrigin: '100px 260px' }}>
          <path d="M75 260 Q50 210 40 165" stroke="#FCD9A8" strokeWidth="14" strokeLinecap="round" fill="none" />
          <path d="M125 260 Q150 210 160 165" stroke="#FCD9A8" strokeWidth="14" strokeLinecap="round" fill="none" />
          <circle cx="38" cy="160" r="11" fill="#FCD9A8" />
          <circle cx="162" cy="160" r="11" fill="#FCD9A8" />
        </g>
        
        {/* Neck */}
        <rect x="90" y="220" width="18" height="10" fill="#FCD9A8" />
        
        {/* Head */}
        <circle cx="100" cy="195" r="32" fill="#FCD9A8" />
        
        {/* Red hair */}
        <path d="M68 185 Q80 155 100 150 Q120 155 132 185 Q125 170 100 165 Q75 170 68 185" fill="#DC2626" />
        <ellipse cx="100" cy="168" rx="25" ry="15" fill="#DC2626" />
        
        {/* Excited face */}
        <path d="M88 190 Q90 185 94 190" stroke="#1F2937" strokeWidth="2.5" fill="none" />
        <path d="M106 190 Q108 185 112 190" stroke="#1F2937" strokeWidth="2.5" fill="none" />
        <ellipse cx="100" cy="210" rx="10" ry="7" fill="#1F2937" />
      </g>

      {/* Character 2 - Center, jumping */}
      <g className="character-2 animate-jump" style={{ transformOrigin: '200px 340px' }}>
        {/* Legs */}
        <path d="M185 345 L180 378" stroke="#065F46" strokeWidth="20" strokeLinecap="round" />
        <path d="M215 345 L220 378" stroke="#065F46" strokeWidth="20" strokeLinecap="round" />
        <ellipse cx="178" cy="382" rx="14" ry="8" fill="#FDE68A" />
        <ellipse cx="222" cy="382" rx="14" ry="8" fill="#FDE68A" />
        
        {/* Body */}
        <path d="M165 250 Q170 305 185 345 L215 345 Q230 305 235 250 Q200 225 165 250" fill="#10B981" />
        
        {/* Arms up */}
        <path d="M170 270 Q135 220 120 175" stroke="#FCD9A8" strokeWidth="15" strokeLinecap="round" fill="none" />
        <path d="M230 270 Q265 220 280 175" stroke="#FCD9A8" strokeWidth="15" strokeLinecap="round" fill="none" />
        <circle cx="118" cy="170" r="12" fill="#FCD9A8" />
        <circle cx="282" cy="170" r="12" fill="#FCD9A8" />
        
        {/* Neck */}
        <rect x="190" y="225" width="20" height="10" fill="#FCD9A8" />
        
        {/* Head */}
        <circle cx="200" cy="200" r="35" fill="#FCD9A8" />
        
        {/* Purple hair */}
        <ellipse cx="200" cy="172" rx="30" ry="18" fill="#7C3AED" />
        <circle cx="175" cy="185" r="10" fill="#7C3AED" />
        <circle cx="225" cy="185" r="10" fill="#7C3AED" />
        
        {/* Super excited face - open mouth */}
        <circle cx="188" cy="195" r="5" fill="#1F2937" />
        <circle cx="212" cy="195" r="5" fill="#1F2937" />
        <ellipse cx="200" cy="220" rx="14" ry="10" fill="#1F2937" />
        <ellipse cx="200" cy="218" rx="8" ry="5" fill="#F87171" />
      </g>

      {/* Character 3 - Right, clapping */}
      <g className="character-3">
        {/* Legs */}
        <path d="M285 340 L280 378" stroke="#C2410C" strokeWidth="18" strokeLinecap="round" />
        <path d="M315 340 L320 378" stroke="#C2410C" strokeWidth="18" strokeLinecap="round" />
        <ellipse cx="278" cy="380" rx="12" ry="7" fill="#1F2937" />
        <ellipse cx="322" cy="380" rx="12" ry="7" fill="#1F2937" />
        
        {/* Body */}
        <path d="M270 245 Q275 300 285 340 L315 340 Q325 300 330 245 Q300 220 270 245" fill="#F97316" />
        
        {/* Clapping arms - animated */}
        <g className="animate-clap" style={{ transformOrigin: '300px 280px' }}>
          <path d="M275 275 Q250 260 240 250" stroke="#FDE68A" strokeWidth="13" strokeLinecap="round" fill="none" />
          <path d="M325 275 Q350 260 360 250" stroke="#FDE68A" strokeWidth="13" strokeLinecap="round" fill="none" />
          <circle cx="238" cy="248" r="10" fill="#FDE68A" />
          <circle cx="362" cy="248" r="10" fill="#FDE68A" />
        </g>
        
        {/* Neck */}
        <rect x="290" y="220" width="18" height="10" fill="#FDE68A" />
        
        {/* Head */}
        <circle cx="300" cy="195" r="32" fill="#FDE68A" />
        
        {/* Dark short hair */}
        <ellipse cx="300" cy="172" rx="28" ry="15" fill="#1F2937" />
        <rect x="272" y="165" width="56" height="12" rx="6" fill="#1F2937" />
        
        {/* Happy face */}
        <circle cx="288" cy="192" r="3.5" fill="#1F2937" />
        <circle cx="312" cy="192" r="3.5" fill="#1F2937" />
        <path d="M288 210 Q300 222 312 210" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>

      {/* Sparkle stars */}
      <g className="stars">
        <polygon points="55,120 58,130 68,130 60,137 63,147 55,141 47,147 50,137 42,130 52,130" fill="#FBBF24" className="animate-shine" />
        <polygon points="345,110 347,118 355,118 349,123 352,131 345,126 338,131 341,123 335,118 343,118" fill="#FBBF24" className="animate-shine" style={{ animationDelay: '0.4s' }} />
        <polygon points="40,200 42,207 50,207 44,212 46,220 40,215 34,220 36,212 30,207 38,207" fill="#F97316" className="animate-shine" style={{ animationDelay: '0.8s' }} />
        <polygon points="360,190 362,197 370,197 364,202 366,210 360,205 354,210 356,202 350,197 358,197" fill="#EC4899" className="animate-shine" style={{ animationDelay: '1.2s' }} />
      </g>
    </svg>
  );
};
