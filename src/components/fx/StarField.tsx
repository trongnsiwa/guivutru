import React, { useEffect, useRef } from 'react';

interface StarFieldProps {
  total?: number;
}

// 8 floats per star:
// 0: x ratio (0..1)
// 1: y ratio (0..1)
// 2: size (px)
// 3: twinkle duration (sec)
// 4: twinkle delay (sec)
// 5: layer (0 = far, 1 = mid, 2 = near)
// 6: color type (0 = white, 1 = warm #FFE9A8, 2 = cool #A5D8FF)
// 7: base opacity (0..1)
const STRIDE = 8;

interface ShootingStar {
  startX: number;
  startY: number;
  length: number;
  angle: number;
  duration: number;
  startTime: number;
}

function StarFieldComponent({ total = 140 }: StarFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Counts per layer
    const countFar = Math.round(total * 0.6); // 60%
    const countMid = Math.round(total * 0.3); // 30%
    const countNear = total - countFar - countMid; // 10%

    const starsData = new Float32Array(total * STRIDE);
    let idx = 0;

    // Helper to pick color: ~85% white, 8% warm, 7% cool
    const pickColor = () => {
      const r = Math.random();
      if (r < 0.85) return 0; // white
      if (r < 0.93) return 1; // warm #FFE9A8
      return 2; // cool #A5D8FF
    };

    // Layer 0: Far (60%, 0.6–1px)
    for (let i = 0; i < countFar; i++) {
      const offset = idx++ * STRIDE;
      starsData[offset] = Math.random();
      starsData[offset + 1] = Math.random();
      starsData[offset + 2] = 0.6 + Math.random() * 0.4; // 0.6-1.0px
      starsData[offset + 3] = 2.5 + Math.random() * 2;
      starsData[offset + 4] = Math.random() * 3;
      starsData[offset + 5] = 0; // layer 0 (far)
      starsData[offset + 6] = pickColor();
      starsData[offset + 7] = 0.2 + Math.random() * 0.3;
    }

    // Layer 1: Mid (30%, 1–1.5px)
    for (let i = 0; i < countMid; i++) {
      const offset = idx++ * STRIDE;
      starsData[offset] = Math.random();
      starsData[offset + 1] = Math.random();
      starsData[offset + 2] = 1.0 + Math.random() * 0.5; // 1.0-1.5px
      starsData[offset + 3] = 3 + Math.random() * 2;
      starsData[offset + 4] = Math.random() * 3;
      starsData[offset + 5] = 1; // layer 1 (mid)
      starsData[offset + 6] = pickColor();
      starsData[offset + 7] = 0.4 + Math.random() * 0.35;
    }

    // Layer 2: Near (10%, 1.5–2.5px)
    for (let i = 0; i < countNear; i++) {
      const offset = idx++ * STRIDE;
      starsData[offset] = Math.random();
      starsData[offset + 1] = Math.random();
      starsData[offset + 2] = 1.5 + Math.random() * 1.0; // 1.5-2.5px
      starsData[offset + 3] = 3.5 + Math.random() * 2;
      starsData[offset + 4] = Math.random() * 3;
      starsData[offset + 5] = 2; // layer 2 (near)
      starsData[offset + 6] = pickColor();
      starsData[offset + 7] = 0.6 + Math.random() * 0.4;
    }

    // Drift velocities (per frame normalized, differing directions to create depth)
    // Far layer: drift ~0.02px/frame
    const driftFarX = 0.000015;
    const driftFarY = -0.000012;
    // Mid layer: drift ~0.05px/frame
    const driftMidX = 0.000035;
    const driftMidY = -0.000028;
    // Near layer: drift ~0.12px/frame
    const driftNearX = 0.000075;
    const driftNearY = -0.000045;

    // Offscreen Nebula Canvas (painted once at low res, blitted each frame with slow drift)
    const nebulaCanvas = document.createElement('canvas');
    const nebulaCtx = nebulaCanvas.getContext('2d');
    const NEBULA_SIZE = 320;
    nebulaCanvas.width = NEBULA_SIZE;
    nebulaCanvas.height = NEBULA_SIZE;

    if (nebulaCtx) {
      // Soft lavender gradient (upper-left)
      const grad1 = nebulaCtx.createRadialGradient(
        NEBULA_SIZE * 0.3,
        NEBULA_SIZE * 0.3,
        0,
        NEBULA_SIZE * 0.3,
        NEBULA_SIZE * 0.3,
        NEBULA_SIZE * 0.55
      );
      grad1.addColorStop(0, 'rgba(167, 139, 250, 0.16)');
      grad1.addColorStop(0.5, 'rgba(139, 92, 246, 0.08)');
      grad1.addColorStop(1, 'rgba(139, 92, 246, 0)');
      nebulaCtx.fillStyle = grad1;
      nebulaCtx.fillRect(0, 0, NEBULA_SIZE, NEBULA_SIZE);

      // Soft pink/peach gradient (lower-right)
      const grad2 = nebulaCtx.createRadialGradient(
        NEBULA_SIZE * 0.72,
        NEBULA_SIZE * 0.72,
        0,
        NEBULA_SIZE * 0.72,
        NEBULA_SIZE * 0.72,
        NEBULA_SIZE * 0.5
      );
      grad2.addColorStop(0, 'rgba(255, 179, 209, 0.14)');
      grad2.addColorStop(0.5, 'rgba(255, 203, 164, 0.06)');
      grad2.addColorStop(1, 'rgba(255, 179, 209, 0)');
      nebulaCtx.fillStyle = grad2;
      nebulaCtx.fillRect(0, 0, NEBULA_SIZE, NEBULA_SIZE);
    }

    let animId = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;

    // Shooting stars state (1–3 per 60s)
    let nextShootingStarTime = performance.now() + 15000 + Math.random() * 20000;
    let activeShootingStar: ShootingStar | null = null;

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

    // Draw frame
    const drawFrame = (timeMs: number) => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Nebula (slow drift)
      if (nebulaCanvas.width > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 0.85;
        ctx.drawImage(
          nebulaCanvas,
          -40 + Math.sin(timeMs * 0.0001) * 30,
          -40 + Math.cos(timeMs * 0.0001) * 20,
          width * 1.1,
          height * 1.1
        );
        ctx.restore();
      }

      // 2. Stars: Colors
      const WHITE = '#FFFFFF';
      const WARM = '#FFE9A8';
      const COOL = '#A5D8FF';

      const timeSec = timeMs / 1000;

      for (let i = 0; i < total; i++) {
        const offset = i * STRIDE;

        // Update drift
        const layer = starsData[offset + 5];
        if (layer === 0) {
          starsData[offset] = (starsData[offset] + driftFarX) % 1;
          starsData[offset + 1] = (starsData[offset + 1] + driftFarY + 1) % 1;
        } else if (layer === 1) {
          starsData[offset] = (starsData[offset] + driftMidX) % 1;
          starsData[offset + 1] = (starsData[offset + 1] + driftMidY + 1) % 1;
        } else {
          starsData[offset] = (starsData[offset] + driftNearX) % 1;
          starsData[offset + 1] = (starsData[offset + 1] + driftNearY + 1) % 1;
        }

        const x = starsData[offset] * width;
        const y = starsData[offset + 1] * height;
        const size = starsData[offset + 2];
        const dur = starsData[offset + 3];
        const delay = starsData[offset + 4];
        const colorType = starsData[offset + 6];
        const baseOp = starsData[offset + 7];

        const phase = ((timeSec + delay) % dur) / dur;
        const sine = 0.5 + 0.5 * Math.sin(phase * Math.PI * 2);
        const op = baseOp * (0.6 + 0.4 * sine);

        ctx.fillStyle = colorType === 0 ? WHITE : colorType === 1 ? WARM : COOL;
        ctx.globalAlpha = Math.min(1, Math.max(0, op));

        // Subtle glow for near stars
        if (layer === 2) {
          ctx.save();
          ctx.shadowColor = 'rgba(230, 215, 255, 0.6)';
          ctx.shadowBlur = 4;
          ctx.beginPath();
          ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 3. Rare Shooting Stars (1–3 per 60s)
      if (!activeShootingStar && timeMs >= nextShootingStarTime) {
        // Spawn shooting star
        const angle = (Math.PI / 4) + (Math.random() - 0.5) * 0.3; // ~45 degrees diagonal
        activeShootingStar = {
          startX: Math.random() * width * 0.75,
          startY: Math.random() * height * 0.35,
          length: 70 + Math.random() * 50, // 70-120px
          angle,
          duration: 450 + Math.random() * 250, // 450-700ms
          startTime: timeMs,
        };
        nextShootingStarTime = timeMs + 20000 + Math.random() * 25000;
      }

      if (activeShootingStar) {
        const elapsed = timeMs - activeShootingStar.startTime;
        const progress = elapsed / activeShootingStar.duration;

        if (progress >= 1) {
          activeShootingStar = null;
        } else {
          const currentDist = progress * 300;
          const headX = activeShootingStar.startX + Math.cos(activeShootingStar.angle) * currentDist;
          const headY = activeShootingStar.startY + Math.sin(activeShootingStar.angle) * currentDist;
          const tailX = headX - Math.cos(activeShootingStar.angle) * activeShootingStar.length;
          const tailY = headY - Math.sin(activeShootingStar.angle) * activeShootingStar.length;

          const grad = ctx.createLinearGradient(tailX, tailY, headX, headY);
          const fade = Math.sin(progress * Math.PI); // fade in and out smoothly
          grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
          grad.addColorStop(0.7, `rgba(201, 182, 255, ${0.4 * fade})`);
          grad.addColorStop(1, `rgba(255, 255, 255, ${0.85 * fade})`);

          ctx.save();
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(headX, headY);
          ctx.stroke();
          ctx.restore();
        }
      }
    };

    const loop = (timeMs: number) => {
      drawFrame(timeMs);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    // Page Visibility API to pause when hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animId) {
          cancelAnimationFrame(animId);
          animId = 0;
        }
      } else if (!animId) {
        animId = requestAnimationFrame(loop);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [total]);

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
