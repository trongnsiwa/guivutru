/**
 * Helper to determine whether animations should be reduced.
 * Single source of truth across the codebase.
 *
 * In DEV mode only: supports ?motion=force to ignore OS reduce-motion setting,
 * and ?motion=reduce to force reduced motion.
 */
export function shouldReduceMotion(): boolean {
  if (typeof window === 'undefined') return false;

  if (import.meta.env.DEV) {
    const params = new URLSearchParams(window.location.search);
    const motion = params.get('motion');
    if (motion === 'force') return false;
    if (motion === 'reduce') return true;
  }

  if (typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  return false;
}

export default shouldReduceMotion;
