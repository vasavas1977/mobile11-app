import React from 'react';
import { LottieAnimation } from '../landing-v2/LottieAnimation';

export const AnimatedWatermark: React.FC = () => {
  return (
    <div className="relative w-full flex items-end justify-center overflow-hidden h-[240px] sm:h-[280px] md:h-[340px] lg:h-[400px] xl:h-[480px]">
      {/* 3D Ground platform with soil texture */}
      <div className="absolute bottom-[48px] sm:bottom-[56px] md:bottom-[64px] lg:bottom-[72px] xl:bottom-[80px] left-0 right-0 z-5">
        {/* Ground top surface - soil/earth colored */}
        <div 
          className="relative w-full h-8"
          style={{ 
            background: 'linear-gradient(180deg, #B5A68C 0%, #A89878 50%, #9C8E6E 100%)',
          }}
        >
          {/* Soil texture overlay */}
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <defs>
              <pattern id="soilTexture" patternUnits="userSpaceOnUse" width="100" height="20">
                <circle cx="10" cy="8" r="1.5" fill="#8B7D60" opacity="0.4" />
                <circle cx="35" cy="12" r="1" fill="#7A6E52" opacity="0.3" />
                <circle cx="60" cy="6" r="2" fill="#9C8E6E" opacity="0.35" />
                <circle cx="85" cy="14" r="1.2" fill="#8B7D60" opacity="0.4" />
                <circle cx="22" cy="16" r="0.8" fill="#7A6E52" opacity="0.3" />
                <circle cx="72" cy="10" r="1.8" fill="#A89878" opacity="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#soilTexture)" />
          </svg>
          
          {/* Natural rocks scattered on the ground */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 32" preserveAspectRatio="xMidYMid slice">
            {/* Large rocks */}
            <ellipse cx="80" cy="18" rx="22" ry="10" fill="#8A8578" />
            <ellipse cx="78" cy="16" rx="18" ry="8" fill="#9E968A" />
            <ellipse cx="82" cy="14" rx="12" ry="5" fill="#AEA69A" />
            
            <ellipse cx="250" cy="20" rx="18" ry="9" fill="#7A7468" />
            <ellipse cx="248" cy="18" rx="14" ry="7" fill="#908A7E" />
            
            <ellipse cx="420" cy="19" rx="25" ry="11" fill="#8A8578" />
            <ellipse cx="418" cy="17" rx="20" ry="8" fill="#9E968A" />
            <ellipse cx="422" cy="15" rx="14" ry="5" fill="#B0A89C" />
            
            <ellipse cx="600" cy="20" rx="16" ry="8" fill="#7A7468" />
            <ellipse cx="598" cy="18" rx="12" ry="6" fill="#8E8880" />
            
            <ellipse cx="780" cy="18" rx="20" ry="10" fill="#8A8578" />
            <ellipse cx="778" cy="16" rx="16" ry="7" fill="#9E968A" />
            
            <ellipse cx="950" cy="19" rx="24" ry="11" fill="#7A7468" />
            <ellipse cx="948" cy="17" rx="18" ry="8" fill="#908A7E" />
            <ellipse cx="952" cy="15" rx="12" ry="5" fill="#A8A098" />
            
            <ellipse cx="1120" cy="20" rx="18" ry="9" fill="#8A8578" />
            <ellipse cx="1118" cy="18" rx="14" ry="7" fill="#9E968A" />
            
            {/* Small pebbles */}
            <ellipse cx="150" cy="22" rx="8" ry="4" fill="#9E968A" />
            <ellipse cx="180" cy="24" rx="5" ry="3" fill="#8A8578" />
            <ellipse cx="320" cy="23" rx="6" ry="3" fill="#908A7E" />
            <ellipse cx="500" cy="22" rx="7" ry="4" fill="#9E968A" />
            <ellipse cx="550" cy="25" rx="4" ry="2" fill="#8A8578" />
            <ellipse cx="680" cy="23" rx="6" ry="3" fill="#908A7E" />
            <ellipse cx="720" cy="24" rx="5" ry="3" fill="#9E968A" />
            <ellipse cx="850" cy="22" rx="7" ry="4" fill="#8A8578" />
            <ellipse cx="1020" cy="23" rx="6" ry="3" fill="#908A7E" />
            <ellipse cx="1080" cy="25" rx="4" ry="2" fill="#9E968A" />
          </svg>
        </div>
        
        {/* Ground front face (3D depth) - darker soil edge */}
        <div 
          className="w-full h-4"
          style={{ 
            background: 'linear-gradient(180deg, #7A6E52 0%, #685E46 100%)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}
        />
      </div>
      
      {/* Container for text and characters - uses aspect ratio lock for consistent scaling */}
      <div 
        className="relative z-10 flex items-end justify-center pb-[88px] sm:pb-[76px] md:pb-[84px] lg:pb-[92px] xl:pb-[100px]"
        style={{ 
          // This wrapper centers the text+character container
        }}
      >
        {/* Inner container with fixed aspect ratio - characters positioned relative to this */}
        <div 
          className="relative"
          style={{
            // Aspect ratio based on "mobile11" text proportions (approx 5:1)
            aspectRatio: '5 / 1',
          }}
        >
          {/* The "mobile11" text with fluid typography */}
          <div 
            className="whitespace-nowrap font-extrabold tracking-tight leading-none select-none"
            style={{
              fontFamily: 'Poppins, sans-serif',
              color: '#FFFFFF',
              textShadow: '0 6px 20px rgba(0,0,0,0.15), 0 3px 8px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.08)',
              // Fluid font size: scales smoothly between min and max
              fontSize: 'clamp(75px, 18vw, 280px)',
            }}
          >
            mobile11
          </div>
          
          {/* Left character - sitting on letter 'm' */}
          {/* Positioned using percentage relative to container width/height */}
          <div 
            className="absolute z-20"
            style={{
              // Position relative to container: left edge of 'm'
              left: '5%',
              // Bottom position: sits on top of the text (percentage of container height)
              bottom: '64%',
              // Size scales with font using em units (relative to container's implicit font context)
              width: 'clamp(80px, 12vw, 180px)',
              height: 'clamp(80px, 12vw, 180px)',
            }}
          >
            <LottieAnimation 
              src="/assets/lottie/footer-letter-o.lottie"
              className="w-full h-full"
              lazy={true}
              lazyRootMargin="100px"
              speed={0.7}
              devicePixelRatio={2}
            />
          </div>

          {/* Right character - sitting on '11' */}
          {/* Positioned using percentage relative to container width/height */}
          <div 
            className="absolute z-20"
            style={{
              // Position relative to container: right edge near '11'
              right: '-2%',
              // Bottom position: sits on top of the text
              bottom: '78%',
              // Size scales with font
              width: 'clamp(80px, 12vw, 180px)',
              height: 'clamp(80px, 12vw, 180px)',
            }}
          >
            <LottieAnimation 
              src="/assets/lottie/footer-letter-b.lottie"
              className="w-full h-full"
              lazy={true}
              lazyRootMargin="100px"
              speed={0.7}
              devicePixelRatio={2}
            />
          </div>
        </div>
      </div>

      {/* Left plants/foliage - variety of tropical plants */}
      <div className="absolute bottom-[76px] sm:bottom-[88px] md:bottom-[96px] lg:bottom-[104px] xl:bottom-[112px] left-0 w-24 sm:w-32 md:w-48 lg:w-60 h-24 sm:h-32 md:h-44 lg:h-52 z-30 pointer-events-none">
        <svg viewBox="0 0 200 160" className="w-full h-full" fill="none">
          {/* Monstera-style leaf (back) */}
          <path d="M65 160 Q70 130 80 110 Q90 90 105 78 Q90 95 85 115 Q78 135 72 160 Z" fill="#2D5A30" opacity="0.9" />
          <ellipse cx="88" cy="95" rx="6" ry="8" fill="#FAF7F2" opacity="0.3" />
          
          {/* Large banana leaf */}
          <path d="M25 160 Q32 115 48 88 Q65 60 88 45 Q65 70 55 95 Q45 125 38 160 Z" fill="#4A7C4E" opacity="0.95" />
          <path d="M35 160 Q40 130 50 108 Q62 85 78 72 Q60 90 52 112 Q44 135 42 160 Z" fill="#5B8D5E" opacity="0.85" />
          
          {/* Fern fronds */}
          <path d="M15 160 Q18 145 22 135 Q26 125 32 118" stroke="#3D6B40" strokeWidth="2" fill="none" />
          <path d="M18 150 L14 145" stroke="#4A7C4E" strokeWidth="1.5" fill="none" />
          <path d="M20 142 L15 138" stroke="#4A7C4E" strokeWidth="1.5" fill="none" />
          <path d="M23 135 L18 130" stroke="#4A7C4E" strokeWidth="1.5" fill="none" />
          <path d="M26 128 L21 124" stroke="#4A7C4E" strokeWidth="1.5" fill="none" />
          
          {/* Smaller pointed leaves */}
          <path d="M55 160 Q58 140 65 125 Q72 110 82 100 Q72 115 68 132 Q62 148 60 160 Z" fill="#6B9B4E" opacity="0.9" />
          <path d="M75 160 Q78 145 84 132 Q90 120 98 112 Q90 125 86 140 Q82 152 80 160 Z" fill="#3D6B40" opacity="0.85" />
          
          {/* Tall grass blades */}
          <path d="M8 160 L12 138 L16 160" stroke="#5B8D5E" strokeWidth="2.5" fill="none" />
          <path d="M20 160 L26 130 L32 160" stroke="#4A7C4E" strokeWidth="2" fill="none" />
          <path d="M88 160 L92 145 L96 160" stroke="#6B9B4E" strokeWidth="2" fill="none" />
          
          {/* Small filler leaves */}
          <path d="M45 160 Q48 152 52 146 Q56 140 62 136 Q56 145 52 152 Q48 156 47 160 Z" fill="#7AAD5A" opacity="0.8" />
          
          {/* Decorative rocks */}
          <ellipse cx="50" cy="156" rx="14" ry="6" fill="#9E968A" opacity="0.9" />
          <ellipse cx="85" cy="157" rx="10" ry="4" fill="#A8A090" opacity="0.85" />
          <ellipse cx="28" cy="158" rx="7" ry="3" fill="#B8B0A0" opacity="0.8" />
        </svg>
      </div>

      {/* Right plants/foliage - mirrored with variety */}
      <div className="absolute bottom-[76px] sm:bottom-[88px] md:bottom-[96px] lg:bottom-[104px] xl:bottom-[112px] right-0 w-24 sm:w-32 md:w-48 lg:w-60 h-24 sm:h-32 md:h-44 lg:h-52 z-30 pointer-events-none transform scale-x-[-1]">
        <svg viewBox="0 0 200 160" className="w-full h-full" fill="none">
          {/* Bird of paradise style leaf */}
          <path d="M60 160 Q68 125 82 100 Q96 75 115 58 Q95 82 85 108 Q75 135 70 160 Z" fill="#2D5A30" opacity="0.9" />
          
          {/* Palm-like frond */}
          <path d="M30 160 Q38 120 55 90 Q72 60 95 42 Q70 70 58 100 Q46 130 40 160 Z" fill="#3A6B3E" opacity="0.95" />
          <path d="M38 160 Q44 128 58 102 Q72 76 92 58 Q70 82 60 108 Q50 134 46 160 Z" fill="#5B8D5E" opacity="0.85" />
          
          {/* Philodendron style */}
          <path d="M70 160 Q75 138 85 120 Q95 102 108 90 Q95 108 88 128 Q80 148 78 160 Z" fill="#4A7C4E" opacity="0.9" />
          
          {/* Small accent leaves */}
          <path d="M50 160 Q54 148 60 138 Q66 128 75 120 Q66 132 60 145 Q54 155 52 160 Z" fill="#6B9B4E" opacity="0.85" />
          <path d="M85 160 Q88 150 93 142 Q98 134 105 128 Q98 138 94 148 Q90 156 88 160 Z" fill="#7AAD5A" opacity="0.8" />
          
          {/* Fern details */}
          <path d="M18 160 Q22 148 28 138 Q34 128 42 120" stroke="#3D6B40" strokeWidth="2" fill="none" />
          <path d="M22 152 L17 148" stroke="#4A7C4E" strokeWidth="1.5" fill="none" />
          <path d="M26 144 L20 140" stroke="#4A7C4E" strokeWidth="1.5" fill="none" />
          <path d="M30 136 L24 132" stroke="#4A7C4E" strokeWidth="1.5" fill="none" />
          
          {/* Grass blades */}
          <path d="M10 160 L14 142 L18 160" stroke="#5B8D5E" strokeWidth="2.5" fill="none" />
          <path d="M24 160 L30 135 L36 160" stroke="#4A7C4E" strokeWidth="2" fill="none" />
          
          {/* Rocks */}
          <ellipse cx="55" cy="156" rx="12" ry="5" fill="#9E968A" opacity="0.9" />
          <ellipse cx="82" cy="157" rx="8" ry="4" fill="#A8A090" opacity="0.85" />
          <ellipse cx="30" cy="158" rx="6" ry="3" fill="#B8B0A0" opacity="0.8" />
        </svg>
      </div>

      {/* Center scattered foliage and grass */}
      <div className="absolute bottom-[76px] sm:bottom-[88px] md:bottom-[96px] lg:bottom-[104px] xl:bottom-[112px] left-1/2 transform -translate-x-1/2 w-full max-w-3xl h-20 z-15 pointer-events-none">
        <svg viewBox="0 0 800 80" className="w-full h-full" preserveAspectRatio="xMidYMax meet" fill="none">
          {/* Scattered small leaves */}
          <path d="M180 80 Q184 68 190 60 Q196 52 205 46 Q196 56 192 66 Q186 76 184 80 Z" fill="#5B8D5E" opacity="0.7" />
          <path d="M320 80 Q324 70 330 62 Q336 54 344 48 Q336 58 332 68 Q326 76 324 80 Z" fill="#4A7C4E" opacity="0.65" />
          <path d="M480 80 Q484 72 490 65 Q496 58 504 52 Q496 62 492 70 Q486 78 484 80 Z" fill="#6B9B4E" opacity="0.7" />
          <path d="M600 80 Q604 70 610 62 Q616 54 624 48 Q616 58 612 68 Q606 76 604 80 Z" fill="#3D6B40" opacity="0.65" />
          
          {/* Grass tufts */}
          <path d="M220 80 L224 65 L228 80" stroke="#5B8D5E" strokeWidth="2" fill="none" />
          <path d="M380 80 L384 68 L388 80" stroke="#4A7C4E" strokeWidth="1.5" fill="none" />
          <path d="M420 80 L425 70 L430 80" stroke="#6B8E5A" strokeWidth="1.5" fill="none" />
          <path d="M540 80 L544 66 L548 80" stroke="#5A7E4A" strokeWidth="2" fill="none" />
          <path d="M650 80 L654 72 L658 80" stroke="#5B8D5E" strokeWidth="1.5" fill="none" />
          
          {/* Small pebbles */}
          <ellipse cx="260" cy="77" rx="8" ry="3" fill="#A8A090" opacity="0.7" />
          <ellipse cx="450" cy="78" rx="6" ry="2.5" fill="#9E968A" opacity="0.65" />
          <ellipse cx="580" cy="77" rx="7" ry="3" fill="#B8B0A0" opacity="0.6" />
        </svg>
      </div>

      {/* Decorative parrot on the 'i' letter */}
      <div className="absolute bottom-[55%] left-[52%] sm:left-[53%] md:left-[54%] w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 z-40 hidden md:block">
        <svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
          {/* Simple parrot silhouette */}
          <ellipse cx="20" cy="18" rx="8" ry="10" fill="#FF6B35" />
          <circle cx="23" cy="14" r="2" fill="#1a1a1a" />
          <path d="M28 16 Q32 14 30 18 Q28 20 26 18" fill="#FFB347" />
          <path d="M12 22 Q8 28 10 32 Q12 30 14 28" fill="#4CAF50" />
          <path d="M18 28 Q16 34 18 38 Q20 36 20 32" fill="#2196F3" />
        </svg>
      </div>
    </div>
  );
};

export default AnimatedWatermark;
