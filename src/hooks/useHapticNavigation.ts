import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { hapticImpact, hapticSelection, ImpactStyle } from '@/lib/haptics';

export function useHapticNavigation() {
  const navigate = useNavigate();

  const hapticNavigate = useCallback((to: string) => {
    hapticImpact(ImpactStyle.Light);
    navigate(to);
  }, [navigate]);

  const hapticTap = useCallback(() => {
    hapticImpact(ImpactStyle.Light);
  }, []);

  const hapticPress = useCallback(() => {
    hapticImpact(ImpactStyle.Medium);
  }, []);

  const hapticSelect = useCallback(() => {
    hapticSelection();
  }, []);

  return { hapticNavigate, hapticTap, hapticPress, hapticSelect };
}
