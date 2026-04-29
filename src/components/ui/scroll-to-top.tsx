import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const portalContainer = typeof document !== 'undefined' 
    ? document.getElementById('scroll-to-top-portal') 
    : null;

  if (!mounted || !portalContainer) return null;

  return createPortal(
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className={cn(
        'fixed bottom-28 left-1/2 -translate-x-1/2 z-[9997] h-10 w-10 rounded-full',
        'bg-white/80 backdrop-blur-md text-gray-500 border border-gray-200/50',
        'shadow-sm hover:bg-white hover:text-gray-700 hover:scale-105',
        'transition-all duration-300 ease-out',
        'flex items-center justify-center',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      )}
    >
      <ArrowUp className="h-4 w-4" />
    </button>,
    portalContainer
  );
}
