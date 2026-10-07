import { useState, useEffect, useRef } from 'react';

interface Mote {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
}

const PASTEL_COLORS = [
  '#C9B6FF', // lavender
  '#FFB3D1', // pink
  '#A0F0DC', // mint
  '#FFCBA4', // peach
  '#A5D8FF', // sky
  '#FFF9E6', // star-glow
];

const MAX_MOTES = 6;
const THROTTLE_MS = 60;
const MOTE_LIFETIME_MS = 400;

export function CursorSparkles() {
  const [motes, setMotes] = useState<Mote[]>([]);
  const nextIdRef = useRef(0);
  const lastSpawnTimeRef = useRef(0);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Desktop only guard: skip touch devices
    if (typeof window === 'undefined') return;
    const isTouch =
      'ontouchstart' in window ||
      (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0);

    if (isTouch) return;

    // Skip effect entirely on /dev/share-card route
    if (window.location.pathname.startsWith('/dev/share-card')) {
      return;
    }

    const spawnMote = (x: number, y: number) => {
      const newMote: Mote = {
        id: ++nextIdRef.current,
        x,
        y,
        color: PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)],
        size: 3 + Math.random() * 3, // 3-6px
      };

      setMotes((prev) => {
        const next = prev.length >= MAX_MOTES ? prev.slice(prev.length - MAX_MOTES + 1) : prev;
        return [...next, newMote];
      });

      // Individual mote cleanup at 400ms
      setTimeout(() => {
        setMotes((prev) => prev.filter((m) => m.id !== newMote.id));
      }, MOTE_LIFETIME_MS);

      // Hard cap idle drain: if cursor stops moving, motes drain to 0 within 400ms
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      idleTimerRef.current = setTimeout(() => {
        setMotes([]);
      }, MOTE_LIFETIME_MS);
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Dynamic route guard in case of client route transitions
      if (window.location.pathname.startsWith('/dev/share-card')) {
        return;
      }

      // Suppress motes when hovering over modal backdrop, modal dialog, or ShareCard
      const target = e.target as HTMLElement | null;
      if (
        document.querySelector('.fixed.inset-0.z-50, [data-modal="true"]') ||
        target?.closest(
          '.fixed.inset-0.z-50, [role="dialog"], [data-modal], [data-share-card], .share-card'
        )
      ) {
        return;
      }

      const now = performance.now();
      // Throttle spawn to ~60ms
      if (now - lastSpawnTimeRef.current < THROTTLE_MS) return;
      lastSpawnTimeRef.current = now;

      // Viewport coordinates
      spawnMote(e.clientX, e.clientY);
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      data-testid="cursor-sparkles-container"
      className="pointer-events-none fixed inset-0 overflow-hidden z-20"
      aria-hidden="true"
    >
      {motes.map((mote) => (
        <span
          key={mote.id}
          className="absolute rounded-full animate-mote"
          style={{
            left: `${mote.x}px`,
            top: `${mote.y}px`,
            width: `${mote.size}px`,
            height: `${mote.size}px`,
            backgroundColor: mote.color,
            boxShadow: `0 0 6px ${mote.color}`,
          }}
        />
      ))}
    </div>
  );
}

export default CursorSparkles;
