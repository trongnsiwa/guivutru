import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  baseOpacity: number;
  duration: number;
  delay: number;
  hasGlow: boolean;
  minOpacity: number;
  maxOpacity: number;
}

export function StarField({ total = 120 }: { total?: number }) {
  const prefersReducedMotion = useReducedMotion();

  const stars = useMemo<Star[]>(() => {
    const list: Star[] = [];
    const countLayer1 = Math.round(total * 0.6); // 60%
    const countLayer2 = Math.round(total * 0.3); // 30%
    const countLayer3 = total - countLayer1 - countLayer2; // 10%

    let id = 0;

    // Layer 1: 1px, opacity 0.3, twinkle 2s
    for (let i = 0; i < countLayer1; i++) {
      list.push({
        id: id++,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1,
        baseOpacity: 0.3,
        duration: 2,
        delay: Math.random() * 2, // Randomized phase
        hasGlow: false,
        minOpacity: 0.1,
        maxOpacity: 0.4,
      });
    }

    // Layer 2: 1.5px, opacity 0.6, twinkle 3s
    for (let i = 0; i < countLayer2; i++) {
      list.push({
        id: id++,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1.5,
        baseOpacity: 0.6,
        duration: 3,
        delay: Math.random() * 3, // Randomized phase
        hasGlow: false,
        minOpacity: 0.25,
        maxOpacity: 0.7,
      });
    }

    // Layer 3: 2px, opacity 0.9, box-shadow glow, twinkle 4s
    for (let i = 0; i < countLayer3; i++) {
      list.push({
        id: id++,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 2,
        baseOpacity: 0.9,
        duration: 4,
        delay: Math.random() * 4, // Randomized phase
        hasGlow: true,
        minOpacity: 0.4,
        maxOpacity: 1,
      });
    }

    return list;
  }, [total]);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-star"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            boxShadow: star.hasGlow ? '0 0 6px var(--star-glow)' : undefined,
          }}
          animate={
            prefersReducedMotion
              ? { opacity: star.baseOpacity }
              : {
                  opacity: [star.minOpacity, star.maxOpacity, star.minOpacity],
                  scale: star.hasGlow ? [0.9, 1.25, 0.9] : [0.9, 1.1, 0.9],
                }
          }
          transition={
            prefersReducedMotion
              ? undefined
              : {
                  duration: star.duration,
                  delay: star.delay,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
          }
        />
      ))}
    </div>
  );
}

export default StarField;
