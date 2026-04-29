import React from 'react';

export const ProfileDecorations: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Top right orange diamond */}
      <div 
        className="absolute top-20 right-[15%] w-6 h-6 bg-orange-500 rotate-45 rounded-sm opacity-60"
        style={{ animation: 'float 6s ease-in-out infinite' }}
      />
      
      {/* Top left peach circle */}
      <div 
        className="absolute top-32 left-[10%] w-5 h-5 bg-orange-300 rounded-full opacity-50"
        style={{ animation: 'float 5s ease-in-out infinite', animationDelay: '0.5s' }}
      />
      
      {/* Mid right mint diamond */}
      <div 
        className="absolute top-[40%] right-[8%] w-8 h-8 bg-emerald-300 rotate-45 rounded-sm opacity-40"
        style={{ animation: 'float 7s ease-in-out infinite', animationDelay: '1s' }}
      />
      
      {/* Bottom left sky blue diamond */}
      <div 
        className="absolute bottom-[30%] left-[5%] w-5 h-5 bg-sky-300 rotate-45 rounded-sm opacity-50"
        style={{ animation: 'float 5.5s ease-in-out infinite', animationDelay: '1.5s' }}
      />
      
      {/* Bottom right orange circle */}
      <div 
        className="absolute bottom-[20%] right-[12%] w-4 h-4 bg-orange-400 rounded-full opacity-40"
        style={{ animation: 'float 4.5s ease-in-out infinite', animationDelay: '2s' }}
      />
      
      {/* Center left green diamond */}
      <div 
        className="absolute top-[55%] left-[12%] w-4 h-4 bg-green-400 rotate-45 rounded-sm opacity-30"
        style={{ animation: 'float 6.5s ease-in-out infinite', animationDelay: '0.8s' }}
      />
      
      {/* Top center small peach diamond */}
      <div 
        className="absolute top-16 left-[40%] w-3 h-3 bg-orange-200 rotate-45 rounded-sm opacity-40"
        style={{ animation: 'float 5s ease-in-out infinite', animationDelay: '2.5s' }}
      />
      
      {/* Bottom center mint circle */}
      <div 
        className="absolute bottom-[15%] left-[35%] w-6 h-6 bg-emerald-200 rounded-full opacity-30"
        style={{ animation: 'float 7s ease-in-out infinite', animationDelay: '3s' }}
      />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(45deg); }
          50% { transform: translateY(-10px) rotate(45deg); }
        }
      `}</style>
    </div>
  );
};
