import React from 'react';

const ValuesDecorations: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Top left yellow rounded rectangle */}
      <div 
        className="absolute -top-8 -left-12 w-32 h-48 bg-yellow-300/40 rounded-3xl rotate-12 animate-float-slow"
        style={{ animationDelay: '0s' }}
      />
      
      {/* Top right coral diamond */}
      <div 
        className="absolute top-20 -right-8 w-24 h-24 bg-orange-400/30 rotate-45 animate-float-medium"
        style={{ animationDelay: '1s' }}
      />
      
      {/* Middle left mint diamond */}
      <div 
        className="absolute top-1/3 -left-6 w-16 h-16 bg-teal-300/30 rotate-45 animate-float-fast"
        style={{ animationDelay: '0.5s' }}
      />
      
      {/* Middle right yellow shape */}
      <div 
        className="absolute top-1/2 -right-16 w-40 h-28 bg-yellow-200/40 rounded-2xl -rotate-12 animate-float-slow"
        style={{ animationDelay: '1.5s' }}
      />
      
      {/* Bottom left orange diamond */}
      <div 
        className="absolute bottom-1/4 -left-10 w-20 h-20 bg-orange-300/30 rotate-45 animate-float-medium"
        style={{ animationDelay: '2s' }}
      />
      
      {/* Bottom right mint circle */}
      <div 
        className="absolute bottom-32 right-12 w-12 h-12 bg-teal-200/40 rounded-full animate-float-fast"
        style={{ animationDelay: '0.8s' }}
      />
      
      {/* Bottom center yellow diamond */}
      <div 
        className="absolute bottom-16 left-1/3 w-14 h-14 bg-yellow-300/30 rotate-45 animate-float-slow"
        style={{ animationDelay: '1.2s' }}
      />
      
      {/* Additional decorations for visual balance */}
      <div 
        className="absolute top-40 left-1/4 w-8 h-8 bg-orange-200/40 rounded-full animate-float-medium"
        style={{ animationDelay: '2.5s' }}
      />
      
      <div 
        className="absolute bottom-1/3 right-1/4 w-10 h-10 bg-teal-300/25 rotate-45 animate-float-fast"
        style={{ animationDelay: '0.3s' }}
      />
    </div>
  );
};

export default ValuesDecorations;
