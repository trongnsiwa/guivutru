import { useEffect, useState } from 'react';
import { shouldReduceMotion } from '@/lib/motion';

export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(shouldReduceMotion);

  useEffect(() => {
    // If dev override param is present, short-circuit (no listener needed)
    if (import.meta.env.DEV && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const motion = params.get('motion');
      if (motion === 'force' || motion === 'reduce') {
        setPrefersReducedMotion(shouldReduceMotion());
        return;
      }
    }

    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

export default useReducedMotion;
