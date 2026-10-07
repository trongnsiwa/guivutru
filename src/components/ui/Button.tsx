import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'ghost' | 'pill' | 'icon';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: ButtonVariant;
  children?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', children, disabled, ...props }, ref) => {
    const variantsMap: Record<ButtonVariant, string> = {
      primary:
        'bg-lavender text-bg-deep font-semibold shadow-glow hover:brightness-110 active:brightness-95 rounded-md px-5 py-3',
      ghost:
        'bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-elevated/40 border border-border-soft rounded-md px-4 py-2.5',
      pill:
        'bg-gradient-to-r from-lavender via-pink to-lavender text-bg-deep font-bold rounded-pill px-6 py-3.5 shadow-glow hover:brightness-105 active:scale-95',
      icon:
        'p-2.5 rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-soft border border-border-soft transition-colors',
    };

    return (
      <motion.button
        ref={ref}
        whileHover={disabled ? undefined : { scale: 1.03 }}
        whileTap={disabled ? undefined : { scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center font-sans font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-lavender/40 disabled:opacity-40 disabled:pointer-events-none cursor-pointer',
          variantsMap[variant],
          className
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
