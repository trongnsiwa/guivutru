import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export function FloatingBlobs() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0 opacity-25">
      <motion.div
        animate={
          prefersReducedMotion
            ? undefined
            : {
                x: [0, 30, -20, 0],
                y: [0, -40, 20, 0],
              }
        }
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-lavender/20 blur-3xl"
      />
      <motion.div
        animate={
          prefersReducedMotion
            ? undefined
            : {
                x: [0, -40, 25, 0],
                y: [0, 30, -30, 0],
              }
        }
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 -right-32 h-96 w-96 rounded-full bg-pink/15 blur-3xl"
      />
    </div>
  );
}
