import React from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

function FloatingBlobsComponent() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0 opacity-25" aria-hidden="true">
      <div
        style={{
          animation: prefersReducedMotion ? undefined : 'blob-float-1 18s ease-in-out infinite',
          willChange: prefersReducedMotion ? undefined : 'transform',
          transform: 'translate3d(0, 0, 0)',
        }}
        className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-lavender/20 blur-3xl"
      />
      <div
        style={{
          animation: prefersReducedMotion ? undefined : 'blob-float-2 22s ease-in-out infinite',
          willChange: prefersReducedMotion ? undefined : 'transform',
          transform: 'translate3d(0, 0, 0)',
        }}
        className="absolute top-1/2 -right-32 h-96 w-96 rounded-full bg-pink/15 blur-3xl"
      />
    </div>
  );
}

export const FloatingBlobs = React.memo(FloatingBlobsComponent);
export default FloatingBlobs;
