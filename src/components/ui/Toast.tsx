import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface ToastProps {
  message: string | null;
  visible: boolean;
}

export function Toast({ message, visible }: ToastProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {visible && message && (
        <motion.div
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
          animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-pill border border-border-strong bg-bg-elevated px-4 py-2.5 text-sm text-text-primary shadow-glow"
        >
          <Sparkles className="h-4 w-4 text-star-glow" />
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
