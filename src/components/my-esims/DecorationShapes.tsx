export function DecorationShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Orange diamond - top right */}
      <div 
        className="absolute top-20 right-[10%] w-8 h-8 bg-orange-300/60 rotate-45 rounded-sm"
        style={{ transform: 'rotate(45deg)' }}
      />
      
      {/* Mint/teal diamond - top left area */}
      <div 
        className="absolute top-32 left-[15%] w-6 h-6 bg-teal-300/50 rotate-45 rounded-sm"
        style={{ transform: 'rotate(45deg)' }}
      />
      
      {/* Yellow pill - bottom left */}
      <div 
        className="absolute bottom-40 left-[8%] w-4 h-10 bg-yellow-300/50 rounded-full"
        style={{ transform: 'rotate(-15deg)' }}
      />
      
      {/* Small orange dot - middle right */}
      <div 
        className="absolute top-1/2 right-[5%] w-4 h-4 bg-orange-400/40 rounded-full"
      />
      
      {/* Light teal diamond - bottom right */}
      <div 
        className="absolute bottom-24 right-[20%] w-5 h-5 bg-emerald-200/60 rotate-45 rounded-sm hidden md:block"
        style={{ transform: 'rotate(45deg)' }}
      />
    </div>
  );
}
