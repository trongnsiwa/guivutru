import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface MeteorShowerProps {
  onComplete: () => void;
}

export function MeteorShower({ onComplete }: MeteorShowerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      onComplete();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    const startTime = performance.now();
    const TOTAL_DURATION = 3200; // ms

    // Generate 8 meteors crossing diagonally
    const meteors = Array.from({ length: 8 }, (_, i) => {
      const angle = (35 * Math.PI) / 180;
      const speed = 1.3 + Math.random() * 0.7; // px/ms
      return {
        id: i,
        // Start from top-right quadrant
        startX: width * (0.35 + Math.random() * 0.8),
        startY: -40 - Math.random() * 120,
        delay: i * 260 + Math.random() * 120,
        length: 140 + Math.random() * 90,
        speed,
        vx: -Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: i % 2 === 0 ? '#fff9e6' : '#c9b6ff',
      };
    });

    const render = (now: number) => {
      const elapsed = now - startTime;
      if (elapsed > TOTAL_DURATION) {
        onComplete();
        return;
      }

      ctx.clearRect(0, 0, width, height);

      for (const m of meteors) {
        const meteorElapsed = elapsed - m.delay;
        if (meteorElapsed < 0) continue;

        const duration = 950;
        const life = meteorElapsed / duration;
        if (life > 1) continue;

        const curX = m.startX + m.vx * meteorElapsed;
        const curY = m.startY + m.vy * meteorElapsed;

        const tailDist = Math.min(meteorElapsed * m.speed, m.length);
        const tailX = curX - (m.vx / m.speed) * tailDist;
        const tailY = curY - (m.vy / m.speed) * tailDist;

        const alpha = life < 0.15 ? life / 0.15 : (1 - life) / 0.85;

        const grad = ctx.createLinearGradient(tailX, tailY, curX, curY);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        grad.addColorStop(0.6, m.color);
        grad.addColorStop(1, '#ffffff');

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(curX, curY);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.stroke();

        // Glowing star head
        ctx.beginPath();
        ctx.arc(curX, curY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = m.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [onComplete, prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      aria-hidden="true"
    />
  );
}

export default MeteorShower;
