import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface StarFieldProps {
  total?: number;
}

const STRIDE = 8; // x, y, size, duration, delay, minOp, maxOp, hasGlow

function StarFieldComponent({ total = 120 }: StarFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Precompute star positions once into a Float32Array
    const starsData = new Float32Array(total * STRIDE);
    const countLayer1 = Math.round(total * 0.6); // 60%
    const countLayer2 = Math.round(total * 0.3); // 30%
    const countLayer3 = total - countLayer1 - countLayer2; // 10%

    let starIdx = 0;

    // Layer 1: 1px, opacity 0.3, twinkle 2s
    for (let i = 0; i < countLayer1; i++) {
      const offset = starIdx++ * STRIDE;
      starsData[offset] = Math.random(); // x ratio
      starsData[offset + 1] = Math.random(); // y ratio
      starsData[offset + 2] = 1; // size
      starsData[offset + 3] = 2; // duration
      starsData[offset + 4] = Math.random() * 2; // delay
      starsData[offset + 5] = 0.1; // minOp
      starsData[offset + 6] = 0.4; // maxOp
      starsData[offset + 7] = 0; // hasGlow: false
    }

    // Layer 2: 1.5px, opacity 0.6, twinkle 3s
    for (let i = 0; i < countLayer2; i++) {
      const offset = starIdx++ * STRIDE;
      starsData[offset] = Math.random();
      starsData[offset + 1] = Math.random();
      starsData[offset + 2] = 1.5;
      starsData[offset + 3] = 3;
      starsData[offset + 4] = Math.random() * 3;
      starsData[offset + 5] = 0.25;
      starsData[offset + 6] = 0.7;
      starsData[offset + 7] = 0;
    }

    // Layer 3: 2px, opacity 0.9, glow, twinkle 4s
    for (let i = 0; i < countLayer3; i++) {
      const offset = starIdx++ * STRIDE;
      starsData[offset] = Math.random();
      starsData[offset + 1] = Math.random();
      starsData[offset + 2] = 2;
      starsData[offset + 3] = 4;
      starsData[offset + 4] = Math.random() * 4;
      starsData[offset + 5] = 0.4;
      starsData[offset + 6] = 1.0;
      starsData[offset + 7] = 1; // hasGlow: true
    }

    let animId = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    const drawFrame = (timeMs: number) => {
      ctx.clearRect(0, 0, width, height);
      const timeSec = timeMs / 1000;

      // Group 1: Non-glowing stars
      ctx.fillStyle = '#E6D7FF';
      for (let i = 0; i < total; i++) {
        const offset = i * STRIDE;
        if (starsData[offset + 7] > 0.5) continue; // Skip glow stars

        const x = starsData[offset] * width;
        const y = starsData[offset + 1] * height;
        const size = starsData[offset + 2];
        const dur = starsData[offset + 3];
        const delay = starsData[offset + 4];
        const minOp = starsData[offset + 5];
        const maxOp = starsData[offset + 6];

        let op: number;
        if (prefersReducedMotion) {
          op = (minOp + maxOp) * 0.5;
        } else {
          const phase = ((timeSec + delay) % dur) / dur;
          const sine = 0.5 + 0.5 * Math.sin(phase * Math.PI * 2);
          op = minOp + (maxOp - minOp) * sine;
        }

        ctx.globalAlpha = op;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Group 2: Glowing stars (Layer 3)
      for (let i = 0; i < total; i++) {
        const offset = i * STRIDE;
        if (starsData[offset + 7] <= 0.5) continue;

        const x = starsData[offset] * width;
        const y = starsData[offset + 1] * height;
        const size = starsData[offset + 2];
        const dur = starsData[offset + 3];
        const delay = starsData[offset + 4];
        const minOp = starsData[offset + 5];
        const maxOp = starsData[offset + 6];

        let op: number;
        if (prefersReducedMotion) {
          op = (minOp + maxOp) * 0.5;
        } else {
          const phase = ((timeSec + delay) % dur) / dur;
          const sine = 0.5 + 0.5 * Math.sin(phase * Math.PI * 2);
          op = minOp + (maxOp - minOp) * sine;
        }

        ctx.save();
        ctx.shadowColor = 'rgba(230, 215, 255, 0.7)';
        ctx.shadowBlur = 6;
        ctx.globalAlpha = op;
        ctx.fillStyle = '#E6D7FF';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };

    const loop = (timeMs: number) => {
      drawFrame(timeMs);
      animId = requestAnimationFrame(loop);
    };

    if (prefersReducedMotion) {
      drawFrame(0);
    } else {
      animId = requestAnimationFrame(loop);
    }

    // Page Visibility API to pause loop when backgrounded
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animId) {
          cancelAnimationFrame(animId);
          animId = 0;
        }
      } else if (!prefersReducedMotion && !animId) {
        animId = requestAnimationFrame(loop);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [total, prefersReducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 overflow-hidden z-0"
      aria-hidden="true"
    />
  );
}

export const StarField = React.memo(StarFieldComponent);
export default StarField;
