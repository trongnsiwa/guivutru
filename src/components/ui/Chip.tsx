import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/cn';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface ChipProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  active?: boolean;
}

export function Chip({ active = false, className, children, ...props }: ChipProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25, duration: 0.2 }}
      className={cn(
        'px-4 py-2.5 rounded-pill text-sm font-sans border transition-colors cursor-pointer text-left',
        active
          ? 'bg-lavender/15 border-lavender text-text-primary shadow-glow ring-1 ring-lavender/40'
          : 'bg-bg-soft/70 border-border-soft text-text-secondary hover:text-text-primary hover:border-border-strong',
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
