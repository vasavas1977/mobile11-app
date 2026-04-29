import { useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Ordered translation modes for swipe navigation.
 * Show Mode and Settings are excluded intentionally.
 */
const MODE_ORDER = [
  '/translate2',
  '/translate2/conversation',
  '/translate2/phrases',
  '/translate2/type',
] as const;

const MIN_SWIPE_DISTANCE = 80; // px – intentional swipes only
const MAX_VERTICAL_RATIO = 0.6; // dy must be < 60% of dx
const SWIPE_TIMEOUT = 500; // ms – ignore slow drags

interface SwipeState {
  startX: number;
  startY: number;
  startTime: number;
}

interface UseSwipeModeNavigationOptions {
  /** Set to true when text input is focused or interaction should block swipe */
  disabled?: boolean;
}

export function useSwipeModeNavigation(opts: UseSwipeModeNavigationOptions = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const stateRef = useRef<SwipeState | null>(null);

  const currentIndex = MODE_ORDER.indexOf(location.pathname as any);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (opts.disabled) return;
      // Don't capture if target is inside a horizontally-scrollable container
      const target = e.target as HTMLElement;
      if (target.closest('[data-swipe-ignore]') || target.closest('input') || target.closest('textarea')) return;

      const touch = e.touches[0];
      stateRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
      };
    },
    [opts.disabled],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const state = stateRef.current;
      if (!state || opts.disabled) {
        stateRef.current = null;
        return;
      }

      const touch = e.changedTouches[0];
      const dx = touch.clientX - state.startX;
      const dy = touch.clientY - state.startY;
      const elapsed = Date.now() - state.startTime;
      stateRef.current = null;

      // Validate gesture
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      if (absDx < MIN_SWIPE_DISTANCE) return;
      if (absDy > absDx * MAX_VERTICAL_RATIO) return; // too vertical
      if (elapsed > SWIPE_TIMEOUT) return; // too slow

      if (currentIndex === -1) return; // not on a swipeable route

      const nextIndex = dx < 0 ? currentIndex + 1 : currentIndex - 1;
      if (nextIndex < 0 || nextIndex >= MODE_ORDER.length) return;

      navigate(MODE_ORDER[nextIndex], { replace: true });
    },
    [opts.disabled, currentIndex, navigate],
  );

  return {
    swipeHandlers: {
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
    },
    /** True if current route is part of the swipeable mode sequence */
    isSwipeable: currentIndex !== -1,
  };
}
