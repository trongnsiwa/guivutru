import React, { useState, useEffect, useRef } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface CursorSparklesProps {
  targetRef: React.RefObject<HTMLElement | null>;
}

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

const MAX_MOTES = 12;

export function CursorSparkles({ targetRef }: CursorSparklesProps) {
  const prefersReducedMotion = useReducedMotion();
  const [motes, setMotes] = useState<Mote[]>([]);
  const nextIdRef = useRef(0);
  const lastSpawnTimeRef = useRef(0);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 40, y: 60 });

  useEffect(() => {
    // Desktop only: check touch support
    if (typeof window === 'undefined') return;
    const isTouch =
      'ontouchstart' in window ||
      (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0);

    if (isTouch || prefersReducedMotion) return;

    const target = targetRef.current;
    if (!target) return;

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

      setTimeout(() => {
        setMotes((prev) => prev.filter((m) => m.id !== newMote.id));
      }, 400);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const targetEl = targetRef.current;
      if (!targetEl) return;
      const rect = targetEl.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      lastMousePosRef.current = { x, y };

      const now = performance.now();
      // Throttle spawn to once every 40ms (~25 motes/sec max if moving fast)
      if (now - lastSpawnTimeRef.current < 40) return;
      lastSpawnTimeRef.current = now;

      spawnMote(x, y);
    };

    const handleInput = () => {
      const now = performance.now();
      if (now - lastSpawnTimeRef.current < 30) return;
      lastSpawnTimeRef.current = now;

      const targetEl = targetRef.current;
      if (!targetEl) return;
      const textarea = targetEl.querySelector('textarea');
      let x = lastMousePosRef.current.x;
      let y = lastMousePosRef.current.y;

      if (textarea) {
        const rect = targetEl.getBoundingClientRect();
        const tRect = textarea.getBoundingClientRect();
        const pos = textarea.selectionStart || 0;
        const textBefore = textarea.value.slice(0, pos);
        const lines = textBefore.split('\n');
        const lineIndex = lines.length - 1;
        const currentLine = lines[lineIndex];

        const approxCharWidth = 12;
        const lineHeight = 36;
        const caretX = tRect.left - rect.left + Math.min(currentLine.length * approxCharWidth + 6, tRect.width - 24);
        const caretY = tRect.top - rect.top + lineIndex * lineHeight + 20;
        x = caretX + (Math.random() * 12 - 6);
        y = caretY + (Math.random() * 12 - 6);
      }

      spawnMote(x, y);
    };

    target.addEventListener('mousemove', handleMouseMove, { passive: true });
    target.addEventListener('input', handleInput, { passive: true });

    return () => {
      target.removeEventListener('mousemove', handleMouseMove);
      target.removeEventListener('input', handleInput);
    };
  }, [targetRef, prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden z-20"
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
