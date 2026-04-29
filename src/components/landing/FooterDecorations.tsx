import React from 'react';

export const FooterDecorations: React.FC = () => {
  return (
    <>
      {/* Decorative diamonds - positioned in corners */}
      <div className="absolute top-8 left-8 w-6 h-6 rotate-45 bg-orange-200/40 hidden lg:block" />
      <div className="absolute top-16 right-12 w-4 h-4 rotate-45 bg-orange-300/30 hidden lg:block" />
      <div className="absolute top-32 left-16 w-5 h-5 rotate-45 bg-amber-200/50 hidden lg:block" />
      <div className="absolute top-24 right-24 w-3 h-3 rotate-45 bg-orange-200/35 hidden lg:block" />
    </>
  );
};

export default FooterDecorations;
