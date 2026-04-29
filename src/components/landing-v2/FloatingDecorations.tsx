import React from 'react';

interface DecorationProps {
  className?: string;
}

// Floating geometric decorations like Airalo's design
export const FloatingDecorations: React.FC<DecorationProps> = ({ className = '' }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Top right orange diamond */}
      <div 
        className="absolute top-20 right-[15%] w-6 h-6 bg-[hsl(25,95%,53%)] rotate-45 rounded-sm animate-v2-float-slow opacity-80"
        style={{ animationDelay: '0s' }}
      />
      
      {/* Top left peach circle */}
      <div 
        className="absolute top-32 left-[10%] w-5 h-5 bg-[hsl(30,100%,72%)] rounded-full animate-v2-float-medium opacity-70"
        style={{ animationDelay: '0.5s' }}
      />
      
      {/* Mid right mint diamond */}
      <div 
        className="absolute top-[40%] right-[8%] w-8 h-8 bg-[hsl(156,72%,80%)] rotate-45 rounded-sm animate-v2-float-slow opacity-60"
        style={{ animationDelay: '1s' }}
      />
      
      {/* Bottom left sky blue diamond */}
      <div 
        className="absolute bottom-[30%] left-[5%] w-5 h-5 bg-[hsl(199,95%,84%)] rotate-45 rounded-sm animate-v2-float-medium opacity-70"
        style={{ animationDelay: '1.5s' }}
      />
      
      {/* Bottom right orange circle */}
      <div 
        className="absolute bottom-[20%] right-[12%] w-4 h-4 bg-[hsl(27,96%,61%)] rounded-full animate-v2-float-fast opacity-60"
        style={{ animationDelay: '2s' }}
      />
      
      {/* Center left green diamond */}
      <div 
        className="absolute top-[55%] left-[12%] w-4 h-4 bg-[hsl(142,69%,58%)] rotate-45 rounded-sm animate-v2-float-slow opacity-50"
        style={{ animationDelay: '0.8s' }}
      />
      
      {/* Top center small peach diamond */}
      <div 
        className="absolute top-16 left-[40%] w-3 h-3 bg-[hsl(30,100%,72%)] rotate-45 rounded-sm animate-v2-float-medium opacity-50"
        style={{ animationDelay: '2.5s' }}
      />
      
      {/* Bottom center mint circle */}
      <div 
        className="absolute bottom-[15%] left-[35%] w-6 h-6 bg-[hsl(156,72%,80%)] rounded-full animate-v2-float-slow opacity-40"
        style={{ animationDelay: '3s' }}
      />
    </div>
  );
};

// Smaller set of decorations for sections
export const SectionDecorations: React.FC<DecorationProps> = ({ className = '' }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <div 
        className="absolute top-8 right-[10%] w-4 h-4 bg-[hsl(25,95%,53%)] rotate-45 rounded-sm animate-v2-float-slow opacity-60"
      />
      <div 
        className="absolute bottom-12 left-[8%] w-3 h-3 bg-[hsl(30,100%,72%)] rounded-full animate-v2-float-medium opacity-50"
      />
      <div 
        className="absolute top-[50%] right-[5%] w-5 h-5 bg-[hsl(156,72%,80%)] rotate-45 rounded-sm animate-v2-float-slow opacity-40"
      />
    </div>
  );
};

export default FloatingDecorations;
